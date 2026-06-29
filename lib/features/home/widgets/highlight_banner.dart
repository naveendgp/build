import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../../../core/theme/app_typography.dart';

class HighlightBanner extends StatefulWidget {
  final String text;
  final String? theme;
  final String? animation;
  final String? icon;

  const HighlightBanner({
    super.key,
    required this.text,
    this.theme,
    this.animation,
    this.icon,
  });

  @override
  State<HighlightBanner> createState() => _HighlightBannerState();
}

class _HighlightBannerState extends State<HighlightBanner> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _isVisible = false;
  final ScrollController _scrollController = ScrollController();
  final double _scrollSpeed = 30.0; // pixels per second

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(_onTick);
  }

  void _onTick() {
    if (!_isVisible || widget.animation == 'Static Text') return;
    
    if (_scrollController.hasClients) {
      final maxExtent = _scrollController.position.maxScrollExtent;
      if (maxExtent <= 0) return; // Doesn't need scrolling

      double newOffset = _scrollController.offset + (_scrollSpeed / 60); // Assuming 60fps
      if (newOffset >= maxExtent) {
        newOffset = 0.0;
      }
      _scrollController.jumpTo(newOffset);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Color _getBackgroundColor() {
    return const Color(0xFFFF0000); // Primary Red
  }

  Color _getTextColor() {
    return Colors.white;
  }

  IconData? _getIconData() {
    switch (widget.icon) {
      case 'Announcement': return Icons.campaign_rounded;
      case 'Trending': return Icons.local_fire_department_rounded;
      case 'Featured': return Icons.star_rounded;
      case 'Event': return Icons.event_rounded;
      case 'Limited Time': return Icons.bolt_rounded;
      case 'Offer': return Icons.card_giftcard_rounded;
      case 'Location': return Icons.location_on_rounded;
      default: return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.text.isEmpty) return const SizedBox.shrink();

    final bgColor = _getBackgroundColor();
    final textColor = _getTextColor();
    final iconData = null; // Removed icons

    final isScrolling = true; // Default to scrolling since options are removed
    final isRepeating = false;

    return VisibilityDetector(
      key: Key('highlight_banner_${widget.text.hashCode}'),
      onVisibilityChanged: (info) {
        if (!mounted) return;
        final visible = info.visibleFraction > 0.1;
        if (visible != _isVisible) {
          setState(() {
            _isVisible = visible;
            if (_isVisible && (isScrolling || isRepeating)) {
              _controller.repeat();
            } else {
              _controller.stop();
            }
          });
        }
      },
      child: Container(
        height: 26,
        width: double.infinity,
        color: bgColor,
        child: isScrolling || isRepeating
            ? ListView.builder(
                controller: _scrollController,
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildContentRow(textColor, iconData),
                        const SizedBox(width: 12),
                        Text(
                          '—',
                          style: AppTypography.labelSmall.copyWith(
                            color: textColor.withValues(alpha: 0.6),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              )
            : Center(
                child: _buildContentRow(textColor, iconData),
              ),
      ),
    );
  }

  Widget _buildContentRow(Color textColor, IconData? iconData) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (iconData != null) ...[
          Icon(iconData, color: textColor, size: 13),
          const SizedBox(width: 6),
        ],
        Text(
          widget.text.toUpperCase(),
          style: AppTypography.labelSmall.copyWith(
            color: textColor,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.0,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
