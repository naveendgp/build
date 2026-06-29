import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';
import 'dimension_selector.dart';

/// Full media preview step with immersive image/video preview,
/// dimension selector overlay, glassmorphic change button,
/// and optional PageView with smooth dot indicators for multi-media.
class MediaPreviewStep extends StatefulWidget {
  final List<MediaItem> media;
  final MediaDimension dimension;
  final ValueChanged<MediaDimension> onChangeDimension;
  final ValueChanged<int> onChangeMedia;
  final ValueChanged<int> onRemoveMedia;
  final VoidCallback? onAddMore;

  const MediaPreviewStep({
    super.key,
    required this.media,
    required this.dimension,
    required this.onChangeDimension,
    required this.onChangeMedia,
    required this.onRemoveMedia,
    this.onAddMore,
  });

  @override
  State<MediaPreviewStep> createState() => _MediaPreviewStepState();
}

class _MediaPreviewStepState extends State<MediaPreviewStep>
    with SingleTickerProviderStateMixin {
  late final PageController _pageController;
  late final AnimationController _fadeController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  double get _aspectRatio {
    switch (widget.dimension) {
      case MediaDimension.square:
        return 1.0;
      case MediaDimension.vertical:
        return 9.0 / 16.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: CurvedAnimation(
        parent: _fadeController,
        curve: Curves.easeOut,
      ),
      child: Padding(
        padding: AppSpacing.paddingHorizontal,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildPreviewCard(),
            if (widget.media.length > 1) ...[
              const SizedBox(height: AppSpacing.md),
              _buildPageIndicator(),
            ],
          ],
        ),
      ),
    );
  }

  // â”€â”€ Main preview card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildPreviewCard() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
      child: ClipRRect(
        borderRadius: AppSpacing.borderRadiusXl,
        child: AspectRatio(
          aspectRatio: _aspectRatio,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // â”€â”€ Media content â”€â”€
              if (widget.media.length == 1)
                _buildSinglePreview(widget.media.first)
              else
                _buildPageView(),

              // â”€â”€ Change / Add more buttons (top-right) â”€â”€
              Positioned(
                top: AppSpacing.md,
                right: AppSpacing.md,
                child: Row(
                  children: [
                    if (widget.onAddMore != null) ...[
                      _GlassPillButton(
                        label: 'Add More',
                        icon: Icons.add_photo_alternate_rounded,
                        onTap: () {
                          Haptics.light();
                          widget.onAddMore!();
                        },
                      ),
                      const SizedBox(width: AppSpacing.sm),
                    ],
                    _GlassPillButton(
                      label: 'Change',
                      icon: Icons.swap_horiz_rounded,
                      onTap: () {
                        Haptics.light();
                        widget.onChangeMedia(_currentPage);
                      },
                    ),
                  ],
                ),
              ),

              // â”€â”€ Remove button (top-left, only if multiple) â”€â”€
              if (widget.media.length > 1)
                Positioned(
                  top: AppSpacing.md,
                  left: AppSpacing.md,
                  child: _GlassPillButton(
                    label: 'Remove',
                    icon: Icons.close_rounded,
                    onTap: () {
                      Haptics.medium();
                      widget.onRemoveMedia(_currentPage);
                    },
                  ),
                ),

              // â”€â”€ Dimension selector (bottom-center) â”€â”€
              Positioned(
                bottom: AppSpacing.md,
                left: 0,
                right: 0,
                child: Center(
                  child: DimensionSelector(
                    currentDimension: widget.dimension,
                    onChanged: widget.onChangeDimension,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ——— Single image preview ———————————————————————————————————————————————
  Widget _buildSinglePreview(MediaItem item) {
    return _ZoomableMedia(
      key: ValueKey(item.id),
      child: _buildMediaContent(item),
    );
  }

  // ——— PageView for multiple media ————————————————————————————————————————
  Widget _buildPageView() {
    return PageView.builder(
      controller: _pageController,
      itemCount: widget.media.length,
      onPageChanged: (index) {
        setState(() => _currentPage = index);
        Haptics.selection();
      },
      itemBuilder: (context, index) {
        final item = widget.media[index];
        return _ZoomableMedia(
          key: ValueKey(item.id),
          child: _buildMediaContent(item),
        );
      },
    );
  }

  Widget _buildMediaContent(MediaItem item) {
    if (item.type == MediaType.video) {
      return _VideoPreviewWidget(file: item.file);
    }
    return Image.file(
      item.file,
      fit: BoxFit.cover,
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded) return child;
        return AnimatedOpacity(
          opacity: frame != null ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
          child: child,
        );
      },
      errorBuilder: (context, error, stack) => _buildErrorPlaceholder(),
    );
  }

  // â”€â”€ Smooth page indicator dots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildPageIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.media.length, (index) {
        final isActive = index == _currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: isActive ? 20 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: isActive
                ? context.colors.primaryAccent
                : context.colors.textTertiary.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }

  // â”€â”€ Error / placeholder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildErrorPlaceholder() {
    return Container(
      color: context.colors.surface,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.broken_image_rounded,
              color: context.colors.textTertiary,
              size: AppSpacing.iconXl,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Unable to load',
              style: AppTypography.bodySmall.copyWith(
                color: context.colors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Glassmorphic Pill Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _GlassPillButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _GlassPillButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  State<_GlassPillButton> createState() => _GlassPillButtonState();
}

class _GlassPillButtonState extends State<_GlassPillButton> {
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
        scale: _pressed ? 0.92 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: ClipRRect(
          borderRadius: AppSpacing.borderRadiusFull,
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.4),
                borderRadius: AppSpacing.borderRadiusFull,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.12),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    widget.icon,
                    color: context.colors.textPrimary,
                    size: AppSpacing.iconSm,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    widget.label,
                    style: AppTypography.labelMedium.copyWith(
                      color: context.colors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Zoomable media wrapper â”€â”€ supports pinch-to-zoom plus explicit
// zoom in/out buttons (bottom-left), independent per carousel page.
class _ZoomableMedia extends StatefulWidget {
  final Widget child;
  const _ZoomableMedia({super.key, required this.child});

  @override
  State<_ZoomableMedia> createState() => _ZoomableMediaState();
}

class _ZoomableMediaState extends State<_ZoomableMedia> {
  final TransformationController _transformController = TransformationController();
  static const double _minScale = 1.0;
  static const double _maxScale = 4.0;
  static const double _step = 0.5;

  double get _currentScale => _transformController.value.getMaxScaleOnAxis();

  void _zoomBy(double delta) {
    Haptics.light();
    final newScale = (_currentScale + delta).clamp(_minScale, _maxScale);
    setState(() {
      _transformController.value = Matrix4.diagonal3Values(newScale, newScale, 1.0);
    });
  }

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        InteractiveViewer(
          transformationController: _transformController,
          minScale: _minScale,
          maxScale: _maxScale,
          onInteractionEnd: (_) => setState(() {}),
          child: widget.child,
        ),
        Positioned(
          bottom: AppSpacing.md,
          left: AppSpacing.md,
          child: _ZoomControls(
            canZoomOut: _currentScale > _minScale,
            canZoomIn: _currentScale < _maxScale,
            onZoomIn: () => _zoomBy(_step),
            onZoomOut: () => _zoomBy(-_step),
          ),
        ),
      ],
    );
  }
}

class _ZoomControls extends StatelessWidget {
  final bool canZoomIn;
  final bool canZoomOut;
  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;

  const _ZoomControls({
    required this.canZoomIn,
    required this.canZoomOut,
    required this.onZoomIn,
    required this.onZoomOut,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusFull,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.4),
            borderRadius: AppSpacing.borderRadiusFull,
            border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ZoomButton(icon: Icons.remove_rounded, enabled: canZoomOut, onTap: onZoomOut),
              Container(width: 1, height: 18, color: Colors.white.withValues(alpha: 0.15)),
              _ZoomButton(icon: Icons.add_rounded, enabled: canZoomIn, onTap: onZoomIn),
            ],
          ),
        ),
      ),
    );
  }
}

