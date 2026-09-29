import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';

/// Premium media selection dropzone with animated dashed border,
/// radial glow background, and floating glass action buttons.
class MediaSelectionStep extends StatefulWidget {
  final VoidCallback onPickImages;
  final VoidCallback onPickVideo;

  const MediaSelectionStep({super.key, required this.onPickImages, required this.onPickVideo});

  @override
  State<MediaSelectionStep> createState() => _MediaSelectionStepState();
}

class _MediaSelectionStepState extends State<MediaSelectionStep> with TickerProviderStateMixin {
  late final AnimationController _entryController;
  late final AnimationController _dashController;
  late final Animation<double> _scaleAnim;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();

    // â”€â”€ Entry animation: scale + fade â”€â”€
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = CurvedAnimation(parent: _entryController, curve: Curves.easeOutBack);
    _fadeAnim = CurvedAnimation(parent: _entryController, curve: Curves.easeOut);

    // â”€â”€ Animated dashed border rotation â”€â”€
    _dashController = AnimationController(vsync: this, duration: const Duration(seconds: 12))
      ..repeat();

    _entryController.forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    _dashController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnim,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: Padding(
          padding: AppSpacing.paddingHorizontal,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildDropzoneCard(),
              const SizedBox(height: AppSpacing.xl),
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  // â”€â”€ Cinematic dropzone card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildDropzoneCard() {
    return GestureDetector(
      onTap: () {
        Haptics.light();
        widget.onPickImages();
      },
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Subtle radial glow behind the card
          Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  context.colors.primaryAccent.withValues(alpha: 0.08),
                  context.colors.primaryAccent.withValues(alpha: 0.02),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),

          // Main card with animated dashed border
          AnimatedBuilder(
            animation: _dashController,
            builder: (context, child) {
              return CustomPaint(
                painter: _AnimatedDashBorderPainter(
                  progress: _dashController.value,
                  color: context.colors.primaryAccent.withValues(alpha: 0.35),
                  borderRadius: AppSpacing.radiusXxl,
                  dashWidth: 8,
                  dashGap: 6,
                  strokeWidth: 1.5,
                ),
                child: child,
              );
            },
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxWidth: 400),
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.xxxl,
                horizontal: AppSpacing.xl,
              ),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: AppSpacing.borderRadiusXxl,
                border: Border.all(color: context.colors.border, width: 1),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Camera icon with glow ring
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          context.colors.primaryAccent.withValues(alpha: 0.15),
                          context.colors.primaryAccent.withValues(alpha: 0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(
                        color: context.colors.primaryAccent.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: Icon(
                      Icons.camera_alt_rounded,
                      color: context.colors.primaryAccent,
                      size: AppSpacing.iconXl,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Title
                  Text(
                    'Create your post',
                    style: AppTypography.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),

                  // Subtitle
                  Text(
                    'Tap to select media',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // â”€â”€ Floating glass action buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _GlassActionButton(
          icon: Icons.camera_alt_rounded,
          label: 'Photo',
          onTap: () {
            Haptics.light();
            widget.onPickImages();
          },
        ),
        const SizedBox(width: AppSpacing.md),
        _GlassActionButton(
          icon: Icons.videocam_rounded,
          label: 'Video',
          onTap: () {
            Haptics.light();
            widget.onPickVideo();
          },
        ),
      ],
    );
  }
}

// â”€â”€ Glass Action Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _GlassActionButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _GlassActionButton({required this.icon, required this.label, required this.onTap});

  @override
  State<_GlassActionButton> createState() => _GlassActionButtonState();
}

class _GlassActionButtonState extends State<_GlassActionButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.93 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: ClipRRect(
          borderRadius: AppSpacing.borderRadiusLg,
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: AppSpacing.borderRadiusLg,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(widget.icon, color: context.colors.textPrimary, size: AppSpacing.iconMd),
                  const SizedBox(width: AppSpacing.sm),
                  Text(widget.label, style: AppTypography.labelLarge),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Animated Dashed Border Painter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _AnimatedDashBorderPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double borderRadius;
  final double dashWidth;
  final double dashGap;
  final double strokeWidth;

  _AnimatedDashBorderPainter({
    required this.progress,
    required this.color,
    required this.borderRadius,
    required this.dashWidth,
    required this.dashGap,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rrect = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(borderRadius));

    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics().first;
    final totalLength = metrics.length;
    final dashTotal = dashWidth + dashGap;
    final offset = progress * dashTotal;

    double distance = -offset;
    while (distance < totalLength) {
      final start = distance.clamp(0.0, totalLength);
      final end = (distance + dashWidth).clamp(0.0, totalLength);
      if (end > start) {
        final extractedPath = metrics.extractPath(start, end);
        canvas.drawPath(extractedPath, paint);
      }
      distance += dashTotal;
    }
  }

  @override
  bool shouldRepaint(_AnimatedDashBorderPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
