class Plan {
  const Plan({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.durationMonths,
    required this.features,
    this.isPopular = false,
    this.isLifetime = false,
  });

  final String id;
  final String name;
  final String description;
  final int price;
  final int durationMonths;
  final List<String> features;
  final bool isPopular;
  final bool isLifetime;

  static const List<Plan> defaultPlans = [
    Plan(
      id: 'plan_1_month',
      name: '1 Tháng',
      description: 'Linh hoạt, trải nghiệm toàn diện',
      price: 59000,
      durationMonths: 1,
      features: [
        'Truy cập tất cả khóa học cơ bản & nâng cao',
        'Luyện tập nhận diện cử chỉ AI không giới hạn',
        'Tra cứu từ điển ký hiệu đầy đủ video chuẩn',
        'Trải nghiệm không quảng cáo',
      ],
      isPopular: false,
      isLifetime: false,
    ),
    Plan(
      id: 'plan_6_months',
      name: '6 Tháng',
      description: 'Gói phổ biến nhất, tiết kiệm 15%',
      price: 299000,
      durationMonths: 6,
      features: [
        'Toàn bộ đặc quyền của gói 1 Tháng',
        'Tiết kiệm 15% chi phí học tập',
        'Lộ trình cá nhân hóa với gia sư AI',
        'Cấp chứng chỉ điện tử theo từng cấp độ',
        'Huy hiệu học viên chuyên cần',
      ],
      isPopular: true,
      isLifetime: false,
    ),
    Plan(
      id: 'plan_lifetime',
      name: 'Vĩnh Viễn',
      description: 'Sở hữu trọn đời, thanh toán một lần',
      price: 799000,
      durationMonths: 0,
      features: [
        'Toàn bộ tính năng cao cấp không thời hạn',
        'Cập nhật miễn phí mọi khóa học trong tương lai',
        'Tải từ điển và bài học dùng offline',
        'Huy hiệu VIP trọn đời',
        'Ưu tiên hỗ trợ kỹ thuật & giải đáp 24/7',
      ],
      isPopular: false,
      isLifetime: true,
    ),
  ];
}
