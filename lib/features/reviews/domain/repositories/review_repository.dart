import '../../../../core/network/api_client.dart';
import '../../../brand_profile/models/brand_profile_models.dart';

abstract class IReviewRepository {
  Future<List<BrandReview>> getReviews(String brandId);
  Future<ReviewStats> getReviewStats(String brandId);
  Future<Map<String, dynamic>> checkEligibility(String brandId);
  Future<BrandReview> addReview(String brandId, double rating, String? title, String description);
  Future<void> deleteReview(String brandId);
  Future<BrandReview> replyToReview(String reviewId, String response);
  Future<void> reportReview(String reviewId, String reason);
}

class ReviewRepositoryImpl implements IReviewRepository {
  final ApiClient _apiClient;

  ReviewRepositoryImpl(this._apiClient);

  @override
  Future<List<BrandReview>> getReviews(String brandId) async {
    final res = await _apiClient.dio.get('/reviews/$brandId');
    return (res.data as List).map((e) => BrandReview.fromJson(e)).toList();
  }

  @override
  Future<ReviewStats> getReviewStats(String brandId) async {
    final res = await _apiClient.dio.get('/reviews/$brandId/stats');
    return ReviewStats.fromJson(res.data);
  }

  @override
  Future<Map<String, dynamic>> checkEligibility(String brandId) async {
    final res = await _apiClient.dio.get('/reviews/$brandId/eligibility');
    return res.data;
  }

  @override
  Future<BrandReview> addReview(String brandId, double rating, String? title, String description) async {
    final res = await _apiClient.dio.post('/reviews/$brandId', data: {
      'rating': rating,
      'title': title,
      'description': description,
    });
    return BrandReview.fromJson(res.data);
  }

  @override
  Future<void> deleteReview(String brandId) async {
    await _apiClient.dio.delete('/reviews/$brandId');
  }

  @override
  Future<BrandReview> replyToReview(String reviewId, String response) async {
    final res = await _apiClient.dio.post('/reviews/$reviewId/response', data: {
      'response': response,
    });
    return BrandReview.fromJson(res.data);
  }

  @override
  Future<void> reportReview(String reviewId, String reason) async {
    await _apiClient.dio.post('/reviews/$reviewId/report', data: {
      'reason': reason,
    });
  }
}
