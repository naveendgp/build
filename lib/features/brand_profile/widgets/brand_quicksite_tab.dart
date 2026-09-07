import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';

class BrandQuicksiteTab extends StatelessWidget {
  final BrandQuicksiteData quicksiteData;
  final String? gstNumber;
  final bool isOwner;
  final VoidCallback? onEdit;

  const BrandQuicksiteTab({
    super.key,
    required this.quicksiteData,
    this.gstNumber,
    this.isOwner = false,
    this.onEdit,
  });

  Widget _buildContactRow(BuildContext context, IconData icon, String text, {String? url}) {
    return InkWell(
      onTap: url != null ? () async {
        final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open link')));
          }
        }
      } : null,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: url != null ? context.colors.primaryAccent : context.colors.textSecondary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: AppTypography.bodyMedium.copyWith(
                  color: url != null ? context.colors.primaryAccent : context.colors.textPrimary,
                  decoration: url != null ? TextDecoration.underline : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialButton(BuildContext context, String platform, String url, IconData icon) {
    return InkWell(
      onTap: () async {
        final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open link')));
          }
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: context.colors.surfaceSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.colors.borderLight, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: context.colors.textPrimary),
            const SizedBox(width: 8),
            Text(
              platform,
              style: AppTypography.labelLarge.copyWith(
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getSocialIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook': return Icons.facebook;
      case 'whatsapp': return Icons.chat;
      case 'instagram': return Icons.camera_alt;
      case 'website': return Icons.language;
      default: return Icons.link;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16).copyWith(bottom: 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Business Information',
                style: AppTypography.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (isOwner)
                InkWell(
                  onTap: onEdit,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Icon(Icons.edit_outlined, size: 20, color: context.colors.primaryAccent),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            quicksiteData.about,
            style: AppTypography.bodyMedium.copyWith(
              color: context.colors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          if (quicksiteData.services.isNotEmpty) ...[
            Text(
              'Services',
              style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...quicksiteData.services.map((service) => Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.check_circle_outline,
                    color: context.colors.primaryAccent,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                service.name,
                                style: AppTypography.bodyLarge.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (service.price != null && service.price!.isNotEmpty)
                              Text(
                                service.price!,
                                style: AppTypography.bodyMedium.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.primaryAccent,
                                ),
                              ),
                          ],
                        ),
                        if (service.description.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            service.description,
                            style: AppTypography.bodyMedium.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 8),
          ],
          Text(
            'Contact',
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          if (quicksiteData.contact.email != null && quicksiteData.contact.email!.isNotEmpty)
            _buildContactRow(context, Icons.email, quicksiteData.contact.email!),
          if (quicksiteData.contact.phone != null && quicksiteData.contact.phone!.isNotEmpty)
            _buildContactRow(context, Icons.phone, quicksiteData.contact.phone!),
          if (quicksiteData.contact.address != null && quicksiteData.contact.address!.isNotEmpty)
            _buildContactRow(context, Icons.location_on, quicksiteData.contact.address!),
          if (gstNumber != null && gstNumber!.isNotEmpty)
            _buildContactRow(context, Icons.receipt_long_outlined, 'GSTIN: $gstNumber'),
          if (quicksiteData.socialLinks.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              'Social Links',
              style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: quicksiteData.socialLinks.entries.map((e) {
                String platform = '${e.key[0].toUpperCase()}${e.key.substring(1)}';
                String url = e.value;
                
                if (e.key.toLowerCase() == 'whatsapp' && !url.contains('wa.me')) {
                  url = 'https://wa.me/${url.replaceAll(RegExp(r'[^0-9]'), '')}';
                } else if (e.key.toLowerCase() == 'instagram' && !url.contains('instagram.com')) {
                  url = 'https://instagram.com/$url';
                } else if (e.key.toLowerCase() == 'facebook' && !url.contains('facebook.com')) {
                  url = 'https://facebook.com/$url';
                }

                return _buildSocialButton(context, platform, url, _getSocialIcon(e.key));
              }).toList(),
            ),
          ]
        ],
      ),
    );
  }
}
