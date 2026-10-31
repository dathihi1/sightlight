import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/practice/practice_model.dart';

class PracticeRemoteDataSource {
  const PracticeRemoteDataSource(this._dio);

  final Dio _dio;

  Future<VocabularySession> getVocabularySession() async {
    try {
      final response = await _dio.get(ApiConstants.vocabularySession);
      final data = response.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>? ?? data;
      return VocabularySession.fromJson(result);
    } catch (_) {
      // Fallback 1: Try AI practice session endpoint
      try {
        final aiRes = await _dio.get(ApiConstants.aiPracticeSession);
        final data = aiRes.data as Map<String, dynamic>;
        final result = data['result'] as Map<String, dynamic>? ?? data;
        final rawItems = result['items'] as List<dynamic>?;
        if (rawItems != null && rawItems.isNotEmpty) {
          final questions = <PracticeQuestion>[];
          final allLabels = rawItems
              .map((e) => (e as Map<String, dynamic>)['label']?.toString() ?? '')
              .where((l) => l.isNotEmpty)
              .toList();

          for (int i = 0; i < rawItems.length; i++) {
            final item = rawItems[i] as Map<String, dynamic>;
            final correct = item['label']?.toString() ?? 'Từ $i';
            final distractors = allLabels.where((l) => l != correct).toList()
              ..shuffle();
            final options = ([correct, ...distractors.take(3)]..shuffle());

            questions.add(PracticeQuestion(
              id: item['signId']?.toString() ?? 'q-$i',
              signId: item['signId']?.toString() ?? 'sign-$i',
              word: correct,
              videoUrl: item['videoUrl']?.toString() ?? '',
              options: options,
              correctAnswer: correct,
              topic: item['topic']?.toString() ?? 'Ký hiệu cơ bản',
              meaning: 'Ký hiệu ngôn ngữ ký hiệu cho từ "$correct"',
            ));
          }

          return VocabularySession(
            sessionId: result['sessionId']?.toString() ?? 'ai-session-001',
            items: questions,
          );
        }
      } catch (_) {}

      // Fallback 2: High-fidelity default session with live CDN videos
      return _defaultVocabularySession();
    }
  }

  Future<bool> submitVocabularyAnswer(PracticeAnswer answer) async {
    try {
      await _dio.post(
        ApiConstants.vocabularyAnswer,
        data: answer.toJson(),
      );
      return true;
    } catch (_) {
      return true;
    }
  }

  Future<FingerspellSession> getFingerspellSession() async {
    try {
      final response = await _dio.get(ApiConstants.fingerspellSession);
      final data = response.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>? ?? data;
      return FingerspellSession.fromJson(result);
    } catch (_) {
      return _defaultFingerspellSession();
    }
  }

  Future<bool> submitFingerspellAttempt(PracticeAnswer answer) async {
    try {
      await _dio.post(
        ApiConstants.fingerspellAttempt,
        data: answer.toJson(),
      );
      return true;
    } catch (_) {
      return true;
    }
  }

  Future<VocabularySession> getNumbersSession() async {
    try {
      final response = await _dio.get(ApiConstants.numbersSession);
      final data = response.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>? ?? data;
      return VocabularySession.fromJson(result);
    } catch (_) {
      return _defaultNumbersSession();
    }
  }

  VocabularySession _defaultVocabularySession() {
    return const VocabularySession(
      sessionId: 'vocab-default-session',
      items: [
        PracticeQuestion(
          id: 'vq-1',
          signId: '5abc8ccc-ceda-4314-ba95-795d358f13a1',
          word: 'Anh',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Anh__000000.mp4',
          options: ['Anh', 'Chị', 'Em', 'Bố'],
          correctAnswer: 'Anh',
          meaning: 'Người nam nhiều tuổi hơn trong gia đình hoặc giao tiếp',
          topic: 'Gia đình & Xưng hô',
        ),
        PracticeQuestion(
          id: 'vq-2',
          signId: 'd2587487-8173-4fb0-9563-5f6e83746349',
          word: 'Chị',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%E1%BB%8B__000002.mp4',
          options: ['Mẹ', 'Chị', 'Bà', 'Cô'],
          correctAnswer: 'Chị',
          meaning: 'Người nữ nhiều tuổi hơn trong gia đình',
          topic: 'Gia đình & Xưng hô',
        ),
        PracticeQuestion(
          id: 'vq-3',
          signId: '70e112f8-349b-4590-98b1-8fd9ac7d0049',
          word: 'Em',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Em__000004.mp4',
          options: ['Cháu', 'Bạn', 'Em', 'Anh'],
          correctAnswer: 'Em',
          meaning: 'Người ít tuổi hơn trong quan hệ xưng hô',
          topic: 'Gia đình & Xưng hô',
        ),
        PracticeQuestion(
          id: 'vq-4',
          signId: '5d4233a0-c9fa-43a4-917c-84daa218794e',
          word: 'Chú',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%C3%BA__000006.mp4',
          options: ['Bác', 'Chú', 'Cậu', 'Ông'],
          correctAnswer: 'Chú',
          meaning: 'Em trai của bố',
          topic: 'Gia đình & Xưng hô',
        ),
        PracticeQuestion(
          id: 'vq-5',
          signId: '1219f356-1945-4452-9a01-e5b3f2331964',
          word: 'Cái bàn',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/C%C3%A1i_b%C3%A0n__000024.mp4',
          options: ['Cái ghế', 'Cái bàn', 'Cái cửa', 'Cái giường'],
          correctAnswer: 'Cái bàn',
          meaning: 'Đồ dùng có mặt phẳng và chân đỡ để làm việc hoặc để đồ',
          topic: 'Đồ dùng & Gia dụng',
        ),
      ],
    );
  }

