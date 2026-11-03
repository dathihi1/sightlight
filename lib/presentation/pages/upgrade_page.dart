import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/errors/error_dialog.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/plan.dart';
import '../providers/auth_provider.dart';
import '../providers/billing_provider.dart';

class UpgradePage extends ConsumerStatefulWidget {
  const UpgradePage({super.key});

  @override
  ConsumerState<UpgradePage> createState() => _UpgradePageState();
}

class _UpgradePageState extends ConsumerState<UpgradePage> {
  String _selectedPlanId = '';
  final _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  Future<void> _handleCheckout() async {
    if (_selectedPlanId.isEmpty) return;
    final billingNotifier = ref.read(billingStateProvider.notifier);

    // Deep link return URL for payOS
    const returnUrl = 'signlight://payment-return';
    const cancelUrl = 'signlight://payment-return?cancel=true';

    final session = await billingNotifier.startCheckout(
      planId: _selectedPlanId,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
    );

    if (session == null && mounted) {
      final billingState = ref.read(billingStateProvider);
      final errorMsg =
          billingState.error?.toString() ??
          'Không thể khởi tạo phiên thanh toán qua payOS';
      showGlobalErrorDialog(
        context,
        title: 'Lỗi thanh toán',
        message: errorMsg.replaceAll('Exception: ', ''),
      );
    } else if (session != null && session.isCompleted && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Gói Tri Ân đã được kích hoạt. Cảm ơn bạn đã đồng hành cùng SignLight!',
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authStateProvider);
    final user = authState.value;
    final isPremium = user?.isPremium ?? false;
    final plansAsync = ref.watch(plansProvider);
    final billingState = ref.watch(billingStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.upgrade),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Lỗi tải gói đăng ký: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.refresh(plansProvider),
                child: Text(l10n.retry),
              ),
            ],
          ),
        ),
        data: (plans) {
          final effectivePlans = plans;
          if (effectivePlans.isNotEmpty &&
              !effectivePlans.any((plan) => plan.id == _selectedPlanId)) {
            _selectedPlanId = effectivePlans.first.id;
          }

          if (effectivePlans.isEmpty) {
            return Center(child: Text('Hiện chưa có gói Premium nào đang mở.'));
          }

          final selectedPlan = effectivePlans.firstWhere(
            (plan) => plan.id == _selectedPlanId,
            orElse: () => effectivePlans.first,
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Banner
                _buildHeaderBanner(context, isPremium),
                const SizedBox(height: 24),

                if (isPremium) ...[
                  _buildAlreadyPremiumCard(context),
                  const SizedBox(height: 24),
                ],

                // Title
                Text(
                  l10n.choosePlan,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),

                // Plan Cards
                RadioGroup<String>(
                  groupValue: _selectedPlanId,
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedPlanId = val);
                  },
                  child: Column(
                    children: effectivePlans.map((plan) {
                      final isSelected = _selectedPlanId == plan.id;
                      return _buildPlanCard(context, plan, isSelected);
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 20),

                // Features Checklist
                _buildFeaturesList(context),

                const SizedBox(height: 24),

                // Checkout Button
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: billingState.isLoading ? null : _handleCheckout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryBlue,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: billingState.isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                selectedPlan.isFree
                                    ? Icons.card_giftcard_rounded
                                    : Icons.lock_outline_rounded,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                selectedPlan.isFree
                                    ? 'Nhận gói Tri Ân miễn phí'
                                    : l10n.payWithPayOS,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 12),
                Center(
                  child: Text(
                    'Thanh toán an toàn bảo mật qua cổng VietQR / payOS',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderBanner(BuildContext context, bool isPremium) {
    final l10n = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withAlpha(60),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.premiumGold,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.workspace_premium,
                      color: Colors.black,
                      size: 16,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'PREMIUM',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (isPremium)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(50),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    l10n.premiumActive,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            l10n.upgradeTitle,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.upgradeSubtitle,
            style: TextStyle(color: Colors.white.withAlpha(220), fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildAlreadyPremiumCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.shade300),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tài khoản đang có gói Premium',
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Text(
                  'Bạn đã có toàn quyền truy cập toàn bộ bài học và tính năng AI.',
                  style: TextStyle(color: Colors.green.shade800, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(BuildContext context, Plan plan, bool isSelected) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedPlanId = plan.id;
          });
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primary.withAlpha(15)
                : theme.cardTheme.color,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.dividerColor.withAlpha(80),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Radio<String>(value: plan.id),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (plan.isAppreciation ||
                        plan.isPopular ||
                        plan.isLifetime) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (plan.isAppreciation)
                            _buildPlanTag(
                              'TRI ÂN 0Đ',
                              Colors.green.shade100,
                              Colors.green.shade900,
                            ),
                          if (plan.isPopular)
                            _buildPlanTag(
                              l10n.popular,
                              Colors.orange.shade100,
                              Colors.orange.shade900,
                            ),
                          if (plan.isLifetime)
                            _buildPlanTag(
                              l10n.lifetime,
                              Colors.purple.shade100,
                              Colors.purple.shade900,
                            ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      plan.description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      plan.isFree
                          ? 'Miễn phí'
                          : _currencyFormat.format(plan.price),
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: plan.isFree
                            ? Colors.green.shade700
                            : theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanTag(String label, Color background, Color foreground) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildFeaturesList(BuildContext context) {
    final theme = Theme.of(context);
    final features = [
      'Nhận diện cử chỉ tay thời gian thực bằng camera AI',
      'Kho từ điển chuẩn video độ nét cao',
      'Lộ trình học cá nhân hóa theo tiến độ thực tế',
      'Tải bài học và từ điển xem ngoại tuyến',
      'Không giới hạn lượt làm bài tập hàng ngày',
      'Hỗ trợ giải đáp chuyên sâu 24/7',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withAlpha(60),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quyền lợi thành viên Premium',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...features.map(
            (feat) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.green,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(feat, style: theme.textTheme.bodyMedium),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
