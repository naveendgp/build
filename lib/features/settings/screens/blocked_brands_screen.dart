import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/settings_provider.dart';

class BlockedBrandsScreen extends ConsumerWidget {
  const BlockedBrandsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blockedBrandsState = ref.watch(blockedBrandsProvider);

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
          'Blocked Brands',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: blockedBrandsState.when(
        data: (brands) {
          if (brands.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.block_rounded, size: 48, color: context.colors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'No blocked brands',
                    style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'When you block a brand, it will appear here.',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: brands.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final brand = brands[index];
              return Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: context.colors.surfaceSecondary,
                      backgroundImage: (brand.logoUrl != null && brand.logoUrl!.isNotEmpty)
                          ? NetworkImage(brand.logoUrl!)
                          : null,
                      child: (brand.logoUrl == null || brand.logoUrl!.isEmpty)
                          ? Text(
                              brand.name.isNotEmpty ? brand.name[0] : '?',
                              style: TextStyle(color: context.colors.textPrimary),
                            )
                          : null,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            brand.name,
                            style: AppTypography.bodyLarge.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.textPrimary,
                            ),
                          ),
                          Text(
                            '@${brand.username}',
                            style: AppTypography.bodySmall.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(foregroundColor: context.colors.error),
                      onPressed: () {
                        ref.read(blockedBrandsProvider.notifier).unblockBrand(brand.id);
                      },
                      child: const Text('Unblock'),
                    ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (err, st) => Center(
          child: Text(
            'Failed to load blocked brands.',
            style: TextStyle(color: context.colors.error),
          ),
        ),
      ),
    );
  }
}
