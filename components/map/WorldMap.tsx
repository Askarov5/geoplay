"use client";

import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { countryByCode, countries as countriesData } from "@/data/countries";
import { useTranslation } from "@/lib/i18n/context";

const TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

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

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
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
  /** Zoom the viewBox to fit these country codes (plus padding). */
  focusRegion?: string[];
  /** Render name labels at these country positions. */
  countryLabels?: { code: string; color: string; name: string }[];
  /** When set, countries become clickable and this callback fires with the alpha-2 code. */
  onCountryClick?: (code: string) => void;
  /** Enable interactive zoom & pan (scroll wheel, buttons, drag). */
  enableZoom?: boolean;
  /** When enableZoom is true, zoom into this continent on mount. */
  zoomContinent?: string;
}

// ISO numeric to alpha-2 mapping for the TopoJSON data
const numericToAlpha2: Record<string, string> = {
  "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "020": "AD",
  "024": "AO", "028": "AG", "031": "AZ", "032": "AR", "036": "AU",
  "040": "AT", "044": "BS", "048": "BH", "050": "BD", "051": "AM",
  "052": "BB", "056": "BE", "060": "BM", "064": "BT", "068": "BO",
  "070": "BA", "072": "BW", "076": "BR", "084": "BZ", "090": "SB",
  "096": "BN", "100": "BG", "104": "MM", "108": "BI", "112": "BY",
  "116": "KH", "120": "CM", "124": "CA", "132": "CV", "140": "CF",
  "144": "LK", "148": "TD", "152": "CL", "156": "CN", "158": "TW",
  "170": "CO", "174": "KM", "175": "YT", "178": "CG", "180": "CD",
  "184": "CK", "188": "CR", "191": "HR", "192": "CU", "196": "CY",
  "203": "CZ", "204": "BJ", "208": "DK", "212": "DM", "214": "DO",
  "218": "EC", "222": "SV", "226": "GQ", "231": "ET", "232": "ER",
  "233": "EE", "238": "FK", "242": "FJ", "246": "FI", "250": "FR",
  "254": "GF", "258": "PF", "260": "TF", "262": "DJ", "266": "GA",
  "268": "GE", "270": "GM", "275": "PS", "276": "DE", "288": "GH",
  "292": "GI", "296": "KI", "300": "GR", "304": "GL", "308": "GD",
  "312": "GP", "316": "GU", "320": "GT", "324": "GN", "328": "GY",
  "332": "HT", "334": "HM", "336": "VA", "340": "HN", "344": "HK",
  "348": "HU", "352": "IS", "356": "IN", "360": "ID", "364": "IR",
  "368": "IQ", "372": "IE", "376": "IL", "380": "IT", "384": "CI",
  "388": "JM", "392": "JP", "398": "KZ", "400": "JO", "404": "KE",
  "408": "KP", "410": "KR", "414": "KW", "417": "KG", "418": "LA",
  "422": "LB", "426": "LS", "428": "LV", "430": "LR", "434": "LY",
  "438": "LI", "440": "LT", "442": "LU", "446": "MO", "450": "MG",
  "454": "MW", "458": "MY", "462": "MV", "466": "ML", "470": "MT",
  "474": "MQ", "478": "MR", "480": "MU", "484": "MX", "492": "MC",
  "496": "MN", "498": "MD", "499": "ME", "500": "MS", "504": "MA",
  "508": "MZ", "512": "OM", "516": "NA", "520": "NR", "524": "NP",
  "528": "NL", "540": "NC", "548": "VU", "554": "NZ", "558": "NI",
  "562": "NE", "566": "NG", "570": "NU", "574": "NF", "578": "NO",
  "580": "MP", "583": "FM", "584": "MH", "585": "PW", "586": "PK",
  "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH",
  "612": "PN", "616": "PL", "620": "PT", "624": "GW", "626": "TL",
  "630": "PR", "634": "QA", "638": "RE", "642": "RO", "643": "RU",
  "646": "RW", "652": "BL", "654": "SH", "659": "KN", "660": "AI",
  "662": "LC", "663": "MF", "666": "PM", "670": "VC", "674": "SM",
  "678": "ST", "682": "SA", "686": "SN", "688": "RS", "690": "SC",
  "694": "SL", "702": "SG", "703": "SK", "704": "VN", "705": "SI",
  "706": "SO", "710": "ZA", "716": "ZW", "720": "YE", "724": "ES",
  "728": "SS", "729": "SD", "732": "EH", "740": "SR", "748": "SZ",
  "752": "SE", "756": "CH", "760": "SY", "762": "TJ", "764": "TH",
  "768": "TG", "776": "TO", "780": "TT", "784": "AE", "788": "TN",
  "792": "TR", "795": "TM", "796": "TC", "798": "TV",
  "800": "UG", "804": "UA", "807": "MK", "818": "EG", "826": "GB",
  "834": "TZ", "840": "US", "850": "VI", "854": "BF", "858": "UY",
  "860": "UZ", "862": "VE", "876": "WF", "882": "WS", "887": "YE",
  "894": "ZM",
  "-99": "XK", // Kosovo
};

