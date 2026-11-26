export interface CountryOption {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  samplePhone: string;
  sampleCity: string;
}

export const POPULAR_COUNTRY_CODES = [
  'CH',
  'US',
  'GB',
  'DE',
  'SG',
  'AE',
  'NL',
  'JP',
];

export const COUNTRIES: CountryOption[] = [
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', dialCode: '+41', samplePhone: '44 580 24 90', sampleCity: 'Zurich' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1', samplePhone: '415 555 0148', sampleCity: 'San Francisco' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44', samplePhone: '20 7946 0921', sampleCity: 'London' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49', samplePhone: '89 2154 7800', sampleCity: 'Munich' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65', samplePhone: '6701 8840', sampleCity: 'Singapore' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971', samplePhone: '4 512 8900', sampleCity: 'Dubai' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', dialCode: '+31', samplePhone: '40 808 1920', sampleCity: 'Eindhoven' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81', samplePhone: '3 5555 0194', sampleCity: 'Tokyo' },

  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫', dialCode: '+93', samplePhone: '70 123 4567', sampleCity: 'Kabul' },
  { name: 'Albania', code: 'AL', flag: '🇦🇱', dialCode: '+355', samplePhone: '69 212 3456', sampleCity: 'Tirana' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿', dialCode: '+213', samplePhone: '551 23 45 67', sampleCity: 'Algiers' },
  { name: 'Andorra', code: 'AD', flag: '🇦🇩', dialCode: '+376', samplePhone: '312 345', sampleCity: 'Andorra la Vella' },
  { name: 'Angola', code: 'AO', flag: '🇦🇴', dialCode: '+244', samplePhone: '923 123 456', sampleCity: 'Luanda' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', dialCode: '+54', samplePhone: '11 5555 0192', sampleCity: 'Buenos Aires' },
  { name: 'Armenia', code: 'AM', flag: '🇦🇲', dialCode: '+374', samplePhone: '77 123456', sampleCity: 'Yerevan' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61', samplePhone: '2 8015 4420', sampleCity: 'Sydney' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', dialCode: '+43', samplePhone: '1 555 0140', sampleCity: 'Vienna' },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿', dialCode: '+994', samplePhone: '50 212 3456', sampleCity: 'Baku' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭', dialCode: '+973', samplePhone: '1700 1234', sampleCity: 'Manama' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', dialCode: '+880', samplePhone: '1711 000000', sampleCity: 'Dhaka' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪', dialCode: '+32', samplePhone: '2 555 01 92', sampleCity: 'Brussels' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴', dialCode: '+591', samplePhone: '712 34567', sampleCity: 'La Paz' },
  { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦', dialCode: '+387', samplePhone: '61 123 456', sampleCity: 'Sarajevo' },
  { name: 'Botswana', code: 'BW', flag: '🇧🇼', dialCode: '+267', samplePhone: '71 123 456', sampleCity: 'Gaborone' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', dialCode: '+55', samplePhone: '11 98765 4321', sampleCity: 'São Paulo' },
  { name: 'Brunei', code: 'BN', flag: '🇧🇳', dialCode: '+673', samplePhone: '712 3456', sampleCity: 'Bandar Seri Begawan' },
  { name: 'Bulgaria', code: 'BG', flag: '🇧🇬', dialCode: '+359', samplePhone: '88 123 4567', sampleCity: 'Sofia' },
  { name: 'Cambodia', code: 'KH', flag: '🇰🇭', dialCode: '+855', samplePhone: '12 345 678', sampleCity: 'Phnom Penh' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲', dialCode: '+237', samplePhone: '6 71 23 45 67', sampleCity: 'Douala' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1', samplePhone: '416 555 0198', sampleCity: 'Toronto' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', dialCode: '+56', samplePhone: '9 8765 4321', sampleCity: 'Santiago' },
  { name: 'China', code: 'CN', flag: '🇨🇳', dialCode: '+86', samplePhone: '138 0013 8000', sampleCity: 'Shenzhen' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', dialCode: '+57', samplePhone: '300 123 4567', sampleCity: 'Bogotá' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷', dialCode: '+506', samplePhone: '8312 3456', sampleCity: 'San José' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷', dialCode: '+385', samplePhone: '91 234 5678', sampleCity: 'Zagreb' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾', dialCode: '+357', samplePhone: '96 123456', sampleCity: 'Nicosia' },
  { name: 'Czechia', code: 'CZ', flag: '🇨🇿', dialCode: '+420', samplePhone: '601 123 456', sampleCity: 'Prague' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', dialCode: '+45', samplePhone: '20 12 34 56', sampleCity: 'Copenhagen' },
  { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴', dialCode: '+1', samplePhone: '809 555 0192', sampleCity: 'Santo Domingo' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨', dialCode: '+593', samplePhone: '99 123 4567', sampleCity: 'Quito' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬', dialCode: '+20', samplePhone: '100 123 4567', sampleCity: 'Cairo' },
  { name: 'Estonia', code: 'EE', flag: '🇪🇪', dialCode: '+372', samplePhone: '5123 4567', sampleCity: 'Tallinn' },
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹', dialCode: '+251', samplePhone: '91 123 4567', sampleCity: 'Addis Ababa' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮', dialCode: '+358', samplePhone: '40 123 4567', sampleCity: 'Helsinki' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33', samplePhone: '6 12 34 56 78', sampleCity: 'Paris' },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪', dialCode: '+995', samplePhone: '555 12 34 56', sampleCity: 'Tbilisi' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', dialCode: '+233', samplePhone: '24 123 4567', sampleCity: 'Accra' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷', dialCode: '+30', samplePhone: '691 234 5678', sampleCity: 'Athens' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹', dialCode: '+502', samplePhone: '5123 4567', sampleCity: 'Guatemala City' },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', dialCode: '+852', samplePhone: '5123 4567', sampleCity: 'Hong Kong' },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺', dialCode: '+36', samplePhone: '20 123 4567', sampleCity: 'Budapest' },
  { name: 'Iceland', code: 'IS', flag: '🇮🇸', dialCode: '+354', samplePhone: '612 3456', sampleCity: 'Reykjavik' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91', samplePhone: '98201 12345', sampleCity: 'Bengaluru' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62', samplePhone: '812 3456 7890', sampleCity: 'Jakarta' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', dialCode: '+353', samplePhone: '87 123 4567', sampleCity: 'Dublin' },
  { name: 'Israel', code: 'IL', flag: '🇮🇱', dialCode: '+972', samplePhone: '50 123 4567', sampleCity: 'Tel Aviv' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', dialCode: '+39', samplePhone: '312 345 6789', sampleCity: 'Milan' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲', dialCode: '+1', samplePhone: '876 555 0140', sampleCity: 'Kingston' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴', dialCode: '+962', samplePhone: '79 123 4567', sampleCity: 'Amman' },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿', dialCode: '+7', samplePhone: '701 123 4567', sampleCity: 'Almaty' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', dialCode: '+254', samplePhone: '712 345 678', sampleCity: 'Nairobi' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼', dialCode: '+965', samplePhone: '500 12345', sampleCity: 'Kuwait City' },
  { name: 'Latvia', code: 'LV', flag: '🇱🇻', dialCode: '+371', samplePhone: '21 234 567', sampleCity: 'Riga' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧', dialCode: '+961', samplePhone: '71 123 456', sampleCity: 'Beirut' },
  { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮', dialCode: '+423', samplePhone: '660 123 456', sampleCity: 'Vaduz' },
  { name: 'Lithuania', code: 'LT', flag: '🇱🇹', dialCode: '+370', samplePhone: '612 34567', sampleCity: 'Vilnius' },
  { name: 'Luxembourg', code: 'LU', flag: '🇱🇺', dialCode: '+352', samplePhone: '621 123 456', sampleCity: 'Luxembourg City' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dialCode: '+60', samplePhone: '12 345 6789', sampleCity: 'Kuala Lumpur' },
  { name: 'Malta', code: 'MT', flag: '🇲🇹', dialCode: '+356', samplePhone: '7912 3456', sampleCity: 'Valletta' },
  { name: 'Mauritius', code: 'MU', flag: '🇲🇺', dialCode: '+230', samplePhone: '5123 4567', sampleCity: 'Port Louis' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', dialCode: '+52', samplePhone: '55 1234 5678', sampleCity: 'Mexico City' },
  { name: 'Monaco', code: 'MC', flag: '🇲🇨', dialCode: '+377', samplePhone: '6 12 34 56 78', sampleCity: 'Monaco' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', dialCode: '+212', samplePhone: '612 345678', sampleCity: 'Casablanca' },
  { name: 'Namibia', code: 'NA', flag: '🇳🇦', dialCode: '+264', samplePhone: '81 123 4567', sampleCity: 'Windhoek' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵', dialCode: '+977', samplePhone: '984 123 4567', sampleCity: 'Kathmandu' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', dialCode: '+64', samplePhone: '21 123 4567', sampleCity: 'Auckland' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dialCode: '+234', samplePhone: '802 123 4567', sampleCity: 'Lagos' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', dialCode: '+47', samplePhone: '412 34 567', sampleCity: 'Oslo' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲', dialCode: '+968', samplePhone: '9212 3456', sampleCity: 'Muscat' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', dialCode: '+92', samplePhone: '300 1234567', sampleCity: 'Karachi' },
  { name: 'Panama', code: 'PA', flag: '🇵🇦', dialCode: '+507', samplePhone: '6123 4567', sampleCity: 'Panama City' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾', dialCode: '+595', samplePhone: '961 123456', sampleCity: 'Asunción' },
  { name: 'Peru', code: 'PE', flag: '🇵🇪', dialCode: '+51', samplePhone: '912 345 678', sampleCity: 'Lima' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', dialCode: '+63', samplePhone: '917 123 4567', sampleCity: 'Manila' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱', dialCode: '+48', samplePhone: '501 234 567', sampleCity: 'Warsaw' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', dialCode: '+351', samplePhone: '912 345 678', sampleCity: 'Lisbon' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', dialCode: '+974', samplePhone: '5512 3456', sampleCity: 'Doha' },
  { name: 'Romania', code: 'RO', flag: '🇷🇴', dialCode: '+40', samplePhone: '712 345 678', sampleCity: 'Bucharest' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼', dialCode: '+250', samplePhone: '788 123 456', sampleCity: 'Kigali' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', dialCode: '+966', samplePhone: '50 123 4567', sampleCity: 'Riyadh' },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳', dialCode: '+221', samplePhone: '77 123 45 67', sampleCity: 'Dakar' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸', dialCode: '+381', samplePhone: '60 1234567', sampleCity: 'Belgrade' },
  { name: 'Slovakia', code: 'SK', flag: '🇸🇰', dialCode: '+421', samplePhone: '912 123 456', sampleCity: 'Bratislava' },
  { name: 'Slovenia', code: 'SI', flag: '🇸🇮', dialCode: '+386', samplePhone: '31 234 567', sampleCity: 'Ljubljana' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27', samplePhone: '82 123 4567', sampleCity: 'Johannesburg' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', dialCode: '+82', samplePhone: '10 1234 5678', sampleCity: 'Seoul' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', dialCode: '+34', samplePhone: '612 34 56 78', sampleCity: 'Madrid' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰', dialCode: '+94', samplePhone: '71 234 5678', sampleCity: 'Colombo' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', dialCode: '+46', samplePhone: '70 123 45 67', sampleCity: 'Stockholm' },
  { name: 'Taiwan', code: 'TW', flag: '🇹🇼', dialCode: '+886', samplePhone: '912 345 678', sampleCity: 'Taipei' },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿', dialCode: '+255', samplePhone: '712 345 678', sampleCity: 'Dar es Salaam' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', dialCode: '+66', samplePhone: '81 234 5678', sampleCity: 'Bangkok' },
  { name: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹', dialCode: '+1', samplePhone: '868 555 0142', sampleCity: 'Port of Spain' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', dialCode: '+216', samplePhone: '20 123 456', sampleCity: 'Tunis' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', dialCode: '+90', samplePhone: '532 123 4567', sampleCity: 'Istanbul' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬', dialCode: '+256', samplePhone: '772 123 456', sampleCity: 'Kampala' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦', dialCode: '+380', samplePhone: '50 123 4567', sampleCity: 'Kyiv' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾', dialCode: '+598', samplePhone: '94 123 456', sampleCity: 'Montevideo' },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿', dialCode: '+998', samplePhone: '90 123 45 67', sampleCity: 'Tashkent' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', dialCode: '+84', samplePhone: '91 234 56 78', sampleCity: 'Ho Chi Minh City' },
  { name: 'Zambia', code: 'ZM', flag: '🇿🇲', dialCode: '+260', samplePhone: '97 1234567', sampleCity: 'Lusaka' },
  { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼', dialCode: '+263', samplePhone: '71 234 5678', sampleCity: 'Harare' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Switzerland (+41)

export function findCountryByName(name?: string): CountryOption | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return COUNTRIES.find(
    (c) => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

const DIAL_SORTED_COUNTRIES = [...COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

export function findCountryByDialCode(phoneOrDial?: string): CountryOption | undefined {
  if (!phoneOrDial) return undefined;
  const trimmed = phoneOrDial.trim();
  if (!trimmed.startsWith('+')) return undefined;
  return DIAL_SORTED_COUNTRIES.find(
    (c) =>
      trimmed === c.dialCode ||
      trimmed.startsWith(`${c.dialCode} `) ||
      trimmed.startsWith(c.dialCode)
  );
}

export function parseInternationalPhone(
  fullPhone?: string,
  fallbackCountryName?: string
): { dialCode: string; nationalNumber: string; country: CountryOption } {
  const trimmed = (fullPhone || '').trim();
  const byFallback = findCountryByName(fallbackCountryName);

  if (trimmed) {
    const matched = findCountryByDialCode(trimmed);
    if (matched) {
      const rest = trimmed.slice(matched.dialCode.length).trim();
      const preferredCountry =
        byFallback && byFallback.dialCode === matched.dialCode ? byFallback : matched;
      return {
        dialCode: preferredCountry.dialCode,
        nationalNumber: rest,
        country: preferredCountry,
      };
    }
    const base = byFallback ?? DEFAULT_COUNTRY;
    return {
      dialCode: base.dialCode,
      nationalNumber: trimmed,
      country: base,
    };
  }

  const base = byFallback ?? DEFAULT_COUNTRY;
  return {
    dialCode: base.dialCode,
    nationalNumber: '',
    country: base,
  };
}

export function formatInternationalPhone(dialCode: string, nationalNumber: string): string {
  const cleanNum = nationalNumber.trim().replace(/^0+(?=\d{6,})/, '');
  if (!cleanNum) return '';
  if (cleanNum.startsWith('+')) return cleanNum;
  return `${dialCode} ${cleanNum}`;
}
