import '../../domain/entities/checkout_session.dart';
import '../../domain/entities/plan.dart';
import '../../domain/repositories/billing_repository.dart';
import '../datasources/billing_remote_datasource.dart';
import '../models/billing/checkout_request.dart';

class BillingRepositoryImpl implements BillingRepository {
  const BillingRepositoryImpl(this._remoteDataSource);

  final BillingRemoteDataSource _remoteDataSource;

  @override
  Future<List<Plan>> getPlans() async {
    // In production, can fetch dynamic pricing from backend; fallback to standard plans
    return Plan.defaultPlans;
  }

  @override
  Future<CheckoutSession> createCheckout({
    required String planId,
    String? returnUrl,
    String? cancelUrl,
  }) async {
    final request = CheckoutRequest.create(
      planId: planId,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
    );

    final response = await _remoteDataSource.createCheckout(request);

    if (response.isError || response.result == null) {
      throw Exception(
        response.errorMessage ?? 'Không thể khởi tạo phiên thanh toán',
      );
    }

    return response.result!.toEntity();
  }

  @override
  Future<bool> verifyPayment({required String orderCode}) async {
    try {
      final response = await _remoteDataSource.verifyPayment(orderCode);
      if (response.isError) {
        return false;
      }
      final data = response.result;
      if (data == null) return false;
      final status = (data['status'] ?? '').toString().toUpperCase();
      return status == 'PAID' || status == 'SUCCESS' || status == 'COMPLETED';
    } catch (_) {
      // If endpoint returns network issue or 404, check query parameter fallback in UI
      return false;
    }
  }
}
