import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/create_post_models.dart';

class FormIntroStep extends StatelessWidget {
  final LeadFormData leadForm;
  final ValueChanged<LeadFormData Function(LeadFormData)> onUpdate;

  const FormIntroStep({
    super.key,
    required this.leadForm,
    required this.onUpdate,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Form Name (Internal)', style: TextStyle(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.name,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'E.g., Summer Campaign Lead Form',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              border: OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: context.colors.borderLight)),
            ),
            onChanged: (val) {
              onUpdate((prev) => prev.copyWith(name: val));
            },
          ),
          const SizedBox(height: 16),
          Text('Headline (Public)', style: TextStyle(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.headline,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'E.g., Sign up for our newsletter',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              border: OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: context.colors.borderLight)),
            ),
            onChanged: (val) {
              onUpdate((prev) => prev.copyWith(headline: val));
            },
          ),
          const SizedBox(height: 16),
          Text('Description', style: TextStyle(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.description,
            maxLines: 3,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Tell users what they get by filling out this form',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              border: OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: context.colors.borderLight)),
            ),
            onChanged: (val) {
              onUpdate((prev) => prev.copyWith(description: val));
            },
          ),
          const SizedBox(height: 16),
          Text('Thank You Message', style: TextStyle(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.thankYouMessage,
            maxLines: 2,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Message shown after form submission',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              border: OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: context.colors.borderLight)),
            ),
            onChanged: (val) {
              onUpdate((prev) => prev.copyWith(thankYouMessage: val));
            },
          ),
        ],
      ),
    );
  }
}
