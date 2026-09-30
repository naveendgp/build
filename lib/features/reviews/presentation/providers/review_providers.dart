import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/repositories/review_repository.dart';
import '../../../brand_profile/models/brand_profile_models.dart';

final reviewRepositoryProvider = Provider<IReviewRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ReviewRepositoryImpl(apiClient);
});

final reviewStatsProvider = FutureProvider.family<ReviewStats, String>((ref, brandId) async {
  final repository = ref.watch(reviewRepositoryProvider);
  return repository.getReviewStats(brandId);
});

final reviewListProvider = FutureProvider.family<List<BrandReview>, String>((ref, brandId) async {
  final repository = ref.watch(reviewRepositoryProvider);
  return repository.getReviews(brandId);
});

final reviewEligibilityProvider = FutureProvider.family<Map<String, dynamic>, String>((
  ref,
  brandId,
) async {
  final repository = ref.watch(reviewRepositoryProvider);
  return repository.checkEligibility(brandId);
});
