import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../providers/support_provider.dart';

class HelpSupportHomeScreen extends ConsumerStatefulWidget {
  final int initialTabIndex;

  const HelpSupportHomeScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  ConsumerState<HelpSupportHomeScreen> createState() => _HelpSupportHomeScreenState();
}

class _HelpSupportHomeScreenState extends ConsumerState<HelpSupportHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTabIndex);
  }

  @override
  void dispose() {
    _tabController.dispose();
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
          'Help & Support',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: context.colors.primaryAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: context.colors.surface,
              unselectedLabelColor: context.colors.textSecondary,
              labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
              onTap: (_) => Haptics.light(),
              tabs: const [
                Tab(text: 'Contact Us'),
                Tab(text: 'My Tickets'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildContactUsTab(context),
          _buildMyTicketsTab(context),
        ],
      ),
    );
  }

  Widget _buildContactUsTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  context.colors.primaryAccent.withOpacity(0.15),
                  context.colors.secondaryAccent.withOpacity(0.15),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: context.colors.primaryAccent.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.headset_mic_rounded, color: context.colors.primaryAccent, size: 36),
                const SizedBox(height: 16),
                Text(
                  'We\'re here to help',
                  style: AppTypography.titleLarge.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Get in touch with our support team or browse our resources.',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Text(
            'How can we assist you?',
            style: AppTypography.titleMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.1,
            children: [
              _buildGridCard(
                title: 'Live Chat',
                icon: Icons.chat_bubble_outline_rounded,
                color: context.colors.primaryAccent,
                onTap: () => context.push('/help/ticket?type=LIVE_CHAT'),
              ),
              _buildGridCard(
                title: 'Bug Report',
                icon: Icons.bug_report_outlined,
                color: context.colors.error,
                onTap: () => context.push('/help/ticket?type=BUG'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGridCard({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        Haptics.light();
        onTap();
      },
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.colors.borderLight),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            Text(
              title,
              style: AppTypography.bodyMedium.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyTicketsTab(BuildContext context) {
    final ticketsAsync = ref.watch(myTicketsProvider);

    return ticketsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(
        child: Text('Failed to load tickets', style: AppTypography.bodyMedium.copyWith(color: context.colors.error)),
      ),
      data: (tickets) {
        if (tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.confirmation_number_outlined, size: 64, color: context.colors.textTertiary),
                const SizedBox(height: 16),
                Text(
                  'No tickets yet',
                  style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your support requests will appear here',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(24),
          itemCount: tickets.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final ticket = tickets[index];
            return _TicketListTile(ticket: ticket);
          },
        );
      },
    );
  }
}

class _TicketListTile extends StatelessWidget {
  final dynamic ticket; // Will be SupportTicket

  const _TicketListTile({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final isResolved = ticket.status == 'RESOLVED' || ticket.status == 'CLOSED';
    final statusColor = isResolved ? context.colors.success : context.colors.warning;

    return GestureDetector(
      onTap: () {
        Haptics.light();
        context.push('/help/ticket/${ticket.id}');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#${ticket.id.substring(0, 8).toUpperCase()}',
                  style: AppTypography.labelMedium.copyWith(
                    color: context.colors.textSecondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    ticket.status,
                    style: AppTypography.labelSmall.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              ticket.subject,
              style: AppTypography.bodyMedium.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  ticket.ticketType,
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                ),
                Text(
                  _formatDate(ticket.createdAt),
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
