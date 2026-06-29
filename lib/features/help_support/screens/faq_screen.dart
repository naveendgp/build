import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/support_provider.dart';

class FaqScreen extends ConsumerWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faqAsync = ref.watch(faqProvider);
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
          'FAQ',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: faqAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Text('Failed to load FAQs', style: AppTypography.bodyMedium.copyWith(color: context.colors.error)),
        ),
        data: (faqs) {
          if (faqs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.question_answer_outlined, size: 64, color: context.colors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'No FAQs available',
                    style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            itemCount: faqs.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final faq = faqs[index];
              return Container(
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ExpansionTile(
                  title: Text(
                    faq.question,
                    style: AppTypography.labelLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  iconColor: context.colors.primaryAccent,
                  collapsedIconColor: context.colors.textTertiary,
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  shape: const Border(), // removes default borders
                  children: [
                    Text(
                      faq.answer,
                      style: AppTypography.bodyMedium.copyWith(
                        color: context.colors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
