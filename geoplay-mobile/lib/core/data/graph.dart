import 'dart:collection';
import 'adjacency.dart';

/// BFS pathfinding between two countries using the adjacency graph.
/// Ported from lib/graph.ts.

/// Find the shortest path between two countries using BFS.
/// Returns the path as a list of ISO codes (including start and end),
/// or null if no path exists.
List<String>? findShortestPath(String startCode, String endCode, {Set<String>? allowedCountries}) {
  if (startCode == endCode) return [startCode];
  if (!hasLandBorders(startCode) || !hasLandBorders(endCode)) return null;

  final visited = <String>{};
  final queue = Queue<List<String>>();

  visited.add(startCode);
  queue.add([startCode]);

  while (queue.isNotEmpty) {
    final path = queue.removeFirst();
    final current = path.last;

    for (final neighbor in getNeighbors(current)) {
      if (allowedCountries != null && !allowedCountries.contains(neighbor) && neighbor != endCode) {
         continue; 
      }
      if (neighbor == endCode) {
        return [...path, neighbor];
      }
      if (!visited.contains(neighbor)) {
        visited.add(neighbor);
        queue.add([...path, neighbor]);
      }
    }
  }

  return null; // No path found
}

/// Find all shortest paths between two countries (may be multiple).
List<List<String>> findAllShortestPaths(String startCode, String endCode) {
  if (startCode == endCode) return [[startCode]];
  if (!hasLandBorders(startCode) || !hasLandBorders(endCode)) return [];

  final results = <List<String>>[];
  final visited = <String>{};
  final queue = Queue<List<String>>();
  int? shortestLength;

  visited.add(startCode);
  queue.add([startCode]);

  while (queue.isNotEmpty) {
    final path = queue.removeFirst();

    // If we've found paths and this one is longer, stop.
    if (shortestLength != null && path.length > shortestLength) break;

    final current = path.last;

    for (final neighbor in getNeighbors(current)) {
      if (neighbor == endCode) {
        final completePath = [...path, neighbor];
        shortestLength ??= completePath.length;
        if (completePath.length == shortestLength) {
          results.add(completePath);
        }
      } else if (!visited.contains(neighbor)) {
        visited.add(neighbor);
        queue.add([...path, neighbor]);
      }
    }
  }

  return results;
}

/// Check if a path between two countries exists.
bool pathExists(String startCode, String endCode) {
  return findShortestPath(startCode, endCode) != null;
}
