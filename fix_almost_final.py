import os

def fix_all():
    fixes = {
        'lib/features/brand_profile/widgets/brand_quicksite_tab.dart': [
            # I will just revert any 'context, BuildContext context' to 'BuildContext context'
        ],
        'lib/features/brand_profile/widgets/brand_reviews_tab.dart': [],
        'lib/features/brand_profile/widgets/brand_testimonials_tab.dart': []
    }

    # For duplicate parameter names:
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if not file.endswith('.dart'): continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                c = f.read()
            changed = False
            
            # fix duplicate parameters
            if 'context, BuildContext context' in c:
                c = c.replace('context, BuildContext context', 'BuildContext context')
                changed = True

            # fix _buildContactRow(context, context, ...)
            if '_buildContactRow(context, context,' in c:
                c = c.replace('_buildContactRow(context, context,', '_buildContactRow(context,')
                changed = True
            if '_buildServiceCard(context, context,' in c:
                c = c.replace('_buildServiceCard(context, context,', '_buildServiceCard(context,')
                changed = True
            if '_buildSectionTitle(context, context,' in c:
                c = c.replace('_buildSectionTitle(context, context,', '_buildSectionTitle(context,')
                changed = True
            if '_buildRatingSummary(context, context,' in c:
                c = c.replace('_buildRatingSummary(context, context,', '_buildRatingSummary(context,')
                changed = True
            if '_buildReviewCard(context, context,' in c:
                c = c.replace('_buildReviewCard(context, context,', '_buildReviewCard(context,')
                changed = True
            if '_buildTestimonialCard(context, context,' in c:
                c = c.replace('_buildTestimonialCard(context, context,', '_buildTestimonialCard(context,')
                changed = True
                
            # form_fields_step.dart
            if 'form_fields_step.dart' in path:
                c = c.replace("_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText, 'id'),", "_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText),")
                c = c.replace("_buildTypeBtn(context, 'Paragraph', Icons.notes_rounded, FormFieldType.longText, 'id'),", "_buildTypeBtn(context, 'Paragraph', Icons.notes_rounded, FormFieldType.longText),")
                c = c.replace("_buildTypeBtn(context, 'Single Choice', Icons.radio_button_checked_rounded, FormFieldType.singleChoice, 'id'),", "_buildTypeBtn(context, 'Single Choice', Icons.radio_button_checked_rounded, FormFieldType.singleChoice),")
                c = c.replace("_buildTypeBtn(context, 'Multiple Choice', Icons.check_box_rounded, FormFieldType.multipleChoice, 'id'),", "_buildTypeBtn(context, 'Multiple Choice', Icons.check_box_rounded, FormFieldType.multipleChoice),")
                c = c.replace("_buildTypeBtn(context, 'Dropdown', Icons.arrow_drop_down_circle_rounded, FormFieldType.dropDown, 'id'),", "_buildTypeBtn(context, 'Dropdown', Icons.arrow_drop_down_circle_rounded, FormFieldType.dropDown),")
                
            if '_buildSectionHeader(title' in c:
                c = c.replace('_buildSectionHeader(title', '_buildSectionHeader(context, title')

            if 'Widget _buildHeader(context, WidgetRef ref' in c:
                c = c.replace('Widget _buildHeader(context, WidgetRef ref', 'Widget _buildHeader(BuildContext context, WidgetRef ref')

            if changed:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(c)

    invalid_consts = {
        'lib/features/comments/widgets/comment_sheet.dart': [242, 364],
        'lib/features/explore/widgets/search_results_grid.dart': [91],
        'lib/features/explore/widgets/search_suggestions.dart': [157, 179, 272],
        'lib/features/explore/widgets/suggested_carousel.dart': [165],
        'lib/features/explore/widgets/trending_grid.dart': [113],
        'lib/features/messaging/widgets/chat_header.dart': [86],
        'lib/features/messaging/widgets/chat_list_card.dart': [113],
        'lib/features/splash/splash_screen.dart': [27],
        'lib/features/user_profile/widgets/vault/collection_card.dart': [117],
        'lib/features/user_profile/widgets/vault/save_item_card.dart': [169],
    }

    for p, lines in invalid_consts.items():
        fp = os.path.join(r"C:\Users\navee\Desktop\Naveen\WebDev\Projects\Lyket\lyket-android", p)
        if not os.path.exists(fp): continue
        with open(fp, 'r', encoding='utf-8') as f:
            lines_content = f.readlines()
        for ln in lines:
            if ln - 1 < len(lines_content):
                lines_content[ln-1] = lines_content[ln-1].replace('const ', '')
                if ln - 2 >= 0 and 'const [' in lines_content[ln-2]:
                    lines_content[ln-2] = lines_content[ln-2].replace('const [', '[')
        with open(fp, 'w', encoding='utf-8') as f:
            f.writelines(lines_content)

if __name__ == '__main__':
    fix_all()
