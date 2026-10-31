import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('vi'));
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('vi'),
    Locale('en'),
  ];

  bool get isVietnamese => locale.languageCode == 'vi';

  // Navigation
  String get home => isVietnamese ? 'Trang chủ' : 'Home';
  String get dictionary => isVietnamese ? 'Từ điển' : 'Dictionary';
  String get practice => isVietnamese ? 'Luyện tập' : 'Practice';
  String get profile => isVietnamese ? 'Cá nhân' : 'Profile';
  String get courses => isVietnamese ? 'Khóa học' : 'Courses';
  String get notifications => isVietnamese ? 'Thông báo' : 'Notifications';
  String get settings => isVietnamese ? 'Cài đặt' : 'Settings';
  String get upgrade => isVietnamese ? 'Nâng cấp Premium' : 'Upgrade Premium';

  // Auth
  String get login => isVietnamese ? 'Đăng nhập' : 'Log In';
  String get register => isVietnamese ? 'Đăng ký' : 'Sign Up';
  String get logout => isVietnamese ? 'Đăng xuất' : 'Log Out';
  String get email => 'Email';
  String get password => isVietnamese ? 'Mật khẩu' : 'Password';
  String get confirmPassword =>
      isVietnamese ? 'Xác nhận mật khẩu' : 'Confirm Password';
  String get fullName => isVietnamese ? 'Họ và tên' : 'Full Name';
  String get dontHaveAccount => isVietnamese
      ? 'Chưa có tài khoản? Đăng ký ngay'
      : "Don't have an account? Sign up";
  String get alreadyHaveAccount => isVietnamese
      ? 'Đã có tài khoản? Đăng nhập'
      : 'Already have an account? Log in';
  String get loginSuccess =>
      isVietnamese ? 'Đăng nhập thành công!' : 'Logged in successfully!';
  String get registerSuccess =>
      isVietnamese ? 'Đăng ký tài khoản thành công!' : 'Registration successful!';

  // Payment & Upgrade
  String get upgradeTitle => isVietnamese
      ? 'Nâng tầm kỹ năng cùng SignLight Premium'
      : 'Level Up With SignLight Premium';
  String get upgradeSubtitle => isVietnamese
      ? 'Mở khóa toàn bộ bài học & gia sư AI nhận diện cử chỉ 24/7'
      : 'Unlock all lessons & 24/7 AI gesture recognition tutor';
  String get choosePlan =>
      isVietnamese ? 'Chọn gói đăng ký' : 'Choose Your Plan';
  String get popular => isVietnamese ? 'Phổ biến nhất' : 'Most Popular';
  String get lifetime => isVietnamese ? 'Vĩnh viễn' : 'Lifetime';
  String get payWithPayOS =>
      isVietnamese ? 'Thanh toán qua payOS' : 'Pay with payOS';
  String get paymentSuccess =>
      isVietnamese ? 'Thanh toán thành công!' : 'Payment Successful!';
  String get paymentSuccessDesc => isVietnamese
      ? 'Cảm ơn bạn! Tài khoản của bạn đã được nâng cấp lên gói Premium.'
      : 'Thank you! Your account has been upgraded to Premium.';
  String get paymentCancel =>
      isVietnamese ? 'Giao dịch bị hủy' : 'Payment Cancelled';
  String get paymentFailed =>
      isVietnamese ? 'Thanh toán thất bại' : 'Payment Failed';
  String get orderCode => isVietnamese ? 'Mã đơn hàng' : 'Order Code';
  String get returnHome => isVietnamese ? 'Về trang chủ' : 'Back to Home';
  String get premiumActive =>
      isVietnamese ? 'Đang dùng gói Premium' : 'Premium Active';
  String get freeUser => isVietnamese ? 'Tài khoản miễn phí' : 'Free Account';

  // Theme & Language
  String get theme => isVietnamese ? 'Giao diện' : 'Appearance';
  String get themeLight => isVietnamese ? 'Chế độ sáng' : 'Light Mode';
  String get themeDark => isVietnamese ? 'Chế độ tối' : 'Dark Mode';
  String get themeSystem => isVietnamese ? 'Theo hệ thống' : 'System Default';
  String get language => isVietnamese ? 'Ngôn ngữ' : 'Language';
  String get vietnamese => 'Tiếng Việt';
  String get english => 'English';

  // Common & Errors
  String get ok => isVietnamese ? 'Đồng ý' : 'OK';
  String get retry => isVietnamese ? 'Thử lại' : 'Retry';
  String get cancel => isVietnamese ? 'Hủy' : 'Cancel';
  String get error => isVietnamese ? 'Có lỗi xảy ra' : 'An error occurred';
  String get success => isVietnamese ? 'Thành công' : 'Success';
  String get offlineMessage => isVietnamese
      ? 'Không có kết nối mạng. Đang hoạt động ở chế độ ngoại tuyến.'
      : 'No internet connection. Running in offline mode.';
  String get networkError => isVietnamese
      ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.'
      : 'Cannot reach the server. Please check your network connection.';
  String get emptyContent =>
      isVietnamese ? 'Chưa có dữ liệu' : 'No content available';
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['vi', 'en'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(AppLocalizations(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
