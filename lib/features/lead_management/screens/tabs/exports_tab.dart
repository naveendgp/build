import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/network/api_client.dart';
import '../../providers/lead_api_provider.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';

class ExportsTab extends ConsumerStatefulWidget {
  const ExportsTab({super.key});

  @override
  ConsumerState<ExportsTab> createState() => _ExportsTabState();
}

class _ExportsTabState extends ConsumerState<ExportsTab> {
  String? selectedPostId;
  DateTimeRange? selectedDateRange;

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 3),
      lastDate: now,
      initialDateRange: selectedDateRange,
    );
    if (picked != null) {
      setState(() => selectedDateRange = picked);
    }
  }

  String _formatDate(DateTime d) => '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  @override
  Widget build(BuildContext context) {
    final statsAsync = ref.watch(brandLeadStatsProvider);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Export Leads', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: AppSpacing.lg),
        
        statsAsync.when(
          data: (stats) {
            if (stats.posts.isEmpty) {
              return const Text('No active campaigns found.');
            }
            selectedPostId ??= stats.posts.first.postId;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Select Campaign', style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: AppSpacing.borderRadiusLg,
                      border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedPostId,
                        isExpanded: true,
                        dropdownColor: context.colors.card,
                        icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.colors.textSecondary),
                        borderRadius: AppSpacing.borderRadiusLg,
                        items: stats.posts.map((p) => DropdownMenuItem(
                          value: p.postId,
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: context.colors.primaryAccent.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.campaign_rounded, size: 14, color: context.colors.primaryAccent),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  p.postTitle ?? 'Campaign ${p.postId.substring(0, 8)}',
                                  style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (selectedPostId == p.postId)
                                Icon(Icons.check_circle_rounded, size: 16, color: context.colors.success),
                            ],
                          ),
                        )).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => selectedPostId = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text('Date Range (Optional)', style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.sm),
                  GestureDetector(
                    onTap: _pickDateRange,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
                      decoration: BoxDecoration(
                        color: context.colors.surface,
                        borderRadius: AppSpacing.borderRadiusLg,
                        border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.date_range_rounded, size: 18, color: context.colors.textSecondary),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              selectedDateRange == null
                                  ? 'All time'
                                  : '${_formatDate(selectedDateRange!.start)} – ${_formatDate(selectedDateRange!.end)}',
                              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                            ),
                          ),
                          if (selectedDateRange != null)
                            GestureDetector(
                              onTap: () => setState(() => selectedDateRange = null),
                              behavior: HitTestBehavior.opaque,
                              child: Icon(Icons.close_rounded, size: 18, color: context.colors.textSecondary),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  GestureDetector(
                    onTap: () async {
                      if (selectedPostId != null) {
                        try {
                          // Show loading indicator in SnackBar
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Downloading...'), duration: Duration(seconds: 1)),
                          );
                          
                          final api = ref.read(apiClientProvider);
                          final url = '/leads/$selectedPostId/export/csv';
                          final res = await api.dio.get(
                            url,
                            queryParameters: selectedDateRange == null
                                ? null
                                : {
                                    // .toUtc() so the backend (which parses
                                    // with `new Date(...)`) doesn't interpret
                                    // a bare local-time string in its own
                                    // timezone and shift the range by hours.
                                    'startDate': selectedDateRange!.start.toUtc().toIso8601String(),
                                    'endDate': selectedDateRange!.end.toUtc().toIso8601String(),
                                  },
                            options: Options(responseType: ResponseType.bytes),
                          );
                          
                          if (res.statusCode == 200) {
                            final dir = await getTemporaryDirectory();
                            final file = File('${dir.path}/leads_export_$selectedPostId.csv');
                            
                            // Add UTF-8 BOM so Google Sheets reads it correctly
                            final bytes = <int>[0xEF, 0xBB, 0xBF, ...res.data];
                            await file.writeAsBytes(bytes, flush: true);
                            
                            // Hide loading indicator
                            if (context.mounted) ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            
                            // Open the file directly with explicit mime type
                            final result = await OpenFilex.open(file.path, type: 'text/csv');
                            
                            if (result.type != ResultType.done && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Could not open file: ${result.message}')),
                              );
                            }
                          } else {
                            throw Exception('Failed with status ${res.statusCode}');
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed: $e')),
                            );
                          }
                        }
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            context.colors.primaryAccent,
                            context.colors.primaryAccent.withValues(alpha: 0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: AppSpacing.borderRadiusMd,
                        boxShadow: [
                          BoxShadow(
                            color: context.colors.primaryAccent.withValues(alpha: 0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.download_rounded, color: Colors.white, size: 20),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'Export Leads as CSV',
                            style: AppTypography.titleSmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Text('Error loading campaigns', style: TextStyle(color: context.colors.error)),
        ),
      ],
    );
  }
}
