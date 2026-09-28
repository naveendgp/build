import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';
import '../../../core/utils/app_messenger.dart';

class CtaStep extends StatelessWidget {
  final PostObjective objective;
  final CtaData ctaData;
  final ValueChanged<CtaType> onCtaTypeChanged;
  final ValueChanged<String> onUrlChanged;
  final ValueChanged<String> onUtmSourceChanged;
  final ValueChanged<String> onUtmMediumChanged;
  final ValueChanged<String> onUtmCampaignChanged;

  const CtaStep({
    super.key,
    required this.objective,
    required this.ctaData,
    required this.onCtaTypeChanged,
    required this.onUrlChanged,
    required this.onUtmSourceChanged,
    required this.onUtmMediumChanged,
    required this.onUtmCampaignChanged,
  });

  bool _isUrlValid(String? url) {
    if (url == null || url.trim().isEmpty) return false;
    return RegExp(r'^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$').hasMatch(url.trim());
  }

  String _generateUtmUrl() {
    String base = ctaData.destinationUrl?.trim() ?? '';
    if (base.isEmpty) return '';
    
    final uri = Uri.tryParse(base);
    if (uri == null) return base;

    final Map<String, String> params = Map.from(uri.queryParameters);
    if (ctaData.utmSource != null && ctaData.utmSource!.isNotEmpty) params['utm_source'] = ctaData.utmSource!;
    if (ctaData.utmMedium != null && ctaData.utmMedium!.isNotEmpty) params['utm_medium'] = ctaData.utmMedium!;
    if (ctaData.utmCampaign != null && ctaData.utmCampaign!.isNotEmpty) params['utm_campaign'] = ctaData.utmCampaign!;

    if (params.isEmpty) return base;
    return uri.replace(queryParameters: params).toString();
  }

  @override
  Widget build(BuildContext context) {
    final meta = ObjectiveMeta.all.firstWhere((m) => m.objective == objective);
    final availableCtas = meta.availableCtas;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Call to Action',
            style: AppTypography.headlineMedium,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Choose a button for your campaign',
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.md,
            children: availableCtas.map((ctaType) {
              final isSelected = ctaData.type == ctaType;
              final dummyData = CtaData(type: ctaType); // for getting display label
              return GestureDetector(
                onTap: () {
                  Haptics.selection();
                  onCtaTypeChanged(ctaType);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                  decoration: BoxDecoration(
                    color: isSelected ? meta.accentColor.withValues(alpha: 0.15) : context.colors.card,
                    borderRadius: AppSpacing.borderRadiusMd,
                    border: Border.all(
                      color: isSelected ? meta.accentColor : context.colors.border,
                      width: isSelected ? 2.0 : 1.0,
                    ),
                  ),
                  child: Text(
                    dummyData.displayLabel,
                    style: AppTypography.labelLarge.copyWith(
                      color: isSelected ? context.colors.textPrimary : context.colors.textSecondary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.xxl),
          if (ctaData.type != CtaType.noButton && objective != PostObjective.leadGeneration && objective != PostObjective.messaging) ...[
            Text(
              'Destination URL',
              style: AppTypography.labelLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            Container(
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: AppSpacing.borderRadiusLg,
                border: Border.all(
                  color: (ctaData.destinationUrl == null || ctaData.destinationUrl!.isEmpty || _isUrlValid(ctaData.destinationUrl)) 
                      ? context.colors.border 
                      : context.colors.error
                ),
              ),
              child: TextFormField(
                initialValue: ctaData.destinationUrl,
                onChanged: onUrlChanged,
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'https://example.com',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
                  prefixIcon: Icon(Icons.link, color: context.colors.textSecondary),
                ),
              ),
            ),
            if (ctaData.destinationUrl != null && ctaData.destinationUrl!.isNotEmpty && !_isUrlValid(ctaData.destinationUrl))
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xs, left: AppSpacing.md),
                child: Text('Please enter a valid URL (e.g., https://example.com)', style: AppTypography.labelSmall.copyWith(color: context.colors.error)),
              ),
            const SizedBox(height: AppSpacing.lg),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text('UTM Builder (Optional)', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary)),
                subtitle: Text('Add tracking parameters to your link', style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary)),
                children: [
                  const SizedBox(height: AppSpacing.md),
                  _buildUtmField(context, 'Campaign Source (utm_source)', 'e.g., lyket, facebook', ctaData.utmSource, onUtmSourceChanged),
                  const SizedBox(height: AppSpacing.md),
                  _buildUtmField(context, 'Campaign Medium (utm_medium)', 'e.g., social, cpc', ctaData.utmMedium, onUtmMediumChanged),
                  const SizedBox(height: AppSpacing.md),
                  _buildUtmField(context, 'Campaign Name (utm_campaign)', 'e.g., summer_sale', ctaData.utmCampaign, onUtmCampaignChanged),
                  const SizedBox(height: AppSpacing.lg),
                  _buildGeneratedUrl(context),
                  const SizedBox(height: AppSpacing.sm),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUtmField(BuildContext context, String label, String hint, String? value, ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        Container(
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: AppSpacing.borderRadiusMd,
            border: Border.all(color: context.colors.border),
          ),
          child: TextFormField(
            initialValue: value,
            onChanged: onChanged,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: hint,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGeneratedUrl(BuildContext context) {
    final generatedUrl = _generateUtmUrl();
    if (generatedUrl.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Generated URL', style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        Container(
          padding: const EdgeInsets.only(left: AppSpacing.md, right: AppSpacing.xs, top: AppSpacing.xs, bottom: AppSpacing.xs),
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: AppSpacing.borderRadiusMd,
            border: Border.all(color: context.colors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  generatedUrl,
                  style: AppTypography.bodySmall.copyWith(color: context.colors.textPrimary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              IconButton(
                icon: Icon(Icons.copy_rounded, size: 20, color: context.colors.primaryAccent),
                onPressed: () {
                  Haptics.selection();
                  Clipboard.setData(ClipboardData(text: generatedUrl));
                  AppMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('URL copied to clipboard!')),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
