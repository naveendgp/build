import re

def main():
    with open('errors2.log', 'r', encoding='utf-16') as f:
        lines = f.readlines()
        
    for line in lines:
        if 'error -' not in line: continue
        match = re.search(r'error - (.*?\.dart):(\d+):(\d+) - (.*)', line)
        if not match: continue
        
        file_path = match.group(1).replace('\\', '/')
        line_num = int(match.group(2))
        err_msg = match.group(4)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.readlines()
        except: continue
        
        idx = line_num - 1
        original_line = content[idx]
        
        if 'Duplicated parameter name \'context\'' in err_msg:
            content[idx] = re.sub(r'context,\s*BuildContext context', 'BuildContext context', content[idx])
            content[idx] = re.sub(r'BuildContext context,\s*BuildContext context', 'BuildContext context', content[idx])
            content[idx] = content[idx].replace('Widget _buildHeader(BuildContext context)', 'Widget _buildHeader(BuildContext context, WidgetRef ref)') # just in case for feed_card
            
        elif 'Too few positional arguments:' in err_msg:
            # We need to add `context` as the first argument in the call.
            # E.g. _buildHeader(state, notifier) -> _buildHeader(context, state, notifier)
            content[idx] = re.sub(r'(_build[a-zA-Z0-9_]*)\(', r'\1(context, ', content[idx])
            content[idx] = content[idx].replace('(context, )', '(context)')
            
        elif 'Not a constant expression.' in err_msg or 'Invalid constant value.' in err_msg or 'Methods can\'t be invoked in constant' in err_msg:
            content[idx] = content[idx].replace('const ', '')
            if idx - 1 >= 0 and 'const [' in content[idx-1]:
                content[idx-1] = content[idx-1].replace('const [', '[')
            if idx - 2 >= 0 and 'const [' in content[idx-2]:
                content[idx-2] = content[idx-2].replace('const [', '[')
                
        elif 'The getter \'cinematicGradientVertical\' isn\'t defined' in err_msg:
            content[idx] = content[idx].replace('cinematicGradientVertical', 'cinematicGradient')
            
        elif 'Undefined name \'context\'' in err_msg:
            content[idx] = content[idx].replace('context.colors.textPrimary', 'const Color(0xFFFAFAFB)')
            content[idx] = content[idx].replace('context.colors.textTertiary', 'const Color(0xFF52525B)')
            content[idx] = content[idx].replace('context.colors.background', 'const Color(0xFF131418)')
            content[idx] = content[idx].replace('context.colors', 'const Color(0xFF131418)')
            
        elif 'The argument type \'String\' can\'t be assigned to the parameter type \'BuildContext\'' in err_msg:
            # e.g. _buildPrebuiltBtn('Gender', ... -> _buildPrebuiltBtn(context, 'Gender', ...
            if 'form_fields_step.dart' in file_path:
                content[idx] = content[idx].replace('_buildPrebuiltBtn(', '_buildPrebuiltBtn(context, ')
            elif 'lead_detail_screen.dart' in file_path:
                content[idx] = content[idx].replace('_buildSectionHeader(', '_buildSectionHeader(context, ')
            
        elif 'The argument type \'IconData\' can\'t be assigned to the parameter type \'String\'' in err_msg:
            pass # handled above
            
        if original_line != content[idx]:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(content)
                
    # manual cleanup for form_fields_step.dart since it's tricky
    try:
        with open('lib/features/create_post/widgets/lead_form/form_fields_step.dart', 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace('_buildPrebuiltBtn(\'Name\', Icons.person, FormFieldType.text, \'firstName\'),', '_buildPrebuiltBtn(context, \'Name\', Icons.person, FormFieldType.text, \'firstName\'),')
        c = c.replace('_buildPrebuiltBtn(\'Email\', Icons.email_rounded, FormFieldType.email, \'Email Address\'),', '_buildPrebuiltBtn(context, \'Email\', Icons.email_rounded, FormFieldType.email, \'Email Address\'),')
        c = c.replace('_buildPrebuiltBtn(\'Phone\', Icons.phone_rounded, FormFieldType.phone, \'Phone Number\'),', '_buildPrebuiltBtn(context, \'Phone\', Icons.phone_rounded, FormFieldType.phone, \'Phone Number\'),')
        c = c.replace('_buildPrebuiltBtn(\'Gender\', Icons.wc_rounded, FormFieldType.singleChoice, \'What is your gender?\', [\'Male\', \'Female\', \'Other\', \'Prefer not to say\']),', '_buildPrebuiltBtn(context, \'Gender\', Icons.wc_rounded, FormFieldType.singleChoice, \'What is your gender?\', [\'Male\', \'Female\', \'Other\', \'Prefer not to say\']),')
        c = c.replace('_buildPrebuiltBtn(\'Job Title\', Icons.work_rounded, FormFieldType.shortText, \'What is your job title?\'),', '_buildPrebuiltBtn(context, \'Job Title\', Icons.work_rounded, FormFieldType.shortText, \'What is your job title?\'),')
        c = c.replace('_buildPrebuiltBtn(\'Company\', Icons.business_rounded, FormFieldType.shortText, \'Company Name\'),', '_buildPrebuiltBtn(context, \'Company\', Icons.business_rounded, FormFieldType.shortText, \'Company Name\'),')
        
        c = c.replace('Widget _buildPrebuiltBtn(String title, IconData icon, FormFieldType type, String id, [List<String>? options]) {', 'Widget _buildPrebuiltBtn(BuildContext context, String title, IconData icon, FormFieldType type, String id, [List<String>? options]) {')
        
        with open('lib/features/create_post/widgets/lead_form/form_fields_step.dart', 'w', encoding='utf-8') as f:
            f.write(c)
    except: pass

if __name__ == '__main__':
    main()
