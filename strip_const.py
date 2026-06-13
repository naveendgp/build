import os
import re

def main():
    invalid_consts_files = [
        'lib/features/comments/widgets/comment_sheet.dart',
        'lib/features/explore/widgets/search_results_grid.dart',
        'lib/features/explore/widgets/search_suggestions.dart',
        'lib/features/explore/widgets/suggested_carousel.dart',
        'lib/features/explore/widgets/trending_grid.dart',
        'lib/features/messaging/widgets/chat_header.dart',
        'lib/features/messaging/widgets/chat_list_card.dart',
        'lib/features/splash/splash_screen.dart',
        'lib/features/user_profile/widgets/vault/collection_card.dart',
        'lib/features/user_profile/widgets/vault/save_item_card.dart'
    ]

    for p in invalid_consts_files:
        fp = os.path.join(r"C:\Users\navee\Desktop\Naveen\WebDev\Projects\Lyket\lyket-android", p)
        if not os.path.exists(fp): continue
        with open(fp, 'r', encoding='utf-8') as f:
            c = f.read()
        
        # We will aggressively remove `const ` everywhere except `const Color(` and `const SizedBox` and `const EdgeInsets`
        # Actually it's easier to remove `const ` completely from these files to quickly fix compilation.
        c = re.sub(r'\bconst\s+', '', c)
        
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(c)

if __name__ == '__main__':
    main()
