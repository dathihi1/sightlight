import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

/// Friend item invited through referral
class ReferralFriend {
  const ReferralFriend({
    required this.displayName,
    required this.maskedEmail,
    required this.joinedAt,
  });

  final String displayName;
  final String maskedEmail;
  final DateTime joinedAt;

  factory ReferralFriend.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    try {
      parsedDate = json['joinedAt'] != null
          ? DateTime.parse(json['joinedAt'].toString())
          : DateTime.now();
    } catch (_) {
      parsedDate = DateTime.now();
    }

    return ReferralFriend(
      displayName: (json['displayName'] as String?) ?? 'Người dùng',
      maskedEmail: (json['maskedEmail'] as String?) ?? '***@email.com',
      joinedAt: parsedDate,
    );
  }
}

/// Referral summary state representation
class ReferralSummary {
  const ReferralSummary({
    required this.referralCode,
    required this.referralLink,
    required this.invitedCount,
    required this.targetCount,
    required this.canClaimReward,
    required this.rewardClaimed,
    this.referredByCode,
    required this.invitedFriends,
  });

  final String referralCode;
  final String referralLink;
  final int invitedCount;
  final int targetCount;
  final bool canClaimReward;
  final bool rewardClaimed;
  final String? referredByCode;
  final List<ReferralFriend> invitedFriends;

  factory ReferralSummary.fromJson(Map<String, dynamic> json) {
    final friendsRaw = json['invitedFriends'] as List<dynamic>? ?? [];
    final friends = friendsRaw
        .whereType<Map<String, dynamic>>()
        .map(ReferralFriend.fromJson)
        .toList();

    return ReferralSummary(
      referralCode: (json['referralCode'] as String?) ?? 'SL8888',
      referralLink:
          (json['referralLink'] as String?) ??
          'https://signlight.vn/dang-ky?ref=SL8888',
      invitedCount: (json['invitedCount'] as num?)?.toInt() ?? friends.length,
      targetCount: (json['targetCount'] as num?)?.toInt() ?? 5,
      canClaimReward: (json['canClaimReward'] as bool?) ?? false,
      rewardClaimed: (json['rewardClaimed'] as bool?) ?? false,
      referredByCode: json['referredByCode'] as String?,
      invitedFriends: friends,
    );
  }

  factory ReferralSummary.defaultForUser(String? userId) {
    final code = userId != null && userId.length >= 6
        ? 'SL${userId.substring(0, 6).toUpperCase()}'
        : 'SL888888';
    return ReferralSummary(
      referralCode: code,
      referralLink: 'https://signlight.vn/dang-ky?ref=$code',
      invitedCount: 0,
      targetCount: 5,
      canClaimReward: false,
      rewardClaimed: false,
      referredByCode: null,
      invitedFriends: const [],
    );
  }

  ReferralSummary copyWith({
    String? referralCode,
    String? referralLink,
    int? invitedCount,
    int? targetCount,
    bool? canClaimReward,
    bool? rewardClaimed,
    String? referredByCode,
    List<ReferralFriend>? invitedFriends,
  }) {
    return ReferralSummary(
      referralCode: referralCode ?? this.referralCode,
      referralLink: referralLink ?? this.referralLink,
      invitedCount: invitedCount ?? this.invitedCount,
      targetCount: targetCount ?? this.targetCount,
      canClaimReward: canClaimReward ?? this.canClaimReward,
      rewardClaimed: rewardClaimed ?? this.rewardClaimed,
      referredByCode: referredByCode ?? this.referredByCode,
      invitedFriends: invitedFriends ?? this.invitedFriends,
    );
  }
}

/// Referral state controller
class ReferralNotifier extends StateNotifier<AsyncValue<ReferralSummary>> {
  ReferralNotifier(this._dio, this._ref) : super(const AsyncValue.loading()) {
    fetchSummary();
  }

  final Dio _dio;
  final Ref _ref;

