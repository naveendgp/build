import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/network/api_client.dart';
import '../models/lead_models.dart';

class LeadDetailScreen extends ConsumerStatefulWidget {
  final LeadSubmission lead;

  const LeadDetailScreen({super.key, required this.lead});

  @override
  ConsumerState<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends ConsumerState<LeadDetailScreen> {
  Map<String, String> _mappedAnswers = {};
  bool _isLoadingForm = true;

  @override
  void initState() {
    super.initState();
    _fetchFormAndMapAnswers();
  }

  Future<void> _fetchFormAndMapAnswers() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get('/lead-form/${widget.lead.formId}');
      if (res.statusCode == 200 && res.data != null) {
        final fields = res.data['fields'] as List<dynamic>? ?? [];
        final mapped = <String, String>{};
        
        for (var entry in widget.lead.answers.entries) {
          // Find the field label
          final field = fields.firstWhere(
            (f) => f['id'] == entry.key, 
            orElse: () => null,
          );
          final label = field != null ? field['label'] : entry.key;
          mapped[label] = entry.value?.toString() ?? '';
        }

        if (mounted) {
          setState(() {
            _mappedAnswers = mapped;
            _isLoadingForm = false;
          });
        }
      } else {
        _useRawAnswers();
      }
    } catch (e) {
      _useRawAnswers();
    }
  }

  void _useRawAnswers() {
    if (mounted) {
      setState(() {
        for (var entry in widget.lead.answers.entries) {
          _mappedAnswers[entry.key] = entry.value?.toString() ?? '';
        }
        _isLoadingForm = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: AppTheme.darkTheme,
      child: Scaffold(
        backgroundColor: AppTheme.darkTheme.extension<AppThemeColors>()!.background,
        appBar: AppBar(
          backgroundColor: AppTheme.darkTheme.extension<AppThemeColors>()!.surface,
          title: Text('Lead Details', style: AppTypography.titleMedium),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Profile Info
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: context.colors.primaryAccent.withValues(alpha: 0.2),
                  child: Text(
                    widget.lead.username.isNotEmpty ? widget.lead.username.substring(0, 1).toUpperCase() : '?',
                    style: AppTypography.headlineMedium.copyWith(color: context.colors.primaryAccent),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.lead.username, style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: AppSpacing.xxs),
                      if (widget.lead.email != null)
                        Text(widget.lead.email!, style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                    ],
                  ),
                ),
                _buildQualityScore(context, widget.lead.qualityScore),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            
            // Source Info
            _buildSectionHeader(context, 'Acquisition Source'),
            const SizedBox(height: AppSpacing.md),
            _buildInfoCard(context, [
              _InfoRow('Date', _formatDate(widget.lead.createdAt)),
            ]),
            const SizedBox(height: AppSpacing.xl),
            
            // Form Answers
            _buildSectionHeader(context, 'Form Answers'),
            const SizedBox(height: AppSpacing.md),
            if (_isLoadingForm)
              const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
            else
              _buildInfoCard(
                context,
                _mappedAnswers.entries.map((e) => _InfoRow(e.key, e.value)).toList(),
              ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Text(
      title,
      style: AppTypography.titleMedium.copyWith(
        fontWeight: FontWeight.bold,
        color: context.colors.textPrimary,
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, List<_InfoRow> rows) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Column(
        children: rows.asMap().entries.map((entry) {
          final isLast = entry.key == rows.length - 1;
          return Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 100,
                  child: Text(
                    entry.value.label,
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  ),
                ),
                Expanded(
                  child: Text(
                    entry.value.value,
                    style: AppTypography.bodyMedium.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }



  Widget _buildQualityScore(BuildContext context, double score) {
    Color color = context.colors.success;
    if (score < 5) {
      color = context.colors.error;
    } else if (score < 8) {
      color = context.colors.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: AppSpacing.borderRadiusSm,
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            score.toStringAsFixed(1),
            style: AppTypography.headlineSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'Score',
            style: AppTypography.labelSmall.copyWith(color: color),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

class _InfoRow {
  final String label;
  final String value;
  _InfoRow(this.label, this.value);
}
