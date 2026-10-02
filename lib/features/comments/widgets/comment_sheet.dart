import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/comments_provider.dart';
import 'comment_card.dart';
import 'comment_composer.dart';
import 'comment_skeleton.dart';
import 'comment_empty_state.dart';

/// Premium cinematic comment sheet — the entry point for the comment experience.
/// Opens as a DraggableScrollableSheet with glassmorphic design.
class CommentSheet extends ConsumerStatefulWidget {
  final String postId;
  final int commentCount;

  const CommentSheet({super.key, required this.postId, required this.commentCount});

  /// Shows the comment sheet as a modal bottom sheet.
  static void show(BuildContext context, String postId, int commentCount) {
    Haptics.medium();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      enableDrag: true,
      useSafeArea: false,
      builder: (_) => CommentSheet(postId: postId, commentCount: commentCount),
    );
  }

  @override
  ConsumerState<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<CommentSheet> with SingleTickerProviderStateMixin {
  late AnimationController _entryController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(vsync: this, duration: Duration(milliseconds: 400));
    _fadeAnimation = CurvedAnimation(parent: _entryController, curve: Curves.easeOutCubic);
    _entryController.forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(commentsProvider(widget.postId));
    final notifier = ref.read(commentsProvider(widget.postId).notifier);

    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = viewInsets > 0;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: DraggableScrollableSheet(
        initialChildSize: isKeyboardOpen ? 1.0 : 0.75,
        minChildSize: isKeyboardOpen ? 1.0 : 0.4,
        maxChildSize: 1.0,
        snap: true,
        snapSizes: isKeyboardOpen ? [1.0] : [0.4, 0.75, 1.0],
        builder: (context, scrollController) {
          return Padding(
            padding: EdgeInsets.only(bottom: viewInsets),
            child: ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                child: Container(
                  decoration: BoxDecoration(
                    color: context.colors.surface.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                    border: Border(top: BorderSide(color: context.colors.borderLight, width: 0.5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 40,
                        offset: Offset(0, -10),
                      ),
                    ],
                  ),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final minSafeHeight = 350.0;
                      final effectiveHeight = constraints.maxHeight < minSafeHeight
                          ? minSafeHeight
                          : constraints.maxHeight;

                      return SingleChildScrollView(
                        physics: constraints.maxHeight < minSafeHeight
                            ? ClampingScrollPhysics()
                            : NeverScrollableScrollPhysics(),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            minHeight: effectiveHeight,
                            maxHeight: effectiveHeight,
                          ),
                          child: Column(
                            children: [
                              // Drag Handle
                              _buildDragHandle(),

                              // Header
                              _buildHeader(context, state),

                              // Divider
                              Container(
                                height: 0.5,
                                margin: EdgeInsets.symmetric(horizontal: AppSpacing.md),
                                color: context.colors.border,
                              ),

                              // Comment List
                              Expanded(child: _buildCommentList(state, notifier, scrollController)),

                              // Composer
                              CommentComposer(
                                replyToName: state.replyToName,
                                isSending: state.isSending,
                                onCancelReply: () => notifier.clearReply(),
                                onSend: (text) => notifier.addComment(text),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDragHandle() {
    return Padding(
      padding: EdgeInsets.only(top: 12, bottom: 4),
      child: Center(
        child: Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: context.colors.borderLight,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, CommentsState state) {
    // The header counted only the top-level comments on screen, so it
    // disagreed with the number on the post whenever a thread had replies.
    final count = ref.watch(commentCountProvider)[widget.postId] ?? widget.commentCount;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Row(
        children: [
          Text(
            'Comments',
            style: AppTypography.titleMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
          SizedBox(width: 8),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: AppSpacing.borderRadiusFull,
            ),
            child: Text(
              _formatCount(count),
              style: AppTypography.labelSmall.copyWith(
                color: context.colors.textSecondary,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
          Spacer(),
          // Close button
          GestureDetector(
            onTap: () {
              Haptics.light();
              Navigator.of(context).pop();
            },
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(color: context.colors.card, shape: BoxShape.circle),
              child: Icon(Icons.close_rounded, size: 18, color: context.colors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentList(
    CommentsState state,
    CommentsNotifier notifier,
    ScrollController scrollController,
  ) {
    if (state.isLoading) {
      return CommentSkeleton();
    }

    if (state.error != null) {
      return _buildErrorState(notifier);
    }

    if (state.comments.isEmpty) {
      return CommentEmptyState();
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification && notification.metrics.extentAfter < 100) {
          notifier.loadMore();
        }
        return false;
      },
      child: ListView.builder(
        controller: scrollController,
        padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
        physics: BouncingScrollPhysics(),
        itemCount: state.comments.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.comments.length) {
            return Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                  ),
                ),
              ),
            );
          }

          final comment = state.comments[index];
          return Padding(
            padding: EdgeInsets.only(bottom: 20),
            child: CommentCard(
              comment: comment,
              expandedReplies: state.expandedReplies,
              onToggleReplies: notifier.toggleReplies,
              onReply: (id, name) => notifier.setReplyTo(id, name),
              onLike: (id) => notifier.toggleLike(id),
              onDelete: (id) => _confirmDelete(id, notifier),
              currentAccountId: _accountId,
            ),
          );
        },
      ),
    );
  }

  /// Whoever is signed in: a brand posts as its brand id, a person as theirs.
  String? get _accountId {
    final auth = ref.watch(authProvider);
    return auth.loggedInRole == UserRole.brand ? auth.brandId : auth.userId;
  }

  /// Deleting a comment takes its replies with it, so it is worth a question.
  Future<void> _confirmDelete(String commentId, CommentsNotifier notifier) async {
    final ok = await showAdaptiveConfirmDialog(
      context,
      title: 'Delete this comment?',
      message: 'Any replies to it are removed too. This cannot be undone.',
      confirmLabel: 'Delete',
      isDestructive: true,
    );
    if (ok == true) await notifier.deleteComment(commentId);
  }

  Widget _buildErrorState(CommentsNotifier notifier) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_rounded,
              size: 48,
              color: context.colors.textTertiary.withValues(alpha: 0.4),
            ),
            SizedBox(height: 16),
            Text(
              'Couldn\'t load comments',
              style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 8),
            Text(
              'Check your connection and try again',
              style: AppTypography.bodySmall.copyWith(color: context.colors.textTertiary),
            ),
            SizedBox(height: 20),
            GestureDetector(
              onTap: () {
                Haptics.light();
                notifier.loadComments();
              },
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                decoration: BoxDecoration(
                  color: context.colors.primaryAccent.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.3)),
                ),
                child: Text(
                  'Retry',
                  style: AppTypography.labelLarge.copyWith(
                    color: context.colors.primaryAccent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    if (count == 0) return '0';
    return count.toString();
  }
}
