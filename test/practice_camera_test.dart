import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/presentation/pages/practice/practice_page.dart';

void main() {
  Widget createTestWidget() {
    return const ProviderScope(
      child: MaterialApp(
        home: PracticePage(),
      ),
    );
  }

  group('PracticePage Camera AI Redesign Tests', () {
    testWidgets('Renders single AI Camera Practice mode and "Bắt đầu luyện" button',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(createTestWidget());
      await tester.pump();

      // Verify camera page headers
      expect(find.text('Luyện Camera AI'), findsOneWidget);
      expect(find.textContaining('Luyện camera · 1/'), findsOneWidget);
      expect(find.textContaining('Làm ký hiệu'), findsOneWidget);

      // Verify sections
      expect(find.textContaining('Video mẫu'), findsOneWidget);
      expect(find.text('Camera của bạn'), findsOneWidget);
      expect(
        find.textContaining('Hình ảnh không rời khỏi máy bạn'),
        findsOneWidget,
      );

      // Verify single "Bắt đầu ký hiệu" button
      expect(find.text('Bắt đầu ký hiệu'), findsOneWidget);

      // Verify deprecated modes are completely absent
      expect(find.text('Luyện Từ vựng (Vocabulary Trainer)'), findsNothing);
      expect(find.text('Đánh vần Ngón tay (Fingerspell Practice)'), findsNothing);
      expect(find.text('Luyện Số đếm (Numbers Practice)'), findsNothing);
    });

    testWidgets('Tapping "Bắt đầu ký hiệu" starts camera recording and scoring flow',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(createTestWidget());
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
    });
  });
}