class _ZoomButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _ZoomButton({required this.icon, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Icon(
          icon,
          size: AppSpacing.iconSm,
          color: enabled ? Colors.white : Colors.white.withValues(alpha: 0.35),
        ),
      ),
    );
  }
}

class _VideoPreviewWidget extends StatefulWidget {
  final File file;
  const _VideoPreviewWidget({required this.file});

  @override
  State<_VideoPreviewWidget> createState() => _VideoPreviewWidgetState();
}

class _VideoPreviewWidgetState extends State<_VideoPreviewWidget> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.file(widget.file)
      ..setLooping(true)
      ..setVolume(0.0)
      ..initialize().then((_) {
        if (mounted) {
          setState(() => _isInitialized = true);
          _controller.play();
        }
      }).catchError((_) {});
  }

  @override
  void didUpdateWidget(_VideoPreviewWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.file.path != widget.file.path) {
      _controller.dispose();
      _isInitialized = false;
      _controller = VideoPlayerController.file(widget.file)
        ..setLooping(true)
        ..setVolume(0.0)
        ..initialize().then((_) {
          if (mounted) {
            setState(() => _isInitialized = true);
            _controller.play();
          }
        }).catchError((_) {});
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Container(
        color: Colors.black26,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white54),
        ),
      );
    }
    return SizedBox.expand(
      child: FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: _controller.value.size.width,
          height: _controller.value.size.height,
          child: VideoPlayer(_controller),
        ),
      ),
    );
  }
}
