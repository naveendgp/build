import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../providers/faq_provider.dart';

class FaqScreen extends ConsumerStatefulWidget {
  const FaqScreen({super.key});

  @override
  ConsumerState<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends ConsumerState<FaqScreen> {
  final Map<String, bool> _expandedState = {};

  @override
  Widget build(BuildContext context) {
    final faqAsync = ref.watch(faqProvider);

    return GlassScaffold(
      title: 'FAQ & Help',
      body: faqAsync.when(
        data: (faqs) {
          if (faqs.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.help_outline_rounded, color: Colors.white.withValues(alpha: 0.2), size: 64),
                  const SizedBox(height: 16),
                  Text('No FAQs available', style: AppTypography.titleMedium.copyWith(color: Colors.white)),
                  const SizedBox(height: 8),
                  Text('Check back later for updates.', style: AppTypography.bodyMedium.copyWith(color: Colors.white.withValues(alpha: 0.5))),
                ],
              ),
            );
          }

          // Group by category
          final Map<String, List<FaqModel>> categorized = {};
          for (final f in faqs) {
            categorized.putIfAbsent(f.category, () => []).add(f);
          }

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            physics: const BouncingScrollPhysics(),
            itemCount: categorized.length,
            itemBuilder: (context, index) {
              final category = categorized.keys.elementAt(index);
              final catFaqs = categorized[category]!;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (index > 0) const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 12),
                    child: Text(
                      category.toUpperCase(),
                      style: AppTypography.labelLarge.copyWith(
                        color: ThemeTokens.primaryAccent,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  ...catFaqs.map((faq) => _buildFaqCard(faq)),
                ],
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: ThemeTokens.primaryAccent)),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, color: Colors.white.withValues(alpha: 0.3), size: 48),
              const SizedBox(height: 12),
              const Text('Failed to load FAQs', style: TextStyle(color: Colors.white, fontSize: 16)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () => ref.invalidate(faqProvider),
                child: const Text('Tap to retry', style: TextStyle(color: ThemeTokens.primaryAccent, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFaqCard(FaqModel faq) {
    final isExpanded = _expandedState[faq.id] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          key: Key(faq.id),
          initiallyExpanded: isExpanded,
          onExpansionChanged: (val) {
            Haptics.selection();
            setState(() {
              _expandedState[faq.id] = val;
            });
          },
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          iconColor: Colors.white,
          collapsedIconColor: Colors.white.withValues(alpha: 0.5),
          title: Text(
            faq.question,
            style: AppTypography.bodyLarge.copyWith(
              color: Colors.white,
              fontWeight: isExpanded ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          expandedCrossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(height: 1, color: Colors.white.withValues(alpha: 0.05)),
            const SizedBox(height: 12),
            Text(
              faq.answer,
              style: AppTypography.bodyMedium.copyWith(
                color: Colors.white.withValues(alpha: 0.7),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
