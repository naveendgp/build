import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/app_messenger.dart';
import '../../home/models/feed_models.dart';
import '../providers/interests_provider.dart';
import '../providers/others_provider.dart';

/// Settings → Others: what the person told the feed about posts — Interested,
/// Not interested, and the ones they reported.
///
/// Interested and Not interested can be undone here; a report cannot, so it is
/// shown with the reason that was sent and nothing else.
class OthersScreen extends ConsumerStatefulWidget {
  const OthersScreen({super.key});

  @override
  ConsumerState<OthersScreen> createState() => _OthersScreenState();
}

class _OthersScreenState extends ConsumerState<OthersScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
          'Others',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: TabBar(
          controller: _tabs,
          labelColor: context.colors.primaryAccent,
          unselectedLabelColor: context.colors.textSecondary,
          indicatorColor: context.colors.primaryAccent,
          labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Interested'),
            Tab(text: 'Not interested'),
            Tab(text: 'Reported'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [_buildInterested(), _buildNotInterested(), _buildReported()],
      ),
    );
  }

  // ── Interested ─────────────────────────────────────────────
  Widget _buildInterested() {
    final state = ref.watch(interestsProvider);
    if (state.isLoading) return const _Loading();
    if (state.posts.isEmpty) {
      return const _Empty(
        icon: Icons.auto_awesome_rounded,
        title: 'Nothing here yet',
        hint: 'Open the menu on any post and choose Interested.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: state.posts.length,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, i) {
        final post = state.posts[i];
        return _PostRow(
          post: post,
          actionIcon: Icons.close_rounded,
          actionLabel: 'Remove from Interested',
          onAction: () async {
            await ref.read(interestsProvider.notifier).removeInterest(post.id);
            if (mounted) {
              AppMessenger.of(
                context,
              ).showSnackBar(const SnackBar(content: Text('Removed from Interested')));
            }
          },
        );
      },
    );
  }

  // ── Not interested ─────────────────────────────────────────
  Widget _buildNotInterested() {
    final async = ref.watch(notInterestedPostsProvider);
    return async.when(
      loading: () => const _Loading(),
      error: (_, _) => const _Empty(
        icon: Icons.visibility_off_outlined,
        title: 'No hidden posts',
        hint: 'Posts you mark Not interested are hidden from your feed and listed here.',
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return const _Empty(
            icon: Icons.visibility_off_outlined,
            title: 'No hidden posts',
            hint: 'Posts you mark Not interested are hidden from your feed and listed here.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: posts.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final post = posts[i];
            return _PostRow(
              post: post,
              actionIcon: Icons.restore_rounded,
              actionLabel: 'Show in feed again',
              onAction: () async {
                final done = await removeNotInterested(ref, post.id);
                if (mounted && done) {
                  AppMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('Back in your feed')));
                }
              },
            );
          },
        );
      },
    );
  }

  // ── Reported ───────────────────────────────────────────────
  Widget _buildReported() {
    final async = ref.watch(reportedPostsProvider);
    return async.when(
      loading: () => const _Loading(),
      error: (_, _) => const _Empty(
        icon: Icons.flag_outlined,
        title: 'Nothing reported',
        hint: 'Posts you report are listed here with the reason you gave.',
      ),
      data: (reports) {
        if (reports.isEmpty) {
          return const _Empty(
            icon: Icons.flag_outlined,
            title: 'Nothing reported',
            hint: 'Posts you report are listed here with the reason you gave.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: reports.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final report = reports[i];
            // A report stands once sent, so there is nothing to undo here.
            return _PostRow(post: report.post, subtitle: report.reasonLabel);
          },
        );
      },
    );
  }
}

class _PostRow extends StatelessWidget {
  final FeedPost? post;
  final String? subtitle;
  final IconData? actionIcon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _PostRow({
    required this.post,
    this.subtitle,
    this.actionIcon,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final media = post?.mediaUrl ?? '';
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm + 4),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: AppSpacing.borderRadiusSm,
            child: SizedBox(
              width: 52,
              height: 52,
              child: media.isEmpty
                  ? Container(
                      color: context.colors.surfaceSecondary,
                      child: Icon(
                        Icons.image_rounded,
                        size: 20,
                        color: context.colors.textTertiary,
                      ),
                    )
                  : Image.network(
                      media,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: context.colors.surfaceSecondary,
                        child: Icon(
                          Icons.broken_image_rounded,
                          size: 20,
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm + 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post?.brandName ?? 'Post unavailable',
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  post?.title.isNotEmpty == true ? post!.title : 'Untitled post',
                  style: AppTypography.titleSmall.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null && subtitle!.isNotEmpty)
                  Text(
                    subtitle!,
                    style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
                  ),
              ],
            ),
          ),
          if (onAction != null)
            IconButton(
              tooltip: actionLabel,
              onPressed: onAction,
              icon: Icon(actionIcon, size: 20, color: context.colors.textSecondary),
            ),
        ],
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => Center(
    child: CircularProgressIndicator.adaptive(
      valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
    ),
  );
}

class _Empty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String hint;

  const _Empty({required this.icon, required this.title, required this.hint});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: context.colors.textTertiary),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              style: AppTypography.titleSmall.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              hint,
              textAlign: TextAlign.center,
              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
