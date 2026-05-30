'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { calculateSimpleInterest } from '@/lib/interest';
import type { AuthUser } from '@/types';

type LoanStatus = 'pending' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

interface Loan {
  _id: string;
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
}

type BREErrorData = {
  message?: string;
  breStatus?: string;
  rejectionReason?: string;
};

const INR = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const STATUS_BADGE: Record<LoanStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sanctioned: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  disbursed: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
};

const STEP_LABELS = ['Welcome', 'Personal Details', 'Upload Document', 'Loan Details'];

export default function ApplyPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [step, setStep] = useState(0);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [salary, setSalary] = useState('');
  const [empMode, setEmpMode] = useState('Salaried');
  const [breRejected, setBreRejected] = useState(false);
  const [breReason, setBreReason] = useState('');

  // Step 3
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  // Step 4
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(90);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        // ignore malformed stored data
      }
    }
    void loadLoan();
  }, []);

  const loadLoan = async () => {
    try {
      const { data } = await api.get<{ loan: Loan | null }>('/borrower/loan');
      if (data.loan) {
        setLoan(data.loan);
        setStep(5);
      } else {
        setStep(1);
      }
    } catch {
      setStep(1);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('role');
    localStorage.clear();
    router.push('/login');
  };

  const clearError = () => setError('');

  // ── Step 2 submit ──────────────────────────────────────────────────────────

  const handlePersonalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await api.post('/borrower/apply/personal', {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth: dob,
        monthlySalary: Number(salary),
        employmentMode: empMode,
      });
      setStep(3);
    } catch (err) {
      const axiosErr = err as AxiosError<BREErrorData>;
      const data = axiosErr.response?.data;
      if (data?.breStatus === 'failed') {
        setBreRejected(true);
        setBreReason(data.rejectionReason ?? 'You do not meet the eligibility criteria.');
      } else if (axiosErr.response?.status === 409) {
        setStep(3);
      } else {
        setError(data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 file handling ───────────────────────────────────────────────────

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File must not exceed 5 MB. Please choose a smaller file.');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(f);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    clearError();
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post('/borrower/apply/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep(4);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4 submit ──────────────────────────────────────────────────────────

  const handleLoanApply = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const { data } = await api.post<{ loan: Loan }>('/borrower/apply/loan', {
        amount,
        tenureDays: tenure,
      });
      setLoan(data.loan);
      setStep(5);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { simpleInterest, totalRepayment } = calculateSimpleInterest(amount, tenure);

  // ── Loading spinner ────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-9 w-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
          Loan Application
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          Logout
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Step indicator */}
        {step >= 1 && step <= 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEP_LABELS.map((label, i) => {
                const s = i + 1;
                const done = s < step;
                const active = s === step;
                return (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                        done
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : active
                          ? 'bg-white border-blue-600 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {done ? '✓' : s}
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-medium hidden sm:block ${
                        active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </span>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`absolute hidden`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="relative mt-2 h-1 bg-gray-200 rounded-full mx-4">
              <div
                className="absolute left-0 top-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Hello, {user?.name ?? 'there'}!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Complete the steps below to apply for a personal loan. The process takes just a few
              minutes.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Begin Application
            </button>
          </div>
        )}

        {/* ── Step 2: Personal Details ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Personal Details</h2>
            <p className="text-sm text-gray-500 mb-6">
              We use this information to assess your eligibility.
            </p>

            {breRejected ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-5">
                <p className="font-semibold text-red-800 mb-1">Application Not Eligible</p>
                <p className="text-sm text-red-700">{breReason}</p>
                <p className="mt-3 text-sm text-red-600">
                  Unfortunately, you cannot proceed with a loan application at this time.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <form onSubmit={handlePersonalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="As on PAN card"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                    <input
                      type="text"
                      required
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="50000"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Mode</label>
                    <select
                      required
                      value={empMode}
                      onChange={(e) => setEmpMode(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
                  >
                    {loading ? 'Checking eligibility…' : 'Continue'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Upload Document ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Upload Salary Slip</h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload your most recent salary slip. Accepted formats: PDF, JPG, PNG. Max size: 5 MB.
            </p>

            {error && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-gray-500">Click to browse</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,.jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {fileError && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  {fileError}
                </div>
              )}

              {file && !fileError && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                  <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file || !!fileError}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Uploading…' : 'Upload & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 4: Loan Configuration ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Configure Your Loan</h2>
            <p className="text-sm text-gray-500 mb-6">
              Adjust the sliders to choose your loan amount and repayment period.
            </p>

            {error && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLoanApply} className="space-y-6">
              {/* Amount slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                  <span className="text-base font-semibold text-gray-900">{INR(amount)}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹50,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              {/* Tenure slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-sm font-medium text-gray-700">Tenure</label>
                  <span className="text-base font-semibold text-gray-900">{tenure} days</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={1}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30 days</span>
                  <span>365 days</span>
                </div>
              </div>

              {/* Live calculation */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 divide-y divide-gray-200">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">Loan Amount</span>
                  <span className="text-sm font-medium text-gray-900">{INR(amount)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">Tenure</span>
                  <span className="text-sm font-medium text-gray-900">{tenure} days</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">Interest Rate</span>
                  <span className="text-sm font-medium text-gray-900">12% p.a.</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">Simple Interest</span>
                  <span className="text-sm font-medium text-gray-900">{INR(simpleInterest)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-blue-50 rounded-b-xl">
                  <span className="text-sm font-semibold text-gray-900">Total Repayment</span>
                  <span className="text-sm font-bold text-blue-700">{INR(totalRepayment)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Submitting application…' : 'Apply Now'}
              </button>
            </form>
          </div>
        )}

        {/* ── Status Screen ── */}
        {step === 5 && loan && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Loan Status</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[loan.status]}`}
              >
                {loan.status}
              </span>
            </div>

            {loan.status === 'rejected' && loan.rejectionReason && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-semibold text-red-800 mb-0.5">Rejection Reason</p>
                <p className="text-sm text-red-700">{loan.rejectionReason}</p>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 border border-gray-200 divide-y divide-gray-200 mb-6">
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Loan Amount</span>
                <span className="text-sm font-medium text-gray-900">{INR(loan.amount)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Tenure</span>
                <span className="text-sm font-medium text-gray-900">{loan.tenureDays} days</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Simple Interest</span>
                <span className="text-sm font-medium text-gray-900">{INR(loan.simpleInterest)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Total Repayment</span>
                <span className="text-sm font-medium text-gray-900">{INR(loan.totalRepayment)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-sm font-medium text-green-700">{INR(loan.totalPaid)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 rounded-b-xl">
                <span className="text-sm text-gray-600">Outstanding Balance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {INR(Math.max(0, loan.totalRepayment - loan.totalPaid))}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
