import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../home/widgets/video_player_widget.dart';
import 'package:go_router/go_router.dart';
import '../../home/models/feed_models.dart';

class SearchResultsGrid extends StatelessWidget {
  final List<FeedPost> results;
  final bool isLoading;
  final VoidCallback? onRetry;

  const SearchResultsGrid({
    super.key,
    required this.results,
    this.isLoading = false,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildSkeletonGrid();
    }

    if (results.isEmpty) {
      return _buildEmptyState(context);
    }

    return Padding(
      padding: AppSpacing.paddingHorizontal,
      child: MasonryGridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        itemCount: results.length,
        itemBuilder: (context, index) {
          final post = results[index];
          return _SearchResultCard(
            post: post,
            onTap: () => context.push('/explore/post', extra: post),
          );
        },
      ),
    );
  }

  Widget _buildSkeletonGrid() {
    return Padding(
      padding: AppSpacing.paddingHorizontal,
      child: MasonryGridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        itemCount: 6,
        itemBuilder: (context, index) {
          final height = index.isEven ? 200.0 : 250.0;
          return _SkeletonPulse(height: height);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.colors.surface,
              shape: BoxShape.circle,
              border: Border.all(color: context.colors.borderLight),
            ),
            child: Icon(
              Icons.search_off_rounded,
              size: 40,
              color: context.colors.textTertiary,
            ),
          ),
          SizedBox(height: AppSpacing.xl),
          Text(
            'No results found',
            style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            'Try different keywords or check out popular categories.',
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SkeletonPulse extends StatefulWidget {
  final double height;
  const _SkeletonPulse({required this.height});

  @override
  State<_SkeletonPulse> createState() => _SkeletonPulseState();
}

class _SkeletonPulseState extends State<_SkeletonPulse> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 1000), vsync: this)..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.3, end: 0.7).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _opacity,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value,
          child: Container(
            height: widget.height,
            decoration: BoxDecoration(
              color: context.colors.borderLight,
              borderRadius: AppSpacing.borderRadiusMd,
            ),
          ),
        );
      },
    );
  }
}

class _SearchResultCard extends StatefulWidget {
  final FeedPost post;
  final VoidCallback? onTap;

  const _SearchResultCard({required this.post, this.onTap});

  @override
  State<_SearchResultCard> createState() => _SearchResultCardState();
}

class _SearchResultCardState extends State<_SearchResultCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: Duration(milliseconds: 150), vsync: this);
    _scale = Tween(begin: 1.0, end: 0.97).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  String _formatTime(double seconds) {
    final int minutes = seconds ~/ 60;
    final int remainingSeconds = (seconds % 60).toInt();
    return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) {
        _ctrl.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.colors.borderLight, width: 0.5),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: widget.post.aspectRatio,
                    child: widget.post.videoUrl != null && widget.post.videoUrl!.isNotEmpty
                        ? VideoPlayerWidget(
                            videoUrl: widget.post.videoUrl!,
                            aspectRatio: widget.post.aspectRatio,
                            allowInteraction: false,
                          )
                        : CachedNetworkImage(
                            imageUrl: widget.post.mediaUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: context.colors.surface),
                            errorWidget: (context, url, error) => Container(
                              color: context.colors.surface,
                              child: Icon(Icons.image_not_supported, color: context.colors.textTertiary),
                            ),
                          ),
                  ),
                  if (widget.post.matchType == 'VIDEO' && widget.post.bestFrameTimestamp != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.play_circle_outline, size: 14, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              'Match @ ${_formatTime(widget.post.bestFrameTimestamp!)}',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              Padding(
                padding: EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.post.title,
                      style: AppTypography.labelLarge.copyWith(fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: context.colors.surface,
                            image: DecorationImage(image: CachedNetworkImageProvider(widget.post.brandAvatar), fit: BoxFit.cover),
                          ),
                          child: null,
                        ),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            widget.post.brandName,
                            style: AppTypography.labelSmall.copyWith(fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (widget.post.isVerified) ...[
                          SizedBox(width: 4),
                          Icon(Icons.verified, size: 12, color: context.colors.secondaryAccent),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
