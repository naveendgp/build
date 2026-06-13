import os
import re

def fix_errors():
    errors_file = r"C:\Users\navee\.gemini\antigravity\brain\cf91531d-9fe0-49d4-b940-bb261e8be0a3\errors.log"
    # To fix 'The name 'context' is already defined'
    # we just look for `BuildContext context, BuildContext context` or similar
    
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if not file.endswith('.dart'): continue
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            changed = False
            
            # 1. Duplicate context parameter
            if 'BuildContext context, BuildContext context' in content:
                content = content.replace('BuildContext context, BuildContext context', 'BuildContext context')
                changed = True

            # 2. Duplicate context argument
            if 'context, context,' in content:
                content = content.replace('context, context,', 'context,')
                changed = True
                
            # 3. Fix missing context in _buildPrebuiltBtn call
            if 'form_fields_step.dart' in file_path:
                content = content.replace('_buildPrebuiltBtn(\'Name\', Icons.person, FormFieldType.text, \'firstName\',', '_buildPrebuiltBtn(context, \'Name\', Icons.person, FormFieldType.text, \'firstName\',')

            # 4. feed_card.dart _buildHeader missing context
            if 'feed_card.dart' in file_path:
                content = content.replace('_buildHeader(ref,', '_buildHeader(context, ref,')
                content = content.replace('_buildHeader(BuildContext context, WidgetRef ref,', '_buildHeader(BuildContext context, WidgetRef ref, Post post')
                # wait let's just make it simpler
            
            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == '__main__':
    fix_errors()
