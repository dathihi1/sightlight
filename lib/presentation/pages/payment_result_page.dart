import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme/app_theme.dart';
import '../providers/billing_provider.dart';

class PaymentResultPage extends ConsumerStatefulWidget {
  const PaymentResultPage({
    super.key,
    this.orderCode,
    this.status,
    this.cancel,
  });

  final String? orderCode;
  final String? status;
  final String? cancel;

  @override
  ConsumerState<PaymentResultPage> createState() => _PaymentResultPageState();
}

class _PaymentResultPageState extends ConsumerState<PaymentResultPage> {
  bool _isVerifying = true;
  bool _isSuccess = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _processPaymentResult();
  }

  Future<void> _processPaymentResult() async {
    final isCancelled =
        widget.cancel == 'true' ||
        (widget.status?.toUpperCase() == 'CANCELLED');

    if (isCancelled) {
      if (mounted) {
        setState(() {
          _isVerifying = false;
          _isSuccess = false;
          _errorMessage = 'Giao dịch đã bị hủy bởi người dùng.';
        });
      }
      return;
    }

    final code = widget.orderCode;
    // Query parameters from payOS are never trusted. The backend status is the
    // only source of truth for granting Premium.
    if (code != null && code.isNotEmpty) {
      final billingNotifier = ref.read(billingStateProvider.notifier);
      final verified = await billingNotifier.verifyAndCompletePayment(code);

      if (mounted) {
        setState(() {
          _isVerifying = false;
          _isSuccess = verified;
          if (!verified) {
            _errorMessage = 'Không thể xác minh giao dịch. Nếu bạn đã chuyển khoản, hệ thống sẽ tự động cập nhật sau vài phút.';
          }
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _isVerifying = false;
        _isSuccess = false;
        _errorMessage = 'Thiếu mã đơn hàng nên chưa thể xác minh giao dịch. Vui lòng kiểm tra lại trong lịch sử thanh toán.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kết quả thanh toán'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _isVerifying
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 20),
                    Text(
                      'Đang xác thực giao dịch với payOS...',
                      style: theme.textTheme.bodyLarge,
                    ),
                  ],
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: _isSuccess
                            ? Colors.green.withAlpha(25)
                            : Colors.orange.withAlpha(25),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isSuccess
                            ? Icons.check_circle_rounded
                            : Icons.cancel_rounded,
                        size: 72,
                        color: _isSuccess ? Colors.green : Colors.orange,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      _isSuccess ? l10n.paymentSuccess : l10n.paymentCancel,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _isSuccess
                          ? l10n.paymentSuccessDesc
                          : (_errorMessage ?? l10n.paymentFailed),
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (widget.orderCode != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest
                              .withAlpha(50),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${l10n.orderCode}: #${widget.orderCode}',
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () => context.go('/'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isSuccess
                              ? AppTheme.primaryBlue
                              : theme.colorScheme.surfaceContainerHighest,
                          foregroundColor: _isSuccess
                              ? Colors.white
                              : theme.colorScheme.onSurface,
                        ),
                        child: Text(l10n.returnHome),
                      ),
                    ),
                    if (!_isSuccess) ...[
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () => context.go('/upgrade'),
                        child: const Text('Thử thanh toán lại'),
                      ),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}
