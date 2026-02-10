export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  capital: string;
  continent: string;
  coordinates: [number, number]; // [lat, lng]
}

export const countries: Country[] = [
  // ─── EUROPE ───
  { code: "AL", name: "Albania", capital: "Tirana", continent: "Europe", coordinates: [41.15, 20.17] },
  { code: "AD", name: "Andorra", capital: "Andorra la Vella", continent: "Europe", coordinates: [42.55, 1.6] },
  { code: "AT", name: "Austria", capital: "Vienna", continent: "Europe", coordinates: [47.52, 14.55] },
  { code: "BY", name: "Belarus", capital: "Minsk", continent: "Europe", coordinates: [53.71, 27.97] },
  { code: "BE", name: "Belgium", capital: "Brussels", continent: "Europe", coordinates: [50.85, 4.35] },
  { code: "BA", name: "Bosnia and Herzegovina", capital: "Sarajevo", continent: "Europe", coordinates: [43.87, 17.68] },
  { code: "BG", name: "Bulgaria", capital: "Sofia", continent: "Europe", coordinates: [42.73, 25.49] },
  { code: "HR", name: "Croatia", capital: "Zagreb", continent: "Europe", coordinates: [45.1, 15.2] },
  { code: "CZ", name: "Czech Republic", capital: "Prague", continent: "Europe", coordinates: [49.82, 15.47] },
  { code: "DK", name: "Denmark", capital: "Copenhagen", continent: "Europe", coordinates: [56.26, 9.5] },
  { code: "EE", name: "Estonia", capital: "Tallinn", continent: "Europe", coordinates: [58.6, 25.01] },
  { code: "FI", name: "Finland", capital: "Helsinki", continent: "Europe", coordinates: [61.92, 25.75] },
  { code: "FR", name: "France", capital: "Paris", continent: "Europe", coordinates: [46.23, 2.21] },
  { code: "DE", name: "Germany", capital: "Berlin", continent: "Europe", coordinates: [51.17, 10.45] },
  { code: "GR", name: "Greece", capital: "Athens", continent: "Europe", coordinates: [39.07, 21.82] },
  { code: "HU", name: "Hungary", capital: "Budapest", continent: "Europe", coordinates: [47.16, 19.5] },
  { code: "IS", name: "Iceland", capital: "Reykjavik", continent: "Europe", coordinates: [64.96, -19.02] },
  { code: "IE", name: "Ireland", capital: "Dublin", continent: "Europe", coordinates: [53.41, -8.24] },
  { code: "IT", name: "Italy", capital: "Rome", continent: "Europe", coordinates: [41.87, 12.57] },
  { code: "XK", name: "Kosovo", capital: "Pristina", continent: "Europe", coordinates: [42.6, 20.9] },
  { code: "LV", name: "Latvia", capital: "Riga", continent: "Europe", coordinates: [56.88, 24.6] },
  { code: "LI", name: "Liechtenstein", capital: "Vaduz", continent: "Europe", coordinates: [47.17, 9.52] },
  { code: "LT", name: "Lithuania", capital: "Vilnius", continent: "Europe", coordinates: [55.17, 23.88] },
  { code: "LU", name: "Luxembourg", capital: "Luxembourg City", continent: "Europe", coordinates: [49.82, 6.13] },
  { code: "MK", name: "North Macedonia", capital: "Skopje", continent: "Europe", coordinates: [41.51, 21.75] },
  { code: "MT", name: "Malta", capital: "Valletta", continent: "Europe", coordinates: [35.94, 14.38] },
  { code: "MD", name: "Moldova", capital: "Chisinau", continent: "Europe", coordinates: [47.41, 28.37] },
  { code: "MC", name: "Monaco", capital: "Monaco", continent: "Europe", coordinates: [43.75, 7.42] },
  { code: "ME", name: "Montenegro", capital: "Podgorica", continent: "Europe", coordinates: [42.71, 19.37] },
  { code: "NL", name: "Netherlands", capital: "Amsterdam", continent: "Europe", coordinates: [52.13, 5.29] },
  { code: "NO", name: "Norway", capital: "Oslo", continent: "Europe", coordinates: [60.47, 8.47] },
  { code: "PL", name: "Poland", capital: "Warsaw", continent: "Europe", coordinates: [51.92, 19.15] },
  { code: "PT", name: "Portugal", capital: "Lisbon", continent: "Europe", coordinates: [39.4, -8.22] },
  { code: "RO", name: "Romania", capital: "Bucharest", continent: "Europe", coordinates: [45.94, 24.97] },
  { code: "RU", name: "Russia", capital: "Moscow", continent: "Europe", coordinates: [61.52, 105.32] },
  { code: "SM", name: "San Marino", capital: "San Marino", continent: "Europe", coordinates: [43.94, 12.46] },
  { code: "RS", name: "Serbia", capital: "Belgrade", continent: "Europe", coordinates: [44.02, 21.01] },
  { code: "SK", name: "Slovakia", capital: "Bratislava", continent: "Europe", coordinates: [48.67, 19.7] },
  { code: "SI", name: "Slovenia", capital: "Ljubljana", continent: "Europe", coordinates: [46.15, 15.0] },
  { code: "ES", name: "Spain", capital: "Madrid", continent: "Europe", coordinates: [40.46, -3.75] },
  { code: "SE", name: "Sweden", capital: "Stockholm", continent: "Europe", coordinates: [60.13, 18.64] },
  { code: "CH", name: "Switzerland", capital: "Bern", continent: "Europe", coordinates: [46.82, 8.23] },
  { code: "UA", name: "Ukraine", capital: "Kyiv", continent: "Europe", coordinates: [48.38, 31.17] },
  { code: "GB", name: "United Kingdom", capital: "London", continent: "Europe", coordinates: [55.38, -3.44] },
  { code: "VA", name: "Vatican City", capital: "Vatican City", continent: "Europe", coordinates: [41.9, 12.45] },

  // ─── ASIA ───
  { code: "AF", name: "Afghanistan", capital: "Kabul", continent: "Asia", coordinates: [33.94, 67.71] },
  { code: "AM", name: "Armenia", capital: "Yerevan", continent: "Asia", coordinates: [40.07, 45.04] },
  { code: "AZ", name: "Azerbaijan", capital: "Baku", continent: "Asia", coordinates: [40.14, 47.58] },
  { code: "BH", name: "Bahrain", capital: "Manama", continent: "Asia", coordinates: [26.07, 50.55] },
  { code: "BD", name: "Bangladesh", capital: "Dhaka", continent: "Asia", coordinates: [23.68, 90.36] },
  { code: "BT", name: "Bhutan", capital: "Thimphu", continent: "Asia", coordinates: [27.51, 90.43] },
  { code: "BN", name: "Brunei", capital: "Bandar Seri Begawan", continent: "Asia", coordinates: [4.54, 114.73] },
  { code: "KH", name: "Cambodia", capital: "Phnom Penh", continent: "Asia", coordinates: [12.57, 104.99] },
  { code: "CN", name: "China", capital: "Beijing", continent: "Asia", coordinates: [35.86, 104.2] },
  { code: "CY", name: "Cyprus", capital: "Nicosia", continent: "Asia", coordinates: [35.13, 33.43] },
  { code: "GE", name: "Georgia", capital: "Tbilisi", continent: "Asia", coordinates: [42.32, 43.36] },
  { code: "IN", name: "India", capital: "New Delhi", continent: "Asia", coordinates: [20.59, 78.96] },
  { code: "ID", name: "Indonesia", capital: "Jakarta", continent: "Asia", coordinates: [-0.79, 113.92] },
  { code: "IR", name: "Iran", capital: "Tehran", continent: "Asia", coordinates: [32.43, 53.69] },
  { code: "IQ", name: "Iraq", capital: "Baghdad", continent: "Asia", coordinates: [33.22, 43.68] },
  { code: "IL", name: "Israel", capital: "Jerusalem", continent: "Asia", coordinates: [31.05, 34.85] },
  { code: "JP", name: "Japan", capital: "Tokyo", continent: "Asia", coordinates: [36.2, 138.25] },
  { code: "JO", name: "Jordan", capital: "Amman", continent: "Asia", coordinates: [30.59, 36.24] },
  { code: "KZ", name: "Kazakhstan", capital: "Astana", continent: "Asia", coordinates: [48.02, 66.92] },
  { code: "KW", name: "Kuwait", capital: "Kuwait City", continent: "Asia", coordinates: [29.31, 47.48] },
  { code: "KG", name: "Kyrgyzstan", capital: "Bishkek", continent: "Asia", coordinates: [41.2, 74.77] },
  { code: "LA", name: "Laos", capital: "Vientiane", continent: "Asia", coordinates: [19.86, 102.5] },
  { code: "LB", name: "Lebanon", capital: "Beirut", continent: "Asia", coordinates: [33.85, 35.86] },
  { code: "MY", name: "Malaysia", capital: "Kuala Lumpur", continent: "Asia", coordinates: [4.21, 101.98] },
  { code: "MV", name: "Maldives", capital: "Male", continent: "Asia", coordinates: [3.2, 73.22] },
  { code: "MN", name: "Mongolia", capital: "Ulaanbaatar", continent: "Asia", coordinates: [46.86, 103.85] },
  { code: "MM", name: "Myanmar", capital: "Naypyidaw", continent: "Asia", coordinates: [21.91, 95.96] },
  { code: "NP", name: "Nepal", capital: "Kathmandu", continent: "Asia", coordinates: [28.39, 84.12] },
  { code: "KP", name: "North Korea", capital: "Pyongyang", continent: "Asia", coordinates: [40.34, 127.51] },
  { code: "OM", name: "Oman", capital: "Muscat", continent: "Asia", coordinates: [21.51, 55.92] },
  { code: "PK", name: "Pakistan", capital: "Islamabad", continent: "Asia", coordinates: [30.38, 69.35] },
  { code: "PS", name: "Palestine", capital: "Ramallah", continent: "Asia", coordinates: [31.95, 35.23] },
  { code: "PH", name: "Philippines", capital: "Manila", continent: "Asia", coordinates: [12.88, 121.77] },
  { code: "QA", name: "Qatar", capital: "Doha", continent: "Asia", coordinates: [25.35, 51.18] },
  { code: "SA", name: "Saudi Arabia", capital: "Riyadh", continent: "Asia", coordinates: [23.89, 45.08] },
  { code: "SG", name: "Singapore", capital: "Singapore", continent: "Asia", coordinates: [1.35, 103.82] },
  { code: "KR", name: "South Korea", capital: "Seoul", continent: "Asia", coordinates: [35.91, 127.77] },
  { code: "LK", name: "Sri Lanka", capital: "Colombo", continent: "Asia", coordinates: [7.87, 80.77] },
  { code: "SY", name: "Syria", capital: "Damascus", continent: "Asia", coordinates: [34.8, 39.0] },
  { code: "TW", name: "Taiwan", capital: "Taipei", continent: "Asia", coordinates: [23.7, 120.96] },
  { code: "TJ", name: "Tajikistan", capital: "Dushanbe", continent: "Asia", coordinates: [38.86, 71.28] },
  { code: "TH", name: "Thailand", capital: "Bangkok", continent: "Asia", coordinates: [15.87, 100.99] },
  { code: "TL", name: "Timor-Leste", capital: "Dili", continent: "Asia", coordinates: [-8.87, 125.73] },
  { code: "TR", name: "Turkey", capital: "Ankara", continent: "Asia", coordinates: [38.96, 35.24] },
  { code: "TM", name: "Turkmenistan", capital: "Ashgabat", continent: "Asia", coordinates: [38.97, 59.56] },
  { code: "AE", name: "United Arab Emirates", capital: "Abu Dhabi", continent: "Asia", coordinates: [23.42, 53.85] },
  { code: "UZ", name: "Uzbekistan", capital: "Tashkent", continent: "Asia", coordinates: [41.38, 64.59] },
  { code: "VN", name: "Vietnam", capital: "Hanoi", continent: "Asia", coordinates: [14.06, 108.28] },
  { code: "YE", name: "Yemen", capital: "Sanaa", continent: "Asia", coordinates: [15.55, 48.52] },

  // ─── AFRICA ───
  { code: "DZ", name: "Algeria", capital: "Algiers", continent: "Africa", coordinates: [28.03, 1.66] },
  { code: "AO", name: "Angola", capital: "Luanda", continent: "Africa", coordinates: [-11.2, 17.87] },
  { code: "BJ", name: "Benin", capital: "Porto-Novo", continent: "Africa", coordinates: [9.31, 2.32] },
  { code: "BW", name: "Botswana", capital: "Gaborone", continent: "Africa", coordinates: [-22.33, 24.68] },
  { code: "BF", name: "Burkina Faso", capital: "Ouagadougou", continent: "Africa", coordinates: [12.24, -1.56] },
  { code: "BI", name: "Burundi", capital: "Gitega", continent: "Africa", coordinates: [-3.37, 29.92] },
  { code: "CV", name: "Cape Verde", capital: "Praia", continent: "Africa", coordinates: [16.0, -24.01] },
  { code: "CM", name: "Cameroon", capital: "Yaounde", continent: "Africa", coordinates: [7.37, 12.35] },
  { code: "CF", name: "Central African Republic", capital: "Bangui", continent: "Africa", coordinates: [6.61, 20.94] },
  { code: "TD", name: "Chad", capital: "N'Djamena", continent: "Africa", coordinates: [15.45, 18.73] },
  { code: "KM", name: "Comoros", capital: "Moroni", continent: "Africa", coordinates: [-11.88, 43.87] },
  { code: "CG", name: "Republic of the Congo", capital: "Brazzaville", continent: "Africa", coordinates: [-0.23, 15.83] },
  { code: "CD", name: "Democratic Republic of the Congo", capital: "Kinshasa", continent: "Africa", coordinates: [-4.04, 21.76] },
  { code: "CI", name: "Ivory Coast", capital: "Yamoussoukro", continent: "Africa", coordinates: [7.54, -5.55] },
  { code: "DJ", name: "Djibouti", capital: "Djibouti", continent: "Africa", coordinates: [11.83, 42.59] },
  { code: "EG", name: "Egypt", capital: "Cairo", continent: "Africa", coordinates: [26.82, 30.8] },
  { code: "GQ", name: "Equatorial Guinea", capital: "Malabo", continent: "Africa", coordinates: [1.65, 10.27] },
  { code: "ER", name: "Eritrea", capital: "Asmara", continent: "Africa", coordinates: [15.18, 39.78] },
  { code: "SZ", name: "Eswatini", capital: "Mbabane", continent: "Africa", coordinates: [-26.52, 31.47] },
  { code: "ET", name: "Ethiopia", capital: "Addis Ababa", continent: "Africa", coordinates: [9.15, 40.49] },
  { code: "GA", name: "Gabon", capital: "Libreville", continent: "Africa", coordinates: [-0.8, 11.61] },
  { code: "GM", name: "Gambia", capital: "Banjul", continent: "Africa", coordinates: [13.44, -15.31] },
  { code: "GH", name: "Ghana", capital: "Accra", continent: "Africa", coordinates: [7.95, -1.02] },
  { code: "GN", name: "Guinea", capital: "Conakry", continent: "Africa", coordinates: [9.95, -11.36] },
  { code: "GW", name: "Guinea-Bissau", capital: "Bissau", continent: "Africa", coordinates: [11.8, -15.18] },
  { code: "KE", name: "Kenya", capital: "Nairobi", continent: "Africa", coordinates: [-0.02, 37.91] },
  { code: "LS", name: "Lesotho", capital: "Maseru", continent: "Africa", coordinates: [-29.61, 28.23] },
  { code: "LR", name: "Liberia", capital: "Monrovia", continent: "Africa", coordinates: [6.43, -9.43] },
  { code: "LY", name: "Libya", capital: "Tripoli", continent: "Africa", coordinates: [26.34, 17.23] },
  { code: "MG", name: "Madagascar", capital: "Antananarivo", continent: "Africa", coordinates: [-18.77, 46.87] },
  { code: "MW", name: "Malawi", capital: "Lilongwe", continent: "Africa", coordinates: [-13.25, 34.3] },
  { code: "ML", name: "Mali", capital: "Bamako", continent: "Africa", coordinates: [17.57, -4.0] },
  { code: "MR", name: "Mauritania", capital: "Nouakchott", continent: "Africa", coordinates: [21.01, -10.94] },
  { code: "MU", name: "Mauritius", capital: "Port Louis", continent: "Africa", coordinates: [-20.35, 57.55] },
  { code: "MA", name: "Morocco", capital: "Rabat", continent: "Africa", coordinates: [31.79, -7.09] },
  { code: "MZ", name: "Mozambique", capital: "Maputo", continent: "Africa", coordinates: [-18.67, 35.53] },
  { code: "NA", name: "Namibia", capital: "Windhoek", continent: "Africa", coordinates: [-22.96, 18.49] },
  { code: "NE", name: "Niger", capital: "Niamey", continent: "Africa", coordinates: [17.61, 8.08] },
  { code: "NG", name: "Nigeria", capital: "Abuja", continent: "Africa", coordinates: [9.08, 8.68] },
  { code: "RW", name: "Rwanda", capital: "Kigali", continent: "Africa", coordinates: [-1.94, 29.87] },
  { code: "ST", name: "Sao Tome and Principe", capital: "Sao Tome", continent: "Africa", coordinates: [0.19, 6.61] },
  { code: "SN", name: "Senegal", capital: "Dakar", continent: "Africa", coordinates: [14.5, -14.45] },
  { code: "SC", name: "Seychelles", capital: "Victoria", continent: "Africa", coordinates: [-4.68, 55.49] },
  { code: "SL", name: "Sierra Leone", capital: "Freetown", continent: "Africa", coordinates: [8.46, -11.78] },
  { code: "SO", name: "Somalia", capital: "Mogadishu", continent: "Africa", coordinates: [5.15, 46.2] },
  { code: "ZA", name: "South Africa", capital: "Pretoria", continent: "Africa", coordinates: [-30.56, 22.94] },
  { code: "SS", name: "South Sudan", capital: "Juba", continent: "Africa", coordinates: [6.88, 31.31] },
  { code: "SD", name: "Sudan", capital: "Khartoum", continent: "Africa", coordinates: [12.86, 30.22] },
  { code: "TZ", name: "Tanzania", capital: "Dodoma", continent: "Africa", coordinates: [-6.37, 34.89] },
  { code: "TG", name: "Togo", capital: "Lome", continent: "Africa", coordinates: [8.62, 0.82] },
  { code: "TN", name: "Tunisia", capital: "Tunis", continent: "Africa", coordinates: [33.89, 9.54] },
  { code: "UG", name: "Uganda", capital: "Kampala", continent: "Africa", coordinates: [1.37, 32.29] },
  { code: "ZM", name: "Zambia", capital: "Lusaka", continent: "Africa", coordinates: [-13.13, 27.85] },
  { code: "ZW", name: "Zimbabwe", capital: "Harare", continent: "Africa", coordinates: [-19.02, 29.15] },

  // ─── NORTH AMERICA ───
  { code: "AG", name: "Antigua and Barbuda", capital: "St. John's", continent: "North America", coordinates: [17.06, -61.8] },
  { code: "BS", name: "Bahamas", capital: "Nassau", continent: "North America", coordinates: [25.03, -77.4] },
  { code: "BB", name: "Barbados", capital: "Bridgetown", continent: "North America", coordinates: [13.19, -59.54] },
  { code: "BZ", name: "Belize", capital: "Belmopan", continent: "North America", coordinates: [17.19, -88.5] },
  { code: "CA", name: "Canada", capital: "Ottawa", continent: "North America", coordinates: [56.13, -106.35] },
  { code: "CR", name: "Costa Rica", capital: "San Jose", continent: "North America", coordinates: [9.75, -83.75] },
  { code: "CU", name: "Cuba", capital: "Havana", continent: "North America", coordinates: [21.52, -77.78] },
  { code: "DM", name: "Dominica", capital: "Roseau", continent: "North America", coordinates: [15.41, -61.37] },
  { code: "DO", name: "Dominican Republic", capital: "Santo Domingo", continent: "North America", coordinates: [18.74, -70.16] },
  { code: "SV", name: "El Salvador", capital: "San Salvador", continent: "North America", coordinates: [13.79, -88.9] },
  { code: "GD", name: "Grenada", capital: "St. George's", continent: "North America", coordinates: [12.26, -61.6] },
  { code: "GT", name: "Guatemala", capital: "Guatemala City", continent: "North America", coordinates: [15.78, -90.23] },
  { code: "HT", name: "Haiti", capital: "Port-au-Prince", continent: "North America", coordinates: [18.97, -72.29] },
  { code: "HN", name: "Honduras", capital: "Tegucigalpa", continent: "North America", coordinates: [15.2, -86.24] },
  { code: "JM", name: "Jamaica", capital: "Kingston", continent: "North America", coordinates: [18.11, -77.3] },
  { code: "MX", name: "Mexico", capital: "Mexico City", continent: "North America", coordinates: [23.63, -102.55] },
  { code: "NI", name: "Nicaragua", capital: "Managua", continent: "North America", coordinates: [12.87, -85.21] },
  { code: "PA", name: "Panama", capital: "Panama City", continent: "North America", coordinates: [8.54, -80.78] },
  { code: "KN", name: "Saint Kitts and Nevis", capital: "Basseterre", continent: "North America", coordinates: [17.36, -62.78] },
  { code: "LC", name: "Saint Lucia", capital: "Castries", continent: "North America", coordinates: [13.91, -60.98] },
  { code: "VC", name: "Saint Vincent and the Grenadines", capital: "Kingstown", continent: "North America", coordinates: [12.98, -61.29] },
  { code: "TT", name: "Trinidad and Tobago", capital: "Port of Spain", continent: "North America", coordinates: [10.69, -61.22] },
  { code: "US", name: "United States", capital: "Washington, D.C.", continent: "North America", coordinates: [37.09, -95.71] },

  // ─── SOUTH AMERICA ───
  { code: "AR", name: "Argentina", capital: "Buenos Aires", continent: "South America", coordinates: [-38.42, -63.62] },
  { code: "BO", name: "Bolivia", capital: "Sucre", continent: "South America", coordinates: [-16.29, -63.59] },
  { code: "BR", name: "Brazil", capital: "Brasilia", continent: "South America", coordinates: [-14.24, -51.93] },
  { code: "CL", name: "Chile", capital: "Santiago", continent: "South America", coordinates: [-35.68, -71.54] },
  { code: "CO", name: "Colombia", capital: "Bogota", continent: "South America", coordinates: [4.57, -74.3] },
  { code: "EC", name: "Ecuador", capital: "Quito", continent: "South America", coordinates: [-1.83, -78.18] },
  { code: "GY", name: "Guyana", capital: "Georgetown", continent: "South America", coordinates: [4.86, -58.93] },
  { code: "PY", name: "Paraguay", capital: "Asuncion", continent: "South America", coordinates: [-23.44, -58.44] },
  { code: "PE", name: "Peru", capital: "Lima", continent: "South America", coordinates: [-9.19, -75.02] },
  { code: "SR", name: "Suriname", capital: "Paramaribo", continent: "South America", coordinates: [3.92, -56.03] },
  { code: "UY", name: "Uruguay", capital: "Montevideo", continent: "South America", coordinates: [-32.52, -55.77] },
  { code: "VE", name: "Venezuela", capital: "Caracas", continent: "South America", coordinates: [6.42, -66.59] },
  { code: "GF", name: "French Guiana", capital: "Cayenne", continent: "South America", coordinates: [3.93, -53.13] },

  // ─── OCEANIA ───
  { code: "AU", name: "Australia", capital: "Canberra", continent: "Oceania", coordinates: [-25.27, 133.78] },
  { code: "FJ", name: "Fiji", capital: "Suva", continent: "Oceania", coordinates: [-17.71, 178.07] },
  { code: "NZ", name: "New Zealand", capital: "Wellington", continent: "Oceania", coordinates: [-40.9, 174.89] },
  { code: "PG", name: "Papua New Guinea", capital: "Port Moresby", continent: "Oceania", coordinates: [-6.31, 143.96] },
  { code: "WS", name: "Samoa", capital: "Apia", continent: "Oceania", coordinates: [-13.76, -172.1] },
  { code: "SB", name: "Solomon Islands", capital: "Honiara", continent: "Oceania", coordinates: [-9.65, 160.16] },
  { code: "TO", name: "Tonga", capital: "Nuku'alofa", continent: "Oceania", coordinates: [-21.18, -175.2] },
  { code: "VU", name: "Vanuatu", capital: "Port Vila", continent: "Oceania", coordinates: [-15.38, 166.96] },
];

