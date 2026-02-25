import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Mapbox configuration.
/// Token is loaded from .env file via flutter_dotenv.
/// The .env file is gitignored — never commit tokens to source control.
class MapboxConfig {
  static String get publicToken => dotenv.env['MAPBOX_TOKEN'] ?? '';
}
