import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/data/countries.dart';

/// Currently selected country in explore mode (null = no selection).
final selectedCountryProvider = StateProvider<Country?>((ref) => null);
