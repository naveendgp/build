import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/widgets/bottom_nav_dock.dart';
import '../providers/messaging_provider.dart';
import '../widgets/chat_list_card.dart';

class MessagingHomeScreen extends ConsumerWidget {
  const MessagingHomeScreen({super.key});

  void _navTo(BuildContext context, WidgetRef ref, int index) {
    if (index == 0) context.go('/home');
    if (index == 1) context.go('/explore');
    if (index == 2) context.push('/create');
    if (index == 3) return;
    if (index == 4) {
      final role = ref.read(authProvider).loggedInRole;
      if (role == UserRole.brand) {
        context.push('/brand/me');
      } else {
        context.push('/profile');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxState = ref.watch(inboxProvider);
    final notifier = ref.read(inboxProvider.notifier);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context),
                _buildTabs(context, inboxState.activeTab, notifier),
                Expanded(
                  child: inboxState.isLoading
                      ? Center(
                          child: CircularProgressIndicator(color: context.colors.primaryAccent),
                        )
                      : inboxState.error != null
                          ? Center(
                              child: Text(
                                inboxState.error!,
                                style: GoogleFonts.inter(color: context.colors.error),
                              ),
                            )
                          : _buildList(context, inboxState, notifier),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: BottomNavDock(
              currentIndex: 3,
              onTap: (i) => _navTo(context, ref, i),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Messages',
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabs(BuildContext context, String activeTab, InboxNotifier notifier) {
    final tabs = ['Brands', 'Profiles', 'Requests'];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: context.colors.border),
        ),
        child: Row(
          children: tabs.map((tab) {
            final isActive = activeTab == tab;
            return Expanded(
              child: GestureDetector(
                onTap: () => notifier.setTab(tab),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isActive ? context.colors.primaryAccent : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: context.colors.primaryAccent.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            )
                          ]
                        : null,
                    border: isActive ? null : null,
                  ),
                  child: Center(
                    child: Text(
                      tab,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                        color: isActive ? Colors.white : context.colors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context, InboxState state, InboxNotifier notifier) {
    // Filter conversations based on tab for this demo
    final filtered = state.conversations.where((c) {
      if (state.activeTab == 'Requests') return c.isRequest;
      if (state.activeTab == 'Brands') return c.otherParticipant.isBrand && !c.isRequest;
      return !c.otherParticipant.isBrand && !c.isRequest;
    }).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 48, color: context.colors.borderLight),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No messages yet',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              state.activeTab == 'Brands'
                  ? 'Connect with your favorite brands'
                  : 'Start a conversation',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: notifier.loadInbox,
      color: context.colors.primaryAccent,
      backgroundColor: context.colors.card,
      child: ListView.builder(
        itemCount: filtered.length,
        padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: 100),
        itemBuilder: (context, index) {
          final conv = filtered[index];
          return ChatListCard(conversation: conv);
        },
      ),
    );
  }
}
