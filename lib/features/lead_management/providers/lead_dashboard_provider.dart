import 'package:flutter_riverpod/flutter_riverpod.dart';

enum LeadDashboardTab { forms, leads, analytics, exports }

class LeadDashboardState {
  final LeadDashboardTab activeTab;

  const LeadDashboardState({this.activeTab = LeadDashboardTab.forms});

  LeadDashboardState copyWith({LeadDashboardTab? activeTab}) {
    return LeadDashboardState(activeTab: activeTab ?? this.activeTab);
  }
}

class LeadDashboardNotifier extends StateNotifier<LeadDashboardState> {
  LeadDashboardNotifier() : super(const LeadDashboardState());

  void setActiveTab(LeadDashboardTab tab) {
    state = state.copyWith(activeTab: tab);
  }
}

final leadDashboardProvider = StateNotifierProvider<LeadDashboardNotifier, LeadDashboardState>((
  ref,
) {
  return LeadDashboardNotifier();
});
