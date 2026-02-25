import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../engines/types.dart';

/// Theme mode provider — system, dark, or light.
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.dark);

/// Locale provider.
final localeProvider = StateProvider<Locale>((ref) => const Locale('en'));

/// Sound enabled provider.
final soundEnabledProvider = StateProvider<bool>((ref) => true);

/// Selected difficulty provider — shared across all games.
final difficultyProvider = StateProvider<Difficulty>((ref) => Difficulty.easy);

/// Selected continent provider — shared across all games.
final continentProvider = StateProvider<Continent>((ref) => Continent.all);
