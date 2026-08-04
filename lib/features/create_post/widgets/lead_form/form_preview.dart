import 'dart:ui';
import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';

class FormPreview extends StatefulWidget {
  final LeadFormData leadForm;

  const FormPreview({super.key, required this.leadForm});

  @override
  State<FormPreview> createState() => _FormPreviewState();
}

class _FormPreviewState extends State<FormPreview> {
  final Map<String, dynamic> _answers = {};
  bool _consentGiven = false;
  bool _isSubmitted = false;

  @override
  Widget build(BuildContext context) {
    final fields = widget.leadForm.sortedFields;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: ClipRRect(
        borderRadius: AppSpacing.borderRadiusXl,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            decoration: BoxDecoration(
              color: context.colors.background.withValues(alpha: 0.85),
              borderRadius: AppSpacing.borderRadiusXl,
              border: Border.all(color: context.colors.borderLight, width: 1),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: context.colors.borderLight)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(widget.leadForm.name.isNotEmpty ? widget.leadForm.name : 'Form Preview', 
                           style: AppTypography.headlineSmall.copyWith(color: context.colors.textPrimary)),
                      IconButton(
                        icon: Icon(Icons.close_rounded, color: context.colors.textSecondary),
                        onPressed: () => Navigator.of(context).pop(),
                      )
                    ],
                  ),
                ),
                
                // Form Content
                if (_isSubmitted)
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: context.colors.primaryAccent.withValues(alpha: 0.1),
                              ),
                              child: Icon(Icons.check_circle_rounded, color: context.colors.primaryAccent, size: 48),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            Text(
                              widget.leadForm.thankYouMessage.isNotEmpty 
                                ? widget.leadForm.thankYouMessage 
                                : 'Thank you for submitting the form',
                              textAlign: TextAlign.center,
                              style: AppTypography.titleLarge.copyWith(color: context.colors.textPrimary),
                            ),
                            const SizedBox(height: AppSpacing.xl),
                            ElevatedButton(
                              onPressed: () => Navigator.of(context).pop(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: context.colors.surface,
                                foregroundColor: context.colors.textPrimary,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              ),
                              child: const Text('Close'),
                            )
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (widget.leadForm.heroImage != null)
                          ClipRRect(
                            borderRadius: AppSpacing.borderRadiusLg,
                            child: Image.file(
                              widget.leadForm.heroImage!,
                              height: 140,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                        if (widget.leadForm.heroImage != null)
                          const SizedBox(height: AppSpacing.lg),
                        
                        Text(
                          widget.leadForm.headline.isNotEmpty ? widget.leadForm.headline : 'Your Headline',
                          style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          widget.leadForm.description.isNotEmpty ? widget.leadForm.description : 'Your description goes here.',
                          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        
                        // Fields
                        ...fields.map((field) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                          child: _buildFieldPreview(field),
                        )),
                        
                        // Privacy & Consent
                        if (widget.leadForm.privacyPolicyUrl.isNotEmpty || widget.leadForm.consentText.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.md),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                height: 24,
                                width: 24,
                                child: Checkbox(
                                  value: _consentGiven,
                                  activeColor: context.colors.primaryAccent,
                                  onChanged: (val) {
                                    setState(() => _consentGiven = val ?? false);
                                  },
                                ),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  widget.leadForm.consentText.isNotEmpty 
                                    ? widget.leadForm.consentText 
                                    : 'I agree to the privacy policy.',
                                  style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                                ),
                              )
                            ],
                          )
                        ],
                      ],
                    ),
                  ),
                ),
                
                if (!_isSubmitted)
                  // Submit Button
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          // Mock Submit
                          setState(() {
                            _isSubmitted = true;
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.colors.primaryAccent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusLg),
                      ),
                      child: Text('Submit', style: AppTypography.button.copyWith(color: context.colors.textPrimary)),
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFieldPreview(FormFieldData field) {
    final label = '${field.question}${field.isRequired ? ' *' : ''}';
    
    switch (field.type) {
      case FormFieldType.shortText:
      case FormFieldType.email:
      case FormFieldType.phone:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              style: TextStyle(color: context.colors.textPrimary),
              decoration: _inputDeco(),
              onChanged: (val) => _answers[field.id] = val,
            ),
          ],
        );
      
      case FormFieldType.longText:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              maxLines: 3,
              style: TextStyle(color: context.colors.textPrimary),
              decoration: _inputDeco(),
              onChanged: (val) => _answers[field.id] = val,
            ),
          ],
        );

      case FormFieldType.singleChoice:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            ...field.options.map((opt) => RadioListTile<String>(
              title: Text(opt, style: TextStyle(color: context.colors.textSecondary)),
              value: opt,
              groupValue: _answers[field.id],
              activeColor: context.colors.primaryAccent,
              contentPadding: EdgeInsets.zero,
              dense: true,
              onChanged: (val) {
                setState(() => _answers[field.id] = val);
              },
            ))
          ],
        );

      case FormFieldType.multipleChoice:
        final List<String> currentSelections = _answers[field.id] ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            ...field.options.map((opt) {
              final isChecked = currentSelections.contains(opt);
              return CheckboxListTile(
                title: Text(opt, style: TextStyle(color: context.colors.textSecondary)),
                value: isChecked,
                activeColor: context.colors.primaryAccent,
                contentPadding: EdgeInsets.zero,
                dense: true,
                controlAffinity: ListTileControlAffinity.leading,
                onChanged: (val) {
                  setState(() {
                    if (val == true) {
                      _answers[field.id] = [...currentSelections, opt];
                    } else {
                      _answers[field.id] = currentSelections.where((e) => e != opt).toList();
                    }
                  });
                },
              );
            })
          ],
        );

      case FormFieldType.dropDown:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _answers[field.id],
              dropdownColor: context.colors.card,
              style: TextStyle(color: context.colors.textPrimary),
              decoration: _inputDeco(),
              items: field.options.map((opt) => DropdownMenuItem(
                value: opt,
                child: Text(opt),
              )).toList(),
              onChanged: (val) {
                setState(() => _answers[field.id] = val);
              },
            ),
          ],
        );
    }
  }

  InputDecoration _inputDeco() {
    return InputDecoration(
      filled: true,
      fillColor: context.colors.card,
      border: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd, borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd, borderSide: BorderSide(color: context.colors.borderLight)),
      focusedBorder: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd, borderSide: BorderSide(color: context.colors.primaryAccent)),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
      isDense: true,
    );
  }
}
