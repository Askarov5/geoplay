/**
 * Country adjacency graph — land borders only.
 * Each key is an ISO 3166-1 alpha-2 code.
 * Each value is an array of neighboring country codes.
 *
 * Island nations with no land borders are excluded from this graph
 * (they cannot participate in Connect Countries mode).
 */
export const adjacencyGraph: Record<string, string[]> = {
  // ─── EUROPE ───
  AL: ["ME", "XK", "MK", "GR"], // Albania
  AD: ["FR", "ES"], // Andorra
  AT: ["DE", "CZ", "SK", "HU", "SI", "IT", "CH", "LI"], // Austria
  BY: ["PL", "LT", "LV", "RU", "UA"], // Belarus
  BE: ["FR", "LU", "DE", "NL"], // Belgium
  BA: ["HR", "RS", "ME"], // Bosnia and Herzegovina
  BG: ["RO", "RS", "MK", "GR", "TR"], // Bulgaria
  HR: ["SI", "HU", "RS", "BA", "ME"], // Croatia
  CZ: ["DE", "PL", "SK", "AT"], // Czech Republic
  DK: ["DE"], // Denmark
  EE: ["LV", "RU"], // Estonia
  FI: ["NO", "SE", "RU"], // Finland
  FR: ["BE", "LU", "DE", "CH", "IT", "MC", "ES", "AD"], // France
  DE: ["DK", "PL", "CZ", "AT", "CH", "FR", "LU", "BE", "NL"], // Germany
  GR: ["AL", "MK", "BG", "TR"], // Greece
  HU: ["AT", "SK", "UA", "RO", "RS", "HR", "SI"], // Hungary
  IE: ["GB"], // Ireland
  IT: ["FR", "CH", "AT", "SI", "SM", "VA"], // Italy
  XK: ["RS", "MK", "AL", "ME"], // Kosovo
  LV: ["EE", "LT", "RU", "BY"], // Latvia
  LI: ["AT", "CH"], // Liechtenstein
  LT: ["LV", "BY", "PL", "RU"], // Lithuania
  LU: ["BE", "DE", "FR"], // Luxembourg
  MK: ["RS", "BG", "GR", "AL", "XK"], // North Macedonia
  MD: ["RO", "UA"], // Moldova
  MC: ["FR"], // Monaco
  ME: ["HR", "BA", "RS", "XK", "AL"], // Montenegro
  NL: ["BE", "DE"], // Netherlands
  NO: ["SE", "FI", "RU"], // Norway
  PL: ["DE", "CZ", "SK", "UA", "BY", "LT", "RU"], // Poland
  PT: ["ES"], // Portugal
  RO: ["UA", "MD", "BG", "RS", "HU"], // Romania
  RU: ["NO", "FI", "EE", "LV", "LT", "PL", "BY", "UA", "GE", "AZ", "KZ", "CN", "MN", "KP"], // Russia
  SM: ["IT"], // San Marino
  RS: ["HU", "RO", "BG", "MK", "XK", "ME", "BA", "HR"], // Serbia
  SK: ["PL", "CZ", "AT", "HU", "UA"], // Slovakia
  SI: ["IT", "AT", "HU", "HR"], // Slovenia
  ES: ["PT", "FR", "AD", "MA"], // Spain (includes Ceuta/Melilla border with Morocco)
  SE: ["NO", "FI"], // Sweden
  CH: ["DE", "FR", "IT", "AT", "LI"], // Switzerland
  UA: ["PL", "SK", "HU", "RO", "MD", "BY", "RU"], // Ukraine
  GB: ["IE"], // United Kingdom
  VA: ["IT"], // Vatican City

  // ─── ASIA ───
  AF: ["PK", "IR", "TM", "UZ", "TJ", "CN"], // Afghanistan
  AM: ["GE", "AZ", "TR", "IR"], // Armenia
  AZ: ["RU", "GE", "AM", "IR", "TR"], // Azerbaijan
  BD: ["IN", "MM"], // Bangladesh
  BT: ["IN", "CN"], // Bhutan
  BN: ["MY"], // Brunei
  KH: ["TH", "LA", "VN"], // Cambodia
  CN: ["RU", "MN", "KP", "VN", "LA", "MM", "IN", "BT", "NP", "PK", "AF", "TJ", "KG", "KZ"], // China
  GE: ["RU", "AZ", "AM", "TR"], // Georgia
  IN: ["PK", "CN", "NP", "BT", "BD", "MM"], // India
  ID: ["MY", "PG", "TL"], // Indonesia
  IR: ["IQ", "TR", "AM", "AZ", "TM", "AF", "PK"], // Iran
  IQ: ["TR", "SY", "JO", "SA", "KW", "IR"], // Iraq
  IL: ["LB", "SY", "JO", "EG", "PS"], // Israel
  JO: ["SY", "IQ", "SA", "IL", "PS"], // Jordan
  KZ: ["RU", "CN", "KG", "UZ", "TM"], // Kazakhstan
  KW: ["IQ", "SA"], // Kuwait
  KG: ["KZ", "CN", "TJ", "UZ"], // Kyrgyzstan
  LA: ["MM", "CN", "VN", "KH", "TH"], // Laos
  LB: ["SY", "IL"], // Lebanon
  MY: ["TH", "BN", "ID"], // Malaysia
  MN: ["RU", "CN"], // Mongolia
  MM: ["IN", "BD", "CN", "LA", "TH"], // Myanmar
  NP: ["IN", "CN"], // Nepal
  KP: ["CN", "KR", "RU"], // North Korea
  OM: ["AE", "SA", "YE"], // Oman
  PK: ["IN", "AF", "IR", "CN"], // Pakistan
  PS: ["IL", "EG", "JO"], // Palestine
  QA: ["SA"], // Qatar
  SA: ["JO", "IQ", "KW", "QA", "AE", "OM", "YE"], // Saudi Arabia
  KR: ["KP"], // South Korea
  SY: ["TR", "IQ", "JO", "IL", "LB"], // Syria
  TJ: ["KG", "CN", "AF", "UZ"], // Tajikistan
  TH: ["MM", "LA", "KH", "MY"], // Thailand
  TL: ["ID"], // Timor-Leste
  TR: ["GR", "BG", "GE", "AM", "AZ", "IR", "IQ", "SY"], // Turkey
  TM: ["KZ", "UZ", "AF", "IR"], // Turkmenistan
  AE: ["SA", "OM"], // United Arab Emirates
  UZ: ["KZ", "TJ", "KG", "AF", "TM"], // Uzbekistan
  VN: ["CN", "LA", "KH"], // Vietnam
  YE: ["SA", "OM"], // Yemen

  // ─── AFRICA ───
  DZ: ["TN", "LY", "NE", "ML", "MR", "MA"], // Algeria (Western Sahara counted as Morocco)
  AO: ["CD", "CG", "ZM", "NA"], // Angola
  BJ: ["TG", "BF", "NE", "NG"], // Benin
  BW: ["ZA", "NA", "ZM", "ZW"], // Botswana
  BF: ["ML", "NE", "BJ", "TG", "GH", "CI"], // Burkina Faso
  BI: ["CD", "RW", "TZ"], // Burundi
  CM: ["NG", "TD", "CF", "CG", "GA", "GQ"], // Cameroon
  CF: ["CM", "TD", "SD", "SS", "CD", "CG"], // Central African Republic
  TD: ["LY", "NE", "NG", "CM", "CF", "SD"], // Chad
  CG: ["GA", "CM", "CF", "CD", "AO"], // Republic of the Congo
  CD: ["CG", "CF", "SS", "UG", "RW", "BI", "TZ", "ZM", "AO"], // DR Congo
  CI: ["LR", "GN", "ML", "BF", "GH"], // Ivory Coast
  DJ: ["ER", "ET", "SO"], // Djibouti
  EG: ["IL", "PS", "LY", "SD"], // Egypt
  GQ: ["CM", "GA"], // Equatorial Guinea
  ER: ["SD", "ET", "DJ"], // Eritrea
  SZ: ["ZA", "MZ"], // Eswatini
  ET: ["ER", "DJ", "SO", "KE", "SS", "SD"], // Ethiopia
  GA: ["CM", "GQ", "CG"], // Gabon
  GM: ["SN"], // Gambia
  GH: ["CI", "BF", "TG"], // Ghana
  GN: ["GW", "SN", "ML", "CI", "LR", "SL"], // Guinea
  GW: ["SN", "GN"], // Guinea-Bissau
  KE: ["ET", "SO", "TZ", "UG", "SS"], // Kenya
  LS: ["ZA"], // Lesotho
  LR: ["GN", "CI", "SL"], // Liberia
  LY: ["TN", "DZ", "NE", "TD", "SD", "EG"], // Libya
  MW: ["TZ", "MZ", "ZM"], // Malawi
  ML: ["DZ", "NE", "BF", "CI", "GN", "SN", "MR"], // Mali
  MR: ["MA", "DZ", "ML", "SN"], // Mauritania (Western Sahara as Morocco)
  MA: ["DZ", "MR", "ES"], // Morocco (includes Western Sahara borders)
  MZ: ["TZ", "MW", "ZM", "ZW", "ZA", "SZ"], // Mozambique
  NA: ["AO", "ZM", "BW", "ZA"], // Namibia
  NE: ["DZ", "LY", "TD", "NG", "BJ", "BF", "ML"], // Niger
  NG: ["BJ", "NE", "TD", "CM"], // Nigeria
  RW: ["UG", "TZ", "BI", "CD"], // Rwanda
  SN: ["MR", "ML", "GN", "GW", "GM"], // Senegal
  SL: ["GN", "LR"], // Sierra Leone
  SO: ["ET", "DJ", "KE"], // Somalia
  ZA: ["NA", "BW", "ZW", "MZ", "SZ", "LS"], // South Africa
  SS: ["SD", "ET", "KE", "UG", "CD", "CF"], // South Sudan
  SD: ["EG", "LY", "TD", "CF", "SS", "ET", "ER"], // Sudan
  TZ: ["KE", "UG", "RW", "BI", "CD", "ZM", "MW", "MZ"], // Tanzania
  TG: ["GH", "BF", "BJ"], // Togo
  TN: ["DZ", "LY"], // Tunisia
  UG: ["SS", "KE", "TZ", "RW", "CD"], // Uganda
  ZM: ["CD", "TZ", "MW", "MZ", "ZW", "BW", "NA", "AO"], // Zambia
  ZW: ["ZM", "MZ", "ZA", "BW"], // Zimbabwe

  // ─── NORTH AMERICA ───
  CA: ["US"], // Canada
  US: ["CA", "MX"], // United States
  MX: ["US", "GT", "BZ"], // Mexico
  GT: ["MX", "BZ", "HN", "SV"], // Guatemala
  BZ: ["MX", "GT"], // Belize
  SV: ["GT", "HN"], // El Salvador
  HN: ["GT", "SV", "NI"], // Honduras
  NI: ["HN", "CR"], // Nicaragua
  CR: ["NI", "PA"], // Costa Rica
  PA: ["CR", "CO"], // Panama
  HT: ["DO"], // Haiti
  DO: ["HT"], // Dominican Republic

  // ─── SOUTH AMERICA ───
  CO: ["PA", "VE", "BR", "PE", "EC"], // Colombia
  VE: ["CO", "BR", "GY"], // Venezuela
  GY: ["VE", "BR", "SR"], // Guyana
  SR: ["GY", "BR", "GF"], // Suriname
  GF: ["SR", "BR"], // French Guiana
  BR: ["GF", "SR", "GY", "VE", "CO", "PE", "BO", "PY", "AR", "UY"], // Brazil
  EC: ["CO", "PE"], // Ecuador
  PE: ["EC", "CO", "BR", "BO", "CL"], // Peru
  BO: ["PE", "BR", "PY", "AR", "CL"], // Bolivia
  CL: ["PE", "BO", "AR"], // Chile
  AR: ["CL", "BO", "PY", "BR", "UY"], // Argentina
  PY: ["BO", "BR", "AR"], // Paraguay
  UY: ["BR", "AR"], // Uruguay
};

/**
 * Set of country codes that have land borders (usable in Connect Countries mode).
 */
export const connectedCountryCodes = new Set(Object.keys(adjacencyGraph));

/**
 * Island nations / countries with no land borders.
 * These cannot be start/end points in Connect Countries.
 */
export const islandNations = [
  "IS", "MT", "CY", "BH", "MV", "SG", "LK", "JP", "TW", "PH",
  "KM", "MG", "MU", "SC", "ST", "CV",
  "AG", "BS", "BB", "CU", "DM", "GD", "JM", "KN", "LC", "VC", "TT",
  "AU", "NZ", "FJ", "PG", "WS", "SB", "TO", "VU",
];
