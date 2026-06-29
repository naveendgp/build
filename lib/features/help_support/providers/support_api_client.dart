import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/support_models.dart';

class SupportApiClient {
  final ApiClient _client;
  SupportApiClient(this._client);

  Future<SupportTicket> createTicket(Map<String, dynamic> data) async {
    final res = await _client.dio.post('/support/tickets', data: data);
    return SupportTicket.fromJson(res.data);
  }

  Future<List<SupportTicket>> getMyTickets() async {
    final res = await _client.dio.get('/support/tickets/my');
    return (res.data as List?)?.map((x) => SupportTicket.fromJson(x)).toList() ?? [];
  }

  Future<SupportTicket> getTicketById(String id) async {
    final res = await _client.dio.get('/support/tickets/my/$id');
    return SupportTicket.fromJson(res.data);
  }

  Future<List<FaqItem>> getFaqs() async {
    final res = await _client.dio.get('/faq');
    return (res.data as List?)?.map((x) => FaqItem.fromJson(x)).toList() ?? [];
  }
}

