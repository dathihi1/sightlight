import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/presentation/pages/referral_page.dart';

void main() {
  testWidgets(
    'ReferralPage renders all required sections matching web Mời bạn bè',
    (tester) async {
      final mockSummary = ReferralSummary(
        referralCode: 'SL123456',
        referralLink: 'https://signlight.vn/dang-ky?ref=SL123456',
        invitedCount: 2,
        targetCount: 5,
        canClaimReward: false,
        rewardClaimed: false,
        referredByCode: null,
        invitedFriends: [
          ReferralFriend(
            displayName: 'Nguyễn Văn A',
            maskedEmail: 'ng***@gmail.com',
            joinedAt: DateTime(2025, 2, 15),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            referralProvider.overrideWith(
              (ref) => _MockReferralNotifier(mockSummary),
            ),
          ],
          child: const MaterialApp(home: ReferralPage()),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Column with Cards check
      expect(find.byType(Card), findsWidgets);
      expect(find.byType(Column), findsWidgets);

      // 2. Referral link and code display
      expect(find.text('SL123456'), findsOneWidget);
      expect(
        find.text('https://signlight.vn/dang-ky?ref=SL123456'),
        findsOneWidget,
      );
      expect(find.text('MÃ GIỚI THIỆU CỦA BẠN'), findsOneWidget);
      expect(find.text('LIÊN KẾT MỜI NHANH (REFERRAL LINK)'), findsOneWidget);

      // 3. "Free badge" benefits section
      expect(
        find.text('Quyền lợi Huy hiệu & Thưởng (Free Badge)'),
        findsOneWidget,
      );
      expect(
        find.text('Huy hiệu Đại sứ SignLight độc quyền (Free Badge)'),
        findsOneWidget,
      );
      expect(find.text('Trọn vẹn 1 Tháng Premium miễn phí'), findsOneWidget);

      // 4. Invited friends count & progress
      expect(find.text('Tiến độ nhận gói Premium'), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (w) => w is RichText && w.text.toPlainText().contains('2 / 5 bạn bè'),
        ),
        findsOneWidget,
      );
      expect(find.text('Còn thiếu 3 bạn'), findsOneWidget);
      expect(find.text('Nguyễn Văn A'), findsOneWidget);

      // 5. Social share buttons
      expect(find.text('Facebook'), findsOneWidget);
      expect(find.text('Zalo'), findsOneWidget);
      expect(find.text('Messenger'), findsOneWidget);
      expect(find.text('Telegram'), findsOneWidget);

      // 6. Copy link button with feedback
      final copyLinkBtn = find.text('Sao chép link');
      expect(copyLinkBtn, findsOneWidget);
      await tester.ensureVisible(copyLinkBtn);
      await tester.pumpAndSettle();
      await tester.tap(copyLinkBtn);
      await tester.pump();

      // Feedback shows SnackBar and "Đã chép ✓"
      expect(find.text('Đã chép ✓'), findsOneWidget);
      expect(
        find.text('Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!'),
        findsOneWidget,
      );

      // Drain timer
      await tester.pump(const Duration(seconds: 2));
    },
  );
}

class _MockReferralNotifier extends StateNotifier<AsyncValue<ReferralSummary>>
    implements ReferralNotifier {
  _MockReferralNotifier(ReferralSummary data) : super(AsyncValue.data(data));

  @override
  Future<void> fetchSummary() async {}

  @override
  Future<String?> claimReferralCode(String code) async => null;

  @override
  Future<String?> claimReward() async => null;
}
