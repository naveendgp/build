import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../models/feed_models.dart';
import '../../comments/widgets/comment_sheet.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/feed_provider.dart';
import 'interaction_bar.dart';
import 'premium_post_cta_button.dart';
import 'lead_form_viewer_sheet.dart';
import 'highlight_banner.dart';
import 'video_player_widget.dart';
import 'media_carousel.dart';
import '../../../core/network/api_client.dart';
import '../../settings/providers/interests_provider.dart';
import '../../../core/utils/app_messenger.dart';

/// Premium immersive single-feed card — cinematic edge-to-edge design
class FeedCard extends ConsumerWidget {
  final FeedPost post;
  final VoidCallback onLike;
  final VoidCallback onBookmark;
  final VoidCallback onFollow;
  final VoidCallback onTap;
  final VoidCallback onShare;
  final VoidCallback onReminder;
  final bool isDetailMode;

  const FeedCard({
    super.key,
    required this.post,
    required this.onLike,
    required this.onBookmark,
    required this.onFollow,
    required this.onTap,
    required this.onShare,
    required this.onReminder,
    this.isDetailMode = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        // Posts sit closer together and the card runs wider: the list had a
        // gap of its own as well as the card's margin.
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
            // Highlight Banner — edge-to-edge, flush against header above and media below
            if (post.isHighlighted && post.highlightMessage != null)
              HighlightBanner(
                text: post.highlightMessage!,
                theme: post.highlightTheme,
                animation: post.highlightAnimation,
                icon: post.highlightIcon,
              ),
            // Media
            _buildMedia(),
            if (post.ctaLabel != null &&
                post.ctaLabel!.trim().toLowerCase() != 'no button' &&
                post.ctaLabel!.trim().toLowerCase() != 'none' &&
                post.ctaType != 'NONE') ...[
              const SizedBox(height: 8),
              PremiumPostCTAButton(label: post.ctaLabel!, onTap: () => _handleCtaTap(context, ref)),
            ],
            // Bottom info
            _buildFooter(context, ref),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isOwner = authState.loggedInRole == UserRole.brand && authState.brandId == post.brandId;
    final isBrand = authState.loggedInRole == UserRole.brand;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 10, 10, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar + Name area
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => context.push('/brand/${post.brandId}'),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Brand Logo Avatar
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: context.colors.surface,
                      border: Border.all(color: context.colors.border, width: 0.5),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: CachedNetworkImage(
                      imageUrl: post.brandAvatar,
                      fit: BoxFit.cover,
                      memCacheWidth: 150,
                      placeholder: (context, url) => Container(
                        color: context.colors.surface,
                        child: Icon(
                          Icons.business_rounded,
                          size: 20,
                          color: context.colors.textTertiary,
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: context.colors.surface,
                        child: Icon(
                          Icons.business_rounded,
                          size: 20,
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
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
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
                              Icon(Icons.verified_rounded, size: 14, color: Colors.red),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
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
          if (!isBrand)
            GestureDetector(
              onTap: onFollow,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: post.isFollowing ? Colors.transparent : context.colors.primaryAccent,
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: post.isFollowing ? Border.all(color: context.colors.border) : null,
                ),
                child: Text(
                  post.isFollowing ? 'Following' : 'Follow',
                  style: AppTypography.labelSmall.copyWith(
                    color: post.isFollowing ? context.colors.textSecondary : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          const SizedBox(width: 4),
          // Menu
          if (isOwner || authState.loggedInRole == UserRole.user)
            GestureDetector(
              onTap: () => _showPostMenu(context, ref, isOwner: isOwner),
              child: Padding(
                padding: EdgeInsets.all(6),
                child: Icon(Icons.more_vert_rounded, size: 20, color: context.colors.textTertiary),
              ),
            ),
        ],
      ),
    );
  }

  void _showPostMenu(BuildContext context, WidgetRef ref, {required bool isOwner}) {
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
              const SizedBox(height: 12),

              if (isOwner) ...[
                ListTile(
                  leading: Icon(Icons.bar_chart_rounded, color: context.colors.textPrimary),
                  title: Text(
                    'View Analytics',
                    style: AppTypography.bodyLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/brand-dashboard');
                  },
                ),
                ListTile(
                  leading: Icon(Icons.archive_outlined, color: context.colors.textPrimary),
                  title: Text(
                    'Archive Post',
                    style: AppTypography.bodyLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () async {
                    Navigator.pop(context); // Close menu
                    final confirm = await showAdaptiveConfirmDialog(
                      context,
                      title: 'Archive Post?',
                      message:
                          'This post will be removed from public feeds and brand profiles.\n\nAnalytics, leads, comments, and engagement data will be preserved.',
                      confirmLabel: 'Archive Post',
                    );

                    if (confirm == true) {
                      await ref.read(feedProvider.notifier).archivePost(post.id);
                      if (context.mounted) {
                        AppMessenger.of(
                          context,
                        ).showSnackBar(const SnackBar(content: Text('Post archived successfully')));
                      }
                    }
                  },
                ),
                ListTile(
                  leading: Icon(Icons.delete_outline, color: context.colors.error),
                  title: Text(
                    'Delete Post',
                    style: AppTypography.bodyLarge.copyWith(
                      color: context.colors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () async {
                    Navigator.pop(context); // Close menu
                    final confirm = await showAdaptiveConfirmDialog(
                      context,
                      title: 'Delete Post',
                      message:
                          'Are you sure you want to delete this post? This action cannot be undone.',
                      confirmLabel: 'Delete',
                      isDestructive: true,
                    );
                    if (confirm == true) {
                      await ref.read(feedProvider.notifier).deletePost(post.id);
                      if (context.mounted) {
                        AppMessenger.of(
                          context,
                        ).showSnackBar(const SnackBar(content: Text('Post deleted successfully')));
                      }
                    }
                  },
                ),
              ],

              if (!isOwner) ...[
                ListTile(
                  leading: Icon(Icons.share_outlined, color: context.colors.textPrimary),
                  title: Text(
                    'Share Post',
                    style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    onShare();
                  },
                ),
                if (ref.read(authProvider).loggedInRole == UserRole.user)
                  Consumer(
                    builder: (context, ref, _) {
                      final isInterested = ref.watch(
                        interestsProvider.select((s) => s.interestedIds.contains(post.id)),
                      );
                      return ListTile(
                        leading: Icon(
                          isInterested ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          color: isInterested
                              ? context.colors.primaryAccent
                              : context.colors.textPrimary,
                        ),
                        title: Text(
                          isInterested ? 'Remove from Interests' : 'Interested',
                          style: AppTypography.bodyLarge.copyWith(
                            color: isInterested
                                ? context.colors.primaryAccent
                                : context.colors.textPrimary,
                          ),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          final notifier = ref.read(interestsProvider.notifier);
                          if (isInterested) {
                            notifier.removeInterest(post.id);
                            AppMessenger.of(
                              context,
                            ).showSnackBar(const SnackBar(content: Text('Removed from interests')));
                          } else {
                            notifier.addInterest(post.id);
                            AppMessenger.of(
                              context,
                            ).showSnackBar(const SnackBar(content: Text('Added to interests')));
                          }
                        },
                      );
                    },
                  ),
                if (!isDetailMode)
                  ListTile(
                    leading: Icon(Icons.visibility_off_outlined, color: context.colors.textPrimary),
                    title: Text(
                      'Not Interested',
                      style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      ref.read(feedProvider.notifier).markNotInterested(post.id);
                      AppMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('We will show fewer posts like this.')),
                      );
                    },
                  ),
                ListTile(
                  leading: Icon(Icons.report_outlined, color: context.colors.error),
                  title: Text(
                    'Report Post',
                    style: AppTypography.bodyLarge.copyWith(color: context.colors.error),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/help/live-chat?category=SPAM');
                  },
                ),
              ],
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

  // Media is edge-to-edge (no side margins, no rounded corners) — it only
  // sits at the card's own rounded edge when there's no header/banner above
  // it, which the outer Card's Clip.antiAlias already handles.
  Widget _buildMedia() {
    return (post.videoUrl != null && post.videoUrl!.isNotEmpty)
        ? VideoPlayerWidget(
            videoUrl: post.videoUrl!,
            aspectRatio: 1.0,
            placeholderUrl: post.mediaUrl,
            initialPosition: post.bestFrameTimestamp,
          )
        : (post.carouselUrls != null && post.carouselUrls!.length > 1)
        ? MediaCarousel(imageUrls: post.carouselUrls!, aspectRatio: 1.0)
        : AspectRatio(
            aspectRatio: 1.0,
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
                    child: CircularProgressIndicator.adaptive(
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
                    style: TextStyle(color: context.colors.error, fontSize: 10),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          );
  }

  void _handleCtaTap(BuildContext context, WidgetRef ref) async {
    if (post.ctaType == 'OPEN_LEAD_FORM') {
      final formId = post.ctaPayload?['leadFormId'];
      if (formId != null) {
        LeadFormViewerSheet.show(context, post.id, formId, post.brandAvatar, post.brandName);
      }
    } else if (post.ctaType == 'OPEN_CHAT') {
      final authState = ref.read(authProvider);
      if (authState.brandId == post.brandId) {
        AppMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Users will be taken to a chat with you when they tap this!'),
          ),
        );
        return;
      }

      try {
        final api = ref.read(apiClientProvider);
        final res = await api.dio.post('/conversations/start', data: {'brandId': post.brandId});
        final conversationId = res.data['id'];

        final prefilledMessage = post.ctaPayload?['prefilledMessage'];
        String route = '/messages/$conversationId';
        if (prefilledMessage != null && prefilledMessage.toString().isNotEmpty) {
          route += '?prefilled=${Uri.encodeComponent(prefilledMessage.toString())}';
        }

        if (!context.mounted) return;
        context.push(route);
      } catch (e) {
        if (!context.mounted) return;
        AppMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start conversation. Please try again.')),
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
              AppMessenger.of(context).showSnackBar(
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
            AppMessenger.of(context).showSnackBar(
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
      AppMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Opening ${post.ctaLabel}...',
            style: TextStyle(color: context.colors.textPrimary),
          ),
        ),
      );
    }
  }

  Widget _buildFooter(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isBrand = authState.loggedInRole == UserRole.brand;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ExpandablePostDescription(post: post),
          const SizedBox(height: 12),
          // Interaction bar
          InteractionBar(
            isLiked: post.isLiked,
            isBookmarked: post.isBookmarked,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            onLike: onLike,
            onComment: () => CommentSheet.show(context, post.id, post.commentCount),
            onBookmark: onBookmark,
            onShare: onShare,
            onReminder: onReminder,
            // Saving posts is now available for brands as well.
            showBookmark: true,
          ),
        ],
      ),
    );
  }
}

class ExpandablePostDescription extends StatefulWidget {
  final FeedPost post;

  const ExpandablePostDescription({super.key, required this.post});

  @override
  State<ExpandablePostDescription> createState() => _ExpandablePostDescriptionState();
}

class _ExpandablePostDescriptionState extends State<ExpandablePostDescription> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title
        if (widget.post.title.isNotEmpty) ...[
          Text(
            widget.post.title,
            style: AppTypography.titleSmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
            maxLines: _isExpanded ? null : 1,
            overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
        ],
        // Description
        GestureDetector(
          onTap: () {
            if (!_isExpanded) {
              setState(() => _isExpanded = true);
            }
          },
          child: RichText(
            maxLines: _isExpanded ? null : 1,
            overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
            text: TextSpan(
              children: [
                TextSpan(
                  text: widget.post.description,
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textSecondary,
                    height: 1.4,
                  ),
                ),
                if (!_isExpanded)
                  TextSpan(
                    text: ' ... more',
                    style: AppTypography.bodyMedium.copyWith(
                      color: context.colors.textTertiary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
        ),
        // Tags
        if (_isExpanded && widget.post.tags.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: widget.post.tags
                .map(
                  (tag) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: AppSpacing.borderRadiusFull,
                      border: Border.all(color: context.colors.border, width: 0.5),
                    ),
                    child: Text(
                      '#$tag',
                      style: AppTypography.labelSmall.copyWith(
                        color: context.colors.primaryAccent,
                        fontSize: 10,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
        const SizedBox(height: 6),
        // Timestamp
        Text(
          widget.post.timestamp,
          style: AppTypography.labelSmall.copyWith(
            color: context.colors.textTertiary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
