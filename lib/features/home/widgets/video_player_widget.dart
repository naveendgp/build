import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import 'package:cached_network_image/cached_network_image.dart';

class _VideoPlaybackManager {
  static final _VideoPlaybackManager instance = _VideoPlaybackManager._();
  _VideoPlaybackManager._();
  
  _VideoPlayerWidgetState? _activePlayer;

  void register(_VideoPlayerWidgetState player) {
    if (_activePlayer != null && _activePlayer != player) {
      _activePlayer!.pauseInternally();
    }
    _activePlayer = player;
  }
  
  void unregister(_VideoPlayerWidgetState player) {
    if (_activePlayer == player) {
      _activePlayer = null;
    }
  }
}

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final double aspectRatio;
  final String? placeholderUrl;
  final bool allowInteraction;
  final bool showControls;
  final double? initialPosition;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    required this.aspectRatio,
    this.placeholderUrl,
    this.allowInteraction = true,
    this.showControls = true,
    this.initialPosition,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  double _visibleFraction = 0.0;
  bool _isPlaying = false;
  bool _isBuffering = false;
  bool _isMuted = true;

  bool _shouldInitialize = false;

  @override
  void initState() {
    super.initState();
    _isMuted = !widget.allowInteraction;
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _VideoPlaybackManager.instance.unregister(this);
      _controller?.removeListener(_onControllerUpdate);
      _controller?.dispose();
      _isInitialized = false;
      _hasError = false;
      _isPlaying = false;
      _isBuffering = false;
      _shouldInitialize = false;
    }
  }

  void _onControllerUpdate() {
    if (_controller == null || !mounted) return;
    final isPlaying = _controller!.value.isPlaying;
    final isBuffering = _controller!.value.isBuffering;
    
    if (isPlaying != _isPlaying || isBuffering != _isBuffering) {
      setState(() {
        _isPlaying = isPlaying;
        _isBuffering = isBuffering;
      });
      if (isPlaying && widget.allowInteraction && !_isMuted) {
        _VideoPlaybackManager.instance.register(this);
      }
    }
  }

  void pauseInternally() {
    if (mounted && _controller != null && _controller!.value.isPlaying) {
      _controller!.pause().catchError((_) {});
    }
  }

  Future<void> _initPlayer() async {
    final url = ApiClient.resolveMediaUrl(widget.videoUrl);
    _controller = VideoPlayerController.networkUrl(Uri.parse(url));
    _controller!.addListener(_onControllerUpdate);
    
    try {
      await _controller!.initialize();
      _controller!.setLooping(true);
      _controller!.setVolume(_isMuted ? 0.0 : 1.0);
      
      if (widget.initialPosition != null) {
        await _controller!.seekTo(Duration(milliseconds: (widget.initialPosition! * 1000).toInt()));
      }
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
        
        if (_visibleFraction > 0.5) {
          if (widget.allowInteraction && !_isMuted) {
            _VideoPlaybackManager.instance.register(this);
          }
          _controller!.play().catchError((e) {
            debugPrint("Auto-play error: $e");
          });
        }
      }
    } catch (e) {
      debugPrint("Video initialization error: $e");
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _VideoPlaybackManager.instance.unregister(this);
    _controller?.removeListener(_onControllerUpdate);
    _controller?.dispose();
    super.dispose();
  }

  void _handleVisibilityChanged(VisibilityInfo info) {
    _visibleFraction = info.visibleFraction;

    // Fully scrolled off-screen — release the native surface instead of just
    // pausing, otherwise every video card ever scrolled past keeps holding a
    // SurfaceView and Android eventually runs out of BLASTBufferQueue buffers.
    if (_visibleFraction == 0.0) {
      if (_isInitialized || _controller != null) {
        _VideoPlaybackManager.instance.unregister(this);
        _controller?.removeListener(_onControllerUpdate);
        _controller?.dispose();
        _controller = null;
        _shouldInitialize = false;
        if (mounted) {
          setState(() {
            _isInitialized = false;
            _isPlaying = false;
            _isBuffering = false;
          });
        } else {
          _isInitialized = false;
          _isPlaying = false;
          _isBuffering = false;
        }
      }
      return;
    }

    if (!_shouldInitialize) {
      _shouldInitialize = true;
      _initPlayer();
      return;
    }

    if (!_isInitialized || _controller == null) return;

    // Play if > 50% visible, otherwise pause
    if (_visibleFraction > 0.5) {
      if (!_isPlaying) {
        if (widget.allowInteraction && !_isMuted) {
          _VideoPlaybackManager.instance.register(this);
        }
        _controller!.play().catchError((_) {});
      }
    } else {
      if (_isPlaying) {
        _controller!.pause().catchError((_) {});
      }
    }
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _controller?.setVolume(_isMuted ? 0.0 : 1.0);
    });
    if (!_isMuted && _isPlaying && widget.allowInteraction) {
      _VideoPlaybackManager.instance.register(this);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content;

    Widget _buildPlaceholder() {
      if (widget.placeholderUrl != null && widget.placeholderUrl!.isNotEmpty) {
        return CachedNetworkImage(
          imageUrl: widget.placeholderUrl!,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: context.colors.surface),
          errorWidget: (_, __, ___) => Container(color: context.colors.surface),
        );
      }
      return Container(color: context.colors.surface);
    }

    if (_hasError) {
      content = Stack(
        fit: StackFit.expand,
        children: [
          _buildPlaceholder(),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, color: context.colors.error, size: 32),
                const SizedBox(height: 8),
                Text('Unplayable', style: TextStyle(color: context.colors.textTertiary, fontSize: 10)),
              ],
            ),
          ),
        ],
      );
    } else if (!_isInitialized || _controller == null) {
      content = Stack(
        fit: StackFit.expand,
        children: [
          _buildPlaceholder(),
          Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
            ),
          ),
        ],
      );
    } else {
      content = widget.allowInteraction 
        ? GestureDetector(
            onTap: () {
              if (_controller!.value.isPlaying) {
                _controller!.pause();
              } else {
                _controller!.play();
              }
            },
            behavior: HitTestBehavior.opaque,
            child: _buildVideoStack(),
          )
        : IgnorePointer(
            child: _buildVideoStack(),
          );
    }

    return VisibilityDetector(
      key: Key('video_${widget.videoUrl}_$hashCode'),
      onVisibilityChanged: _handleVisibilityChanged,
      child: AspectRatio(
        aspectRatio: widget.aspectRatio,
        child: content,
      ),
    );
  }

  Widget _buildVideoStack() {
    return Stack(
      alignment: Alignment.center,
      children: [
        AspectRatio(
          aspectRatio: widget.aspectRatio,
          child: VideoPlayer(_controller!),
        ),
        if (widget.showControls && !_isPlaying && !_isBuffering)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.play_arrow, color: Colors.white, size: 36),
          ),
        if (widget.showControls && _isBuffering)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: const SizedBox(
              width: 24, height: 24,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            ),
          ),
        if (widget.allowInteraction)
          Positioned(
            top: 12,
            right: 12,
            child: GestureDetector(
              onTap: _toggleMute,
              behavior: HitTestBehavior.opaque,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
        if (_controller != null && _controller!.value.duration > Duration.zero)
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _formatDuration(_controller!.value.duration),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}
