import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/brand_dashboard/providers/dashboard_providers.dart';
import '../../features/brand_profile/providers/brand_profile_provider.dart';
import '../../features/brand_profile/screens/brand_saved_posts_screen.dart';
import '../../features/comments/providers/comments_provider.dart';
import '../../features/explore/providers/explore_provider.dart';
import '../../features/home/providers/feed_provider.dart';
import '../../features/lead_management/providers/lead_api_provider.dart';
import '../../features/messaging/providers/messaging_provider.dart';
import '../../features/notifications/providers/notifications_provider.dart';
import '../../features/settings/providers/interests_provider.dart';
import '../../features/settings/providers/others_provider.dart';
import '../../features/settings/providers/settings_provider.dart';
import '../../features/user_profile/providers/collections_provider.dart';
import '../../features/user_profile/providers/reminders_provider.dart';
import '../../features/user_profile/providers/saved_posts_provider.dart';
import '../../features/user_profile/providers/user_profile_provider.dart';

/// Throws away everything loaded for the account that was signed in.
///
/// Most providers here are not autoDispose, and the ones that are only clear
/// when nothing is watching them — so after signing out and back in as someone
/// else, the profile, the feed, the inbox and the rest were still the previous
/// account's. Signing in and out both go through this, so nothing from one
/// account can be read by the next.
void resetSessionState(Ref ref) {
  // Who you are, and what you chose
  ref.invalidate(userProfileProvider);
  ref.invalidate(userSettingsProvider);
  ref.invalidate(brandSettingsProvider);
  ref.invalidate(interestsProvider);
  ref.invalidate(blockedBrandsProvider);
  ref.invalidate(blockedUsersProvider);

  // What you are shown
  ref.invalidate(feedProvider);
  ref.invalidate(exploreProvider);
  ref.invalidate(notificationsProvider);
  ref.invalidate(commentsProvider);
  ref.invalidate(commentCountProvider);

  // What you kept
  ref.invalidate(savedPostsProvider);
  ref.invalidate(collectionsProvider);
  ref.invalidate(remindersProvider);
  ref.invalidate(allRemindersProvider);
  ref.invalidate(brandSavedPostsProvider);
  ref.invalidate(notInterestedPostsProvider);
  ref.invalidate(reportedPostsProvider);

  // Conversations
  ref.invalidate(inboxProvider);
  ref.invalidate(chatProvider);

  // A brand's own screens
  ref.invalidate(brandProfileProvider);
  ref.invalidate(dashboardSummaryProvider);
  ref.invalidate(dashboardChartsProvider);
  ref.invalidate(brandDashboardPostsProvider);
  ref.invalidate(brandFormsProvider);
  ref.invalidate(brandLeadStatsProvider);
  ref.invalidate(postLeadsProvider);
}
