import re
import sys

def main():
    log_file = r"C:\Users\navee\.gemini\antigravity\brain\cf91531d-9fe0-49d4-b940-bb261e8be0a3\errors.log"
    with open(log_file, 'r', encoding='utf-16') as f:
        lines = f.readlines()
        
    for line in lines:
        if 'error -' not in line: continue
        
        match = re.search(r'error - (.*?\.dart):(\d+):(\d+) - (.*)', line)
        if not match: continue
        
        file_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{match.group(1).replace(chr(92), '/')}"
        line_num = int(match.group(2))
        err_msg = match.group(4)
        
        if 'Invalid constant' in err_msg or 'Methods can\'t be invoked in constant' in err_msg:
            remove_const(file_path, line_num)
        elif 'Undefined name \'context\'' in err_msg:
            add_context_to_func(file_path, line_num)
        elif 'not_enough_positional_arguments' in err_msg:
            add_context_to_call(file_path, line_num)
            
def remove_const(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        content[idx] = content[idx].replace('const ', '')
        # Check previous line for const [
        if idx - 1 >= 0 and 'const [' in content[idx-1]:
            content[idx-1] = content[idx-1].replace('const [', '[')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except Exception as e: print(e)

def add_context_to_func(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        
        # We search upwards for the nearest Widget _build... or similar method definition
        found = False
        for i in range(idx, -1, -1):
            if re.search(r'(Widget|List<Widget>|PreferredSizeWidget)\s+_[a-zA-Z0-9_]+\s*\(', content[i]):
                if 'BuildContext context' not in content[i]:
                    content[i] = re.sub(r'((?:Widget|List<Widget>|PreferredSizeWidget)\s+_[a-zA-Z0-9_]+\s*\()', r'\1BuildContext context, ', content[i])
                    content[i] = content[i].replace('BuildContext context, )', 'BuildContext context)')
                    found = True
                    break
            elif 'class' in content[i] and 'extends' in content[i]:
                break # Reached class definition
                
        if not found:
            # Maybe it's a static field or class level variable, change `context.colors...` to fallback?
            if 'context.' in content[idx]:
                content[idx] = content[idx].replace('context.colors.border', 'const Color(0xFF2A2B2E)')
                content[idx] = content[idx].replace('context.colors.card', 'const Color(0xFF1B1D22)')
                content[idx] = content[idx].replace('context.colors.textSecondary', 'const Color(0xFFA1A1AA)')
                content[idx] = content[idx].replace('context.colors.primaryAccent', 'const Color(0xFF7C5CFF)')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except Exception as e: print(e)

def add_context_to_call(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        
        # Inject context as first arg
        content[idx] = re.sub(r'(_build[a-zA-Z0-9_]*)\(', r'\1(context, ', content[idx])
        content[idx] = content[idx].replace('(context, )', '(context)')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except Exception as e: print(e)

if __name__ == '__main__':
    main()
