import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/haptics.dart';
import 'providers/brand_profile_provider.dart';
import 'widgets/brand_hero_header.dart';
import 'widgets/brand_action_buttons.dart';
import 'widgets/brand_tab_bar.dart';
import '../brand_profile/widgets/brand_posts_tab.dart';
import '../brand_profile/widgets/brand_gallery_tab.dart';
import '../brand_profile/widgets/brand_quicksite_tab.dart';
import '../reviews/presentation/screens/brand_reviews_tab.dart';

import '../../core/network/api_client.dart';
import '../messaging/screens/chat_screen.dart';
import '../auth/providers/auth_provider.dart';
import '../home/widgets/bottom_nav_dock.dart';
import '../../core/utils/app_messenger.dart';

class BrandProfileScreen extends ConsumerStatefulWidget {
  final String brandId;

  const BrandProfileScreen({super.key, required this.brandId});

  @override
  ConsumerState<BrandProfileScreen> createState() => _BrandProfileScreenState();
}

class _BrandProfileScreenState extends ConsumerState<BrandProfileScreen> {
  final _scrollCtrl = ScrollController();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (_scrollCtrl.offset > 200 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollCtrl.offset <= 200 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

  void _navTo(int index) {
    if (index == 0) context.go('/home');
    if (index == 1) context.go('/explore');
    if (index == 2) context.push('/create');
    if (index == 3) context.push('/messages');
    if (index == 4) return;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(brandProfileProvider(widget.brandId));

    // Only show the blocking full-screen spinner when there's no profile
    // to display yet (the true first load). Background refreshes — e.g.
    // loadBrand() re-running after a gallery upload — also flip loadState
    // to `loading`, but tearing down the whole tab tree for those unmounts
    // DefaultTabController and resets the selected tab back to "Posts".
    if (state.profile == null &&
        (state.loadState == BrandLoadState.initial || state.loadState == BrandLoadState.loading)) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
          ),
        ),
      );
    }

    // Same reasoning as above: only replace the whole screen with the error
    // state if we have nothing to show — a failed background refresh with
    // existing data on screen shouldn't nuke the tab selection either.
    if (state.profile == null && state.loadState == BrandLoadState.error) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              state.errorMessage ??
                  'Failed to load brand profile. Please check your connection or login status.',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    if (state.profile == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: Text('Brand not found', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    final profile = state.profile!;
    final showQuicksite = state.quicksite != null;


    final tabs = ['Posts', 'Gallery'];
    if (showQuicksite) tabs.add('Quicksite');
    tabs.add('Reviews');

    final tabViews = <Widget>[
      _buildTabWrapper(BrandPostsTab(posts: state.posts, profile: profile)),
      _buildTabWrapper(BrandGalleryTab(gallery: state.gallery, isOwner: profile.isOwner)),
    ];
    if (showQuicksite) {
      tabViews.add(
        _buildTabWrapper(
          BrandQuicksiteTab(
            quicksiteData: state.quicksite!,
            gstNumber: profile.gstNumber,
            isOwner: profile.isOwner,
            onEdit: () => context.push('/settings/brand-profile'),
          ),
        ),
      );
    }
    tabViews.add(_buildTabWrapper(BrandReviewsTab(brandId: profile.id, isOwner: profile.isOwner)));

    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        backgroundColor: context.colors.background,
        body: Stack(
          children: [
            NestedScrollView(
              controller: _scrollCtrl,
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  BrandHeroHeader(profile: profile),
                  SliverToBoxAdapter(
                    child: Column(
                      children: [
                        BrandActionButtons(
                          profile: profile,
                          onNotificationsToggled: () => ref
                              .read(brandProfileProvider(widget.brandId).notifier)
                              .togglePostNotifications(),
                          isOwner: profile.isOwner,
                          onEditProfileTap: () {
                            Haptics.selection();
                            context.push('/settings/brand-profile');
                          },
                          onLeadCenterTap: () {
                            Haptics.selection();
                            context.push('/brand-dashboard');
                          },
                          onFollowToggled: () => ref
                              .read(brandProfileProvider(widget.brandId).notifier)
                              .toggleFollow(),
                          onMessageTap: () async {
                            try {
                              final api = ref.read(apiClientProvider);
                              final res = await api.dio.post(
                                '/conversations/start',
                                data: {'brandId': profile.id},
                              );
                              final conversationId = res.data['id'].toString();
                              if (!context.mounted) return;
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ChatScreen(conversationId: conversationId),
                                ),
                              );
                            } catch (e) {
                              if (!context.mounted) return;
                              AppMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to start conversation. Please try again.'),
                                ),
                              );
                            }
                          },
                          onWebsiteTap: () async {
                            final url = profile.websiteUrl;
                            if (url != null && url.isNotEmpty) {
                              final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
                              if (await canLaunchUrl(uri)) {
                                await launchUrl(uri, mode: LaunchMode.externalApplication);
                              } else {
                                if (!context.mounted) return;
                                AppMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Could not launch website.')),
                                );
                              }
                            } else {
                              AppMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('No website listed for this brand.')),
                              );
                            }
                          },
                        ),
                        const SizedBox(height: AppSpacing.lg),
                      ],
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _BrandTabBarDelegate(
                      child: Builder(
                        builder: (context) {
                          final tabController = DefaultTabController.of(context);
                          return AnimatedBuilder(
                            animation: tabController,
                            builder: (context, _) => BrandTabBar(
                              selectedIndex: tabController.index,
                              onTabChanged: (i) => tabController.animateTo(i),
                              tabs: tabs,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ];
              },
              body: TabBarView(
                physics: const NeverScrollableScrollPhysics(), // Since content is scrollable inside
                children: tabViews,
              ),
            ),

            // Custom Back Button Overlay
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 20,
              child: GestureDetector(
                onTap: () {
                  Haptics.selection();
                  context.pop();
                },
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      color: context.colors.surface.withValues(alpha: 0.5),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 24),
                    ),
                  ),
                ),
              ),
            ),

            // Bottom Nav Dock
            if (profile.isOwner)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: BottomNavDock(currentIndex: 4, onTap: _navTo),
              ),
          ],
        ),
      ),
    );
  }

  // Wraps tab content in a SingleChildScrollView so NestedScrollView works correctly with variable heights
  Widget _buildTabWrapper(Widget child) {
    return Builder(
      builder: (context) {
        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: EdgeInsets.only(
                top: AppSpacing.lg,
                bottom: MediaQuery.of(context).padding.bottom + 100, // Space for floating dock
              ),
              sliver: SliverToBoxAdapter(child: child),
            ),
          ],
        );
      },
    );
  }
}

class _BrandTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _BrandTabBarDelegate({required this.child});

  @override
  double get minExtent => 48.0;
  @override
  double get maxExtent => 48.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: context.colors.background, child: child);
  }

  @override
  bool shouldRebuild(covariant _BrandTabBarDelegate oldDelegate) {
    return oldDelegate.child != child;
  }
}
