import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Application from '../models/Application';
import Loan from '../models/Loan';
import Payment from '../models/Payment';

// ─── SALES ────────────────────────────────────────────────────────────────────

export const getLeads = async (_req: Request, res: Response): Promise<void> => {
  const borrowers = await User.find({ role: 'borrower' }).select('name email createdAt');

  const borrowerIds = borrowers.map((b) => b._id);
  const applications = await Application.find({ userId: { $in: borrowerIds } }).select('userId');
  const appliedSet = new Set(applications.map((a) => a.userId.toString()));

  const leads = borrowers.filter((b) => !appliedSet.has(b._id.toString()));

  res.status(200).json({ success: true, data: { leads } });
};

// ─── SANCTION ─────────────────────────────────────────────────────────────────

export const getPendingLoans = async (_req: Request, res: Response): Promise<void> => {
  const loans = await Loan.find({ status: 'pending' })
    .populate('userId', 'name email')
    .populate('applicationId', 'fullName pan dateOfBirth monthlySalary employmentMode breStatus')
    .select('amount tenureDays simpleInterest totalRepayment status createdAt');

  res.status(200).json({ success: true, data: { loans } });
};

export const approveLoan = async (req: Request, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.loanId);
  if (!loan) {
    res.status(404).json({ success: false, message: 'Loan not found.' });
    return;
  }
  if (loan.status !== 'pending') {
    res.status(409).json({ success: false, message: `Loan is already '${loan.status}' and cannot be approved.` });
    return;
  }

  loan.status = 'sanctioned';
  loan.sanctionedAt = new Date();
  await loan.save();

  res.status(200).json({ success: true, data: { loan } });
};

export const rejectLoan = async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ rejectionReason: z.string().min(1, 'Rejection reason is required.') });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.flatten().fieldErrors });
    return;
  }

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) {
    res.status(404).json({ success: false, message: 'Loan not found.' });
    return;
  }
  if (loan.status !== 'pending') {
    res.status(409).json({ success: false, message: `Loan is already '${loan.status}' and cannot be rejected.` });
    return;
  }

  loan.status = 'rejected';
  loan.rejectionReason = result.data.rejectionReason;
  await loan.save();

  res.status(200).json({ success: true, data: { loan } });
};

// ─── DISBURSEMENT ─────────────────────────────────────────────────────────────

export const getSanctionedLoans = async (_req: Request, res: Response): Promise<void> => {
  const loans = await Loan.find({ status: 'sanctioned' })
    .populate('userId', 'name email')
    .select('amount tenureDays totalRepayment sanctionedAt status');

  res.status(200).json({ success: true, data: { loans } });
};

export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.loanId);
  if (!loan) {
    res.status(404).json({ success: false, message: 'Loan not found.' });
    return;
  }
  if (loan.status !== 'sanctioned') {
    res.status(409).json({ success: false, message: `Loan is '${loan.status}' and cannot be disbursed.` });
    return;
  }

  loan.status = 'disbursed';
  loan.disbursedAt = new Date();
  await loan.save();

  res.status(200).json({ success: true, data: { loan } });
};

// ─── COLLECTION ───────────────────────────────────────────────────────────────

export const getDisbursedLoans = async (_req: Request, res: Response): Promise<void> => {
  const loans = await Loan.find({ status: 'disbursed' })
    .populate('userId', 'name email')
    .select('amount tenureDays totalRepayment totalPaid disbursedAt status createdAt');

  const result = loans.map((loan) => ({
    ...loan.toObject(),
    outstandingBalance: parseFloat((loan.totalRepayment - loan.totalPaid).toFixed(2)),
  }));

  res.status(200).json({ success: true, data: { loans: result } });
};

const paymentSchema = z.object({
  utrNumber: z.string().min(1, 'UTR number is required.'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0.'),
  paymentDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid payment date.' }),
});

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  const result = paymentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.flatten().fieldErrors });
    return;
  }

  const { utrNumber, amount, paymentDate } = result.data;

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) {
    res.status(404).json({ success: false, message: 'Loan not found.' });
    return;
  }
  if (loan.status !== 'disbursed') {
    res.status(409).json({ success: false, message: `Loan is '${loan.status}'. Payments can only be recorded against disbursed loans.` });
    return;
  }

  const paymentDateOnly = paymentDate.slice(0, 10);
  const loanCreatedDateOnly = loan.createdAt!.toISOString().slice(0, 10);
  const todayOnly = new Date().toISOString().slice(0, 10);

  if (paymentDateOnly < loanCreatedDateOnly) {
    res.status(400).json({ success: false, message: 'Payment date cannot be before the loan application date.' });
    return;
  }
  if (paymentDateOnly > todayOnly) {
    res.status(400).json({ success: false, message: 'Payment date cannot be a future date.' });
    return;
  }

  const utrExists = await Payment.findOne({ utrNumber });
  if (utrExists) {
    res.status(409).json({ success: false, message: 'A payment with this UTR number already exists.' });
    return;
  }

  const outstanding = parseFloat((loan.totalRepayment - loan.totalPaid).toFixed(2));
  if (amount > outstanding) {
    res.status(400).json({
      success: false,
      message: `Payment amount cannot exceed the outstanding balance of ₹${outstanding}.`,
    });
    return;
  }

  const payment = await Payment.create({
    loanId: loan._id,
    utrNumber,
    amount,
    paymentDate: new Date(paymentDate),
    recordedBy: req.user!.userId,
  });

  loan.totalPaid = parseFloat((loan.totalPaid + amount).toFixed(2));
  if (loan.totalPaid >= loan.totalRepayment) {
    loan.status = 'closed';
    loan.closedAt = new Date();
  }
  await loan.save();

  res.status(201).json({
    success: true,
    data: {
      payment,
      loan: {
        _id: loan._id,
        status: loan.status,
        totalPaid: loan.totalPaid,
        totalRepayment: loan.totalRepayment,
        outstandingBalance: parseFloat((loan.totalRepayment - loan.totalPaid).toFixed(2)),
        closedAt: loan.closedAt,
      },
    },
  });
};

export const getLoanPayments = async (req: Request, res: Response): Promise<void> => {
  const payments = await Payment.find({ loanId: req.params.loanId })
    .populate('recordedBy', 'name')
    .select('utrNumber amount paymentDate recordedBy createdAt');

  res.status(200).json({ success: true, data: { payments } });
};