  Future<void> fetchSummary() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get(ApiConstants.referralSummary);
      final body = response.data;
      if (body is Map<String, dynamic> && body['result'] != null) {
        final data = body['result'] as Map<String, dynamic>;
        state = AsyncValue.data(ReferralSummary.fromJson(data));
      } else if (body is Map<String, dynamic>) {
        state = AsyncValue.data(ReferralSummary.fromJson(body));
      } else {
        final user = _ref.read(authStateProvider).value;
        state = AsyncValue.data(ReferralSummary.defaultForUser(user?.id));
      }
    } catch (_) {
      // Fallback to default state based on current user
      final user = _ref.read(authStateProvider).value;
      state = AsyncValue.data(ReferralSummary.defaultForUser(user?.id));
    }
  }

  Future<String?> claimReferralCode(String code) async {
    try {
      final response = await _dio.post(
        ApiConstants.referralClaimCode,
        data: {'referralCode': code.trim().toUpperCase()},
      );
      final body = response.data;
      if (body is Map<String, dynamic> && body['result'] != null) {
        state = AsyncValue.data(
          ReferralSummary.fromJson(body['result'] as Map<String, dynamic>),
        );
      } else {
        await fetchSummary();
      }
      return null;
    } on DioException catch (e) {
      final errData = e.response?.data;
      if (errData is Map<String, dynamic> && errData['errorMessage'] != null) {
        return errData['errorMessage'] as String;
      }
      return 'Không thể liên kết mã giới thiệu. Vui lòng kiểm tra lại mã.';
    } catch (_) {
      return 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
    }
  }

  Future<String?> claimReward() async {
    try {
      final response = await _dio.post(ApiConstants.referralClaimReward);
      final body = response.data;
      if (body is Map<String, dynamic> && body['result'] != null) {
        state = AsyncValue.data(
          ReferralSummary.fromJson(body['result'] as Map<String, dynamic>),
        );
      } else {
        await fetchSummary();
      }
      // Refresh auth state to reflect premium status
      _ref.read(authStateProvider.notifier).updatePremiumStatus(true);
      return null;
    } on DioException catch (e) {
      final errData = e.response?.data;
      if (errData is Map<String, dynamic> && errData['errorMessage'] != null) {
        return errData['errorMessage'] as String;
      }
      return 'Chưa thể nhận thưởng. Vui lòng thử lại sau.';
    } catch (_) {
      return 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.';
    }
  }
}

final referralProvider =
    StateNotifierProvider<ReferralNotifier, AsyncValue<ReferralSummary>>((ref) {
      final dio = ref.watch(dioProvider);
      return ReferralNotifier(dio, ref);
    });

/// Page matching web "Mời bạn bè" (/gioi-thieu)
class ReferralPage extends ConsumerStatefulWidget {
  const ReferralPage({super.key});

  @override
  ConsumerState<ReferralPage> createState() => _ReferralPageState();
}

class _ReferralPageState extends ConsumerState<ReferralPage> {
  final _inputCodeController = TextEditingController();
  Timer? _copyTimer;
  bool _copiedLink = false;
  bool _copiedCode = false;
  bool _isClaimingCode = false;
  bool _isClaimingReward = false;

  @override
  void dispose() {
    _copyTimer?.cancel();
    _inputCodeController.dispose();
    super.dispose();
  }

