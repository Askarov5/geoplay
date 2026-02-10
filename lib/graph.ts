import { adjacencyGraph, connectedCountryCodes } from "@/data/adjacency";
import { countryByCode } from "@/data/countries";
import type { Continent } from "@/lib/game-engine/types";

/**
 * Find the shortest path between two countries using BFS.
 * Returns the full path including start and end, or null if unreachable.
 */
export function findShortestPath(
  start: string,
  end: string,
  excludeCountries?: Set<string>
): string[] | null {
  if (start === end) return [start];
  if (!adjacencyGraph[start] || !adjacencyGraph[end]) return null;

  const queue: string[][] = [[start]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    const neighbors = adjacencyGraph[current] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      if (excludeCountries?.has(neighbor)) continue;

      const newPath = [...path, neighbor];

      if (neighbor === end) return newPath;

      visited.add(neighbor);
      queue.push(newPath);
    }
  }

  return null; // no path found
}

/**
 * Get the shortest path length (number of edges) between two countries.
 * Returns -1 if unreachable.
 */
export function getShortestDistance(start: string, end: string): number {
  const path = findShortestPath(start, end);
  return path ? path.length - 1 : -1;
}

/**
 * Check if two countries are direct neighbors.
 */
export function isValidNeighbor(current: string, candidate: string): boolean {
  const neighbors = adjacencyGraph[current];
  return neighbors ? neighbors.includes(candidate) : false;
}

/**
 * Get all direct neighbors of a country.
 */
export function getNeighbors(countryCode: string): string[] {
  return adjacencyGraph[countryCode] || [];
}

/**
 * Check if a country has land borders (can participate in Connect mode).
 */
export function hasLandBorders(countryCode: string): boolean {
  return connectedCountryCodes.has(countryCode);
}

/**
 * Check if a country belongs to the given continent filter.
 */
function matchesContinent(code: string, continent: Continent): boolean {
  if (continent === "all") return true;
  const country = countryByCode[code];
  return country?.continent === continent;
}

/**
 * Find all countries at exactly a given BFS distance from start.
 * If continent is specified, only traverses countries on that continent.
 */
export function countriesAtDistance(
  start: string,
  distance: number,
  continent: Continent = "all"
): string[] {
  if (!adjacencyGraph[start]) return [];

  const visited = new Set<string>([start]);
  let frontier = [start];
  let currentDistance = 0;

  while (currentDistance < distance && frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const country of frontier) {
      const neighbors = adjacencyGraph[country] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && matchesContinent(neighbor, continent)) {
          visited.add(neighbor);
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
    currentDistance++;
  }

  return frontier;
}

/**
 * Get a random connected country code (has land borders).
 * If continent is specified, only picks from that continent.
 */
export function getRandomConnectedCountry(continent: Continent = "all"): string {
  const codes = Array.from(connectedCountryCodes).filter((code) =>
    matchesContinent(code, continent)
  );
  if (codes.length === 0) {
    // Fallback to any connected country
    const all = Array.from(connectedCountryCodes);
    return all[Math.floor(Math.random() * all.length)];
  }
  return codes[Math.floor(Math.random() * codes.length)];
}
