import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';
import '../providers/create_post_provider.dart';

/// Full media preview step with immersive image/video preview,
/// dimension selector overlay, glassmorphic change button,
/// and optional PageView with smooth dot indicators for multi-media.
class MediaPreviewStep extends StatefulWidget {
  final List<MediaItem> media;
  final ValueChanged<int> onChangeMedia;
  final ValueChanged<int> onRemoveMedia;
  final VoidCallback? onAddMore;
  // Fired while a finger is down on the zoomable image, so an ancestor
  // Scrollable (this step is wrapped in one for smaller screens) can
  // disable its own scroll physics and stop stealing single-finger pan
  // gestures from InteractiveViewer's gesture arena.
  final VoidCallback? onImageInteractionStart;
  final VoidCallback? onImageInteractionEnd;

  const MediaPreviewStep({
    super.key,
    required this.media,
    required this.onChangeMedia,
    required this.onRemoveMedia,
    this.onAddMore,
    this.onImageInteractionStart,
    this.onImageInteractionEnd,
  });

  @override
  State<MediaPreviewStep> createState() => _MediaPreviewStepState();
}

class _MediaPreviewStepState extends State<MediaPreviewStep>
    with SingleTickerProviderStateMixin {
  late final PageController _pageController;
  late final AnimationController _fadeController;
  int _currentPage = 0;
  // While the active page's image is zoomed in, the carousel PageView must
  // stop claiming horizontal drags — otherwise it wins the gesture arena
  // against InteractiveViewer's pan every time, and a sideways drag meant
  // to reposition the zoomed image instead flips to the next photo.
  bool _isZoomed = false;

  // Intrinsic width/height ratio per media id. Needed so the preview can lay
  // the image out at its full cover-scaled size (overflowing the square crop
  // frame) instead of letting BoxFit.cover pre-crop it — otherwise there is
  // no off-frame content to drag into view and repositioning is impossible.
  final Map<String, double> _aspectCache = {};

  void _ensureAspect(MediaItem item) {
    if (item.type != MediaType.image || _aspectCache.containsKey(item.id)) return;
    final stream = FileImage(item.file).resolve(const ImageConfiguration());
    late final ImageStreamListener listener;
    listener = ImageStreamListener(
      (info, _) {
        stream.removeListener(listener);
        if (!mounted) return;
        setState(() {
          _aspectCache[item.id] = info.image.width / info.image.height;
        });
      },
      onError: (_, _) => stream.removeListener(listener),
    );
    stream.addListener(listener);
  }

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
            const SizedBox(height: AppSpacing.md),
            if (widget.media.length > 1) ...[
              _buildPageIndicator(),
              const SizedBox(height: AppSpacing.md),
            ],
            _buildControlsSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildControlsSection() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (widget.media.length > 1)
              _GlassPillButton(
                label: 'Remove',
                icon: Icons.close_rounded,
                onTap: () {
                  Haptics.medium();
                  widget.onRemoveMedia(_currentPage);
                },
              )
            else
              const SizedBox.shrink(),
            Row(
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
          ],
        ),
      ],
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
          aspectRatio: 1.0,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Media content
              if (widget.media.length == 1)
                _buildSinglePreview(widget.media.first)
              else
                _buildPageView(),
            ],
          ),
        ),
      ),
    );
  }

  // ——— Single image preview ———————————————————————————————————————————————
  Widget _buildSinglePreview(MediaItem item) {
    _ensureAspect(item);
    return LayoutBuilder(builder: (context, constraints) {
      final size = Size(constraints.maxWidth, constraints.maxHeight);
      return _ZoomableMedia(
        key: ValueKey(item.id),
        contentAspect: _aspectCache[item.id],
        onTransformChanged: (matrix) {
          final ref = ProviderScope.containerOf(context);
          ref.read(createPostProvider.notifier).updateMediaTransform(item.id, matrix, size);
        },
        onPanStart: widget.onImageInteractionStart,
        onPanEnd: widget.onImageInteractionEnd,
        child: _buildMediaContent(item),
      );
    });
  }

  // ——— PageView for multiple media ————————————————————————————————————————
  Widget _buildPageView() {
    return PageView.builder(
      controller: _pageController,
      // Disabled while zoomed in so a sideways drag pans the image via
      // InteractiveViewer instead of the PageView stealing it to flip pages.
      physics: _isZoomed ? const NeverScrollableScrollPhysics() : const PageScrollPhysics(),
      itemCount: widget.media.length,
      onPageChanged: (index) {
        setState(() {
          _currentPage = index;
          _isZoomed = false;
        });
        Haptics.selection();
      },
      itemBuilder: (context, index) {
        final item = widget.media[index];
        _ensureAspect(item);
        return LayoutBuilder(builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          return _ZoomableMedia(
            key: ValueKey(item.id),
            contentAspect: _aspectCache[item.id],
            onTransformChanged: (matrix) {
              final ref = ProviderScope.containerOf(context);
              ref.read(createPostProvider.notifier).updateMediaTransform(item.id, matrix, size);
            },
            onScaleChanged: (scale) {
              final zoomed = scale > 1.01;
              if (zoomed != _isZoomed) setState(() => _isZoomed = zoomed);
            },
            onPanStart: widget.onImageInteractionStart,
            onPanEnd: widget.onImageInteractionEnd,
            child: _buildMediaContent(item),
          );
        });
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
  final ValueChanged<Matrix4>? onTransformChanged;
  final VoidCallback? onPanStart;
  final VoidCallback? onPanEnd;
  // Fired whenever the current zoom scale changes (pinch gesture or the
  // +/- buttons), so an ancestor carousel PageView can disable its own
  // swipe physics while zoomed in — see MediaPreviewStep._isZoomed.
  final ValueChanged<double>? onScaleChanged;
  // Intrinsic width/height of the media, when known. Drives the cover-size
  // layout + pan bounds so the user can drag the off-frame part of the image
  // into view. Null (e.g. video, or aspect not resolved yet) falls back to
  // the previous fill-the-frame behaviour.
  final double? contentAspect;
  const _ZoomableMedia({
    super.key,
    required this.child,
    this.onTransformChanged,
    this.onPanStart,
    this.onPanEnd,
    this.onScaleChanged,
    this.contentAspect,
  });

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
    final current = _currentScale;
    final newScale = (current + delta).clamp(_minScale, _maxScale);
    if (newScale == current) return;
    setState(() {
      // Scale relative to the existing matrix instead of replacing it with a
      // fresh diagonal one — the old approach silently discarded whatever
      // repositioning the user had already done.
      final factor = newScale / current;
      _transformController.value = _transformController.value.clone()
        ..scaleByDouble(factor, factor, 1.0, 1.0);
    });
    widget.onTransformChanged?.call(_transformController.value);
    widget.onScaleChanged?.call(newScale);
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
        // Listener (not a gesture recognizer) fires on the raw pointer
        // stream regardless of which recognizer wins the gesture arena, so
        // this reliably brackets every touch on the image — used to tell
        // the ancestor Scrollable to stand down for the duration so it
        // stops competing for single-finger pan gestures.
        Listener(
          onPointerDown: (_) => widget.onPanStart?.call(),
          onPointerUp: (_) => widget.onPanEnd?.call(),
          onPointerCancel: (_) => widget.onPanEnd?.call(),
          child: LayoutBuilder(builder: (context, constraints) {
            final vw = constraints.maxWidth;
            final vh = constraints.maxHeight;
            final aspect = widget.contentAspect;

            var content = widget.child;
            // Default zero margin clamps translation to exactly (0,0) when
            // the child is the same size as the viewport — which is why
            // repositioning did nothing before.
            var boundary = EdgeInsets.zero;

            if (aspect != null && aspect > 0 && vw.isFinite && vh.isFinite && vw > 0 && vh > 0) {
              // Size the image to *cover* the frame, letting it overflow on
              // the long axis, so there is real content off-frame to drag in.
              final viewportAspect = vw / vh;
              final double cw, ch;
              if (aspect > viewportAspect) {
                ch = vh;
                cw = vh * aspect;
              } else {
                cw = vw;
                ch = vw / aspect;
              }
              content = OverflowBox(
                maxWidth: double.infinity,
                maxHeight: double.infinity,
                child: SizedBox(width: cw, height: ch, child: widget.child),
              );
              // Allow panning exactly as far as the overflow — reveals every
              // part of the image, never drags blank space into frame.
              boundary = EdgeInsets.symmetric(
                horizontal: ((cw - vw) / 2).clamp(0.0, double.infinity),
                vertical: ((ch - vh) / 2).clamp(0.0, double.infinity),
              );
            }

            return InteractiveViewer(
              transformationController: _transformController,
              minScale: _minScale,
              maxScale: _maxScale,
              boundaryMargin: boundary,
              // Reported continuously (not just at gesture end) so a pinch
              // that crosses back to scale 1.0 mid-gesture re-enables the
              // carousel swipe in time for the very next drag.
              onInteractionUpdate: (details) {
                widget.onScaleChanged?.call(_currentScale);
              },
              onInteractionEnd: (details) {
                setState(() {});
                widget.onTransformChanged?.call(_transformController.value);
                widget.onScaleChanged?.call(_currentScale);
              },
              child: content,
            );
          }),
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
          child: CircularProgressIndicator.adaptive(valueColor: AlwaysStoppedAnimation<Color>(Colors.white54)),
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
