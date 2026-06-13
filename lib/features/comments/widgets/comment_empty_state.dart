import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';

class CommentEmptyState extends StatelessWidget {
  const CommentEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 80, bottom: 40),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.chat_bubble_outline_rounded,
              size: 56,
              color: context.colors.textTertiary.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 20),
            Text(
              'Start the conversation',
              style: AppTypography.titleSmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to share your thoughts',
              style: AppTypography.bodySmall.copyWith(
                color: context.colors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
