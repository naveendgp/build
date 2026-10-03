import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import 'form_question_card.dart';

class FormFieldsStep extends StatelessWidget {
  final LeadFormData leadForm;
  final ValueChanged<LeadFormData Function(LeadFormData)> onUpdate;

  const FormFieldsStep({super.key, required this.leadForm, required this.onUpdate});

  void _addQuestion(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _AddQuestionSheet(
        onAdd: (field) {
          final newFields = [...leadForm.fields, field];
          final customFields = newFields.where((f) => !f.isPrebuilt).toList();
          final prebuiltFields = newFields.where((f) => f.isPrebuilt).toList();
          onUpdate((current) => current.copyWith(fields: [...customFields, ...prebuiltFields]));
          Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fields = leadForm.sortedFields;

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Form Questions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          SizedBox(height: AppSpacing.md),
          if (fields.isEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: context.colors.card.withValues(alpha: 0.5),
                borderRadius: AppSpacing.borderRadiusLg,
                border: Border.all(color: context.colors.borderLight),
              ),
              child: Text(
                'No questions added yet. Add some questions to capture lead information.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            )
          else
            ReorderableListView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: fields.length,
              onReorder: (oldIndex, newIndex) {
                if (oldIndex < newIndex) {
                  newIndex -= 1;
                }
                final item = fields[oldIndex];
                final newFields = List<FormFieldData>.from(fields);
                newFields.removeAt(oldIndex);
                newFields.insert(newIndex, item);

                // Enforce custom questions on top, prebuilt questions on bottom
                final customFields = newFields.where((f) => !f.isPrebuilt).toList();
                final prebuiltFields = newFields.where((f) => f.isPrebuilt).toList();

                onUpdate(
                  (current) => current.copyWith(fields: [...customFields, ...prebuiltFields]),
                );
              },
              itemBuilder: (context, index) {
                return Padding(
                  key: ValueKey(fields[index].id),
                  padding: EdgeInsets.only(bottom: AppSpacing.sm),
                  child: FormQuestionCard(
                    field: fields[index],
                    onRemove: () {
                      final newFields = List<FormFieldData>.from(fields)..removeAt(index);
                      onUpdate((current) => current.copyWith(fields: newFields));
                    },
                    onUpdate: (updatedField) {
                      final newFields = List<FormFieldData>.from(fields);
                      newFields[index] = updatedField;
                      onUpdate((current) => current.copyWith(fields: newFields));
                    },
                  ),
                );
              },
            ),
          SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                side: BorderSide(color: context.colors.primaryAccent),
                shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusLg),
              ),
              onPressed: () => _addQuestion(context),
              icon: Icon(Icons.add_rounded, color: context.colors.primaryAccent),
              label: Text(
                'Add Question',
                style: TextStyle(color: context.colors.primaryAccent, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddQuestionSheet extends StatelessWidget {
  final ValueChanged<FormFieldData> onAdd;

  const _AddQuestionSheet({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add Question', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: AppSpacing.lg),
            // What a brand can ask for, exactly as the web lists it: the same
            // ten standard fields and the same three kinds of question. This
            // app had its own shorter list of standard fields (no name, city,
            // country, address, pincode or education) and offered Paragraph
            // and Dropdown as question types, which the web does not.
            Text(
              'User Information',
              style: TextStyle(color: context.colors.textSecondary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPrebuiltBtn(
                  context,
                  'Full name',
                  Icons.person_outline_rounded,
                  FormFieldType.shortText,
                  'Full name',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Email',
                  Icons.email_outlined,
                  FormFieldType.email,
                  'Email',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Phone number',
                  Icons.phone_outlined,
                  FormFieldType.phone,
                  'Phone number',
                ),
                // Read by its label: the form shows a date picker for it, and
                // nothing later than today can be chosen.
                _buildPrebuiltBtn(
                  context,
                  'DOB',
                  Icons.cake_outlined,
                  FormFieldType.shortText,
                  'DOB',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Gender',
                  Icons.wc_rounded,
                  FormFieldType.dropDown,
                  'Gender',
                  ['Male', 'Female', 'Other'],
                ),
                _buildPrebuiltBtn(
                  context,
                  'Street Address',
                  Icons.home_outlined,
                  FormFieldType.longText,
                  'Street Address',
                ),
                _buildPrebuiltBtn(
                  context,
                  'City',
                  Icons.location_city_rounded,
                  FormFieldType.shortText,
                  'City',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Pincode',
                  Icons.markunread_mailbox_outlined,
                  FormFieldType.shortText,
                  'Pincode',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Country',
                  Icons.public_rounded,
                  FormFieldType.shortText,
                  'Country',
                ),
                _buildPrebuiltBtn(
                  context,
                  'Education',
                  Icons.school_outlined,
                  FormFieldType.dropDown,
                  'Education',
                  ["High School", "Bachelor's", "Master's", 'PhD', 'Other'],
                ),
              ],
            ),
            SizedBox(height: AppSpacing.xl),
            Text(
              'Custom questions (optional)',
              style: TextStyle(color: context.colors.textSecondary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // "Multiple choice" is one answer from several, as on the web
                // (RADIO), not the checkbox list this app used to add.
                _buildTypeBtn(
                  context,
                  'Multiple choice',
                  Icons.radio_button_checked_rounded,
                  FormFieldType.singleChoice,
                ),
                _buildTypeBtn(
                  context,
                  'Short answer',
                  Icons.short_text_rounded,
                  FormFieldType.shortText,
                ),
                _buildTypeBtn(
                  context,
                  'Appointment request',
                  Icons.event_available_rounded,
                  FormFieldType.appointment,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeBtn(BuildContext context, String label, IconData icon, FormFieldType type) {
    return ActionChip(
      backgroundColor: context.colors.card,
      side: BorderSide(color: context.colors.borderLight),
      avatar: Icon(icon, size: 16, color: const Color(0xFF7C5CFF)),
      label: Text(label, style: TextStyle(color: context.colors.textPrimary)),
      onPressed: () {
        onAdd(
          FormFieldData(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            type: type,
            question: '',
            options:
                (type == FormFieldType.singleChoice ||
                    type == FormFieldType.multipleChoice ||
                    type == FormFieldType.dropDown)
                ? ['Option 1']
                : [],
          ),
        );
      },
    );
  }

  Widget _buildPrebuiltBtn(
    BuildContext context,
    String label,
    IconData icon,
    FormFieldType type,
    String question, [
    List<String> options = const [],
  ]) {
    return ActionChip(
      backgroundColor: context.colors.card,
      side: BorderSide(color: context.colors.borderLight),
      avatar: Icon(icon, size: 16, color: Colors.greenAccent),
      label: Text(label, style: TextStyle(color: context.colors.textPrimary)),
      onPressed: () {
        onAdd(
          FormFieldData(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            type: type,
            question: question,
            options: options,
            isPrebuilt: true,
          ),
        );
      },
    );
  }
}
