import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';

class NotificationEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const NotificationEmptyState({
    super.key,
    this.title = "You're all caught up",
    this.subtitle = "Nothing new right now. Discover new brands to stay updated.",
    this.icon = Icons.notifications_none_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: context.colors.surface,
              shape: BoxShape.circle,
              border: Border.all(color: context.colors.border, width: 0.5),
            ),
            child: Icon(icon, size: 48, color: context.colors.textTertiary),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            title,
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxxl),
            child: Text(
              subtitle,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class NotificationSkeleton extends StatefulWidget {
  const NotificationSkeleton({super.key});

  @override
  State<NotificationSkeleton> createState() => _NotificationSkeletonState();
}

class _NotificationSkeletonState extends State<NotificationSkeleton>
    with SingleTickerProviderStateMixin {
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
        final translateX = -1.0 + (_controller.value * 3.0);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
          child: Column(
            children: List.generate(6, (index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: _SkeletonCard(translateX: translateX),
              );
            }),
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
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: context.colors.cinematicGradient,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ShimmerBox(
            width: 48,
            height: 48,
            borderRadius: AppSpacing.radiusFull,
            translateX: translateX,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ShimmerBox(
                  width: 140,
                  height: 14,
                  borderRadius: AppSpacing.radiusSm,
                  translateX: translateX,
                ),
                const SizedBox(height: AppSpacing.sm),
                _ShimmerBox(
                  width: double.infinity,
                  height: 12,
                  borderRadius: AppSpacing.radiusSm,
                  translateX: translateX,
                ),
                const SizedBox(height: AppSpacing.xs),
                _ShimmerBox(
                  width: 200,
                  height: 12,
                  borderRadius: AppSpacing.radiusSm,
                  translateX: translateX,
                ),
              ],
            ),
          ),
        ],
      ),
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
                Colors.black,
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
