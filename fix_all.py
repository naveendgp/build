import re
import os

def fix_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix undefined getters
        content = content.replace('context.colors.primaryGradient', 'context.colors.cinematicGradient')
        content = content.replace('context.colors.shimmerBase', 'Colors.black.withValues(alpha: 0.1)')

        # Fix invalid constants (naive approach, removing const from lines with colors/themes)
        # For a more robust approach, we just remove const if the line has `context.` or `Theme.`
        lines = content.split('\n')
        for i in range(len(lines)):
            if 'context.colors' in lines[i] or 'ThemeTokens' in lines[i] or 'context.shadows' in lines[i]:
                lines[i] = lines[i].replace('const ', '')
        content = '\n'.join(lines)

        # Fix specific function signatures missing context
        content = re.sub(r'Widget _buildKpiCard\(\s*String', 'Widget _buildKpiCard(BuildContext context, String', content)
        content = re.sub(r'Widget _buildPreviewField\(\s*FormFieldDefinition', 'Widget _buildPreviewField(BuildContext context, FormFieldDefinition', content)

        # Fix specific function calls missing context
        content = re.sub(r'_buildKpiCard\(\s*\'', '_buildKpiCard(context, \'', content)
        content = re.sub(r'_buildPreviewField\(\s*field', '_buildPreviewField(context, field', content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

# Apply to all files in lib/
for root, dirs, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            fix_file(os.path.join(root, file))

print("Fix script completed.")
