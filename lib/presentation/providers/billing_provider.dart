import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/dio_client.dart';
import '../../data/datasources/billing_remote_datasource.dart';
import '../../data/repositories/billing_repository_impl.dart';
import '../../domain/entities/checkout_session.dart';
import '../../domain/entities/plan.dart';
import '../../domain/repositories/billing_repository.dart';
import 'auth_provider.dart';

final billingRepositoryProvider = Provider<BillingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final remote = BillingRemoteDataSource(dio);
  return BillingRepositoryImpl(remote);
});

final plansProvider = FutureProvider<List<Plan>>((ref) async {
  final repository = ref.watch(billingRepositoryProvider);
  return repository.getPlans();
});

final selectedPlanProvider = StateProvider<Plan?>((ref) => null);

final billingStateProvider =
    StateNotifierProvider<BillingNotifier, AsyncValue<CheckoutSession?>>((ref) {
      final repository = ref.watch(billingRepositoryProvider);
      return BillingNotifier(repository, ref);
    });

class BillingNotifier extends StateNotifier<AsyncValue<CheckoutSession?>> {
  BillingNotifier(this._repository, this._ref)
    : super(const AsyncValue.data(null));

  final BillingRepository _repository;
  final Ref _ref;

  Future<CheckoutSession?> startCheckout({
    required String planId,
    String? returnUrl,
    String? cancelUrl,
  }) async {
    state = const AsyncValue.loading();
    try {
      final session = await _repository.createCheckout(
        planId: planId,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      );
      state = AsyncValue.data(session);

      if (session.isCompleted) {
        // Gói Tri Ân 0đ được backend kích hoạt trực tiếp, không mở
        // payOS. Cập nhật ngay tài khoản mobile để giao diện không
        // tiếp tục hiển thị gói Free sau khi nhận thành công.
        _ref.read(authStateProvider.notifier).updatePremiumStatus(true);
      } else if (session.checkoutUrl.isNotEmpty) {
        await openPayOS(session.checkoutUrl);
      }
      return session;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return null;
    }
  }

  Future<bool> openPayOS(String checkoutUrl) async {
    final uri = Uri.tryParse(checkoutUrl);
    if (uri == null) return false;
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<bool> verifyAndCompletePayment(String orderCode) async {
    try {
      final isSuccess = await _repository.verifyPayment(orderCode: orderCode);
      if (isSuccess) {
        _ref.read(authStateProvider.notifier).updatePremiumStatus(true);
      }
      return isSuccess;
    } catch (_) {
      return false;
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}
