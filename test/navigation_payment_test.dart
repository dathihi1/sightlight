import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/core/errors/app_exception.dart';
import 'package:sightlight_flutter/core/localization/app_localizations.dart';
import 'package:sightlight_flutter/core/theme/app_theme.dart';
import 'package:sightlight_flutter/data/models/billing/checkout_request.dart';
import 'package:sightlight_flutter/data/models/billing/checkout_session_model.dart';
import 'package:sightlight_flutter/domain/entities/checkout_session.dart';
import 'package:sightlight_flutter/domain/entities/plan.dart';

void main() {
  group('Billing and Payment Models', () {
    test('Plan default plans have 1 month, 6 months, and lifetime options', () {
      final plans = Plan.defaultPlans;
      expect(plans.length, 3);

      final plan1m = plans.firstWhere((p) => p.id == 'plan_1_month');
      expect(plan1m.durationMonths, 1);
      expect(plan1m.isPopular, isFalse);

      final plan6m = plans.firstWhere((p) => p.id == 'plan_6_months');
      expect(plan6m.durationMonths, 6);
      expect(plan6m.isPopular, isTrue);

      final planLifetime = plans.firstWhere((p) => p.id == 'plan_lifetime');
      expect(planLifetime.isLifetime, isTrue);
      expect(planLifetime.durationMonths, 0);
    });

    test('CheckoutRequest serializes properly to JSON', () {
      final req = CheckoutRequest(
        planId: 'plan_6_months',
        returnUrl: 'signlight://payment-return',
        cancelUrl: 'signlight://payment-return?cancel=true',
        requestId: 'req_123',
      );

      final json = req.toJson();
      expect(json['planId'], 'plan_6_months');
      expect(json['returnUrl'], 'signlight://payment-return');
      expect(json['cancelUrl'], 'signlight://payment-return?cancel=true');
      expect(json['requestId'], 'req_123');
    });

    test('CheckoutSessionModel correctly parses payOS backend response', () {
      final json = {
        'orderCode': 123456,
        'checkoutUrl': 'https://pay.payos.vn/web/test-url',
        'status': 'PENDING',
        'planId': 'plan_6_months',
        'amount': 299000,
        'qrCode': 'vietqr://...',
      };

      final model = CheckoutSessionModel.fromJson(json);
      expect(model.orderCode, 123456);
      expect(model.checkoutUrl, 'https://pay.payos.vn/web/test-url');
      expect(model.status, 'PENDING');
      expect(model.amount, 299000);

      final entity = model.toEntity();
      expect(entity, isA<CheckoutSession>());
      expect(entity.orderCode, 123456);
      expect(entity.checkoutUrl, 'https://pay.payos.vn/web/test-url');
    });

    test('CheckoutSessionModel parses nested data format gracefully', () {
      final nestedJson = {
        'data': {
          'orderCode': 987654,
          'paymentUrl': 'https://pay.payos.vn/web/nested-url',
          'status': 'PAID',
        }
      };

      final model = CheckoutSessionModel.fromJson(nestedJson);
      expect(model.orderCode, 987654);
      expect(model.checkoutUrl, 'https://pay.payos.vn/web/nested-url');
      expect(model.status, 'PAID');
    });
  });

  group('Localization and AppLocalizations', () {
    test('AppLocalizations returns Vietnamese strings for vi locale', () {
      final l10n = AppLocalizations(const Locale('vi'));
      expect(l10n.home, 'Trang chủ');
      expect(l10n.dictionary, 'Từ điển');
      expect(l10n.practice, 'Luyện tập');
      expect(l10n.profile, 'Cá nhân');
      expect(l10n.upgrade, 'Nâng cấp Premium');
      expect(l10n.payWithPayOS, 'Thanh toán qua payOS');
      expect(l10n.popular, 'Phổ biến nhất');
    });

    test('AppLocalizations returns English strings for en locale', () {
      final l10n = AppLocalizations(const Locale('en'));
      expect(l10n.home, 'Home');
      expect(l10n.dictionary, 'Dictionary');
      expect(l10n.practice, 'Practice');
      expect(l10n.profile, 'Profile');
      expect(l10n.upgrade, 'Upgrade Premium');
      expect(l10n.payWithPayOS, 'Pay with payOS');
      expect(l10n.popular, 'Most Popular');
    });
  });

  group('Theme Configurations', () {
    test('AppTheme generates light and dark ThemeData correctly', () {
      final light = AppTheme.lightTheme;
      final dark = AppTheme.darkTheme;

      expect(light.brightness, Brightness.light);
      expect(dark.brightness, Brightness.dark);
      expect(light.useMaterial3, isTrue);
      expect(dark.useMaterial3, isTrue);
    });
  });

  group('AppException Handling', () {
    test('NetworkException creates readable messages with error code', () {
      const exc = NetworkException('Network connection timeout', code: 'TIMEOUT');
      expect(exc.message, 'Network connection timeout');
      expect(exc.code, 'TIMEOUT');
      expect(exc.toString(), 'Network connection timeout');
    });
  });
}
