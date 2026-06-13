import re
import sys

def main():
    log_file = sys.argv[1]
    
    # parse log file
    with open(log_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    fixes = {}
    for line in lines:
        match = re.search(r'error - (.*?\.dart):(\d+):(\d+) - Invalid constant value', line)
        if match:
            file_path = match.group(1)
            line_num = int(match.group(2))
            fixes.setdefault(file_path, set()).add(line_num)
            
    for file_path, lines_to_fix in fixes.items():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
            
        for line_num in lines_to_fix:
            idx = line_num - 1
            if 0 <= idx < len(content):
                content[idx] = content[idx].replace('const ', '')
                # Also try replacing preceding line if it was split
                if idx - 1 >= 0 and 'const' in content[idx-1]:
                    content[idx-1] = content[idx-1].replace('const ', '')
                if idx - 2 >= 0 and 'const' in content[idx-2]:
                    content[idx-2] = content[idx-2].replace('const ', '')
                    
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
            
    print(f"Fixed {len(fixes)} files for invalid consts.")

if __name__ == '__main__':
    main()
