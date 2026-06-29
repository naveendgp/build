import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../create_post/models/create_post_models.dart';
import '../../create_post/widgets/lead_form/lead_form_builder.dart';
import '../../create_post/providers/create_post_provider.dart';

class FormBuilderScreen extends ConsumerStatefulWidget {
  const FormBuilderScreen({super.key});

  @override
  ConsumerState<FormBuilderScreen> createState() => _FormBuilderScreenState();
}

class _FormBuilderScreenState extends ConsumerState<FormBuilderScreen> {
  LeadFormData _formData = const LeadFormData();

  @override
  Widget build(BuildContext context) {
    final createPostState = ref.watch(createPostProvider);
    final createPostNotifier = ref.read(createPostProvider.notifier);

    return Theme(
      data: AppTheme.darkTheme,
      child: Scaffold(
        backgroundColor: AppTheme.darkTheme.extension<AppThemeColors>()!.background,
        appBar: AppBar(
          backgroundColor: AppTheme.darkTheme.extension<AppThemeColors>()!.surface,
          title: Text('Form Builder', style: AppTypography.titleMedium),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Form saved successfully!')),
                );
                Navigator.pop(context);
              },
              child: Text(
                'Save',
                style: AppTypography.buttonSmall.copyWith(color: AppTheme.darkTheme.extension<AppThemeColors>()!.primaryAccent),
              ),
            ),
          ],
        ),
        body: LeadFormBuilder(
          leadForm: _formData,
          customTemplates: createPostState.customTemplates,
          onUpdate: (updater) {
            setState(() {
              _formData = updater(_formData);
            });
          },
          onSaveTemplate: (name, icon) {
            // Save using the existing createPostProvider which manages templates globally across the app
            createPostNotifier.updateLeadForm((_) => _formData);
            createPostNotifier.saveLeadFormTemplate(name, icon);
          },
        ),
      ),
    );
  }
}
