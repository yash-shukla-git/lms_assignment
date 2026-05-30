'use client';

import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import api from '@/lib/api';

interface SanctionedLoan {
  _id: string;
  amount: number;
  tenureDays: number;
  totalRepayment: number;
  sanctionedAt: string;
  status: string;
  userId: { name: string; email: string };
}

const INR = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function DisbursementPage() {
  const [loans, setLoans] = useState<SanctionedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    void fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ loans: SanctionedLoan[] }>('/dashboard/disbursement/loans');
      setLoans(data.loans);
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

  const handleDisburse = async (loanId: string) => {
    setProcessing(loanId);
    setError('');
    try {
      await api.patch(`/dashboard/disbursement/loans/${loanId}/disburse`);
      setLoans((prev) => prev.filter((l) => l._id !== loanId));
      showSuccess('Loan disbursed successfully.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Disbursement failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Disbursement — Sanctioned Loans</h1>
        <p className="text-sm text-gray-500 mt-0.5">Release funds for approved loans.</p>
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
          <p className="text-base font-medium">No sanctioned loans pending disbursement</p>
          <p className="text-sm mt-1">Check back after the sanction team approves applications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{loan.userId.name}</p>
                  <p className="text-sm text-gray-500">{loan.userId.email}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Sanctioned
                </span>
              </div>

              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Loan Amount', INR(loan.amount)],
                  ['Tenure', `${loan.tenureDays} days`],
                  ['Total Repayment', INR(loan.totalRepayment)],
                  ['Sanctioned On', fmtDate(loan.sanctionedAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => void handleDisburse(loan._id)}
                  disabled={processing === loan._id}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {processing === loan._id ? 'Disbursing…' : 'Disburse'}
                </button>
              </div>
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
