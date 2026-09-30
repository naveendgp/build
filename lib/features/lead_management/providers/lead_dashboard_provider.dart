import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Analytics lived here as well, duplicating the brand dashboard; leads are
/// managed here and measured there.
enum LeadDashboardTab { forms, leads, exports }

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
