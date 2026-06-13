import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';

class BrandQuicksiteTab extends StatelessWidget {
  final BrandQuicksiteData quicksiteData;

  const BrandQuicksiteTab({super.key, required this.quicksiteData});

  @override
  Widget build(BuildContext context) {
    return ListView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        _buildSectionTitle(context, 'About Us'),
        Text(
          quicksiteData.about,
          style: AppTypography.bodyMedium,
        ),
        const SizedBox(height: AppSpacing.xl),

        if (quicksiteData.services.isNotEmpty) ...[
          _buildSectionTitle(context, 'Services'),
          ...quicksiteData.services.map((service) => _buildServiceCard(context, service)),
          const SizedBox(height: AppSpacing.xl),
        ],

        if (quicksiteData.contact.phone != null || quicksiteData.contact.email != null || quicksiteData.contact.address != null) ...[
          _buildSectionTitle(context, 'Contact'),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: AppSpacing.borderRadiusMd,
              border: Border.all(color: context.colors.borderLight),
            ),
            child: Column(
              children: [
                if (quicksiteData.contact.phone != null) _buildContactRow(context, Icons.phone, quicksiteData.contact.phone!),
                if (quicksiteData.contact.email != null) _buildContactRow(context, Icons.email, quicksiteData.contact.email!),
                if (quicksiteData.contact.address != null) _buildContactRow(context, Icons.location_on, quicksiteData.contact.address!),
                if (quicksiteData.contact.hours != null) _buildContactRow(context, Icons.access_time, quicksiteData.contact.hours!),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],

        if (quicksiteData.socialLinks.isNotEmpty) ...[
          _buildSectionTitle(context, 'Social'),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.sm,
            children: quicksiteData.socialLinks.entries.map((entry) => _buildSocialChip(entry.key, entry.value, context)).toList(),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ],
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(
        title,
        style: AppTypography.titleLarge,
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, BrandService service) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: AppSpacing.borderRadiusSm,
            ),
            child: Icon(service.icon, color: context.colors.textPrimary, size: AppSpacing.iconLg),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(service.name, style: AppTypography.labelLarge),
                const SizedBox(height: AppSpacing.xxs),
                Text(service.description, style: AppTypography.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactRow(BuildContext context, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: context.colors.primaryAccent, size: 20),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(text, style: AppTypography.bodyMedium),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialChip(String platform, String link, BuildContext context) {
    String label = 'Website';
    IconData icon = Icons.language;
    
    final lowerPlatform = platform.toLowerCase();
    
    if (lowerPlatform.contains('instagram')) {
      label = 'Instagram';
      icon = Icons.camera_alt_outlined;
    } else if (lowerPlatform.contains('facebook') || lowerPlatform.contains('fb')) {
      label = 'Facebook';
      icon = Icons.facebook;
    } else if (lowerPlatform.contains('wa') || lowerPlatform.contains('whatsapp')) {
      label = 'WhatsApp';
      icon = Icons.chat_bubble_outline;
    } else if (lowerPlatform.contains('twitter') || lowerPlatform.contains('x')) {
      label = 'X (Twitter)';
      icon = Icons.alternate_email;
    } else if (lowerPlatform.contains('linkedin')) {
      label = 'LinkedIn';
      icon = Icons.work_outline;
    } else if (lowerPlatform.contains('youtube')) {
      label = 'YouTube';
      icon = Icons.play_circle_outline;
    } else if (lowerPlatform.contains('tiktok')) {
      label = 'TikTok';
      icon = Icons.music_note;
    }

    return ActionChip(
      avatar: Icon(icon, color: context.colors.primaryAccent, size: 16),
      label: Text(label, style: AppTypography.labelMedium),
      backgroundColor: context.colors.surface,
      side: BorderSide(color: context.colors.borderLight),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      onPressed: () async {
        String formattedUrl = link.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://$formattedUrl';
        }
        try {
          final uri = Uri.parse(formattedUrl);
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not open the link')),
            );
          }
        }
      },
    );
  }
}
