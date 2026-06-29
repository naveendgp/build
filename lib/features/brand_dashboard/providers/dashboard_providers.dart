import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../services/dashboard_service.dart';
import '../models/dashboard_models.dart';

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardService(apiClient.dio);
});

// Period state (e.g. 7, 30, 90 days)
final dashboardPeriodProvider = StateProvider<int>((ref) => 30);

// Summary Provider
final dashboardSummaryProvider = FutureProvider.autoDispose<DashboardSummary>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  return service.getSummary();
});

// Charts Provider
final dashboardChartsProvider = FutureProvider.autoDispose<DashboardChartsData>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final period = ref.watch(dashboardPeriodProvider);
  return service.getCharts(period);
});

// Post Analytics Filter (All, PUBLISHED, ARCHIVED)
final dashboardPostsStatusFilterProvider = StateProvider<String>((ref) => 'All');

// Post Analytics Provider
final dashboardPostsProvider = FutureProvider.autoDispose<List<PostAnalytics>>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final status = ref.watch(dashboardPostsStatusFilterProvider);
  return service.getPostAnalytics(page: 1, status: status);
});

// Selected Post Provider for Drawer
final selectedPostProvider = StateProvider<PostAnalytics?>((ref) => null);
