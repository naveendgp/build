import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';

void showFollowingBottomSheet(BuildContext context) {
  Haptics.selection();
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const FollowingBottomSheet(),
  );
}

class FollowingBrand {
  final String id;
  final String name;
  final String username;
  final String logoUrl;

  FollowingBrand({
    required this.id,
    required this.name,
    required this.username,
    required this.logoUrl,
  });

  factory FollowingBrand.fromJson(Map<String, dynamic> json) {
    return FollowingBrand(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      logoUrl: json['logoUrl'] ?? '',
    );
  }
}

class FollowingBottomSheet extends ConsumerStatefulWidget {
  const FollowingBottomSheet({super.key});

  @override
  ConsumerState<FollowingBottomSheet> createState() => _FollowingBottomSheetState();
}

class _FollowingBottomSheetState extends ConsumerState<FollowingBottomSheet> {
  List<FollowingBrand>? following;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchFollowing();
  }

  Future<void> _fetchFollowing() async {
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.dio.get('/follow/me');
      
      if (mounted) {
        setState(() {
          following = (response.data['data'] as List)
              .map((data) => FollowingBrand.fromJson(data))
              .toList();
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          error = 'Failed to load following list.';
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
                  'Following',
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
                _fetchFollowing();
              },
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (following == null || following!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_alt_outlined, size: 64, color: context.colors.textDisabled),
            const SizedBox(height: 16),
            Text(
              'Not following anyone',
              style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              'Brands you follow will appear here.',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: following!.length,
      itemBuilder: (context, index) {
        final brand = following![index];
        return _buildBrandTile(context, brand);
      },
    );
  }

  Widget _buildBrandTile(BuildContext context, FollowingBrand brand) {
    return InkWell(
      onTap: () {
        Haptics.selection();
        // Future: Navigate to brand profile
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
              child: brand.logoUrl.isNotEmpty
                  ? Image.network(
                      brand.logoUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildFallbackAvatar(context, brand),
                    )
                  : _buildFallbackAvatar(context, brand),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    brand.name,
                    style: AppTypography.bodyLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (brand.username.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      brand.username.startsWith('@') ? brand.username : '@${brand.username}',
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

  Widget _buildFallbackAvatar(BuildContext context, FollowingBrand brand) {
    return Container(
      color: context.colors.primaryAccent.withValues(alpha: 0.1),
      child: Center(
        child: Text(
          brand.name.isNotEmpty ? brand.name[0].toUpperCase() : 'B',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.primaryAccent,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
