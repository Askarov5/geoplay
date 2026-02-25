/// Country model — single source of truth for all game data.
/// Ported from data/countries.ts (213 entries).
class Country {
  final String code; // ISO 3166-1 alpha-2
  final String name;
  final String capital;
  final String continent;
  final List<double> coordinates; // [lat, lng]

  const Country({
    required this.code,
    required this.name,
    required this.capital,
    required this.continent,
    required this.coordinates,
  });
}

/// All 213 countries with coordinates, capitals, and continents.
const List<Country> countries = [
  // ─── EUROPE ───
  Country(code: 'AL', name: 'Albania', capital: 'Tirana', continent: 'Europe', coordinates: [41.15, 20.17]),
  Country(code: 'AD', name: 'Andorra', capital: 'Andorra la Vella', continent: 'Europe', coordinates: [42.55, 1.6]),
  Country(code: 'AT', name: 'Austria', capital: 'Vienna', continent: 'Europe', coordinates: [47.52, 14.55]),
  Country(code: 'BY', name: 'Belarus', capital: 'Minsk', continent: 'Europe', coordinates: [53.71, 27.97]),
  Country(code: 'BE', name: 'Belgium', capital: 'Brussels', continent: 'Europe', coordinates: [50.85, 4.35]),
  Country(code: 'BA', name: 'Bosnia and Herzegovina', capital: 'Sarajevo', continent: 'Europe', coordinates: [43.87, 17.68]),
  Country(code: 'BG', name: 'Bulgaria', capital: 'Sofia', continent: 'Europe', coordinates: [42.73, 25.49]),
  Country(code: 'HR', name: 'Croatia', capital: 'Zagreb', continent: 'Europe', coordinates: [45.1, 15.2]),
  Country(code: 'CZ', name: 'Czech Republic', capital: 'Prague', continent: 'Europe', coordinates: [49.82, 15.47]),
  Country(code: 'DK', name: 'Denmark', capital: 'Copenhagen', continent: 'Europe', coordinates: [56.26, 9.5]),
  Country(code: 'EE', name: 'Estonia', capital: 'Tallinn', continent: 'Europe', coordinates: [58.6, 25.01]),
  Country(code: 'FI', name: 'Finland', capital: 'Helsinki', continent: 'Europe', coordinates: [61.92, 25.75]),
  Country(code: 'FR', name: 'France', capital: 'Paris', continent: 'Europe', coordinates: [46.23, 2.21]),
  Country(code: 'DE', name: 'Germany', capital: 'Berlin', continent: 'Europe', coordinates: [51.17, 10.45]),
  Country(code: 'GR', name: 'Greece', capital: 'Athens', continent: 'Europe', coordinates: [39.07, 21.82]),
  Country(code: 'HU', name: 'Hungary', capital: 'Budapest', continent: 'Europe', coordinates: [47.16, 19.5]),
  Country(code: 'IS', name: 'Iceland', capital: 'Reykjavik', continent: 'Europe', coordinates: [64.96, -19.02]),
  Country(code: 'IE', name: 'Ireland', capital: 'Dublin', continent: 'Europe', coordinates: [53.41, -8.24]),
  Country(code: 'IT', name: 'Italy', capital: 'Rome', continent: 'Europe', coordinates: [41.87, 12.57]),
  Country(code: 'XK', name: 'Kosovo', capital: 'Pristina', continent: 'Europe', coordinates: [42.6, 20.9]),
  Country(code: 'LV', name: 'Latvia', capital: 'Riga', continent: 'Europe', coordinates: [56.88, 24.6]),
  Country(code: 'LI', name: 'Liechtenstein', capital: 'Vaduz', continent: 'Europe', coordinates: [47.17, 9.52]),
  Country(code: 'LT', name: 'Lithuania', capital: 'Vilnius', continent: 'Europe', coordinates: [55.17, 23.88]),
  Country(code: 'LU', name: 'Luxembourg', capital: 'Luxembourg City', continent: 'Europe', coordinates: [49.82, 6.13]),
  Country(code: 'MK', name: 'North Macedonia', capital: 'Skopje', continent: 'Europe', coordinates: [41.51, 21.75]),
  Country(code: 'MT', name: 'Malta', capital: 'Valletta', continent: 'Europe', coordinates: [35.94, 14.38]),
  Country(code: 'MD', name: 'Moldova', capital: 'Chisinau', continent: 'Europe', coordinates: [47.41, 28.37]),
  Country(code: 'MC', name: 'Monaco', capital: 'Monaco', continent: 'Europe', coordinates: [43.75, 7.42]),
  Country(code: 'ME', name: 'Montenegro', capital: 'Podgorica', continent: 'Europe', coordinates: [42.71, 19.37]),
  Country(code: 'NL', name: 'Netherlands', capital: 'Amsterdam', continent: 'Europe', coordinates: [52.13, 5.29]),
  Country(code: 'NO', name: 'Norway', capital: 'Oslo', continent: 'Europe', coordinates: [60.47, 8.47]),
  Country(code: 'PL', name: 'Poland', capital: 'Warsaw', continent: 'Europe', coordinates: [51.92, 19.15]),
  Country(code: 'PT', name: 'Portugal', capital: 'Lisbon', continent: 'Europe', coordinates: [39.4, -8.22]),
  Country(code: 'RO', name: 'Romania', capital: 'Bucharest', continent: 'Europe', coordinates: [45.94, 24.97]),
  Country(code: 'RU', name: 'Russia', capital: 'Moscow', continent: 'Europe', coordinates: [61.52, 105.32]),
  Country(code: 'SM', name: 'San Marino', capital: 'San Marino', continent: 'Europe', coordinates: [43.94, 12.46]),
  Country(code: 'RS', name: 'Serbia', capital: 'Belgrade', continent: 'Europe', coordinates: [44.02, 21.01]),
  Country(code: 'SK', name: 'Slovakia', capital: 'Bratislava', continent: 'Europe', coordinates: [48.67, 19.7]),
  Country(code: 'SI', name: 'Slovenia', capital: 'Ljubljana', continent: 'Europe', coordinates: [46.15, 15.0]),
  Country(code: 'ES', name: 'Spain', capital: 'Madrid', continent: 'Europe', coordinates: [40.46, -3.75]),
  Country(code: 'SE', name: 'Sweden', capital: 'Stockholm', continent: 'Europe', coordinates: [60.13, 18.64]),
  Country(code: 'CH', name: 'Switzerland', capital: 'Bern', continent: 'Europe', coordinates: [46.82, 8.23]),
  Country(code: 'UA', name: 'Ukraine', capital: 'Kyiv', continent: 'Europe', coordinates: [48.38, 31.17]),
  Country(code: 'GB', name: 'United Kingdom', capital: 'London', continent: 'Europe', coordinates: [55.38, -3.44]),
  Country(code: 'VA', name: 'Vatican City', capital: 'Vatican City', continent: 'Europe', coordinates: [41.9, 12.45]),

  // ─── ASIA ───
  Country(code: 'AF', name: 'Afghanistan', capital: 'Kabul', continent: 'Asia', coordinates: [33.94, 67.71]),
  Country(code: 'AM', name: 'Armenia', capital: 'Yerevan', continent: 'Asia', coordinates: [40.07, 45.04]),
  Country(code: 'AZ', name: 'Azerbaijan', capital: 'Baku', continent: 'Asia', coordinates: [40.14, 47.58]),
  Country(code: 'BH', name: 'Bahrain', capital: 'Manama', continent: 'Asia', coordinates: [26.07, 50.55]),
  Country(code: 'BD', name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia', coordinates: [23.68, 90.36]),
  Country(code: 'BT', name: 'Bhutan', capital: 'Thimphu', continent: 'Asia', coordinates: [27.51, 90.43]),
  Country(code: 'BN', name: 'Brunei', capital: 'Bandar Seri Begawan', continent: 'Asia', coordinates: [4.54, 114.73]),
  Country(code: 'KH', name: 'Cambodia', capital: 'Phnom Penh', continent: 'Asia', coordinates: [12.57, 104.99]),
  Country(code: 'CN', name: 'China', capital: 'Beijing', continent: 'Asia', coordinates: [35.86, 104.2]),
  Country(code: 'CY', name: 'Cyprus', capital: 'Nicosia', continent: 'Asia', coordinates: [35.13, 33.43]),
  Country(code: 'GE', name: 'Georgia', capital: 'Tbilisi', continent: 'Asia', coordinates: [42.32, 43.36]),
  Country(code: 'IN', name: 'India', capital: 'New Delhi', continent: 'Asia', coordinates: [20.59, 78.96]),
  Country(code: 'ID', name: 'Indonesia', capital: 'Jakarta', continent: 'Asia', coordinates: [-0.79, 113.92]),
  Country(code: 'IR', name: 'Iran', capital: 'Tehran', continent: 'Asia', coordinates: [32.43, 53.69]),
  Country(code: 'IQ', name: 'Iraq', capital: 'Baghdad', continent: 'Asia', coordinates: [33.22, 43.68]),
  Country(code: 'IL', name: 'Israel', capital: 'Jerusalem', continent: 'Asia', coordinates: [31.05, 34.85]),
  Country(code: 'JP', name: 'Japan', capital: 'Tokyo', continent: 'Asia', coordinates: [36.2, 138.25]),
  Country(code: 'JO', name: 'Jordan', capital: 'Amman', continent: 'Asia', coordinates: [30.59, 36.24]),
  Country(code: 'KZ', name: 'Kazakhstan', capital: 'Astana', continent: 'Asia', coordinates: [48.02, 66.92]),
  Country(code: 'KW', name: 'Kuwait', capital: 'Kuwait City', continent: 'Asia', coordinates: [29.31, 47.48]),
  Country(code: 'KG', name: 'Kyrgyzstan', capital: 'Bishkek', continent: 'Asia', coordinates: [41.2, 74.77]),
  Country(code: 'LA', name: 'Laos', capital: 'Vientiane', continent: 'Asia', coordinates: [19.86, 102.5]),
  Country(code: 'LB', name: 'Lebanon', capital: 'Beirut', continent: 'Asia', coordinates: [33.85, 35.86]),
  Country(code: 'MY', name: 'Malaysia', capital: 'Kuala Lumpur', continent: 'Asia', coordinates: [4.21, 101.98]),
  Country(code: 'MV', name: 'Maldives', capital: 'Male', continent: 'Asia', coordinates: [3.2, 73.22]),
  Country(code: 'MN', name: 'Mongolia', capital: 'Ulaanbaatar', continent: 'Asia', coordinates: [46.86, 103.85]),
  Country(code: 'MM', name: 'Myanmar', capital: 'Naypyidaw', continent: 'Asia', coordinates: [21.91, 95.96]),
  Country(code: 'NP', name: 'Nepal', capital: 'Kathmandu', continent: 'Asia', coordinates: [28.39, 84.12]),
  Country(code: 'KP', name: 'North Korea', capital: 'Pyongyang', continent: 'Asia', coordinates: [40.34, 127.51]),
  Country(code: 'OM', name: 'Oman', capital: 'Muscat', continent: 'Asia', coordinates: [21.51, 55.92]),
  Country(code: 'PK', name: 'Pakistan', capital: 'Islamabad', continent: 'Asia', coordinates: [30.38, 69.35]),
  Country(code: 'PS', name: 'Palestine', capital: 'Ramallah', continent: 'Asia', coordinates: [31.95, 35.23]),
  Country(code: 'PH', name: 'Philippines', capital: 'Manila', continent: 'Asia', coordinates: [12.88, 121.77]),
  Country(code: 'QA', name: 'Qatar', capital: 'Doha', continent: 'Asia', coordinates: [25.35, 51.18]),
  Country(code: 'SA', name: 'Saudi Arabia', capital: 'Riyadh', continent: 'Asia', coordinates: [23.89, 45.08]),
  Country(code: 'SG', name: 'Singapore', capital: 'Singapore', continent: 'Asia', coordinates: [1.35, 103.82]),
  Country(code: 'KR', name: 'South Korea', capital: 'Seoul', continent: 'Asia', coordinates: [35.91, 127.77]),
  Country(code: 'LK', name: 'Sri Lanka', capital: 'Colombo', continent: 'Asia', coordinates: [7.87, 80.77]),
  Country(code: 'SY', name: 'Syria', capital: 'Damascus', continent: 'Asia', coordinates: [34.8, 39.0]),
  Country(code: 'TW', name: 'Taiwan', capital: 'Taipei', continent: 'Asia', coordinates: [23.7, 120.96]),
  Country(code: 'TJ', name: 'Tajikistan', capital: 'Dushanbe', continent: 'Asia', coordinates: [38.86, 71.28]),
  Country(code: 'TH', name: 'Thailand', capital: 'Bangkok', continent: 'Asia', coordinates: [15.87, 100.99]),
  Country(code: 'TL', name: 'Timor-Leste', capital: 'Dili', continent: 'Asia', coordinates: [-8.87, 125.73]),
  Country(code: 'TR', name: 'Turkey', capital: 'Ankara', continent: 'Asia', coordinates: [38.96, 35.24]),
  Country(code: 'TM', name: 'Turkmenistan', capital: 'Ashgabat', continent: 'Asia', coordinates: [38.97, 59.56]),
  Country(code: 'AE', name: 'United Arab Emirates', capital: 'Abu Dhabi', continent: 'Asia', coordinates: [23.42, 53.85]),
  Country(code: 'UZ', name: 'Uzbekistan', capital: 'Tashkent', continent: 'Asia', coordinates: [41.38, 64.59]),
  Country(code: 'VN', name: 'Vietnam', capital: 'Hanoi', continent: 'Asia', coordinates: [14.06, 108.28]),
  Country(code: 'YE', name: 'Yemen', capital: 'Sanaa', continent: 'Asia', coordinates: [15.55, 48.52]),

  // ─── AFRICA ───
  Country(code: 'DZ', name: 'Algeria', capital: 'Algiers', continent: 'Africa', coordinates: [28.03, 1.66]),
  Country(code: 'AO', name: 'Angola', capital: 'Luanda', continent: 'Africa', coordinates: [-11.2, 17.87]),
  Country(code: 'BJ', name: 'Benin', capital: 'Porto-Novo', continent: 'Africa', coordinates: [9.31, 2.32]),
  Country(code: 'BW', name: 'Botswana', capital: 'Gaborone', continent: 'Africa', coordinates: [-22.33, 24.68]),
  Country(code: 'BF', name: 'Burkina Faso', capital: 'Ouagadougou', continent: 'Africa', coordinates: [12.24, -1.56]),
  Country(code: 'BI', name: 'Burundi', capital: 'Gitega', continent: 'Africa', coordinates: [-3.37, 29.92]),
  Country(code: 'CV', name: 'Cape Verde', capital: 'Praia', continent: 'Africa', coordinates: [16.0, -24.01]),
  Country(code: 'CM', name: 'Cameroon', capital: 'Yaounde', continent: 'Africa', coordinates: [7.37, 12.35]),
  Country(code: 'CF', name: 'Central African Republic', capital: 'Bangui', continent: 'Africa', coordinates: [6.61, 20.94]),
  Country(code: 'TD', name: 'Chad', capital: "N'Djamena", continent: 'Africa', coordinates: [15.45, 18.73]),
  Country(code: 'KM', name: 'Comoros', capital: 'Moroni', continent: 'Africa', coordinates: [-11.88, 43.87]),
  Country(code: 'CG', name: 'Republic of the Congo', capital: 'Brazzaville', continent: 'Africa', coordinates: [-0.23, 15.83]),
  Country(code: 'CD', name: 'Democratic Republic of the Congo', capital: 'Kinshasa', continent: 'Africa', coordinates: [-4.04, 21.76]),
  Country(code: 'CI', name: 'Ivory Coast', capital: 'Yamoussoukro', continent: 'Africa', coordinates: [7.54, -5.55]),
  Country(code: 'DJ', name: 'Djibouti', capital: 'Djibouti', continent: 'Africa', coordinates: [11.83, 42.59]),
  Country(code: 'EG', name: 'Egypt', capital: 'Cairo', continent: 'Africa', coordinates: [26.82, 30.8]),
  Country(code: 'GQ', name: 'Equatorial Guinea', capital: 'Malabo', continent: 'Africa', coordinates: [1.65, 10.27]),
  Country(code: 'ER', name: 'Eritrea', capital: 'Asmara', continent: 'Africa', coordinates: [15.18, 39.78]),
  Country(code: 'SZ', name: 'Eswatini', capital: 'Mbabane', continent: 'Africa', coordinates: [-26.52, 31.47]),
  Country(code: 'ET', name: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa', coordinates: [9.15, 40.49]),
  Country(code: 'GA', name: 'Gabon', capital: 'Libreville', continent: 'Africa', coordinates: [-0.8, 11.61]),
  Country(code: 'GM', name: 'Gambia', capital: 'Banjul', continent: 'Africa', coordinates: [13.44, -15.31]),
  Country(code: 'GH', name: 'Ghana', capital: 'Accra', continent: 'Africa', coordinates: [7.95, -1.02]),
  Country(code: 'GN', name: 'Guinea', capital: 'Conakry', continent: 'Africa', coordinates: [9.95, -11.36]),
  Country(code: 'GW', name: 'Guinea-Bissau', capital: 'Bissau', continent: 'Africa', coordinates: [11.8, -15.18]),
  Country(code: 'KE', name: 'Kenya', capital: 'Nairobi', continent: 'Africa', coordinates: [-0.02, 37.91]),
  Country(code: 'LS', name: 'Lesotho', capital: 'Maseru', continent: 'Africa', coordinates: [-29.61, 28.23]),
  Country(code: 'LR', name: 'Liberia', capital: 'Monrovia', continent: 'Africa', coordinates: [6.43, -9.43]),
  Country(code: 'LY', name: 'Libya', capital: 'Tripoli', continent: 'Africa', coordinates: [26.34, 17.23]),
  Country(code: 'MG', name: 'Madagascar', capital: 'Antananarivo', continent: 'Africa', coordinates: [-18.77, 46.87]),
  Country(code: 'MW', name: 'Malawi', capital: 'Lilongwe', continent: 'Africa', coordinates: [-13.25, 34.3]),
  Country(code: 'ML', name: 'Mali', capital: 'Bamako', continent: 'Africa', coordinates: [17.57, -4.0]),
  Country(code: 'MR', name: 'Mauritania', capital: 'Nouakchott', continent: 'Africa', coordinates: [21.01, -10.94]),
  Country(code: 'MU', name: 'Mauritius', capital: 'Port Louis', continent: 'Africa', coordinates: [-20.35, 57.55]),
  Country(code: 'MA', name: 'Morocco', capital: 'Rabat', continent: 'Africa', coordinates: [31.79, -7.09]),
  Country(code: 'MZ', name: 'Mozambique', capital: 'Maputo', continent: 'Africa', coordinates: [-18.67, 35.53]),
  Country(code: 'NA', name: 'Namibia', capital: 'Windhoek', continent: 'Africa', coordinates: [-22.96, 18.49]),
  Country(code: 'NE', name: 'Niger', capital: 'Niamey', continent: 'Africa', coordinates: [17.61, 8.08]),
  Country(code: 'NG', name: 'Nigeria', capital: 'Abuja', continent: 'Africa', coordinates: [9.08, 8.68]),
  Country(code: 'RW', name: 'Rwanda', capital: 'Kigali', continent: 'Africa', coordinates: [-1.94, 29.87]),
  Country(code: 'ST', name: 'Sao Tome and Principe', capital: 'Sao Tome', continent: 'Africa', coordinates: [0.19, 6.61]),
  Country(code: 'SN', name: 'Senegal', capital: 'Dakar', continent: 'Africa', coordinates: [14.5, -14.45]),
  Country(code: 'SC', name: 'Seychelles', capital: 'Victoria', continent: 'Africa', coordinates: [-4.68, 55.49]),
  Country(code: 'SL', name: 'Sierra Leone', capital: 'Freetown', continent: 'Africa', coordinates: [8.46, -11.78]),
  Country(code: 'SO', name: 'Somalia', capital: 'Mogadishu', continent: 'Africa', coordinates: [5.15, 46.2]),
  Country(code: 'ZA', name: 'South Africa', capital: 'Pretoria', continent: 'Africa', coordinates: [-30.56, 22.94]),
  Country(code: 'SS', name: 'South Sudan', capital: 'Juba', continent: 'Africa', coordinates: [6.88, 31.31]),
  Country(code: 'SD', name: 'Sudan', capital: 'Khartoum', continent: 'Africa', coordinates: [12.86, 30.22]),
  Country(code: 'TZ', name: 'Tanzania', capital: 'Dodoma', continent: 'Africa', coordinates: [-6.37, 34.89]),
  Country(code: 'TG', name: 'Togo', capital: 'Lome', continent: 'Africa', coordinates: [8.62, 0.82]),
  Country(code: 'TN', name: 'Tunisia', capital: 'Tunis', continent: 'Africa', coordinates: [33.89, 9.54]),
  Country(code: 'UG', name: 'Uganda', capital: 'Kampala', continent: 'Africa', coordinates: [1.37, 32.29]),
  Country(code: 'ZM', name: 'Zambia', capital: 'Lusaka', continent: 'Africa', coordinates: [-13.13, 27.85]),
  Country(code: 'ZW', name: 'Zimbabwe', capital: 'Harare', continent: 'Africa', coordinates: [-19.02, 29.15]),

  // ─── NORTH AMERICA ───
  Country(code: 'AG', name: 'Antigua and Barbuda', capital: "St. John's", continent: 'North America', coordinates: [17.06, -61.8]),
  Country(code: 'BS', name: 'Bahamas', capital: 'Nassau', continent: 'North America', coordinates: [25.03, -77.4]),
  Country(code: 'BB', name: 'Barbados', capital: 'Bridgetown', continent: 'North America', coordinates: [13.19, -59.54]),
  Country(code: 'BZ', name: 'Belize', capital: 'Belmopan', continent: 'North America', coordinates: [17.19, -88.5]),
  Country(code: 'CA', name: 'Canada', capital: 'Ottawa', continent: 'North America', coordinates: [56.13, -106.35]),
  Country(code: 'CR', name: 'Costa Rica', capital: 'San Jose', continent: 'North America', coordinates: [9.75, -83.75]),
  Country(code: 'CU', name: 'Cuba', capital: 'Havana', continent: 'North America', coordinates: [21.52, -77.78]),
  Country(code: 'DM', name: 'Dominica', capital: 'Roseau', continent: 'North America', coordinates: [15.41, -61.37]),
  Country(code: 'DO', name: 'Dominican Republic', capital: 'Santo Domingo', continent: 'North America', coordinates: [18.74, -70.16]),
  Country(code: 'SV', name: 'El Salvador', capital: 'San Salvador', continent: 'North America', coordinates: [13.79, -88.9]),
  Country(code: 'GD', name: 'Grenada', capital: "St. George's", continent: 'North America', coordinates: [12.26, -61.6]),
  Country(code: 'GT', name: 'Guatemala', capital: 'Guatemala City', continent: 'North America', coordinates: [15.78, -90.23]),
  Country(code: 'HT', name: 'Haiti', capital: 'Port-au-Prince', continent: 'North America', coordinates: [18.97, -72.29]),
  Country(code: 'HN', name: 'Honduras', capital: 'Tegucigalpa', continent: 'North America', coordinates: [15.2, -86.24]),
  Country(code: 'JM', name: 'Jamaica', capital: 'Kingston', continent: 'North America', coordinates: [18.11, -77.3]),
  Country(code: 'MX', name: 'Mexico', capital: 'Mexico City', continent: 'North America', coordinates: [23.63, -102.55]),
  Country(code: 'NI', name: 'Nicaragua', capital: 'Managua', continent: 'North America', coordinates: [12.87, -85.21]),
  Country(code: 'PA', name: 'Panama', capital: 'Panama City', continent: 'North America', coordinates: [8.54, -80.78]),
  Country(code: 'KN', name: 'Saint Kitts and Nevis', capital: 'Basseterre', continent: 'North America', coordinates: [17.36, -62.78]),
  Country(code: 'LC', name: 'Saint Lucia', capital: 'Castries', continent: 'North America', coordinates: [13.91, -60.98]),
  Country(code: 'VC', name: 'Saint Vincent and the Grenadines', capital: 'Kingstown', continent: 'North America', coordinates: [12.98, -61.29]),
  Country(code: 'TT', name: 'Trinidad and Tobago', capital: 'Port of Spain', continent: 'North America', coordinates: [10.69, -61.22]),
  Country(code: 'US', name: 'United States', capital: 'Washington, D.C.', continent: 'North America', coordinates: [37.09, -95.71]),

  // ─── SOUTH AMERICA ───
  Country(code: 'AR', name: 'Argentina', capital: 'Buenos Aires', continent: 'South America', coordinates: [-38.42, -63.62]),
  Country(code: 'BO', name: 'Bolivia', capital: 'Sucre', continent: 'South America', coordinates: [-16.29, -63.59]),
  Country(code: 'BR', name: 'Brazil', capital: 'Brasilia', continent: 'South America', coordinates: [-14.24, -51.93]),
  Country(code: 'CL', name: 'Chile', capital: 'Santiago', continent: 'South America', coordinates: [-35.68, -71.54]),
  Country(code: 'CO', name: 'Colombia', capital: 'Bogota', continent: 'South America', coordinates: [4.57, -74.3]),
  Country(code: 'EC', name: 'Ecuador', capital: 'Quito', continent: 'South America', coordinates: [-1.83, -78.18]),
  Country(code: 'GY', name: 'Guyana', capital: 'Georgetown', continent: 'South America', coordinates: [4.86, -58.93]),
  Country(code: 'PY', name: 'Paraguay', capital: 'Asuncion', continent: 'South America', coordinates: [-23.44, -58.44]),
  Country(code: 'PE', name: 'Peru', capital: 'Lima', continent: 'South America', coordinates: [-9.19, -75.02]),
  Country(code: 'SR', name: 'Suriname', capital: 'Paramaribo', continent: 'South America', coordinates: [3.92, -56.03]),
  Country(code: 'UY', name: 'Uruguay', capital: 'Montevideo', continent: 'South America', coordinates: [-32.52, -55.77]),
  Country(code: 'VE', name: 'Venezuela', capital: 'Caracas', continent: 'South America', coordinates: [6.42, -66.59]),
  Country(code: 'GF', name: 'French Guiana', capital: 'Cayenne', continent: 'South America', coordinates: [3.93, -53.13]),

  // ─── OCEANIA ───
  Country(code: 'AU', name: 'Australia', capital: 'Canberra', continent: 'Oceania', coordinates: [-25.27, 133.78]),
  Country(code: 'FJ', name: 'Fiji', capital: 'Suva', continent: 'Oceania', coordinates: [-17.71, 178.07]),
  Country(code: 'NZ', name: 'New Zealand', capital: 'Wellington', continent: 'Oceania', coordinates: [-40.9, 174.89]),
  Country(code: 'PG', name: 'Papua New Guinea', capital: 'Port Moresby', continent: 'Oceania', coordinates: [-6.31, 143.96]),
  Country(code: 'WS', name: 'Samoa', capital: 'Apia', continent: 'Oceania', coordinates: [-13.76, -172.1]),
  Country(code: 'SB', name: 'Solomon Islands', capital: 'Honiara', continent: 'Oceania', coordinates: [-9.65, 160.16]),
  Country(code: 'TO', name: 'Tonga', capital: "Nuku'alofa", continent: 'Oceania', coordinates: [-21.18, -175.2]),
  Country(code: 'VU', name: 'Vanuatu', capital: 'Port Vila', continent: 'Oceania', coordinates: [-15.38, 166.96]),
];

// ─── Lookup Maps ───

/// Fast lookup: ISO code → Country
final Map<String, Country> countryByCode = {
  for (final c in countries) c.code: c,
};

/// Fast lookup: lowercase name → Country
final Map<String, Country> countryByName = {
  for (final c in countries) c.name.toLowerCase(): c,
};

/// Fast lookup: lowercase name → ISO code
final Map<String, String> countryNameToCode = {
  for (final c in countries) c.name.toLowerCase(): c.code,
};

/// Resolve a country name (case-insensitive) to its ISO code.
/// Returns null if not found.
String? resolveCountryCode(String input, {String locale = 'en'}) {
  final trimmed = input.trim();

  // Direct ISO code match
  if (countryByCode.containsKey(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  // English name match
  final byName = countryNameToCode[trimmed.toLowerCase()];
  if (byName != null) return byName;

  // TODO: localized name lookup in Phase 3

  return null;
}

/// Get all country names for autocomplete.
List<String> getAllCountryNames({String locale = 'en'}) {
  return countries.map((c) => c.name).toList();
}

/// Get all unique capital names for autocomplete.
List<String> getAllCapitalNames({String locale = 'en'}) {
  return countries.map((c) => c.capital).toSet().toList()..sort();
}

/// Helper to get a Country by its ISO code (case-insensitive)
Country? getCountryByCode(String code) {
  return countryByCode[code.toUpperCase()];
}
