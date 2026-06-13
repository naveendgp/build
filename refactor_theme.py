import os
import re

lib_dir = "C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/lib"

replacements = {
    r'AppColors\.background': 'context.colors.background',
    r'AppColors\.surface': 'context.colors.surface',
    r'AppColors\.card': 'context.colors.card',
    r'AppColors\.border\b': 'context.colors.border',
    r'AppColors\.borderLight': 'context.colors.borderLight',
    r'AppColors\.textPrimary': 'context.colors.textPrimary',
    r'AppColors\.textSecondary': 'context.colors.textSecondary',
    r'AppColors\.textTertiary': 'context.colors.textTertiary',
    r'AppColors\.textDisabled': 'context.colors.textDisabled',
    r'AppColors\.primary\b': 'context.colors.primaryAccent',
    r'AppColors\.primaryMuted': 'context.colors.primaryAccent.withOpacity(0.2)',
    r'AppColors\.secondary\b': 'context.colors.secondaryAccent',
    r'AppColors\.success': 'context.colors.success',
    r'AppColors\.warning': 'context.colors.warning',
    r'AppColors\.error': 'context.colors.error',
    r'AppColors\.cinematicGradient': 'context.colors.cinematicGradient',
    r'AppColors\.brandAccent': 'context.colors.primaryAccent',
    r'AppColors\.brandAccentMuted': 'context.colors.primaryAccent.withOpacity(0.2)',
    r'AppColors\.overlay': 'Colors.black54',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Replace imports
    content = re.sub(r"import '([^']*)app_colors\.dart';", r"import '\1app_theme.dart';", content)
    
    # Replace color usages
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, _, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart') and not file.endswith('app_colors.dart') and not file.endswith('theme_tokens.dart') and not file.endswith('app_theme.dart') and not file.endswith('theme_extensions.dart'):
            process_file(os.path.join(root, file))

print("Done")
