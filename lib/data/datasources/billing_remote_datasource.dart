import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/billing/checkout_request.dart';
import '../models/billing/checkout_session_model.dart';
import '../models/transaction_response.dart';

class BillingRemoteDataSource {
  const BillingRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<CheckoutSessionModel>> createCheckout(
    CheckoutRequest request,
  ) async {
    final response = await _dio.post(
      ApiConstants.checkout,
      data: request.toJson(),
    );

    return TransactionResponse<CheckoutSessionModel>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => CheckoutSessionModel.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<Map<String, dynamic>>> verifyPayment(
    String orderCode,
  ) async {
    final response = await _dio.get(
      ApiConstants.billingVerify(orderCode),
    );

    return TransactionResponse<Map<String, dynamic>>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => (json as Map<String, dynamic>?) ?? <String, dynamic>{},
    );
  }
}
