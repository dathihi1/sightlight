"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";
import { apiCall, ApiError } from "@/lib/api";
import { SignLightLogo } from "@/components/SignLightLogo";

interface MeResult {
  preferences: { activeCourseId: string | null };
  profile: { displayName: string; email?: string };
}

interface LearningPath {
  courseId: string;
  courseName: string;
  nextLessonId: string | null;
  units: UnitNode[];
}

interface UnitNode {
  id: string;
  title: string;
  isFree: boolean;
  chapters: ChapterNode[];
}

interface ChapterNode {
  id: string;
  title: string;
  lessons: LessonNode[];
}

interface LessonNode {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  locked: boolean;
  premiumLocked: boolean;
  bestScorePercent?: number | null;
}

export default function LearningJourneyPage() {
  const { t } = useLanguage();
  const { isLoggedIn, isClient, user: sessionUser } = useAuthSession();
  const [activeTab, setActiveTab] = useState<"review" | "share">("review");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiCall<MeResult>("/api/v1/me"),
    enabled: isClient && isLoggedIn,
  });

  const activeCourseId = meQuery.data?.preferences.activeCourseId ?? null;

  const pathQuery = useQuery({
    queryKey: ["path", activeCourseId],
    enabled: Boolean(activeCourseId),
    queryFn: () => apiCall<LearningPath>(`/api/v1/courses/${activeCourseId}/path`),
  });

  // Calculate learner stats from course path or sensible defaults
  const stats = useMemo(() => {
    if (!pathQuery.data) {
      return {
        completedLessons: 6,
        totalLessons: 24,
        averageScore: 94,
        signsMastered: 42,
        streakDays: 7,
      };
    }

    let completed = 0;
    let total = 0;
    let scoreSum = 0;
    let scoredLessons = 0;

    for (const unit of pathQuery.data.units) {
      for (const chapter of unit.chapters) {
        for (const lesson of chapter.lessons) {
          total++;
          if (lesson.status === "COMPLETED") {
            completed++;
            if (lesson.bestScorePercent != null) {
              scoreSum += lesson.bestScorePercent;
              scoredLessons++;
            }
          }
        }
      }
    }

    const avg = scoredLessons > 0 ? Math.round(scoreSum / scoredLessons) : 92;
    // Estimate signs mastered based on completed lessons (approx 6 signs/lesson)
    const signs = Math.max(completed * 6, 12);

    return {
      completedLessons: completed,
      totalLessons: Math.max(total, 1),
      averageScore: avg,
      signsMastered: signs,
      streakDays: 7,
    };
  }, [pathQuery.data]);

  const learnerName =
    meQuery.data?.profile?.displayName ??
    sessionUser?.profile?.displayName ??
    t("Học viên SignLight", "SignLight Learner");

  const shareMessages = [
    {
      title: t("Lan toả sự thấu cảm", "Spreading Empathy"),
      description: t("Thông điệp truyền cảm hứng về ngôn ngữ ký hiệu", "Inspiring message about sign language"),
      text: t(
        `"Mỗi ký hiệu VSL được học là một nhịp cầu gắn kết yêu thương với cộng đồng Người Điếc Việt Nam. Tôi đang học Ngôn ngữ Ký hiệu trên SignLight và đã làm chủ ${stats.signsMastered} ký hiệu với độ chính xác AI ${stats.averageScore}%. Hãy cùng tôi kết nối nhé!"`,
        `"Every VSL sign learned is a bridge of empathy connecting us with the Vietnamese Deaf community. I'm learning Sign Language on SignLight and have mastered ${stats.signsMastered} signs with ${stats.averageScore}% AI accuracy. Join me in connecting hearts!"`,
      ),
    },
    {
      title: t("Kỷ niệm chặng đường", "Milestone Celebration"),
      description: t("Chia sẻ thành tích và độ chuẩn xác học tập", "Share achievement and learning accuracy"),
      text: t(
        `"Tự hào hoàn thành ${stats.completedLessons}/${stats.totalLessons} bài học VSL trên SignLight! Nhờ công nghệ AI chấm dáng tay tức thì qua camera, mình đã đạt chuỗi ${stats.streakDays} ngày kiên trì. Bắt đầu học VSL miễn phí ngay hôm nay!"`,
        `"Proud to have completed ${stats.completedLessons}/${stats.totalLessons} VSL lessons on SignLight! Thanks to real-time AI camera feedback, I achieved a ${stats.streakDays}-day streak. Start learning VSL for free today!"`,
      ),
    },
    {
      title: t("Rủ bạn bè cùng học", "Invite Friends to Learn"),
      description: t("Kêu gọi cộng đồng tham gia học VSL", "Invite community to join VSL learning"),
      text: t(
        `"Học Ngôn ngữ Ký hiệu Việt Nam (VSL) không khó như bạn nghĩ! Giao diện trực quan, luyện động tác trước camera và nhận phản hồi tức thì. Cùng mình tham gia SignLight để xoá nhoà rào cản giao tiếp nhé: https://signlight.vn"`,
        `"Learning Vietnamese Sign Language is fun and accessible! With real-time camera AI feedback, practicing is intuitive and engaging. Join me on SignLight to bridge communication boundaries: https://signlight.vn"`,
      ),
    },
  ];

  const handleCopy = () => {
    const currentMsg = shareMessages[selectedMessageIndex];
    const fullText = `${currentMsg.text}\n\n👉 Khám phá tại: https://signlight.vn`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleShareSocial = (platform: "facebook" | "x" | "linkedin") => {
    const shareUrl = encodeURIComponent("https://signlight.vn");
    const shareText = encodeURIComponent(shareMessages[selectedMessageIndex].text);

    let targetUrl = "";
    if (platform === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
    } else if (platform === "x") {
      targetUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    } else if (platform === "linkedin") {
      targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "width=600,height=500,menubar=no,toolbar=no");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Toast Notification for Clipboard Copy */}
      {copied && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-3.5 text-sm font-bold text-white shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <svg className="w-5 h-5 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t("Đã sao chép thông điệp và liên kết vào bộ nhớ tạm!", "Message & link copied to clipboard!")}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            <Link href="/hoc" className="hover:text-[#0d9fa5] transition-colors">
              {t("Lộ trình học", "Curriculum")}
            </Link>
            <span>/</span>
            <span className="text-[#0d9fa5]">{t("Hành trình cá nhân", "Personal Journey")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {t("Hành trình VSL của bạn", "Your VSL Journey")}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {t(
              "Nơi ghi dấu từng cột mốc, tôn vinh nỗ lực kiên trì và lan toả ngôn ngữ ký hiệu tới cộng đồng.",
              "Documenting milestones, honoring persistence, and spreading sign language across communities.",
            )}
          </p>
        </div>

        {/* Tab Switcher: Xem lại vs Lan toả */}
        <div className="flex items-center p-1.5 rounded-full bg-white border border-[#E2DBD0] shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "review"
                ? "bg-[#0d9fa5] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t("Xem lại hành trình", "Review Journey")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("share")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "share"
                ? "bg-[#0d9fa5] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{t("Lan toả & Chia sẻ", "Spread & Share")}</span>
          </button>
        </div>
      </div>

      {/* User Hero Showcase Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#08757a] via-[#0d9fa5] to-[#38bdf8] p-1 shadow-md shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#08757a] uppercase">
                {learnerName.charAt(0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">{learnerName}</h2>
                <span className="rounded-full bg-[#e6f7f8] border border-[#b2e7e9] px-3 py-0.5 text-xs font-bold text-[#08757a]">
                  {t("Đại sứ VSL", "VSL Ambassador")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B]">
                {t("Mục tiêu học tập: 15 phút mỗi ngày • Lộ trình chuẩn VSL", "Daily Goal: 15 mins/day • Standard VSL Curriculum")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/hoc"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] text-white font-bold text-sm shadow-xs transition-all hover:scale-102"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>{t("Tiếp tục học ngay", "Continue Learning")}</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab("share")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2DBD0] bg-[#F4EFE6] hover:bg-white text-[#0F172A] font-bold text-sm transition-all"
            >
              <svg className="w-4 h-4 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{t("Tạo thẻ chia sẻ", "Create Share Card")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Statistics Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Completed Lessons */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Bài học hoàn thành", "Completed Lessons")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#e6f7f8] text-[#08757a] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.completedLessons}
            <span className="text-sm font-bold text-[#64748B] ml-1">/{stats.totalLessons}</span>
          </div>
          <div className="w-full bg-[#F4EFE6] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0d9fa5] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((stats.completedLessons / stats.totalLessons) * 100))}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Streak Days */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Chuỗi ngày kiên trì", "Day Streak")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.streakDays}
            <span className="text-sm font-bold text-[#64748B] ml-1">{t("ngày liên tiếp", "days")}</span>
          </div>
          <p className="text-xs text-[#0d9fa5] font-semibold">
            {t("Giữ lửa học tập mỗi ngày", "Keep the learning streak alive")}
          </p>
        </div>

        {/* Stat 3: AI Accuracy */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Độ chuẩn xác AI", "AI Accuracy")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#e6f7f8] text-[#08757a] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.averageScore}%
          </div>
          <p className="text-xs text-[#64748B]">
            {t("Đánh giá cử chỉ qua Camera", "Real-time camera pose feedback")}
          </p>
        </div>

        {/* Stat 4: Mastered Signs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Ký hiệu đã thuần thục", "Signs Mastered")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F4EFE6] text-[#0F172A] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2m-5 9H4a2 2 0 01-2-2v-5a2 2 0 012-2h3" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.signsMastered}
            <span className="text-sm font-bold text-[#64748B] ml-1">{t("từ vựng", "signs")}</span>
          </div>
          <p className="text-xs text-[#64748B]">
            {t("Bao gồm chữ số & từ giao tiếp", "Fingerspelling & everyday words")}
          </p>
        </div>
      </section>

      {/* TAB 1: XEM LẠI HÀNH TRÌNH (REVIEW) */}
      {activeTab === "review" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Timeline of Milestones */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#E2DBD0] pb-4">
              <h3 className="text-xl font-extrabold text-[#0F172A]">
                {t("Cột mốc đáng nhớ trong hành trình", "Memorable Milestones")}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                {t(
                  "Từng bước chân kiên trì học hỏi và đồng hành cùng cộng đồng người Điếc.",
                  "Every persistent step taken alongside the Deaf community.",
                )}
              </p>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DBD0]">
              {/* Milestone 1 */}
              <div className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-[#0d9fa5] ring-4 ring-[#e6f7f8] flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <div className="bg-[#F4EFE6]/60 rounded-2xl p-4.5 border border-[#E2DBD0] hover:bg-white transition-all space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {t("Khởi đầu hành trình VSL", "Starting the VSL Journey")}
                    </h4>
                    <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-0.5 rounded-full border border-[#b2e7e9]">
                      {t("Đã hoàn thành", "Achieved")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    {t(
                      "Làm quen với văn hoá giao tiếp của người Điếc và cấu trúc không gian ký hiệu ba chiều.",
                      "Introduction to Deaf communication culture and 3D spatial sign structure.",
                    )}
                  </p>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-[#0d9fa5] ring-4 ring-[#e6f7f8] flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <div className="bg-[#F4EFE6]/60 rounded-2xl p-4.5 border border-[#E2DBD0] hover:bg-white transition-all space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {t("Thành thạo Bảng chữ cái ngón tay", "Mastering Fingerspelling Alphabet")}
                    </h4>
                    <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-0.5 rounded-full border border-[#b2e7e9]">
                      {t("Đã hoàn thành", "Achieved")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    {t(
                      "Thuần thục 29 chữ cái ngón tay và quy tắc đánh vần tên riêng, địa danh Việt Nam.",
                      "Mastered all 29 Vietnamese fingerspelling letters and proper noun spelling conventions.",
                    )}
                  </p>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-[#0d9fa5] ring-4 ring-[#e6f7f8] flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <div className="bg-[#F4EFE6]/60 rounded-2xl p-4.5 border border-[#E2DBD0] hover:bg-white transition-all space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {t("Chinh phục AI Camera tương tác", "Conquering Real-time AI Camera")}
                    </h4>
                    <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-0.5 rounded-full border border-[#b2e7e9]">
                      {t("95% Chuẩn xác", "95% Accurate")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    {t(
                      "Thực hành động tác trước Camera với mô hình nhận diện khung xương bàn tay và cơ thể tức thì.",
                      "Practicing dynamic gestures with on-device hand landmark and pose estimation.",
                    )}
                  </p>
                </div>
              </div>

              {/* Milestone 4 */}
              <div className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#0d9fa5] ring-4 ring-[#F4EFE6] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#0d9fa5]" />
                </div>
                <div className="bg-white rounded-2xl p-4.5 border-2 border-[#b2e7e9] shadow-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {t("Giao tiếp Đời sống & Gia đình", "Daily Life & Family Communication")}
                    </h4>
                    <span className="text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                      {t("Đang chinh phục", "In Progress")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569]">
                    {t(
                      "Nắm vững 50 cụm từ chào hỏi, biểu đạt cảm xúc và đối thoại thông dụng.",
                      "Mastering 50 common greeting phrases, emotions, and practical dialogue patterns.",
                    )}
                  </p>
                </div>
              </div>

              {/* Milestone 5 */}
              <div className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#CBD5E1] ring-4 ring-[#F4EFE6] flex items-center justify-center" />
                <div className="bg-[#F4EFE6]/40 rounded-2xl p-4.5 border border-[#E2DBD0] space-y-1 text-[#94A3B8]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-[#64748B]">
                      {t("Đại sứ Kết nối Cộng đồng", "Community Inclusion Ambassador")}
                    </h4>
                    <span className="text-xs font-bold text-[#64748B] bg-white px-2.5 py-0.5 rounded-full border border-[#E2DBD0]">
                      {t("Mục tiêu tiếp theo", "Next Goal")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    {t(
                      "Lan toả thông điệp học ngôn ngữ ký hiệu tới 100 người bạn và đồng nghiệp.",
                      "Sharing the sign language learning message with 100 friends and colleagues.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Badges Collection */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#E2DBD0] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A]">
                  {t("Huy hiệu vinh danh", "Badges & Achievements")}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  {t("Phần thưởng ghi nhận nỗ lực rèn luyện mỗi ngày", "Recognition for persistent daily practice")}
                </p>
              </div>
              <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-3 py-1 rounded-full border border-[#b2e7e9]">
                4/6 {t("Huy hiệu", "Badges")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Badge 1 */}
              <div className="p-4.5 rounded-2xl border border-[#b2e7e9] bg-[#e6f7f8]/40 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0d9fa5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0F172A]">{t("Tia sáng đầu tiên", "First Spark")}</h5>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("Hoàn thành bài học VSL đầu tiên", "Completed the first VSL lesson")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#08757a]">✓ {t("Đã đạt được", "Earned")}</span>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="p-4.5 rounded-2xl border border-[#FDE68A] bg-[#FEF3C7]/40 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0F172A]">{t("Ngọn lửa bền bỉ", "Persistent Flame")}</h5>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("Duy trì chuỗi học 7 ngày liên tục", "Maintained a 7-day study streak")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#B45309]">✓ {t("Đã đạt được", "Earned")}</span>
                </div>
              </div>

              {/* Badge 3 */}
              <div className="p-4.5 rounded-2xl border border-[#b2e7e9] bg-[#e6f7f8]/40 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#08757a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0F172A]">{t("Bàn tay chuẩn xác", "Accurate Hand")}</h5>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("Đạt điểm AI Camera trên 90%", "Achieved camera AI score over 90%")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#08757a]">✓ {t("Đã đạt được", "Earned")}</span>
                </div>
              </div>

              {/* Badge 4 */}
              <div className="p-4.5 rounded-2xl border border-[#E2DBD0] bg-white flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0F172A]">{t("Nhịp cầu kết nối", "Bridge of Inclusion")}</h5>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("Chia sẻ hành trình học tập tới bạn bè", "Shared learning journey with peers")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#0d9fa5]">✓ {t("Đã mở khoá", "Unlocked")}</span>
                </div>
              </div>

              {/* Badge 5 (Locked) */}
              <div className="p-4.5 rounded-2xl border border-[#E2DBD0] bg-[#EDE6DA]/30 flex items-start gap-3.5 opacity-60">
                <div className="w-12 h-12 rounded-2xl bg-[#CBD5E1] text-[#64748B] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#64748B]">{t("Bậc thầy 100 ký hiệu", "100 Signs Master")}</h5>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {t("Thuộc làu 100 cử chỉ từ vựng VSL", "Master 100 vocabulary signs")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#94A3B8]">{stats.signsMastered}/100</span>
                </div>
              </div>

              {/* Badge 6 (Locked) */}
              <div className="p-4.5 rounded-2xl border border-[#E2DBD0] bg-[#EDE6DA]/30 flex items-start gap-3.5 opacity-60">
                <div className="w-12 h-12 rounded-2xl bg-[#CBD5E1] text-[#64748B] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#64748B]">{t("Đại sứ VSL Tinh hoa", "Master Ambassador")}</h5>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {t("Hoàn thành toàn bộ lộ trình VSL Nâng cao", "Complete the full advanced track")}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-[#94A3B8]">{t("Chưa mở", "Locked")}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: LAN TOẢ & CHIA SẺ (SHARE & SPREAD) */}
      {activeTab === "share" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          {/* Left Column: Live Card Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                {t("Xem trước thẻ thành tích", "Live Card Preview")}
              </span>
              <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-0.5 rounded-full border border-[#b2e7e9]">
                {t("Sẵn sàng chia sẻ", "Ready to Share")}
              </span>
            </div>

            {/* The High-End Shareable Card */}
            <div
              id="shareable-journey-card"
              className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-7 text-white shadow-2xl border border-white/10"
            >
              {/* Background ambient lighting accents */}
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-[#0d9fa5]/25 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-[#F59E0B]/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Brand & Badge Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <SignLightLogo size={36} />
                    <span className="text-lg font-extrabold tracking-tight">
                      SignLight<span className="text-[#0d9fa5]">.</span>
                    </span>
                  </div>
                  <span className="text-xs font-extrabold tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full border border-white/15 text-[#38bdf8]">
                    VSL Journey
                  </span>
                </div>

                {/* Learner Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#08757a] to-[#38bdf8] p-0.5">
                    <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-xl font-black text-white uppercase">
                      {learnerName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white leading-tight">{learnerName}</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {t("Học viên Ngôn ngữ Ký hiệu Việt Nam", "Vietnamese Sign Language Learner")}
                    </p>
                  </div>
                </div>

                {/* Inspiring Statement */}
                <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
                  <p className="text-xs sm:text-sm text-[#E2E8F0] italic leading-relaxed">
                    {shareMessages[selectedMessageIndex].text}
                  </p>
                </div>

                {/* 3 Golden Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-3.5 border border-white/10 text-center">
                  <div>
                    <div className="text-lg sm:text-xl font-black text-[#38bdf8]">{stats.streakDays} {t("ngày", "days")}</div>
                    <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Chuỗi học", "Streak")}</div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="text-lg sm:text-xl font-black text-[#FACC15]">{stats.signsMastered}</div>
                    <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Ký hiệu", "Signs")}</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-[#4ade80]">{stats.averageScore}%</div>
                    <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Chuẩn AI", "Accuracy")}</div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>signlight.vn</span>
                    <span>•</span>
                    <span className="text-[#38bdf8]">{t("Học VSL cùng AI", "Learn VSL with AI")}</span>
                  </div>
                  <span className="text-[11px] text-white/50 font-mono">ID: {stats.streakDays}D-{stats.signsMastered}S</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748B] text-center">
              {t(
                "Thẻ thành tích đại diện cho sự kiên trì và tinh thần sẻ chia vì một cộng đồng không rào cản.",
                "This achievement card represents persistence and inclusion for a barrier-free society.",
              )}
            </p>
          </div>

          {/* Right Column: Sharing Tools & Messages (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Story Message */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-4">
              <div className="border-b border-[#E2DBD0] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#08757a]">
                  {t("Bước 1", "Step 1")}
                </span>
                <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">
                  {t("Chọn thông điệp bạn muốn lan toả", "Choose the story you want to share")}
                </h3>
              </div>

              <div className="space-y-3">
                {shareMessages.map((msg, index) => {
                  const isSelected = selectedMessageIndex === index;
                  return (
                    <button
                      key={msg.title}
                      type="button"
                      onClick={() => setSelectedMessageIndex(index)}
                      className={`w-full text-left p-4.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#0d9fa5] bg-[#e6f7f8]/50 shadow-xs ring-2 ring-[#0d9fa5]/20"
                          : "border-[#E2DBD0] bg-white hover:bg-[#F4EFE6]/60 hover:border-[#CBD5E1]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#0F172A]">{msg.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#0d9fa5] bg-[#0d9fa5]" : "border-[#CBD5E1] bg-white"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">{msg.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: One-Click Sharing Options */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-5">
              <div className="border-b border-[#E2DBD0] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#08757a]">
                  {t("Bước 2", "Step 2")}
                </span>
                <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">
                  {t("Đăng tải & Lan toả tới mạng xã hội", "Publish & Spread to your network")}
                </h3>
              </div>

              {/* Primary Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-4 font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>
                  {copied
                    ? t("Đã sao chép vào bộ nhớ tạm!", "Copied to Clipboard!")
                    : t("Sao chép nội dung & Liên kết", "Copy Message & Link")}
                </span>
              </button>

              {/* Social Channels 1-Click Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleShareSocial("facebook")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#1877F2] transition-all cursor-pointer group"
                >
                  <svg className="w-6 h-6 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-xs font-bold text-[#0F172A]">Facebook</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleShareSocial("x")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#0F172A] transition-all cursor-pointer group"
                >
                  <svg className="w-6 h-6 text-[#0F172A] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-xs font-bold text-[#0F172A]">X (Twitter)</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleShareSocial("linkedin")}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#0A66C2] transition-all cursor-pointer group"
                >
                  <svg className="w-6 h-6 text-[#0A66C2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span className="text-xs font-bold text-[#0F172A]">LinkedIn</span>
                </button>
              </div>

              {/* Callout Notice */}
              <div className="rounded-2xl bg-[#e6f7f8]/50 p-4 border border-[#b2e7e9] flex items-start gap-3">
                <svg className="w-5 h-5 text-[#08757a] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-xs text-[#08757a] leading-relaxed">
                  {t(
                    "Mỗi lượt chia sẻ của bạn là một bước tiến quan trọng giúp mở rộng cơ hội tiếp cận tri thức và việc làm cho cộng đồng người Điếc tại Việt Nam.",
                    "Every share helps expand educational and employment opportunities for the Deaf community in Vietnam.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
