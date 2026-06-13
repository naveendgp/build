import 'dart:convert';
import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final res = await dio.get('http://65.2.11.145:3001/api/brand/707a2760-e147-405a-b1ed-17d0dd6ac992');
    final profileData = Map<String, dynamic>.from(res.data);
    List<dynamic> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data;
      return [];
    }
    final galleryRaw = parseList(profileData['gallery']);
    print('Gallery count: ' + galleryRaw.length.toString());
  } catch (e) {
    print('Error: ' + e.toString());
  }
}
