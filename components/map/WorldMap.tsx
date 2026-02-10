"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { countryByCode } from "@/data/countries";
import { useTranslation } from "@/lib/i18n/context";

const TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryFeature extends Feature<Geometry> {
  id?: string;
  properties: {
    name: string;
  };
}

export interface MapHighlight {
  code: string;
  color: string;
  label?: string;
}

interface WorldMapProps {
  highlights?: MapHighlight[];
  startCountry?: string;
  endCountry?: string;
  playerPath?: string[];
  optimalPath?: string[];
  showOptimalPath?: boolean;
  wrongFlash?: string | null; // country code to flash red
  className?: string;
}

// ISO numeric to alpha-2 mapping for the TopoJSON data
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
  "-99": "XK", // Kosovo
};

function getAlpha2FromFeature(feature: CountryFeature): string | null {
  const id = feature.id;
  if (!id) return null;
  return numericToAlpha2[id] || null;
}

const WorldMapInner = ({
  highlights = [],
  startCountry,
  endCountry,
  playerPath = [],
  optimalPath = [],
  showOptimalPath = false,
  wrongFlash,
  className = "",
}: WorldMapProps) => {
  const { t, countryName } = useTranslation();
  const [worldData, setWorldData] = useState<FeatureCollection | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch(TOPO_URL)
      .then((res) => res.json())
      .then((topology: Topology) => {
        const countries = feature(
          topology,
          topology.objects.countries as GeometryCollection
        ) as FeatureCollection;
        setWorldData(countries);
      })
      .catch(console.error);
  }, []);

  const projection = useMemo(() => {
    return geoNaturalEarth1()
      .scale(160)
      .translate([480, 300]);
  }, []);

  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection);
  }, [projection]);

  const graticule = useMemo(() => geoGraticule(), []);

  // Build highlight lookup
  const highlightMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of highlights) {
      map.set(h.code, h.color);
    }
    return map;
  }, [highlights]);

  const getCountryColor = useCallback(
    (alpha2: string | null): string => {
      if (!alpha2) return "#1e293b";

      // Wrong flash
      if (wrongFlash === alpha2) return "#ef4444";

      // Start country
      if (startCountry === alpha2) return "#22c55e";

      // End country
      if (endCountry === alpha2) return "#ef4444";

      // Player path (gradient from light to dark blue)
      const pathIdx = playerPath.indexOf(alpha2);
      if (pathIdx > 0) {
        const intensity = 0.4 + (pathIdx / Math.max(playerPath.length, 1)) * 0.6;
        return `rgba(59, 130, 246, ${intensity})`;
      }

      // Optimal path (shown in resolution)
      if (showOptimalPath && optimalPath.includes(alpha2)) {
        return "rgba(245, 158, 11, 0.6)";
      }

      // Custom highlights
      const highlight = highlightMap.get(alpha2);
      if (highlight) return highlight;

      // Hovered
      if (hoveredCountry === alpha2) return "#334155";

      // Default
      return "#1e293b";
    },
    [
      startCountry,
      endCountry,
      playerPath,
      optimalPath,
      showOptimalPath,
      wrongFlash,
      highlightMap,
      hoveredCountry,
    ]
  );

  if (!worldData) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0a0e1a] rounded-xl ${className}`}
        style={{ minHeight: 400 }}
      >
        <div className="text-[#94a3b8] text-lg animate-pulse">
          {t("common.loadingMap")}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0a0e1a] ${className}`}>
      <svg
        viewBox="0 0 960 600"
        className="w-full h-auto pt-20"
        style={{ maxHeight: "70vh" }}
      >
        {/* Ocean background */}
        <rect width="960" height="600" fill="#0a0e1a" />

        {/* Graticule (grid lines) */}
        <path
          d={pathGenerator(graticule() as GeoPermissibleObjects) || ""}
          fill="none"
          stroke="#1a1f2e"
          strokeWidth="0.3"
        />

        {/* Country shapes */}
        {worldData.features.map((feat, i) => {
          const cf = feat as CountryFeature;
          const alpha2 = getAlpha2FromFeature(cf);
          const d = pathGenerator(feat as GeoPermissibleObjects);
          if (!d) return null;

          return (
            <path
              key={`country-${feat.id || i}`}
              d={d}
              fill={getCountryColor(alpha2)}
              stroke="#0f172a"
              strokeWidth="0.5"
              className="map-country"
              onMouseEnter={() => alpha2 && setHoveredCountry(alpha2)}
              onMouseLeave={() => setHoveredCountry(null)}
            />
          );
        })}

        {/* Country labels for start/end */}
        {startCountry && countryByCode[startCountry] && (
          <CountryLabel
            code={startCountry}
            projection={projection}
            color="#22c55e"
            name={countryName(startCountry)}
          />
        )}
        {endCountry && countryByCode[endCountry] && (
          <CountryLabel
            code={endCountry}
            projection={projection}
            color="#ef4444"
            name={countryName(endCountry)}
          />
        )}

        {/* Current position indicator */}
        {playerPath.length > 0 && (
          <CurrentPositionMarker
            code={playerPath[playerPath.length - 1]}
            projection={projection}
          />
        )}
      </svg>

      {/* Hovered country tooltip */}
      {hoveredCountry && countryByCode[hoveredCountry] && (
        <div className="absolute top-3 right-3 bg-[#111827]/90 backdrop-blur-sm border border-[#334155] text-sm px-3 py-1.5 rounded-lg text-[#f1f5f9]">
          {countryName(hoveredCountry)}
        </div>
      )}
    </div>
  );
};

export const WorldMap = memo(WorldMapInner);

/** Label rendered at a country's coordinates */
function CountryLabel({
  code,
  projection,
  color,
  name,
}: {
  code: string;
  projection: ReturnType<typeof geoNaturalEarth1>;
  color: string;
  name: string;
}) {
  const country = countryByCode[code];
  if (!country) return null;

  const coords = projection([country.coordinates[1], country.coordinates[0]]);
  if (!coords) return null;

  return (
    <g>
      <circle cx={coords[0]} cy={coords[1]} r="4" fill={color} opacity="0.9" />
      <text
        x={coords[0]}
        y={coords[1] - 10}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="700"
        style={{ textShadow: "0 0 6px rgba(0,0,0,0.8)" }}
      >
        {name}
      </text>
    </g>
  );
}

/** Pulsing marker at current position */
function CurrentPositionMarker({
  code,
  projection,
}: {
  code: string;
  projection: ReturnType<typeof geoNaturalEarth1>;
}) {
  const country = countryByCode[code];
  if (!country) return null;

  const coords = projection([country.coordinates[1], country.coordinates[0]]);
  if (!coords) return null;

  return (
    <g>
      <circle
        cx={coords[0]}
        cy={coords[1]}
        r="8"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          from="4"
          to="14"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.6"
          to="0"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={coords[0]} cy={coords[1]} r="5" fill="#3b82f6" />
    </g>
  );
}
