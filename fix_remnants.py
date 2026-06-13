import os
import re

def fix_all():
    log_file = r"C:\Users\navee\.gemini\antigravity\brain\cf91531d-9fe0-49d4-b940-bb261e8be0a3\errors.log"
    # Actually I will just process all files because I know exactly what needs fixing.

    for root, dirs, files in os.walk('lib'):
        for file in files:
            if not file.endswith('.dart'): continue
            file_path = os.path.join(root, file)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix the Light bug
            content = content.replace('const Color(0xFF2A2B2E)Light', 'context.colors.borderLight')
            
            # Form field step
            if 'form_fields_step.dart' in file_path:
                content = content.replace("_buildPrebuiltBtn(context, 'Name', Icons.person, 'firstName',", "_buildPrebuiltBtn(context, 'Name', Icons.person, FormFieldType.text, 'firstName',")
                content = content.replace("_buildPrebuiltBtn('Name', Icons.person, 'firstName',", "_buildPrebuiltBtn(context, 'Name', Icons.person, FormFieldType.text, 'firstName',")
            
            # _buildSectionHeader
            content = re.sub(r'_buildSectionHeader\((?!context)', r'_buildSectionHeader(context, ', content)
            
            # _buildDivider
            content = re.sub(r'_buildDivider\(\)', r'_buildDivider(context)', content)
            
            # _buildHeader
            content = re.sub(r'_buildHeader\((?!context)', r'_buildHeader(context, ', content)
            
            # _buildAiReason
            content = re.sub(r'_buildAiReason\(\)', r'_buildAiReason(context)', content)
            
            # _buildGridCard
            content = re.sub(r'_buildGridCard\(\)', r'_buildGridCard(context)', content)
            
            # _buildSingleCard
            content = re.sub(r'_buildSingleCard\(\)', r'_buildSingleCard(context)', content)
            
            # _divider
            content = re.sub(r'_divider\(\)', r'_divider(context)', content)
            
            # _buildKpiCard
            content = re.sub(r'_buildKpiCard\((?!context)', r'_buildKpiCard(context, ', content)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

    # Specific file lines invalid const
    invalid_consts = {
        'lib/features/explore/widgets/search_results_grid.dart': [91],
        'lib/features/explore/widgets/search_suggestions.dart': [157, 179, 272],
        'lib/features/explore/widgets/suggested_carousel.dart': [165],
        'lib/features/explore/widgets/trending_grid.dart': [113],
        'lib/features/messaging/widgets/chat_header.dart': [86],
        'lib/features/messaging/widgets/chat_list_card.dart': [113],
        'lib/features/notifications/widgets/notification_states.dart': [193, 194],
        'lib/features/splash/splash_screen.dart': [27],
        'lib/features/user_profile/widgets/vault/collection_card.dart': [117],
        'lib/features/user_profile/widgets/vault/save_item_card.dart': [169],
    }

    for path, lines in invalid_consts.items():
        full_path = os.path.join(r"C:\Users\navee\Desktop\Naveen\WebDev\Projects\Lyket\lyket-android", path)
        if not os.path.exists(full_path): continue
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        for ln in lines:
            if ln - 1 < len(content):
                content[ln-1] = content[ln-1].replace('const ', '')
                # also check previous line for const [
                if ln - 2 >= 0 and 'const [' in content[ln-2]:
                    content[ln-2] = content[ln-2].replace('const [', '[')
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
            
    # Also search suggestions missing context
    ss_path = r"C:\Users\navee\Desktop\Naveen\WebDev\Projects\Lyket\lyket-android\lib\features\explore\widgets\search_suggestions.dart"
    if os.path.exists(ss_path):
        with open(ss_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for idx, line in enumerate(lines):
                if 'Undefined name \'context\'' in line or 'context.' in line:
                    # just blindly fix line 222
                    pass
        # I'll just rely on dart analyze to see what's left

if __name__ == '__main__':
    fix_all()
