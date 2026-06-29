import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import 'form_question_card.dart';

class FormFieldsStep extends StatelessWidget {
  final LeadFormData leadForm;
  final ValueChanged<LeadFormData Function(LeadFormData)> onUpdate;

  const FormFieldsStep({
    super.key,
    required this.leadForm,
    required this.onUpdate,
  });

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
          onUpdate((current) => current.copyWith(
            fields: [...customFields, ...prebuiltFields],
          ));
          Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fields = leadForm.fields;

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
                style: TextStyle(color: Colors.grey)
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
                
                onUpdate((current) => current.copyWith(fields: [...customFields, ...prebuiltFields]));
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
              label: Text('Add Question', style: TextStyle(color: context.colors.primaryAccent, fontWeight: FontWeight.bold)),
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
            Text('Custom', style: TextStyle(color: context.colors.textSecondary, fontWeight: FontWeight.bold)),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText),
                _buildTypeBtn(context, 'Paragraph', Icons.notes_rounded, FormFieldType.longText),
                _buildTypeBtn(context, 'Single Choice', Icons.radio_button_checked_rounded, FormFieldType.singleChoice),
                _buildTypeBtn(context, 'Multiple Choice', Icons.check_box_rounded, FormFieldType.multipleChoice),
                _buildTypeBtn(context, 'Dropdown', Icons.arrow_drop_down_circle_rounded, FormFieldType.dropDown),
              ],
            ),
            SizedBox(height: AppSpacing.xl),
            Text('Pre-built', style: TextStyle(color: context.colors.textSecondary, fontWeight: FontWeight.bold)),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPrebuiltBtn(context, 'Email', Icons.email_rounded, FormFieldType.email, 'email'),
                _buildPrebuiltBtn(context, 'Phone', Icons.phone_rounded, FormFieldType.phone, 'phone'),
                _buildPrebuiltBtn(context, 'Gender', Icons.wc_rounded, FormFieldType.singleChoice, 'What is your gender?', ['Male', 'Female', 'Other', 'Prefer not to say']),
                _buildPrebuiltBtn(context, 'Job Title', Icons.work_rounded, FormFieldType.shortText, 'What is your job title?'),
                _buildPrebuiltBtn(context, 'Company', Icons.business_rounded, FormFieldType.shortText, 'Company Name'),
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
        onAdd(FormFieldData(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          type: type,
          question: '',
          options: (type == FormFieldType.singleChoice || type == FormFieldType.multipleChoice || type == FormFieldType.dropDown) ? ['Option 1'] : [],
        ));
      },
    );
  }

  Widget _buildPrebuiltBtn(BuildContext context, String label, IconData icon, FormFieldType type, String question, [List<String> options = const []]) {
    return ActionChip(
      backgroundColor: context.colors.card,
      side: BorderSide(color: context.colors.borderLight),
      avatar: Icon(icon, size: 16, color: Colors.greenAccent),
      label: Text(label, style: TextStyle(color: context.colors.textPrimary)),
      onPressed: () {
        onAdd(FormFieldData(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          type: type,
          question: question,
          options: options,
          isPrebuilt: true,
        ));
      },
    );
  }
}
