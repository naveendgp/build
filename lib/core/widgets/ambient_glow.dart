import 'package:flutter/material.dart';

/// Reusable ambient glow effect — radial gradient with optional pulse
class AmbientGlow extends StatefulWidget {
  final Color color;
  final double radius;
  final double opacity;
  final bool animate;
  final Duration duration;

  const AmbientGlow({
    super.key,
    this.color = const Color(0xFF7C5CFF),
    this.radius = 120,
    this.opacity = 0.15,
    this.animate = true,
    this.duration = const Duration(milliseconds: 2500),
  });

  @override
  State<AmbientGlow> createState() => _AmbientGlowState();
}

class _AmbientGlowState extends State<AmbientGlow> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _pulseAnimation = Tween<double>(
      begin: 0.7,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    if (widget.animate) {
      _controller.repeat(reverse: true);
    } else {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Container(
          width: widget.radius * 2 * _pulseAnimation.value,
          height: widget.radius * 2 * _pulseAnimation.value,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                widget.color.withValues(alpha: widget.opacity * _pulseAnimation.value),
                widget.color.withValues(alpha: widget.opacity * 0.3 * _pulseAnimation.value),
                Colors.transparent,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }
}
