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
}
