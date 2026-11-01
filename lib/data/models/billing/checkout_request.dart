import 'package:uuid/uuid.dart';

class CheckoutRequest {
  const CheckoutRequest({
    required this.requestId,
    required this.planId,
    this.returnUrl,
    this.cancelUrl,
  });

  final String requestId;
  final String planId;
  final String? returnUrl;
  final String? cancelUrl;

  factory CheckoutRequest.create({
    required String planId,
    String? returnUrl,
    String? cancelUrl,
  }) {
    return CheckoutRequest(
      requestId: const Uuid().v4(),
      planId: planId,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
    );
  }

  Map<String, dynamic> toJson() => {'requestId': requestId, 'planId': planId};
}
