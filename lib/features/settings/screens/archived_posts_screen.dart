import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../brand_dashboard/providers/dashboard_providers.dart';
import '../../brand_dashboard/models/dashboard_models.dart';
import '../../../core/utils/app_messenger.dart';

final archivedPostsProvider = FutureProvider.autoDispose<List<PostAnalytics>>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  // Fetching explicitly ARCHIVED status posts via backend filtering
  return service.getPostAnalytics(page: 1, status: 'ARCHIVED');
});

class ArchivedPostsScreen extends ConsumerWidget {
  const ArchivedPostsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final archivedAsync = ref.watch(archivedPostsProvider);

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Archived Posts',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: archivedAsync.when(
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (err, stack) => Center(
          child: Text('Failed to load archived posts', style: AppTypography.bodyMedium.copyWith(color: context.colors.error)),
        ),
        data: (posts) {
          if (posts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.archive_outlined, size: 48, color: context.colors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'No archived posts',
                    style: AppTypography.titleMedium.copyWith(color: context.colors.textSecondary),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(archivedPostsProvider.future),
            color: context.colors.primaryAccent,
            backgroundColor: context.colors.surface,
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: posts.length,
              separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                final post = posts[index];
                return _ArchivedPostItem(post: post);
              },
            ),
          );
        },
      ),
    );
  }
}

class _ArchivedPostItem extends ConsumerWidget {
  final PostAnalytics post;

  const _ArchivedPostItem({required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: post.thumbnail != null && post.thumbnail!.isNotEmpty
                ? Image.network(
                    post.thumbnail!,
                    width: 64,
                    height: 64,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _buildPlaceholder(context),
                  )
                : _buildPlaceholder(context),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  post.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Archived',
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          GestureDetector(
            onTap: () async {
              final confirm = await showAdaptiveConfirmDialog(
                                      context,
                                      title: 'Repost?',
                                      message: 'This post will be restored to your public feed.',
                                      confirmLabel: 'Repost',
                                    );

              if (confirm == true) {
                await ref.read(dashboardServiceProvider).unarchivePost(post.id);
                ref.invalidate(archivedPostsProvider);
                // Invalidate home feed and dashboard
                if (context.mounted) {
                  AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Post restored successfully')));
                }
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: context.colors.primaryAccent,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.restore_rounded, size: 16, color: Colors.white),
                  const SizedBox(width: 4),
                  const Text('Repost', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () async {
              final confirm = await showAdaptiveConfirmDialog(
                                      context,
                                      title: 'Delete Post?',
                                      message: 'This will permanently delete the post. This action cannot be undone.',
                                      confirmLabel: 'Delete',
                                      isDestructive: true,
                                    );

              if (confirm == true) {
                try {
                  await ref.read(dashboardServiceProvider).deletePost(post.id);
                  ref.invalidate(archivedPostsProvider);
                  if (context.mounted) {
                    AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Post deleted permanently')));
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete post: $e')));
                  }
                }
              }
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.colors.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.delete_outline_rounded, size: 18, color: context.colors.error),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      color: context.colors.surface,
      child: Icon(Icons.image_rounded, size: 24, color: context.colors.textTertiary),
    );
  }
}
