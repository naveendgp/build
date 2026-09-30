import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/support_models.dart';
import '../models/support_chat_models.dart';

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

  // ─── Live Chat (the system actually used by lyket-web) ────────────
  // Flow: POST /request/create -> queued -> approved (socket event,
  // carries the new chat) -> GET/POST /chat/* for the actual messaging.

  Future<SupportRequestModel> createSupportRequest({
    required String category,
    String? description,
  }) async {
    final res = await _client.dio.post(
      '/request/create',
      data: {'category': category, if (description != null) 'description': description},
    );
    return SupportRequestModel.fromJson(res.data);
  }

  Future<SupportRequestModel> getQueuePosition(String requestId) async {
    final res = await _client.dio.get('/request/queue-position/$requestId');
    return SupportRequestModel.fromJson({...res.data, 'id': requestId});
  }

  Future<List<SupportRequestModel>> listMyRequests() async {
    final res = await _client.dio.get('/request/list');
    return (res.data as List?)?.map((x) => SupportRequestModel.fromJson(x)).toList() ?? [];
  }

  Future<List<SupportChat>> listChats() async {
    final res = await _client.dio.get('/chat/list');
    return (res.data as List?)?.map((x) => SupportChat.fromJson(x)).toList() ?? [];
  }

  Future<SupportChat> getChat(String id) async {
    final res = await _client.dio.get('/chat/$id');
    return SupportChat.fromJson(res.data);
  }

  Future<SupportChatMessage> sendChatMessage(String chatId, String message) async {
    final res = await _client.dio.post('/chat/$chatId/message', data: {'message': message});
    return SupportChatMessage.fromJson(res.data);
  }

  Future<void> markChatRead(String chatId) async {
    await _client.dio.post('/chat/$chatId/read');
  }

  Future<int> getUnreadChatCount() async {
    final res = await _client.dio.get('/chat/unread-count');
    final data = res.data;
    return data is Map
        ? (data['count'] is int ? data['count'] : int.tryParse('${data['count']}') ?? 0)
        : 0;
  }
}
