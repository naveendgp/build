import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../screens/terms_screen.dart';

class TermsCheckbox extends StatelessWidget {
  final bool accepted;
  final ValueChanged<bool> onChanged;
  final TermsType termsType;

  const TermsCheckbox({
    super.key,
    required this.accepted,
    required this.onChanged,
    required this.termsType,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: accepted
              ? context.colors.primaryAccent.withValues(alpha: 0.4)
              : context.colors.borderLight.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 22,
            height: 22,
            child: Checkbox(
              value: accepted,
              onChanged: (v) => onChanged(v ?? false),
              activeColor: context.colors.primaryAccent,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5)),
              side: BorderSide(
                  color: context.colors.textTertiary, width: 1.5),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(!accepted),
              child: RichText(
                text: TextSpan(
                  style: AppTypography.bodySmall.copyWith(
                      color: context.colors.textSecondary, height: 1.5),
                  children: [
                    const TextSpan(
                        text:
                            'I confirm that I have read, understood, and agree to the '),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.baseline,
                      baseline: TextBaseline.alphabetic,
                      child: GestureDetector(
                        onTap: () => context.push(
                          '/terms',
                          extra: termsType == TermsType.brand ? 'brand' : 'user',
                        ),
                        child: Text(
                          'Terms & Conditions',
                          style: AppTypography.bodySmall.copyWith(
                            color: context.colors.primaryAccent,
                            fontWeight: FontWeight.w600,
                            decoration: TextDecoration.underline,
                            decorationColor: context.colors.primaryAccent,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const TextSpan(
                        text: ' and all applicable Platform policies.'),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
