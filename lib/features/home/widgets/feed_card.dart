import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/theme_provider.dart';
import '../models/feed_models.dart';
import '../../comments/widgets/comment_sheet.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/feed_provider.dart';
import 'interaction_bar.dart';
import 'post_cta_button.dart';
import 'lead_form_viewer_sheet.dart';
import 'highlight_banner.dart';
import 'video_player_widget.dart';

/// Premium immersive single-feed card — cinematic edge-to-edge design
class FeedCard extends ConsumerWidget {
  final FeedPost post;
  final VoidCallback onLike;
  final VoidCallback onBookmark;
  final VoidCallback onFollow;
  final VoidCallback onTap;
  final VoidCallback onShare;
  final VoidCallback onReminder;

  const FeedCard({
    super.key,
    required this.post,
    required this.onLike,
    required this.onBookmark,
    required this.onFollow,
    required this.onTap,
    required this.onShare,
    required this.onReminder,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: context.colors.border, width: 0.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 24,
              offset: const Offset(0, 8),
              spreadRadius: -6,
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top: Brand info
            _buildHeader(context, ref),
            // AI reason
            if (post.aiReason != null) _buildAiReason(context),
            // Highlight Banner
            if (post.isHighlighted && post.highlightMessage != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: HighlightBanner(
                  text: post.highlightMessage!,
                  theme: post.highlightTheme,
                  animation: post.highlightAnimation,
                  icon: post.highlightIcon,
                ),
              ),
            // Media
            _buildMedia(),
            // Bottom info
            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isOwner =
        authState.loggedInRole == UserRole.brand &&
        authState.brandId == post.brandId;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 0),
      child: Row(
        children: [
          // Avatar + Name area
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => context.push('/brand/${post.brandId}'),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: context.colors.border,
                        width: 0.5,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: CachedNetworkImage(
                      imageUrl: post.brandAvatar,
                      fit: BoxFit.cover,
                      memCacheWidth: 150,
                      placeholder: (context, url) =>
                          Container(color: context.colors.surface),
                      errorWidget: (context, url, error) => Container(
                        color: context.colors.surface,
                        child: Icon(
                          Icons.business,
                          size: 18,
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Name + timestamp
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                post.brandName,
                                style: AppTypography.labelLarge.copyWith(
                                  color: context.colors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (post.isVerified) ...[
                              const SizedBox(width: 4),
                              Icon(
                                Icons.verified_rounded,
                                size: 14,
                                color: context.colors.primaryAccent,
                              ),
                            ],
                          ],
                        ),
                        Text(
                          post.timestamp,
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Follow
          if (!isOwner)
            GestureDetector(
              onTap: onFollow,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: post.isFollowing
                      ? Colors.transparent
                      : context.colors.primaryAccent,
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: post.isFollowing
                      ? Border.all(color: context.colors.border)
                      : null,
                ),
                child: Text(
                  post.isFollowing ? 'Following' : 'Follow',
                  style: AppTypography.labelSmall.copyWith(
                    color: post.isFollowing
                        ? context.colors.textSecondary
                        : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          const SizedBox(width: 4),
          // Menu
          if (isOwner)
            GestureDetector(
              onTap: () => _showPostMenu(context, ref),
              child: Padding(
                padding: EdgeInsets.all(6),
                child: Icon(
                  Icons.more_vert_rounded,
                  size: 20,
                  color: context.colors.textTertiary,
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showPostMenu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.colors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              SizedBox(height: 12),
              ListTile(
                leading: Icon(
                  Icons.delete_outline,
                  color: context.colors.error,
                ),
                title: Text(
                  'Delete Post',
                  style: AppTypography.bodyLarge.copyWith(
                    color: context.colors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onTap: () async {
                  Navigator.pop(context); // Close menu
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: context.colors.card,
                      title: Text(
                        'Delete Post',
                        style: AppTypography.titleMedium.copyWith(
                          color: context.colors.textPrimary,
                        ),
                      ),
                      content: Text(
                        'Are you sure you want to delete this post? This action cannot be undone.',
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textSecondary,
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text(
                            'Cancel',
                            style: AppTypography.labelLarge.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: Text(
                            'Delete',
                            style: AppTypography.labelLarge.copyWith(
                              color: context.colors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    try {
                      await ref.read(feedProvider.notifier).deletePost(post.id);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Post deleted successfully'),
                          ),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Failed to delete post'),
                          ),
                        );
                      }
                    }
                  }
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAiReason(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            size: 12,
            color: context.colors.primaryAccent.withValues(alpha: 0.7),
          ),
          const SizedBox(width: 4),
          Text(
            post.aiReason!,
            style: AppTypography.labelSmall.copyWith(
              color: context.colors.primaryAccent.withValues(alpha: 0.9),
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedia() {
    return Padding(
      padding: EdgeInsets.fromLTRB(12, post.isHighlighted ? 0 : 10, 12, 0),
      child: ClipRRect(
        borderRadius: post.isHighlighted
            ? const BorderRadius.vertical(bottom: Radius.circular(20))
            : BorderRadius.circular(20),
        child: (post.videoUrl != null && post.videoUrl!.isNotEmpty)
            ? VideoPlayerWidget(
                videoUrl: post.videoUrl!,
                aspectRatio: post.aspectRatio,
                placeholderUrl: post.mediaUrl,
                initialPosition: post.bestFrameTimestamp,
              )
            : AspectRatio(
                aspectRatio: 1 / post.aspectRatio,
                child: CachedNetworkImage(
                  imageUrl: post.mediaUrl,
                  fit: BoxFit.cover,
                  memCacheWidth: 800,
                  placeholder: (context, url) => Container(
                    color: context.colors.surface,
                    child: Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
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
                    child: Center(
                      child: Text(
                        'Err: $url\n\n${error.toString()}',
                        style: TextStyle(
                          color: context.colors.error,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  void _handleCtaTap(BuildContext context) async {
    if (post.ctaType == 'OPEN_LEAD_FORM') {
      final formId = post.ctaPayload?['leadFormId'];
      if (formId != null) {
        LeadFormViewerSheet.show(
          context,
          post.id,
          formId,
          post.brandAvatar,
          post.brandName,
        );
      }
    } else if (post.ctaType == 'OPEN_URL') {
      final url = post.ctaPayload?['url'];
      if (url != null) {
        try {
          final uri = Uri.parse(url);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } else {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Could not open link: $url',
                    style: TextStyle(color: context.colors.textPrimary),
                  ),
                ),
              );
            }
          }
        } catch (_) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Invalid link format',
                  style: TextStyle(color: context.colors.textPrimary),
                ),
              ),
            );
          }
        }
      }
    } else {
      // Fallback for other CTA types if needed
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Opening ${post.ctaLabel}...',
            style: TextStyle(color: context.colors.textPrimary),
          ),
        ),
      );
    }
  }

  Widget _buildFooter(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            post.title,
            style: AppTypography.titleSmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          // Description
          RichText(
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            text: TextSpan(
              children: [
                TextSpan(
                  text: post.description,
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textSecondary,
                    height: 1.4,
                  ),
                ),
                TextSpan(
                  text: ' • ${post.timestamp}',
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // Tags + CTA row
          Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: post.tags
                      .take(3)
                      .map(
                        (tag) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: context.colors.surface,
                            borderRadius: AppSpacing.borderRadiusFull,
                            border: Border.all(
                              color: context.colors.border,
                              width: 0.5,
                            ),
                          ),
                          child: Text(
                            '#$tag',
                            style: AppTypography.labelSmall.copyWith(
                              color: context.colors.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              if (post.ctaLabel != null &&
                  post.ctaLabel!.trim().toLowerCase() != 'no button' &&
                  post.ctaLabel!.trim().toLowerCase() != 'none' &&
                  post.ctaType != 'NONE')
                PostCtaButton(
                  label: post.ctaLabel!,
                  type: post.ctaType,
                  onTap: () => _handleCtaTap(context),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Interaction bar
          Center(
            child: InteractionBar(
              isLiked: post.isLiked,
              isBookmarked: post.isBookmarked,
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              onLike: onLike,
              onComment: () =>
                  CommentSheet.show(context, post.id, post.commentCount),
              onBookmark: onBookmark,
              onShare: onShare,
              onReminder: onReminder,
            ),
          ),
        ],
      ),
    );
  }
}
