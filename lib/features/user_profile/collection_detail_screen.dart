import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import 'models/user_profile_models.dart';
import 'widgets/vault/save_item_card.dart';
import 'package:go_router/go_router.dart';
import '../explore/screens/explore_post_detail_screen.dart';
import 'providers/collections_provider.dart';

class CollectionDetailScreen extends ConsumerStatefulWidget {
  final CollectionItem collection;

  const CollectionDetailScreen({
    super.key,
    required this.collection,
  });

  @override
  ConsumerState<CollectionDetailScreen> createState() => _CollectionDetailScreenState();
}

class _CollectionDetailScreenState extends ConsumerState<CollectionDetailScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.offset > 150 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollController.offset <= 150 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final coverImage = widget.collection.coverImages.isNotEmpty 
        ? widget.collection.coverImages.first 
        : null;

    return Scaffold(
      backgroundColor: context.colors.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: context.colors.background,
            elevation: 0,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
              ),
              onPressed: () => context.pop(),
            ),

            flexibleSpace: FlexibleSpaceBar(
              title: _isScrolled 
                  ? Text(widget.collection.title, style: AppTypography.titleMedium)
                  : null,
              centerTitle: true,
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (coverImage != null)
                    Image.network(
                      coverImage,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: context.colors.borderLight.withValues(alpha: 0.3),
                      ),
                    )
                  else
                    Container(color: context.colors.borderLight.withValues(alpha: 0.3)),
                  
                  // Gradient Overlay
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          context.colors.background,
                        ],
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                  
                  // Content Header
                  Positioned(
                    left: AppSpacing.lg,
                    bottom: AppSpacing.lg,
                    right: AppSpacing.lg,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (widget.collection.isPrivate)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            margin: const EdgeInsets.only(bottom: AppSpacing.xs),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.lock_rounded, size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text('Private', style: AppTypography.labelSmall.copyWith(color: Colors.white)),
                              ],
                            ),
                          ),
                        Text(
                          widget.collection.title,
                          style: AppTypography.headlineMedium.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.collection.postCount} posts • Updated ${widget.collection.lastUpdated}',
                          style: AppTypography.bodyMedium.copyWith(
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          
          // Content Grid
          if (widget.collection.posts.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_library_outlined, size: 48, color: context.colors.textTertiary),
                    const SizedBox(height: AppSpacing.md),
                    Text('No posts yet', style: AppTypography.titleMedium),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Save posts to this collection to see them here',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg).copyWith(bottom: 120),
              sliver: SliverMasonryGrid.count(
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.sm,
                crossAxisSpacing: AppSpacing.sm,
                childCount: widget.collection.posts.length,
                itemBuilder: (context, index) {
                  final item = widget.collection.posts[index];
                  return SaveItemCard(
                    item: item,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ExplorePostDetailScreen(postId: item.id),
                        ),
                      );
                      // Refresh collections after returning so unsave reflects immediately
                      ref.invalidate(collectionsProvider);
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
