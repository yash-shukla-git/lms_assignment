'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { ApiSuccess } from '@/types';

interface ApplicationDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: string;
  breStatus: string;
}

interface PendingLoan {
  _id: string;
  amount: number;
  tenureDays: number;
  simpleInterest: number;
  totalRepayment: number;
  status: string;
  createdAt: string;
  userId: { name: string; email: string };
  applicationId: ApplicationDetails;
}

const INR = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function SanctionPage() {
  const [loans, setLoans] = useState<PendingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    void fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ApiSuccess<{ loans: PendingLoan[] }>>('/dashboard/sanction/applications');
      setLoans(data.data.loans);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleApprove = async (loanId: string) => {
    setProcessing(loanId);
    setError('');
    try {
      await api.patch(`/dashboard/sanction/applications/${loanId}/approve`);
      setLoans((prev) => prev.filter((l) => l._id !== loanId));
      showSuccess('Loan approved successfully.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Approval failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectForm = (loanId: string) => {
    setRejectingId(loanId);
    setRejectionReason('');
    setRejectError('');
  };

  const handleReject = async (e: FormEvent, loanId: string) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Rejection reason is required.');
      return;
    }
    setProcessing(loanId);
    setRejectError('');
    try {
      await api.patch(`/dashboard/sanction/applications/${loanId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setLoans((prev) => prev.filter((l) => l._id !== loanId));
      setRejectingId(null);
      showSuccess('Loan rejected.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setRejectError(axiosErr.response?.data?.message ?? 'Rejection failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Sanction — Pending Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve or reject loan applications.</p>
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
          <p className="text-base font-medium">No pending applications</p>
          <p className="text-sm mt-1">All applications have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{loan.userId.name}</p>
                  <p className="text-sm text-gray-500">{loan.userId.email}</p>
                </div>
                <span className="text-xs text-gray-400">Applied {fmtDate(loan.createdAt)}</span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {/* Application details */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Applicant Details
                  </p>
                  {[
                    ['Full Name', loan.applicationId.fullName],
                    ['PAN', loan.applicationId.pan],
                    ['Date of Birth', fmtDate(loan.applicationId.dateOfBirth)],
                    ['Monthly Salary', INR(loan.applicationId.monthlySalary)],
                    ['Employment Mode', loan.applicationId.employmentMode],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Loan details */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Loan Details
                  </p>
                  {[
                    ['Amount', INR(loan.amount)],
                    ['Tenure', `${loan.tenureDays} days`],
                    ['Interest Rate', '12% p.a.'],
                    ['Simple Interest', INR(loan.simpleInterest)],
                    ['Total Repayment', INR(loan.totalRepayment)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleApprove(loan._id)}
                    disabled={processing === loan._id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {processing === loan._id ? 'Processing…' : 'Approve'}
                  </button>
                  <button
                    onClick={() =>
                      rejectingId === loan._id ? setRejectingId(null) : openRejectForm(loan._id)
                    }
                    disabled={processing === loan._id}
                    className="px-4 py-2 bg-white hover:bg-red-50 border border-red-300 text-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>

                {/* Inline reject form */}
                {rejectingId === loan._id && (
                  <form onSubmit={(e) => void handleReject(e, loan._id)} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection…"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    </div>
                    {rejectError && (
                      <p className="text-sm text-red-600">{rejectError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={processing === loan._id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {processing === loan._id ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {success}
        </div>
      )}
    </div>
  );
}
