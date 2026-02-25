import 'dart:math';
import 'package:flutter/material.dart';

/// Placeholder globe widget — animated gradient sphere.
/// Replaces the Mapbox 3D globe until the token is configured.
class PlaceholderGlobeView extends StatefulWidget {
  final bool darkMode;
  final bool idleRotation;

  const PlaceholderGlobeView({
    super.key,
    this.darkMode = true,
    this.idleRotation = true,
  });

  @override
  State<PlaceholderGlobeView> createState() => _PlaceholderGlobeViewState();
}

class _PlaceholderGlobeViewState extends State<PlaceholderGlobeView>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 60),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.darkMode;
    final bgColor = isDark ? const Color(0xFF0A0E1A) : const Color(0xFFDBEAFE);
    final globeColor1 = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
    final globeColor2 = isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
    final glowColor = isDark
        ? const Color(0xFF3B82F6).withValues(alpha: 0.15)
        : const Color(0xFF3B82F6).withValues(alpha: 0.1);

    return Container(
      color: bgColor,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _GlobePainter(
              progress: widget.idleRotation ? _controller.value : 0,
              globeColor1: globeColor1,
              globeColor2: globeColor2,
              glowColor: glowColor,
              isDark: isDark,
            ),
            size: Size.infinite,
          );
        },
      ),
    );
  }
}

class _GlobePainter extends CustomPainter {
  final double progress;
  final Color globeColor1;
  final Color globeColor2;
  final Color glowColor;
  final bool isDark;

  _GlobePainter({
    required this.progress,
    required this.globeColor1,
    required this.globeColor2,
    required this.glowColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) * 0.35;

    // Ambient glow
    final glowPaint = Paint()
      ..shader = RadialGradient(
        colors: [glowColor, glowColor.withValues(alpha: 0)],
        stops: const [0.5, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius * 1.5));
    canvas.drawCircle(center, radius * 1.5, glowPaint);

    // Globe base
    final globePaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.3, -0.3),
        colors: [globeColor2, globeColor1],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, globePaint);

    // Grid lines (meridians + parallels) with rotation
    final linePaint = Paint()
      ..color = (isDark ? Colors.white : Colors.black).withValues(alpha: 0.06)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final rotation = progress * 2 * pi;

    // Parallels (horizontal circles at different latitudes)
    for (int i = -60; i <= 60; i += 30) {
      final latRad = i * pi / 180;
      final parallelRadius = radius * cos(latRad);
      final yOffset = radius * sin(latRad);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset(center.dx, center.dy - yOffset),
          width: parallelRadius * 2,
          height: parallelRadius * 0.3,
        ),
        linePaint,
      );
    }

    // Meridians (vertical arcs)
    for (int i = 0; i < 6; i++) {
      final angle = (i * pi / 3) + rotation;
      final xScale = cos(angle);
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.scale(xScale.abs() < 0.1 ? 0.1 : xScale, 1.0);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset.zero,
          width: radius * 0.1,
          height: radius * 2,
        ),
        linePaint,
      );
      canvas.restore();
    }

    // Highlight specular reflection
    final specularPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.4, -0.4),
        colors: [Colors.white.withValues(alpha: 0.1), Colors.transparent],
        stops: const [0.0, 0.6],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, specularPaint);

    // "Mapbox required" text
    final textStyle = TextStyle(
      color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.3),
      fontSize: 12,
    );
    final textPainter = TextPainter(
      text: TextSpan(text: 'Configure Mapbox for 3D Globe', style: textStyle),
      textDirection: TextDirection.ltr,
    )..layout();
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy + radius + 20),
    );
  }

  @override
  bool shouldRepaint(covariant _GlobePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
