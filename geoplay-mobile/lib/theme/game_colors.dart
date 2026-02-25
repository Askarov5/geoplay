import 'package:flutter/material.dart';

/// Per-game accent colors — consistent across dark and light themes.
class GameColors {
  GameColors._();

  static const Color connect = Color(0xFF3B82F6);      // Blue
  static const Color silhouette = Color(0xFFA855F7);    // Purple
  static const Color flagSprint = Color(0xFF22C55E);    // Green
  static const Color capitalClash = Color(0xFFF59E0B);  // Amber
  static const Color borderBlitz = Color(0xFF8B5CF6);   // Violet
  static const Color findOnMap = Color(0xFF06B6D4);     // Cyan
  static const Color flashcards = Color(0xFF6366F1);    // Indigo

  // Common game result colors
  static const Color correct = Color(0xFF22C55E);
  static const Color wrong = Color(0xFFEF4444);
  static const Color hinted = Color(0xFFF59E0B);
  static const Color missed = Color(0xFF64748B);
}
