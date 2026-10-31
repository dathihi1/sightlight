import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../providers/gamification_provider.dart';

/// Data model representing a shop item available for exchange
class ShopItem {
  const ShopItem({
    required this.itemKey,
    required this.itemType,
    required this.title,
    required this.description,
    required this.costExp,
    this.isOwned = false,
    this.imageUrl,
    this.icon,
  });

  final String itemKey;
  final String itemType;
  final String title;
  final String description;
  final int costExp;
  final bool isOwned;
  final String? imageUrl;
  final IconData? icon;

  ShopItem copyWith({
    String? itemKey,
    String? itemType,
    String? title,
    String? description,
    int? costExp,
    bool? isOwned,
    String? imageUrl,
    IconData? icon,
  }) {
    return ShopItem(
      itemKey: itemKey ?? this.itemKey,
      itemType: itemType ?? this.itemType,
      title: title ?? this.title,
      description: description ?? this.description,
      costExp: costExp ?? this.costExp,
      isOwned: isOwned ?? this.isOwned,
      imageUrl: imageUrl ?? this.imageUrl,
      icon: icon ?? this.icon,
    );
  }

  factory ShopItem.fromJson(Map<String, dynamic> json) {
    return ShopItem(
      itemKey: json['itemKey'] as String? ?? '',
      itemType: json['itemType'] as String? ?? 'CONSUMABLE',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      costExp: (json['costExp'] as num?)?.toInt() ?? 0,
      isOwned: json['isOwned'] as bool? ?? false,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

class ShopPage extends ConsumerStatefulWidget {
  const ShopPage({super.key});

  @override
  ConsumerState<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends ConsumerState<ShopPage> {
  bool _isLoading = false;
  bool _isRedeeming = false;
  String _selectedCategory = 'ALL';
  int? _localExpBalance;
  int? _localAiBonusQuota;
  int? _localFreezeCount;

  // Default initial catalog matching backend & web store definitions
  static const List<ShopItem> _initialCatalog = [
    ShopItem(
      itemKey: 'AI_BONUS_3',
      itemType: 'AI_QUOTA',
      title: '+3 lượt luyện AI Camera',
      description: 'Thêm 3 lượt chấm Camera AI sau khi dùng hết hạn mức miễn phí trong ngày.',
      costExp: 50,
      icon: Icons.videocam_rounded,
    ),
    ShopItem(
      itemKey: 'AI_BONUS_10',
      itemType: 'AI_QUOTA',
      title: '+10 lượt luyện AI Camera',
      description: 'Gói tiết kiệm thêm 10 lượt chấm Camera AI.',
      costExp: 130,
      icon: Icons.camera_alt_rounded,
    ),
    ShopItem(
      itemKey: 'STREAK_FREEZE',
      itemType: 'STREAK',
      title: 'Băng bảo vệ chuỗi Streak',
      description: 'Bảo vệ chuỗi học nếu bạn lỡ nghỉ một ngày; mỗi tài khoản giữ tối đa 3 băng.',
      costExp: 100,
      icon: Icons.ac_unit_rounded,
    ),
    ShopItem(
      itemKey: 'BADGE_AMBASSADOR',
      itemType: 'BADGE',
      title: 'Huy hiệu Đại sứ VSL',
      description:
          'Huy hiệu danh dự cho học viên lan tỏa Ngôn ngữ Ký hiệu Việt Nam.',
      costExp: 150,
      icon: Icons.military_tech_rounded,
    ),
    ShopItem(
      itemKey: 'BADGE_PERSISTENCE',
      itemType: 'BADGE',
      title: 'Huy hiệu Đôi tay kiên trì',
      description: 'Huy hiệu ghi nhận sự chuyên cần trên hành trình học.',
      costExp: 200,
      icon: Icons.local_fire_department_rounded,
    ),
    ShopItem(
      itemKey: 'BADGE_COMMUNITY_HERO',
      itemType: 'BADGE',
      title: 'Huy hiệu Người thắp sáng cộng đồng',
      description:
          'Huy hiệu đặc biệt dành cho học viên tích cực kết nối cộng đồng.',
      costExp: 300,
      icon: Icons.bolt_rounded,
    ),
  ];

  late List<ShopItem> _items;

  @override
  void initState() {
    super.initState();
    _items = List.of(_initialCatalog);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchCatalog();
    });
  }

  Future<void> _fetchCatalog() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get(ApiConstants.gamificationStore);

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        final result = (data['result'] is Map<String, dynamic>)
            ? data['result'] as Map<String, dynamic>
            : data;

        final rawItems = result['items'];
        final ownedBadges =
            (result['ownedBadges'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toSet() ??
            {};

        if (rawItems is List) {
          final fetchedItems = rawItems.map((itemJson) {
            final item = ShopItem.fromJson(itemJson as Map<String, dynamic>);
            final isBadgeOwned =
                item.itemType == 'BADGE' && ownedBadges.contains(item.itemKey);
            return item.copyWith(
              isOwned: item.isOwned || isBadgeOwned,
              icon: _getItemIcon(item.itemKey),
            );
          }).toList();

          if (mounted && fetchedItems.isNotEmpty) {
            setState(() {
              _items = fetchedItems;
            });
          }
        }

        if (mounted) {
          setState(() {
            _localExpBalance = (result['expBalance'] as num?)?.toInt();
            _localAiBonusQuota = (result['aiBonusQuota'] as num?)?.toInt();
            _localFreezeCount = (result['freezeCount'] as num?)?.toInt();
          });
        }
      }
    } catch (_) {
      // In offline or fallback mode, keep initial catalog gracefully
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  IconData _getItemIcon(String itemKey) {
    if (itemKey.contains('AI_BONUS_10')) return Icons.camera_alt_rounded;
    if (itemKey.contains('AI_BONUS')) return Icons.videocam_rounded;
    if (itemKey.contains('STREAK')) return Icons.ac_unit_rounded;
    if (itemKey.contains('AMBASSADOR')) return Icons.military_tech_rounded;
    if (itemKey.contains('PERSISTENCE')) {
      return Icons.local_fire_department_rounded;
    }
    if (itemKey.contains('COMMUNITY')) return Icons.bolt_rounded;
    return Icons.card_giftcard_rounded;
  }

  Color _getItemThemeColor(String itemKey) {
    if (itemKey.contains('AI_BONUS')) {
      return const Color(0xFF0284C7); // Sky blue
    }
    if (itemKey.contains('STREAK')) return const Color(0xFF0891B2); // Cyan
    if (itemKey.contains('AMBASSADOR')) {
      return const Color(0xFF7C3AED); // Purple
    }
    if (itemKey.contains('PERSISTENCE')) {
      return const Color(0xFFEA580C); // Flame
    }
    if (itemKey.contains('COMMUNITY')) return const Color(0xFFD97706); // Amber
    return AppTheme.primaryBlue;
  }

  Future<void> _redeemItem(ShopItem item) async {
    if (_isRedeeming) return;
    setState(() => _isRedeeming = true);

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        ApiConstants.gamificationRedeem,
        data: {'itemKey': item.itemKey},
      );

      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      final result = (data['result'] is Map<String, dynamic>)
          ? data['result'] as Map<String, dynamic>
          : data;

      final newExp = (result['newExpBalance'] as num?)?.toInt();
      final newAi = (result['newAiBonusQuota'] as num?)?.toInt();
      final newFreeze = (result['newFreezeCount'] as num?)?.toInt();
      final message =
          result['message'] as String? ?? 'Đổi thành công: ${item.title}!';

      if (mounted) {
        setState(() {
          if (newExp != null) {
            _localExpBalance = newExp;
          } else if (_localExpBalance != null) {
            _localExpBalance = _localExpBalance! - item.costExp;
          }

          if (newAi != null) _localAiBonusQuota = newAi;
          if (newFreeze != null) _localFreezeCount = newFreeze;

          // If badge, mark as owned locally
          if (item.itemType == 'BADGE') {
            _items = _items.map((it) {
              return it.itemKey == item.itemKey
                  ? it.copyWith(isOwned: true)
                  : it;
            }).toList();
          }
        });

        // Refresh global progress stats so other screens synchronize
        ref.read(progressStatsProvider.notifier).loadStats();

        _showSuccessDialog(item, message);
      }
    } on DioException catch (dioErr) {
      final errData = dioErr.response?.data;
      final errorMsg = (errData is Map && errData['errorMessage'] != null)
          ? errData['errorMessage'].toString()
          : 'Không thể đổi vật phẩm. Vui lòng thử lại sau.';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Có lỗi xảy ra. Vui lòng thử lại sau.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRedeeming = false);
      }
    }
  }

  void _showPurchaseConfirmationDialog(ShopItem item, int currentExp) {
    final remainingExp = currentExp - item.costExp;
    final itemColor = _getItemThemeColor(item.itemKey);

    showDialog<void>(
      context: context,
      barrierDismissible: !_isRedeeming,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24),
        actionsPadding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: itemColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                item.icon ?? _getItemIcon(item.itemKey),
                color: itemColor,
                size: 26,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Xác nhận đổi vật phẩm',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Bạn có chắc chắn muốn dùng điểm kinh nghiệm để đổi vật phẩm này?',
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.description,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Chi phí:', style: TextStyle(fontSize: 13)),
                Row(
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      color: Colors.amber,
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${item.costExp} EXP',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.amber,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Số dư hiện tại:', style: TextStyle(fontSize: 13)),
                Text(
                  '$currentExp EXP',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Số dư sau khi đổi:',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                Text(
                  '$remainingExp EXP',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: remainingExp >= 0
                        ? AppTheme.primaryBlue
                        : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: _isRedeeming
                ? null
                : () => Navigator.of(dialogCtx).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryBlue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            ),
            onPressed: _isRedeeming
                ? null
                : () async {
                    Navigator.of(dialogCtx).pop();
                    await _redeemItem(item);
                  },
            child: _isRedeeming
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Xác nhận đổi'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(ShopItem item, String message) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.green, size: 28),
            SizedBox(width: 10),
            Text(
              'Đổi thành công!',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.stars_rounded,
                    color: Colors.amber,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Số dư EXP hiện tại: ${_localExpBalance ?? 0} EXP',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryBlue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Hoàn tất'),
          ),
        ],
      ),
    );
  }

  List<ShopItem> _getFilteredItems() {
    if (_selectedCategory == 'ALL') return _items;
    if (_selectedCategory == 'AI_QUOTA') {
      return _items
          .where((i) => i.itemType == 'AI_QUOTA' || i.itemKey.contains('AI'))
          .toList();
    }
    if (_selectedCategory == 'STREAK') {
      return _items
          .where((i) => i.itemType == 'STREAK' || i.itemKey.contains('STREAK'))
          .toList();
    }
    if (_selectedCategory == 'BADGE') {
      return _items.where((i) => i.itemType == 'BADGE').toList();
    }
    return _items;
  }

  @override
  Widget build(BuildContext context) {
    final progressStatsAsync = ref.watch(progressStatsProvider);
    final stats = progressStatsAsync.valueOrNull;

    final effectiveExp = _localExpBalance ?? stats?.expBalance ?? 0;
    final effectiveAiQuota = _localAiBonusQuota ?? stats?.aiBonusQuota ?? 0;
    final effectiveFreeze = _localFreezeCount ?? stats?.freezeCount ?? 0;

    final filteredItems = _getFilteredItems();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Cửa Hàng Đổi EXP',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            tooltip: 'Làm mới',
            icon: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _fetchCatalog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchCatalog,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. EXP balance display at top matching web hero
              _buildExpBalanceHeader(
                expBalance: effectiveExp,
                aiQuota: effectiveAiQuota,
                freezeCount: effectiveFreeze,
              ),

              const SizedBox(height: 20),

              // Category filter tabs
              _buildCategoryTabs(),

              const SizedBox(height: 16),

              // Section title
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Vật phẩm có thể đổi (${filteredItems.length})',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  if (_isRedeeming)
                    const Row(
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Đang đổi...',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // 2. Grid of items using GridView.builder
              if (filteredItems.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.storefront_outlined,
                        size: 48,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Không có vật phẩm nào trong mục này',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                )
              else
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isTablet = constraints.maxWidth >= 600;
                    final crossAxisCount = isTablet ? 3 : 2;

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredItems.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: isTablet ? 0.76 : 0.64,
                      ),
                      itemBuilder: (context, index) {
                        final item = filteredItems[index];
                        return _buildItemCard(
                          item: item,
                          currentExp: effectiveExp,
                        );
                      },
                    );
                  },
                ),

              const SizedBox(height: 24),

              // Guide tip card: how to earn more EXP
              _buildEarnExpGuideCard(),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  /// 1. EXP balance display at top
  Widget _buildExpBalanceHeader({
    required int expBalance,
    required int aiQuota,
    required int freezeCount,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1E3A8A), // deep navy
            Color(0xFF2563EB), // primary blue
            Color(0xFF0F172A), // dark slate
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
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
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      color: Colors.white,
                      size: 14,
                    ),
                    SizedBox(width: 6),
                    Text(
                      'VẬT PHẨM HỌC TẬP',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Cửa Hàng',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Dùng EXP đổi lượt Camera AI, bảo vệ streak và huy hiệu danh dự.',
            style: TextStyle(fontSize: 12, color: Color(0xFFE2E8F0)),
          ),
          const SizedBox(height: 16),

          // User Balances Row
          Row(
            children: [
              // EXP Balance
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Số dư EXP',
                        style: TextStyle(
                          color: Color(0xFFBFDBFE),
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            color: Color(0xFFFDE047),
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '$expBalance',
                              style: const TextStyle(
                                color: Color(0xFFFDE047),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Camera AI Quota
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Lượt Camera',
                        style: TextStyle(
                          color: Color(0xFFBFDBFE),
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.videocam_rounded,
                            color: Color(0xFF7DD3FC),
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '$aiQuota',
                              style: const TextStyle(
                                color: Color(0xFF7DD3FC),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Streak Freeze
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Băng streak',
                        style: TextStyle(
                          color: Color(0xFFBFDBFE),
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.ac_unit_rounded,
                            color: Color(0xFF67E8F9),
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '$freezeCount',
                              style: const TextStyle(
                                color: Color(0xFF67E8F9),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Category filter chips
  Widget _buildCategoryTabs() {
    final categories = [
      {'key': 'ALL', 'label': 'Tất cả', 'icon': Icons.auto_awesome_rounded},
      {
        'key': 'AI_QUOTA',
        'label': 'Lượt Camera',
        'icon': Icons.videocam_rounded,
      },
      {'key': 'STREAK', 'label': 'Bảo vệ Streak', 'icon': Icons.shield_rounded},
      {
        'key': 'BADGE',
        'label': 'Huy hiệu',
        'icon': Icons.military_tech_rounded,
      },
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((tab) {
          final isSelected = _selectedCategory == tab['key'];
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: FilterChip(
              avatar: Icon(
                tab['icon'] as IconData,
                size: 16,
                color: isSelected ? Colors.white : AppTheme.primaryBlue,
              ),
              label: Text(
                tab['label'] as String,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : const Color(0xFF334155),
                ),
              ),
              selected: isSelected,
              showCheckmark: false,
              selectedColor: AppTheme.primaryBlue,
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected
                      ? AppTheme.primaryBlue
                      : const Color(0xFFE2E8F0),
                ),
              ),
              onSelected: (_) {
                setState(() => _selectedCategory = tab['key'] as String);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  /// 3. Each item card: image, name, EXP cost, exchange button
  Widget _buildItemCard({required ShopItem item, required int currentExp}) {
    final canAfford = currentExp >= item.costExp;
    final themeColor = _getItemThemeColor(item.itemKey);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: item.isOwned ? Colors.green.shade300 : const Color(0xFFE2E8F0),
          width: item.isOwned ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image area with badge / visual graphic
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                      ? Image.network(
                          item.imageUrl!,
                          height: 84,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _buildItemImageFallback(
                            item: item,
                            themeColor: themeColor,
                          ),
                        )
                      : _buildItemImageFallback(
                          item: item,
                          themeColor: themeColor,
                        ),
                ),

                // Top left EXP cost pill
                Positioned(
                  top: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.amber.withValues(alpha: 0.8),
                        width: 0.8,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Color(0xFFFDE047),
                          size: 13,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '${item.costExp} EXP',
                          style: const TextStyle(
                            color: Color(0xFFFDE047),
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Top right "Đã sở hữu" badge
                if (item.isOwned)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.shade600,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check, color: Colors.white, size: 11),
                          SizedBox(width: 2),
                          Text(
                            'Đã có',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 8),

            // Item Name
            Text(
              item.title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12.5,
                color: Color(0xFF0F172A),
                height: 1.25,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 4),

            // Item Description
            Expanded(
              child: Text(
                item.description,
                style: TextStyle(
                  fontSize: 10.5,
                  color: Colors.grey.shade600,
                  height: 1.25,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            const SizedBox(height: 8),

            // Item exchange button
            SizedBox(
              height: 32,
              child: item.isOwned
                  ? OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        side: BorderSide(color: Colors.green.shade400),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: null,
                      child: Text(
                        'Đã sở hữu',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                    )
                  : ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        backgroundColor: canAfford
                            ? AppTheme.primaryBlue
                            : Colors.grey.shade200,
                        foregroundColor: canAfford
                            ? Colors.white
                            : Colors.grey.shade500,
                        elevation: canAfford ? 1 : 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: canAfford && !_isRedeeming
                          ? () => _showPurchaseConfirmationDialog(
                              item,
                              currentExp,
                            )
                          : null,
                      child: Text(
                        canAfford
                            ? 'Đổi ngay'
                            : 'Thiếu ${item.costExp - currentExp} EXP',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: canAfford
                              ? Colors.white
                              : Colors.grey.shade600,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Item image fallback illustration
  Widget _buildItemImageFallback({
    required ShopItem item,
    required Color themeColor,
  }) {
    return Container(
      height: 84,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            themeColor.withValues(alpha: 0.15),
            themeColor.withValues(alpha: 0.35),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: themeColor.withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            item.icon ?? _getItemIcon(item.itemKey),
            color: themeColor,
            size: 26,
          ),
        ),
      ),
    );
  }

  /// Guide card explaining how to accumulate more EXP
  Widget _buildEarnExpGuideCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF), // Blue tint
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFDBEAFE),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lightbulb_outline_rounded,
              color: AppTheme.primaryBlue,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Cách tích lũy thêm điểm EXP',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Hoàn thành mỗi bài học để nhận +20 đến +35 EXP. Duy trì chuỗi Streak mỗi ngày và hoàn thành nhiệm vụ để đổi quà dễ dàng!',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF334155),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
