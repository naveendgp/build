import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../user_profile/models/user_profile_models.dart';
import '../../explore/screens/explore_post_detail_screen.dart';
import '../../home/widgets/video_player_widget.dart';

// Dedicated provider for brand saved posts — calls /saved-posts with brand auth
final brandSavedPostsProvider = FutureProvider.autoDispose<List<SavedPostItem>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/saved-posts');
  final List<dynamic> data = response.data as List<dynamic>;
  return data.map((e) => SavedPostItem.fromJson(e)).toList();
});

class BrandSavedPostsScreen extends ConsumerStatefulWidget {
  const BrandSavedPostsScreen({super.key});

  @override
  ConsumerState<BrandSavedPostsScreen> createState() => _BrandSavedPostsScreenState();
}

class _BrandSavedPostsScreenState extends ConsumerState<BrandSavedPostsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Saved Posts',
          style: AppTypography.headlineSmall.copyWith(
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ),
      // Collections are a personal-account idea: a brand saves posts, it does
      // not file them.
      body: _BrandSavedPostsGrid(),
    );
  }
}

class _BrandSavedPostsGrid extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedAsync = ref.watch(brandSavedPostsProvider);

    return savedAsync.when(
      loading: () => const Center(child: CircularProgressIndicator.adaptive()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 48, color: context.colors.textTertiary),
            const SizedBox(height: 12),
            Text(
              'Failed to load saved posts',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => ref.refresh(brandSavedPostsProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (savedPosts) {
        if (savedPosts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.bookmark_border_rounded, size: 48, color: context.colors.textTertiary),
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
                  style: AppTypography.bodySmall.copyWith(color: context.colors.textTertiary),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(brandSavedPostsProvider),
          child: GridView.builder(
            padding: const EdgeInsets.all(2),
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
                onTap: () async {
                  // Navigate to post detail and refresh when returning
                  // so unsave is reflected immediately
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ExplorePostDetailScreen(postId: item.id),
                    ),
                  );
                  // Refresh the saved posts list after returning from detail
                  // in case the user unsaved from within the detail screen
                  ref.refresh(brandSavedPostsProvider);
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
                        if (item.isVideo)
                          const Positioned(
                            top: 6,
                            right: 6,
                            child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
