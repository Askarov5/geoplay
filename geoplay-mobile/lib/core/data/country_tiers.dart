import 'countries.dart';

/// Country tier system for difficulty-based filtering.
/// Ported from data/country-tiers.ts.
///
/// Tier 1 — Well-known: large, distinctive, globally recognized
/// Tier 2 — Moderately known: regional significance, medium-sized
/// Tier 3 — Obscure/micro: small, micro-states, easily confused
enum CountryTier { tier1, tier2, tier3 }

const Map<String, CountryTier> countryTiers = {
  // ─── EUROPE ───
  'AL': CountryTier.tier2, 'AD': CountryTier.tier3, 'AT': CountryTier.tier2,
  'BY': CountryTier.tier2, 'BE': CountryTier.tier2, 'BA': CountryTier.tier3,
  'BG': CountryTier.tier2, 'HR': CountryTier.tier2, 'CZ': CountryTier.tier2,
  'DK': CountryTier.tier2, 'EE': CountryTier.tier3, 'FI': CountryTier.tier2,
  'FR': CountryTier.tier1, 'DE': CountryTier.tier1, 'GR': CountryTier.tier1,
  'HU': CountryTier.tier2, 'IS': CountryTier.tier2, 'IE': CountryTier.tier2,
  'IT': CountryTier.tier1, 'XK': CountryTier.tier3, 'LV': CountryTier.tier3,
  'LI': CountryTier.tier3, 'LT': CountryTier.tier3, 'LU': CountryTier.tier3,
  'MK': CountryTier.tier3, 'MT': CountryTier.tier3, 'MD': CountryTier.tier3,
  'MC': CountryTier.tier3, 'ME': CountryTier.tier3, 'NL': CountryTier.tier2,
  'NO': CountryTier.tier1, 'PL': CountryTier.tier1, 'PT': CountryTier.tier2,
  'RO': CountryTier.tier2, 'RU': CountryTier.tier1, 'SM': CountryTier.tier3,
  'RS': CountryTier.tier2, 'SK': CountryTier.tier3, 'SI': CountryTier.tier3,
  'ES': CountryTier.tier1, 'SE': CountryTier.tier1, 'CH': CountryTier.tier2,
  'UA': CountryTier.tier1, 'GB': CountryTier.tier1, 'VA': CountryTier.tier3,

  // ─── ASIA ───
  'AF': CountryTier.tier2, 'AM': CountryTier.tier3, 'AZ': CountryTier.tier3,
  'BH': CountryTier.tier3, 'BD': CountryTier.tier2, 'BT': CountryTier.tier3,
  'BN': CountryTier.tier3, 'KH': CountryTier.tier2, 'CN': CountryTier.tier1,
  'CY': CountryTier.tier3, 'GE': CountryTier.tier3, 'IN': CountryTier.tier1,
  'ID': CountryTier.tier1, 'IR': CountryTier.tier1, 'IQ': CountryTier.tier1,
  'IL': CountryTier.tier2, 'JP': CountryTier.tier1, 'JO': CountryTier.tier2,
  'KZ': CountryTier.tier2, 'KW': CountryTier.tier3, 'KG': CountryTier.tier3,
  'LA': CountryTier.tier3, 'LB': CountryTier.tier3, 'MY': CountryTier.tier2,
  'MV': CountryTier.tier3, 'MN': CountryTier.tier2, 'MM': CountryTier.tier2,
  'NP': CountryTier.tier2, 'KP': CountryTier.tier2, 'OM': CountryTier.tier3,
  'PK': CountryTier.tier1, 'PS': CountryTier.tier3, 'PH': CountryTier.tier2,
  'QA': CountryTier.tier3, 'SA': CountryTier.tier1, 'SG': CountryTier.tier3,
  'KR': CountryTier.tier1, 'LK': CountryTier.tier2, 'SY': CountryTier.tier2,
  'TW': CountryTier.tier2, 'TJ': CountryTier.tier3, 'TH': CountryTier.tier1,
  'TL': CountryTier.tier3, 'TR': CountryTier.tier1, 'TM': CountryTier.tier3,
  'AE': CountryTier.tier2, 'UZ': CountryTier.tier3, 'VN': CountryTier.tier1,
  'YE': CountryTier.tier2,

  // ─── AFRICA ───
  'DZ': CountryTier.tier1, 'AO': CountryTier.tier2, 'BJ': CountryTier.tier3,
  'BW': CountryTier.tier3, 'BF': CountryTier.tier3, 'BI': CountryTier.tier3,
  'CV': CountryTier.tier3, 'CM': CountryTier.tier2, 'CF': CountryTier.tier3,
  'TD': CountryTier.tier2, 'KM': CountryTier.tier3, 'CG': CountryTier.tier3,
  'CD': CountryTier.tier1, 'CI': CountryTier.tier2, 'DJ': CountryTier.tier3,
  'EG': CountryTier.tier1, 'GQ': CountryTier.tier3, 'ER': CountryTier.tier3,
  'SZ': CountryTier.tier3, 'ET': CountryTier.tier1, 'GA': CountryTier.tier3,
  'GM': CountryTier.tier3, 'GH': CountryTier.tier2, 'GN': CountryTier.tier3,
  'GW': CountryTier.tier3, 'KE': CountryTier.tier1, 'LS': CountryTier.tier3,
  'LR': CountryTier.tier3, 'LY': CountryTier.tier2, 'MG': CountryTier.tier2,
  'MW': CountryTier.tier3, 'ML': CountryTier.tier2, 'MR': CountryTier.tier3,
  'MU': CountryTier.tier3, 'MA': CountryTier.tier2, 'MZ': CountryTier.tier2,
  'NA': CountryTier.tier2, 'NE': CountryTier.tier2, 'NG': CountryTier.tier1,
  'RW': CountryTier.tier3, 'ST': CountryTier.tier3, 'SN': CountryTier.tier2,
  'SC': CountryTier.tier3, 'SL': CountryTier.tier3, 'SO': CountryTier.tier2,
  'ZA': CountryTier.tier1, 'SS': CountryTier.tier3, 'SD': CountryTier.tier2,
  'TZ': CountryTier.tier1, 'TG': CountryTier.tier3, 'TN': CountryTier.tier2,
  'UG': CountryTier.tier2, 'ZM': CountryTier.tier2, 'ZW': CountryTier.tier2,

  // ─── NORTH AMERICA ───
  'AG': CountryTier.tier3, 'BS': CountryTier.tier3, 'BB': CountryTier.tier3,
  'BZ': CountryTier.tier3, 'CA': CountryTier.tier1, 'CR': CountryTier.tier2,
  'CU': CountryTier.tier1, 'DM': CountryTier.tier3, 'DO': CountryTier.tier2,
  'SV': CountryTier.tier3, 'GD': CountryTier.tier3, 'GT': CountryTier.tier2,
  'HT': CountryTier.tier2, 'HN': CountryTier.tier3, 'JM': CountryTier.tier2,
  'MX': CountryTier.tier1, 'NI': CountryTier.tier3, 'PA': CountryTier.tier2,
  'KN': CountryTier.tier3, 'LC': CountryTier.tier3, 'VC': CountryTier.tier3,
  'TT': CountryTier.tier3, 'US': CountryTier.tier1,

  // ─── SOUTH AMERICA ───
  'AR': CountryTier.tier1, 'BO': CountryTier.tier2, 'BR': CountryTier.tier1,
  'CL': CountryTier.tier1, 'CO': CountryTier.tier1, 'EC': CountryTier.tier2,
  'GY': CountryTier.tier3, 'PY': CountryTier.tier2, 'PE': CountryTier.tier1,
  'SR': CountryTier.tier3, 'UY': CountryTier.tier2, 'VE': CountryTier.tier1,
  'GF': CountryTier.tier3,

  // ─── OCEANIA ───
  'AU': CountryTier.tier1, 'FJ': CountryTier.tier3, 'NZ': CountryTier.tier1,
  'PG': CountryTier.tier2, 'WS': CountryTier.tier3, 'SB': CountryTier.tier3,
  'TO': CountryTier.tier3, 'VU': CountryTier.tier3,
};

/// Get the tier for a country code (defaults to tier 3 if not found).
CountryTier getCountryTier(String code) {
  return countryTiers[code] ?? CountryTier.tier3;
}

/// Get the maximum tier allowed for a given difficulty.
CountryTier getMaxTierForDifficulty(String difficulty) {
  switch (difficulty) {
    case 'easy':
      return CountryTier.tier1;
    case 'medium':
      return CountryTier.tier2;
    case 'hard':
    default:
      return CountryTier.tier3;
  }
}

/// Generic country pool filter — used by ALL game engines.
/// Returns ISO codes of countries within the specified difficulty tier
/// and continent filter.
List<String> getCountryPool(String difficulty, String continent) {
  final maxTier = getMaxTierForDifficulty(difficulty);
  return countries
      .where((c) => getCountryTier(c.code).index <= maxTier.index)
      .where((c) => continent == 'all' || c.continent == continent)
      .map((c) => c.code)
      .toList();
}
