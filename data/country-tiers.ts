import type { Difficulty } from "@/lib/game-engine/types";

/**
 * Country tier system for difficulty-based filtering.
 *
 * Tier 1 — Well-known countries: large, distinctive shape, globally recognized (pop >20M or very famous)
 * Tier 2 — Moderately known: regional significance, medium-sized, recognizable to geography enthusiasts
 * Tier 3 — Obscure/micro: small, micro-states, easily confused, or rarely referenced
 *
 * Used by games to scale the country pool:
 *   Easy   → Tier 1 only
 *   Medium → Tier 1 + 2
 *   Hard   → All tiers (1 + 2 + 3)
 */
export type CountryTier = 1 | 2 | 3;

export const countryTiers: Record<string, CountryTier> = {
  // ─── EUROPE ───
  AL: 2, // Albania
  AD: 3, // Andorra
  AT: 2, // Austria
  BY: 2, // Belarus
  BE: 2, // Belgium
  BA: 3, // Bosnia and Herzegovina
  BG: 2, // Bulgaria
  HR: 2, // Croatia
  CZ: 2, // Czech Republic
  DK: 2, // Denmark
  EE: 3, // Estonia
  FI: 2, // Finland
  FR: 1, // France
  DE: 1, // Germany
  GR: 1, // Greece
  HU: 2, // Hungary
  IS: 2, // Iceland
  IE: 2, // Ireland
  IT: 1, // Italy
  XK: 3, // Kosovo
  LV: 3, // Latvia
  LI: 3, // Liechtenstein
  LT: 3, // Lithuania
  LU: 3, // Luxembourg
  MK: 3, // North Macedonia
  MT: 3, // Malta
  MD: 3, // Moldova
  MC: 3, // Monaco
  ME: 3, // Montenegro
  NL: 2, // Netherlands
  NO: 1, // Norway
  PL: 1, // Poland
  PT: 2, // Portugal
  RO: 2, // Romania
  RU: 1, // Russia
  SM: 3, // San Marino
  RS: 2, // Serbia
  SK: 3, // Slovakia
  SI: 3, // Slovenia
  ES: 1, // Spain
  SE: 1, // Sweden
  CH: 2, // Switzerland
  UA: 1, // Ukraine
  GB: 1, // United Kingdom
  VA: 3, // Vatican City

  // ─── ASIA ───
  AF: 2, // Afghanistan
  AM: 3, // Armenia
  AZ: 3, // Azerbaijan
  BH: 3, // Bahrain
  BD: 2, // Bangladesh
  BT: 3, // Bhutan
  BN: 3, // Brunei
  KH: 2, // Cambodia
  CN: 1, // China
  CY: 3, // Cyprus
  GE: 3, // Georgia
  IN: 1, // India
  ID: 1, // Indonesia
  IR: 1, // Iran
  IQ: 1, // Iraq
  IL: 2, // Israel
  JP: 1, // Japan
  JO: 2, // Jordan
  KZ: 2, // Kazakhstan
  KW: 3, // Kuwait
  KG: 3, // Kyrgyzstan
  LA: 3, // Laos
  LB: 3, // Lebanon
  MY: 2, // Malaysia
  MV: 3, // Maldives
  MN: 2, // Mongolia
  MM: 2, // Myanmar
  NP: 2, // Nepal
  KP: 2, // North Korea
  OM: 3, // Oman
  PK: 1, // Pakistan
  PS: 3, // Palestine
  PH: 2, // Philippines
  QA: 3, // Qatar
  SA: 1, // Saudi Arabia
  SG: 3, // Singapore
  KR: 1, // South Korea
  LK: 2, // Sri Lanka
  SY: 2, // Syria
  TW: 2, // Taiwan
  TJ: 3, // Tajikistan
  TH: 1, // Thailand
  TL: 3, // Timor-Leste
  TR: 1, // Turkey
  TM: 3, // Turkmenistan
  AE: 2, // United Arab Emirates
  UZ: 3, // Uzbekistan
  VN: 1, // Vietnam
  YE: 2, // Yemen

  // ─── AFRICA ───
  DZ: 1, // Algeria
  AO: 2, // Angola
  BJ: 3, // Benin
  BW: 3, // Botswana
  BF: 3, // Burkina Faso
  BI: 3, // Burundi
  CV: 3, // Cape Verde
  CM: 2, // Cameroon
  CF: 3, // Central African Republic
  TD: 2, // Chad
  KM: 3, // Comoros
  CG: 3, // Republic of the Congo
  CD: 1, // Democratic Republic of the Congo
  CI: 2, // Ivory Coast
  DJ: 3, // Djibouti
  EG: 1, // Egypt
  GQ: 3, // Equatorial Guinea
  ER: 3, // Eritrea
  SZ: 3, // Eswatini
  ET: 1, // Ethiopia
  GA: 3, // Gabon
  GM: 3, // Gambia
  GH: 2, // Ghana
  GN: 3, // Guinea
  GW: 3, // Guinea-Bissau
  KE: 1, // Kenya
  LS: 3, // Lesotho
  LR: 3, // Liberia
  LY: 2, // Libya
  MG: 2, // Madagascar
  MW: 3, // Malawi
  ML: 2, // Mali
  MR: 3, // Mauritania
  MU: 3, // Mauritius
  MA: 2, // Morocco
  MZ: 2, // Mozambique
  NA: 2, // Namibia
  NE: 2, // Niger
  NG: 1, // Nigeria
  RW: 3, // Rwanda
  ST: 3, // Sao Tome and Principe
  SN: 2, // Senegal
  SC: 3, // Seychelles
  SL: 3, // Sierra Leone
  SO: 2, // Somalia
  ZA: 1, // South Africa
  SS: 3, // South Sudan
  SD: 2, // Sudan
  TZ: 1, // Tanzania
  TG: 3, // Togo
  TN: 2, // Tunisia
  UG: 2, // Uganda
  ZM: 2, // Zambia
  ZW: 2, // Zimbabwe

  // ─── NORTH AMERICA ───
  AG: 3, // Antigua and Barbuda
  BS: 3, // Bahamas
  BB: 3, // Barbados
  BZ: 3, // Belize
  CA: 1, // Canada
  CR: 2, // Costa Rica
  CU: 1, // Cuba
  DM: 3, // Dominica
  DO: 2, // Dominican Republic
  SV: 3, // El Salvador
  GD: 3, // Grenada
  GT: 2, // Guatemala
  HT: 2, // Haiti
  HN: 3, // Honduras
  JM: 2, // Jamaica
  MX: 1, // Mexico
  NI: 3, // Nicaragua
  PA: 2, // Panama
  KN: 3, // Saint Kitts and Nevis
  LC: 3, // Saint Lucia
  VC: 3, // Saint Vincent and the Grenadines
  TT: 3, // Trinidad and Tobago
  US: 1, // United States

  // ─── SOUTH AMERICA ───
  AR: 1, // Argentina
  BO: 2, // Bolivia
  BR: 1, // Brazil
  CL: 1, // Chile
  CO: 1, // Colombia
  EC: 2, // Ecuador
  GY: 3, // Guyana
  PY: 2, // Paraguay
  PE: 1, // Peru
  SR: 3, // Suriname
  UY: 2, // Uruguay
  VE: 1, // Venezuela
  GF: 3, // French Guiana

  // ─── OCEANIA ───
  AU: 1, // Australia
  FJ: 3, // Fiji
  NZ: 1, // New Zealand
  PG: 2, // Papua New Guinea
  WS: 3, // Samoa
  SB: 3, // Solomon Islands
  TO: 3, // Tonga
  VU: 3, // Vanuatu
};

/** Get the tier for a country code (defaults to tier 3 if not found) */
export function getCountryTier(code: string): CountryTier {
  return countryTiers[code] ?? 3;
}

/** Get the maximum tier allowed for a given difficulty */
export function getMaxTierForDifficulty(difficulty: Difficulty): CountryTier {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
  }
}
