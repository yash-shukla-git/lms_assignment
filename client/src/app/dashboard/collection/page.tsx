'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { ApiSuccess } from '@/types';

type LoanStatus = 'disbursed' | 'closed';

interface DisbursedLoan {
  _id: string;
  amount: number;
  tenureDays: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  disbursedAt: string;
  status: LoanStatus;
  userId: { name: string; email: string };
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: { name: string };
}

const INR = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_BADGE: Record<LoanStatus, string> = {
  disbursed: 'bg-purple-100 text-purple-800 border-purple-200',
  closed: 'bg-green-100 text-green-800 border-green-200',
};

export default function CollectionPage() {
  const [loans, setLoans] = useState<DisbursedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment form state
  const [payFormId, setPayFormId] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Payment history state
  const [viewId, setViewId] = useState<string | null>(null);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    void fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ApiSuccess<{ loans: DisbursedLoan[] }>>('/dashboard/collection/loans');
      setLoans(data.data.loans);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Failed to load loans.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const openPayForm = (loanId: string) => {
    if (payFormId === loanId) {
      setPayFormId(null);
      return;
    }
    setPayFormId(loanId);
    setUtr('');
    setPayAmount('');
    setPayDate('');
    setFormError('');
  };

  const handlePayment = async (e: FormEvent, loanId: string) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post(`/dashboard/collection/loans/${loanId}/payment`, {
        utrNumber: utr.trim(),
        amount: Number(payAmount),
        paymentDate: payDate,
      });
      setPayFormId(null);
      showSuccess('Payment recorded successfully.');
      await fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setFormError(axiosErr.response?.data?.message ?? 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePayments = async (loanId: string) => {
    if (viewId === loanId) {
      setViewId(null);
      return;
    }
    setViewId(loanId);
    if (paymentsMap[loanId]) return;
    setPaymentsLoading(true);
    try {
      const { data } = await api.get<ApiSuccess<{ payments: Payment[] }>>(
        `/dashboard/collection/loans/${loanId}/payments`,
      );
      setPaymentsMap((prev) => ({ ...prev, [loanId]: data.data.payments }));
    } catch {
      setPaymentsMap((prev) => ({ ...prev, [loanId]: [] }));
    } finally {
      setPaymentsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Collection — Active Loans</h1>
        <p className="text-sm text-gray-500 mt-0.5">Record payments and track repayment progress.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-base font-medium">No active loans</p>
          <p className="text-sm mt-1">Disbursed loans will appear here once available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{loan.userId.name}</p>
                  <p className="text-sm text-gray-500">{loan.userId.email}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[loan.status]}`}
                >
                  {loan.status}
                </span>
              </div>

              {/* Financials */}
              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Loan Amount', INR(loan.amount)],
                  ['Total Repayment', INR(loan.totalRepayment)],
                  ['Total Paid', INR(loan.totalPaid)],
                  ['Outstanding', INR(Math.max(0, loan.outstandingBalance))],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Repayment progress bar */}
              <div className="px-5 pb-4">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {((loan.totalPaid / loan.totalRepayment) * 100).toFixed(1)}% repaid
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2">
                <button
                  onClick={() => openPayForm(loan._id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {payFormId === loan._id ? 'Cancel' : 'Record Payment'}
                </button>
                <button
                  onClick={() => void togglePayments(loan._id)}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  {viewId === loan._id ? 'Hide Payments' : 'View Payments'}
                </button>
              </div>

              {/* Inline payment form */}
              {payFormId === loan._id && (
                <div className="px-5 py-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Record a Payment</p>
                  <form onSubmit={(e) => void handlePayment(e, loan._id)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">UTR Number</label>
                        <input
                          type="text"
                          required
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="UTR12345678"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="10000"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
                        <input
                          type="date"
                          required
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {formError && (
                      <p className="text-sm text-red-600">{formError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {submitting ? 'Recording…' : 'Submit Payment'}
                    </button>
                  </form>
                </div>
              )}

              {/* Payment history */}
              {viewId === loan._id && (
                <div className="border-t border-gray-100">
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Payment History</p>
                    {paymentsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      </div>
                    ) : !paymentsMap[loan._id] || paymentsMap[loan._id].length === 0 ? (
                      <p className="text-sm text-gray-500">No payments recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase">UTR</th>
                              <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                              <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                              <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase">Recorded By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {paymentsMap[loan._id].map((p) => (
                              <tr key={p._id}>
                                <td className="py-2 font-mono text-xs text-gray-700">{p.utrNumber}</td>
                                <td className="py-2 font-medium text-gray-900">{INR(p.amount)}</td>
                                <td className="py-2 text-gray-600">{fmtDate(p.paymentDate)}</td>
                                <td className="py-2 text-gray-600">{p.recordedBy.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {success && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {success}
        </div>
      )}
    </div>
  );
}
