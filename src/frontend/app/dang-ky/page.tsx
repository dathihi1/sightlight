"use client";

import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { dispatchAuthChange } from "@/lib/useAuthSession";
import { useLanguage } from "@/context/LanguageContext";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import {
  GoogleCredentialResponse,
  initializeGoogleSignIn,
  renderGoogleButton,
} from "@/lib/googleAuth";
import {
  IconUsers,
  IconVideo,
  IconSearch,
  IconBook,
  IconSparkles,
  IconHandshake,
  IconBuilding,
  IconTarget,
  IconCards,
  IconWebcam,
  IconClock,
  IconFlame,
  IconLightning,
  IconCheck,
  IconArrowLeft,
  IconClose,
} from "@/components/ui/Icons";

interface RegisterResult {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  status: string;
  activeCourseId: string | null;
}

interface GoogleLoginResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  roles: string[];
  activeCourseId: string | null;
  requiresEmailVerification: boolean;
  pendingDeletion: boolean;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  // Bước hiện tại: 1 -> 5 (Bước 1-4: Khảo sát, Bước 5: Chốt tạo tài khoản)
  const [currentStep, setCurrentStep] = useState(1);

  // Câu trả lời khảo sát
  const [hearingAbout, setHearingAbout] = useState<string>("");
  const [learningReason, setLearningReason] = useState<string>("");
  const [skillLevel, setSkillLevel] = useState<string>("");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(10);

  // Form đăng ký tài khoản (Bước 5)
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialRef);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Khôi phục khảo sát từ sessionStorage nếu có
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("signlight_onboarding");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.hearingAbout) setHearingAbout(parsed.hearingAbout);
        if (parsed.learningReason) setLearningReason(parsed.learningReason);
        if (parsed.skillLevel) setSkillLevel(parsed.skillLevel);
        if (parsed.dailyGoalMinutes) setDailyGoalMinutes(parsed.dailyGoalMinutes);
      }
    } catch {
      // Bỏ qua lỗi parse storage
    }
  }, []);

  // Lưu tạm vào sessionStorage mỗi khi chọn
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "signlight_onboarding",
        JSON.stringify({
          hearingAbout,
          learningReason,
          skillLevel,
          dailyGoalMinutes,
        })
      );
    } catch {
      // Bỏ qua
    }
  }, [hearingAbout, learningReason, skillLevel, dailyGoalMinutes]);

  // Cấu hình Google Sign-In ở Bước 5
  useEffect(() => {
    if (currentStep !== 5 || !GOOGLE_CLIENT_ID) return;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      setError(null);
      setSubmitting(true);
      try {
        const result = await apiCall<GoogleLoginResult>("/api/v1/auth/google", {
          method: "POST",
          auth: false,
          body: {
            idToken: response.credential,
            referralCode: referralCode.trim() ? referralCode.trim() : undefined,
            dailyGoalMinutes,
          },
        });
        tokenStore.set(result.accessToken, result.refreshToken);
        dispatchAuthChange();
        try {
          sessionStorage.removeItem("signlight_onboarding");
        } catch {}

        if (result.requiresEmailVerification) {
          router.push("/xac-nhan-email");
        } else {
          router.push("/hoc");
        }
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.errorMessage
            : "Không kết nối được Google. Thử lại hoặc đăng nhập bằng email."
        );
      } finally {
        setSubmitting(false);
      }
    };

    initializeGoogleSignIn(GOOGLE_CLIENT_ID, handleCredential);
    renderGoogleButton("google-signup-btn");
  }, [currentStep, referralCode, dailyGoalMinutes, router]);

  // Submit form đăng ký qua Email/Mật khẩu
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall<RegisterResult>("/api/v1/auth/register", {
        method: "POST",
        auth: false,
        body: {
          displayName,
          email,
          password,
          acceptedTerms,
          referralCode: referralCode.trim() ? referralCode.trim() : undefined,
          dailyGoalMinutes,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      tokenStore.set(result.accessToken, result.refreshToken);
      dispatchAuthChange();
      try {
        sessionStorage.removeItem("signlight_onboarding");
      } catch {}

      // Sau đăng ký: chuyển đến trang xác nhận OTP email
      router.push("/xac-nhan-email?email=" + encodeURIComponent(email));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  // Danh sách các lựa chọn khảo sát
  const hearingOptions = [
    { id: "social", label: "Mạng xã hội (TikTok, Facebook, YouTube)", Icon: IconVideo },
    { id: "friends", label: "Bạn bè hoặc người quen giới thiệu", Icon: IconUsers },
    { id: "search", label: "Tìm kiếm trên Google", Icon: IconSearch },
    { id: "school", label: "Trường học, câu lạc bộ hoặc tổ chức", Icon: IconBook },
    { id: "other", label: "Nguồn khác", Icon: IconSparkles },
  ];

  const reasonOptions = [
    { id: "family_friends", label: "Giao tiếp với người thân, bạn bè khiếm thính", desc: "Kết nối yêu thương và phá bỏ rào cản", Icon: IconHandshake },
    { id: "work_volunteer", label: "Phục vụ công việc hoặc thiện nguyện", desc: "Hỗ trợ cộng đồng và mở rộng cơ hội nghề nghiệp", Icon: IconBuilding },
    { id: "curiosity", label: "Tò mò, yêu thích khám phá ngôn ngữ mới", desc: "Trải nghiệm ngôn ngữ cử chỉ đầy thú vị", Icon: IconSparkles },
    { id: "self_growth", label: "Rèn luyện trí nhớ và phản xạ cử chỉ", desc: "Phát triển tư duy hình ảnh và ngôn ngữ cơ thể", Icon: IconTarget },
  ];

  const levelOptions = [
    { id: "beginner", label: "Người mới bắt đầu (Chưa biết gì)", desc: "Bắt đầu từ bảng chữ cái ngón tay và các cử chỉ cơ bản nhất", Icon: IconBook },
    { id: "knows_alphabet", label: "Đã biết bảng chữ cái ngón tay", desc: "Sẵn sàng học các từ vựng và câu giao tiếp hoàn chỉnh", Icon: IconCards },
    { id: "intermediate", label: "Đã biết một số câu giao tiếp thông dụng", desc: "Muốn luyện tập nâng cao và kiểm tra chuẩn xác qua AI", Icon: IconWebcam },
  ];

  const goalOptions = [
    { minutes: 5, label: "5 phút / ngày", tag: "Nhẹ nhàng", desc: "Dễ duy trì mỗi ngày, phù hợp người bận rộn", Icon: IconClock },
    { minutes: 10, label: "10 phút / ngày", tag: "Tiêu chuẩn · Đề xuất", desc: "Tiến độ học tập tối ưu, ghi nhớ kiến thức vững chắc", Icon: IconTarget },
    { minutes: 15, label: "15 phút / ngày", tag: "Chăm chỉ", desc: "Tăng tốc nhanh chóng và duy trì chuỗi Streak ấn tượng", Icon: IconFlame },
    { minutes: 20, label: "20 phút / ngày", tag: "Bứt phá", desc: "Nắm vững ngôn ngữ ký hiệu trong thời gian ngắn nhất", Icon: IconLightning },
  ];

  const progressPercent = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen w-full flex flex-col bg-ink-50 justify-between">
      {/* Top Header & Progress Bar */}
      <header className="w-full max-w-2xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        <div className="w-10 flex items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="p-2 -ml-2 rounded-full text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
              aria-label="Quay lại"
              title="Quay lại"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href="/"
              className="p-2 -ml-2 rounded-full text-ink-400 hover:text-ink-800 hover:bg-ink-100 transition cursor-pointer"
              aria-label="Thoát về trang chủ"
              title="Thoát về trang chủ"
            >
              <IconClose className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Thanh tiến trình */}
        <div className="flex-1 max-w-md">
          <div className="h-3 w-full rounded-full bg-ink-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="w-16 flex items-center justify-end">
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="text-xs font-semibold text-ink-400 hover:text-ink-700 transition cursor-pointer"
            >
              Bỏ qua
            </button>
          ) : (
            <span className="text-xs font-bold text-brand-600">Bước 5/5</span>
          )}
        </div>
      </header>

      {/* Vùng nội dung khảo sát & tạo tài khoản */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 py-4 sm:py-8 flex flex-col justify-center">

      {/* ==================== BƯỚC 1: NGUỒN BIẾT ĐẾN ==================== */}
      {currentStep === 1 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <Mascot className="w-14 shrink-0" wave />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
                Bạn biết đến SignLight qua đâu?
              </h1>
              <p className="text-xs text-ink-500 mt-1">Giúp chúng tôi kết nối tốt hơn với cộng đồng học ký hiệu.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {hearingOptions.map((opt) => {
              const selected = hearingAbout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHearingAbout(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selected
                      ? "border-brand-500 bg-brand-50/60 shadow-sm"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`p-2.5 rounded-xl border ${selected ? "bg-brand-500 text-white border-brand-500" : "bg-ink-50 text-ink-700 border-ink-200"}`}>
                      <opt.Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-ink-900">{opt.label}</span>
                  </div>
                  {selected && <IconCheck className="h-5 w-5 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!hearingAbout}
            onClick={() => setCurrentStep(2)}
            className="btn btn-primary w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* ==================== BƯỚC 2: LÝ DO HỌC ==================== */}
      {currentStep === 2 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <Mascot className="w-14 shrink-0" wave />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
                Lý do bạn học Ngôn ngữ Ký hiệu?
              </h1>
              <p className="text-xs text-ink-500 mt-1">Chúng tôi sẽ điều chỉnh nội dung bài học phù hợp với bạn.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {reasonOptions.map((opt) => {
              const selected = learningReason === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLearningReason(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                    selected
                      ? "border-brand-500 bg-brand-50/60 shadow-sm"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${selected ? "bg-brand-500 text-white border-brand-500" : "bg-ink-50 text-ink-700 border-ink-200"}`}>
                      <opt.Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{opt.label}</p>
                      <p className="text-xs text-ink-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  {selected && <IconCheck className="h-5 w-5 text-brand-600 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!learningReason}
            onClick={() => setCurrentStep(3)}
            className="btn btn-primary w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* ==================== BƯỚC 3: TRÌNH ĐỘ HIỆN TẠI ==================== */}
      {currentStep === 3 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <Mascot className="w-14 shrink-0" wave />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
                Trình độ hiện tại của bạn thế nào?
              </h1>
              <p className="text-xs text-ink-500 mt-1">Đừng lo lắng! SignLight thiết kế bài học cho mọi cấp độ.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {levelOptions.map((opt) => {
              const selected = skillLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSkillLevel(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                    selected
                      ? "border-brand-500 bg-brand-50/60 shadow-sm"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${selected ? "bg-brand-500 text-white border-brand-500" : "bg-ink-50 text-ink-700 border-ink-200"}`}>
                      <opt.Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{opt.label}</p>
                      <p className="text-xs text-ink-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  {selected && <IconCheck className="h-5 w-5 text-brand-600 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!skillLevel}
            onClick={() => setCurrentStep(4)}
            className="btn btn-primary w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* ==================== BƯỚC 4: MỤC TIÊU PHÚT HỌC ==================== */}
      {currentStep === 4 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <Mascot className="w-14 shrink-0" wave />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
                Mục tiêu luyện tập mỗi ngày?
              </h1>
              <p className="text-xs text-ink-500 mt-1">Dùng để tính chuỗi ngày Streak duy trì thói quen học tập.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {goalOptions.map((opt) => {
              const selected = dailyGoalMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setDailyGoalMinutes(opt.minutes)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                    selected
                      ? "border-brand-500 bg-brand-50/60 shadow-sm"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${selected ? "bg-brand-500 text-white border-brand-500" : "bg-ink-50 text-ink-700 border-ink-200"}`}>
                      <opt.Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink-900">{opt.label}</p>
                        <span className="text-[11px] font-semibold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-md">
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  {selected && <IconCheck className="h-5 w-5 text-brand-600 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className="btn btn-primary w-full cursor-pointer"
          >
            Xem lộ trình & Tạo tài khoản
          </button>
        </div>
      )}

      {/* ==================== BƯỚC 5: TẠO TÀI KHOẢN (CHỐT) ==================== */}
      {currentStep === 5 && (
        <div className="card p-6 sm:p-9 space-y-6 animate-in fade-in-50 duration-200">
          {/* Header & Personalised Summary Card */}
          <div className="text-center space-y-2">
            <Mascot className="mx-auto mb-1 w-16" wave />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
              Lộ trình của bạn đã sẵn sàng!
            </h1>
            <p className="text-sm text-ink-600">
              Tạo tài khoản để lưu lộ trình học và bắt đầu tích lũy chuỗi ngày Streak.
            </p>
          </div>

          {/* Card tóm tắt khảo sát cá nhân */}
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50/70 via-sky-50/50 to-brand-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Kế hoạch học tập cá nhân
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 border border-brand-100">
                <span className="text-ink-500 block">Mục tiêu ngày:</span>
                <span className="font-bold text-ink-900 flex items-center gap-1 mt-0.5">
                  <IconClock className="h-3.5 w-3.5 text-brand-600" />
                  {dailyGoalMinutes} phút / ngày
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-brand-100">
                <span className="text-ink-500 block">Trình độ bắt đầu:</span>
                <span className="font-bold text-ink-900 flex items-center gap-1 mt-0.5">
                  <IconBook className="h-3.5 w-3.5 text-emerald-600" />
                  {skillLevel === "knows_alphabet"
                    ? "Đã biết chữ cái"
                    : skillLevel === "intermediate"
                    ? "Cơ bản"
                    : "Mới tinh"}
                </span>
              </div>
            </div>
          </div>

          {/* Đăng nhập nhanh với Google */}
          {GOOGLE_CLIENT_ID ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-center text-ink-500">
                Đăng ký nhanh bằng 1 click:
              </p>
              <div id="google-signup-btn" className="w-full min-h-[44px]" />
            </div>
          ) : null}

          {GOOGLE_CLIENT_ID && (
            <div className="relative flex items-center justify-center">
              <div className="grow border-t border-ink-100" />
              <span className="shrink-0 px-3 text-xs font-bold tracking-widest text-ink-400 bg-white uppercase">
                {t("hoặc với email", "or with email")}
              </span>
              <div className="grow border-t border-ink-100" />
            </div>
          )}

          {/* Form tạo tài khoản qua Email */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="displayName" className="block text-sm font-semibold text-ink-800">
                {t("Tên hiển thị", "Display name")}
              </label>
              <input
                id="displayName"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="VD: Minh Anh"
                className="input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-semibold text-ink-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-ink-800">
                {t("Mật khẩu", "Password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tối thiểu 10 ký tự (chữ & số)"
                aria-describedby="password-hint"
                className="input"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="referralCode" className="block text-sm font-semibold text-ink-800">
                  {t("Mã giới thiệu (nếu có)", "Referral code (optional)")}
                </label>
                {referralCode && (
                  <span className="text-xs font-semibold text-emerald-600">
                    {t("✓ Đã áp dụng", "✓ Applied")}
                  </span>
                )}
              </div>
              <input
                id="referralCode"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                placeholder="VD: SL8X9A2K"
                maxLength={20}
                className="input font-mono uppercase tracking-wider text-sm"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-ink-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 rounded accent-brand-500 focus:ring-brand-500 cursor-pointer"
              />
              <span>
                {t(
                  "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.",
                  "I agree to the Terms of Service and Privacy Policy."
                )}
              </span>
            </label>

            {error && <ErrorNotice message={error} />}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full cursor-pointer disabled:opacity-50"
            >
              {submitting ? t("Đang tạo tài khoản...", "Creating account...") : t("Hoàn tất & Bắt đầu học", "Complete & Start Learning")}
            </button>
          </form>

          <p className="text-xs text-ink-500 text-center">
            {t("Đã có tài khoản?", "Already have an account?")}{" "}
            <Link href="/dang-nhap" className="font-semibold text-brand-600 hover:underline">
              {t("Đăng nhập", "Log In")}
            </Link>
          </p>
        </div>
      )}
      </div>

      {/* Bottom spacer for layout balance */}
      <div className="h-4 sm:h-8" />
    </div>
  );
}
