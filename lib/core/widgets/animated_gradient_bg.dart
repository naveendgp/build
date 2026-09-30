import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Full-screen cinematic animated gradient background
class AnimatedGradientBg extends StatefulWidget {
  final List<Color>? colors;
  final Widget? child;

  const AnimatedGradientBg({super.key, this.colors, this.child});

  @override
  State<AnimatedGradientBg> createState() => _AnimatedGradientBgState();
}

class _AnimatedGradientBgState extends State<AnimatedGradientBg>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(seconds: 8), vsync: this)..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        return Container(
          decoration: BoxDecoration(color: context.colors.background),
          child: Stack(
            children: [
              // Primary ambient orb
              Positioned(
                top: -50 + sin(t * 2 * pi) * 30,
                right: -80 + cos(t * 2 * pi) * 20,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        context.colors.primaryAccent.withValues(alpha: 0.12),
                        context.colors.primaryAccent.withValues(alpha: 0.03),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              // Secondary ambient orb
              Positioned(
                bottom: -100 + cos(t * 2 * pi) * 25,
                left: -60 + sin(t * 2 * pi) * 15,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        context.colors.primaryAccent.withValues(alpha: 0.08),
                        context.colors.primaryAccent.withValues(alpha: 0.02),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              // Tertiary subtle orb
              Positioned(
                top: MediaQuery.of(context).size.height * 0.4,
                left: MediaQuery.of(context).size.width * 0.3 + sin(t * 2 * pi + 1.5) * 20,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        context.colors.secondaryAccent.withValues(alpha: 0.05),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              if (widget.child != null) widget.child!,
            ],
          ),
        );
      },
      child: widget.child,
    );
  }
}
