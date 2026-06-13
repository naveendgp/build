import os

def main():
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

    # _buildSectionHeader
    path = 'lib/features/explore/widgets/search_suggestions.dart'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.readlines()
        for i in range(len(c)):
            if '_buildSectionHeader()' in c[i]:
                c[i] = c[i].replace('_buildSectionHeader()', '_buildSectionHeader(context)')
            if '_buildSectionHeader(\n' in c[i]:
                c[i] = c[i].replace('_buildSectionHeader(\n', '_buildSectionHeader(context, \n')
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(c)
            
    path = 'lib/features/create_post/widgets/lead_form/form_fields_step.dart'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace("_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText, 'id'),", "_buildTypeBtn(context, 'Short Text', Icons.short_text_rounded, FormFieldType.shortText),")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)

if __name__ == '__main__':
    main()
