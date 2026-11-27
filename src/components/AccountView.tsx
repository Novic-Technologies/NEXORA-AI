import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Save,
  Sun,
} from 'lucide-react';
import {
  changePassword,
  formatDateTime,
  updateInvestorProfile,
} from '../lib/api.ts';
import {
  findCountryByName,
  formatInternationalPhone,
  parseInternationalPhone,
  type CountryOption,
} from '../lib/countries.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type { ThemePreference } from '../lib/useTheme.ts';
import type { InvestorClassification, InvestorProfile } from '../types.ts';
import { CountrySelectField, PhoneDialInputField } from './CountryPhonePicker.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface AccountViewProps {
  investor: InvestorProfile;
  themePreference: ThemePreference;
  onChangeTheme: (pref: ThemePreference) => void;
  onBack: () => void;
  onUpdated: (investor: InvestorProfile) => void;
  onOpenVerification: () => void;
  onOpenReferrals: () => void;
  onSignOut: () => void;
}

const CLASSIFICATIONS: InvestorClassification[] = [
  'Individual Investor',
  'Corporate Partner',
  'Institutional Fund',
];

export function AccountView({
  investor,
  themePreference,
  onChangeTheme,
  onBack,
  onUpdated,
  onOpenVerification,
  onOpenReferrals,
  onSignOut,
}: AccountViewProps) {
  const [fullName, setFullName] = useState(investor.fullName);
  const [phone, setPhone] = useState(investor.phone);
  const [companyName, setCompanyName] = useState(investor.companyName);
  const [country, setCountry] = useState(investor.country);
  const [city, setCity] = useState(investor.city || '');
  const [avatarUrl, setAvatarUrl] = useState(investor.avatarUrl || '');
  const [investorType, setInvestorType] = useState<InvestorClassification>(
    investor.investorType
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSaved(false);
    try {
      const dataUrl = await compressImageToDataUrl(file, 480, 0.85);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process photo.');
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await updateInvestorProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim() || 'Personal Portfolio',
        country: country.trim(),
        city: city.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        investorType,
      });
      onUpdated(res.investor);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(investor.referralCode);
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 1800);
    } catch {
      setCopiedRef(false);
    }
  };

  return (
    <div className="pb-6 space-y-4">
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
            Profile & Preferences
          </h1>
          <p className="text-[10.5px] font-mono text-[#6B7280] dark:text-[#94A3B8] truncate">
            {investor.department || 'Verified Investor Portal'} · Joined {formatDateTime(investor.createdAt)}
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Appearance (System / Light / Dark) */}
        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-2.5">
          <div>
            <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
              Appearance Mode
            </p>
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
              Automatically matches your device theme or pick Light / Dark manually
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] p-1">
            {(
              [
                ['system', 'System', Monitor],
                ['light', 'Light', Sun],
                ['dark', 'Dark', Moon],
              ] as const
            ).map(([key, label, Icon]) => {
              const active = themePreference === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeTheme(key)}
                  className={`py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-2xs'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Install App Banner */}
        <PWAInstallButton variant="banner" />

        {/* Referral Quick Card */}
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenReferrals}
            className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4338CA] dark:text-[#A5B4FC] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                Invite Code: <span className="font-mono">{investor.referralCode}</span>
              </p>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                Tap to view team rewards & 2x yield boosts
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleCopyRef}
            className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copiedRef ? (
              <Check className="w-3.5 h-3.5 text-[#059669]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedRef ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenVerification}
          className="w-full rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-3.5 flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                KYC & Financial Proof ({investor.kycStatus.toUpperCase()})
              </p>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Manage ID documents and proof of financial ability
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
        </button>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3.5"
        >
          <div className="flex items-center gap-3.5 pb-2 border-b border-[#F3F4F6] dark:border-[#1E293B]">
            <div className="w-16 h-16 rounded-full bg-[#111827] dark:bg-[#1E293B] text-white overflow-hidden flex items-center justify-center shrink-0 border border-[#D1D5DB] dark:border-[#334155]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                Profile Photo
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[11px] font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>{avatarUrl ? 'Change photo' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="set-name"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="set-email"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Email Address
            </label>
            <input
              id="set-email"
              type="email"
              disabled
              value={investor.email}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F3F4F6] dark:bg-[#0B1120] text-xs text-[#6B7280] dark:text-[#94A3B8]"
            />
          </div>

          <div>
            <label
              htmlFor="set-country"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Country / Jurisdiction
            </label>
            <CountrySelectField
              id="set-country"
              value={country}
              onChange={(picked: CountryOption) => {
                setCountry(picked.name);
                const parsed = parseInternationalPhone(phone, picked.name);
                if (parsed.nationalNumber) {
                  setPhone(formatInternationalPhone(picked.dialCode, parsed.nationalNumber));
                }
              }}
              placeholder="Click to select country"
            />
          </div>

          <div>
            <label
              htmlFor="set-phone"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Phone Number
            </label>
            <PhoneDialInputField
              id="set-phone"
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
                htmlFor="set-city"
                className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
              >
                City
              </label>
              <input
                id="set-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={findCountryByName(country)?.sampleCity || 'City'}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="set-company"
                className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
              >
                Company / Fund
              </label>
              <input
                id="set-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="set-type"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Classification
            </label>
            <select
              id="set-type"
              value={investorType}
              onChange={(e) =>
                setInvestorType(e.target.value as InvestorClassification)
              }
              className="w-full h-11 px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-[11px] font-medium text-red-800 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 text-[11px] font-medium text-[#059669] dark:text-[#34D399]">
              Profile photo and investor details updated.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
          </button>
        </form>

        {/* Password & Account Security (Technical Department) */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (pwSaving) return;
            setPwError(null);
            setPwSuccess(null);
            if (currentPw.length < 6) {
              setPwError('Enter your current password.');
              return;
            }
            if (newPw.length < 6) {
              setPwError('New password must be at least 6 characters.');
              return;
            }
            setPwSaving(true);
            try {
              await changePassword({
                currentPassword: currentPw,
                newPassword: newPw,
              });
              setCurrentPw('');
              setNewPw('');
              setPwSuccess('Password updated and logged with Nexora Technical Department.');
            } catch (err) {
              setPwError(
                err instanceof Error ? err.message : 'Unable to update password.'
              );
            } finally {
              setPwSaving(false);
            }
          }}
          className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                Password &amp; Account Security
              </p>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                Managed with Nexora Technical Department encryption
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="sec-cur-pw"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="sec-cur-pw"
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-11 pl-3.5 pr-11 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((p) => !p)}
                aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] cursor-pointer"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="sec-new-pw"
              className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="sec-new-pw"
                type={showNewPw ? 'text' : 'password'}
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 pl-3.5 pr-11 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((p) => !p)}
                aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] cursor-pointer"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {pwError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-[11px] font-medium text-red-800 dark:text-red-200"
            >
              {pwError}
            </div>
          )}

          {pwSuccess && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 text-[11px] font-medium text-[#059669] dark:text-[#34D399]">
              {pwSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="w-full h-11 rounded-xl bg-[#111827] dark:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{pwSaving ? 'Updating Password...' : 'Update Account Password'}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full h-11 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#111827] text-red-700 dark:text-red-400 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
