"use client";

import { useEffect, useState, useMemo } from "react";
import { geoPath, geoMercator, geoBounds, geoCentroid, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";

const TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO numeric to alpha-2 (reuse from WorldMap)
const numericToAlpha2: Record<string, string> = {
  "004": "AF", "008": "AL", "012": "DZ", "020": "AD", "024": "AO",
  "031": "AZ", "032": "AR", "036": "AU", "040": "AT", "044": "BS",
  "048": "BH", "050": "BD", "051": "AM", "056": "BE", "060": "BM",
  "064": "BT", "068": "BO", "070": "BA", "072": "BW", "076": "BR",
  "084": "BZ", "090": "SB", "096": "BN", "100": "BG", "104": "MM",
  "108": "BI", "112": "BY", "116": "KH", "120": "CM", "124": "CA",
  "140": "CF", "144": "LK", "148": "TD", "152": "CL", "156": "CN",
  "158": "TW", "170": "CO", "174": "KM", "178": "CG", "180": "CD",
  "188": "CR", "191": "HR", "192": "CU", "196": "CY", "203": "CZ",
  "204": "BJ", "208": "DK", "212": "DM", "214": "DO", "218": "EC",
  "222": "SV", "226": "GQ", "231": "ET", "232": "ER", "233": "EE",
  "242": "FJ", "246": "FI", "250": "FR", "254": "GF", "262": "DJ",
  "266": "GA", "268": "GE", "270": "GM", "275": "PS", "276": "DE",
  "288": "GH", "296": "KI", "300": "GR", "308": "GD", "320": "GT",
  "324": "GN", "328": "GY", "332": "HT", "340": "HN", "348": "HU",
  "352": "IS", "356": "IN", "360": "ID", "364": "IR", "368": "IQ",
  "372": "IE", "376": "IL", "380": "IT", "384": "CI", "388": "JM",
  "392": "JP", "398": "KZ", "400": "JO", "404": "KE", "408": "KP",
  "410": "KR", "414": "KW", "417": "KG", "418": "LA", "422": "LB",
  "426": "LS", "428": "LV", "430": "LR", "434": "LY", "438": "LI",
  "440": "LT", "442": "LU", "450": "MG", "454": "MW", "458": "MY",
  "462": "MV", "466": "ML", "470": "MT", "478": "MR", "480": "MU",
  "484": "MX", "496": "MN", "498": "MD", "499": "ME", "504": "MA",
  "508": "MZ", "512": "OM", "516": "NA", "524": "NP", "528": "NL",
  "540": "NC", "548": "VU", "554": "NZ", "558": "NI", "562": "NE",
  "566": "NG", "578": "NO", "586": "PK", "591": "PA", "598": "PG",
  "600": "PY", "604": "PE", "608": "PH", "616": "PL", "620": "PT",
  "624": "GW", "626": "TL", "634": "QA", "642": "RO", "643": "RU",
  "646": "RW", "659": "KN", "662": "LC", "670": "VC", "674": "SM",
  "678": "ST", "682": "SA", "686": "SN", "688": "RS", "690": "SC",
  "694": "SL", "702": "SG", "703": "SK", "704": "VN", "705": "SI",
  "706": "SO", "710": "ZA", "716": "ZW", "720": "YE", "724": "ES",
  "728": "SS", "729": "SD", "740": "SR", "748": "SZ", "752": "SE",
  "756": "CH", "760": "SY", "762": "TJ", "764": "TH", "768": "TG",
  "780": "TT", "784": "AE", "788": "TN", "792": "TR", "795": "TM",
  "800": "UG", "804": "UA", "807": "MK", "818": "EG", "826": "GB",
  "834": "TZ", "840": "US", "854": "BF", "858": "UY", "860": "UZ",
  "862": "VE", "882": "WS", "887": "YE", "894": "ZM",
  "-99": "XK",
};

const alpha2ToNumeric: Record<string, string> = {};
for (const [num, alpha] of Object.entries(numericToAlpha2)) {
  alpha2ToNumeric[alpha] = num;
}

// Cache for loaded topology
let cachedWorldData: FeatureCollection | null = null;
let loadPromise: Promise<FeatureCollection> | null = null;

function loadWorld(): Promise<FeatureCollection> {
  if (cachedWorldData) return Promise.resolve(cachedWorldData);
  if (loadPromise) return loadPromise;
  loadPromise = fetch(TOPO_URL)
    .then((res) => res.json())
    .then((topology: Topology) => {
      const fc = feature(
        topology,
        topology.objects.countries as GeometryCollection
      ) as FeatureCollection;
      cachedWorldData = fc;
      return fc;
    });
  return loadPromise;
}

interface CountrySilhouetteProps {
  countryCode: string;
  revealed?: boolean;   // if true, show the answer color (green)
  wrong?: boolean;      // flash red on wrong guess
  size?: number;        // width/height of the SVG (default 320)
  className?: string;
}

export function CountrySilhouette({
  countryCode,
  revealed = false,
  wrong = false,
  size = 320,
  className = "",
}: CountrySilhouetteProps) {
  const [worldData, setWorldData] = useState<FeatureCollection | null>(cachedWorldData);

  useEffect(() => {
    if (!worldData) {
      loadWorld().then(setWorldData);
    }
  }, [worldData]);

  // Find the feature matching this country
  const countryFeature = useMemo(() => {
    if (!worldData) return null;
    const numId = alpha2ToNumeric[countryCode];
    if (!numId) return null;
    return worldData.features.find((f) => f.id === numId) as Feature<Geometry> | undefined || null;
  }, [worldData, countryCode]);

  // Build a custom projection that centers and scales to fit the country
  const { pathD, viewBox } = useMemo(() => {
    if (!countryFeature) return { pathD: "", viewBox: `0 0 ${size} ${size}` };

    const padding = 20;
    const center = geoCentroid(countryFeature as GeoPermissibleObjects);

    // Use a Mercator projection centered on the country
    const proj = geoMercator()
      .center(center)
      .translate([size / 2, size / 2])
      .scale(1);

    // Test with scale=1, then compute the needed scale
    const testPath = geoPath().projection(proj);
    const testBounds = testPath.bounds(countryFeature as GeoPermissibleObjects);

    if (!testBounds) return { pathD: "", viewBox: `0 0 ${size} ${size}` };

    const testWidth = testBounds[1][0] - testBounds[0][0];
    const testHeight = testBounds[1][1] - testBounds[0][1];

    if (testWidth === 0 || testHeight === 0) {
      return { pathD: "", viewBox: `0 0 ${size} ${size}` };
    }

    const availableSize = size - padding * 2;
    const scale = Math.min(availableSize / testWidth, availableSize / testHeight);

    const finalProj = geoMercator()
      .center(center)
      .translate([size / 2, size / 2])
      .scale(scale);

    const finalPath = geoPath().projection(finalProj);
    const d = finalPath(countryFeature as GeoPermissibleObjects) || "";

    return { pathD: d, viewBox: `0 0 ${size} ${size}` };
  }, [countryFeature, size]);

  if (!worldData) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-[#94a3b8] animate-pulse text-sm">...</div>
      </div>
    );
  }

  if (!countryFeature || !pathD) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-[#475569] text-sm">?</div>
      </div>
    );
  }

  const fillColor = revealed
    ? "#22c55e"
    : wrong
      ? "#ef4444"
      : "#a855f7";

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        className="drop-shadow-lg"
      >
        <path
          d={pathD}
          fill={fillColor}
          stroke={revealed ? "#16a34a" : wrong ? "#dc2626" : "#7c3aed"}
          strokeWidth="1.5"
          className="transition-colors duration-300"
        />
      </svg>
    </div>
  );
}
