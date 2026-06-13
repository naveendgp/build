import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';

class FormPrivacyStep extends StatelessWidget {
  final LeadFormData leadForm;
  final ValueChanged<LeadFormData Function(LeadFormData)> onUpdate;

  const FormPrivacyStep({
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
          const Text('Privacy Policy URL', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.privacyPolicyUrl,
            decoration: InputDecoration(
              hintText: 'https://yourwebsite.com/privacy',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.link),
            ),
            onChanged: (val) {
              // onUpdate((prev) => prev.copyWith(privacyPolicyUrl: val));
            },
          ),
          const SizedBox(height: 24),
          const Text('Custom Consent Text (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: leadForm.consentText,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'E.g., By submitting this form, you agree to receive marketing emails...',
              border: OutlineInputBorder(),
            ),
            onChanged: (val) {
              // onUpdate((prev) => prev.copyWith(customConsentText: val));
            },
          ),
        ],
      ),
    );
  }
}
