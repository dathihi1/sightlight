import '../entities/checkout_session.dart';
import '../entities/plan.dart';

abstract interface class BillingRepository {
  Future<List<Plan>> getPlans();
  Future<CheckoutSession> createCheckout({
    required String planId,
    String? returnUrl,
    String? cancelUrl,
  });
  Future<bool> verifyPayment({required String orderCode});
}
