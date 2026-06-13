import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../../../core/network/api_client.dart';
import '../models/comment_models.dart';

class CommentCard extends StatefulWidget {
  const CommentCard({
    super.key,
    required this.comment,
    required this.onReply,
    required this.onLike,
    this.onDelete,
    this.isReply = false,
  });

  final Comment comment;
  final void Function(String parentId, String username) onReply;
  final ValueChanged<String> onLike;
  final ValueChanged<String>? onDelete;
  final bool isReply;

  @override
  State<CommentCard> createState() => _CommentCardState();
}

class _CommentCardState extends State<CommentCard> {
  bool _showReplies = false;

  void _toggleReplies() {
    Haptics.selection();
    setState(() => _showReplies = !_showReplies);
  }

  String _formatTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${(diff.inDays / 7).floor()}w';
  }

  @override
  Widget build(BuildContext context) {
    final comment = widget.comment;
    final avatarSize = widget.isReply ? 32.0 : 38.0;
    final hasProfilePic =
        comment.profilePic != null && comment.profilePic!.isNotEmpty;
    final initial = comment.username.isNotEmpty
        ? comment.username[0].toUpperCase()
        : '?';

    Widget card = Padding(
      padding: EdgeInsets.only(
        left: widget.isReply ? 44.0 : 0,
        top: widget.isReply ? AppSpacing.sm : 0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Avatar ──
          _buildAvatar(hasProfilePic, initial, avatarSize),
          const SizedBox(width: AppSpacing.sm + 4),

          // ── Content Column ──
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Username row
                _buildUsernameRow(comment, initial),
                const SizedBox(height: AppSpacing.xxs + 2),

                // Comment content
                Text(
                  comment.content,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: context.colors.textPrimary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),

                // Action row
                _buildActionRow(comment),

                // Reply thread
                if (!widget.isReply && comment.replies.isNotEmpty)
                  _buildReplyThread(comment),
              ],
            ),
          ),
        ],
      ),
    );

    // ── Brand highlight wrapper ──
    if (comment.isBrandReply) {
      card = Container(
        decoration: BoxDecoration(
          color: context.colors.primaryAccent.withValues(alpha: 0.03),
          border: Border(
            left: BorderSide(
              color: context.colors.primaryAccent.withValues(alpha: 0.4),
              width: 2,
            ),
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm + 4,
          vertical: AppSpacing.sm + 4,
        ),
        child: card,
      );
    }

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: widget.isReply ? 0 : AppSpacing.sm,
      ),
      child: card,
    );
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  Widget _buildAvatar(bool hasProfilePic, String initial, double size) {
    if (hasProfilePic) {
      final url = ApiClient.resolveMediaUrl(widget.comment.profilePic!);
      return CircleAvatar(
        radius: size / 2,
        backgroundColor: context.colors.surface,
        backgroundImage: CachedNetworkImageProvider(url),
        onBackgroundImageError: (error, stackTrace) {},
        child: null,
      );
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: context.colors.primaryAccent.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: GoogleFonts.inter(
          fontSize: size * 0.4,
          fontWeight: FontWeight.w700,
          color: context.colors.primaryAccent,
        ),
      ),
    );
  }

  // ── Username Row ────────────────────────────────────────────────────────────
  Widget _buildUsernameRow(Comment comment, String initial) {
    return Row(
      children: [
        // Username
        Flexible(
          child: Text(
            comment.username,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        // Verified badge for brand
        if (comment.isBrandReply) ...[
          const SizedBox(width: AppSpacing.xxs + 2),
          Icon(
            Icons.verified_rounded,
            size: 13,
            color: context.colors.primaryAccent,
          ),
          const SizedBox(width: AppSpacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs + 2,
              vertical: 1,
            ),
            decoration: BoxDecoration(
              color: context.colors.primaryAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            ),
            child: Text(
              'Brand',
              style: GoogleFonts.inter(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: context.colors.primaryAccent,
                letterSpacing: 0.4,
              ),
            ),
          ),
        ],

        const SizedBox(width: AppSpacing.sm),

        // Timestamp
        Text(
          _formatTimeAgo(comment.createdAt),
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w400,
            color: context.colors.textTertiary,
          ),
        ),
      ],
    );
  }

  // ── Action Row ──────────────────────────────────────────────────────────────
  Widget _buildActionRow(Comment comment) {
    return Row(
      children: [
        // Reply button
        GestureDetector(
          onTap: () {
            Haptics.light();
            final parentIdForReply = widget.comment.parentId ?? widget.comment.id;
            widget.onReply(parentIdForReply, widget.comment.username);
          },
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxs),
            child: Text(
              'Reply',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: context.colors.textTertiary,
              ),
            ),
          ),
        ),

        // Delete button (only if onDelete provided)
        if (widget.onDelete != null) ...[
          const SizedBox(width: AppSpacing.md),
          GestureDetector(
            onTap: () {
              Haptics.light();
              widget.onDelete!(comment.id);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxs),
              child: Text(
                'Delete',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textTertiary,
                ),
              ),
            ),
          ),
        ],

      ],
    );
  }

  // ── Reply Thread ────────────────────────────────────────────────────────────
  Widget _buildReplyThread(Comment comment) {
    final replyCount = comment.replies.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.xs),

        // Toggle button
        GestureDetector(
          onTap: _toggleReplies,
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 24,
                  height: 1,
                  color: context.colors.textTertiary.withValues(alpha: 0.3),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  _showReplies
                      ? 'Hide replies'
                      : 'View $replyCount ${replyCount == 1 ? 'reply' : 'replies'}',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: context.colors.textTertiary,
                  ),
                ),
                const SizedBox(width: AppSpacing.xxs),
                AnimatedRotation(
                  turns: _showReplies ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 14,
                    color: context.colors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Animated reply list
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Column(
            children: comment.replies
                .map(
                  (reply) => CommentCard(
                    comment: reply,
                    onReply: widget.onReply,
                    onLike: widget.onLike,
                    onDelete: widget.onDelete,
                    isReply: true,
                  ),
                )
                .toList(),
          ),
          crossFadeState: _showReplies
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 250),
          sizeCurve: Curves.easeInOut,
        ),
      ],
    );
  }
}
