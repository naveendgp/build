import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../models/brand_profile_models.dart';

class BrandTestimonialsTab extends StatelessWidget {
  final List<BrandTestimonial> testimonials;

  const BrandTestimonialsTab({super.key, required this.testimonials});

  @override
  Widget build(BuildContext context) {
    if (testimonials.isEmpty) {
      return Center(
        child: Text(
          'No testimonials available',
          style: AppTypography.bodyLarge.copyWith(color: context.colors.textSecondary),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: AppSpacing.paddingScreen,
      itemCount: testimonials.length,
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.lg),
      itemBuilder: (context, index) => _buildTestimonialCard(context, testimonials[index]),
    );
  }

  Widget _buildTestimonialCard(BuildContext context, BrandTestimonial testimonial) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: AppSpacing.borderRadiusXxl,
        border: Border.all(color: const Color(0xFF2A2B2E)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (testimonial.mediaUrl != null)
            Stack(
              children: [
                Image.network(
                  testimonial.mediaUrl!,
                  height: 220,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1B1D22).withValues(alpha: 0.0),
                          const Color(0xFF1B1D22),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
                if (testimonial.isVideo)
                  Positioned.fill(
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        decoration: BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                        child: Icon(
                          Icons.play_arrow_rounded,
                          color: context.colors.textPrimary,
                          size: AppSpacing.iconXl,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          Padding(
            padding: EdgeInsets.only(
              left: AppSpacing.xl,
              right: AppSpacing.xl,
              bottom: AppSpacing.xl,
              top: testimonial.mediaUrl != null ? AppSpacing.md : AppSpacing.xl,
            ),
            child: Column(
              children: [
                Icon(
                  Icons.format_quote_rounded,
                  color: const Color(0xFF7C5CFF).withValues(alpha: 0.2),
                  size: AppSpacing.iconXl * 1.5,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  testimonial.quote,
                  style: AppTypography.titleLarge.copyWith(
                    fontStyle: FontStyle.italic,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xl),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (testimonial.authorAvatarUrl != null) ...[
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage(testimonial.authorAvatarUrl!),
                      ),
                      const SizedBox(width: AppSpacing.md),
                    ],
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            testimonial.authorName,
                            style: AppTypography.titleMedium,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (testimonial.authorTitle != null)
                            Text(
                              testimonial.authorTitle!,
                              style: AppTypography.bodySmall.copyWith(
                                color: const Color(0xFF7C5CFF),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
