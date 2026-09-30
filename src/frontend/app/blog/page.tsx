"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { apiCall } from "@/lib/api";

export default function BlogPage() {
  const { lang, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const categories = [
    { id: "all", labelVi: "Tất cả bài viết", labelEn: "All Articles" },
    { id: "culture", labelVi: "Văn hoá Người Điếc", labelEn: "Deaf Culture" },
    { id: "tips", labelVi: "Mẹo học tập VSL", labelEn: "Learning Tips" },
    { id: "tech", labelVi: "Công nghệ AI", labelEn: "AI Technology" },
    { id: "community", labelVi: "Cộng đồng & Xã hội", labelEn: "Community" },
  ];

  const posts = [
    {
      id: "5-reasons-learn-vsl",
      category: "tips",
      categoryLabelVi: "Mẹo học tập",
      categoryLabelEn: "Learning Tips",
      titleVi: "5 Lý do bạn nên bắt đầu học Ngôn ngữ Ký hiệu Việt Nam (VSL) ngay hôm nay",
      titleEn: "5 Reasons Why You Should Start Learning Vietnamese Sign Language (VSL) Today",
      excerptVi:
        "Học VSL không chỉ giúp bạn giao tiếp với hơn 2,5 triệu người Điếc mà còn phát triển tư duy không gian thị giác và nuôi dưỡng lòng thấu cảm sâu sắc.",
      excerptEn:
        "Learning VSL enables you to connect with 2.5M Deaf citizens while boosting spatial-visual cognition and cultivating deep empathy.",
      author: "Đội ngũ Giáo dục SignLight",
      date: "2026-09-15",
      readTimeVi: "4 phút đọc",
      readTimeEn: "4 min read",
    },
    {
      id: "deaf-culture-vietnam",
      category: "culture",
      categoryLabelVi: "Văn hoá Người Điếc",
      categoryLabelEn: "Deaf Culture",
      titleVi: "Hiểu đúng về Văn hoá Người Điếc: Điếc không phải khiếm khuyết mà là một bản sắc",
      titleEn: "Deaf Culture in Vietnam: Deafness as a Linguistic Identity, Not a Disability",
      excerptVi:
        "Người Điếc có ngôn ngữ riêng, di sản văn hoá phong phú và niềm tự hào cộng đồng mạnh mẽ. Tìm hiểu các quy tắc ứng xử tôn trọng khi giao tiếp.",
      excerptEn:
        "The Deaf community shares a rich linguistic heritage and proud identity. Explore essential etiquette when engaging with Deaf individuals.",
      author: "Nguyễn Minh Tuấn (Giáo viên VSL)",
      date: "2026-09-10",
      readTimeVi: "6 phút đọc",
      readTimeEn: "6 min read",
    },
    {
      id: "ai-gesture-recognition",
      category: "tech",
      categoryLabelVi: "Công nghệ AI",
      categoryLabelEn: "AI Technology",
      titleVi: "Công nghệ AI nhận diện cử chỉ động qua webcam tại trình duyệt hoạt động ra sao?",
      titleEn: "How Browser-based AI Gesture Recognition Analyzes Dynamic Signs in Real-Time",
      excerptVi:
        "Tìm hiểu cách MediaPipe trích xuất 63 điểm mốc bàn tay kết hợp kiến trúc Lite-Transformer phân tích chuỗi chuyển động với độ trễ dưới 50ms.",
      excerptEn:
        "Explore how MediaPipe landmark extraction couples with Lite-Transformer to classify dynamic signing sequences in under 50ms with zero server uploads.",
      author: "SignLight AI Lab",
      date: "2026-09-02",
      readTimeVi: "8 phút đọc",
      readTimeEn: "8 min read",
    },
    {
      id: "vsl-finger-spelling",
      category: "tips",
      categoryLabelVi: "Mẹo học tập",
      categoryLabelEn: "Learning Tips",
      titleVi: "Bảng chữ cái ngón tay VSL: Hướng dẫn nhập môn từng bước cho người mới",
      titleEn: "VSL Fingerspelling: Step-by-Step Starter Guide for Beginners",
      excerptVi:
        "Bảng chữ cái ngón tay là viên gạch nền tảng giúp bạn đánh vần tên riêng, địa danh và từ mới khi chưa biết ký hiệu tương ứng.",
      excerptEn:
        "Fingerspelling is the fundamental building block for spelling names, locations, and loan words in Vietnamese Sign Language.",
      author: "Trần Mai Anh (Nghiên cứu VSL)",
      date: "2026-08-28",
      readTimeVi: "5 phút đọc",
      readTimeEn: "5 min read",
    },
    {
      id: "regional-vsl-differences",
      category: "culture",
      categoryLabelVi: "Văn hoá Người Điếc",
      categoryLabelEn: "Deaf Culture",
      titleVi: "Sự khác biệt thú vị giữa Ngôn ngữ Ký hiệu Miền Bắc, Miền Trung và Miền Nam",
      titleEn: "Fascinating Regional Variations Across Northern, Central, and Southern VSL",
      excerptVi:
        "Cũng như phương ngữ tiếng nói, VSL tại Hà Nội, Đà Nẵng và TP.HCM có những nét biến thể cử chỉ thú vị phản ánh đời sống văn hoá từng vùng miền.",
      excerptEn:
        "Just like spoken dialects, VSL signs in Hanoi, Da Nang, and Ho Chi Minh City feature rich regional variations shaped by local history.",
      author: "Đội ngũ Giáo dục SignLight",
      date: "2026-08-20",
      readTimeVi: "7 phút đọc",
      readTimeEn: "7 min read",
    },
    {
      id: "inclusive-workplace-vsl",
      category: "community",
      categoryLabelVi: "Cộng đồng & Xã hội",
      categoryLabelEn: "Community",
      titleVi: "Xây dựng nơi làm việc hoà nhập: Bài học từ các doanh nghiệp tiên phong",
      titleEn: "Building an Accessible Workplace: Practical Lessons from Inclusive Employers",
      excerptVi:
        "Tại sao việc trang bị kỹ năng ký hiệu cơ bản cho bộ phận nhân sự và chăm sóc khách hàng lại giúp gia tăng 40% chỉ số gắn kết của đội ngũ.",
      excerptEn:
        "Why training HR and frontline customer service teams in basic signs improves organizational empathy and employee retention by up to 40%.",
      author: "SignLight Enterprise",
      date: "2026-08-14",
      readTimeVi: "5 phút đọc",
      readTimeEn: "5 min read",
    },
  ];
  const [serverArticles, setServerArticles] = useState<any[]>([]);

  useEffect(() => {
    apiCall<any[]>("/api/v1/articles")
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((a) => ({
            id: a.slug || a.id,
            category: a.category,
            categoryLabelVi: a.categoryLabelVi || "Mẹo học tập",
            categoryLabelEn: a.categoryLabelEn || "Learning Tips",
            titleVi: a.titleVi,
            titleEn: a.titleEn || a.titleVi,
            excerptVi: a.excerptVi || "",
            excerptEn: a.excerptEn || a.excerptVi || "",
            contentVi: a.contentVi,
            contentEn: a.contentEn,
            author: a.author || "Đội ngũ SignLight",
            date: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "2026-09-20",
            readTimeVi: a.readTimeVi || "5 phút đọc",
            readTimeEn: a.readTimeEn || "5 min read",
            tags: a.tags || [],
          }));
          setServerArticles(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const allPosts = useMemo(() => {
    return serverArticles.length > 0 ? serverArticles : posts;
  }, [serverArticles]);

  const filteredPosts = useMemo(() => {
    return activeCategory === "all"
      ? allPosts
      : allPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory, allPosts]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const selectedPost = useMemo(() => {
    return allPosts.find((p) => p.id === selectedPostId) ?? null;
  }, [selectedPostId, allPosts]);

  return (
    <div className="w-full bg-ink-50 min-h-screen py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-xs font-bold mb-4 border border-brand-200">
              {t("Cẩm nang SignLight • Blog", "SignLight Blog • Insights")}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900">
              {t("Kiến thức & Câu chuyện Ký hiệu VSL", "Insights & Stories on VSL & Deaf Culture")}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-ink-700">
              {t(
                "Khám phá cẩm nang học tập, văn hoá Người Điếc Việt Nam và các tiến bộ công nghệ AI hỗ trợ giao tiếp.",
                "Explore learning guides, Vietnamese Deaf culture, and AI accessibility breakthroughs."
              )}
            </p>
          </div>
        </ScrollReveal>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-ink-700 border border-ink-200 hover:bg-ink-100 hover:text-ink-900"
              }`}
            >
              {lang === "vi" ? cat.labelVi : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredPosts.map((post, idx) => (
            <ScrollReveal key={post.id} direction="up" delay={idx * 80}>
              <article
                onClick={() => setSelectedPostId(post.id)}
                className="card cursor-pointer p-6 hover:border-brand-500 transition-all flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold">
                      {lang === "vi" ? post.categoryLabelVi : post.categoryLabelEn}
                    </span>
                    <span className="text-xs text-ink-600">
                      {lang === "vi" ? post.readTimeVi : post.readTimeEn}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-500 transition-colors line-clamp-2 mb-2">
                    {lang === "vi" ? post.titleVi : post.titleEn}
                  </h2>

                  <p className="text-sm text-ink-700 leading-relaxed line-clamp-3 mb-4">
                    {lang === "vi" ? post.excerptVi : post.excerptEn}
                  </p>
                </div>

                <div className="pt-4 border-t border-ink-200 flex items-center justify-between text-xs text-ink-600">
                  <span className="font-semibold">{post.author}</span>
                  <span className="font-bold text-brand-500 group-hover:underline">
                    {t("Đọc tiếp →", "Read →")}
                  </span>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Selected Article Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
                aria-label={t("Đóng", "Close")}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold">
                  {lang === "vi" ? selectedPost.categoryLabelVi : selectedPost.categoryLabelEn}
                </span>
                <span className="text-xs text-ink-600">
                  {lang === "vi" ? selectedPost.readTimeVi : selectedPost.readTimeEn}
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-ink-900 mb-4">
                {lang === "vi" ? selectedPost.titleVi : selectedPost.titleEn}
              </h2>

              <div className="text-xs text-ink-600 mb-6 pb-4 border-b border-ink-200 flex items-center justify-between">
                <span>{selectedPost.author}</span>
                <span>{selectedPost.date}</span>
              </div>

              <div className="prose text-ink-700 text-sm sm:text-base leading-relaxed space-y-4 mb-8">
                <p>{lang === "vi" ? selectedPost.excerptVi : selectedPost.excerptEn}</p>
                <p>
                  {t(
                    "Ngôn ngữ Ký hiệu Việt Nam (VSL) là hệ thống giao tiếp sống động của cộng đồng người Điếc trên khắp cả nước. Mỗi cử chỉ bàn tay kết hợp cùng vị trí cơ thể, hướng lòng bàn tay và biểu cảm gương mặt tạo nên cấu trúc ngữ nghĩa chặt chẽ và biểu cảm tinh tế.",
                    "Vietnamese Sign Language (VSL) is a living linguistic system embracing manual gestures, spatial orientation, and facial grammar. Mastering fundamentals opens authentic communication channels with the Deaf community."
                  )}
                </p>
                <p>
                  {t(
                    "Với SignLight, bạn có thể thực hành nhận diện cử chỉ từng bước ngay trên trình duyệt và nhận phản hồi chấm điểm theo thời gian thực từ AI, giúp việc học trở nên dễ dàng và tự nhiên hơn bao giờ hết.",
                    "SignLight empowers you to practice dynamic signing sequences directly in your browser with real-time AI recognition feedback, making the learning curve effortless and enjoyable."
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-200">
                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  className="btn btn-secondary btn-sm"
                >
                  {t("Đóng", "Close")}
                </button>
                <Link
                  href="/hoc"
                  className="btn btn-primary btn-sm"
                >
                  {t("Vào học thử ngay", "Start Practicing Now")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Box */}
        <ScrollReveal direction="up">
          <div className="card p-8 sm:p-12 text-center max-w-3xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ink-900 mb-2">
              {t("Đăng ký nhận bài viết mới & mẹo học VSL", "Subscribe to VSL Guides & Tips")}
            </h2>
            <p className="text-sm text-ink-600 mb-6 max-w-md mx-auto">
              {t(
                "Cập nhật những ký hiệu mới, phương pháp ghi nhớ phản xạ và hoạt động cộng đồng mỗi tuần.",
                "Receive new vocabulary breakdowns, recall techniques, and community stories every week."
              )}
            </p>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 text-sm font-bold max-w-md mx-auto">
                {t(
                  "Cảm ơn bạn! Chúng tôi đã ghi nhận email đăng ký nhận tin.",
                  "Thank you! You are now subscribed to SignLight updates."
                )}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("Nhập địa chỉ email của bạn...", "Enter your email...")}
                  className="w-full px-4 py-3 rounded-full border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto shrink-0"
                >
                  {t("Đăng ký", "Subscribe")}
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
