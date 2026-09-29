import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';
import '../../../core/utils/app_messenger.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/adaptive/adaptive_pickers.dart';

class LeadFormViewerSheet extends ConsumerStatefulWidget {
  final String postId;
  final String formId;
  final String brandAvatar;
  final String brandName;

  const LeadFormViewerSheet({
    super.key,
    required this.postId,
    required this.formId,
    required this.brandAvatar,
    required this.brandName,
  });

  static Future<void> show(
    BuildContext context,
    String postId,
    String formId,
    String brandAvatar,
    String brandName,
  ) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LeadFormViewerSheet(
        postId: postId,
        formId: formId,
        brandAvatar: brandAvatar,
        brandName: brandName,
      ),
    );
  }

  @override
  ConsumerState<LeadFormViewerSheet> createState() => _LeadFormViewerSheetState();
}

class _LeadFormViewerSheetState extends ConsumerState<LeadFormViewerSheet> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isSuccess = false;
  String? _error;

  Map<String, dynamic>? _formData;
  final Map<String, dynamic> _answers = {};
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _fetchForm();
  }

  Future<void> _fetchForm() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get('/lead-form/${widget.formId}');
      if (res.statusCode == 200 && res.data != null) {
        setState(() {
          _formData = res.data;
          _isLoading = false;
        });
      } else {
        throw Exception("Failed to load form");
      }
    } catch (e) {
      setState(() {
        _error = "Error: $e";
        _isLoading = false;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    Haptics.light();

    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.post(
        '/leads/${widget.postId}/forms/${widget.formId}/submit',
        data: {'answers': _answers},
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _isSuccess = true;
          _isSubmitting = false;
        });
        Haptics.medium();

        Future.delayed(const Duration(seconds: 2), () {
          if (!mounted) return;
          Navigator.pop(context);
        });
      } else {
        throw Exception("Submission failed");
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      Haptics.heavy();
      if (!mounted) return;
      AppMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to submit the form. Please try again.')));
    }
  }

  bool _isPrebuiltField(dynamic field) {
    final type = field['type']?.toString().toUpperCase();
    final label = field['label']?.toString();

    if (type == 'EMAIL' || type == 'PHONE') return true;
    if (label == 'What is your gender?' ||
        label == 'What is your job title?' ||
        label == 'Company Name')
      return true;

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 40),
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 20),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.colors.border,
                borderRadius: AppSpacing.borderRadiusFull,
              ),
            ),
          ),

          Flexible(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _buildContent(bottomInset),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(double bottomInset) {
    if (_isLoading) {
      return Padding(
        padding: EdgeInsets.all(40),
        child: Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
          ),
        ),
      );
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(40),
        child: Center(
          child: Text(
            _error!,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.error),
          ),
        ),
      );
    }

    if (_isSuccess) {
      return _buildSuccessState();
    }

    return _buildForm(bottomInset);
  }

  Widget _buildForm(double bottomInset) {
    final title = _formData?['title'] ?? 'Contact Us';
    final intro = _formData?['intro'] ?? '';

    final rawFields = _formData?['fields'] as List<dynamic>? ?? [];
    final customFields = rawFields.where((f) => !_isPrebuiltField(f)).toList();
    final prebuiltFields = rawFields.where((f) => _isPrebuiltField(f)).toList();
    final fields = [...customFields, ...prebuiltFields];

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                CircleAvatar(radius: 20, backgroundImage: NetworkImage(widget.brandAvatar)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.brandName,
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textSecondary,
                        ),
                      ),
                      Text(
                        title,
                        style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (intro.isNotEmpty) ...[
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                intro,
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Fields
          Flexible(
            child: Form(
              key: _formKey,
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: fields.length,
                separatorBuilder: (context, index) => const SizedBox(height: 20),
                itemBuilder: (ctx, i) {
                  final field = fields[i];
                  return _buildFieldInput(field);
                },
              ),
            ),
          ),

          // The wording is the brand's own, with its policy link beside it,
          // so what a person agrees to is set by whoever collects the answers.
          Builder(
            builder: (context) {
              final consent = (_formData?['consentText'] ?? '').toString().trim();
              final policyUrl = (_formData?['privacyPolicyUrl'] ?? '').toString().trim();
              if (consent.isEmpty && policyUrl.isEmpty) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (consent.isNotEmpty)
                      Text(
                        consent,
                        style: AppTypography.bodySmall.copyWith(
                          color: context.colors.textTertiary,
                          height: 1.5,
                        ),
                      ),
                    if (policyUrl.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: () async {
                          final uri = Uri.tryParse(
                            policyUrl.startsWith('http') ? policyUrl : 'https://$policyUrl',
                          );
                          if (uri != null && await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        },
                        child: Text(
                          'Privacy policy',
                          style: AppTypography.labelMedium.copyWith(
                            color: context.colors.primaryAccent,
                            fontWeight: FontWeight.w600,
                            decoration: TextDecoration.underline,
                            decorationColor: context.colors.primaryAccent,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),

          // Submit Button
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 34),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitForm,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colors.primaryAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMd),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator.adaptive(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      'Submit',
                      style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldInput(Map<String, dynamic> field) {
    final fieldId = (field['id'] ?? '').toString();
    final type = (field['type'] ?? '').toString();
    final label = (field['label'] ?? '').toString();
    final isRequired = field['isRequired'] == true || field['isRequired'] == 'true';
    final options = (field['options'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();

    // Books something: a date and a time, kept as an ISO 8601 string so the
    // brand reads one value rather than two.
    if (type == 'APPOINTMENT') {
      return _AppointmentField(
        label: label,
        isRequired: isRequired,
        onChanged: (value) => _answers[fieldId] = value,
      );
    }

    if (type == 'SELECT' || type == 'RADIO') {
      return DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: '$label${isRequired ? ' *' : ''}',
          border: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd),
          filled: true,
          fillColor: context.colors.surface,
        ),
        items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
        onChanged: (val) {
          if (val != null) _answers[fieldId] = val;
        },
        validator: (val) {
          if (isRequired && (val == null || val.isEmpty)) return 'This field is required';
          return null;
        },
      );
    } else if (type == 'CHECKBOX') {
      // For simplicity, render multiple choice as a multi-select dialog or just a list of checkboxes.
      // Since building a full multi-select widget inline might be long, let's treat it as a single select
      // or build a simplified one. I will use Dropdown for now as a fallback if options are provided.
      if (options.isNotEmpty) {
        return DropdownButtonFormField<String>(
          decoration: InputDecoration(
            labelText: '$label (Select one)${isRequired ? ' *' : ''}',
            border: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd),
            filled: true,
            fillColor: context.colors.surface,
          ),
          items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
          onChanged: (val) {
            if (val != null) _answers[fieldId] = val;
          },
          validator: (val) {
            if (isRequired && (val == null || val.isEmpty)) return 'This field is required';
            return null;
          },
        );
      }
    }

    // Default text input (TEXT, TEXTAREA, EMAIL, PHONE)
    return TextFormField(
      maxLines: type == 'TEXTAREA' ? 3 : 1,
      keyboardType: type == 'EMAIL'
          ? TextInputType.emailAddress
          : type == 'PHONE'
          ? TextInputType.phone
          : TextInputType.text,
      decoration: InputDecoration(
        labelText: '$label${isRequired ? ' *' : ''}',
        border: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd),
        filled: true,
        fillColor: context.colors.surface,
      ),
      onChanged: (val) => _answers[fieldId] = val,
      validator: (val) {
        if (isRequired && (val == null || val.isEmpty)) return 'This field is required';
        if (type == 'EMAIL' && val != null && val.isNotEmpty && !val.contains('@'))
          return 'Enter a valid email';
        return null;
      },
    );
  }

  Widget _buildSuccessState() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(40, 40, 40, 80),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline_rounded, color: context.colors.primaryAccent, size: 80),
          const SizedBox(height: 24),
          Text(
            'Information Submitted',
            style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            'Thank you for your interest! ${widget.brandName} will be in touch shortly.',
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// A date and a time for forms that book something. Uses the platform's own
/// pickers, so it follows the app's theme like every other picker.
class _AppointmentField extends StatefulWidget {
  final String label;
  final bool isRequired;
  final ValueChanged<String> onChanged;

  const _AppointmentField({required this.label, required this.isRequired, required this.onChanged});

  @override
  State<_AppointmentField> createState() => _AppointmentFieldState();
}

class _AppointmentFieldState extends State<_AppointmentField> {
  DateTime? _picked;

  String _format(DateTime value) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
    final minute = value.minute.toString().padLeft(2, '0');
    final period = value.hour < 12 ? 'AM' : 'PM';
    return '${value.day} ${months[value.month - 1]} ${value.year} · $hour:$minute $period';
  }

  Future<void> _pick() async {
    final now = DateTime.now();
    final date = await showAdaptiveDatePicker(
      context,
      initialDate: _picked ?? now.add(const Duration(days: 1)),
      // Nothing is booked in the past.
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;

    final time = await showAdaptiveTimePicker(
      context,
      initialTime: TimeOfDay.fromDateTime(_picked ?? now),
    );
    if (time == null || !mounted) return;

    final value = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() => _picked = value);
    widget.onChanged(value.toIso8601String());
  }

  @override
  Widget build(BuildContext context) {
    return FormField<DateTime>(
      validator: (_) {
        if (widget.isRequired && _picked == null) return 'Pick a date and time';
        return null;
      },
      builder: (state) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () async {
              await _pick();
              state.didChange(_picked);
            },
            borderRadius: AppSpacing.borderRadiusMd,
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: '${widget.label}${widget.isRequired ? ' *' : ''}',
                border: OutlineInputBorder(borderRadius: AppSpacing.borderRadiusMd),
                filled: true,
                fillColor: context.colors.surface,
                errorText: state.errorText,
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.event_available_rounded,
                    size: 20,
                    color: context.colors.textSecondary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      _picked == null ? 'Choose a date and time' : _format(_picked!),
                      style: AppTypography.bodyMedium.copyWith(
                        color: _picked == null
                            ? context.colors.textTertiary
                            : context.colors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
