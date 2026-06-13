import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../models/user_profile_models.dart';
import '../../../../core/utils/haptics.dart';
import '../../../home/widgets/video_player_widget.dart';

class SaveItemCard extends StatefulWidget {
  final SavedPostItem item;
  final VoidCallback? onTap;

  const SaveItemCard({
    super.key,
    required this.item,
    this.onTap,
  });

  @override
  State<SaveItemCard> createState() => _SaveItemCardState();
}

class _SaveItemCardState extends State<SaveItemCard> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
    if (widget.onTap != null) {
      Haptics.light();
      widget.onTap!();
    }
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) => Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: AppSpacing.borderRadiusMd,
              color: context.colors.card,
              border: Border.all(
                color: _isHovered ? context.colors.borderLight : Colors.transparent,
                width: 1,
              ),
              boxShadow: _isHovered
                  ? [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      )
                    ]
                  : [],
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: widget.item.aspectRatio,
                  child: widget.item.isVideo && widget.item.videoUrl != null
                      ? _buildAutoPlayVideo()
                      : (widget.item.imageUrl.isNotEmpty && !widget.item.imageUrl.toLowerCase().endsWith('.mp4')
                          ? Image.network(
                              widget.item.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                color: context.colors.borderLight.withValues(alpha: 0.3),
                                child: Center(
                                  child: Icon(Icons.broken_image_rounded, color: context.colors.textTertiary),
                                ),
                              ),
                            )
                          : Container(
                              color: context.colors.borderLight.withValues(alpha: 0.3),
                              child: Center(
                                child: Icon(
                                  widget.item.isVideo ? Icons.play_circle_fill_rounded : Icons.bookmark_rounded, 
                                  color: context.colors.textTertiary,
                                  size: 40,
                                ),
                              ),
                            )),
                ),
                // Gradient Overlay for metadata legibility
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.1),
                          Colors.black.withValues(alpha: 0.7),
                        ],
                        stops: [0.5, 0.8, 1.0],
                      ),
                    ),
                  ),
                ),
                // Metadata overlay
                Positioned(
                  left: AppSpacing.sm,
                  right: AppSpacing.sm,
                  bottom: AppSpacing.sm,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.item.title,
                        style: AppTypography.labelMedium.copyWith(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Bookmark indicator
                Positioned(
                  top: AppSpacing.sm,
                  right: AppSpacing.sm,
                  child: Container(
                    padding: EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Icon(
                      Icons.bookmark_rounded,
                      size: 14,
                      color: context.colors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAutoPlayVideo() {
    return VideoPlayerWidget(
      videoUrl: widget.item.videoUrl!,
      aspectRatio: widget.item.aspectRatio,
      allowInteraction: false,
      showControls: false,
    );
  }
}
