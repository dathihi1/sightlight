import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import 'package:sightlight_flutter/core/constants/api_constants.dart';
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';
import 'package:sightlight_flutter/data/models/practice/practice_model.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';
import 'package:sightlight_flutter/presentation/widgets/handmark_painter.dart';

/// Practice sign data representation matching web AI vocabulary items.
class PracticeSignItem {
  const PracticeSignItem({
    required this.id,
    required this.label,
    required this.topic,
    required this.videoUrl,
    required this.hint,
  });

  final String id;
  final String label;
  final String topic;
  final String videoUrl;
  final String hint;
}

class AiRecognitionCandidate {
  const AiRecognitionCandidate({
    required this.word,
    required this.probability,
    required this.isTarget,
  });

  final String word;
  final int probability;
  final bool isTarget;
}

class AiAssessmentResult {
  const AiAssessmentResult({
    required this.isCorrect,
    required this.statusTitle,
    required this.confidencePercent,
    required this.candidates,
    required this.targetWord,
    required this.feedbackNote,
    this.hasMotion = true,
  });

  final bool isCorrect;
  final String statusTitle;
  final int confidencePercent;
  final List<AiRecognitionCandidate> candidates;
  final String targetWord;
  final String feedbackNote;
  final bool hasMotion;
}

enum PracticePhase { idle, recording, scored }

enum PracticeCallLayout { split, pictureInPicture }

/// Chuyển lỗi hạ tầng thành thông báo ngắn gọn; không hiển thị nguyên
/// DioException/stack trace cho người học.
String friendlyPracticeNetworkError(Object error, {bool syncing = false}) {
  if (error is DioException) {
    final statusCode = error.response?.statusCode;
    if (statusCode == 401 || statusCode == 403) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (statusCode == 429) {
      return 'Bạn thao tác hơi nhanh. Vui lòng đợi một lát rồi thử lại.';
    }
    if (statusCode != null && statusCode >= 500) {
      return syncing
          ? 'Nhận diện trên thiết bị đã hoàn tất, nhưng máy chủ AI đang tạm bận nên lượt này chưa được đồng bộ. Vui lòng thử lại sau.'
          : 'Máy chủ AI đang tạm bận. Vui lòng thử lại sau.';
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return syncing
          ? 'Nhận diện trên thiết bị đã hoàn tất, nhưng chưa thể đồng bộ do kết nối mạng không ổn định.'
          : 'Kết nối mạng không ổn định. Vui lòng kiểm tra mạng và thử lại.';
    }
  }
  return syncing
      ? 'Nhận diện trên thiết bị đã hoàn tất, nhưng lượt này chưa được đồng bộ.'
      : 'Chưa thể xử lý video. Vui lòng thử lại.';
}

/// Dựng kết quả giống bản web: luôn hiển thị nhãn top-1 mà AI nhận ra.
/// Backend có thể ẩn `top3` ở trạng thái low_confidence/ok, nhưng vẫn trả
/// `predictedLabel`, `predictedSignId` và `confidence`.
AiAssessmentResult buildAiAssessment(
  AiAttemptResponse attempt,
  PracticeSignItem sign,
) {
  final confidence = attempt.confidence == null
      ? (attempt.top3.isEmpty
            ? 0
            : (attempt.top3.first.confidence * 100).round())
      : (attempt.confidence! * 100).round();
  final candidates = attempt.top3
      .map(
        (candidate) => AiRecognitionCandidate(
          word: candidate.label,
          probability: (candidate.confidence * 100).round(),
          isTarget:
              candidate.signId == sign.id ||
              candidate.label.trim().toLowerCase() ==
                  sign.label.trim().toLowerCase(),
        ),
      )
      .toList();

  final predictedLabel = attempt.predictedLabel?.trim() ?? '';
  final alreadyContainsPrediction = candidates.any(
    (candidate) =>
        candidate.word.trim().toLowerCase() == predictedLabel.toLowerCase(),
  );
  if (predictedLabel.isNotEmpty && !alreadyContainsPrediction) {
    candidates.insert(
      0,
      AiRecognitionCandidate(
        word: predictedLabel,
        probability: confidence,
        isTarget:
            attempt.predictedSignId == sign.id ||
            predictedLabel.toLowerCase() == sign.label.trim().toLowerCase(),
      ),
    );
  }

  final title = switch (attempt.status) {
    'verified' || 'ok' when attempt.verified => 'Chính xác!',
    'not_enough_frames' => 'Cử chỉ quá ngắn',
    'no_hand' => 'Không phát hiện bàn tay',
    'low_confidence' => 'Độ khớp thấp',
    'wrong_target' => 'Chưa chính xác',
    _ => attempt.verified ? 'Chính xác!' : 'Chưa chính xác',
  };
  final note = attempt.qualityHints.isNotEmpty
      ? attempt.qualityHints.join('. ')
      : (attempt.countedAgainstQuota
            ? 'Đã ghi nhận nỗ lực (còn ${attempt.quotaRemaining ?? 0} lượt hôm nay).'
            : 'Lượt này không tính vào hạn mức.');
  return AiAssessmentResult(
    isCorrect: attempt.verified,
    statusTitle: title,
    confidencePercent: confidence,
    targetWord: sign.label,
    feedbackNote: note,
    candidates: candidates,
    hasMotion: true,
  );
}

class PracticePage extends ConsumerStatefulWidget {
  const PracticePage({super.key, this.serverVideoEnabled});

