import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';

class MediaCarousel extends StatefulWidget {
  final List<String> imageUrls;
  final double aspectRatio;

  const MediaCarousel({super.key, required this.imageUrls, required this.aspectRatio});

  @override
  State<MediaCarousel> createState() => _MediaCarouselState();
}

class _MediaCarouselState extends State<MediaCarousel> {
  int _currentIndex = 0;

  /// Advances on its own every 10s. Four was quicker than a picture takes to
  /// look at.
  static const _interval = Duration(seconds: 10);

  /// A swipe holds the timer off for longer than one tick, so it stays out of
  /// the way while someone is looking through the pictures themselves.
  static const _pauseAfterSwipe = Duration(seconds: 20);

  final PageController _controller = PageController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startTimer([Duration delay = _interval]) {
    _timer?.cancel();
    if (widget.imageUrls.length < 2) return;
    _timer = Timer(delay, () {
      if (!mounted || !_controller.hasClients) return;
      final next = (_currentIndex + 1) % widget.imageUrls.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
      _startTimer();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1 / widget.aspectRatio,
      child: Listener(
        onPointerDown: (_) => _timer?.cancel(),
        onPointerUp: (_) => _startTimer(_pauseAfterSwipe),
        child: Stack(
          children: [
            PageView.builder(
              controller: _controller,
              itemCount: widget.imageUrls.length,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemBuilder: (context, index) {
                return CachedNetworkImage(
                  imageUrl: widget.imageUrls[index],
                  fit: BoxFit.cover,
                  memCacheWidth: 800,
                  placeholder: (context, url) => Container(
                    color: context.colors.surface,
                    child: Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator.adaptive(
                          strokeWidth: 1.5,
                          valueColor: AlwaysStoppedAnimation(
                            context.colors.primaryAccent.withValues(alpha: 0.3),
                          ),
                        ),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: context.colors.surface,
                    child: Center(child: Icon(Icons.error_outline, color: context.colors.error)),
                  ),
                );
              },
            ),
            if (widget.imageUrls.length > 1)
              Positioned(
                bottom: 12,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(widget.imageUrls.length, (index) {
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _currentIndex == index
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.4),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
