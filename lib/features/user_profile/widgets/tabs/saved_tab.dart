import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../providers/user_profile_provider.dart';
import '../../../explore/screens/explore_post_detail_screen.dart';
import '../../../home/widgets/video_player_widget.dart';

class SavedTab extends ConsumerWidget {
  const SavedTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedPosts = ref.watch(userProfileProvider).savedPosts;

    if (savedPosts.isEmpty) {
      return SizedBox(
        height: 300,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.bookmark_border_rounded,
                size: 48,
                color: context.colors.textTertiary,
              ),
              const SizedBox(height: 12),
              Text(
                'No saved posts yet',
                style: AppTypography.bodyMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Posts you save will appear here',
                style: AppTypography.bodySmall.copyWith(
                  color: context.colors.textTertiary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: const EdgeInsets.only(bottom: 120),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
        childAspectRatio: 1.0,
      ),
      itemCount: savedPosts.length,
      itemBuilder: (context, index) {
        final item = savedPosts[index];
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ExplorePostDetailScreen(postId: item.id),
              ),
            );
          },
          child: Container(
            color: context.colors.borderLight,
            child: ClipRRect(
              borderRadius: BorderRadius.zero,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.isVideo && item.videoUrl != null && item.videoUrl!.isNotEmpty)
                    VideoPlayerWidget(
                      videoUrl: item.videoUrl!,
                      aspectRatio: 1,
                      placeholderUrl: item.imageUrl,
                      allowInteraction: false,
                    )
                  else
                    Image.network(
                      item.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: context.colors.borderLight,
                        child: Icon(
                          Icons.broken_image_rounded,
                          color: context.colors.textTertiary,
                          size: 24,
                        ),
                      ),
                    ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 24,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.15),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (item.isVideo)
                    const Positioned(
                      top: 6,
                      right: 6,
                      child: Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
