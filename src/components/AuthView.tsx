import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import {
  loginInvestor,
  registerInvestor,
  requestPasswordReset,
  setupCorporatePortal,
} from '../lib/api.ts';
import {
  findCountryByName,
  formatInternationalPhone,
  parseInternationalPhone,
  type CountryOption,
} from '../lib/countries.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type { InvestorClassification, InvestorProfile } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { CountrySelectField, PhoneDialInputField } from './CountryPhonePicker.tsx';

interface AuthViewProps {
  initialMode?: 'signin' | 'register' | 'claim_admin';
  initialReferralCode?: string;
  masterAdminClaimed: boolean;
  brandName?: string;
  redirectLabel?: string;
  onBack: () => void;
  onAuthenticated: (investor: InvestorProfile) => void;
}

const INVESTOR_TYPES: InvestorClassification[] = [
  'Individual Investor',
  'Corporate Partner',
  'Institutional Fund',
];

export function AuthView({
  initialMode = 'signin',
  initialReferralCode = '',
  masterAdminClaimed,
  brandName = 'Nexora AI',
  redirectLabel,
  onBack,
  onAuthenticated,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'register' | 'claim_admin' | 'forgot'>(
    initialMode
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [investorType, setInvestorType] =
    useState<InvestorClassification>('Individual Investor');
  const [resetNote, setResetNote] = useState('');
  const [resetSentMsg, setResetSentMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: 'signin' | 'register' | 'claim_admin' | 'forgot') => {
    setMode(next);
    setError(null);
    setResetSentMsg(null);
  };

  const handleCountrySelect = (picked: CountryOption) => {
    setCountry(picked.name);
    const parsed = parseInternationalPhone(phone, picked.name);
    if (parsed.nationalNumber) {
      setPhone(formatInternationalPhone(picked.dialCode, parsed.nationalNumber));
    } else if (phone.trim()) {
      setPhone(`${picked.dialCode} `);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageToDataUrl(file, 480, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process photo.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setResetSentMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        const res = await requestPasswordReset({
          email: trimmedEmail,
          note: resetNote.trim() || undefined,
        });
        setResetSentMsg(res.message);
        setResetNote('');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to submit password reset request.'
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const minPassLen = mode === 'claim_admin' ? 8 : 6;
    if (password.length < minPassLen) {
      setError(`Password must be at least ${minPassLen} characters.`);
      return;
    }

    if (mode === 'register') {
      if (fullName.trim().length < 2) {
        setError('Enter your full legal name.');
        return;
      }
      if (phone.trim().length < 5) {
        setError('Enter a valid phone number.');
        return;
      }
      if (country.trim().length < 2) {
        setError('Tap to select your country of residence.');
        return;
      }
    }

    if (mode === 'claim_admin' && fullName.trim().length < 2) {
      setError('Enter the Executive Operations Officer full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const res = await loginInvestor({ email: trimmedEmail, password });
        onAuthenticated(res.investor);
      } else if (mode === 'claim_admin') {
        const res = await setupCorporatePortal({
          fullName: fullName.trim(),
          email: trimmedEmail,
          password,
          phone: phone.trim() || undefined,
          country: country.trim() || undefined,
          avatarUrl,
        });
        onAuthenticated(res.investor);
      } else {
        const res = await registerInvestor({
          fullName: fullName.trim(),
          email: trimmedEmail,
          password,
          phone: phone.trim(),
          companyName: companyName.trim() || 'Personal Portfolio',
          country: country.trim(),
          city: city.trim() || undefined,
          avatarUrl,
          referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
          investorType,
        });
        onAuthenticated(res.investor);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F4F6F9] dark:bg-[#0B1120]">
      <div className="bg-white dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-[#1E293B] px-4 pt-4 pb-5">
        <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="justify-self-center">
            <BrandLogo size="sm" brandName={brandName} />
          </div>
          <div />
        </div>

        <div className="mt-5">
          <h1 className="font-display text-[22px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-tight">
            {mode === 'signin'
              ? `Sign in to ${brandName}`
              : mode === 'forgot'
                ? 'Technical Dept Password Reset'
                : mode === 'claim_admin'
                  ? 'Initialize Corporate Portal'
                  : 'Create investor profile'}
          </h1>
          <p className="mt-1 text-xs text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
            {mode === 'claim_admin'
              ? 'First-run corporate setup for Executive, Finance, Compliance & Technical departments.'
              : mode === 'forgot'
                ? 'Submit a password assistance ticket directly to the Nexora AI Technical Department.'
                : redirectLabel
                  ? `Sign in or register to open ${redirectLabel}.`
                  : 'Access live AI robotics leases, Binance crypto settlement, team rewards & verification.'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 shadow-2xs">
          <div className="flex rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'signin' || mode === 'forgot'
                  ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-2xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-2xs'
                  : 'text-[#6B7280] dark:text-[#94A3B8]'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            {(mode === 'register' || mode === 'claim_admin') && (
              <>
                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A]">
                  <div className="w-14 h-14 rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] border border-[#D1D5DB] dark:border-[#334155] overflow-hidden flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Profile Photo {mode === 'register' ? '(Recommended)' : '(Optional)'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Required before submitting KYC verification.
                    </p>
                    <label className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#D1D5DB] dark:border-[#334155] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] cursor-pointer">
                      <Camera className="w-3 h-3 text-[#2563EB] dark:text-[#60A5FA]" />
                      <span>{avatarUrl ? 'Change photo' : 'Upload photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="app-fullname"
                    className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                  >
                    Full legal name
                  </label>
                  <input
                    id="app-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full legal name"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label
                    htmlFor="app-country"
                    className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                  >
                    Country / Jurisdiction
                  </label>
                  <CountrySelectField
                    id="app-country"
                    value={country}
                    onChange={handleCountrySelect}
                    placeholder="Click to select country"
                  />
                </div>

                <div>
                  <label
                    htmlFor="app-phone"
                    className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                  >
                    Phone number
                  </label>
                  <PhoneDialInputField
                    id="app-phone"
                    value={phone}
                    countryName={country}
                    required
                    onChange={(nextPhone, dialCountry) => {
                      setPhone(nextPhone);
                      if (!country && dialCountry) {
                        setCountry(dialCountry.name);
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="app-city"
                      className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                    >
                      City
                    </label>
                    <input
                      id="app-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={
                        findCountryByName(country)?.sampleCity || 'City (optional)'
                      }
                      className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="app-company"
                      className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                    >
                      Company / Fund
                    </label>
                    <input
                      id="app-company"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Personal"
                      className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="app-type"
                      className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                    >
                      Classification
                    </label>
                    <select
                      id="app-type"
                      value={investorType}
                      onChange={(e) =>
                        setInvestorType(e.target.value as InvestorClassification)
                      }
                      className="w-full h-11 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {INVESTOR_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="app-ref"
                      className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                    >
                      Invite Code (Optional)
                    </label>
                    <div className="relative">
                      <Gift className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="app-ref"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="NX-..."
                        className="w-full h-11 pl-8 pr-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-mono text-xs uppercase text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="app-email"
                className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="app-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {mode === 'forgot' ? (
              <div>
                <label
                  htmlFor="app-reset-note"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Verification Note for Technical Department (Optional)
                </label>
                <textarea
                  id="app-reset-note"
                  rows={2}
                  value={resetNote}
                  onChange={(e) => setResetNote(e.target.value)}
                  placeholder="Account phone number or verification reference..."
                  className="w-full p-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="app-password"
                    className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1]"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="app-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'claim_admin' ? 'At least 8 characters' : 'At least 6 characters'
                    }
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-[11px] font-medium text-red-800 dark:text-red-200"
              >
                {error}
              </div>
            )}

            {resetSentMsg && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2.5 text-[11px] font-medium text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span>{resetSentMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : mode === 'forgot'
                      ? 'Submit Request to Technical Dept'
                      : mode === 'claim_admin'
                        ? 'Activate Corporate Portal'
                        : 'Create Investor Account'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full h-9 rounded-xl border border-[#E5E7EB] dark:border-[#334155] text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1] cursor-pointer"
              >
                Back to Sign in
              </button>
            )}
          </form>
        </div>

        {!masterAdminClaimed && mode !== 'claim_admin' && (
          <div className="rounded-2xl border border-[#C7D2FE] dark:border-indigo-900 bg-[#EEF2FF] dark:bg-indigo-950/60 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1E1B4B] dark:text-indigo-200 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#4338CA] dark:text-indigo-400" />
                <span>Corporate portal initialization required</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[#3730A3] dark:text-indigo-300 leading-snug">
                Initialize Nexora Executive, Finance, Compliance &amp; Technical departments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => switchMode('claim_admin')}
              className="px-3 py-2 rounded-lg bg-[#312E81] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Setup Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
