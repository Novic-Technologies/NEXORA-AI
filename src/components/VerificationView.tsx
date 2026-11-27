import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { submitVerificationRecords } from '../lib/api.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type { IdentityDocType, InvestorProfile } from '../types.ts';

interface VerificationViewProps {
  investor: InvestorProfile;
  onBack: () => void;
  onUpdated: (investor: InvestorProfile) => void;
}

const DOC_TYPES: IdentityDocType[] = [
  'National ID',
  'Passport',
  'Driver License',
];

const FUND_SOURCES = [
  'Business Revenue & Operations',
  'Employment / Salary Income',
  'Crypto & Investment Portfolio',
  'Corporate Treasury Reserve',
  'Personal Savings',
];

const CAPACITY_BRACKETS = [
  '$1,000 – $10,000',
  '$10,000 – $50,000',
  '$50,000 – $250,000',
  '$250,000+',
];

export function VerificationView({
  investor,
  onBack,
  onUpdated,
}: VerificationViewProps) {
  const existing = investor.verification;

  const [avatarUrl, setAvatarUrl] = useState<string>(investor.avatarUrl || '');
  const [documentType, setDocumentType] = useState<IdentityDocType>(
    existing?.documentType || 'National ID'
  );
  const [documentNumber, setDocumentNumber] = useState(existing?.documentNumber || '');
  const [frontImageUrl, setFrontImageUrl] = useState(existing?.frontImageUrl || '');
  const [backOrSelfieUrl, setBackOrSelfieUrl] = useState(
    existing?.backOrSelfieUrl || ''
  );

  const [sourceOfFunds, setSourceOfFunds] = useState(existing?.sourceOfFunds || '');
  const [annualCapacity, setAnnualCapacity] = useState(existing?.annualCapacity || '');
  const [financialProofUrl, setFinancialProofUrl] = useState(
    existing?.financialProofUrl || ''
  );
  const [financialProofNote, setFinancialProofNote] = useState(
    existing?.financialProofNote || ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImagePick = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    maxDim = 960
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, maxDim, 0.82);
      setter(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read image file.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccessMsg(null);

    if (!avatarUrl) {
      setError('Upload a clear profile photo before submitting verification.');
      return;
    }
    if (documentNumber.trim().length < 4) {
      setError('Enter your valid identity document number.');
      return;
    }
    if (!frontImageUrl || !backOrSelfieUrl) {
      setError('Upload both your ID front photo and your back / selfie verification photo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitVerificationRecords({
        avatarUrl,
        documentType,
        documentNumber: documentNumber.trim(),
        frontImageUrl,
        backOrSelfieUrl,
        sourceOfFunds: sourceOfFunds || undefined,
        annualCapacity: annualCapacity || undefined,
        financialProofUrl: financialProofUrl || undefined,
        financialProofNote: financialProofNote.trim() || undefined,
      });
      onUpdated(res.investor);
      setSuccessMsg(
        'Verification records submitted. The Compliance Department will review your documents shortly.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-8 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
            Investor Verification (KYC)
          </h1>
          <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
            Identity records & optional financial ability proof
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <div
          className={`rounded-2xl border p-4 flex items-start gap-3 ${
            investor.kycStatus === 'verified'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-100'
              : investor.kycStatus === 'pending'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100'
                : investor.kycStatus === 'rejected'
                  ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-950 dark:text-red-100'
                  : 'bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {investor.kycStatus === 'verified' ? (
              <BadgeCheck className="w-5 h-5 text-[#059669] dark:text-[#34D399]" />
            ) : investor.kycStatus === 'pending' ? (
              <Clock className="w-5 h-5 text-[#D97706] dark:text-[#FBBF24]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
            )}
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold">
              {investor.kycStatus === 'verified'
                ? 'Identity Verified'
                : investor.kycStatus === 'pending'
                  ? 'Pending Compliance Dept Review'
                  : investor.kycStatus === 'rejected'
                    ? 'Verification Declined — Resubmit Required'
                    : 'Verification Not Submitted'}
            </p>
            <p className="text-[11px] opacity-85 leading-relaxed">
              {investor.kycStatus === 'verified'
                ? 'Your account is verified. Crypto withdrawals and institutional contracts are enabled.'
                : investor.kycStatus === 'pending'
                  ? 'Your profile photo, ID documents, and financial details are in the Compliance Department review queue.'
                  : investor.kycStatus === 'rejected'
                    ? existing?.reviewNote || 'Please upload clearer identity photos and resubmit.'
                    : 'Upload your profile photo and government ID to unlock crypto withdrawals.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3">
            <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
              1. Investor Profile Photo (Required)
            </p>
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-full bg-[#F3F4F6] dark:bg-[#1E293B] border border-[#D1D5DB] dark:border-[#334155] overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={investor.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-[#9CA3AF]" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] leading-snug">
                  Clear headshot used for your investor badge and KYC match.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] dark:bg-[#2563EB] text-white text-[11px] font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarUrl ? 'Replace photo' : 'Upload profile photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagePick(e, setAvatarUrl, 480)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3.5">
            <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
              2. Government Identity Records (Required)
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="kyc-doctype"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Document Type
                </label>
                <select
                  id="kyc-doctype"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as IdentityDocType)}
                  className="w-full h-10 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="kyc-docnum"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  ID / Passport Number
                </label>
                <input
                  id="kyc-docnum"
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. P9048217A"
                  className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:border-[#2563EB] min-h-[116px] overflow-hidden">
                {frontImageUrl ? (
                  <img
                    src={frontImageUrl}
                    alt="ID Front"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
                )}
                <span className="text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {frontImageUrl ? 'Change ID Front' : 'Upload ID Front'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, setFrontImageUrl)}
                  className="sr-only"
                />
              </label>

              <label className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:border-[#2563EB] min-h-[116px] overflow-hidden">
                {backOrSelfieUrl ? (
                  <img
                    src={backOrSelfieUrl}
                    alt="ID Back or Selfie"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
                )}
                <span className="text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {backOrSelfieUrl ? 'Change Back / Selfie' : 'Upload Back / Selfie'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, setBackOrSelfieUrl)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                3. Proof of Financial Ability
              </p>
              <span className="px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1E293B] text-[10px] font-semibold text-[#6B7280] dark:text-[#94A3B8]">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
              Optionally declare source of funds or attach a recent bank/portfolio statement to
              qualify for higher fleet allocations.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <label
                  htmlFor="kyc-source"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Primary Source of Funds (Optional)
                </label>
                <select
                  id="kyc-source"
                  value={sourceOfFunds}
                  onChange={(e) => setSourceOfFunds(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select source of funds...</option>
                  {FUND_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="kyc-cap"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Annual Investment Capacity (Optional)
                </label>
                <select
                  id="kyc-cap"
                  value={annualCapacity}
                  onChange={(e) => setAnnualCapacity(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select capacity range...</option>
                  {CAPACITY_BRACKETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3 flex items-center gap-3 cursor-pointer hover:border-[#2563EB]">
              {financialProofUrl ? (
                <img
                  src={financialProofUrl}
                  alt="Financial proof preview"
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {financialProofUrl
                    ? 'Financial proof image attached'
                    : 'Attach bank or asset statement (Optional)'}
                </p>
                <p className="text-[10.5px] text-[#6B7280] dark:text-[#94A3B8]">
                  PNG or JPG image of statement or proof of funds
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImagePick(e, setFinancialProofUrl)}
                className="sr-only"
              />
            </label>

            <div>
              <label
                htmlFor="kyc-fin-note"
                className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
              >
                Notes for Compliance Reviewer (Optional)
              </label>
              <input
                id="kyc-fin-note"
                type="text"
                value={financialProofNote}
                onChange={(e) => setFinancialProofNote(e.target.value)}
                placeholder="e.g. Q3 corporate bank statement attached"
                className="w-full h-10 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2.5 text-xs font-medium text-emerald-900 dark:text-emerald-100 inline-flex items-start gap-2 w-full">
              <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting
              ? 'Submitting records...'
              : investor.kycStatus === 'pending'
                ? 'Update Verification Submission'
                : 'Submit Verification Records'}
          </button>
        </form>
      </div>
    </div>
  );
}
