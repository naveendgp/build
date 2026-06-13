import os
import re

files_to_fix = [
    'lib/features/lead_management/widgets/funnel_chart.dart',
    'lib/features/lead_management/widgets/kpi_cards.dart',
    'lib/features/lead_management/widgets/leads_table_view.dart',
    'lib/features/lead_management/widgets/live_form_preview.dart'
]

def fix_file(filepath):
    full_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{filepath}"
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find functions/constructors missing context and add it where possible
    # We will just replace `context.colors` with `Theme.of(context).extension<AppThemeColors>()!` ? No, `context` is entirely missing in these methods.
    
    # In these specific files, it's usually `Widget _buildX(...)`
    # Let's add BuildContext context as the first argument to any `Widget _build` function that doesn't have it.
    
    # Add BuildContext context,
    content = re.sub(r'(Widget\s+_[a-zA-Z0-9_]+\s*\()\s*(?!(?:BuildContext))', r'\1BuildContext context, ', content)
    # If the function had no arguments, it became `(BuildContext context, )`, let's fix it
    content = content.replace('BuildContext context, )', 'BuildContext context)')
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

for f in files_to_fix:
    fix_file(f)
