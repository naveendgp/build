import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';

class SignupState {
  final int currentStep;
  final bool isLoading;
  final String? errorMessage;
  // User fields
  final String fullName, username, email, password, confirmPassword;
  final String contactNumber, location, gender, dateOfBirth;
  final Set<String> interests;
  // Brand fields
  final String businessName, brandUsername, brandEmail, brandPassword, brandConfirmPassword, brandGstNumber;
  final String brandContactNumber, brandLocation;
  final String? businessCategory, brandSubCategory;
  final Set<String> brandTags;
  final String? logoPath, coverPath;

  const SignupState({
    this.currentStep = 0,
    this.isLoading = false,
    this.errorMessage,
    this.fullName = '', this.username = '', this.email = '',
    this.password = '', this.confirmPassword = '',
    this.contactNumber = '', this.location = '', this.gender = '', this.dateOfBirth = '',
    this.interests = const {},
    this.businessName = '', this.brandUsername = '', this.brandGstNumber = '',
    this.brandEmail = '', this.brandPassword = '', this.brandConfirmPassword = '',
    this.brandContactNumber = '', this.brandLocation = '',
    this.businessCategory, this.brandSubCategory, this.brandTags = const {},
    this.logoPath, this.coverPath,
  });

  SignupState copyWith({
    int? currentStep, bool? isLoading, String? errorMessage,
    String? fullName, String? username, String? email,
    String? password, String? confirmPassword, Set<String>? interests,
    String? contactNumber, String? location, String? gender, String? dateOfBirth,
    String? businessName, String? brandUsername, String? brandGstNumber,
    String? brandEmail, String? brandPassword, String? brandConfirmPassword,
    String? brandContactNumber, String? brandLocation,
    String? businessCategory, String? brandSubCategory, Set<String>? brandTags,
    String? logoPath, String? coverPath,
  }) {
    return SignupState(
      currentStep: currentStep ?? this.currentStep,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      fullName: fullName ?? this.fullName,
      username: username ?? this.username,
      email: email ?? this.email,
      password: password ?? this.password,
      confirmPassword: confirmPassword ?? this.confirmPassword,
      contactNumber: contactNumber ?? this.contactNumber,
      location: location ?? this.location,
      gender: gender ?? this.gender,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      interests: interests ?? this.interests,
      businessName: businessName ?? this.businessName,
      brandUsername: brandUsername ?? this.brandUsername,
      brandGstNumber: brandGstNumber ?? this.brandGstNumber,
      brandEmail: brandEmail ?? this.brandEmail,
      brandPassword: brandPassword ?? this.brandPassword,
      brandConfirmPassword: brandConfirmPassword ?? this.brandConfirmPassword,
      brandContactNumber: brandContactNumber ?? this.brandContactNumber,
      brandLocation: brandLocation ?? this.brandLocation,
      businessCategory: businessCategory ?? this.businessCategory,
      brandSubCategory: brandSubCategory ?? this.brandSubCategory,
      brandTags: brandTags ?? this.brandTags,
      logoPath: logoPath ?? this.logoPath,
      coverPath: coverPath ?? this.coverPath,
    );
  }
}

class SignupNotifier extends StateNotifier<SignupState> {
  final ApiClient _apiClient;

  SignupNotifier(this._apiClient) : super(const SignupState());

  void nextStep() => state = state.copyWith(currentStep: state.currentStep + 1);
  void prevStep() { if (state.currentStep > 0) state = state.copyWith(currentStep: state.currentStep - 1); }
  void setStep(int s) => state = state.copyWith(currentStep: s);

