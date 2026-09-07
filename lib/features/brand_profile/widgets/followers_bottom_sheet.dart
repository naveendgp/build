import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';

void showFollowersBottomSheet(BuildContext context, String brandId) {
  Haptics.selection();
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => FollowersBottomSheet(brandId: brandId),
  );
}

class FollowerUser {
  final String id;
  final String name;
  final String username;
  final String avatarUrl;

  FollowerUser({
    required this.id,
    required this.name,
    required this.username,
    required this.avatarUrl,
  });

  factory FollowerUser.fromJson(Map<String, dynamic> json) {
    return FollowerUser(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      avatarUrl: (json['avatarUrl'] ?? '').toString(),
    );
  }
}

class FollowersBottomSheet extends ConsumerStatefulWidget {
  final String brandId;

  const FollowersBottomSheet({super.key, required this.brandId});

  @override
  ConsumerState<FollowersBottomSheet> createState() => _FollowersBottomSheetState();
}

class _FollowersBottomSheetState extends ConsumerState<FollowersBottomSheet> {
  List<FollowerUser>? followers;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchFollowers();
  }

  Future<void> _fetchFollowers() async {
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.dio.get('/brand/${widget.brandId}/followers');
      
      if (mounted) {
        setState(() {
          followers = (response.data as List)
              .map((data) => FollowerUser.fromJson(data))
              .toList();
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          error = 'Failed to load followers: $e';
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.75;
    
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            height: 4,
            width: 40,
            decoration: BoxDecoration(
              color: context.colors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Followers',
                  style: AppTypography.titleLarge.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: context.colors.textSecondary),
                  onPressed: () => Navigator.of(context).pop(),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          Divider(color: context.colors.borderLight, height: 1),
          
          // Content
          Expanded(
            child: _buildContent(context),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    if (isLoading) {
      return Center(
        child: CircularProgressIndicator(color: context.colors.primaryAccent),
      );
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 48, color: context.colors.error),
            const SizedBox(height: 16),
            Text(
              error!,
              style: AppTypography.bodyLarge.copyWith(color: context.colors.textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  isLoading = true;
                  error = null;
                });
                _fetchFollowers();
              },
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (followers == null || followers!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_alt_outlined, size: 64, color: context.colors.textDisabled),
            const SizedBox(height: 16),
            Text(
              'No followers yet',
              style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              'When people follow this brand, they\'ll appear here.',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: followers!.length,
      itemBuilder: (context, index) {
        final user = followers![index];
        return _buildFollowerTile(context, user);
      },
    );
  }

  Widget _buildFollowerTile(BuildContext context, FollowerUser user) {
    return InkWell(
      onTap: () {
        Haptics.selection();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.colors.surface,
                border: Border.all(color: context.colors.borderLight),
              ),
              clipBehavior: Clip.antiAlias,
              child: user.avatarUrl.isNotEmpty
                  ? Image.network(
                      user.avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildFallbackAvatar(context, user),
                    )
                  : _buildFallbackAvatar(context, user),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    style: AppTypography.bodyLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (user.username.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      user.username.startsWith('@') ? user.username : '@${user.username}',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackAvatar(BuildContext context, FollowerUser user) {
    return Container(
      color: context.colors.primaryAccent.withValues(alpha: 0.1),
      child: Center(
        child: Text(
          user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.primaryAccent,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