function getAlpha2FromFeature(feature: CountryFeature): string | null {
  const id = feature.id;
  if (!id) return null;
  return numericToAlpha2[id] || null;
}

const DEFAULT_VB: ViewBox = { x: 0, y: 0, w: 960, h: 600 };
const MIN_ZOOM_W = 60;
const MAX_ZOOM_W = 1400;

const WorldMapInner = ({
  highlights = [],
  startCountry,
  endCountry,
  playerPath = [],
  optimalPath = [],
  showOptimalPath = false,
  wrongFlash,
  className = "",
  focusRegion,
  countryLabels,
  onCountryClick,
  enableZoom,
  zoomContinent,
}: WorldMapProps) => {
  const { t, countryName } = useTranslation();
  const [worldData, setWorldData] = useState<FeatureCollection | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const isZoomed = focusRegion && focusRegion.length > 0;
  const isClickable = !!onCountryClick;
  const isInteractive = isZoomed || enableZoom;

  // ── Zoom / Pan state ──
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomVB, setZoomVB] = useState<ViewBox | null>(null);
  const didDragRef = useRef(false);
  const panStartRef = useRef<{
    mx: number; my: number;
    vbX: number; vbY: number; vbW: number; vbH: number;
  } | null>(null);

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

  // Compute a zoomed viewBox when focusRegion is set.
  // The first code in focusRegion is treated as the center (anchor).
  const dynamicViewBox = useMemo(() => {
    if (!isZoomed) return "0 0 960 600";

    // Project the anchor (first code) — this will be the viewBox center
    const anchorCountry = countryByCode[focusRegion[0]];
    const anchorPt = anchorCountry
      ? projection([anchorCountry.coordinates[1], anchorCountry.coordinates[0]])
      : null;

    if (!anchorPt) return "0 0 960 600";

    // Find the maximum distance from anchor to any neighbor point
    let maxDx = 0;
    let maxDy = 0;

    for (const code of focusRegion) {
      const country = countryByCode[code];
      if (!country) continue;
      const pt = projection([country.coordinates[1], country.coordinates[0]]);
      if (!pt) continue;
      maxDx = Math.max(maxDx, Math.abs(pt[0] - anchorPt[0]));
      maxDy = Math.max(maxDy, Math.abs(pt[1] - anchorPt[1]));
    }

    const pad = 80;
    // Half-width and half-height centered on anchor, with padding
    const halfW = Math.max(maxDx + pad, 80);
    const halfH = Math.max(maxDy + pad, 60);

    const w = halfW * 2;
    const h = halfH * 2;

    return `${anchorPt[0] - halfW} ${anchorPt[1] - halfH} ${w} ${h}`;
  }, [isZoomed, focusRegion, projection]);

  // Parse base viewBox for zoom computations
  const baseVB = useMemo<ViewBox>(() => {
    const parts = dynamicViewBox.split(" ").map(Number);
    return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
  }, [dynamicViewBox]);

  // Ref for base viewBox (accessible in event handlers without stale closures)
  const baseVBRef = useRef(baseVB);
  baseVBRef.current = baseVB;

  // ── Continent initial zoom ──
  const continentVB = useMemo<ViewBox | null>(() => {
    if (!zoomContinent || zoomContinent === "all") return null;
    const filtered = countriesData.filter((c) => c.continent === zoomContinent);
    if (filtered.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of filtered) {
      const pt = projection([c.coordinates[1], c.coordinates[0]]);
      if (!pt) continue;
      minX = Math.min(minX, pt[0]);
      minY = Math.min(minY, pt[1]);
      maxX = Math.max(maxX, pt[0]);
      maxY = Math.max(maxY, pt[1]);
    }
    if (!isFinite(minX)) return null;

    const pad = 50;
    return {
      x: minX - pad,
      y: minY - pad,
      w: (maxX - minX) + pad * 2,
      h: (maxY - minY) + pad * 2,
    };
  }, [zoomContinent, projection]);

  // Apply initial continent zoom
  useEffect(() => {
    if (!enableZoom) return;
    setZoomVB(continentVB);
  }, [enableZoom, continentVB]);

  // ── Effective viewBox ──
  const effectiveVB = enableZoom && zoomVB ? zoomVB : baseVB;
  const effectiveViewBox = `${effectiveVB.x} ${effectiveVB.y} ${effectiveVB.w} ${effectiveVB.h}`;

  // ── Scroll-wheel zoom (non-passive listener for preventDefault) ──
  useEffect(() => {
    if (!enableZoom) return;
    const el = svgRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const fx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const fy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;

      setZoomVB((prev) => {
        const vb = prev || baseVBRef.current;
        const newW = Math.max(MIN_ZOOM_W, Math.min(MAX_ZOOM_W, vb.w * factor));
        const ratio = vb.h / vb.w;
        const newH = newW * ratio;
        const px = vb.x + fx * vb.w;
        const py = vb.y + fy * vb.h;
        return { x: px - fx * newW, y: py - fy * newH, w: newW, h: newH };
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [enableZoom]);

  // ── Drag-to-pan (pointer events on window for smooth dragging) ──
  useEffect(() => {
    if (!enableZoom) return;

    const onMove = (e: PointerEvent) => {
      const pan = panStartRef.current;
      if (!pan) return;

      const dx = e.clientX - pan.mx;
      const dy = e.clientY - pan.my;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDragRef.current = true;
      }

      if (!didDragRef.current) return;

      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      const svgDx = (dx / rect.width) * pan.vbW;
      const svgDy = (dy / rect.height) * pan.vbH;

      setZoomVB({
        x: pan.vbX - svgDx,
        y: pan.vbY - svgDy,
        w: pan.vbW,
        h: pan.vbH,
      });
    };

    const onUp = () => {
      panStartRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enableZoom]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!enableZoom) return;
      didDragRef.current = false;
      const vb = zoomVB || baseVB;
      panStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        vbX: vb.x,
        vbY: vb.y,
        vbW: vb.w,
        vbH: vb.h,
      };
    },
    [enableZoom, zoomVB, baseVB]
  );

  // ── Zoom button handlers ──
  const handleZoomIn = useCallback(() => {
    setZoomVB((prev) => {
      const vb = prev || baseVBRef.current;
      const factor = 0.7;
      const newW = Math.max(MIN_ZOOM_W, vb.w * factor);
      const ratio = vb.h / vb.w;
      const newH = newW * ratio;
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomVB((prev) => {
      const vb = prev || baseVBRef.current;
      const factor = 1 / 0.7;
      const newW = Math.min(MAX_ZOOM_W, vb.w * factor);
      const ratio = vb.h / vb.w;
      const newH = newW * ratio;
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomVB(continentVB);
  }, [continentVB]);

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

      // Hovered (disabled when zoomed, unless clickable or enableZoom)
      if (hoveredCountry === alpha2 && (!isZoomed || isClickable || enableZoom)) return "#334155";

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
      isZoomed,
      isClickable,
      enableZoom,
    ]
  );

  // Stroke width adapts to zoom level
  const strokeWidth = useMemo(() => {
    if (isZoomed) return "0.3";
    if (enableZoom && zoomVB) {
      // Thinner strokes when zoomed in
      const ratio = zoomVB.w / DEFAULT_VB.w;
      return String(Math.max(0.1, 0.5 * ratio));
    }
    return "0.5";
  }, [isZoomed, enableZoom, zoomVB]);

  const gratStrokeWidth = useMemo(() => {
    if (isZoomed) return "0.15";
    if (enableZoom && zoomVB) {
      const ratio = zoomVB.w / DEFAULT_VB.w;
      return String(Math.max(0.05, 0.3 * ratio));
    }
    return "0.3";
  }, [isZoomed, enableZoom, zoomVB]);

  // Micro-state dot radius adapts to zoom level
  const microDotRadius = useMemo(() => {
    if (isZoomed) return 2.5;
    if (enableZoom && zoomVB) {
      const ratio = zoomVB.w / DEFAULT_VB.w;
      return Math.max(1.5, 4 * ratio);
    }
    return 4;
  }, [isZoomed, enableZoom, zoomVB]);

  // Track which country codes have visible TopoJSON geometry
  const renderedCodes = useMemo(() => {
    if (!worldData) return new Set<string>();
    const codes = new Set<string>();
    for (const feat of worldData.features) {
      const cf = feat as CountryFeature;
      const alpha2 = getAlpha2FromFeature(cf);
      if (alpha2) {
        const area = pathGenerator.area(feat as GeoPermissibleObjects);
        // Only consider the country "rendered" as a polygon if it's large enough to see.
        // Otherwise, it will get a dot marker.
        if (area > 30) codes.add(alpha2);
      }
    }
    return codes;
  }, [worldData, pathGenerator]);

  // Countries from our data that have no TopoJSON polygon — need dot markers
  const microStates = useMemo(() => {
    return countriesData.filter(c => !renderedCodes.has(c.code));
  }, [renderedCodes]);

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

  const enableHover = !isZoomed || isClickable || enableZoom;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0a0e1a] ${className}`}>
      <svg
        ref={svgRef}
        viewBox={effectiveViewBox}
        className={`w-full h-auto ${isInteractive ? "" : "pt-20"}${enableZoom ? " touch-none" : ""}`}
        style={{
          maxHeight: isInteractive ? undefined : "70vh",
          cursor: enableZoom ? (panStartRef.current ? "grabbing" : "grab") : undefined,
        }}
        onPointerDown={enableZoom ? handlePointerDown : undefined}
      >
        {/* Ocean background */}
        <rect x="-500" y="-500" width="2500" height="2000" fill="#0a0e1a" />

        {/* Graticule (grid lines) */}
        <path
          d={pathGenerator(graticule() as GeoPermissibleObjects) || ""}
          fill="none"
          stroke="#1a1f2e"
          strokeWidth={gratStrokeWidth}
        />

        {/* Country shapes */}
        {worldData.features.map((feat, i) => {
          const cf = feat as CountryFeature;
          const alpha2 = getAlpha2FromFeature(cf);
          const d = pathGenerator(feat as GeoPermissibleObjects);
          if (!d) return null;

          return (
            <path
              key={`country-${feat.id || ""}-${i}`}
              d={d}
              fill={getCountryColor(alpha2)}
              stroke="#0f172a"
              strokeWidth={strokeWidth}
              className={`map-country transition-colors duration-300${isClickable ? " cursor-pointer" : ""}`}
              onMouseEnter={enableHover ? () => alpha2 && setHoveredCountry(alpha2) : undefined}
              onMouseLeave={enableHover ? () => setHoveredCountry(null) : undefined}
              onClick={
                isClickable && alpha2
                  ? () => {
                    if (enableZoom && didDragRef.current) return;
                    onCountryClick(alpha2);
                  }
                  : undefined
              }
            />
          );
        })}

        {/* Dot markers for micro-states without visible geometry */}
        {microStates.map((c) => {
          const pt = projection([c.coordinates[1], c.coordinates[0]]);
          if (!pt) return null;
          return (
            <circle
              key={`micro-${c.code}`}
              cx={pt[0]}
              cy={pt[1]}
              r={microDotRadius}
              fill={getCountryColor(c.code)}
              stroke="#0f172a"
              strokeWidth="0.3"
              className={`map-country transition-colors duration-300${isClickable ? " cursor-pointer" : ""}`}
              onMouseEnter={enableHover ? () => setHoveredCountry(c.code) : undefined}
              onMouseLeave={enableHover ? () => setHoveredCountry(null) : undefined}
              onClick={
                isClickable
                  ? () => {
                    if (enableZoom && didDragRef.current) return;
                    onCountryClick?.(c.code);
                  }
                  : undefined
              }
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

        {/* Custom country labels (e.g. Border Blitz) */}
        {countryLabels?.map((lbl) => (
          <CountryLabel
            key={`lbl-${lbl.code}`}
            code={lbl.code}
            projection={projection}
            color={lbl.color}
            name={lbl.name}
          />
        ))}

        {/* Current position indicator */}
        {playerPath.length > 0 && (
          <CurrentPositionMarker
            code={playerPath[playerPath.length - 1]}
            projection={projection}
          />
        )}
      </svg>

      {/* Zoom controls */}
      {enableZoom && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center bg-[#111827]/90 backdrop-blur-sm border border-[#334155] rounded-lg text-[#f1f5f9] hover:bg-[#1e293b] transition-colors text-lg font-bold select-none"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center bg-[#111827]/90 backdrop-blur-sm border border-[#334155] rounded-lg text-[#f1f5f9] hover:bg-[#1e293b] transition-colors text-lg font-bold select-none"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            className="w-9 h-9 flex items-center justify-center bg-[#111827]/90 backdrop-blur-sm border border-[#334155] rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e293b] transition-colors text-sm select-none"
            title="Reset zoom"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      {/* Hovered country tooltip (hidden when zoomed or clickable to avoid spoiling) */}
      {!isZoomed && !isClickable && hoveredCountry && countryByCode[hoveredCountry] && (
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
