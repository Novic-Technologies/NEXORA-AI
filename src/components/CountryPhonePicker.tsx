import { useMemo, useState } from 'react';
import { Check, ChevronDown, Globe, Search, X } from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  POPULAR_COUNTRY_CODES,
  findCountryByDialCode,
  findCountryByName,
  formatInternationalPhone,
  parseInternationalPhone,
  type CountryOption,
} from '../lib/countries.ts';

interface CountryPickerModalProps {
  open: boolean;
  mode: 'country' | 'dial';
  selectedCode?: string;
  onSelect: (country: CountryOption) => void;
  onClose: () => void;
}

function CountryPickerModal({
  open,
  mode,
  selectedCode,
  onSelect,
  onClose,
}: CountryPickerModalProps) {
  const [query, setQuery] = useState('');

  const popularCountries = useMemo(
    () =>
      POPULAR_COUNTRY_CODES.map((code) =>
        COUNTRIES.find((c) => c.code === code)
      ).filter((c): c is CountryOption => Boolean(c)),
    []
  );

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [query]);

  if (!open) return null;

  const handlePick = (c: CountryOption) => {
    setQuery('');
    onSelect(c);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'country' ? 'Select Country' : 'Select Country Calling Code'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setQuery('');
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[430px] h-[78dvh] bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl flex flex-col overflow-hidden">
        <div className="pt-2.5 pb-3 px-4 border-b border-[#E5E7EB] dark:border-[#1E293B] space-y-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#D1D5DB] dark:bg-[#334155] mx-auto" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                {mode === 'country'
                  ? 'Select Country'
                  : 'Select Calling Code'}
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                {mode === 'country'
                  ? 'Tap to select your country or jurisdiction'
                  : 'Tap to choose an international dialing prefix'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onClose();
              }}
              aria-label="Close selector"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] flex items-center justify-center text-[#374151] dark:text-[#CBD5E1] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter list (optional)..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] dark:text-[#94A3B8] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!query && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {popularCountries.map((c) => {
                const isSelected = selectedCode === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handlePick(c)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                        : 'bg-[#F9FAFB] dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] text-[#111827] dark:text-[#F8FAFC] hover:border-[#9CA3AF]'
                    }`}
                  >
                    <span className="text-sm leading-none">{c.flag}</span>
                    <span>{mode === 'dial' ? `${c.code} ${c.dialCode}` : c.code}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
          {filteredCountries.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
              No matching countries found.
            </div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = selectedCode === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c)}
                  className={`w-full min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/35'
                      : 'hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg leading-none shrink-0" aria-hidden="true">
                      {c.flag}
                    </span>
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-[#6B7280] dark:text-[#94A3B8]">
                      {c.dialCode}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface CountrySelectFieldProps {
  id?: string;
  value: string;
  onChange: (country: CountryOption) => void;
  compact?: boolean;
  placeholder?: string;
}

export function CountrySelectField({
  id,
  value,
  onChange,
  compact = false,
  placeholder = 'Select country',
}: CountrySelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = findCountryByName(value);

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full ${
          compact ? 'h-9 px-2.5 rounded-lg' : 'h-11 px-3 rounded-xl'
        } border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-[#9CA3AF] dark:hover:border-[#475569] text-xs flex items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className="text-base leading-none shrink-0" aria-hidden="true">
                {selected.flag}
              </span>
              <span className="font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                {selected.name}
              </span>
            </>
          ) : value ? (
            <>
              <Globe className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
              <span className="font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                {value}
              </span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <span className="text-[#9CA3AF] truncate">{placeholder}</span>
            </>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" />
      </button>

      <CountryPickerModal
        open={open}
        mode="country"
        selectedCode={selected?.code}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

interface PhoneDialInputFieldProps {
  id?: string;
  value: string;
  countryName?: string;
  required?: boolean;
  compact?: boolean;
  onChange: (fullPhone: string, selectedDialCountry?: CountryOption) => void;
}

export function PhoneDialInputField({
  id,
  value,
  countryName,
  required = false,
  compact = false,
  onChange,
}: PhoneDialInputFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const parsed = useMemo(
    () => parseInternationalPhone(value, countryName),
    [value, countryName]
  );

  const activeCountry =
    findCountryByDialCode(value) ??
    findCountryByName(countryName) ??
    DEFAULT_COUNTRY;

  const activeDialCode = parsed.dialCode;
  const localNumber = parsed.nationalNumber;

  const handleDialPick = (picked: CountryOption) => {
    const formatted = localNumber
      ? formatInternationalPhone(picked.dialCode, localNumber)
      : `${picked.dialCode} `;
    onChange(formatted, picked);
  };

  const handleNumberInput = (raw: string) => {
    const cleaned = raw.replace(/[^\d\s()-]/g, '');
    if (!cleaned.trim()) {
      onChange('');
      return;
    }
    onChange(`${activeDialCode} ${cleaned.trimStart()}`);
  };

  const heightCls = compact ? 'h-9 rounded-lg' : 'h-11 rounded-xl';

  return (
    <>
      <div
        className={`w-full ${heightCls} border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]`}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Select country calling code"
          className="px-2.5 bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] border-r border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          <span className="text-sm leading-none" aria-hidden="true">
            {activeCountry.flag}
          </span>
          <span className="text-[11px] font-mono font-semibold tabular-nums text-[#111827] dark:text-[#F8FAFC]">
            {activeDialCode}
          </span>
          <ChevronDown className="w-3 h-3 text-[#6B7280] dark:text-[#94A3B8]" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          required={required}
          value={localNumber}
          onChange={(e) => handleNumberInput(e.target.value)}
          placeholder={activeCountry.samplePhone}
          className="flex-1 min-w-0 px-3 bg-transparent text-xs font-mono tabular-nums text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </div>

      <CountryPickerModal
        open={pickerOpen}
        mode="dial"
        selectedCode={activeCountry.code}
        onSelect={handleDialPick}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