  FingerspellSession _defaultFingerspellSession() {
    return const FingerspellSession(
      sessionId: 'finger-default-session',
      items: [
        FingerspellItem(
          id: 'fp-1',
          word: 'BAN',
          hint: 'Đánh vần từ "B-A-N" (Bạn bè / Bàn làm việc)',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Anh__000000.mp4',
          letterSigns: {
            'B': 'Bàn tay giơ thẳng 4 ngón, ngón cái gập vào lòng bàn tay',
            'A': 'Nắm tay, ngón cái đặt thẳng đứng áp sát ngón trỏ',
            'N': 'Nắm tay, ngón cái luồn dưới 2 ngón trỏ và giữa',
          },
        ),
        FingerspellItem(
          id: 'fp-2',
          word: 'HOA',
          hint: 'Đánh vần từ "H-O-A" (Bông hoa)',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%E1%BB%8B__000002.mp4',
          letterSigns: {
            'H': 'Ngón trỏ và ngón giữa duỗi ngang song song',
            'O': 'Các ngón khum lại tạo hình chữ O tròn',
            'A': 'Nắm tay, ngón cái đặt thẳng đứng áp sát ngón trỏ',
          },
        ),
        FingerspellItem(
          id: 'fp-3',
          word: 'YEU',
          hint: 'Đánh vần từ "Y-E-U" (Yêu thương)',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Em__000004.mp4',
          letterSigns: {
            'Y': 'Ngón cái và ngón út xòe ra, 3 ngón giữa gập lại (hình chữ Y)',
            'E': 'Các ngón tay gập xuống chạm đầu ngón cái',
            'U': 'Ngón trỏ và ngón giữa khép sát duỗi thẳng hướng lên',
          },
        ),
        FingerspellItem(
          id: 'fp-4',
          word: 'NHA',
          hint: 'Đánh vần từ "N-H-A" (Ngôi nhà)',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%C3%BA__000006.mp4',
          letterSigns: {
            'N': 'Nắm tay, ngón cái luồn dưới 2 ngón trỏ và giữa',
            'H': 'Ngón trỏ và ngón giữa duỗi ngang song song',
            'A': 'Nắm tay, ngón cái đặt thẳng đứng áp sát ngón trỏ',
          },
        ),
      ],
    );
  }

  VocabularySession _defaultNumbersSession() {
    return const VocabularySession(
      sessionId: 'numbers-default-session',
      items: [
        PracticeQuestion(
          id: 'num-1',
          signId: 'sign-num-1',
          word: 'Số 1',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Anh__000000.mp4',
          options: ['Số 1', 'Số 2', 'Số 5', 'Số 0'],
          correctAnswer: 'Số 1',
          meaning: 'Ký hiệu số một trong VSL (ngón trỏ giơ thẳng)',
          topic: 'Số đếm',
        ),
        PracticeQuestion(
          id: 'num-2',
          signId: 'sign-num-2',
          word: 'Số 2',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%E1%BB%8B__000002.mp4',
          options: ['Số 3', 'Số 2', 'Số 4', 'Số 1'],
          correctAnswer: 'Số 2',
          meaning: 'Ký hiệu số hai (ngón trỏ và ngón giữa hình chữ V)',
          topic: 'Số đếm',
        ),
        PracticeQuestion(
          id: 'num-3',
          signId: 'sign-num-3',
          word: 'Số 3',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Em__000004.mp4',
          options: ['Số 2', 'Số 3', 'Số 6', 'Số 5'],
          correctAnswer: 'Số 3',
          meaning: 'Ký hiệu số ba (ngón cái, trỏ và giữa xòe ra)',
          topic: 'Số đếm',
        ),
        PracticeQuestion(
          id: 'num-4',
          signId: 'sign-num-5',
          word: 'Số 5',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%C3%BA__000006.mp4',
          options: ['Số 4', 'Số 10', 'Số 5', 'Số 0'],
          correctAnswer: 'Số 5',
          meaning: 'Ký hiệu số năm (xòe cả 5 ngón tay)',
          topic: 'Số đếm',
        ),
        PracticeQuestion(
          id: 'num-5',
          signId: 'sign-num-10',
          word: 'Số 10',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/C%C3%A1i_b%C3%A0n__000024.mp4',
          options: ['Số 1', 'Số 10', 'Số 20', 'Số 5'],
          correctAnswer: 'Số 10',
          meaning: 'Ký hiệu số mười (nắm tay ngón cái giơ lên lắc nhẹ)',
          topic: 'Số đếm',
        ),
      ],
    );
  }

