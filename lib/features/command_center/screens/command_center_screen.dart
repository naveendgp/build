import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/storage/secure_storage.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/command_card.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;
import '../../../core/utils/haptics.dart';
import 'account_profile_screen.dart';
import 'brand_operations_screen.dart';
import 'privacy_safety_screen.dart';
import 'notifications_screen.dart';
import 'preferences_screen.dart';
import 'forms_leads_screen.dart';
import 'feedback_screen.dart';
import 'help_support_screen.dart';

class CommandCenterScreen extends ConsumerWidget {
  const CommandCenterScreen({super.key});

  Future<void> _handleLogout(BuildContext context, WidgetRef ref) async {
    Haptics.selection();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B1D22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Logout',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to logout? You will need to sign in again.',
          style: TextStyle(color: Color(0xFFA1A1AA)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFFA1A1AA))),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(
              backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await SecureStorage.clearSession();
      if (context.mounted) {
        context.go('/auth');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      data: (profileData) {
        final isBrand = profileData['role'] == 'BRAND';

        return GlassScaffold(
          title: 'Settings',
          body: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hero Header with banner
                      _buildHeroHeader(context, profileData, isBrand),
                      const SizedBox(height: 32),

                      CommandCard(
                        title: 'Account & Profile',
                        subtitle: 'Manage your public identity, photos, and details',
                        icon: Icons.person_outline_rounded,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const AccountProfileScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),

                      if (isBrand) ...[
                        CommandCard(
                          title: 'Brand Operations',
                          subtitle: 'Business identity, categorization, and discovery data',
                          icon: Icons.storefront_outlined,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const BrandOperationsScreen()),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                      ],

                      CommandCard(
                        title: 'Privacy & Safety',
                        subtitle: 'Control public visibility and interactions',
                        icon: Icons.shield_outlined,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const PrivacySafetyScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      CommandCard(
                        title: 'Notifications',
                        subtitle: 'Manage push and email alerts',
                        icon: Icons.notifications_outlined,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      CommandCard(
                        title: 'Preferences',
                        subtitle: 'Theme, display, and local settings',
                        icon: Icons.tune_rounded,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const PreferencesScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),

                      if (isBrand) ...[
                        CommandCard(
                          title: 'Forms & Leads',
                          subtitle: 'Manage lead generation preferences and templates',
                          icon: Icons.assignment_ind_outlined,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const FormsLeadsScreen()),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                      ],

                      CommandCard(
                        title: 'Feedback & Suggestions',
                        subtitle: 'Share your ideas to help improve Lyket',
                        icon: Icons.rate_review_outlined,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const FeedbackScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),

                      CommandCard(
                        title: 'Help & Support',
                        subtitle: 'FAQs, contact us, and track your tickets',
                        icon: Icons.help_outline_rounded,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const HelpSupportScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 12),

                      const SizedBox(height: 28),

                      // Logout Button
                      GestureDetector(
                        onTap: () => _handleLogout(context, ref),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.redAccent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                          ),
                          alignment: Alignment.center,
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Secure Logout',
                                style: TextStyle(
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const GlassScaffold(
        title: 'Settings',
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (err, stack) => const GlassScaffold(
        title: 'Settings',
        body: Center(child: Text('Failed to load settings', style: TextStyle(color: Colors.white))),
      ),
    );
  }

  Widget _buildHeroHeader(BuildContext context, Map<String, dynamic> profileData, bool isBrand) {
    final logoUrl = isBrand ? profileData['logoUrl'] : profileData['profilePic'];
    final bannerUrl = isBrand ? profileData['coverImageUrl'] : null;
    final name = profileData['name'] ?? 'Loading...';
    final isVerified = profileData['isVerified'] == true || profileData['verificationStatus'] == 'VERIFIED';
    final category = isBrand
        ? profileData['category'] ?? 'Business'
        : profileData['username'] ?? 'User';

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          // Banner area
          if (isBrand && bannerUrl != null && bannerUrl.toString().trim().isNotEmpty)
            Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(bannerUrl),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      const Color(0xFF1B1D22).withValues(alpha: 0.8),
                    ],
                  ),
                ),
              ),
            )
          else
            const SizedBox(height: 16),

          // Profile info
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: Colors.white.withValues(alpha: 0.1),
                  backgroundImage: (logoUrl != null && logoUrl.toString().trim().isNotEmpty)
                      ? NetworkImage(logoUrl.toString().trim())
                      : null,
                  child: (logoUrl == null || logoUrl.toString().trim().isEmpty)
                      ? Icon(isBrand ? Icons.store : Icons.person, color: Colors.white)
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.5,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isVerified)
                            const Padding(
                              padding: EdgeInsets.only(left: 8.0),
                              child: Icon(Icons.verified_rounded, color: Color(0xFF00C2FF), size: 20),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        category,
                        style: const TextStyle(
                          color: Color(0xFFA1A1AA),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
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
