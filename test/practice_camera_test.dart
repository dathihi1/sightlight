import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/models/practice/practice_model.dart';
import 'package:sightlight_flutter/domain/repositories/practice_repository.dart';
import 'package:sightlight_flutter/presentation/pages/practice/practice_page.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';

void main() {
  Widget createTestWidget() {
    return ProviderScope(
      overrides: [
        practiceRepositoryProvider.overrideWithValue(_FakePracticeRepository()),
      ],
      child: const MaterialApp(home: PracticePage()),
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
        expect(
          find.textContaining('Hình ảnh không rời khỏi máy bạn'),
          findsOneWidget,
        );

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

    testWidgets(
      'Tapping "Bắt đầu ký hiệu" starts camera recording and scoring flow',
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

        // Should now show recording state with stop button
        final stopButton = find.textContaining('Dừng & Chấm điểm');
        expect(stopButton, findsOneWidget);
        expect(find.textContaining('Đang ghi'), findsOneWidget);

        // Tap stop & score
        await tester.ensureVisible(stopButton);
        await tester.tap(stopButton);
        await tester.pump();

        // Should now show scored state
        expect(find.textContaining('Không phát hiện cử chỉ'), findsOneWidget);
        expect(find.textContaining('Độ tin cậy'), findsOneWidget);
        final nextButton = find.text('Từ tiếp theo');
        expect(find.text('Luyện lại'), findsOneWidget);
        expect(nextButton, findsOneWidget);

        // Tap next sign
        await tester.ensureVisible(nextButton);
        await tester.tap(nextButton);
        await tester.pump();

        // Returns to idle state ready for next sign
        expect(find.text('Bắt đầu ký hiệu'), findsOneWidget);
      },
    );
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
