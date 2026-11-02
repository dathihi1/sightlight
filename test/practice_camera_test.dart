import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/models/practice/practice_model.dart';
import 'package:sightlight_flutter/domain/repositories/practice_repository.dart';
import 'package:sightlight_flutter/presentation/pages/practice/practice_page.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';

void main() {
  test('low confidence still shows the word predicted by AI', () {
    const sign = PracticeSignItem(
      id: 'target-sign',
      label: 'Anh',
      topic: 'Gia đình',
      videoUrl: '',
      hint: '',
    );
    const attempt = AiAttemptResponse(
      attemptId: 'attempt-1',
      verified: false,
      status: 'low_confidence',
      confidence: 0.38,
      predictedSignId: 'predicted-sign',
      predictedLabel: 'Chị',
      top3: [],
    );

    final result = buildAiAssessment(attempt, sign);

    expect(result.statusTitle, 'Độ khớp thấp');
    expect(result.confidencePercent, 38);
    expect(result.candidates, hasLength(1));
    expect(result.candidates.single.word, 'Chị');
    expect(result.candidates.single.probability, 38);
    expect(result.candidates.single.isTarget, isFalse);
  });

  test('503 is shown as a friendly sync message without Dio internals', () {
    final request = RequestOptions(path: '/api/v1/ai/attempts');
    final error = DioException.badResponse(
      statusCode: 503,
      requestOptions: request,
      response: Response<Object>(requestOptions: request, statusCode: 503),
    );

    final message = friendlyPracticeNetworkError(error, syncing: true);

    expect(message, contains('máy chủ AI đang tạm bận'));
    expect(message, isNot(contains('DioException')));
    expect(message, isNot(contains('503')));
  });

  Widget createTestWidget({bool serverVideoEnabled = false}) {
    return ProviderScope(
      overrides: [
        practiceRepositoryProvider.overrideWithValue(_FakePracticeRepository()),
      ],
      child: MaterialApp(
        home: PracticePage(serverVideoEnabled: serverVideoEnabled),
      ),
    );
  }

  group('PracticePage Camera AI Redesign Tests', () {
    testWidgets(
      'Renders single AI Camera Practice mode and "Bắt đầu luyện" button',
      (tester) async {
        tester.view.physicalSize = const Size(1080, 2400);
        tester.view.devicePixelRatio = 2.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pump();

        // Verify camera page headers
        expect(find.text('Luyện Camera AI'), findsOneWidget);
        expect(find.textContaining('Luyện camera · 1/'), findsOneWidget);
        expect(find.textContaining('Làm ký hiệu'), findsOneWidget);

        // Verify sections
        expect(find.textContaining('Video mẫu'), findsWidgets);
        expect(find.text('Phòng luyện Camera AI'), findsOneWidget);
        expect(find.text('Bạn'), findsOneWidget);
        expect(find.text('Chia đôi'), findsOneWidget);
        expect(find.text('Khung nhỏ'), findsOneWidget);
        expect(find.text('Bật handmark video mẫu'), findsOneWidget);
        expect(find.textContaining('On-device chưa sẵn sàng'), findsOneWidget);

        await tester.ensureVisible(find.text('Bật handmark video mẫu'));
        await tester.tap(find.text('Bật handmark video mẫu'));
        await tester.pump();
        expect(find.text('Tắt handmark video mẫu'), findsOneWidget);

        // Verify single "Bắt đầu ký hiệu" button
        expect(find.text('Bắt đầu ký hiệu'), findsOneWidget);

        // The call stage can switch to camera-first picture-in-picture mode.
        await tester.tap(find.text('Khung nhỏ'));
        await tester.pump();
        expect(find.text('Mẫu'), findsOneWidget);

        // Verify deprecated modes are completely absent
        expect(find.text('Luyện Từ vựng (Vocabulary Trainer)'), findsNothing);
        expect(
          find.text('Đánh vần Ngón tay (Fingerspell Practice)'),
          findsNothing,
        );
        expect(find.text('Luyện Số đếm (Numbers Practice)'), findsNothing);
      },
    );

    testWidgets('Split layout matches web aspect ratio and equal heights', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump();

      final demoSize = tester.getSize(
        find.byKey(const ValueKey('split-demo-pane')),
      );
      final cameraSize = tester.getSize(
        find.byKey(const ValueKey('split-camera-pane')),
      );
      final demoPaneRect = tester.getRect(
        find.byKey(const ValueKey('split-demo-pane')),
      );
      final cameraPaneRect = tester.getRect(
        find.byKey(const ValueKey('split-camera-pane')),
      );
      final demoClipRect = tester.getRect(
        find.byKey(const ValueKey('split-demo-paint-clip')),
      );
      final cameraClipRect = tester.getRect(
        find.byKey(const ValueKey('split-camera-paint-clip')),
      );

      expect(demoSize.width, cameraSize.width);
      expect(demoSize.height, closeTo(cameraSize.height, 0.01));
      expect(demoSize.height, greaterThan(0));
      expect(demoSize.width / demoSize.height, closeTo(1, 0.01));
      expect(demoClipRect, demoPaneRect);
      expect(cameraClipRect, cameraPaneRect);
      expect(cameraPaneRect.top, closeTo(demoPaneRect.bottom + 2, 0.01));
    });

    testWidgets(
      'Does not fabricate a local score without MediaPipe landmarks',
      (tester) async {
        tester.view.physicalSize = const Size(1080, 2400);
        tester.view.devicePixelRatio = 2.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pump();

        // Tap start practice
        final startButton = find.text('Bắt đầu ký hiệu');
        expect(startButton, findsOneWidget);
        await tester.ensureVisible(startButton);
        await tester.tap(startButton);
        await tester.pump();

        expect(
          find.textContaining('Nhận diện trên thiết bị đang được hoàn thiện'),
          findsOneWidget,
        );
        expect(find.textContaining('Độ tin cậy'), findsNothing);
        expect(find.text('Bắt đầu ký hiệu'), findsOneWidget);
      },
    );

    testWidgets('Lets the user choose local or server video processing', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(createTestWidget(serverVideoEnabled: true));
      await tester.pump();
      await tester.pump();

      expect(find.text('Cách xử lý video'), findsOneWidget);
      expect(find.text('Trên thiết bị (đang hoàn thiện)'), findsOneWidget);
      expect(find.text('Trên server'), findsOneWidget);
      expect(
        tester
            .widget<ChoiceChip>(
              find.widgetWithText(
                ChoiceChip,
                'Trên thiết bị (đang hoàn thiện)',
              ),
            )
            .selected,
        isFalse,
      );
      expect(
        tester
            .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'Trên server'))
            .selected,
        isTrue,
      );
      expect(
        tester
            .widget<ChoiceChip>(
              find.widgetWithText(
                ChoiceChip,
                'Trên thiết bị (đang hoàn thiện)',
              ),
            )
            .onSelected,
        isNull,
      );
    });
  });
}

