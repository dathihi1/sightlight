import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/main.dart';

void main() {
  testWidgets('App initializes and renders SplashPage smoke test', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // Initial frame renders SplashPage with app branding
    expect(find.text('SignLight'), findsOneWidget);

    // Pump a single frame after delay without waiting indefinitely for CircularProgressIndicator animation
    await tester.pump(const Duration(milliseconds: 1500));
  });
}
