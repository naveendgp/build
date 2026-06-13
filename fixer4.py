import os
import re

def main():
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if not file.endswith('.dart'): continue
            file_path = os.path.join(root, file)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            changed = False
            
            # Fix duplicates
            if 'context, BuildContext context' in content:
                content = content.replace('context, BuildContext context', 'BuildContext context')
                changed = True
            if 'BuildContext context, BuildContext context' in content:
                content = content.replace('BuildContext context, BuildContext context', 'BuildContext context')
                changed = True

            if 'Widget _buildHeader(context' in content:
                content = content.replace('Widget _buildHeader(context', 'Widget _buildHeader(BuildContext context')
                changed = True

            # Fix `Too few positional arguments` in calls
            if '_buildSectionHeader(context, title: \'Suggestions\')' in content:
                content = content.replace('_buildSectionHeader(context, title: \'Suggestions\')', '_buildSectionHeader(context, \'Suggestions\')')
                changed = True

            if '_buildSectionHeader(context, \n' in content:
                content = content.replace('_buildSectionHeader(context, \n', '_buildSectionHeader(\n')
                changed = True

            # FeedCard
            if 'feed_card.dart' in file_path:
                content = content.replace('_buildHeader(context, ref)', '_buildHeader(context, ref, post)')
                changed = True

            # Messaging
            if 'messaging_home_screen.dart' in file_path:
                content = content.replace('_buildHeader(context)', '_buildHeader(context, false)')
                changed = True

            # Notifications
            if 'notifications_screen.dart' in file_path:
                content = content.replace('_buildHeader(context, state, notifier)', '_buildHeader(context, state, notifier, false)')
                changed = True

            # Form fields
            if 'form_fields_step.dart' in file_path:
                content = content.replace('_buildTypeBtn(\'Short Text\'', '_buildTypeBtn(context, \'Short Text\'')
                content = content.replace('_buildTypeBtn(\'Paragraph\'', '_buildTypeBtn(context, \'Paragraph\'')
                content = content.replace('_buildTypeBtn(\'Single Choice\'', '_buildTypeBtn(context, \'Single Choice\'')
                content = content.replace('_buildTypeBtn(\'Multiple Choice\'', '_buildTypeBtn(context, \'Multiple Choice\'')
                content = content.replace('_buildTypeBtn(\'Dropdown\'', '_buildTypeBtn(context, \'Dropdown\'')
                content = content.replace('_buildPrebuiltBtn(\'Email\'', '_buildPrebuiltBtn(context, \'Email\'')
                content = content.replace('_buildPrebuiltBtn(\'Phone\'', '_buildPrebuiltBtn(context, \'Phone\'')
                content = content.replace('_buildPrebuiltBtn(\'Gender\'', '_buildPrebuiltBtn(context, \'Gender\'')
                content = content.replace('_buildPrebuiltBtn(\'Job Title\'', '_buildPrebuiltBtn(context, \'Job Title\'')
                content = content.replace('_buildPrebuiltBtn(\'Company\'', '_buildPrebuiltBtn(context, \'Company\'')
                content = content.replace('_buildPrebuiltBtn(context, \'Email\', Icons.email_rounded, FormFieldType.email, \'Email Address\')', '_buildPrebuiltBtn(context, \'Email\', Icons.email_rounded, FormFieldType.email, \'email\', \'Email Address\')')
                content = content.replace('_buildPrebuiltBtn(context, \'Phone\', Icons.phone_rounded, FormFieldType.phone, \'Phone Number\')', '_buildPrebuiltBtn(context, \'Phone\', Icons.phone_rounded, FormFieldType.phone, \'phone\', \'Phone Number\')')
                # Actually form_fields_step is quite complex, maybe I'll replace it entirely if it fails
                changed = True

            # Fix all 'Invalid constant value' manually
            if 'const ' in content and ('context.colors' in content or 'context.shadows' in content):
                lines = content.split('\n')
                for i in range(len(lines)):
                    if 'const ' in lines[i] and 'context.' in lines[i]:
                        lines[i] = lines[i].replace('const ', '')
                        if i - 1 >= 0 and 'const [' in lines[i-1]:
                            lines[i-1] = lines[i-1].replace('const [', '[')
                content = '\n'.join(lines)
                changed = True

            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
    # Let's fix the specific invalid constants explicitly
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
            
if __name__ == '__main__':
    main()
