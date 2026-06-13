import re
import os

def fix_errors():
    # 1. form_fields_step.dart
    f = 'lib/features/create_post/widgets/lead_form/form_fields_step.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        # The argument type 'String' can't be assigned to the parameter type 'List<String>'
        c = c.replace("_buildPrebuiltBtn(context, 'Email', Icons.email_rounded, FormFieldType.email, 'email', 'Email Address'),", "_buildPrebuiltBtn(context, 'Email', Icons.email_rounded, FormFieldType.email, 'email'),")
        c = c.replace("_buildPrebuiltBtn(context, 'Phone', Icons.phone_rounded, FormFieldType.phone, 'phone', 'Phone Number'),", "_buildPrebuiltBtn(context, 'Phone', Icons.phone_rounded, FormFieldType.phone, 'phone'),")
        # _buildTypeBtn expecting 4 arguments, got 3 -> wait, `_buildTypeBtn('Short Text', Icons.short_text_rounded, FormFieldType.shortText)`
        c = c.replace("_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText),", "_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText, 'id'),")
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 2. search_suggestions.dart
    f = 'lib/features/explore/widgets/search_suggestions.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace('_buildSectionHeader(context, \n', '_buildSectionHeader(context, title: \'Suggestions\'),\n')
        c = c.replace('_buildSectionHeader(context, \'Suggestions\')', '_buildSectionHeader(context, title: \'Suggestions\')')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 3. feed_card.dart
    f = 'lib/features/home/widgets/feed_card.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace('_buildHeader(context, ref, post),', '_buildHeader(context, ref),')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 4. lead_detail_screen.dart
    f = 'lib/features/lead_management/screens/lead_detail_screen.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace('_buildSectionHeader(context, context,', '_buildSectionHeader(context,')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 5. messaging_home_screen.dart
    f = 'lib/features/messaging/screens/messaging_home_screen.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace('_buildHeader(context, false)', '_buildHeader(context)')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 6. notifications_screen.dart
    f = 'lib/features/notifications/screens/notifications_screen.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace('_buildHeader(context, state, notifier, false)', '_buildHeader(context, state, notifier)')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 7. brand_quicksite_tab.dart
    f = 'lib/features/brand_profile/widgets/brand_quicksite_tab.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = re.sub(r'_buildSectionTitle\((?!context)', r'_buildSectionTitle(context, ', c)
        c = re.sub(r'_buildServiceCard\((?!context)', r'_buildServiceCard(context, ', c)
        c = re.sub(r'_buildContactRow\((?!context)', r'_buildContactRow(context, ', c)
        c = re.sub(r'Widget _buildSectionTitle\(String', r'Widget _buildSectionTitle(BuildContext context, String', c)
        c = re.sub(r'Widget _buildServiceCard\(ServiceItem', r'Widget _buildServiceCard(BuildContext context, ServiceItem', c)
        c = re.sub(r'Widget _buildContactRow\(IconData', r'Widget _buildContactRow(BuildContext context, IconData', c)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 8. brand_reviews_tab.dart
    f = 'lib/features/brand_profile/widgets/brand_reviews_tab.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = re.sub(r'_buildRatingSummary\((?!context)', r'_buildRatingSummary(context, ', c)
        c = re.sub(r'_buildReviewCard\((?!context)', r'_buildReviewCard(context, ', c)
        c = re.sub(r'Widget _buildRatingSummary\(double', r'Widget _buildRatingSummary(BuildContext context, double', c)
        c = re.sub(r'Widget _buildReviewCard\(BrandReview', r'Widget _buildReviewCard(BuildContext context, BrandReview', c)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # 9. brand_testimonials_tab.dart
    f = 'lib/features/brand_profile/widgets/brand_testimonials_tab.dart'
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = re.sub(r'_buildTestimonialCard\((?!context)', r'_buildTestimonialCard(context, ', c)
        c = re.sub(r'Widget _buildTestimonialCard\(BrandTestimonial', r'Widget _buildTestimonialCard(BuildContext context, BrandTestimonial', c)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

    # Invalid Constants cleanup
    import subprocess
    subprocess.run("dart fix --apply", shell=True)

if __name__ == '__main__':
    fix_errors()
