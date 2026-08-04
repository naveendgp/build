import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../models/create_post_models.dart';
import '../../../core/network/api_client.dart';

final createPostProvider = StateNotifierProvider.autoDispose<CreatePostNotifier, CreatePostState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CreatePostNotifier(apiClient);
});

class CreatePostNotifier extends StateNotifier<CreatePostState> {
  final ApiClient _apiClient;
  
  CreatePostNotifier(this._apiClient) : super(const CreatePostState()) {
    fetchTemplates();
    _fetchBrandCategory();
  }

  /// Posts no longer let the user pick a category — it's taken from the
  /// brand's own profile (set during brand signup) instead.
  Future<void> _fetchBrandCategory() async {
    try {
      final res = await _apiClient.dio.get('/brand/profile');
      final category = res.data['category'] as String?;
      if (category != null && category.isNotEmpty) {
        state = state.copyWith(categoryId: category);
      }
    } catch (e) {
      debugPrint('Failed to fetch brand category: $e');
    }
  }

  final ImagePicker _picker = ImagePicker();

  // â”€â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void goToStep(CreateStep step) {
    state = state.copyWith(currentStep: step);
  }

  void nextStep() {
    final steps = state.activeSteps;
    final currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx < steps.length - 1) {
      state = state.copyWith(currentStep: steps[currentIdx + 1]);
    }
  }

  void previousStep() {
    final steps = state.activeSteps;
    final currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx > 0) {
      state = state.copyWith(currentStep: steps[currentIdx - 1]);
    }
  }

  // â”€â”€â”€ Media â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<bool> pickImage({ImageSource source = ImageSource.gallery, int? replaceIndex}) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 70, maxWidth: 1080);
    if (picked != null) {
      final item = MediaItem(
        id: 'media_${DateTime.now().millisecondsSinceEpoch}',
        file: File(picked.path),
        type: MediaType.image,
      );
      if (replaceIndex != null && replaceIndex >= 0 && replaceIndex < state.media.length) {
        final newMedia = List<MediaItem>.from(state.media);
        newMedia[replaceIndex] = item;
        state = state.copyWith(media: newMedia);
      } else {
        state = state.copyWith(media: [...state.media, item]);
      }
      return true;
    }
    return false;
  }

  /// Instagram-style carousel selection — lets the user pick several photos
  /// from the gallery in a single picker session instead of repeatedly
  /// re-opening the picker to add one image at a time.
  Future<bool> pickImages({ImageSource source = ImageSource.gallery}) async {
    if (source != ImageSource.gallery) {
      return pickImage(source: source);
    }
    final picked = await _picker.pickMultiImage(imageQuality: 70, maxWidth: 1080);
    if (picked.isNotEmpty) {
      final items = picked.map((file) => MediaItem(
        id: 'media_${DateTime.now().millisecondsSinceEpoch}_${file.path.hashCode}',
        file: File(file.path),
        type: MediaType.image,
      ));
      state = state.copyWith(media: [...state.media, ...items]);
      return true;
    }
    return false;
  }

  Future<bool> pickVideo({ImageSource source = ImageSource.gallery, int? replaceIndex}) async {
    final picked = await _picker.pickVideo(source: source, maxDuration: const Duration(minutes: 10));
    if (picked != null) {
      final item = MediaItem(
        id: 'media_${DateTime.now().millisecondsSinceEpoch}',
        file: File(picked.path),
        type: MediaType.video,
      );
      if (replaceIndex != null && replaceIndex >= 0 && replaceIndex < state.media.length) {
        final newMedia = List<MediaItem>.from(state.media);
        newMedia[replaceIndex] = item;
        state = state.copyWith(media: newMedia);
      } else {
        state = state.copyWith(media: [...state.media, item]);
      }
      return true;
    }
    return false;
  }

  void removeMedia(String id) {
    state = state.copyWith(media: state.media.where((m) => m.id != id).toList());
  }

  void reorderMedia(int oldIndex, int newIndex) {
    final items = List<MediaItem>.from(state.media);
    if (newIndex > oldIndex) newIndex--;
    final item = items.removeAt(oldIndex);
    items.insert(newIndex, item);
    state = state.copyWith(media: items);
  }

  void setDimension(MediaDimension dim) {
    state = state.copyWith(dimension: dim);
  }

  // â”€â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void setTitle(String title) {
    state = state.copyWith(title: title);
  }

  void toggleHighlightTitle() {
    state = state.copyWith(isHighlightTitle: !state.isHighlightTitle);
  }

  void setHighlightMessage(String message) {
    state = state.copyWith(highlightMessage: message);
  }

  void setHighlightTheme(String theme) {
    state = state.copyWith(highlightTheme: theme);
  }

  void setHighlightAnimation(String animation) {
    state = state.copyWith(highlightAnimation: animation);
  }

  void setHighlightIcon(String? icon) {
    state = state.copyWith(highlightIcon: icon);
  }

  void setDescription(String desc) {
    state = state.copyWith(description: desc);
  }

  void addTag(String tag) {
    final trimmed = tag.trim().toLowerCase();
    if (trimmed.isNotEmpty && !state.tags.contains(trimmed)) {
      state = state.copyWith(tags: [...state.tags, trimmed]);
    }
  }

  void removeTag(String tag) {
    state = state.copyWith(tags: state.tags.where((t) => t != tag).toList());
  }

  // â”€â”€â”€ Objective â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void setObjective(PostObjective? objective) {
    if (objective == null) {
      state = state.copyWith(clearObjective: true, clearCta: true);
    } else {
      state = state.copyWith(objective: objective, clearCta: true);
    }
  }

  // â”€â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void setCta(CtaData? cta) {
    if (cta == null) {
      state = state.copyWith(clearCta: true);
    } else {
      state = state.copyWith(cta: cta);
    }
  }

  void updateCtaType(CtaType type) {
    state = state.copyWith(cta: (state.cta ?? const CtaData(type: CtaType.learnMore)).copyWith(type: type));
  }

  void updateCtaUrl(String url) {
    state = state.copyWith(cta: (state.cta ?? const CtaData(type: CtaType.learnMore)).copyWith(destinationUrl: url));
  }

  void updateUtm({String? source, String? medium, String? campaign}) {
    final current = state.cta ?? const CtaData(type: CtaType.learnMore);
    state = state.copyWith(cta: current.copyWith(
      utmSource: source ?? current.utmSource,
      utmMedium: medium ?? current.utmMedium,
      utmCampaign: campaign ?? current.utmCampaign,
    ));
  }

  // â”€â”€â”€ Lead Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void updateLeadForm(LeadFormData Function(LeadFormData) updater) {
    final current = state.leadForm ?? const LeadFormData();
    state = state.copyWith(leadForm: updater(current));
  }

  Future<void> fetchTemplates() async {
    try {
      final res = await _apiClient.dio.get('/lead-form');
      if (res.statusCode == 200) {
        final List<dynamic> data = res.data;
        final templates = data.map((json) {
          final fieldsJson = json['fields'] as List<dynamic>? ?? [];
          final fields = fieldsJson.map((f) {
            FormFieldType mappedType = FormFieldType.shortText;
            switch (f['type']) {
              case 'SHORT_TEXT': mappedType = FormFieldType.shortText; break;
              case 'LONG_TEXT': mappedType = FormFieldType.longText; break;
              case 'EMAIL': mappedType = FormFieldType.email; break;
              case 'PHONE': mappedType = FormFieldType.phone; break;
              case 'RADIO': mappedType = FormFieldType.singleChoice; break;
              case 'CHECKBOX': mappedType = FormFieldType.multipleChoice; break;
              case 'DROPDOWN': mappedType = FormFieldType.dropDown; break;
            }
            return FormFieldData(
              id: f['id'],
              type: mappedType,
              question: f['label'],
              isRequired: f['isRequired'] ?? false,
              options: List<String>.from(f['options'] ?? []),
            );
          }).toList();

          return LeadFormTemplate(
            id: json['id'],
            name: json['name'] ?? json['title'] ?? 'Untitled Template',
            icon: Icons.article_rounded, // Default icon for now
            data: LeadFormData(
              name: json['name'] ?? '',
              headline: json['title'] ?? '',
              description: json['intro'] ?? '',
              thankYouMessage: json['thankYouMsg'] ?? 'Thank you for submitting the form',
              fields: fields,
            ),
          );
        }).toList();

        state = state.copyWith(customTemplates: templates);
      }
    } catch (e) {
      debugPrint('Failed to fetch templates: $e');
    }
  }

  Future<void> saveLeadFormTemplate(String name, IconData icon) async {
    if (state.leadForm == null) return;
    
    try {
      // 1. Create the template in the backend (no postId)
      final formRes = await _apiClient.dio.post('/lead-form', data: {
        'name': name, // The name chosen by user in the Save Template popup
        'title': state.leadForm!.headline,
        'intro': state.leadForm!.description,
        'thankYouMsg': state.leadForm!.thankYouMessage,
      });

      if (formRes.statusCode == 200 || formRes.statusCode == 201) {
        final leadFormId = formRes.data['id'];
        
        // 2. Save the fields
        for (int i = 0; i < state.leadForm!.fields.length; i++) {
           final field = state.leadForm!.fields[i];
           
           String backendType = 'SHORT_TEXT';
           switch(field.type) {
              case FormFieldType.shortText: backendType = 'SHORT_TEXT'; break;
              case FormFieldType.longText: backendType = 'LONG_TEXT'; break;
              case FormFieldType.email: backendType = 'EMAIL'; break;
              case FormFieldType.phone: backendType = 'PHONE'; break;
              case FormFieldType.singleChoice: backendType = 'RADIO'; break;
              case FormFieldType.multipleChoice: backendType = 'CHECKBOX'; break;
              case FormFieldType.dropDown: backendType = 'DROPDOWN'; break;
           }
           
           await _apiClient.dio.post('/lead-form/field', data: {
              'formId': leadFormId,
              'label': field.question,
              'type': backendType,
              'isRequired': field.isRequired,
              'options': field.options,
              'order': i,
           });
        }
        
        // Refresh local templates after saving
        await fetchTemplates();
      }
    } catch (e) {
      debugPrint('Failed to save template to backend: $e');
      // Fallback: save locally
      final newTemplate = LeadFormTemplate(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        icon: icon,
        data: state.leadForm!,
      );
      state = state.copyWith(
        customTemplates: [...state.customTemplates, newTemplate],
      );
    }
  }

  // ———————————————————————————————————————————— Schedule ————————————————————————————————————————————

  void setPublishMode(PublishMode mode) {
    state = state.copyWith(publishMode: mode);
    if (mode == PublishMode.now) {
      state = state.copyWith(clearSchedule: true);
    }
  }

  void setScheduleDate(DateTime date) {
    state = state.copyWith(scheduledAt: date);
  }

  void setTimezone(String tz) {
    state = state.copyWith(timezone: tz);
  }

  // ———————————————————————————————————————————— Publish ————————————————————————————————————————————

  Future<void> publish() async {
    if (state.objective == PostObjective.leadGeneration) {
      if (state.leadForm == null || state.leadForm!.fields.isEmpty) {
        state = state.copyWith(errorMessage: 'A lead form with at least one question is required for the Lead Generation objective.');
        return;
      }
    }
    
    state = state.copyWith(uploadStage: UploadStage.uploading, uploadProgress: 0.0, errorMessage: null);
    
    try {
      final List<Map<String, dynamic>> uploadedMedia = [];
      
      for (int i = 0; i < state.media.length; i++) {
        final item = state.media[i];
        final isVideo = item.type == MediaType.video;
        
        final formData = FormData.fromMap({
          'file': await MultipartFile.fromFile(
            item.file.path,
            contentType: isVideo 
              ? http_parser.MediaType('video', 'mp4') 
              : http_parser.MediaType('image', 'jpeg'),
          ),
        });

        final res = await _apiClient.dio.post(
          '/upload',
          data: formData,
          options: Options(
            sendTimeout: const Duration(minutes: 5),
            receiveTimeout: const Duration(minutes: 5),
          ),
          queryParameters: {'type': 'post'},
          onSendProgress: (count, total) {
             final baseProgress = i / state.media.length;
             final currentProgress = (count / total) / state.media.length;
             state = state.copyWith(uploadProgress: baseProgress + currentProgress);
          },
        );
        
        if (res.statusCode == 200) {
          uploadedMedia.add({
             'url': res.data['url'],
             'type': isVideo ? 'VIDEO' : 'IMAGE',
             'order': i,
          });
        } else {
          throw Exception('Failed to upload media item $i');
        }
      }

      state = state.copyWith(uploadStage: UploadStage.processing);

      // Map Objective strings to backend enum
      String? backendObjective;
      if (state.objective != null) {
        switch (state.objective!) {
           case PostObjective.awareness: backendObjective = 'AWARENESS'; break;
           case PostObjective.traffic: backendObjective = 'TRAFFIC'; break;
           case PostObjective.conversions: backendObjective = 'CONVERSIONS'; break;
           case PostObjective.leadGeneration: backendObjective = 'LEAD_GENERATION'; break;
           case PostObjective.messaging: backendObjective = 'MESSAGING'; break;
           case PostObjective.getDirections: backendObjective = 'GET_DIRECTIONS'; break;
        }
      }

      // Map CTA type
      String? backendCtaType;
      if (state.cta != null) {
        switch (state.cta!.type) {
           case CtaType.visitProfile: backendCtaType = 'VISIT_PROFILE'; break;
           case CtaType.followUs: backendCtaType = 'FOLLOW_US'; break;
           case CtaType.noButton: backendCtaType = 'NO_BUTTON'; break;
           case CtaType.seeMore: backendCtaType = 'SEE_MORE'; break;
           case CtaType.discover: backendCtaType = 'DISCOVER'; break;
           case CtaType.visitWebsite: backendCtaType = 'VISIT_WEBSITE'; break;
           case CtaType.learnMore: backendCtaType = 'LEARN_MORE'; break;
           case CtaType.shopNow: backendCtaType = 'SHOP_NOW'; break;
           case CtaType.getOffer: backendCtaType = 'GET_OFFER'; break;
           case CtaType.viewDetails: backendCtaType = 'VIEW_DETAILS'; break;
           case CtaType.explore: backendCtaType = 'EXPLORE'; break;
           case CtaType.bookNow: backendCtaType = 'BOOK_NOW'; break;
           case CtaType.signUp: backendCtaType = 'SIGN_UP'; break;
           case CtaType.getQuote: backendCtaType = 'GET_QUOTE'; break;
           case CtaType.enquireNow: backendCtaType = 'ENQUIRE_NOW'; break;
           case CtaType.buyNow: backendCtaType = 'BUY_NOW'; break;
           case CtaType.getStarted: backendCtaType = 'GET_STARTED'; break;
           case CtaType.getDirections: backendCtaType = 'GET_DIRECTIONS'; break;
           case CtaType.visitUs: backendCtaType = 'VISIT_US'; break;
           case CtaType.locateUs: backendCtaType = 'LOCATE_US'; break;
           case CtaType.sendMessage: backendCtaType = 'SEND_MESSAGE'; break;
           case CtaType.chatNow: backendCtaType = 'CHAT_NOW'; break;
           case CtaType.askQuestion: backendCtaType = 'ASK_QUESTION'; break;
           case CtaType.contactUs: backendCtaType = 'CONTACT_US'; break;
        }
      }

      // If Lead Generation objective, create the Lead Form and fields BEFORE creating the post
      String? leadFormId;
      if (state.objective == PostObjective.leadGeneration && state.leadForm != null) {
         final formRes = await _apiClient.dio.post('/lead-form', data: {
            'title': state.leadForm!.headline,
            'intro': state.leadForm!.description,
         });
         
         if (formRes.statusCode == 200 || formRes.statusCode == 201) {
            leadFormId = formRes.data['id'];
            
            for (int i = 0; i < state.leadForm!.fields.length; i++) {
               final field = state.leadForm!.fields[i];
               
               String backendType = 'SHORT_TEXT';
               switch(field.type) {
                  case FormFieldType.shortText: backendType = 'SHORT_TEXT'; break;
                  case FormFieldType.longText: backendType = 'LONG_TEXT'; break;
                  case FormFieldType.email: backendType = 'EMAIL'; break;
                  case FormFieldType.phone: backendType = 'PHONE'; break;
                  case FormFieldType.singleChoice: backendType = 'RADIO'; break;
                  case FormFieldType.multipleChoice: backendType = 'CHECKBOX'; break;
                  case FormFieldType.dropDown: backendType = 'DROPDOWN'; break;
               }
               
               await _apiClient.dio.post('/lead-form/field', data: {
                  'formId': leadFormId,
                  'label': field.question,
                  'type': backendType,
                  'isRequired': field.isRequired,
                  'options': field.options,
                  'order': i,
               });
            }
         }
      }

      final postData = {
        'title': state.title,
        'description': state.description,
        'tags': state.tags,
        'category': state.categoryId,
        'marketingObjective': backendObjective,
        'ctaType': backendCtaType,
        'ctaText': state.cta?.displayLabel,
        'destinationUrl': state.cta?.destinationUrl,
        'utmWebsite': state.cta?.destinationUrl,
        'utmSource': state.cta?.utmSource,
        'utmMedium': state.cta?.utmMedium,
        'utmCampaign': state.cta?.utmCampaign,
        'isHighlighted': state.isHighlightTitle,
        if (state.isHighlightTitle) 'highlightMessage': state.highlightMessage,
        if (state.isHighlightTitle) 'highlightTheme': state.highlightTheme,
        if (state.isHighlightTitle) 'highlightAnimation': state.highlightAnimation,
        if (state.isHighlightTitle && state.highlightIcon != null) 'highlightIcon': state.highlightIcon,
        'publishNow': state.publishMode == PublishMode.now,
        'publishAt': state.scheduledAt?.toUtc().toIso8601String(),
        'timezone': state.publishMode == PublishMode.now ? null : state.timezone,
        'media': uploadedMedia,
        'leadFormId': leadFormId,
      };

      final postRes = await _apiClient.dio.post('/posts', data: postData);
      
      if (postRes.statusCode == 201) {
         state = state.copyWith(uploadStage: UploadStage.complete, uploadProgress: 1.0);
      } else {
         throw Exception('Failed to create post');
      }

    } on DioException catch (e) {
      debugPrint('Publish error: ${e.response?.data}');
      String msg = e.message ?? 'Unknown error';
      final data = e.response?.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        msg = data['message'].toString();
      } else if (data is String) {
        msg = '${e.response?.statusCode ?? 'Unknown'} Error (Might be too large)';
      }
      state = state.copyWith(
        uploadStage: UploadStage.failed, 
        errorMessage: 'Server Error: $msg'
      );
    } catch (e) {
      debugPrint('Publish error: $e');
      state = state.copyWith(
        uploadStage: UploadStage.failed, 
        errorMessage: e.toString()
      );
    }
  }

  // â”€â”€â”€ Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void resetUploadStage() {
    state = state.copyWith(uploadStage: UploadStage.idle, errorMessage: null);
  }

  void reset() {
    state = const CreatePostState();
  }
}