  void updateField(String field, String value) {
    switch (field) {
      case 'fullName': state = state.copyWith(fullName: value);
      case 'username': state = state.copyWith(username: value);
      case 'email': state = state.copyWith(email: value);
      case 'password': state = state.copyWith(password: value);
      case 'confirmPassword': state = state.copyWith(confirmPassword: value);
      case 'contactNumber': state = state.copyWith(contactNumber: value);
      case 'location': state = state.copyWith(location: value);
      case 'gender': state = state.copyWith(gender: value);
      case 'dateOfBirth': state = state.copyWith(dateOfBirth: value);
      case 'businessName': state = state.copyWith(businessName: value);
      case 'brandUsername': state = state.copyWith(brandUsername: value);
      case 'brandGstNumber': state = state.copyWith(brandGstNumber: value);
      case 'brandEmail': state = state.copyWith(brandEmail: value);
      case 'brandPassword': state = state.copyWith(brandPassword: value);
      case 'brandConfirmPassword': state = state.copyWith(brandConfirmPassword: value);
      case 'brandContactNumber': state = state.copyWith(brandContactNumber: value);
      case 'brandLocation': state = state.copyWith(brandLocation: value);
    }
  }

  void setCategory(String c) => state = state.copyWith(businessCategory: c, brandSubCategory: null);
  void setSubCategory(String c) => state = state.copyWith(brandSubCategory: c);
  void toggleInterest(String i) {
    final s = Set<String>.from(state.interests);
    s.contains(i) ? s.remove(i) : s.add(i);
    state = state.copyWith(interests: s);
  }
  void addBrandTag(String t) {
    if (t.trim().isEmpty) return;
    final s = Set<String>.from(state.brandTags);
    s.add(t.trim());
    state = state.copyWith(brandTags: s);
  }
  void removeBrandTag(String t) {
    final s = Set<String>.from(state.brandTags);
    s.remove(t);
    state = state.copyWith(brandTags: s);
  }
  void setLogo(String p) => state = state.copyWith(logoPath: p);
  void setCover(String p) => state = state.copyWith(coverPath: p);
  void removeLogo() => state = state.copyWith(logoPath: '');
  void removeCover() => state = state.copyWith(coverPath: '');

  Future<bool> submitUserSignup() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _apiClient.dio.post('/auth/signup/user', data: {
        'name': state.fullName,
        'username': state.username,
        'email': state.email,
        'password': state.password,
        if (state.contactNumber.isNotEmpty) 'contactNumber': state.contactNumber,
        if (state.location.isNotEmpty) 'location': state.location,
        if (state.gender.isNotEmpty) 'gender': state.gender,
        if (state.dateOfBirth.isNotEmpty) 'dateOfBirth': state.dateOfBirth,
        if (state.interests.isNotEmpty) 'interests': state.interests.join(','),
      });

      if (res.statusCode == 201) {
        final token = res.data['token'];
        if (token != null) {
          await SecureStorage.saveToken(token);
          await SecureStorage.saveRole('USER');
        }
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Signup failed';
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Unexpected error');
      return false;
    }
    
    state = state.copyWith(isLoading: false, errorMessage: 'Unknown error');
    return false;
  }

  Future<bool> submitBrandSignup() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _apiClient.dio.post('/auth/signup/brand', data: {
        'name': state.businessName,
        'username': state.brandUsername,
        'email': state.brandEmail,
        'password': state.brandPassword,
        'gstNumber': state.brandGstNumber.isEmpty ? null : state.brandGstNumber,
        'category': state.businessCategory,
        if (state.brandSubCategory != null) 'subCategory': state.brandSubCategory,
        if (state.brandContactNumber.isNotEmpty) 'contactNumber': state.brandContactNumber,
        if (state.brandLocation.isNotEmpty) 'location': state.brandLocation,
        if (state.brandTags.isNotEmpty) 'tags': state.brandTags.toList(),
      });

      if (res.statusCode == 201) {
        final token = res.data['token'];
        if (token != null) {
          await SecureStorage.saveToken(token);
          await SecureStorage.saveRole('BRAND');
        }
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Brand signup failed';
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Unexpected error');
      return false;
    }

    state = state.copyWith(isLoading: false, errorMessage: 'Unknown error');
    return false;
  }

  void reset() => state = const SignupState();
}

final userSignupProvider = StateNotifierProvider<SignupNotifier, SignupState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SignupNotifier(apiClient);
});

final brandSignupProvider = StateNotifierProvider<SignupNotifier, SignupState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SignupNotifier(apiClient);
});
