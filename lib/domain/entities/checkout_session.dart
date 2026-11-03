class CheckoutSession {
  const CheckoutSession({
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

  bool get isCompleted {
    final normalized = status?.toUpperCase();
    return normalized == 'PAID' ||
        normalized == 'SUCCESS' ||
        normalized == 'COMPLETED';
  }
}