class _FakePracticeRepository implements PracticeRepository {
  @override
  Future<AiCapabilitiesResponse> getAiCapabilities({
    required int modelSize,
  }) async => AiCapabilitiesResponse(
    modelVersion: 'vsl-mvp${modelSize}_v2_lite_transformer',
    sequenceLength: 64,
    featureDim: 327,
    availableModelSizes: const [30, 400],
    stubMode: false,
  );

  @override
  Future<AiQuotaResponse> getAiQuota() async => const AiQuotaResponse(
    used: 0,
    limit: 10,
    remaining: 10,
    unlimited: false,
  );

  @override
  Future<AiPracticeSessionResponse> getAiPracticeSession({
    int size = 400,
    String? signId,
  }) async {
    return AiPracticeSessionResponse(
      sessionId: '00000000-0000-0000-0000-000000000001',
      modelVersion: 'vsl-mvp${size}_v2_lite_transformer',
      items: const [
        AiPracticeItem(
          signId: '00000000-0000-0000-0000-000000000002',
          label: 'Xin chào',
          topic: 'Chào hỏi',
          videoUrl: '',
        ),
      ],
    );
  }

  @override
  Future<AiAttemptResponse?> submitAiAttempt({
    required String targetSignId,
    required String modelVersion,
    required List<List<double>> features,
    required int frameCount,
    required int durationMs,
    required double handFrameRatio,
    required String sessionId,
  }) async => null;

  @override
  Future<AiAttemptResponse> submitVideoAttempt({
    required List<int> videoBytes,
    required String fileName,
    required String targetSignId,
    required String modelVersion,
    required String sessionId,
    required String requestId,
  }) async => const AiAttemptResponse(
    attemptId: 'video-attempt',
    verified: false,
    status: 'no_hand',
  );

  @override
  PracticeStats getPracticeStats() => const PracticeStats();

  @override
  Future<PracticeStats> recordSessionResult({
    required int answered,
    required int correct,
  }) async => const PracticeStats();

  @override
  Future<void> resetStats() async {}

  @override
  Future<FingerspellSession> getFingerspellSession() async =>
      const FingerspellSession(sessionId: '', items: []);

  @override
  Future<VocabularySession> getNumbersSession() async =>
      const VocabularySession(sessionId: '', items: []);

  @override
  Future<VocabularySession> getVocabularySession() async =>
      const VocabularySession(sessionId: '', items: []);

  @override
  Future<bool> submitFingerspellAttempt(PracticeAnswer answer) async => true;

  @override
  Future<bool> submitVocabularyAnswer(PracticeAnswer answer) async => true;
}
