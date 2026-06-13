import 'package:flutter/material.dart';

class ImageUploadCard extends StatefulWidget {
  final String? imageUrl;
  final VoidCallback onTap;
  final bool isBanner;
  final bool isLoading;
  final IconData placeholderIcon;

  const ImageUploadCard({
    super.key,
    this.imageUrl,
    required this.onTap,
    this.isBanner = false,
    this.isLoading = false,
    this.placeholderIcon = Icons.person,
  });

  @override
  State<ImageUploadCard> createState() => _ImageUploadCardState();
}

class _ImageUploadCardState extends State<ImageUploadCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnimation;

  bool get _hasImage => widget.imageUrl != null && widget.imageUrl!.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 200),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    _scaleController.forward();
  }

  void _onTapUp(TapUpDetails _) {
    _scaleController.reverse();
  }

  void _onTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        onTap: widget.isLoading ? null : widget.onTap,
        child: widget.isBanner ? _buildBanner() : _buildAvatar(),
      ),
    );
  }

  // ─── Banner Mode ───────────────────────────────────────────────────────

  Widget _buildBanner() {
    return Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
        ),
        image: _hasImage
            ? DecorationImage(
                image: NetworkImage(widget.imageUrl!.trim()),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: Stack(
        children: [
          // Placeholder when no image
          if (!_hasImage)
            Center(
              child: Icon(
                widget.placeholderIcon,
                size: 48,
                color: Colors.white.withValues(alpha: 0.18),
              ),
            ),

          // Camera icon overlay
          Positioned(
            right: 14,
            bottom: 14,
            child: _cameraOverlay(size: 40, iconSize: 20),
          ),

          // Loading overlay
          if (widget.isLoading) _bannerLoadingOverlay(),
        ],
      ),
    );
  }

  Widget _bannerLoadingOverlay() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Center(
        child: CircularProgressIndicator(
          color: Colors.white,
          strokeWidth: 2.5,
        ),
      ),
    );
  }

  // ─── Avatar Mode ───────────────────────────────────────────────────────

  Widget _buildAvatar() {
    const double radius = 56;

    return SizedBox(
      width: radius * 2 + 4, // account for border
      height: radius * 2 + 4,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Avatar circle
          Container(
            width: radius * 2 + 4,
            height: radius * 2 + 4,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.1),
                width: 2,
              ),
              color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
              image: _hasImage
                  ? DecorationImage(
                      image: NetworkImage(widget.imageUrl!.trim()),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: !_hasImage
                ? Center(
                    child: Icon(
                      widget.placeholderIcon,
                      size: 40,
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                  )
                : null,
          ),

          // Loading overlay
          if (widget.isLoading)
            Container(
              width: radius * 2 + 4,
              height: radius * 2 + 4,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black.withValues(alpha: 0.55),
              ),
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              ),
            ),

          // Camera badge — bottom right
          Positioned(
            right: 2,
            bottom: 2,
            child: _cameraOverlay(size: 32, iconSize: 16),
          ),
        ],
      ),
    );
  }

  // ─── Shared ────────────────────────────────────────────────────────────

  Widget _cameraOverlay({required double size, required double iconSize}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.black.withValues(alpha: 0.55),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
        ),
      ),
      child: Center(
        child: Icon(
          Icons.camera_alt_rounded,
          size: iconSize,
          color: Colors.white.withValues(alpha: 0.85),
        ),
      ),
    );
  }
}
