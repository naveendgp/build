import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../home/models/feed_models.dart';
import '../providers/interests_provider.dart';

class InterestsScreen extends ConsumerWidget {
  const InterestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(interestsProvider);

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Interests',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _buildBody(context, ref, state),
    );
  }

  Widget _buildBody(
      BuildContext context, WidgetRef ref, InterestsState state) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 48, color: context.colors.error),
            const SizedBox(height: 16),
            Text('Failed to load interests',
                style: AppTypography.bodyMedium
                    .copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => ref.read(interestsProvider.notifier).fetch(),
              child: Text('Retry',
                  style: TextStyle(color: context.colors.primaryAccent)),
            ),
          ],
        ),
      );
    }

    if (state.posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite_border_rounded,
                size: 56, color: context.colors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'No interests yet',
              style: AppTypography.titleMedium
                  .copyWith(color: context.colors.textSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Interested" on a post to save it here',
              style: AppTypography.bodySmall
                  .copyWith(color: context.colors.textTertiary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(interestsProvider.notifier).fetch(),
      color: context.colors.primaryAccent,
      backgroundColor: context.colors.surface,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: state.posts.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          return _InterestItem(post: state.posts[index]);
        },
      ),
    );
  }
}

class _InterestItem extends ConsumerWidget {
  final FeedPost post;
  const _InterestItem({required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: context.colors.borderLight.withValues(alpha: 0.15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: post.mediaUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: post.mediaUrl,
                    width: 64,
                    height: 64,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _thumb(context),
                    errorWidget: (_, __, ___) => _thumb(context),
                  )
                : _thumb(context),
          ),
          const SizedBox(width: AppSpacing.md),
          // Info
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
                  post.brandName,
                  style: AppTypography.labelSmall
                      .copyWith(color: context.colors.textTertiary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          // Delete
          GestureDetector(
            onTap: () async {
              final confirm = await showAdaptiveConfirmDialog(
                                      context,
                                      title: 'Remove Interest?',
                                      message: 'This post will be removed from your interests.',
                                      confirmLabel: 'Remove',
                                      isDestructive: true,
                                    );
              if (confirm == true) {
                ref.read(interestsProvider.notifier).removeInterest(post.id);
              }
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.colors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.delete_outline_rounded,
                  size: 18, color: context.colors.error),
            ),
          ),
        ],
      ),
    );
  }

  Widget _thumb(BuildContext context) => Container(
        width: 64,
        height: 64,
        color: context.colors.surface,
        child: Icon(Icons.image_rounded,
            size: 24, color: context.colors.textTertiary),
      );
}
