import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/haptics.dart';
import '../providers/lead_dashboard_provider.dart';
import '../providers/lead_api_provider.dart';
import '../widgets/kpi_cards.dart';

import 'tabs/forms_tab.dart';
import 'tabs/leads_tab.dart';
import 'tabs/analytics_tab.dart';
import 'tabs/exports_tab.dart';

class LeadDashboardScreen extends ConsumerWidget {
  const LeadDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leadDashboardProvider);
    final notifier = ref.read(leadDashboardProvider.notifier);
    final statsAsync = ref.watch(brandLeadStatsProvider);

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.surface.withValues(alpha: 0.9),
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () {
            Haptics.light();
            context.pop();
          },
        ),
        title: Text(
          'Lead Management',
          style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm, left: AppSpacing.lg, right: AppSpacing.lg),
            child: _SegmentedNavigation(
              activeTab: state.activeTab,
              onTabSelected: (tab) {
                Haptics.light();
                notifier.setActiveTab(tab);
              },
            ),
          ),
        ),
      ),
      body: statsAsync.when(
        loading: () => Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
        error: (err, stack) => Center(child: Text('Failed to load KPIs: $err')),
        data: (stats) {
          int views = 0;
          for (var p in stats.posts) {
            views += p.viewCount;
          }
          final conversionRate = views > 0 ? (stats.totalSubmissions / views) * 100 : 0.0;
          
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.lg),
              KpiCardsSection(
                totalForms: stats.formCount,
                activeForms: stats.formCount,
                leadsGenerated: stats.totalSubmissions,
                conversionRate: conversionRate,
                leadQualityScore: 8.5, // Mocked for now
              ),
              const SizedBox(height: AppSpacing.xl),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: _buildActiveTabContent(state.activeTab),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActiveTabContent(LeadDashboardTab tab) {
    switch (tab) {
      case LeadDashboardTab.forms:
        return const FormsTab();
      case LeadDashboardTab.leads:
        return const LeadsTab();
      case LeadDashboardTab.analytics:
        return const AnalyticsTab();
      case LeadDashboardTab.exports:
        return const ExportsTab();
    }
  }
}

class _SegmentedNavigation extends StatelessWidget {
  final LeadDashboardTab activeTab;
  final ValueChanged<LeadDashboardTab> onTabSelected;

  const _SegmentedNavigation({
    required this.activeTab,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    final tabs = [
      {'enum': LeadDashboardTab.forms, 'label': 'Forms'},
      {'enum': LeadDashboardTab.leads, 'label': 'Leads'},
      {'enum': LeadDashboardTab.analytics, 'label': 'Analytics'},
      {'enum': LeadDashboardTab.exports, 'label': 'Exports'},
    ];

    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.colors.surface, // Subtle dark background
        borderRadius: AppSpacing.borderRadiusFull,
        border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: tabs.map((tabData) {
          final tabEnum = tabData['enum'] as LeadDashboardTab;
          final label = tabData['label'] as String;
          final isActive = activeTab == tabEnum;

          return Expanded(
            child: GestureDetector(
              onTap: () => onTabSelected(tabEnum),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isActive ? context.colors.card : Colors.transparent,
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: isActive ? Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)) : null,
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          )
                        ]
                      : null,
                ),
                child: Text(
                  label,
                  style: AppTypography.labelMedium.copyWith(
                    color: isActive ? context.colors.textPrimary : context.colors.textTertiary,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
