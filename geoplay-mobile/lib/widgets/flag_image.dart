import 'package:flutter/material.dart';

/// Flag display widget using country code emoji flags.
/// Phase 3 will add real PNG flag images.
class FlagImage extends StatelessWidget {
  final String countryCode;
  final double size;

  const FlagImage({
    super.key,
    required this.countryCode,
    this.size = 80,
  });

  /// Convert ISO country code to emoji flag.
  String _codeToEmoji(String code) {
    if (code.length != 2) return '🏳️';
    final int firstChar = code.codeUnitAt(0) - 0x41 + 0x1F1E6;
    final int secondChar = code.codeUnitAt(1) - 0x41 + 0x1F1E6;
    return String.fromCharCodes([firstChar, secondChar]);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        _codeToEmoji(countryCode.toUpperCase()),
        style: TextStyle(fontSize: size * 0.6),
      ),
    );
  }
}
