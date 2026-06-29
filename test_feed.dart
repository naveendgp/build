import 'dart:convert';
import 'package:http/http.dart' as http;
import 'lib/features/home/models/feed_models.dart';
import 'lib/core/network/api_client.dart';

void main() async {
  try {
    final response = await http.get(Uri.parse('http://65.2.11.145:3001/api/feed'));
    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      final dataList = jsonResponse['data'] as List;
      print('Fetched ${dataList.length} posts');
      for (var i = 0; i < dataList.length; i++) {
        try {
          final post = FeedPost.fromJson(dataList[i]);
          print('Successfully parsed post $i: ${post.id}');
        } catch (e, st) {
          print('Error parsing post $i: $e');
          print(st);
        }
      }
    } else {
      print('Failed to fetch feed: ${response.statusCode}');
    }
  } catch (e) {
    print('Error fetching feed: $e');
  }
}
