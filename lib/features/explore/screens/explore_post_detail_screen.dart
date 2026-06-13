import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../home/models/feed_models.dart';
import '../../home/widgets/feed_card.dart';
import '../../home/providers/feed_provider.dart';
import '../../home/widgets/save_to_collection_sheet.dart';
import '../../comments/widgets/comment_sheet.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../../sharing/widgets/share_sheet.dart';
import '../../../core/network/api_client.dart';

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
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Saved to collections', style: TextStyle(color: context.colors.textPrimary, fontWeight: FontWeight.w600)),
          backgroundColor: context.colors.surface,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Blurred background image for premium feel
          if (_post != null)
            Positioned.fill(
              child: CachedNetworkImage(
                imageUrl: _post!.mediaUrl,
                fit: BoxFit.cover,
              ),
            ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
              child: Container(
                color: Colors.black.withValues(alpha: 0.65),
              ),
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
                          child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
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
                  child: _isLoading || _post == null
                      ? const Center(child: CircularProgressIndicator(color: Colors.white))
                      : SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 40, top: 10),
                            child: FeedCard(
                              post: _post!,
                              onLike: _handleLike,
                              onShare: () => ShareSheet.show(context, _post!),
                              onBookmark: _handleBookmark,
                              onFollow: () {},
                              onReminder: () {},
                              onTap: () {
                                 CommentSheet.show(context, _post!.id, _post!.commentCount);
                              },
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