// Lookup maps for fast access
export const countryByCode: Record<string, Country> = {};
export const countryByName: Record<string, Country> = {};
export const countryNameToCode: Record<string, string> = {};

for (const c of countries) {
  countryByCode[c.code] = c;
  countryByName[c.name.toLowerCase()] = c;
  countryNameToCode[c.name.toLowerCase()] = c.code;
}

/** Resolve a country name (case-insensitive) to its ISO code, or return the input if already a code.
 *  When a locale is provided, also checks localized country names.
 */
export function resolveCountryCode(input: string, locale?: string): string | null {
  const trimmed = input.trim();
  // Direct ISO code
  if (countryByCode[trimmed.toUpperCase()]) return trimmed.toUpperCase();
  // English name
  const byName = countryNameToCode[trimmed.toLowerCase()];
  if (byName) return byName;
  // Localized name lookup (lazy import to avoid circular deps)
  if (locale) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { countryNames } = require("@/lib/i18n/countries");
      const localeNames: Record<string, string> | undefined = countryNames[locale];
      if (localeNames) {
        const lower = trimmed.toLowerCase();
        for (const [code, name] of Object.entries(localeNames)) {
          if (name.toLowerCase() === lower) return code;
        }
      }
    } catch {
      // i18n not available — fall through
    }
  }
  return null;
}

/** Get all unique capital names for autocomplete.
 *  When a locale is provided, returns localized capital names.
 */
export function getAllCapitalNames(locale?: string): string[] {
  if (locale && locale !== "en") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { capitalNames } = require("@/lib/i18n/capitals");
      const localeNames: Record<string, string> | undefined = capitalNames[locale];
      if (localeNames) {
        return [...new Set(countries.map((c) => localeNames[c.code] || c.capital))].sort();
      }
    } catch {
      // fallback to English
    }
  }
  return [...new Set(countries.map((c) => c.capital))].sort();
}

/** Get all country names for autocomplete.
 *  When a locale is provided, returns localized names.
 */
export function getAllCountryNames(locale?: string): string[] {
  if (locale && locale !== "en") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { countryNames } = require("@/lib/i18n/countries");
      const localeNames: Record<string, string> | undefined = countryNames[locale];
      if (localeNames) {
        return countries.map((c) => localeNames[c.code] || c.name);
      }
    } catch {
      // fallback to English
    }
  }
  return countries.map((c) => c.name);
}
