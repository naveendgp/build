import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/router/app_router.dart';
import '../../command_center/screens/command_center_screen.dart';
import '../../command_center/screens/feedback_screen.dart';
import '../../command_center/screens/help_support_screen.dart';
import '../../command_center/screens/faq_screen.dart';
final userProfileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final meRes = await apiClient.dio.get('/auth/me');
  final role = meRes.data['role'];
  
  if (role == 'BRAND') {
    final res = await apiClient.dio.get('/brand/profile');
    return {...res.data, 'role': 'BRAND'};
  } else {
    final res = await apiClient.dio.get('/user/me');
    return {...res.data, 'role': 'USER'};
  }
});

class HamburgerMenuSheet extends ConsumerWidget {
  const HamburgerMenuSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;

    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.only(top: 12, bottom: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: context.colors.border,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 24),
          
          // Profile Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: profileAsync.when(
              data: (data) => Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: context.colors.primaryAccent.withValues(alpha: 0.2),
                    backgroundImage: (data['profilePic'] != null && data['profilePic'].toString().trim().isNotEmpty) ? NetworkImage(ApiClient.resolveMediaUrl(data['profilePic'].toString())) : null,
                    child: (data['profilePic'] == null || data['profilePic'].toString().trim().isEmpty) ? Icon(Icons.person, color: context.colors.primaryAccent) : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          data['name'] ?? 'User Name',
                          style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          data['email'] ?? 'user@example.com',
                          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => Row(
                children: [
                  const CircleAvatar(radius: 24, child: Icon(Icons.person)),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Account', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold)),
                      Text('Error loading profile', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          SizedBox(height: 24),
          Divider(color: context.colors.border),
          const SizedBox(height: 8),

          // Menu Items
          ListTile(
            contentPadding: EdgeInsets.symmetric(horizontal: 24),
            leading: Icon(Icons.dark_mode_rounded, color: context.colors.textPrimary),
            title: Text('Dark Mode', style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary)),
            trailing: Switch(
              value: isDark,
              onChanged: (val) {
                ref.read(themeProvider.notifier).setTheme(val ? ThemeMode.dark : ThemeMode.light);
              },
            ),
          ),
          _buildMenuItem(context, Icons.settings_rounded, 'Settings', () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CommandCenterScreen()));
          }),
          _buildMenuItem(context, Icons.help_outline_rounded, 'Help & Support', () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HelpSupportScreen()));
          }),
          _buildMenuItem(context, Icons.question_answer_outlined, 'FAQ', () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FaqScreen()));
          }),
          _buildMenuItem(context, Icons.feedback_outlined, 'Feedback and Suggestions', () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FeedbackScreen()));
          }),
          
          SizedBox(height: 8),
          Divider(color: context.colors.border),
          const SizedBox(height: 8),

          // Logout
          _buildMenuItem(
            context, 
            Icons.logout_rounded, 
            'Log out', 
            () async {
              // Call logout
              final apiClient = ref.read(apiClientProvider);
              try {
                await apiClient.dio.post('/auth/logout');
              } catch (_) {}
              
              await SecureStorage.clearSession();
              
              AppRouter.router.go('/login');
            },
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, VoidCallback onTap, {bool isDestructive = false}) {
    final color = isDestructive ? context.colors.error : context.colors.textPrimary;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
      leading: Icon(icon, color: color),
      title: Text(
        title,
        style: AppTypography.bodyLarge.copyWith(color: color, fontWeight: isDestructive ? FontWeight.w600 : FontWeight.normal),
      ),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }
}
