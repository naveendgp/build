import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';

class CommentSkeleton extends StatefulWidget {
  const CommentSkeleton({super.key});

  @override
  State<CommentSkeleton> createState() => _CommentSkeletonState();
}

class _CommentSkeletonState extends State<CommentSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))
      ..repeat();
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
        final shimmerValue = _controller.value;
        // Slide gradient from left (-1.0) to right (2.0)
        final translateX = -1.0 + (shimmerValue * 3.0);

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SingleChildScrollView(
            physics: const NeverScrollableScrollPhysics(),
            child: Column(
              children: List.generate(4, (index) {
                return Padding(
                  padding: EdgeInsets.only(bottom: index < 3 ? AppSpacing.lg : 0),
                  child: _SkeletonCard(translateX: translateX),
                );
              }),
            ),
          ),
        );
      },
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  final double translateX;

  const _SkeletonCard({required this.translateX});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Avatar circle
        _ShimmerBox(
          width: 38,
          height: 38,
          borderRadius: AppSpacing.radiusFull,
          translateX: translateX,
        ),
        const SizedBox(width: AppSpacing.md),
        // Text content column
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Username placeholder
              _ShimmerBox(
                width: 120,
                height: 12,
                borderRadius: AppSpacing.radiusSm,
                translateX: translateX,
              ),
              const SizedBox(height: 8),
              // Content line 1 — full width
              _ShimmerBox(
                width: double.infinity,
                height: 14,
                borderRadius: AppSpacing.radiusSm,
                translateX: translateX,
              ),
              const SizedBox(height: 6),
              // Content line 2
              _ShimmerBox(
                width: 200,
                height: 14,
                borderRadius: AppSpacing.radiusSm,
                translateX: translateX,
              ),
              const SizedBox(height: 10),
              // Action row placeholder
              _ShimmerBox(
                width: 80,
                height: 10,
                borderRadius: AppSpacing.radiusSm,
                translateX: translateX,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final double translateX;

  const _ShimmerBox({
    required this.width,
    required this.height,
    required this.borderRadius,
    required this.translateX,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        width: width,
        height: height,
        child: ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Colors.black.withValues(alpha: 0.1),
                Colors.black.withValues(alpha: 0.8),
                Colors.black.withValues(alpha: 0.1),
              ],
              stops: const [0.0, 0.5, 1.0],
              transform: _SlidingGradientTransform(translateX),
            ).createShader(bounds);
          },
          child: Container(
            width: width,
            height: height,
            color: Colors.black.withValues(alpha: 0.1),
          ),
        ),
      ),
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double translateX;

  const _SlidingGradientTransform(this.translateX);

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * translateX, 0.0, 0.0);
  }
}
