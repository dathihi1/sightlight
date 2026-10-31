class TransactionResponse<T> {
  const TransactionResponse({
    this.requestId,
    required this.errorCode,
    this.errorMessage,
    this.result,
  });

  final String? requestId;
  final String errorCode;
  final String? errorMessage;
  final T? result;

  factory TransactionResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object?) fromJsonT,
  ) {
    return TransactionResponse<T>(
      requestId: json['requestId'] as String?,
      errorCode: (json['errorCode'] ?? '00000') as String,
      errorMessage: json['errorMessage'] as String?,
      result: json['result'] == null ? null : fromJsonT(json['result']),
    );
  }

  bool get isSuccess => errorCode == '00000';
  bool get isError => errorCode != '00000';
}
