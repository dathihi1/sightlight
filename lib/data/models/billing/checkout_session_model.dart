import '../../../domain/entities/checkout_session.dart';

class CheckoutSessionModel {
  const CheckoutSessionModel({
    required this.checkoutUrl,
    required this.orderCode,
    this.status,
    this.planId,
    this.amount,
  });

  final String checkoutUrl;
  final int orderCode;
  final String? status;
  final String? planId;
  final int? amount;

  factory CheckoutSessionModel.fromJson(Map<String, dynamic> json) {
    final payload = (json['data'] is Map<String, dynamic>)
        ? json['data'] as Map<String, dynamic>
        : json;

    final url = (payload['checkoutUrl'] ??
            payload['paymentUrl'] ??
            payload['returnUrl'] ??
            payload['url'] ??
            '') as String;
    final codeRaw = payload['orderCode'] ?? payload['orderId'] ?? 0;
    final code =
        codeRaw is int ? codeRaw : int.tryParse(codeRaw.toString()) ?? 0;

    return CheckoutSessionModel(
      checkoutUrl: url,
      orderCode: code,
      status: payload['status'] as String?,
      planId: payload['planId'] as String?,
      amount: payload['amount'] as int?,
    );
  }

  CheckoutSession toEntity() => CheckoutSession(
        checkoutUrl: checkoutUrl,
        orderCode: orderCode,
        status: status,
        planId: planId,
        amount: amount,
      );
}