  final bool? serverVideoEnabled;

  @override
  ConsumerState<PracticePage> createState() => _PracticePageState();
}

class _PracticePageState extends ConsumerState<PracticePage>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  List<PracticeSignItem> _signs = [];
  int _currentIndex = 0;
  PracticePhase _phase = PracticePhase.idle;
  double _elapsedSeconds = 0.0;
  static const double _targetRecordingSeconds = 3.5;
  Timer? _timer;
  AiAssessmentResult? _lastAssessment;
  bool _isAnalyzing = false;
  bool _isFinishing = false;
  bool _serverVideoConsentGranted = false;
  bool _serverVideoDeclined = false;
  bool _isLoading = false;
  String? _sessionError;
  int _selectedModelSize = 30;
  List<int> _availableModelSizes = const [30];
  int? _quotaRemaining;
  bool _quotaUnlimited = false;
  PracticeCallLayout _callLayout = PracticeCallLayout.split;
  double _demoAspectRatio = 1;
  String _sessionId = 'ai-practice-session-001';
  String _modelVersion = 'vsl-mvp30-v2-lite-transformer';
  late final HandmarkTracker _handmarkTracker;
  HandmarkSnapshot? _handmarkSnapshot;
  String? _handmarkError;
  bool _sampleHandmarkEnabled = false;
  int _sampleHandmarkCount = 0;

  // Chỉ bật lại khi Flutter đã có MediaPipe Holistic native và tạo đúng
  // v2_holistic_subset 64x327. Không được dùng tensor tổng hợp từ pixel motion.
  static const bool _onDeviceLandmarkPipelineReady = false;

  bool get _serverVideoAvailable =>
      widget.serverVideoEnabled ?? ApiConstants.useServerVideoProcessing;

  bool get _useServerVideoForSession =>
      _serverVideoAvailable && !_serverVideoDeclined;

  // Real Camera management
  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  int _selectedCameraIndex = 0;
  bool _isCameraInitialized = false;
  bool _isCameraLoading = true;
  String? _cameraErrorMessage;

  late final AnimationController _scanController;
  late final Animation<double> _scanAnimation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _handmarkTracker = HandmarkTracker();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _scanAnimation = CurvedAnimation(
      parent: _scanController,
      curve: Curves.easeInOut,
    );

    _initCamera();
    _loadAiSession(size: 30);
  }

  Future<void> _loadAiSession({int? size}) async {
    final targetSize = size ?? _selectedModelSize;
    setState(() {
      _selectedModelSize = targetSize;
      _isLoading = true;
      _sessionError = null;
    });

    try {
      final repository = ref.read(practiceRepositoryProvider);
      final capabilities = await repository.getAiCapabilities(
        modelSize: targetSize,
      );
      final session = await repository.getAiPracticeSession(size: targetSize);
      final quota = await repository.getAiQuota();
      if (!mounted) return;
      if (session.items.isNotEmpty) {
        setState(() {
          _sessionId = session.sessionId;
          _modelVersion = session.modelVersion;
          _availableModelSizes = capabilities.availableModelSizes.isEmpty
              ? const [30]
              : capabilities.availableModelSizes;
          _quotaRemaining = quota.remaining;
          _quotaUnlimited = quota.unlimited;
          _signs = session.items
              .map(
                (item) => PracticeSignItem(
                  id: item.signId,
                  label: item.label,
                  topic: item.topic.isNotEmpty ? item.topic : 'Ký hiệu AI',
                  videoUrl: item.videoUrl,
                  hint: item.hint.isNotEmpty
                      ? item.hint
                      : 'Thực hiện ký hiệu trước camera.',
                ),
              )
              .toList();
          if (_currentIndex >= _signs.length) {
            _currentIndex = 0;
          }
          _phase = PracticePhase.idle;
          _lastAssessment = null;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _sessionError = error.toString().replaceFirst('Exception: ', '');
          _signs = [];
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final camera = _cameraController;
    if (camera == null || !camera.value.isInitialized) return;

    if (state == AppLifecycleState.inactive) {
      _timer?.cancel();
      camera.dispose();
      _isCameraInitialized = false;
    } else if (state == AppLifecycleState.resumed) {
      if (_cameras.isNotEmpty) {
        _startCameraController(_cameras[_selectedCameraIndex]);
      }
    }
  }

  Future<void> _initCamera() async {
    setState(() {
      _isCameraLoading = true;
      _cameraErrorMessage = null;
    });

    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        if (mounted) {
          setState(() {
            _isCameraLoading = false;
            _cameraErrorMessage = 'Không tìm thấy camera trên thiết bị.';
          });
        }
        return;
      }

      // Ưu tiên camera trước (front camera)
      final frontIdx = _cameras.indexWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
      );
      _selectedCameraIndex = frontIdx != -1 ? frontIdx : 0;

      await _startCameraController(_cameras[_selectedCameraIndex]);
    } catch (e) {
      if (mounted) {
        setState(() {
          _isCameraLoading = false;
          _cameraErrorMessage = 'Không thể truy cập camera: $e';
        });
      }
    }
  }

  Future<void> _startCameraController(CameraDescription camera) async {
    final oldController = _cameraController;
    final newController = CameraController(
      camera,
      ResolutionPreset.medium,
      enableAudio: false,
      imageFormatGroup: Platform.isAndroid
          ? ImageFormatGroup.nv21
          : ImageFormatGroup.bgra8888,
    );

    await oldController?.dispose();

    try {
      await newController.initialize();
      // CameraPreview ưu tiên lockedCaptureOrientation. Nếu không khóa, một
      // số máy Android báo landscape khi điện thoại vẫn dựng đứng và preview
      // bị xoay 90 độ ngay lúc bắt đầu quay.
      await newController.lockCaptureOrientation(DeviceOrientation.portraitUp);
      if (mounted) {
        setState(() {
          _cameraController = newController;
          _isCameraInitialized = true;
          _isCameraLoading = false;
          _cameraErrorMessage = null;
        });
        await _startHandmarkStream(newController);
      }
    } catch (e) {
      await newController.dispose();
      if (mounted) {
        setState(() {
          _isCameraLoading = false;
          _cameraErrorMessage = 'Lỗi khởi động camera: $e';
        });
      }
    }
  }

  Future<void> _toggleCameraLens() async {
    if (_cameras.length <= 1 || _phase == PracticePhase.recording) return;
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    await _startCameraController(_cameras[_selectedCameraIndex]);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _scanController.dispose();
    _cameraController?.dispose();
    unawaited(_handmarkTracker.close());
    super.dispose();
  }

  Future<void> _startHandmarkStream([CameraController? camera]) async {
    final controller = camera ?? _cameraController;
    if (controller == null ||
        !controller.value.isInitialized ||
        controller.value.isRecordingVideo ||
        controller.value.isStreamingImages) {
      return;
    }
    try {
      await controller.startImageStream(
        (image) => unawaited(_processHandmarkFrame(image, controller)),
      );
    } catch (error) {
      developer.log(
        'Không thể khởi động luồng handmark',
        name: 'signlight.handmark',
        error: error,
      );
      if (mounted) setState(() => _handmarkError = error.toString());
    }
  }

  Future<void> _stopHandmarkStream(CameraController controller) async {
    if (!controller.value.isStreamingImages ||
        controller.value.isRecordingVideo) {
      return;
    }
    try {
      await controller.stopImageStream();
    } catch (_) {
      // Camera có thể đã tự dừng stream khi đổi lens hoặc đổi lifecycle.
    }
  }

  Future<void> _processHandmarkFrame(
    CameraImage image,
    CameraController controller,
  ) async {
    try {
      final snapshot = await _handmarkTracker.process(
        image,
        controller.description,
        controller.value.lockedCaptureOrientation ??
            controller.value.deviceOrientation,
      );
      if (!mounted || snapshot == null || controller != _cameraController) {
        return;
      }
      setState(() {
        _handmarkSnapshot = snapshot;
        _handmarkError = null;
      });
    } catch (error) {
      developer.log(
        'Không thể xử lý frame handmark',
        name: 'signlight.handmark',
        error: error,
      );
      if (mounted) setState(() => _handmarkError = error.toString());
    }
  }

  Future<void> _startPractice() async {
    if (_isFinishing || _isAnalyzing) return;
    if (!_useServerVideoForSession && !_onDeviceLandmarkPipelineReady) {
      _showMessage(
        'Nhận diện trên thiết bị đang được hoàn thiện. Vui lòng chọn xử lý trên server.',
      );
      return;
    }
    final controller = _cameraController;
    if (_useServerVideoForSession) {
      if (controller == null || !controller.value.isInitialized) {
        _showMessage('Camera chưa sẵn sàng. Vui lòng thử lại.');
        return;
      }
      if (!_serverVideoConsentGranted) {
        final consent = await _requestServerVideoConsent();
        if (!mounted) return;
        if (consent) {
          _serverVideoConsentGranted = true;
        } else {
          setState(() => _serverVideoDeclined = true);
          _showMessage(
            'Video chưa được gửi. Nhận diện trên thiết bị hiện chưa khả dụng.',
          );
          return;
        }
      }
      if (_useServerVideoForSession) {
        try {
          await _stopHandmarkStream(controller);
          // CameraX trên một số máy Samsung xoay preview 90 độ và làm ML Kit
          // lỗi khi phải chạy đồng thời Preview + VideoCapture + ImageAnalysis.
          // Handmark đã được cập nhật liên tục ở màn hình chờ; trong 3 giây ghi
          // hình ta giữ overlay cuối cùng, rồi bật lại stream ngay khi dừng quay.
          await controller.lockCaptureOrientation(DeviceOrientation.portraitUp);
          await controller.startVideoRecording();
          if (mounted) setState(() => _handmarkError = null);
        } catch (error) {
          await _startHandmarkStream(controller);
          _showMessage('Không thể bắt đầu quay video: $error');
          return;
        }
      }
    }

    setState(() {
      _phase = PracticePhase.recording;
      _elapsedSeconds = 0.0;
      _lastAssessment = null;
    });

    _scanController.repeat(reverse: true);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _elapsedSeconds += 0.1;
        if (_elapsedSeconds >= _targetRecordingSeconds) {
          _finishRecording();
        }
      });
    });
  }

  Future<void> _finishRecording() async {
    if (_isFinishing) return;
    _isFinishing = true;
    _timer?.cancel();
    _scanController.stop();

    final sign = _signs[_currentIndex];
    if (_useServerVideoForSession) {
      try {
        await _finishServerVideoRecording(sign);
      } finally {
        _isFinishing = false;
      }
      return;
    }
    final assessment = AiAssessmentResult(
      isCorrect: false,
      statusTitle: 'On-device chưa sẵn sàng',
      confidencePercent: 0,
      targetWord: sign.label,
      feedbackNote: 'Ứng dụng chưa có MediaPipe Holistic trên thiết bị nên không tạo kết quả giả. Vui lòng chọn xử lý trên server.',
      candidates: const [],
      hasMotion: false,
    );

    if (mounted) {
      setState(() {
        _isAnalyzing = false;
        _phase = PracticePhase.scored;
        _lastAssessment = assessment;
      });
    }

    try {
      ref
          .read(practiceStatsProvider.notifier)
          .recordSession(answered: 1, correct: assessment.isCorrect ? 1 : 0);
    } catch (_) {
      // Safe fallback when storage provider is not initialized
    }
    _isFinishing = false;
  }

  Future<void> _finishServerVideoRecording(PracticeSignItem sign) async {
    final controller = _cameraController;
    AiAssessmentResult assessment;
    try {
      if (controller == null || !controller.value.isRecordingVideo) {
        throw StateError('Camera không có video đang quay.');
      }
      final recording = await controller.stopVideoRecording();
      // Chờ CameraX gắn lại ImageAnalysis trước khi cho phép lượt kế tiếp;
      // nếu chạy nền, nút "Luyện lại" có thể bắt đầu ghi đúng lúc stream đang
      // khởi tạo và làm cả camera lẫn handmark rơi vào trạng thái lỗi.
      await _startHandmarkStream(controller);
      if (!mounted) return;
      setState(() => _isAnalyzing = true);
      final bytes = await recording.readAsBytes();
      if (bytes.isEmpty) throw StateError('Video vừa quay đang trống.');
      final attempt = await ref
          .read(practiceRepositoryProvider)
          .submitVideoAttempt(
            videoBytes: bytes,
            fileName: recording.name.isEmpty ? 'practice.mp4' : recording.name,
            targetSignId: sign.id,
            modelVersion: _modelVersion,
            sessionId: _sessionId,
            requestId: const Uuid().v4(),
          );
      assessment = _assessmentFromAttempt(attempt, sign);
      if (attempt.quotaRemaining != null) {
        _quotaRemaining = attempt.quotaRemaining;
      }
    } catch (error) {
      if (controller != null) await _startHandmarkStream(controller);
      assessment = AiAssessmentResult(
        isCorrect: false,
        statusTitle: 'Chưa thể xử lý video',
        confidencePercent: 0,
        targetWord: sign.label,
        feedbackNote:
            'Video không được lưu. ${friendlyPracticeNetworkError(error)}',
        candidates: const [],
        hasMotion: true,
      );
    }
    if (!mounted) return;
    setState(() {
      _isAnalyzing = false;
      _phase = PracticePhase.scored;
      _lastAssessment = assessment;
    });
    try {
      await ref
          .read(practiceStatsProvider.notifier)
          .recordSession(answered: 1, correct: assessment.isCorrect ? 1 : 0);
    } catch (_) {}
  }

  AiAssessmentResult _assessmentFromAttempt(
    AiAttemptResponse attempt,
    PracticeSignItem sign,
  ) => buildAiAssessment(attempt, sign);

  Future<bool> _requestServerVideoConsent() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Cho phép xử lý video trên máy chủ?'),
        content: const Text(
          'Video ngắn sẽ được mã hóa và gửi qua HTTPS để trích xuất landmarks. '
          'Video chỉ được xử lý tạm thời, không lưu vào R2, Azure Storage hay cơ sở dữ liệu. '
          'Bạn có thể từ chối để tiếp tục dùng chế độ xử lý trên thiết bị.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Không tải lên'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Đồng ý tải video'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  void _resetToIdle() {
    _timer?.cancel();
    _scanController.stop();
    setState(() {
      _phase = PracticePhase.idle;
      _elapsedSeconds = 0.0;
      _lastAssessment = null;
    });
  }

  void _nextSign() {
    _resetToIdle();
    setState(() {
      _currentIndex = (_currentIndex + 1) % _signs.length;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    if (_signs.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện Camera AI')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: _isLoading
                ? const CircularProgressIndicator()
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        _sessionError ?? 'Phiên luyện hiện không có dữ liệu.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => _loadAiSession(),
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
          ),
        ),
      );
    }
    final currentSign = _signs[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Luyện Camera AI',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          PopupMenuButton<int>(
            initialValue: _selectedModelSize,
            onSelected: (size) => _loadAiSession(size: size),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            itemBuilder: (context) => [
              const PopupMenuItem<int>(
                value: 30,
                child: Row(
                  children: [
                    Icon(Icons.check_circle_outline_rounded, size: 16),
                    SizedBox(width: 8),
                    Text('Model 30 từ (Free)'),
                  ],
                ),
              ),
              PopupMenuItem<int>(
                value: 400,
                enabled: _availableModelSizes.contains(400),
                child: const Row(
                  children: [
                    Icon(
                      Icons.workspace_premium_rounded,
                      size: 16,
                      color: Colors.amber,
                    ),
                    SizedBox(width: 8),
                    Text('Model 400 từ (Premium)'),
                  ],
                ),
              ),
            ],
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.amber.withAlpha(isDark ? 50 : 30),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.amber.withAlpha(isDark ? 100 : 120),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _selectedModelSize == 400
                        ? Icons.workspace_premium_rounded
                        : Icons.auto_awesome_rounded,
                    size: 14,
                    color: isDark
                        ? Colors.amber.shade300
                        : Colors.amber.shade800,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _selectedModelSize == 400
                        ? 'Model 400 từ (Premium)'
                        : 'Model 30 từ (Free)',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? Colors.amber.shade200
                          : Colors.amber.shade900,
                    ),
                  ),
                  const SizedBox(width: 2),
                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  else
                    Icon(
                      Icons.arrow_drop_down_rounded,
                      size: 16,
                      color: isDark
                          ? Colors.amber.shade200
                          : Colors.amber.shade900,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Eyebrow + Target Sign
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Luyện camera · ${_currentIndex + 1}/${_signs.length}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.primary,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Làm ký hiệu “${currentSign.label}”',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: _phase == PracticePhase.recording
                      ? null
                      : _nextSign,
                  icon: const Icon(Icons.skip_next_rounded, size: 20),
                  label: const Text('Bỏ qua'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.secondary,
                  ),
                ),
              ],
            ),
            if (_quotaUnlimited || _quotaRemaining != null) ...[
              const SizedBox(height: 8),
              Text(
                _quotaUnlimited
                    ? 'Hạn mức AI: không giới hạn'
                    : 'Còn ${_quotaRemaining ?? 0} lượt AI hôm nay',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 12),

            if (_serverVideoAvailable) ...[
              Text(
                'Cách xử lý video',
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ChoiceChip(
                    avatar: const Icon(Icons.phone_android_rounded, size: 18),
                    label: const Text('Trên thiết bị (đang hoàn thiện)'),
                    selected: !_useServerVideoForSession,
                    onSelected:
                        _phase == PracticePhase.recording ||
                            !_onDeviceLandmarkPipelineReady
                        ? null
                        : (_) => setState(() {
                            _serverVideoDeclined = true;
                          }),
                  ),
                  ChoiceChip(
                    avatar: const Icon(Icons.cloud_queue_rounded, size: 18),
                    label: const Text('Trên server'),
                    selected: _useServerVideoForSession,
                    onSelected: _phase == PracticePhase.recording
                        ? null
                        : (_) => setState(() {
                            _serverVideoDeclined = false;
                          }),
                  ),
                ],
              ),
              if (!_onDeviceLandmarkPipelineReady) ...[
                const SizedBox(height: 8),
                Text(
                  'On-device tạm khóa để tránh kết quả sai. Hiện chỉ server trích xuất landmarks thật.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 12),
            ],

            // Sign Selection Dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isDark
                    ? theme.colorScheme.surfaceContainerHighest.withAlpha(100)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.sign_language_rounded,
                    size: 20,
                    color: Color(0xFF2563EB),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Chọn từ luyện:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: _currentIndex,
                        isExpanded: true,
                        icon: const Icon(Icons.arrow_drop_down_rounded),
                        items: List.generate(_signs.length, (index) {
                          final item = _signs[index];
                          return DropdownMenuItem<int>(
                            value: index,
                            child: Text(
                              '${item.label} (${item.topic})',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }),
                        onChanged: _phase == PracticePhase.recording
                            ? null
                            : (newIdx) {
                                if (newIdx != null && newIdx != _currentIndex) {
                                  _resetToIdle();
                                  setState(() {
                                    _currentIndex = newIdx;
                                  });
                                }
                              },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Bạn đang có ${_signs.length} từ khả dụng với gói hiện tại.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white60 : Colors.black54,
                    ),
                  ),
                ),
                if (_selectedModelSize == 30)
                  InkWell(
                    onTap: () => context.push('/upgrade'),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      child: Text(
                        'Mở khóa 400 từ',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Video-call stage: split screen or camera-first picture-in-picture.
            _buildVideoCallStage(currentSign, isDark),
            const SizedBox(height: 16),
            // Trạng thái đang gửi phân tích AI Model Backend
            if (_isAnalyzing) ...[
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Column(
                    children: [
                      const CircularProgressIndicator(strokeWidth: 3),
                      const SizedBox(height: 12),
                      Text(
                        _useServerVideoForSession
                            ? 'Đang tải video và xử lý landmarks trên máy chủ...'
                            : 'Đang gửi dữ liệu phân tích tới AI Model backend...',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // BẢNG KẾT QUẢ ĐÁNH GIÁ CHUẨN WEB (IMAGE #44)
            if (_phase == PracticePhase.scored && _lastAssessment != null) ...[
              _buildWebStandardResultCard(_lastAssessment!, isDark),
              const SizedBox(height: 16),
            ],

            // Action Buttons
            if (_phase == PracticePhase.idle)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton.icon(
                  onPressed: _startPractice,
                  icon: const Icon(Icons.videocam_rounded, size: 22),
                  label: const Text(
                    'Bắt đầu ký hiệu',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              )
            else if (_phase == PracticePhase.recording)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton.icon(
                  onPressed: _finishRecording,
                  icon: const Icon(Icons.stop_circle_rounded, size: 22),
                  label: Text(
                    'Dừng & Chấm điểm (${_elapsedSeconds.toStringAsFixed(1)}s / ${_targetRecordingSeconds.toInt()}s)',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              )
            else ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _resetToIdle,
                      icon: const Icon(Icons.replay_rounded, size: 20),
                      label: const Text('Luyện lại'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton.icon(
                      onPressed: _nextSign,
                      icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                      label: const Text('Từ tiếp theo'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoCallStage(PracticeSignItem currentSign, bool isDark) {
    final theme = Theme.of(context);
    final split = _callLayout == PracticeCallLayout.split;
    return Card(
      elevation: 0,
      color: isDark ? theme.colorScheme.surfaceContainerLow : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(
          color: _phase == PracticePhase.recording
              ? Colors.redAccent
              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: _phase == PracticePhase.recording ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withAlpha(25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.video_call_rounded,
                    color: Color(0xFF2563EB),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 9),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Phòng luyện Camera AI',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Video mẫu và camera của bạn',
                        style: TextStyle(fontSize: 11),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(),
              ],
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, stageConstraints) {
                const dividerHeight = 2.0;
                final stageWidth = stageConstraints.maxWidth;
                final maxPaneHeight = MediaQuery.sizeOf(context).height * 0.70;
                final webStylePaneHeight = (stageWidth / _demoAspectRatio)
                    .clamp(180.0, maxPaneHeight);
                final stageHeight = split
                    ? (webStylePaneHeight * 2) + dividerHeight
                    : stageWidth * 4 / 3;

                return ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: SizedBox(
                    width: double.infinity,
                    height: stageHeight,
                    child: ColoredBox(
                      color: const Color(0xFF080B12),
                      child: split
                          ? LayoutBuilder(
                              builder: (context, constraints) {
                                final paneHeight = webStylePaneHeight;
                                return Column(
                                  children: [
                                    SizedBox(
                                      key: const ValueKey('split-demo-pane'),
                                      width: double.infinity,
                                      height: paneHeight,
                                      child: ClipRect(
                                        key: const ValueKey(
                                          'split-demo-paint-clip',
                                        ),
                                        child: _buildDemoCallPane(currentSign),
                                      ),
                                    ),
                                    Container(
                                      height: dividerHeight,
                                      color: Colors.white.withAlpha(30),
                                    ),
                                    SizedBox(
                                      key: const ValueKey('split-camera-pane'),
                                      width: double.infinity,
                                      height: paneHeight,
                                      child: ClipRect(
                                        key: const ValueKey(
                                          'split-camera-paint-clip',
                                        ),
                                        child: _buildCameraCallPane(),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            )
                          : Stack(
                              fit: StackFit.expand,
                              children: [
                                _buildCameraCallPane(),
                                Positioned(
                                  top: 14,
                                  right: 14,
                                  width: 132,
                                  height: 176,
                                  child: Material(
                                    elevation: 10,
                                    color: Colors.black,
                                    borderRadius: BorderRadius.circular(16),
                                    clipBehavior: Clip.antiAlias,
                                    child: _buildDemoCallPane(
                                      currentSign,
                                      compact: true,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _CallControl(
                  icon: Icons.vertical_split_rounded,
                  label: 'Chia đôi',
                  selected: split,
                  onTap: _phase == PracticePhase.recording
                      ? null
                      : () => setState(
                          () => _callLayout = PracticeCallLayout.split,
                        ),
                ),
                const SizedBox(width: 18),
                _CallControl(
                  icon: Icons.picture_in_picture_alt_rounded,
                  label: 'Khung nhỏ',
                  selected: !split,
                  onTap: _phase == PracticePhase.recording
                      ? null
                      : () => setState(
                          () =>
                              _callLayout = PracticeCallLayout.pictureInPicture,
                        ),
                ),
                if (_cameras.length > 1) ...[
                  const SizedBox(width: 18),
                  _CallControl(
                    icon: Icons.flip_camera_ios_rounded,
                    label: 'Đổi camera',
                    onTap: _phase == PracticePhase.recording
                        ? null
                        : _toggleCameraLens,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => setState(() {
                  _sampleHandmarkEnabled = !_sampleHandmarkEnabled;
                  if (!_sampleHandmarkEnabled) _sampleHandmarkCount = 0;
                }),
                icon: Icon(
                  _sampleHandmarkEnabled
                      ? Icons.visibility_off_outlined
                      : Icons.back_hand_outlined,
                  size: 18,
                ),
                label: Text(
                  _sampleHandmarkEnabled
                      ? 'Tắt handmark video mẫu'
                      : 'Bật handmark video mẫu',
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: _sampleHandmarkEnabled
                      ? const Color(0xFF2563EB)
                      : null,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: Colors.amber.withAlpha(18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withAlpha(45)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.lightbulb_outline_rounded,
                    size: 17,
                    color: Colors.amber.shade800,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      currentSign.hint,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? Colors.amber.shade200
                            : Colors.amber.shade900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.shield_outlined,
                  size: 16,
                  color: Color(0xFF16A34A),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _useServerVideoForSession
                        ? 'Chỉ khi bạn đồng ý, video ngắn mới được gửi qua HTTPS, xử lý tạm thời rồi xóa; máy chủ không lưu video.'
                        : _onDeviceLandmarkPipelineReady
                        ? 'Hình ảnh không rời khỏi máy bạn — ứng dụng chỉ gửi dãy số mô tả chuyển động.'
                        : 'On-device chưa sẵn sàng; ứng dụng sẽ không tạo kết quả nhận diện giả.',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white60 : Colors.black54,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoCallPane(
    PracticeSignItem currentSign, {
    bool compact = false,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          fit: StackFit.expand,
          children: [
            SignVideoPlayer(
              key: ValueKey('call-demo-${currentSign.id}-$compact'),
              videoUrl: currentSign.videoUrl,
              height: constraints.maxHeight,
              compact: compact,
              handmarkEnabled: _sampleHandmarkEnabled,
              onHandmarkCountChanged: (count) {
                if (!mounted || count == _sampleHandmarkCount) return;
                setState(() => _sampleHandmarkCount = count);
              },
              onAspectRatioChanged: compact
                  ? null
                  : (aspectRatio) {
                      if (!mounted ||
                          aspectRatio <= 0 ||
                          (aspectRatio - _demoAspectRatio).abs() < 0.01) {
                        return;
                      }
                      setState(() => _demoAspectRatio = aspectRatio);
                    },
            ),
            Positioned(
              top: compact ? 7 : 10,
              left: compact ? 7 : 10,
              child: _CallLabel(
                icon: Icons.play_circle_fill_rounded,
                text: compact ? 'Mẫu' : 'Video mẫu · ${currentSign.label}',
                compact: compact,
              ),
            ),
            if (_sampleHandmarkEnabled)
              Positioned(
                top: compact ? 7 : 10,
                right: compact ? 7 : 10,
                child: _CallLabel(
                  icon: Icons.back_hand_outlined,
                  text: _sampleHandmarkCount > 0
                      ? 'HM · $_sampleHandmarkCount tay'
                      : 'HM · đang tìm tay',
                  compact: compact,
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildCameraCallPane() {
    return Stack(
      fit: StackFit.expand,
      children: [
        _buildCameraFeed(),
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(painter: HandmarkPainter(_handmarkSnapshot)),
          ),
        ),
        CustomPaint(
          painter: _ViewfinderPainter(
            isRecording: _phase == PracticePhase.recording,
          ),
        ),
        if (_phase == PracticePhase.recording)
          AnimatedBuilder(
            animation: _scanAnimation,
            builder: (context, child) => CustomPaint(
              painter: _ScanningLaserPainter(progress: _scanAnimation.value),
            ),
          ),
        const Positioned(
          top: 10,
          left: 10,
          child: _CallLabel(icon: Icons.videocam_rounded, text: 'Bạn'),
        ),
        if (_isCameraInitialized)
          Positioned(
            top: 10,
            right: 10,
            child: _CallLabel(
              icon: _handmarkSnapshot?.visibleHandCount == 2
                  ? Icons.pan_tool_alt_rounded
                  : Icons.back_hand_outlined,
              text: _handmarkError != null
                  ? 'Handmark lỗi'
                  : _handmarkSnapshot?.visibleHandCount == 2
                  ? 'Handmark · 2 tay'
                  : _handmarkSnapshot?.visibleHandCount == 1
                  ? 'Handmark · 1 tay'
                  : 'Handmark · chưa thấy tay',
              compact: true,
            ),
          ),
        if (_phase == PracticePhase.idle && _isCameraInitialized)
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Căn bàn tay và khuôn mặt vào khung hình',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  /// Card kết quả nhận diện chuẩn theo giao diện Web (Image #44)
  Widget _buildWebStandardResultCard(AiAssessmentResult res, bool isDark) {
    final bgColor = res.isCorrect
        ? (isDark
              ? const Color(0xFF064E3B).withAlpha(60)
              : const Color(0xFFF0FDF4))
        : (isDark
              ? const Color(0xFF7C2D12).withAlpha(60)
              : const Color(0xFFFFFBEB));

    final borderColor = res.isCorrect
        ? (isDark
              ? const Color(0xFF059669).withAlpha(120)
              : const Color(0xFFBBF7D0))
        : (isDark
              ? const Color(0xFFD97706).withAlpha(120)
              : const Color(0xFFFDE68A));

    final statusColor = res.isCorrect
        ? const Color(0xFF16A34A)
        : (res.hasMotion ? Colors.orange.shade700 : Colors.red.shade700);

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Icon + Status + Progress
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  res.isCorrect
                      ? Icons.check_rounded
                      : Icons.priority_high_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  res.statusTitle,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Độ tin cậy ${res.confidencePercent}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Striped confidence progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: (res.confidencePercent / 100).clamp(0.05, 1.0),
              backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(
                res.isCorrect ? const Color(0xFF3B82F6) : Colors.orange,
              ),
              minHeight: 12,
            ),
          ),
          const SizedBox(height: 16),

          // Sub-card: "AI nhận ra"
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI nhận ra',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                if (res.candidates.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'Không có gợi ý nhận diện phù hợp',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.white38 : Colors.grey.shade500,
                      ),
                    ),
                  )
                else
                  for (final candidate in res.candidates) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            candidate.word,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: candidate.isTarget
                                  ? FontWeight.bold
                                  : FontWeight.w500,
                              color: candidate.isTarget
                                  ? const Color(0xFF2563EB)
                                  : (isDark ? Colors.white : Colors.black87),
                            ),
                          ),
                          Text(
                            '${candidate.probability}%',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: candidate.isTarget
                                  ? FontWeight.bold
                                  : FontWeight.w500,
                              color: candidate.isTarget
                                  ? const Color(0xFF2563EB)
                                  : (isDark ? Colors.white : Colors.black87),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                const SizedBox(height: 8),
                Text(
                  'Bạn đang luyện: ${res.targetWord}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white38 : Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Footer Notice Callout
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 2),
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: Color(0xFFFACC15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.priority_high_rounded,
                  size: 12,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      res.feedbackNote,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? Colors.amber.shade200
                            : const Color(0xFF854D0E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCameraFeed() {
    if (_isCameraLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Colors.white70,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Đang khởi động camera...',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ),
      );
    }

    if (_cameraErrorMessage != null ||
        _cameraController == null ||
        !_isCameraInitialized) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.videocam_off_outlined,
                color: Colors.white70,
                size: 36,
              ),
              const SizedBox(height: 8),
              const Text(
                'Chưa thể bật camera',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _cameraErrorMessage ?? 'Vui lòng cấp quyền truy cập máy ảnh trong Cài đặt thiết bị.',
                style: const TextStyle(color: Colors.white60, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _initCamera,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    final previewSize = _cameraController!.value.previewSize;
    return FittedBox(
      fit: BoxFit.cover,
      child: SizedBox(
        width: previewSize != null ? previewSize.height : 480,
        height: previewSize != null ? previewSize.width : 640,
        child: CameraPreview(_cameraController!),
      ),
    );
  }

  Widget _buildStatusBadge() {
    switch (_phase) {
      case PracticePhase.idle:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.blue.withAlpha(25),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _isCameraInitialized
                    ? Icons.check_circle_outline
                    : Icons.hourglass_empty_rounded,
                size: 14,
                color: const Color(0xFF2563EB),
              ),
              const SizedBox(width: 4),
              Text(
                _isCameraInitialized ? 'Sẵn sàng' : 'Chờ camera',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2563EB),
                ),
              ),
            ],
          ),
        );
      case PracticePhase.recording:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.red.withAlpha(30),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const _PulsingRedDot(),
              const SizedBox(width: 6),
              Text(
                'Đang ghi ${_elapsedSeconds.toStringAsFixed(1)}s',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.redAccent,
                ),
              ),
            ],
          ),
        );
      case PracticePhase.scored:
        final passed = _lastAssessment?.isCorrect ?? false;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: passed
                ? Colors.green.withAlpha(30)
                : Colors.orange.withAlpha(30),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                passed ? Icons.check_rounded : Icons.info_outline_rounded,
                size: 14,
                color: passed ? Colors.green : Colors.orange,
              ),
              const SizedBox(width: 4),
              Text(
                passed ? 'Chính xác' : 'Chưa đạt',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: passed ? Colors.green : Colors.orange,
                ),
              ),
            ],
          ),
        );
    }
  }
}

class _CallControl extends StatelessWidget {
  const _CallControl({
    required this.icon,
    required this.label,
    this.onTap,
    this.selected = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final color = selected
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.onSurfaceVariant;
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: selected
                      ? Theme.of(context).colorScheme.primaryContainer
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: onTap == null ? Colors.grey : color),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: onTap == null ? Colors.grey : color,
                  fontSize: 10,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CallLabel extends StatelessWidget {
  const _CallLabel({
    required this.icon,
    required this.text,
    this.compact = false,
  });

  final IconData icon;
  final String text;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 7 : 9,
        vertical: compact ? 4 : 5,
      ),
      decoration: BoxDecoration(
        color: Colors.black.withAlpha(165),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: compact ? 12 : 14),
          const SizedBox(width: 5),
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: compact ? 70 : 190),
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: compact ? 9 : 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Pulsing red record indicator dot.
class _PulsingRedDot extends StatefulWidget {
  const _PulsingRedDot();

  @override
  State<_PulsingRedDot> createState() => _PulsingRedDotState();
}

class _PulsingRedDotState extends State<_PulsingRedDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _ctrl,
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: Colors.redAccent,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

/// Draws camera viewfinder corner brackets.
class _ViewfinderPainter extends CustomPainter {
  const _ViewfinderPainter({required this.isRecording});

  final bool isRecording;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isRecording
          ? Colors.redAccent.withAlpha(180)
          : Colors.cyan.withAlpha(140)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    const cornerLength = 20.0;
    const margin = 16.0;

    // Top-left
    canvas.drawLine(
      const Offset(margin, margin + cornerLength),
      const Offset(margin, margin),
      paint,
    );
    canvas.drawLine(
      const Offset(margin, margin),
      const Offset(margin + cornerLength, margin),
      paint,
    );

    // Top-right
    canvas.drawLine(
      Offset(size.width - margin - cornerLength, margin),
      Offset(size.width - margin, margin),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - margin, margin),
      Offset(size.width - margin, margin + cornerLength),
      paint,
    );

    // Bottom-left
    canvas.drawLine(
      Offset(margin, size.height - margin - cornerLength),
      Offset(margin, size.height - margin),
      paint,
    );
    canvas.drawLine(
      Offset(margin, size.height - margin),
      Offset(margin + cornerLength, size.height - margin),
      paint,
    );

    // Bottom-right
    canvas.drawLine(
      Offset(size.width - margin - cornerLength, size.height - margin),
      Offset(size.width - margin, size.height - margin),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - margin, size.height - margin),
      Offset(size.width - margin, size.height - margin - cornerLength),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _ViewfinderPainter oldDelegate) {
    return oldDelegate.isRecording != isRecording;
  }
}

/// Draws animated laser scanning line when AI is analyzing gestures.
class _ScanningLaserPainter extends CustomPainter {
  const _ScanningLaserPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height * progress;

    final linePaint = Paint()
      ..color = Colors.redAccent
      ..strokeWidth = 2.0;

    final glowPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.redAccent.withAlpha(0),
          Colors.redAccent.withAlpha(70),
          Colors.redAccent.withAlpha(0),
        ],
      ).createShader(Rect.fromLTWH(0, y - 20, size.width, 40));

    // Glow band
    canvas.drawRect(Rect.fromLTWH(0, y - 20, size.width, 40), glowPaint);
    // Sharp line
    canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
  }

  @override
  bool shouldRepaint(covariant _ScanningLaserPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
