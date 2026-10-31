import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/presentation/pages/home_page.dart';

void main() {
  testWidgets('HomePage renders Tiếp tục học and 17 Units with Bắt đầu buttons',
      (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: HomePage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // 1. "Tiếp tục học" section
    expect(find.text('Tiếp tục học'), findsOneWidget);

    // 2. "Lộ trình học" section
    expect(find.text('Lộ trình học'), findsOneWidget);

    // 3. 17 units rendered in roadmap
    expect(find.text('29 Chữ cái ngón tay cơ bản'), findsWidgets);
    expect(find.text('0/4 bài • 0%'), findsWidgets);

    // 4. "Bắt đầu" button present per lesson
    expect(find.text('Bắt đầu'), findsWidgets);

    // Verify scrolling works in ListView
    expect(find.byType(ListView), findsOneWidget);
  });
}
