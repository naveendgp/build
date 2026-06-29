import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'support_api_client.dart';
import '../models/support_models.dart';

final supportApiClientProvider = Provider((ref) {
  return SupportApiClient(ref.watch(apiClientProvider));
});

final myTicketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) {
  return ref.watch(supportApiClientProvider).getMyTickets();
});

final faqProvider = FutureProvider.autoDispose<List<FaqItem>>((ref) {
  return ref.watch(supportApiClientProvider).getFaqs();
});

enum TicketUploadState { idle, uploading, submitting, success, error }

class CreateTicketState {
  final TicketUploadState status;
  final String? errorMessage;
  final SupportTicket? result;
  
  const CreateTicketState({
    this.status = TicketUploadState.idle,
    this.errorMessage,
    this.result,
  });
  
  CreateTicketState copyWith({
    TicketUploadState? status,
    String? errorMessage,
    SupportTicket? result,
  }) {
    return CreateTicketState(
      status: status ?? this.status,
      errorMessage: errorMessage, // null by default unless explicitly given? Wait, if we use copyWith, we usually preserve.
      result: result ?? this.result,
    );
  }
}

final createTicketProvider = StateNotifierProvider.autoDispose<CreateTicketNotifier, CreateTicketState>((ref) {
  return CreateTicketNotifier(ref.watch(supportApiClientProvider), ref.watch(apiClientProvider));
});

class CreateTicketNotifier extends StateNotifier<CreateTicketState> {
  final SupportApiClient _apiClient;
  final ApiClient _baseClient;

  CreateTicketNotifier(this._apiClient, this._baseClient) : super(const CreateTicketState());

  Future<void> submitTicket({
    required String subject,
    required String message,
    required String priority,
    required String ticketType,
  }) async {
    state = state.copyWith(status: TicketUploadState.submitting, errorMessage: null);

    try {

      final ticket = await _apiClient.createTicket({
        'subject': subject,
        'message': message,
        'priority': priority,
        'ticketType': ticketType,
        'attachments': [],
      });

      state = state.copyWith(status: TicketUploadState.success, result: ticket);
    } catch (e) {
      state = state.copyWith(
        status: TicketUploadState.error, 
        errorMessage: e.toString(),
      );
    }
  }
}
