"use client";

import { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection } from "geojson";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

export function ScrollingGlobe() {
    const svgRef = useRef<SVGSVGElement>(null);
    const landPathRef = useRef<SVGPathElement>(null);
    const gratPathRef = useRef<SVGPathElement>(null);
    const [worldData, setWorldData] = useState<FeatureCollection | null>(null);

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

    useEffect(() => {
        if (!worldData || !svgRef.current || !landPathRef.current || !gratPathRef.current) return;

        // We combine all features into a single geometry collection to draw in one shot.
        // This is vastly faster than drawing 200 individual country paths on every frame.
        const allLand = {
            type: "GeometryCollection",
            geometries: worldData.features.map(f => f.geometry)
        };

        const width = 800;
        const height = 800;

        const projection = geoOrthographic()
            .scale(350)
            .translate([width / 2, height / 2])
            .clipAngle(90);

        const pathGenerator = geoPath().projection(projection);
        const graticule = geoGraticule()();

        // Initial draw
        landPathRef.current.setAttribute("d", pathGenerator(allLand as GeoPermissibleObjects) || "");
        gratPathRef.current.setAttribute("d", pathGenerator(graticule as GeoPermissibleObjects) || "");

        // Let's add an ambient slow rotation plus scroll-based rotation
        let animationFrameId: number;
        let baseRotateX = 0;
        let targetScrollRotate = 0;
        let currentScrollRotate = 0;

        const onScroll = () => {
            // Get scroll percentage
            const st = window.scrollY;
            const sh = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPct = sh > 0 ? st / sh : 0;

            // Target scroll rotates from 0 to -180 degrees (half turn)
            targetScrollRotate = scrollPct * 180;
        };

        const animate = () => {
            // Ambient rotation: ~3 degrees per second
            baseRotateX += 0.05;

            // Smoothly interpolate current scroll rotation towards target (10% per frame)
            currentScrollRotate += (targetScrollRotate - currentScrollRotate) * 0.1;

            // Apply the combined rotation
            projection.rotate([-baseRotateX + currentScrollRotate, -15, 0]);
            landPathRef.current!.setAttribute("d", pathGenerator(allLand as GeoPermissibleObjects) || "");
            gratPathRef.current!.setAttribute("d", pathGenerator(graticule as GeoPermissibleObjects) || "");

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        animate(); // start the loop

        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, [worldData]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30 select-none hidden sm:flex">
            {/* Glow effect behind the globe */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-[#3b82f6]/10 blur-[120px]" />

            <svg
                ref={svgRef}
                viewBox="0 0 800 800"
                className="w-[80vw] max-w-[800px] h-auto"
                preserveAspectRatio="xMidYMid meet"
            >
                <circle
                    cx="400"
                    cy="400"
                    r="350"
                    fill="#0a0e1a"
                    stroke="#1e293b"
                    strokeWidth="2"
                />
                <path
                    ref={gratPathRef}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />
                <path
                    ref={landPathRef}
                    fill="#111827"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}
