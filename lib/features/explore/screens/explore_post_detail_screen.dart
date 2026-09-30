import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../home/models/feed_models.dart';
import '../../home/widgets/feed_card.dart';
import '../../home/providers/feed_provider.dart';
import '../../home/widgets/save_to_collection_sheet.dart';
import '../../comments/widgets/comment_sheet.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../../sharing/services/share_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/app_messenger.dart';
import '../../auth/providers/auth_provider.dart';

class ExplorePostDetailScreen extends ConsumerStatefulWidget {
  final FeedPost? post;
  final String? postId;

  const ExplorePostDetailScreen({super.key, this.post, this.postId})
    : assert(post != null || postId != null, 'Must provide either post or postId');

  @override
  ConsumerState<ExplorePostDetailScreen> createState() => _ExplorePostDetailScreenState();
}

class _ExplorePostDetailScreenState extends ConsumerState<ExplorePostDetailScreen> {
  FeedPost? _post;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.post != null) {
      _post = widget.post;
    } else if (widget.postId != null) {
      _fetchPost();
    }
  }

  /// The post could not be loaded: gone, or never there.
  bool _isGone = false;

  Future<void> _fetchPost() async {
    setState(() => _isLoading = true);
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.dio.get('/posts/${widget.postId}');
      if (response.statusCode == 200) {
        setState(() {
          _post = FeedPost.fromJson(response.data);
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch post: $e');
      // A link to a post that is no longer there is the ordinary case here -
      // archived, or taken down by the brand - so the screen says so rather
      // than spinning forever.
      if (mounted) setState(() => _isGone = true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleLike() {
    if (_post == null) return;
    setState(() {
      _post = _post!.copyWith(
        isLiked: !_post!.isLiked,
        likeCount: _post!.isLiked ? _post!.likeCount - 1 : _post!.likeCount + 1,
      );
    });
    ref.read(feedProvider.notifier).toggleLike(_post!.id);
  }

  void _handleBookmark() {
    if (_post == null) return;
    final wasBookmarked = _post!.isBookmarked;
    setState(() {
      _post = _post!.copyWith(isBookmarked: !wasBookmarked);
    });
    ref.read(feedProvider.notifier).toggleBookmark(_post!.id);

    if (!wasBookmarked) {
      ref.read(userProfileProvider.notifier).loadProfile();
      AppMessenger.of(context).clearSnackBars();
      AppMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Saved',
            style: TextStyle(color: context.colors.textPrimary, fontWeight: FontWeight.w600),
          ),
          backgroundColor: context.colors.surface,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
          // Personal accounts file posts into collections; brands just save.
          action: ref.read(authProvider).loggedInRole == UserRole.brand
              ? null
              : SnackBarAction(
                  label: 'Save to collection',
                  textColor: context.colors.primaryAccent,
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (context) => SaveToCollectionSheet(post: _post!),
                    );
                  },
                ),
        ),
      );
    }
  }

  void _showReminderSheet(BuildContext parentContext) {
    if (_post == null) return;
    final notifier = ref.read(feedProvider.notifier);
    showModalBottomSheet(
      context: parentContext,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.border,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('Set Reminder', style: AppTypography.titleLarge),
            ),
            _buildReminderOption(sheetContext, '3 days', const Duration(days: 3), notifier),
            _buildReminderOption(sheetContext, '7 days', const Duration(days: 7), notifier),
            _buildReminderOption(sheetContext, '14 days', const Duration(days: 14), notifier),
            _buildReminderOption(sheetContext, '30 days', const Duration(days: 30), notifier),
            ListTile(
              title: Text('Custom date & time', style: AppTypography.bodyLarge),
              trailing: Icon(Icons.calendar_today_rounded, color: context.colors.textSecondary),
              onTap: () async {
                Navigator.pop(sheetContext);
                final date = await showAdaptiveDatePicker(
                  parentContext,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null && parentContext.mounted) {
                  final time = await showAdaptiveTimePicker(
                    parentContext,
                    initialTime: TimeOfDay.now(),
                  );
                  if (time != null && parentContext.mounted) {
                    final dateTime = DateTime(
                      date.year,
                      date.month,
                      date.day,
                      time.hour,
                      time.minute,
                    );
                    notifier.setReminder(_post!.id, dateTime);
                    AppMessenger.of(parentContext).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Reminder set for ${dateTime.month}/${dateTime.day}/${dateTime.year} at ${time.format(parentContext)}',
                        ),
                      ),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildReminderOption(
    BuildContext context,
    String label,
    Duration duration,
    FeedNotifier notifier,
  ) {
    return ListTile(
      title: Text(label, style: AppTypography.bodyLarge),
      trailing: Icon(Icons.notifications_active_outlined, color: context.colors.textSecondary),
      onTap: () {
        Navigator.pop(context);
        final dateTime = DateTime.now().add(duration);
        notifier.setReminder(_post!.id, dateTime);
        AppMessenger.of(context).showSnackBar(SnackBar(content: Text('Reminder set for $label')));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Blurred background image for premium feel
          if (_post != null)
            Positioned.fill(
              child: CachedNetworkImage(imageUrl: _post!.mediaUrl, fit: BoxFit.cover),
            ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
              child: Container(color: Colors.black.withValues(alpha: 0.65)),
            ),
          ),

          // Main Content
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Custom App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.4),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: const Icon(
                            Icons.arrow_back_ios_new_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        'Explore',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(width: 40), // Balance the back button
                    ],
                  ),
                ),

                // The immersive premium post view
                Expanded(
                  child: _isGone || (!_isLoading && _post == null)
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 40),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.link_off_rounded, size: 48, color: Colors.white54),
                                const SizedBox(height: 16),
                                const Text(
                                  'This post is no longer available',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'The brand may have removed it.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white70, fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        )
                      : _isLoading || _post == null
                      ? const Center(
                          child: CircularProgressIndicator.adaptive(
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 40, top: 10),
                            child: FeedCard(
                              post: _post!,
                              onLike: _handleLike,
                              onShare: () => ShareService.nativeShare(
                                postId: _post!.id,
                                title: _post!.title,
                                brandName: _post!.brandName,
                              ),
                              onBookmark: _handleBookmark,
                              onFollow: () {},
                              onReminder: () => _showReminderSheet(context),
                              onTap: () {},
                              isDetailMode: true,
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
