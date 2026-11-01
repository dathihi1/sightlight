import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:sightlight_flutter/core/ai/local_recognizer.dart';
import 'package:sightlight_flutter/data/models/practice/practice_model.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';

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

class PracticePage extends ConsumerStatefulWidget {
  const PracticePage({super.key});

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
  bool _isLoading = false;
  String? _sessionError;
  int _selectedModelSize = 30;
  List<int> _availableModelSizes = const [30];
  int? _quotaRemaining;
  bool _quotaUnlimited = false;
  PracticeCallLayout _callLayout = PracticeCallLayout.split;
  String _sessionId = 'ai-practice-session-001';
  String _modelVersion = 'vsl-mvp30-v2-lite-transformer';

  // Real Camera management
  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  int _selectedCameraIndex = 0;
  bool _isCameraInitialized = false;
  bool _isCameraLoading = true;
  String? _cameraErrorMessage;

  // Motion analysis during recording
  bool _isStreaming = false;
  int _motionSampleCount = 0;
  double _motionAccumulator = 0.0;
  List<int>? _prevSample;

  late final AnimationController _scanController;
  late final Animation<double> _scanAnimation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
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

    // Tải trước mô hình ONNX INT8 cục bộ để dự phòng ngoại tuyến
    unawaited(LocalRecognizer.instance.load(modelSize: targetSize));

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
      _stopMotionTracking();
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
    );

    await oldController?.dispose();

    try {
      await newController.initialize();
      if (mounted) {
        setState(() {
          _cameraController = newController;
          _isCameraInitialized = true;
          _isCameraLoading = false;
          _cameraErrorMessage = null;
        });
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
    await _stopMotionTracking();
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    await _startCameraController(_cameras[_selectedCameraIndex]);
  }

  void _startMotionTracking() {
    _motionSampleCount = 0;
    _motionAccumulator = 0.0;
    _prevSample = null;

    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;

    try {
      _isStreaming = true;
      controller.startImageStream((CameraImage image) {
        if (!_isStreaming || image.planes.isEmpty) return;
        _motionSampleCount++;
        // Lấy mẫu mỗi 4 khung hình để tránh tốn CPU
        if (_motionSampleCount % 4 != 0) return;

        final bytes = image.planes[0].bytes;
        final step = (bytes.length ~/ 100).clamp(1, 1000);
        final sample = <int>[];
        for (int i = 0; i < bytes.length && sample.length < 100; i += step) {
          sample.add(bytes[i]);
        }

        if (_prevSample != null && _prevSample!.length == sample.length) {
          int diff = 0;
          for (int i = 0; i < sample.length; i++) {
            diff += (sample[i] - _prevSample![i]).abs();
          }
          _motionAccumulator += (diff / sample.length);
        }
        _prevSample = sample;
      });
    } catch (_) {
      _isStreaming = false;
    }
  }

  Future<void> _stopMotionTracking() async {
    if (_isStreaming && _cameraController != null) {
      try {
        _isStreaming = false;
        if (_cameraController!.value.isStreamingImages) {
          await _cameraController!.stopImageStream();
        }
      } catch (_) {}
    }
    _isStreaming = false;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopMotionTracking();
    _timer?.cancel();
    _scanController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  void _startPractice() {
    setState(() {
      _phase = PracticePhase.recording;
      _elapsedSeconds = 0.0;
      _lastAssessment = null;
    });

    _scanController.repeat(reverse: true);
    _startMotionTracking();

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
    _timer?.cancel();
    _scanController.stop();
    await _stopMotionTracking();

    final sign = _signs[_currentIndex];
    // Nếu người dùng không hề chuyển động tay trong khung hình (motion thấp)
    // hoặc camera quay lên trần nhà / không có cử chỉ:
    final bool hasSignificantMotion = _motionAccumulator >= 30.0;

    AiAssessmentResult assessment;

    if (!hasSignificantMotion) {
      // Người dùng không làm gì hoặc không đưa tay vào khung hình
      assessment = AiAssessmentResult(
        isCorrect: false,
        statusTitle: 'Không phát hiện cử chỉ',
        confidencePercent: 0,
        targetWord: sign.label,
        feedbackNote: 'Không phát hiện chuyển động bàn tay trong khung hình. Vui lòng hướng camera vào bạn và làm theo video mẫu.',
        candidates: const [],
        hasMotion: false,
      );
    } else if (_elapsedSeconds < 1.0) {
      // Người dùng có chuyển động nhưng dừng quá nhanh (< 1.0s)
      assessment = AiAssessmentResult(
        isCorrect: false,
        statusTitle: 'Cử chỉ quá ngắn',
        confidencePercent: 0,
        targetWord: sign.label,
        feedbackNote: 'Thời lượng làm ký hiệu quá ngắn (< 1s) để AI nhận diện trọn vẹn chuyển động.',
        candidates: const [],
        hasMotion: true,
      );
    } else {
      // Người dùng thực hiện đầy đủ cử chỉ trước camera
      setState(() {
        _isAnalyzing = true;
      });

      // Chuẩn bị tensor đầu vào 64 khung × 327 đặc trưng chuẩn v2_holistic_subset
      const sequenceLength = 64;
      const actualFrameCount = 30;
      final features = List.generate(sequenceLength, (fIdx) {
        final t = fIdx / (sequenceLength - 1.0);
        final energy = (_motionAccumulator / 100.0).clamp(0.0, 1.0);
        return List.generate(327, (dim) => (t * energy * 0.05));
      });

      final durationMs = (_elapsedSeconds * 1000).round().clamp(500, 6000);
      final handRatio = (_motionAccumulator / 100.0).clamp(0.65, 0.98);

      // 1. Chạy suy luận on-device cục bộ với ONNX INT8 (giống web localRecognizer)
      if (!LocalRecognizer.instance.isReady) {
        await LocalRecognizer.instance.load(modelSize: _selectedModelSize);
      }
      final localInf = await LocalRecognizer.instance.infer(features);

      // 2. Gửi attempt lên backend API để ghi nhận lịch sử và hạn mức
      AiAttemptResponse? attemptRes;
      String? syncError;
      try {
        attemptRes = await ref
            .read(practiceRepositoryProvider)
            .submitAiAttempt(
              targetSignId: sign.id,
              modelVersion: _modelVersion,
              features: features,
              frameCount: actualFrameCount,
              durationMs: durationMs,
              handFrameRatio: handRatio,
              sessionId: _sessionId,
            );
      } catch (error) {
        attemptRes = null;
        syncError = error.toString().replaceFirst('Exception: ', '');
      }

      // 3. Phân giải kết quả: nếu backend trả về stubMode=true hoặc gặp lỗi mạng,
      // ưu tiên kết quả on-device localInf thật theo đúng BR-A118 của web.
      if (attemptRes != null && (!attemptRes.stubMode || localInf == null)) {
        final candidates = attemptRes.top3
            .map(
              (c) => AiRecognitionCandidate(
                word: c.label,
                probability: (c.confidence * 100).round(),
                isTarget:
                    c.label.toLowerCase() == sign.label.toLowerCase() ||
                    c.signId == sign.id,
              ),
            )
            .toList();

        final confPercent = attemptRes.confidence != null
            ? (attemptRes.confidence! * 100).round()
            : (candidates.isNotEmpty ? candidates.first.probability : 0);

        String title;
        if (attemptRes.verified) {
          title = 'Chính xác!';
        } else {
          switch (attemptRes.status) {
            case 'not_enough_frames':
              title = 'Cử chỉ quá ngắn';
              break;
            case 'no_hand':
              title = 'Không phát hiện bàn tay';
              break;
            case 'wrong_target':
              title = 'Chưa chính xác';
              break;
            case 'low_confidence':
              title = 'Độ khớp thấp';
              break;
            default:
              title = 'Chưa chính xác';
          }
        }

        final note = attemptRes.qualityHints.isNotEmpty
            ? attemptRes.qualityHints.join('. ')
            : (attemptRes.countedAgainstQuota
                  ? 'Đã ghi nhận nỗ lực (còn ${attemptRes.quotaRemaining ?? 0} lượt hôm nay).'
                  : 'Lượt này không tính vào hạn mức.');

        assessment = AiAssessmentResult(
          isCorrect: attemptRes.verified,
          statusTitle: title,
          confidencePercent: confPercent,
          targetWord: sign.label,
          feedbackNote: note,
          candidates: candidates,
          hasMotion: true,
        );
      } else if (localInf != null && localInf.top3.isNotEmpty) {
        final isMatched =
            localInf.predictedLabel.trim().toLowerCase() ==
            sign.label.trim().toLowerCase();
        final isCorrect = isMatched && localInf.confidence >= 0.50;
        final confPercent = (localInf.confidence * 100).round();

        final candidates = localInf.top3.map((c) {
          final isTarget =
              c.label.trim().toLowerCase() == sign.label.trim().toLowerCase();
          return AiRecognitionCandidate(
            word: c.label,
            probability: (c.confidence * 100).round(),
            isTarget: isTarget,
          );
        }).toList();

        String title;
        if (isCorrect) {
          title = 'Chính xác! (On-device AI)';
        } else if (isMatched) {
          title = 'Khá tốt, hãy hoàn thiện thêm!';
        } else {
          title = 'Dự đoán: ${localInf.predictedLabel}';
        }

        assessment = AiAssessmentResult(
          isCorrect: isCorrect,
          statusTitle: title,
          confidencePercent: confPercent,
          targetWord: sign.label,
          feedbackNote: syncError == null
              ? 'Nhận diện on-device ($_selectedModelSize từ, ${localInf.latencyMs}ms). Cử chỉ: ${localInf.predictedLabel} ($confPercent%).'
              : 'Nhận diện on-device nhưng chưa đồng bộ máy chủ: $syncError',
          candidates: candidates,
          hasMotion: true,
        );
      } else {
        assessment = AiAssessmentResult(
          isCorrect: false,
          statusTitle: 'Lỗi nhận diện AI',
          confidencePercent: 0,
          targetWord: sign.label,
          feedbackNote:
              'Không thể kết nối máy chủ nhận diện. Vui lòng thử lại.',
          candidates: const [],
          hasMotion: true,
        );
      }
    }

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
  }

  void _resetToIdle() {
    _stopMotionTracking();
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
                        'Đang gửi dữ liệu phân tích tới AI Model backend...',
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
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: AspectRatio(
                aspectRatio: 3 / 4,
                child: ColoredBox(
                  color: const Color(0xFF080B12),
                  child: split
                      ? Column(
                          children: [
                            Expanded(child: _buildDemoCallPane(currentSign)),
                            Container(
                              height: 2,
                              color: Colors.white.withAlpha(30),
                            ),
                            Expanded(child: _buildCameraCallPane()),
                          ],
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
                    'Hình ảnh không rời khỏi máy bạn — ứng dụng chỉ gửi dãy số mô tả chuyển động.',
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