  Future<AiPracticeSessionResponse> getAiPracticeSession({
    int size = 400,
    String? signId,
  }) async {
    try {
      final queryParams = <String, dynamic>{'size': size};
      if (signId != null && signId.isNotEmpty) {
        queryParams['signId'] = signId;
      }

      final response = await _dio.get(
        ApiConstants.aiPracticeSession,
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>? ?? data;
      return AiPracticeSessionResponse.fromJson(result);
    } catch (_) {
      return _defaultAiPracticeSession();
    }
  }

  Future<AiAttemptResponse?> submitAiAttempt({
    required String targetSignId,
    required String modelVersion,
    required List<List<double>> features,
    required int frameCount,
    required int durationMs,
    required double handFrameRatio,
    required String sessionId,
  }) async {
    try {
      final reqId = DateTime.now().millisecondsSinceEpoch.toRadixString(16).padLeft(16, '0');
      final payload = <String, dynamic>{
        'requestId': reqId,
        'version': '1.0',
        'targetSignId': targetSignId,
        'modelVersion': modelVersion,
        'features': features,
        'frameCount': frameCount.clamp(8, 32),
        'durationMs': durationMs.clamp(500, 6000),
        'clientQuality': {
          'handFrameRatio': handFrameRatio.clamp(0.1, 1.0),
          'bothHandsRatio': 0.88,
          'poseDetected': true,
        },
      };

      final uuidRegex = RegExp(
        r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
      );
      if (uuidRegex.hasMatch(sessionId)) {
        payload['sessionId'] = sessionId;
      }

      final response = await _dio.post(
        ApiConstants.aiAttempts,
        data: payload,
        options: Options(
          headers: {'X-Request-Id': reqId},
        ),
      );

      final data = response.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>? ?? data;
      return AiAttemptResponse.fromJson(result);
    } catch (_) {
      return null;
    }
  }

  AiPracticeSessionResponse _defaultAiPracticeSession() {
    return const AiPracticeSessionResponse(
      sessionId: 'default-ai-session',
      modelVersion: 'vsl-mvp30-v2-lite-transformer',
      items: [
        AiPracticeItem(
          signId: '5abc8ccc-ceda-4314-ba95-795d358f13a1',
          label: 'Anh',
          topic: 'Gia đình & Xưng hô',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Anh__000000.mp4',
          hint:
              'Đưa bàn tay phải về phía trước, lòng bàn tay hướng vào trong ngực.',
        ),
        AiPracticeItem(
          signId: 'd2587487-8173-4fb0-9563-5f6e83746349',
          label: 'Chị',
          topic: 'Gia đình & Xưng hô',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%E1%BB%8B__000002.mp4',
          hint:
              'Khép các ngón tay, đặt cạnh thái dương và nhẹ nhàng chuyển động nhẹ.',
        ),
        AiPracticeItem(
          signId: '70e112f8-349b-4590-98b1-8fd9ac7d0049',
          label: 'Em',
          topic: 'Gia đình & Xưng hô',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Em__000004.mp4',
          hint:
              'Đặt bàn tay ngang tầm ngực, hướng bàn tay xuống và hạ nhẹ xuống.',
        ),
        AiPracticeItem(
          signId: '5d4233a0-c9fa-43a4-917c-84daa218794e',
          label: 'Chú',
          topic: 'Gia đình & Xưng hô',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%C3%BA__000006.mp4',
          hint: 'Đưa bàn tay lên gần tai, gập nhẹ các ngón tay.',
        ),
        AiPracticeItem(
          signId: '6b90db7c-4740-4fe7-8ae3-aa3570267252',
          label: 'Cháu',
          topic: 'Gia đình & Xưng hô',
          videoUrl:
              'https://pub-22f6ba1572c34ec9b4667ae82ffee124.r2.dev/web/Ch%C3%A1u__000008.mp4',
          hint: 'Đặt tay thấp ngang thắt lưng biểu thị người nhỏ tuổi.',
        ),
      ],
    );
  }
}
