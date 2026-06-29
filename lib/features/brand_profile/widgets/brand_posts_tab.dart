import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';
import '../../explore/screens/explore_post_detail_screen.dart';
import '../../home/widgets/video_player_widget.dart';

class BrandPostsTab extends StatelessWidget {
  final List<BrandPost> posts;
  final BrandProfile profile;

  const BrandPostsTab({
    super.key,
    required this.posts,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.grid_on,
              size: 48,
              color: context.colors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              'No posts yet',
              style: AppTypography.titleMedium.copyWith(
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: const EdgeInsets.only(bottom: 120), // Safe area for dock
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
        childAspectRatio: 1.0,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ExplorePostDetailScreen(
                  postId: post.id,
                ),
              ),
            );
          },
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (post.mediaType == 'VIDEO' && post.imageUrl.isNotEmpty)
                IgnorePointer(
                  child: VideoPlayerWidget(
                    videoUrl: post.imageUrl,
                    aspectRatio: 1.0,
                    allowInteraction: false,
                    showControls: false,
                  ),
                )
              else
                Image.network(
                  post.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: context.colors.surfaceSecondary,
                    padding: const EdgeInsets.all(8.0),
                    alignment: Alignment.center,
                    child: Text(
                      post.title.isNotEmpty ? post.title : 'No media',
                      style: AppTypography.labelSmall.copyWith(
                        color: context.colors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              if (post.mediaType == 'VIDEO')
                const Positioned(
                  top: 8,
                  right: 8,
                  child: Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
