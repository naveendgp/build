import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/haptics.dart';
import 'providers/create_post_provider.dart';
import 'models/create_post_models.dart';
import 'widgets/media_selection_step.dart';
import 'widgets/media_preview_step.dart';
import 'widgets/content_details_step.dart';
import 'widgets/objective_step.dart';
import 'widgets/cta_step.dart';
import 'widgets/lead_form/lead_form_builder.dart';
import 'widgets/schedule_step.dart';
import 'widgets/review_step.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> with WidgetsBindingObserver {
  final PageController _pageController = PageController();
  // While true, a finger is down on the preview image — the surrounding
  // SingleChildScrollView disables its own scroll physics so it stops
  // winning the gesture arena against InteractiveViewer's pan (see
  // MediaPreviewStep.onImageInteractionStart/End for why this is needed).
  bool _isInteractingWithImage = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pageController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state != AppLifecycleState.resumed) return;

    // Backgrounding the app tears down the native TextInputConnection, but
    // the Flutter-side FocusNode never loses focus — so on return, tapping
    // the still-"focused" field doesn't fire a focus-change and the
    // keyboard never reopens. Forcing an unfocus + refocus cycle re-attaches
    // a fresh TextInputConnection so the keyboard comes back without the
    // user having to tap elsewhere first.
    final focused = FocusManager.instance.primaryFocus;
    if (focused == null || !focused.hasFocus) return;
    final context = focused.context;
    if (context == null) return;

    focused.unfocus();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && context.mounted) {
        FocusScope.of(context).requestFocus(focused);
      }
    });
  }

  void _onNextStep(CreatePostState state, CreatePostNotifier notifier) {
    final steps = state.activeSteps;
    final currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx < steps.length - 1) {
      notifier.nextStep();
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      // Publish
      notifier.publish().then((_) {
        // Wait a moment for the success animation then close
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.of(context).pop();
          }
        });
      });
    }
  }

  void _onPrevStep(CreatePostState state, CreatePostNotifier notifier) {
    final steps = state.activeSteps;
    final currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx > 0) {
      notifier.previousStep();
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.of(context).pop();
    }
  }

  Widget _buildStepContent(CreatePostState state, CreatePostNotifier notifier) {
    return PageView(
      controller: _pageController,
      physics: const NeverScrollableScrollPhysics(),
      children: state.activeSteps.map((step) {
        switch (step) {
          case CreateStep.media:
            return MediaSelectionStep(
              // Instagram-style: pick one or many photos in a single gallery
              // session, then move on automatically — no manual "Next" tap.
              onPickImages: () async {
                final success = await notifier.pickImages();
                if (success && mounted) _onNextStep(state, notifier);
              },
              onPickVideo: () async {
                final success = await notifier.pickVideo();
                if (success && mounted) _onNextStep(state, notifier);
              },
            );
          case CreateStep.preview:
            return SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 24),
              // Disabled entirely while the user's finger is on the image so
              // InteractiveViewer's pan gesture isn't stolen by this
              // ancestor Scrollable — see the bool's doc comment above.
              physics: _isInteractingWithImage ? const NeverScrollableScrollPhysics() : null,
              child: MediaPreviewStep(
                media: state.media,
                onImageInteractionStart: () => setState(() => _isInteractingWithImage = true),
                onImageInteractionEnd: () => setState(() => _isInteractingWithImage = false),
                onChangeMedia: (index) {
                  showModalBottomSheet(
                    context: context,
                    backgroundColor: context.colors.card,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    builder: (ctx) => SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            'Replace Media',
                            style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: AppSpacing.sm),
                          ListTile(
                            leading: Icon(Icons.photo_rounded, color: context.colors.primaryAccent),
                            title: Text(
                              'Replace with Photo',
                              style: TextStyle(color: context.colors.textPrimary),
                            ),
                            onTap: () {
                              Navigator.pop(ctx);
                              notifier.pickImage(replaceIndex: index);
                            },
                          ),
                          ListTile(
                            leading: Icon(
                              Icons.videocam_rounded,
                              color: context.colors.primaryAccent,
                            ),
                            title: Text(
                              'Replace with Video',
                              style: TextStyle(color: context.colors.textPrimary),
                            ),
                            onTap: () {
                              Navigator.pop(ctx);
                              notifier.pickVideo(replaceIndex: index);
                            },
                          ),
                          const SizedBox(height: AppSpacing.md),
                        ],
                      ),
                    ),
                  );
                },
                onRemoveMedia: (index) {
                  if (index < state.media.length) {
                    notifier.removeMedia(state.media[index].id);
                  }
                },
                onAddMore: () => notifier.pickImages(),
              ),
            );
          case CreateStep.details:
            return ContentDetailsStep(
              title: state.title,
              isHighlightTitle: state.isHighlightTitle,
              highlightMessage: state.highlightMessage,
              highlightTheme: state.highlightTheme,
              highlightAnimation: state.highlightAnimation,
              highlightIcon: state.highlightIcon,
              description: state.description,
              tags: state.tags,
              categoryId: state.categoryId,
              onTitleChanged: notifier.setTitle,
              onToggleHighlight: notifier.toggleHighlightTitle,
              onHighlightMessageChanged: notifier.setHighlightMessage,
              onHighlightThemeChanged: notifier.setHighlightTheme,
              onHighlightAnimationChanged: notifier.setHighlightAnimation,
              onHighlightIconChanged: notifier.setHighlightIcon,
              onDescriptionChanged: notifier.setDescription,
              onAddTag: notifier.addTag,
              onRemoveTag: notifier.removeTag,
            );
          case CreateStep.objective:
            return ObjectiveStep(
              selectedObjective: state.objective,
              onObjectiveSelected: notifier.setObjective,
            );
          case CreateStep.cta:
            return state.objective != null
                ? CtaStep(
                    objective: state.objective!,
                    ctaData: state.cta ?? const CtaData(type: CtaType.noButton),
                    onCtaTypeChanged: notifier.updateCtaType,
                    onUrlChanged: notifier.updateCtaUrl,
                    onUtmSourceChanged: (val) => notifier.updateUtm(source: val),
                    onUtmMediumChanged: (val) => notifier.updateUtm(medium: val),
                    onUtmCampaignChanged: (val) => notifier.updateUtm(campaign: val),
                  )
                : Center(
                    child: Text(
                      'Please select an objective first.',
                      style: AppTypography.bodyMedium,
                    ),
                  );
          case CreateStep.leadForm:
            return LeadFormBuilder(
              leadForm: state.leadForm,
              customTemplates: state.customTemplates,
              onUpdate: notifier.updateLeadForm,
              onSaveTemplate: notifier.saveLeadFormTemplate,
            );
          case CreateStep.schedule:
            return ScheduleStep(
              publishMode: state.publishMode,
              scheduledAt: state.scheduledAt,
              onModeChanged: notifier.setPublishMode,
              onDateChanged: notifier.setScheduleDate,
            );
          case CreateStep.review:
            return ReviewStep(state: state);
        }
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createPostProvider);
    final notifier = ref.read(createPostProvider.notifier);

    final steps = state.activeSteps;
    final currentIdx = steps.indexOf(state.currentStep);
    final isFirstStep = currentIdx == 0;
    final isLastStep = currentIdx == steps.length - 1;

    // Check if current step is valid to proceed
    bool canProceed = true;
    if (state.currentStep == CreateStep.media && !state.hasMedia) canProceed = false;
    if (state.currentStep == CreateStep.details && !state.hasContent) canProceed = false;
    if (state.currentStep == CreateStep.objective && state.objective == null) canProceed = false;
    if (state.currentStep == CreateStep.schedule &&
        state.publishMode == PublishMode.scheduled &&
        state.scheduledAt == null)
      canProceed = false;
    if (state.currentStep.index >= CreateStep.cta.index) {
      if (state.objective == PostObjective.leadGeneration) {
        if (state.currentStep.index >= CreateStep.leadForm.index && state.leadForm == null) {
          canProceed = false;
        }
      }
      if (state.objective == PostObjective.traffic ||
          state.objective == PostObjective.conversions ||
          state.objective == PostObjective.getDirections) {
        if (state.cta?.destinationUrl == null || state.cta!.destinationUrl!.trim().isEmpty) {
          canProceed = false;
        } else {
          final url = state.cta!.destinationUrl!.trim();
          final isValidUrl = RegExp(r'^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$').hasMatch(url);
          if (!isValidUrl) {
            canProceed = false;
          }
        }
      }
    }

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(isFirstStep ? Icons.close : Icons.arrow_back_ios_new_rounded),
          color: context.colors.textPrimary,
          onPressed: () {
            Haptics.light();
            _onPrevStep(state, notifier);
          },
        ),
        title: _StepIndicator(currentStep: currentIdx, totalSteps: steps.length),
        centerTitle: true,
        // Actions moved to bottom
      ),
      bottomNavigationBar:
          state.uploadStage == UploadStage.idle && state.currentStep != CreateStep.media
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: ElevatedButton(
                  onPressed: canProceed
                      ? () {
                          Haptics.light();
                          _onNextStep(state, notifier);
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: canProceed
                        ? context.colors.primaryAccent
                        : context.colors.surfaceSecondary,
                    foregroundColor: canProceed ? Colors.white : context.colors.textDisabled,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(
                    isLastStep
                        ? (state.publishMode == PublishMode.scheduled
                              ? 'Schedule Post'
                              : 'Publish Post')
                        : 'Next',
                    style: AppTypography.button,
                  ),
                ),
              ),
            )
          : null,
      body: Stack(
        children: [
          _buildStepContent(state, notifier),

          if (state.uploadStage != UploadStage.idle)
            _UploadOverlay(
              stage: state.uploadStage,
              progress: state.uploadProgress,
              errorMessage: state.errorMessage,
              isScheduled: state.publishMode == PublishMode.scheduled,
              onDismiss: () => notifier.resetUploadStage(),
            ),
        ],
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _StepIndicator({required this.currentStep, required this.totalSteps});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(totalSteps, (index) {
        final isCompleted = index <= currentStep;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          height: 4,
          width: isCompleted ? 24 : 12,
          decoration: BoxDecoration(
            color: isCompleted ? context.colors.primaryAccent : context.colors.border,
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }
}

class _UploadOverlay extends StatelessWidget {
  final UploadStage stage;
  final double progress;
  final String? errorMessage;
  final bool isScheduled;
  final VoidCallback? onDismiss;

  const _UploadOverlay({
    required this.stage,
    required this.progress,
    this.errorMessage,
    this.isScheduled = false,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    String message = '';
    switch (stage) {
      case UploadStage.compressing:
        message = 'Optimizing media...';
        break;
      case UploadStage.uploading:
        message = 'Uploading content...';
        break;
      case UploadStage.processing:
        message = 'Finalizing post...';
        break;
      case UploadStage.complete:
        message = isScheduled ? 'Scheduled Successfully!' : 'Published Successfully!';
        break;
      case UploadStage.failed:
        message = 'Upload Failed';
        break;
      case UploadStage.idle:
        break;
    }

    return Container(
      color: context.colors.background.withValues(alpha: 0.85),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: AppSpacing.borderRadiusXl,
            border: Border.all(color: context.colors.borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                blurRadius: 32,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (stage == UploadStage.complete)
                Icon(Icons.check_circle_rounded, color: context.colors.success, size: 64)
              else if (stage == UploadStage.failed)
                Icon(Icons.error_rounded, color: context.colors.error, size: 64)
              else
                SizedBox(
                  width: 64,
                  height: 64,
                  child: CircularProgressIndicator.adaptive(
                    value: progress,
                    valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                    backgroundColor: context.colors.surface,
                    strokeWidth: 4,
                  ),
                ),
              const SizedBox(height: AppSpacing.lg),
              Text(message, style: AppTypography.titleMedium, textAlign: TextAlign.center),
              if (stage == UploadStage.failed && errorMessage != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  errorMessage!,
                  style: AppTypography.bodySmall.copyWith(color: context.colors.error),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.md),
                TextButton(
                  onPressed: onDismiss,
                  child: Text('Dismiss', style: TextStyle(color: context.colors.textSecondary)),
                ),
              ],
              if (stage == UploadStage.uploading) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${(progress * 100).toInt()}%',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.primaryAccent),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
