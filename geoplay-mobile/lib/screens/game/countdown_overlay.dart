import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// 3-2-1 countdown overlay with spring animation.
class CountdownOverlay extends StatefulWidget {
  final int? timeLeft;
  final VoidCallback? onComplete;

  const CountdownOverlay({super.key, this.timeLeft, this.onComplete});

  @override
  State<CountdownOverlay> createState() => _CountdownOverlayState();
}

class _CountdownOverlayState extends State<CountdownOverlay> {
  int _count = 3;

  @override
  void initState() {
    super.initState();
    if (widget.timeLeft == null) {
      _tick();
    }
  }

  void _tick() {
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      if (_count > 1) {
        setState(() => _count--);
        _tick();
      } else {
        widget.onComplete?.call();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    var display = '';
    if (widget.timeLeft != null) {
       display = widget.timeLeft! > 3 ? 'READY?' : (widget.timeLeft! > 0 ? '${widget.timeLeft}' : 'GO!');
    } else {
       display = _count == 0 ? 'GO!' : '$_count';
    }

    return Container(
      color: Colors.black.withValues(alpha: 0.6),
      child: Center(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: Text(
            display,
            key: ValueKey(display),
            style: TextStyle(
              color: Colors.white,
              fontSize: display == 'READY?' ? 64 : 96,
              fontWeight: FontWeight.w900,
              letterSpacing: -2,
            ),
          ),
        ),
      ).animate(
        key: ValueKey(display),
      ).scale(
        begin: const Offset(0.3, 0.3),
        end: const Offset(1.0, 1.0),
        duration: const Duration(milliseconds: 400),
        curve: Curves.elasticOut,
      ).fadeIn(duration: const Duration(milliseconds: 200)),
    );
  }
}
