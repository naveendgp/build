import 'dart:math';
import 'package:flutter/material.dart';

/// Subtle animated particle field — creates a living, breathing background
class ParticleField extends StatefulWidget {
  final int particleCount;

  const ParticleField({super.key, this.particleCount = 30});

  @override
  State<ParticleField> createState() => _ParticleFieldState();
}

class _ParticleFieldState extends State<ParticleField> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<_Particle> _particles;
  final _random = Random();

  @override
  void initState() {
    super.initState();
    _particles = List.generate(widget.particleCount, (_) => _generateParticle());
    _controller = AnimationController(duration: const Duration(seconds: 10), vsync: this)..repeat();
  }

  _Particle _generateParticle() {
    return _Particle(
      x: _random.nextDouble(),
      y: _random.nextDouble(),
      radius: _random.nextDouble() * 2 + 0.5,
      opacity: _random.nextDouble() * 0.06 + 0.02,
      speedX: (_random.nextDouble() - 0.5) * 0.02,
      speedY: (_random.nextDouble() - 0.5) * 0.015,
      phase: _random.nextDouble() * 2 * pi,
    );
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
      builder: (context, _) {
        return CustomPaint(
          painter: _ParticlePainter(particles: _particles, progress: _controller.value),
          size: Size.infinite,
        );
      },
    );
  }
}

class _Particle {
  final double x;
  final double y;
  final double radius;
  final double opacity;
  final double speedX;
  final double speedY;
  final double phase;

  _Particle({
    required this.x,
    required this.y,
    required this.radius,
    required this.opacity,
    required this.speedX,
    required this.speedY,
    required this.phase,
  });
}

class _ParticlePainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ParticlePainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      final t = progress * 2 * pi;
      final x = (particle.x + sin(t + particle.phase) * particle.speedX) * size.width;
      final y = (particle.y + cos(t + particle.phase) * particle.speedY) * size.height;

      // Wrap around
      final px = x % size.width;
      final py = y % size.height;

      final opacity = particle.opacity * (0.5 + 0.5 * sin(t * 2 + particle.phase));

      final paint = Paint()
        ..color = Colors.white.withValues(alpha: opacity.clamp(0.0, 1.0))
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, particle.radius * 0.5);

      canvas.drawCircle(Offset(px, py), particle.radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter oldDelegate) => oldDelegate.progress != progress;
}