  void _copyToClipboard(String text, {required bool isLink}) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() {
      if (isLink) {
        _copiedLink = true;
      } else {
        _copiedCode = true;
      }
    });

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isLink
                    ? 'Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!'
                    : 'Đã sao chép mã giới thiệu: $text',
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );

    _copyTimer?.cancel();
    _copyTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          if (isLink) {
            _copiedLink = false;
          } else {
            _copiedCode = false;
          }
        });
      }
    });
  }

  Future<void> _shareToSocial(String platform, String link) async {
    final message =
        'Cùng mình học Ngôn ngữ Ký hiệu trên SignLight nhé! Đăng ký qua liên kết để nhận 7 ngày Premium miễn phí: $link';
    final encodedUrl = Uri.encodeComponent(link);
    final encodedMessage = Uri.encodeComponent(message);

    Uri? targetUri;
    switch (platform) {
      case 'facebook':
        targetUri = Uri.parse(
          'https://www.facebook.com/sharer/sharer.php?u=$encodedUrl',
        );
        break;
      case 'telegram':
        targetUri = Uri.parse(
          'https://t.me/share/url?url=$encodedUrl&text=$encodedMessage',
        );
        break;
      case 'zalo':
        targetUri = Uri.parse('https://zalo.me/share?url=$encodedUrl');
        break;
      case 'messenger':
        targetUri = Uri.parse('fb-messenger://share?link=$encodedUrl');
        break;
      default:
        _copyToClipboard(link, isLink: true);
        return;
    }

    try {
      final launched = await launchUrl(
        targetUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        _copyToClipboard(link, isLink: true);
      }
    } catch (_) {
      _copyToClipboard(link, isLink: true);
    }
  }

  Future<void> _handleClaimCode() async {
    final code = _inputCodeController.text.trim();
    if (code.isEmpty) return;

    setState(() => _isClaimingCode = true);
    final error = await ref
        .read(referralProvider.notifier)
        .claimReferralCode(code);
    if (!mounted) return;
    setState(() => _isClaimingCode = false);

    if (error == null) {
      _inputCodeController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Liên kết mã giới thiệu của bạn bè thành công! 🎉'),
          backgroundColor: Color(0xFF059669),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleClaimReward() async {
    setState(() => _isClaimingReward = true);
    final error = await ref.read(referralProvider.notifier).claimReward();
    if (!mounted) return;
    setState(() => _isClaimingReward = false);

    if (error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            '🎉 Chúc mừng bạn đã nhận thành công 1 Tháng Premium miễn phí!',
          ),
          backgroundColor: Color(0xFF059669),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final referralAsync = ref.watch(referralProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Mời bạn bè',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Làm mới',
            onPressed: () => ref.read(referralProvider.notifier).fetchSummary(),
          ),
        ],
      ),
      body: referralAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'Đang tải thông tin giới thiệu…',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Colors.red,
                  size: 48,
                ),
                const SizedBox(height: 12),
                Text(
                  'Không thể tải dữ liệu: $err',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () =>
                      ref.read(referralProvider.notifier).fetchSummary(),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
        data: (data) => _buildContent(context, data),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ReferralSummary data) {
    return RefreshIndicator(
      onRefresh: () => ref.read(referralProvider.notifier).fetchSummary(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Ambassador Banner Card
            _buildAmbassadorBannerCard(context),
            const SizedBox(height: 16),

            // 2. Free Badge Benefits Card
            _buildFreeBadgeBenefitsCard(context),
            const SizedBox(height: 16),

            // 3. Referral Link & Code Display Card
            _buildReferralLinkCard(context, data),
            const SizedBox(height: 16),

            // 4. Social Share Buttons Card
            _buildSocialShareCard(context, data.referralLink),
            const SizedBox(height: 16),

            // 5. Invited Friends Count & Progress Card
            _buildProgressAndFriendsCard(context, data),
            const SizedBox(height: 16),

            // 6. Support Referrer Code Card
            _buildClaimReferrerCard(context, data),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  /// Banner Card: Chương trình Đại sứ SignLight
  Widget _buildAmbassadorBannerCard(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF4338CA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(50),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.workspace_premium_rounded,
                    color: Color(0xFFFDE047),
                    size: 16,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'CHƯƠNG TRÌNH ĐẠI SỨ SIGNLIGHT',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Mời 5 bạn mới tham gia — Nhận ngay 1 Tháng Premium miễn phí!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Mỗi khi bạn mời 1 người bạn đăng ký học Ngôn ngữ Ký hiệu trên SignLight, cả hai đều cùng tiến bộ. Đạt mốc 5 người bạn để nhận trọn vẹn 30 ngày trải nghiệm Premium không giới hạn & Huy hiệu Đại sứ danh giá!',
              style: TextStyle(
                color: Colors.blue.shade100,
                fontSize: 13,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Benefits Card: "Free badge" and Premium Perks
  Widget _buildFreeBadgeBenefitsCard(BuildContext context) {
    final theme = Theme.of(context);
    final benefits = [
      (
        icon: Icons.verified_rounded,
        color: AppTheme.accentAmber,
        title: 'Huy hiệu Đại sứ SignLight độc quyền (Free Badge)',
        desc: 'Gắn biểu tượng huy hiệu Đại sứ vĩnh viễn trên hồ sơ cá nhân và bảng xếp hạng cộng đồng.',
      ),
      (
        icon: Icons.card_giftcard_rounded,
        color: Colors.purpleAccent.shade400,
        title: 'Trọn vẹn 1 Tháng Premium miễn phí',
        desc: 'Trị giá 199.000đ, tự động mở khóa toàn bộ quyền lợi cao cấp không cần thanh toán.',
      ),
      (
        icon: Icons.camera_enhance_rounded,
        color: AppTheme.primaryBlue,
        title: 'Mở khóa camera AI nhận diện thời gian thực',
        desc: 'Gia sư AI phản hồi ngay lập tức từng ngón tay và góc xoay chuẩn xác 24/7.',
      ),
      (
        icon: Icons.menu_book_rounded,
        color: Colors.teal,
        title: 'Không giới hạn 17 chủ đề bài học & Từ điển video',
        desc: 'Luyện tập không giới hạn số lượt hàng ngày, xem trọn bộ video mẫu HD độ nét cao.',
      ),
      (
        icon: Icons.group_add_rounded,
        color: Colors.pinkAccent,
        title: 'Bạn bè được tặng 7 ngày Premium trải nghiệm',
        desc: 'Người bạn giới thiệu cũng nhận ngay ưu đãi 7 ngày dùng thử Premium khi đăng ký.',
      ),
    ];

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.amber.shade200, width: 1.2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.military_tech_rounded,
                    color: Color(0xFFD97706),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quyền lợi Huy hiệu & Thưởng (Free Badge)',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Mở khóa trọn bộ khi bạn bè tham gia học tập',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...benefits.map(
              (b) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: b.color.withAlpha(30),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(b.icon, color: b.color, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            b.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            b.desc,
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Referral Code and Referral Link Display Card
  Widget _buildReferralLinkCard(BuildContext context, ReferralSummary data) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Code block
            Text(
              'MÃ GIỚI THIỆU CỦA BẠN',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Bạn bè có thể nhập mã này khi đăng ký tài khoản.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withAlpha(50),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.qr_code_rounded,
                    color: AppTheme.primaryBlue,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      data.referralCode,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2,
                        color: Color(0xFF1E40AF),
                      ),
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () =>
                        _copyToClipboard(data.referralCode, isLink: false),
                    icon: Icon(
                      _copiedCode
                          ? Icons.check_circle_rounded
                          : Icons.copy_rounded,
                      size: 16,
                      color: _copiedCode ? Colors.green : null,
                    ),
                    label: Text(
                      _copiedCode ? 'Đã chép ✓' : 'Sao chép mã',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _copiedCode ? Colors.green : null,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Link block
            Text(
              'LIÊN KẾT MỜI NHANH (REFERRAL LINK)',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Khi bạn bè mở link này, mã giới thiệu sẽ tự động được điền sẵn.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withAlpha(50),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link_rounded, color: Colors.grey, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      data.referralLink,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: Color(0xFF334155),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () =>
                        _copyToClipboard(data.referralLink, isLink: true),
                    icon: Icon(
                      _copiedLink
                          ? Icons.check_circle_rounded
                          : Icons.content_copy_rounded,
                      size: 15,
                    ),
                    label: Text(
                      _copiedLink ? 'Đã chép ✓' : 'Sao chép link',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _copiedLink
                          ? const Color(0xFF059669)
                          : AppTheme.primaryBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      visualDensity: VisualDensity.compact,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Social Share Buttons Card
  Widget _buildSocialShareCard(BuildContext context, String link) {
    final theme = Theme.of(context);
    final socialButtons = [
      (
        id: 'facebook',
        name: 'Facebook',
        icon: Icons.facebook,
        color: const Color(0xFF1877F2),
      ),
      (
        id: 'zalo',
        name: 'Zalo',
        icon: Icons.chat_bubble_rounded,
        color: const Color(0xFF0068FF),
      ),
      (
        id: 'messenger',
        name: 'Messenger',
        icon: Icons.send_rounded,
        color: const Color(0xFF0084FF),
      ),
      (
        id: 'telegram',
        name: 'Telegram',
        icon: Icons.near_me_rounded,
        color: const Color(0xFF229ED9),
      ),
    ];

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.share_rounded,
                  color: AppTheme.primaryBlue,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Chia sẻ nhanh qua mạng xã hội',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Gửi trực tiếp liên kết cho bạn bè và nhóm học tập',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: socialButtons.map((btn) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: () => _shareToSocial(btn.id, link),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: btn.color.withAlpha(20),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: btn.color.withAlpha(60)),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(btn.icon, color: btn.color, size: 24),
                            const SizedBox(height: 4),
                            Text(
                              btn.name,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: btn.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 10),
            Center(
              child: TextButton.icon(
                onPressed: () => _copyToClipboard(link, isLink: true),
                icon: const Icon(Icons.share_outlined, size: 16),
                label: const Text(
                  'Tùy chọn chia sẻ khác hoặc tin nhắn SMS',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Invited Friends Count & Progress Card
  Widget _buildProgressAndFriendsCard(
    BuildContext context,
    ReferralSummary data,
  ) {
    final theme = Theme.of(context);
    final count = data.invitedCount;
    final target = data.targetCount;
    final progress = (count / target).clamp(0.0, 1.0);
    final remaining = (target - count).clamp(0, target);
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title & Status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tiến độ nhận gói Premium',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: TextSpan(
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade700,
                          ),
                          children: [
                            const TextSpan(text: 'Đã mời thành công: '),
                            TextSpan(
                              text: '$count / $target bạn bè',
                              style: const TextStyle(
                                color: AppTheme.primaryBlue,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (data.rewardClaimed)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: Colors.green,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Đã nhận Premium',
                          style: TextStyle(
                            color: Colors.green.shade800,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  )
                else if (data.canClaimReward)
                  ElevatedButton(
                    onPressed: _isClaimingReward ? null : _handleClaimReward,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isClaimingReward
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            '🎁 Kích hoạt ngay!',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Còn thiếu $remaining bạn',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 10,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(
                  progress >= 1.0 ? Colors.green : AppTheme.primaryBlue,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '0 bạn',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
                Text(
                  'Mốc $target bạn (Nhận 1 Tháng Premium)',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
            const Divider(height: 28),

            // Friend list header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Danh sách bạn bè đã tham gia ($count)',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (count > 0)
                  const Text(
                    'Đã xác minh ✓',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // Friend list content
            if (data.invitedFriends.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 24),
                alignment: Alignment.center,
                child: Column(
                  children: [
                    Icon(
                      Icons.people_outline_rounded,
                      size: 44,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chưa có người bạn nào tham gia qua mã của bạn.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Hãy gửi liên kết mời cho bạn bè ngay nhé!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: data.invitedFriends.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final friend = data.invitedFriends[index];
                  final initial = friend.displayName.isNotEmpty
                      ? friend.displayName.substring(0, 1).toUpperCase()
                      : 'U';

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: Colors.blue.shade50,
                          child: Text(
                            initial,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryBlue,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                friend.displayName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                friend.maskedEmail,
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          dateFormat.format(friend.joinedAt),
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  /// Support Referrer: Enter friend's referral code Card
  Widget _buildClaimReferrerCard(BuildContext context, ReferralSummary data) {
    final theme = Theme.of(context);
    final hasReferredBy =
        data.referredByCode != null && data.referredByCode!.isNotEmpty;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ủng hộ người bạn đã giới thiệu cho bạn',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Nếu bạn được bạn bè giới thiệu đến SignLight, hãy nhập mã của họ bên dưới.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 12),
            if (hasReferredBy)
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
                      Icons.check_circle_rounded,
                      color: Colors.green,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Bạn đã liên kết với người giới thiệu: ${data.referredByCode}',
                        style: TextStyle(
                          color: Colors.green.shade900,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputCodeController,
                      textCapitalization: TextCapitalization.characters,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Nhập mã (ví dụ: SL123456)',
                        hintStyle: TextStyle(
                          fontFamily: 'sans-serif',
                          letterSpacing: 0,
                          fontSize: 13,
                          color: Colors.grey.shade500,
                        ),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isClaimingCode ? null : _handleClaimCode,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isClaimingCode
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Xác nhận',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
