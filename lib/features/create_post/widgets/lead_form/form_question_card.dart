import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/adaptive/adaptive.dart';
import '../../../../core/theme/app_spacing.dart';

class FormQuestionCard extends StatelessWidget {
  final FormFieldData field;
  final VoidCallback onRemove;
  final ValueChanged<FormFieldData> onUpdate;

  const FormQuestionCard({
    super.key,
    required this.field,
    required this.onRemove,
    required this.onUpdate,
  });

  IconData _getIconForType(FormFieldType type) {
    switch (type) {
      case FormFieldType.shortText:
        return Icons.short_text_rounded;
      case FormFieldType.longText:
        return Icons.notes_rounded;
      case FormFieldType.email:
        return Icons.email_rounded;
      case FormFieldType.phone:
        return Icons.phone_rounded;
      case FormFieldType.singleChoice:
        return Icons.radio_button_checked_rounded;
      case FormFieldType.multipleChoice:
        return Icons.check_box_rounded;
      case FormFieldType.dropDown:
        return Icons.arrow_drop_down_circle_rounded;
      case FormFieldType.appointment:
        return Icons.event_available_rounded;
    }
  }

  String _getLabelForType(FormFieldType type) {
    switch (type) {
      case FormFieldType.shortText:
        return 'SHORT TEXT';
      case FormFieldType.longText:
        return 'PARAGRAPH';
      case FormFieldType.email:
        return 'EMAIL';
      case FormFieldType.phone:
        return 'PHONE';
      case FormFieldType.singleChoice:
        return 'SINGLE CHOICE';
      case FormFieldType.multipleChoice:
        return 'MULTIPLE CHOICE';
      case FormFieldType.dropDown:
        return 'DROPDOWN';
      case FormFieldType.appointment:
        return 'APPOINTMENT';
    }
  }

  bool _hasOptions(FormFieldType type) {
    return type == FormFieldType.singleChoice ||
        type == FormFieldType.multipleChoice ||
        type == FormFieldType.dropDown;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: context.colors.card,
      shape: RoundedRectangleBorder(
        borderRadius: AppSpacing.borderRadiusLg,
        side: BorderSide(color: context.colors.borderLight),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
                Icon(Icons.drag_indicator_rounded, color: context.colors.textSecondary),
                const SizedBox(width: AppSpacing.sm),
                Icon(_getIconForType(field.type), color: context.colors.primaryAccent, size: 20),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    _getLabelForType(field.type),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: context.colors.textSecondary,
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: Colors.redAccent, size: 20),
                  onPressed: onRemove,
                  constraints: BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            SizedBox(height: AppSpacing.md),

            // Question Input
            TextFormField(
              initialValue: field.question,
              style: TextStyle(color: context.colors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Question',
                labelStyle: TextStyle(color: context.colors.textSecondary),
                filled: true,
                fillColor: context.colors.surface,
                border: OutlineInputBorder(
                  borderRadius: AppSpacing.borderRadiusMd,
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
              ),
              onChanged: (val) {
                onUpdate(field.copyWith(question: val));
              },
            ),
            const SizedBox(height: AppSpacing.sm),

            // Options Editor (if applicable)
            if (_hasOptions(field.type)) ...[
              SizedBox(height: AppSpacing.sm),
              Text('Options', style: TextStyle(fontSize: 12, color: context.colors.textSecondary)),
              const SizedBox(height: AppSpacing.sm),
              ...List.generate(field.options.length, (i) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    children: [
                      Icon(
                        field.type == FormFieldType.multipleChoice
                            ? Icons.check_box_outline_blank
                            : Icons.radio_button_unchecked,
                        size: 16,
                        color: context.colors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          initialValue: field.options[i],
                          style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            filled: true,
                            fillColor: context.colors.surface,
                            border: OutlineInputBorder(
                              borderRadius: AppSpacing.borderRadiusSm,
                              borderSide: BorderSide.none,
                            ),
                          ),
                          onChanged: (val) {
                            final newOptions = List<String>.from(field.options);
                            newOptions[i] = val;
                            onUpdate(field.copyWith(options: newOptions));
                          },
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          Icons.remove_circle_outline,
                          size: 18,
                          color: context.colors.textSecondary,
                        ),
                        onPressed: () {
                          if (field.options.length > 1) {
                            final newOptions = List<String>.from(field.options)..removeAt(i);
                            onUpdate(field.copyWith(options: newOptions));
                          }
                        },
                      ),
                    ],
                  ),
                );
              }),
              TextButton.icon(
                onPressed: () {
                  final newOptions = List<String>.from(field.options)
                    ..add('Option ${field.options.length + 1}');
                  onUpdate(field.copyWith(options: newOptions));
                },
                icon: Icon(Icons.add_rounded, size: 16),
                label: Text('Add Option'),
              ),
            ],

            // Required Toggle
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Required',
                  style: TextStyle(fontSize: 12, color: context.colors.textSecondary),
                ),
                AdaptiveSwitch(
                  value: field.isRequired,
                  activeColor: context.colors.primaryAccent,
                  onChanged: (val) {
                    onUpdate(field.copyWith(isRequired: val));
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
