import { Request, Response } from 'express';
import { z } from 'zod';
import Application from '../models/Application';
import Document from '../models/Document';
import Loan from '../models/Loan';
import { runBRE } from '../utils/bre';
import { calculateSimpleInterest } from '../utils/interest';

const personalSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  pan: z.string().min(1, 'PAN is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  monthlySalary: z.coerce.number().positive('Monthly salary must be a positive number'),
  employmentMode: z.enum(['Salaried', 'Self-Employed', 'Unemployed'], {
    errorMap: () => ({ message: 'Employment mode must be Salaried, Self-Employed, or Unemployed' }),
  }),
});

const loanSchema = z.object({
  amount: z.coerce
    .number()
    .min(50000, 'Amount must be at least ₹50,000')
    .max(500000, 'Amount must not exceed ₹5,00,000'),
  tenureDays: z.coerce
    .number()
    .int()
    .min(30, 'Tenure must be at least 30 days')
    .max(365, 'Tenure must not exceed 365 days'),
});

export const submitPersonalDetails = async (req: Request, res: Response): Promise<void> => {
  const result = personalSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten().fieldErrors });
    return;
  }

  const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = result.data;
  const userId = req.user!.userId;

  const existing = await Application.findOne({ userId });
  if (existing) {
    res.status(409).json({ message: 'An application already exists for this account.' });
    return;
  }

  const bre = runBRE({
    dateOfBirth: new Date(dateOfBirth),
    monthlySalary,
    employmentMode,
    pan,
  });

  const application = await Application.create({
    userId,
    fullName,
    pan,
    dateOfBirth: new Date(dateOfBirth),
    monthlySalary,
    employmentMode,
    breStatus: bre.passed ? 'passed' : 'failed',
    breRejectionReason: bre.rejectionReason,
  });

  if (!bre.passed) {
    res.status(422).json({
      message: 'Application saved but BRE check failed.',
      breStatus: 'failed',
      rejectionReason: bre.rejectionReason,
      applicationId: application._id,
    });
    return;
  }

  res.status(201).json({
    message: 'Personal details submitted successfully.',
    breStatus: 'passed',
    application,
  });
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const application = await Application.findOne({ userId });
  if (!application) {
    res.status(404).json({ message: 'No application found. Please complete personal details first.' });
    return;
  }
  if (application.breStatus !== 'passed') {
    res.status(403).json({ message: 'BRE check did not pass. You cannot upload documents.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded.' });
    return;
  }

  const doc = await Document.create({
    applicationId: application._id,
    filePath: req.file.path,
    fileType: req.file.mimetype,
  });

  res.status(201).json({
    message: 'Document uploaded successfully.',
    document: doc,
  });
};

export const submitLoan = async (req: Request, res: Response): Promise<void> => {
  const result = loanSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten().fieldErrors });
    return;
  }

  const { amount, tenureDays } = result.data;
  const userId = req.user!.userId;

  const application = await Application.findOne({ userId });
  if (!application || application.breStatus !== 'passed') {
    res.status(403).json({ message: 'A passed BRE application is required before applying for a loan.' });
    return;
  }

  const docExists = await Document.findOne({ applicationId: application._id });
  if (!docExists) {
    res.status(403).json({ message: 'A salary slip upload is required before applying for a loan.' });
    return;
  }

  const existingLoan = await Loan.findOne({ userId });
  if (existingLoan) {
    res.status(409).json({ message: 'A loan application already exists for this account.' });
    return;
  }

  const { simpleInterest, totalRepayment } = calculateSimpleInterest(amount, tenureDays);

  const loan = await Loan.create({
    applicationId: application._id,
    userId,
    amount,
    tenureDays,
    interestRate: 12,
    simpleInterest,
    totalRepayment,
  });

  res.status(201).json({
    message: 'Loan application submitted successfully.',
    loan,
  });
};

export const getMyLoan = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const loan = await Loan.findOne({ userId }).select(
    'status amount tenureDays simpleInterest totalRepayment totalPaid rejectionReason sanctionedAt disbursedAt closedAt createdAt'
  );

  if (!loan) {
    res.status(200).json({ message: 'No loan application found yet.', loan: null });
    return;
  }

  res.status(200).json({ loan });
};
