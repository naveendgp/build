import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../models/user_profile_models.dart';
import '../../../../core/utils/haptics.dart';

class CollectionCard extends StatefulWidget {
  final CollectionItem item;
  final VoidCallback? onTap;

  const CollectionCard({super.key, required this.item, this.onTap});

  @override
  State<CollectionCard> createState() => _CollectionCardState();
}

class _CollectionCardState extends State<CollectionCard> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: Duration(milliseconds: 150));
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.97,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
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
          builder: (context, child) => Transform.scale(scale: _scaleAnimation.value, child: child),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: AppSpacing.borderRadiusLg,
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
                          ),
                        ]
                      : [],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    _buildDynamicCover(),
                    // Privacy indicator
                    if (widget.item.isPrivate)
                      Positioned(
                        top: AppSpacing.sm,
                        right: AppSpacing.sm,
                        child: Container(
                          padding: EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.6),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: Icon(
                            Icons.lock_rounded,
                            size: 14,
                            color: context.colors.textPrimary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              SizedBox(height: AppSpacing.sm),
              Text(
                widget.item.title,
                style: AppTypography.titleMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: context.colors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: 2),
              Text(
                '${widget.item.postCount} items • ${widget.item.lastUpdated}',
                style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDynamicCover() {
    final images = widget.item.coverImages;
    if (images.isEmpty) {
      return Container(
        color: context.colors.borderLight.withValues(alpha: 0.3),
        child: Center(
          child: Icon(Icons.folder_outlined, color: context.colors.textTertiary, size: 32),
        ),
      );
    }

    if (images.length == 1) {
      return _buildNetworkImage(images[0]);
    }

    if (images.length == 2) {
      return Row(
        children: [
          Expanded(child: _buildNetworkImage(images[0])),
          SizedBox(width: 2),
          Expanded(child: _buildNetworkImage(images[1])),
        ],
      );
    }

    // 3 or more images: 1 large left, 2 stacked right
    return Row(
      children: [
        Expanded(flex: 2, child: _buildNetworkImage(images[0])),
        SizedBox(width: 2),
        Expanded(
          flex: 1,
          child: Column(
            children: [
              Expanded(child: _buildNetworkImage(images[1])),
              SizedBox(height: 2),
              Expanded(child: _buildNetworkImage(images[2])),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNetworkImage(String url) {
    return Image.network(
      url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (context, error, stackTrace) => Container(
        color: context.colors.borderLight.withValues(alpha: 0.3),
        child: Center(child: Icon(Icons.broken_image_rounded, color: context.colors.textTertiary)),
      ),
    );
  }
}
