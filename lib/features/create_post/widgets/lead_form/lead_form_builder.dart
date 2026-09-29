import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/create_post_models.dart';
import 'form_template_picker.dart';
import 'form_intro_step.dart';
import 'form_fields_step.dart';
import 'form_privacy_step.dart';
import 'form_preview.dart';
import '../../../../core/utils/app_messenger.dart';

class LeadFormBuilder extends StatefulWidget {
  final LeadFormData? leadForm;
  final List<LeadFormTemplate> customTemplates;
  final ValueChanged<LeadFormData Function(LeadFormData)> onUpdate;
  final void Function(String, IconData) onSaveTemplate;

  const LeadFormBuilder({
    super.key,
    this.leadForm,
    required this.customTemplates,
    required this.onUpdate,
    required this.onSaveTemplate,
  });

  @override
  State<LeadFormBuilder> createState() => _LeadFormBuilderState();
}

class _LeadFormBuilderState extends State<LeadFormBuilder> {
  late LeadFormData _currentForm;

  bool _isTemplatesExpanded = true;

  @override
  void initState() {
    super.initState();
    _currentForm = widget.leadForm ?? const LeadFormData(fields: []);
  }

  void _handleUpdate(LeadFormData Function(LeadFormData) updater) {
    setState(() {
      _currentForm = updater(_currentForm);
    });
    widget.onUpdate(updater);
  }

  void _showPreview() {
    showDialog(
      context: context,
      builder: (context) => FormPreview(leadForm: _currentForm),
    );
  }

  void _promptSaveTemplate() {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.colors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titlePadding: const EdgeInsets.only(left: 24, top: 24, right: 24, bottom: 16),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24),
        actionsPadding: const EdgeInsets.all(24),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.colors.primaryAccent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.bookmark_added_rounded,
                color: context.colors.primaryAccent,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Save Template',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: ctrl,
                style: TextStyle(color: context.colors.textPrimary, fontSize: 15),
                decoration: InputDecoration(
                  hintText: 'Enter template name...',
                  hintStyle: TextStyle(color: context.colors.textTertiary),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.3),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: context.colors.primaryAccent, width: 1.5),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'Cancel',
              style: TextStyle(color: Colors.white60, fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (ctrl.text.isNotEmpty) {
                widget.onSaveTemplate(ctrl.text.trim(), Icons.star_border_rounded);
                Navigator.pop(context);
                AppMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Template "${ctrl.text.trim()}" saved!',
                      style: TextStyle(color: context.colors.textPrimary),
                    ),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    backgroundColor: context.colors.surface,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: context.colors.primaryAccent,
              foregroundColor: context.colors.textPrimary,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Save', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Lead Form Builder',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: _promptSaveTemplate,
                    icon: Icon(Icons.save_outlined, color: context.colors.primaryAccent),
                    tooltip: 'Save as Template',
                  ),
                  TextButton.icon(
                    onPressed: _showPreview,
                    icon: const Icon(Icons.preview),
                    label: const Text('Preview'),
                  ),
                ],
              ),
            ],
          ),
        ),
        InkWell(
          onTap: () {
            setState(() {
              _isTemplatesExpanded = !_isTemplatesExpanded;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Saved Templates', style: TextStyle(fontWeight: FontWeight.bold)),
                Icon(
                  _isTemplatesExpanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: Colors.grey,
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: Column(
            children: [
              const SizedBox(height: 4),
              FormTemplatePicker(
                customTemplates: widget.customTemplates,
                onTemplateSelected: (templateData) {
                  _handleUpdate((_) => templateData);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
          secondChild: const SizedBox(width: double.infinity, height: 8),
          crossFadeState: _isTemplatesExpanded
              ? CrossFadeState.showFirst
              : CrossFadeState.showSecond,
          duration: const Duration(milliseconds: 300),
        ),
        Expanded(
          child: DefaultTabController(
            length: 3,
            child: Column(
              children: [
                const TabBar(
                  labelColor: Colors.blue,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: Colors.blue,
                  tabs: [
                    Tab(text: 'Intro'),
                    Tab(text: 'Questions'),
                    Tab(text: 'Privacy'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      SingleChildScrollView(
                        child: FormIntroStep(leadForm: _currentForm, onUpdate: _handleUpdate),
                      ),
                      SingleChildScrollView(
                        child: FormFieldsStep(leadForm: _currentForm, onUpdate: _handleUpdate),
                      ),
                      SingleChildScrollView(
                        child: FormPrivacyStep(leadForm: _currentForm, onUpdate: _handleUpdate),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
