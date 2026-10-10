import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../theme/app_theme.dart';

/// The first frame of a video, for lists that show posts as thumbnails.
///
/// A video post has no stored thumbnail — `PostMedia` keeps a url and nothing
/// else — so every video appeared as a grey tile with a camera icon on it. The
/// player is already part of the app, so the frame is taken from the video
/// itself: it opens the file, holds on frame zero and never plays.
class VideoThumbnail extends StatefulWidget {
  final String url;
  final double size;

  /// Drawn over the frame, so a video reads as a video at a glance.
  final bool showPlayBadge;

  const VideoThumbnail({
    super.key,
    required this.url,
    required this.size,
    this.showPlayBadge = true,
  });

  @override
  State<VideoThumbnail> createState() => _VideoThumbnailState();
}

class _VideoThumbnailState extends State<VideoThumbnail> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(VideoThumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _controller?.dispose();
      _controller = null;
      _failed = false;
      _load();
    }
  }

  Future<void> _load() async {
    final uri = Uri.tryParse(widget.url);
    if (uri == null) {
      setState(() => _failed = true);
      return;
    }
    final controller = VideoPlayerController.networkUrl(uri);
    try {
      await controller.initialize();
      await controller.setVolume(0);
      // The frame it opens on is the one that is shown; it is never played.
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _controller = controller);
    } catch (e) {
      debugPrint('[video thumbnail] ${widget.url}: $e');
      await controller.dispose();
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (controller != null && controller.value.isInitialized)
            FittedBox(
              fit: BoxFit.cover,
              clipBehavior: Clip.hardEdge,
              child: SizedBox(
                width: controller.value.size.width,
                height: controller.value.size.height,
                child: VideoPlayer(controller),
              ),
            )
          else
            Container(
              color: context.colors.surfaceSecondary,
              alignment: Alignment.center,
              child: _failed
                  ? Icon(
                      Icons.videocam_off_rounded,
                      size: widget.size * 0.22,
                      color: context.colors.textTertiary,
                    )
                  : SizedBox(
                      width: widget.size * 0.22,
                      height: widget.size * 0.22,
                      child: CircularProgressIndicator.adaptive(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(context.colors.textTertiary),
                      ),
                    ),
            ),
          if (widget.showPlayBadge && controller != null && controller.value.isInitialized)
            Align(
              alignment: Alignment.bottomRight,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: Icon(
                    Icons.play_arrow_rounded,
                    size: widget.size * 0.2,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
