import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../models/billing/checkout_request.dart';
import '../models/billing/checkout_session_model.dart';
import '../models/transaction_response.dart';
import '../../domain/entities/plan.dart';

class BillingRemoteDataSource {
  const BillingRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<List<Plan>>> getPlans() async {
    final response = await _dio.get(ApiConstants.billingPlans);
    return TransactionResponse<List<Plan>>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => (json as List<dynamic>)
          .map((item) {
            final map = item as Map<String, dynamic>;
            final description = map['description']?.toString() ?? '';
            final durationDays = (map['durationDays'] as num?)?.toInt() ?? 0;
            return Plan(
              id: map['id']?.toString() ?? '',
              name: map['name']?.toString() ?? '',
              description: description,
              price: (map['priceVnd'] as num?)?.toInt() ?? 0,
              durationMonths: durationDays <= 0
                  ? 0
                  : (durationDays / 30).ceil(),
              features: description.isEmpty ? const [] : [description],
              isLifetime: durationDays <= 0,
            );
          })
          .where((plan) => plan.id.isNotEmpty)
          .toList(),
    );
  }

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
    final response = await _dio.get(ApiConstants.billingStatus(orderCode));

    return TransactionResponse<Map<String, dynamic>>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => (json as Map<String, dynamic>?) ?? <String, dynamic>{},
    );
  }
}
