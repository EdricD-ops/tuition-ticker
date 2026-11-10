/** Regions offered in setup. Picking one fills in its default currency and time zone. */
export interface Region {
  code: string;
  name: { en: string; zh: string };
  currency: string;
  /** The first entry is the default. More than one means the user should pick. */
  timeZones: string[];
}

export const REGIONS: Region[] = [
  { code: 'HK', name: { en: 'Hong Kong', zh: '香港' }, currency: 'HKD', timeZones: ['Asia/Hong_Kong'] },
  { code: 'MO', name: { en: 'Macau', zh: '澳门' }, currency: 'MOP', timeZones: ['Asia/Macau'] },
  { code: 'CN', name: { en: 'Mainland China', zh: '中国内地' }, currency: 'CNY', timeZones: ['Asia/Shanghai'] },
  { code: 'TW', name: { en: 'Taiwan', zh: '台湾' }, currency: 'TWD', timeZones: ['Asia/Taipei'] },
  { code: 'SG', name: { en: 'Singapore', zh: '新加坡' }, currency: 'SGD', timeZones: ['Asia/Singapore'] },
  { code: 'JP', name: { en: 'Japan', zh: '日本' }, currency: 'JPY', timeZones: ['Asia/Tokyo'] },
  { code: 'KR', name: { en: 'South Korea', zh: '韩国' }, currency: 'KRW', timeZones: ['Asia/Seoul'] },
  { code: 'GB', name: { en: 'United Kingdom', zh: '英国' }, currency: 'GBP', timeZones: ['Europe/London'] },
  {
    code: 'US',
    name: { en: 'United States', zh: '美国' },
    currency: 'USD',
    timeZones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Phoenix',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
    ],
  },
  {
    code: 'CA',
    name: { en: 'Canada', zh: '加拿大' },
    currency: 'CAD',
    timeZones: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Regina', 'America/Halifax'],
  },
  {
    code: 'AU',
    name: { en: 'Australia', zh: '澳大利亚' },
    currency: 'AUD',
    timeZones: [
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Adelaide',
      'Australia/Perth',
      'Australia/Hobart',
      'Australia/Darwin',
    ],
  },
  { code: 'NZ', name: { en: 'New Zealand', zh: '新西兰' }, currency: 'NZD', timeZones: ['Pacific/Auckland'] },
  { code: 'AR', name: { en: 'Argentina', zh: '阿根廷' }, currency: 'ARS', timeZones: ['America/Argentina/Buenos_Aires'] },
  { code: 'AT', name: { en: 'Austria', zh: '奥地利' }, currency: 'EUR', timeZones: ['Europe/Vienna'] },
  { code: 'BE', name: { en: 'Belgium', zh: '比利时' }, currency: 'EUR', timeZones: ['Europe/Brussels'] },
  { code: 'BR', name: { en: 'Brazil', zh: '巴西' }, currency: 'BRL', timeZones: ['America/Sao_Paulo', 'America/Manaus'] },
  { code: 'BN', name: { en: 'Brunei', zh: '文莱' }, currency: 'BND', timeZones: ['Asia/Brunei'] },
  { code: 'CL', name: { en: 'Chile', zh: '智利' }, currency: 'CLP', timeZones: ['America/Santiago'] },
  { code: 'CO', name: { en: 'Colombia', zh: '哥伦比亚' }, currency: 'COP', timeZones: ['America/Bogota'] },
  { code: 'CR', name: { en: 'Costa Rica', zh: '哥斯达黎加' }, currency: 'CRC', timeZones: ['America/Costa_Rica'] },
  { code: 'CZ', name: { en: 'Czechia', zh: '捷克' }, currency: 'CZK', timeZones: ['Europe/Prague'] },
  { code: 'DK', name: { en: 'Denmark', zh: '丹麦' }, currency: 'DKK', timeZones: ['Europe/Copenhagen'] },
  { code: 'EG', name: { en: 'Egypt', zh: '埃及' }, currency: 'EGP', timeZones: ['Africa/Cairo'] },
  { code: 'EE', name: { en: 'Estonia', zh: '爱沙尼亚' }, currency: 'EUR', timeZones: ['Europe/Tallinn'] },
  { code: 'FI', name: { en: 'Finland', zh: '芬兰' }, currency: 'EUR', timeZones: ['Europe/Helsinki'] },
  { code: 'FR', name: { en: 'France', zh: '法国' }, currency: 'EUR', timeZones: ['Europe/Paris'] },
  { code: 'DE', name: { en: 'Germany', zh: '德国' }, currency: 'EUR', timeZones: ['Europe/Berlin'] },
  { code: 'GR', name: { en: 'Greece', zh: '希腊' }, currency: 'EUR', timeZones: ['Europe/Athens'] },
  { code: 'IN', name: { en: 'India', zh: '印度' }, currency: 'INR', timeZones: ['Asia/Kolkata'] },
  { code: 'ID', name: { en: 'Indonesia', zh: '印度尼西亚' }, currency: 'IDR', timeZones: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] },
  { code: 'IR', name: { en: 'Iran', zh: '伊朗' }, currency: 'IRR', timeZones: ['Asia/Tehran'] },
  { code: 'IE', name: { en: 'Ireland', zh: '爱尔兰' }, currency: 'EUR', timeZones: ['Europe/Dublin'] },
  { code: 'IL', name: { en: 'Israel', zh: '以色列' }, currency: 'ILS', timeZones: ['Asia/Jerusalem'] },
  { code: 'IT', name: { en: 'Italy', zh: '意大利' }, currency: 'EUR', timeZones: ['Europe/Rome'] },
  { code: 'JO', name: { en: 'Jordan', zh: '约旦' }, currency: 'JOD', timeZones: ['Asia/Amman'] },
  { code: 'KZ', name: { en: 'Kazakhstan', zh: '哈萨克斯坦' }, currency: 'KZT', timeZones: ['Asia/Almaty'] },
  { code: 'LB', name: { en: 'Lebanon', zh: '黎巴嫩' }, currency: 'USD', timeZones: ['Asia/Beirut'] },
  { code: 'LT', name: { en: 'Lithuania', zh: '立陶宛' }, currency: 'EUR', timeZones: ['Europe/Vilnius'] },
  { code: 'LU', name: { en: 'Luxembourg', zh: '卢森堡' }, currency: 'EUR', timeZones: ['Europe/Luxembourg'] },
  { code: 'MY', name: { en: 'Malaysia', zh: '马来西亚' }, currency: 'MYR', timeZones: ['Asia/Kuala_Lumpur'] },
  { code: 'MX', name: { en: 'Mexico', zh: '墨西哥' }, currency: 'MXN', timeZones: ['America/Mexico_City', 'America/Monterrey', 'America/Tijuana'] },
  { code: 'NL', name: { en: 'Netherlands', zh: '荷兰' }, currency: 'EUR', timeZones: ['Europe/Amsterdam'] },
  { code: 'NO', name: { en: 'Norway', zh: '挪威' }, currency: 'NOK', timeZones: ['Europe/Oslo'] },
  { code: 'OM', name: { en: 'Oman', zh: '阿曼' }, currency: 'OMR', timeZones: ['Asia/Muscat'] },
  { code: 'PK', name: { en: 'Pakistan', zh: '巴基斯坦' }, currency: 'PKR', timeZones: ['Asia/Karachi'] },
  { code: 'PE', name: { en: 'Peru', zh: '秘鲁' }, currency: 'PEN', timeZones: ['America/Lima'] },
  { code: 'PH', name: { en: 'Philippines', zh: '菲律宾' }, currency: 'PHP', timeZones: ['Asia/Manila'] },
  { code: 'PL', name: { en: 'Poland', zh: '波兰' }, currency: 'PLN', timeZones: ['Europe/Warsaw'] },
  { code: 'PT', name: { en: 'Portugal', zh: '葡萄牙' }, currency: 'EUR', timeZones: ['Europe/Lisbon'] },
  { code: 'QA', name: { en: 'Qatar', zh: '卡塔尔' }, currency: 'QAR', timeZones: ['Asia/Qatar'] },
  { code: 'RU', name: { en: 'Russia', zh: '俄罗斯' }, currency: 'RUB', timeZones: ['Europe/Moscow', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok'] },
  { code: 'SA', name: { en: 'Saudi Arabia', zh: '沙特阿拉伯' }, currency: 'SAR', timeZones: ['Asia/Riyadh'] },
  { code: 'ZA', name: { en: 'South Africa', zh: '南非' }, currency: 'ZAR', timeZones: ['Africa/Johannesburg'] },
  { code: 'ES', name: { en: 'Spain', zh: '西班牙' }, currency: 'EUR', timeZones: ['Europe/Madrid'] },
  { code: 'SE', name: { en: 'Sweden', zh: '瑞典' }, currency: 'SEK', timeZones: ['Europe/Stockholm'] },
  { code: 'CH', name: { en: 'Switzerland', zh: '瑞士' }, currency: 'CHF', timeZones: ['Europe/Zurich'] },
  { code: 'TH', name: { en: 'Thailand', zh: '泰国' }, currency: 'THB', timeZones: ['Asia/Bangkok'] },
  { code: 'TR', name: { en: 'Türkiye', zh: '土耳其' }, currency: 'TRY', timeZones: ['Europe/Istanbul'] },
  { code: 'AE', name: { en: 'United Arab Emirates', zh: '阿联酋' }, currency: 'AED', timeZones: ['Asia/Dubai'] },
  { code: 'UZ', name: { en: 'Uzbekistan', zh: '乌兹别克斯坦' }, currency: 'UZS', timeZones: ['Asia/Tashkent'] },
  { code: 'OTHER', name: { en: 'Other', zh: '其他地区' }, currency: 'USD', timeZones: ['UTC'] },
];

export function findRegion(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code.toUpperCase());
}

/** Currencies offered in pickers. Any valid ISO 4217 code is still accepted on import. */
export const CURRENCIES = [
  'CNY', 'HKD', 'MOP', 'TWD', 'USD', 'GBP', 'EUR', 'AUD', 'CAD', 'NZD', 'SGD', 'JPY', 'KRW', 'CHF',
  'MYR', 'THB', 'INR', 'SEK', 'DKK', 'NOK', 'AED', 'SAR',
];

/** All IANA time zones the browser knows, for the "other" case. */
export function allTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return REGIONS.flatMap((r) => r.timeZones);
  }
}

/** Best guess of the user's region from the browser's time zone, for setup defaults. */
export function guessRegion(): Region {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return REGIONS.find((r) => r.code !== 'OTHER' && r.timeZones.includes(tz)) ?? REGIONS[0]!;
}
