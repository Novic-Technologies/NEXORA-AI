import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  ChevronRight,
  LogOut,
  Save,
} from 'lucide-react';
import { formatDateTime, updateInvestorProfile } from '../lib/api.ts';
import { compressImageToDataUrl } from '../lib/imageUpload.ts';
import type { InvestorClassification, InvestorProfile } from '../types.ts';

interface AccountViewProps {
  investor: InvestorProfile;
  onBack: () => void;
  onUpdated: (investor: InvestorProfile) => void;
  onOpenVerification: () => void;
  onSignOut: () => void;
}

const CLASSIFICATIONS: InvestorClassification[] = [
  'Individual Investor',
  'Corporate Partner',
  'Institutional Fund',
];

export function AccountView({
  investor,
  onBack,
  onUpdated,
  onOpenVerification,
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

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#111827] shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-[#111827] truncate">
            Profile & Details
          </h1>
          <p className="text-[10.5px] font-mono text-[#6B7280] truncate">
            {investor.role.toUpperCase()} · Joined {formatDateTime(investor.createdAt)}
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <button
          type="button"
          onClick={onOpenVerification}
          className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-3.5 flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#111827]">
                KYC & Financial Proof ({investor.kycStatus.toUpperCase()})
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Manage ID documents and proof of financial ability
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
        </button>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3.5"
        >
          {/* Profile Photo Picker */}
          <div className="flex items-center gap-3.5 pb-2 border-b border-[#F3F4F6]">
            <div className="w-16 h-16 rounded-full bg-[#111827] text-white overflow-hidden flex items-center justify-center shrink-0 border border-[#D1D5DB]">
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
              <p className="text-xs font-semibold text-[#111827]">Profile Photo</p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] text-[11px] font-semibold text-[#111827] cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
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
              className="block text-[11px] font-semibold text-[#374151] mb-1"
            >
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="set-email"
              className="block text-[11px] font-semibold text-[#374151] mb-1"
            >
              Email Address
            </label>
            <input
              id="set-email"
              type="email"
              disabled
              value={investor.email}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs text-[#6B7280]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="set-phone"
                className="block text-[11px] font-semibold text-[#374151] mb-1"
              >
                Phone Number
              </label>
              <input
                id="set-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="set-country"
                className="block text-[11px] font-semibold text-[#374151] mb-1"
              >
                Country
              </label>
              <input
                id="set-country"
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="set-city"
                className="block text-[11px] font-semibold text-[#374151] mb-1"
              >
                City
              </label>
              <input
                id="set-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label
                htmlFor="set-company"
                className="block text-[11px] font-semibold text-[#374151] mb-1"
              >
                Company / Fund
              </label>
              <input
                id="set-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="set-type"
              className="block text-[11px] font-semibold text-[#374151] mb-1"
            >
              Classification
            </label>
            <select
              id="set-type"
              value={investorType}
              onChange={(e) =>
                setInvestorType(e.target.value as InvestorClassification)
              }
              className="w-full h-11 px-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-800"
            >
              {error}
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-[#059669]">
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

        <button
          type="button"
          onClick={onSignOut}
          className="w-full h-11 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
