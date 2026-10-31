import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/core/network/dio_client.dart';
import 'package:sightlight_flutter/domain/entities/award.dart';
import 'package:sightlight_flutter/domain/entities/progress_stats.dart';
import 'package:sightlight_flutter/domain/repositories/gamification_repository.dart';
import 'package:sightlight_flutter/presentation/pages/shop_page.dart';
import 'package:sightlight_flutter/presentation/providers/gamification_provider.dart';

void main() {
  testWidgets(
    'ShopPage renders EXP balance, items grid, and confirmation dialog',
    (tester) async {
      const testStats = ProgressStats(
        expBalance: 250,
        aiBonusQuota: 5,
        freezeCount: 1,
      );

      final mockDio = Dio();
      mockDio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'result': {
                    'expBalance': 250,
                    'aiBonusQuota': 5,
                    'freezeCount': 1,
                    'items': null,
                    'ownedBadges': [],
                  },
                },
              ),
            );
          },
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            dioProvider.overrideWithValue(mockDio),
            progressStatsProvider.overrideWith(
              (ref) => _FakeProgressStatsNotifier(testStats),
            ),
          ],
          child: const MaterialApp(home: ShopPage()),
        ),
      );

      // Initial pump & render
      await tester.pumpAndSettle();

      // 1. EXP balance display at top
      expect(find.text('Cửa Hàng'), findsOneWidget);
      expect(find.text('Số dư EXP'), findsOneWidget);
      expect(find.text('250'), findsOneWidget);
      expect(find.text('Lượt Camera'), findsWidgets);
      expect(find.text('Băng streak'), findsOneWidget);

      // 2. Grid of items to exchange via GridView
      expect(find.byType(GridView), findsOneWidget);

      // 3. Each item has title, cost in EXP, and exchange button
      expect(find.text('+3 lượt luyện AI Camera'), findsOneWidget);
      expect(find.text('50 EXP'), findsOneWidget);
      expect(find.text('+10 lượt luyện AI Camera'), findsOneWidget);
      expect(find.text('130 EXP'), findsOneWidget);
      expect(find.text('Băng bảo vệ chuỗi Streak'), findsOneWidget);
      expect(find.text('100 EXP'), findsOneWidget);
      expect(find.text('Huy hiệu Đại sứ VSL'), findsOneWidget);
      expect(find.text('150 EXP'), findsOneWidget);
      expect(find.text('Huy hiệu Đôi tay kiên trì'), findsOneWidget);
      expect(find.text('200 EXP'), findsOneWidget);
      // Item costing 300 EXP is more than 250 EXP balance -> shows "Thiếu 50 EXP"
      expect(find.text('Thiếu 50 EXP'), findsOneWidget);

      // Check exchange button "Đổi ngay" exists
      final redeemButtons = find.text('Đổi ngay');
      expect(redeemButtons, findsWidgets);

      // Scroll until first "Đổi ngay" button is visible
      await tester.ensureVisible(redeemButtons.first);
      await tester.pumpAndSettle();

      // 4. Tap the first "Đổi ngay" button to open purchase confirmation dialog
      await tester.tap(redeemButtons.first);
      await tester.pumpAndSettle();

      // Purchase confirmation dialog verification
      expect(find.text('Xác nhận đổi vật phẩm'), findsOneWidget);
      expect(find.text('Chi phí:'), findsOneWidget);
      expect(find.text('Số dư hiện tại:'), findsOneWidget);
      expect(find.text('Số dư sau khi đổi:'), findsOneWidget);
      expect(find.text('Xác nhận đổi'), findsOneWidget);
      expect(find.text('Hủy'), findsOneWidget);

      // Dismiss dialog
      await tester.tap(find.text('Hủy'));
      await tester.pumpAndSettle();
      expect(find.text('Xác nhận đổi vật phẩm'), findsNothing);

      // 5. Test category filter: tap 'Bảo vệ Streak'
      await tester.ensureVisible(find.text('Bảo vệ Streak'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Bảo vệ Streak'));
      await tester.pumpAndSettle();

      expect(find.text('Băng bảo vệ chuỗi Streak'), findsOneWidget);
      expect(find.text('+3 lượt luyện AI Camera'), findsNothing);
      expect(find.text('Huy hiệu Đại sứ VSL'), findsNothing);

      // Switch back to 'Tất cả'
      await tester.ensureVisible(find.text('Tất cả'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Tất cả'));
      await tester.pumpAndSettle();

      expect(find.text('Băng bảo vệ chuỗi Streak'), findsOneWidget);
      expect(find.text('+3 lượt luyện AI Camera'), findsOneWidget);
    },
  );
}

class _FakeProgressStatsNotifier extends ProgressStatsNotifier {
  _FakeProgressStatsNotifier(ProgressStats stats)
    : super(_DummyGamificationRepository(stats)) {
    state = AsyncValue.data(stats);
  }
}

class _DummyGamificationRepository implements GamificationRepository {
  _DummyGamificationRepository(this.stats);

  final ProgressStats stats;

  @override
  Future<ProgressStats> getProgressOverview() async => stats;

  @override
  Future<List<ActivityDay>> getProgressActivity({int days = 7}) async => [];

  @override
  Future<List<BadgeItem>> getAwards() async => [];

  @override
  Future<void> celebrateAward(String code) async {}

  @override
  Future<void> freezeStreak() async {}
}
