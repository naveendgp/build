import re
import sys

def main():
    log_file = r"C:\Users\navee\.gemini\antigravity\brain\cf91531d-9fe0-49d4-b940-bb261e8be0a3\errors.log"
    with open(log_file, 'r', encoding='utf-16') as f:
        lines = f.readlines()
        
    for line in lines:
        # Invalid constant value
        match_const = re.search(r'error - (.*?\.dart):(\d+):(\d+) - Invalid constant value', line)
        if match_const:
            file_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{match_const.group(1).replace(chr(92), '/')}"
            line_num = int(match_const.group(2))
            strip_const(file_path, line_num)
            
        # Methods can't be invoked in constant expressions
        match_const2 = re.search(r'error - (.*?\.dart):(\d+):(\d+) - Methods can\'t be invoked in constant expressions', line)
        if match_const2:
            file_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{match_const2.group(1).replace(chr(92), '/')}"
            line_num = int(match_const2.group(2))
            strip_const(file_path, line_num)

        # Undefined name 'AppColors'
        match_appcolors = re.search(r'error - (.*?\.dart):(\d+):(\d+) - Undefined name \'AppColors\'', line)
        if match_appcolors:
            file_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{match_appcolors.group(1).replace(chr(92), '/')}"
            line_num = int(match_appcolors.group(2))
            replace_appcolors(file_path, line_num)
            
        # argument_type_not_assignable or not_enough_positional_arguments
        match_call = re.search(r'error - (.*?\.dart):(\d+):(\d+) - .*argument', line)
        if match_call:
            file_path = f"C:/Users/navee/Desktop/Naveen/WebDev/Projects/Lyket/lyket-android/{match_call.group(1).replace(chr(92), '/')}"
            line_num = int(match_call.group(2))
            inject_context(file_path, line_num)

def strip_const(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        content[idx] = content[idx].replace('const ', '')
        if idx - 1 >= 0 and 'const' in content[idx-1]: content[idx-1] = content[idx-1].replace('const ', '')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except: pass

def replace_appcolors(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        content[idx] = content[idx].replace('AppColors.', 'context.colors.')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except: pass

def inject_context(file_path, line_num):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.readlines()
        idx = line_num - 1
        # Example: _buildFunnelStage(label, val, max, col) -> _buildFunnelStage(context, label, val, max, col)
        # We can just look for the method call and insert context.
        # But wait, it's safer to just do a naive replace for the known files.
        line_str = content[idx]
        
        if '_buildFunnelStage(' in line_str and '_buildFunnelStage(context' not in line_str:
            content[idx] = line_str.replace('_buildFunnelStage(', '_buildFunnelStage(context, ')
        if '_buildKpiCard(' in line_str and '_buildKpiCard(context' not in line_str:
            content[idx] = line_str.replace('_buildKpiCard(', '_buildKpiCard(context, ')
        if '_buildQualityScore(' in line_str and '_buildQualityScore(context' not in line_str:
            content[idx] = line_str.replace('_buildQualityScore(', '_buildQualityScore(context, ')
        if '_buildPreviewField(' in line_str and '_buildPreviewField(context' not in line_str:
            content[idx] = line_str.replace('_buildPreviewField(', '_buildPreviewField(context, ')
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(content)
    except: pass

if __name__ == '__main__':
    main()
