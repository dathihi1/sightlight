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
    final response = await _remoteDataSource.getPlans();
    if (response.isError) {
      throw Exception(response.errorMessage ?? 'Không thể tải bảng giá');
    }
    return response.result ?? const [];
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
      // Payment is trusted only when the backend confirms it.
      return false;
    }
  }
}
