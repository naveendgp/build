import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../providers/support_provider.dart';
import '../../../core/utils/app_messenger.dart';

class RaiseTicketScreen extends ConsumerStatefulWidget {
  final String initialType;
  const RaiseTicketScreen({super.key, this.initialType = 'BUG'});

  @override
  ConsumerState<RaiseTicketScreen> createState() => _RaiseTicketScreenState();
}

class _RaiseTicketScreenState extends ConsumerState<RaiseTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _descController = TextEditingController();

  late String _ticketType;
  String _priority = 'medium';

  @override
  void initState() {
    super.initState();
    _ticketType = widget.initialType;
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    Haptics.medium();

    await ref.read(createTicketProvider.notifier).submitTicket(
      subject: _subjectController.text.trim(),
      message: _descController.text.trim(),
      priority: _priority,
      ticketType: _ticketType,
    );
  }

  @override
  Widget build(BuildContext context) {
    final uploadState = ref.watch(createTicketProvider);

    ref.listen<CreateTicketState>(createTicketProvider, (prev, next) {
      if (next.status == TicketUploadState.success && next.result != null) {
        ref.invalidate(myTicketsProvider);
        AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ticket submitted successfully!')));
        context.pop();
      } else if (next.status == TicketUploadState.error) {
        AppMessenger.of(context).showSnackBar(SnackBar(content: Text(next.errorMessage ?? 'Error')));
      }
    });

    final isLoading = uploadState.status == TicketUploadState.uploading || uploadState.status == TicketUploadState.submitting;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Create Ticket',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDropdownField(
                label: 'Ticket Type',
                value: _ticketType,
                items: const [
                  DropdownMenuItem(value: 'SUPPORT', child: Text('General Support')),
                  DropdownMenuItem(value: 'BUG', child: Text('Bug Report')),
                ],
                onChanged: (v) => setState(() => _ticketType = v!),
              ),
              const SizedBox(height: 24),
              _buildDropdownField(
                label: 'Priority',
                value: _priority,
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('Low')),
                  DropdownMenuItem(value: 'medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'high', child: Text('High')),
                  DropdownMenuItem(value: 'urgent', child: Text('Urgent')),
                ],
                onChanged: (v) => setState(() => _priority = v!),
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'Subject',
                controller: _subjectController,
                maxLength: 150,
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'Issue Description',
                controller: _descController,
                maxLength: 5000,
                maxLines: 6,
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 24),
              const SizedBox(height: 24),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.colors.primaryAccent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator.adaptive(valueColor: AlwaysStoppedAnimation<Color>(Colors.white))
                      : Text(
                          'Submit Ticket',
                          style: AppTypography.titleMedium.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelLarge.copyWith(color: context.colors.textSecondary, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          items: items,
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.colors.borderLight)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.colors.borderLight)),
          ),
          dropdownColor: context.colors.surface,
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    int? maxLength,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelLarge.copyWith(color: context.colors.textSecondary, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLength: maxLength,
          maxLines: maxLines,
          validator: validator,
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.colors.borderLight)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.colors.borderLight)),
          ),
        ),
      ],
    );
  }
}
