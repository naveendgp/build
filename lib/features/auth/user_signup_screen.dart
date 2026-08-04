import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/lyket_button.dart';
import '../../core/widgets/lyket_text_field.dart';
import '../../core/widgets/lyket_progress.dart';
import '../../core/utils/validators.dart';
import 'providers/signup_provider.dart';
import 'widgets/password_strength_bar.dart';
import 'widgets/interest_selector.dart';
import 'widgets/social_auth_button.dart';
import 'providers/auth_provider.dart';
import '../../core/widgets/location_picker.dart';

class UserSignupScreen extends ConsumerStatefulWidget {
  const UserSignupScreen({super.key});
  @override
  ConsumerState<UserSignupScreen> createState() => _UserSignupScreenState();
}

class _UserSignupScreenState extends ConsumerState<UserSignupScreen> {
  final _pageCtrl = PageController();
  final _formKeys = [GlobalKey<FormState>(), GlobalKey<FormState>(), GlobalKey<FormState>()];
  final _fullNameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _contactCtrl = TextEditingController(text: '+91 ');
  final _locationCtrl = TextEditingController();
  final _genderCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();

  @override
  void dispose() {
    _pageCtrl.dispose();
    _fullNameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _contactCtrl.dispose();
    _locationCtrl.dispose();
    _genderCtrl.dispose();
    _dobCtrl.dispose();
    super.dispose();
  }

  void _goToStep(int step) {
    _pageCtrl.animateToPage(step,
      duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
    ref.read(userSignupProvider.notifier).setStep(step);
  }

  void _nextStep() {
    final state = ref.read(userSignupProvider);
    final step = state.currentStep;
    if (_formKeys[step].currentState?.validate() ?? false) {
      if (step < 2) _goToStep(step + 1);
    }
  }

  Future<void> _submit() async {
    final notifier = ref.read(userSignupProvider.notifier);
    final success = await notifier.submitUserSignup();
    if (success && mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(userSignupProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    ref.listen<SignupState>(userSignupProvider, (prev, next) {
      if (prev?.errorMessage != next.errorMessage && next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: context.colors.error,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () {
            if (state.currentStep > 0) {
              _goToStep(state.currentStep - 1);
            } else {
              context.pop();
            }
          },
        ),
        title: Text('Create Account', style: AppTypography.titleSmall.copyWith(color: context.colors.textPrimary)),
      ),
      body: Column(
        children: [
          const SizedBox(height: AppSpacing.md),
          LyketProgress(totalSteps: 3, currentStep: state.currentStep),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1(),
                _buildStep2(),
                _buildStep3(),
              ],
            ),
          ),
          // Bottom CTA
          Padding(
            padding: EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md,
                AppSpacing.lg, bottomPad + AppSpacing.lg),
            child: Column(
              children: [
                LyketButton(
                  label: state.currentStep == 2 ? 'Create Account' : 'Next',
                  isLoading: state.isLoading,
                  onPressed: state.isLoading
                      ? null
                      : state.currentStep == 2
                          ? () {
                              if (state.interests.length >= 3) {
                                _submit();
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text('Please select at least 3 interests'),
                                    backgroundColor: context.colors.error,
                                  ),
                                );
                              }
                            }
                          : _nextStep,
                ),
              const SizedBox(height: AppSpacing.xl),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account? ', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: Text('Login', style: AppTypography.labelLarge.copyWith(
                        color: context.colors.primaryAccent)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[0],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Personal Details', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Tell us about yourself', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            LyketTextField(
              label: 'Full Name',
              controller: _fullNameCtrl,
              validator: (v) => Validators.required(v, 'Full name'),
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('fullName', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Username',
              controller: _usernameCtrl,
              validator: Validators.username,
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('username', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Email',
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              validator: Validators.email,
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('email', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Phone Number',
              controller: _contactCtrl,
              keyboardType: TextInputType.phone,
              hint: '+91 98765 43210',
              validator: Validators.indianPhone,
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('contactNumber', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Location',
              controller: _locationCtrl,
              readOnly: true,
              hint: 'City, State',
              validator: (v) => Validators.required(v, 'Location'),
              onTap: () async {
                final loc = await showLocationPicker(context);
                if (loc != null) {
                  _locationCtrl.text = loc;
                  ref.read(userSignupProvider.notifier).updateField('location', loc);
                }
              },
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: LyketTextField(
                    label: 'Gender',
                    controller: _genderCtrl,
                    readOnly: true,
                    validator: (v) => Validators.required(v, 'Gender'),
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: const Color(0xFF1B1D22),
                        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                        builder: (ctx) => SafeArea(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: ['Male', 'Female', 'Others', 'Prefers not to say'].map((g) => ListTile(
                              title: Text(g, style: const TextStyle(color: Colors.white)),
                              onTap: () {
                                _genderCtrl.text = g;
                                ref.read(userSignupProvider.notifier).updateField('gender', g);
                                Navigator.pop(ctx);
                              },
                            )).toList(),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: LyketTextField(
                    label: 'Date of Birth',
                    controller: _dobCtrl,
                    readOnly: true,
                    validator: (v) => Validators.required(v, 'Date of birth'),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
                        firstDate: DateTime(1900),
                        lastDate: DateTime.now(),
                        builder: (context, child) {
                          return Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: ColorScheme.dark(
                                primary: context.colors.primaryAccent,
                                onPrimary: Colors.white,
                                surface: const Color(0xFF1B1D22),
                                onSurface: Colors.white,
                              ),
                            ),
                            child: child!,
                          );
                        },
                      );
                      if (date != null) {
                        final formatted = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
                        _dobCtrl.text = formatted;
                        ref.read(userSignupProvider.notifier).updateField('dateOfBirth', formatted);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            Row(children: [
              Expanded(child: Container(height: 1, color: context.colors.border)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Text('or', style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary)),
              ),
              Expanded(child: Container(height: 1, color: context.colors.border)),
            ]),
            const SizedBox(height: AppSpacing.xl),
            SocialAuthButton.google(
              onPressed: () async {
                final success = await ref.read(authProvider.notifier).continueWithGoogle();
                if (success && mounted) {
                  context.go('/home');
                }
              },
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[1],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Secure Your Account', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Create a strong password', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            LyketPasswordField(
              label: 'Password',
              controller: _passwordCtrl,
              validator: Validators.password,
              textInputAction: TextInputAction.next,
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('password', v),
            ),
            PasswordStrengthBar(password: _passwordCtrl.text),
            const SizedBox(height: AppSpacing.md),
            LyketPasswordField(
              label: 'Confirm Password',
              controller: _confirmCtrl,
              validator: (v) => Validators.confirmPassword(v, _passwordCtrl.text),
              onChanged: (v) => ref.read(userSignupProvider.notifier).updateField('confirmPassword', v),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3() {
    final state = ref.watch(userSignupProvider);
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[2],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your Interests', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Select at least 3 interests to personalize your feed',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.sm),
            Text('${state.interests.length} selected',
              style: AppTypography.labelSmall.copyWith(
                color: state.interests.length >= 3 ? context.colors.success : context.colors.textTertiary)),
            const SizedBox(height: AppSpacing.xl),
            InterestSelector(
              selectedInterests: state.interests,
              onToggle: (i) => ref.read(userSignupProvider.notifier).toggleInterest(i),
            ),
          ],
        ),
      ),
    );
  }
}
