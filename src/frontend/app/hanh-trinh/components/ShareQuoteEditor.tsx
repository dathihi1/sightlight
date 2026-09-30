"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SharePresetTemplate, LearnerStats } from "../types";

interface ShareQuoteEditorProps {
  presets: SharePresetTemplate[];
  selectedPresetId: string;
  onSelectPreset: (preset: SharePresetTemplate) => void;
  customQuote: string;
  onQuoteChange: (newQuote: string) => void;
  onResetQuote: () => void;
  stats: LearnerStats;
  learnerName: string;
}

export function ShareQuoteEditor({
  presets,
  selectedPresetId,
  onSelectPreset,
  customQuote,
  onQuoteChange,
  onResetQuote,
  stats,
  learnerName,
}: ShareQuoteEditorProps) {
  const { lang, t } = useLanguage();

  const charCount = customQuote.length;
  const maxRecommended = 350;
  const isOverLength = charCount > maxRecommended;

  const handleInsertTag = (tag: string) => {
    onQuoteChange(`${customQuote} ${tag}`.trim());
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
      {/* Step 1: Choose Theme */}
      <div className="space-y-3">
        <div className="border-b border-[#E2DBD0] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#08757a]">
            {t("Bước 1", "Step 1")}
          </span>
          <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">
            {t("Chọn chủ đề thông điệp gợi ý", "Choose a suggested story theme")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#0d9fa5] bg-[#e6f7f8]/50 shadow-xs ring-2 ring-[#0d9fa5]/20"
                    : "border-[#E2DBD0] bg-white hover:bg-[#F4EFE6]/60 hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0F172A]">
                    {lang === "vi" ? preset.titleVi : preset.titleEn}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-[#0d9fa5] bg-[#0d9fa5]" : "border-[#CBD5E1] bg-white"
                    }`}
                  >
                    {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                  {lang === "vi" ? preset.descriptionVi : preset.descriptionEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Edit Custom Quote */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DBD0] pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08757a]">
              {t("Bước 2", "Step 2")}
            </span>
            <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">
              {t("Tuỳ chỉnh đoạn văn truyền cảm hứng của bạn", "Customize your inspiring quote")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onResetQuote}
            className="text-xs font-bold text-[#64748B] hover:text-[#0d9fa5] underline transition-colors cursor-pointer"
          >
            {t("Đặt lại mẫu", "Reset text")}
          </button>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <textarea
            value={customQuote}
            onChange={(e) => onQuoteChange(e.target.value)}
            rows={4}
            placeholder={t(
              "Viết lời nhắn gửi truyền cảm hứng của riêng bạn...",
              "Write your own personalized inspiring message..."
            )}
            className={`w-full rounded-2xl border p-4 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 transition-all resize-y ${
              isOverLength
                ? "border-amber-400 focus:ring-amber-200"
                : "border-[#E2DBD0] focus:border-[#0d9fa5] focus:ring-[#0d9fa5]/20 bg-[#FAF7F2]"
            }`}
          />

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">
              {t("Khuyến nghị: 80 - 350 ký tự để thẻ hiển thị trọn vẹn nhất.", "Recommended: 80 - 350 chars for optimal display.")}
            </span>
            <span className={`font-mono font-bold ${isOverLength ? "text-amber-600" : "text-[#64748B]"}`}>
              {charCount}/{maxRecommended}
            </span>
          </div>
        </div>

        {/* Quick Insert Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            {t("Chèn nhanh thông số cá nhân", "Quick Insert Tags")}:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleInsertTag(`chuỗi ${stats.streakDays} ngày`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors cursor-pointer"
            >
              + {stats.streakDays} {t("ngày học", "days")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(`${stats.signsMastered} ký hiệu`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] border border-[#b2e7e9] hover:bg-[#b2e7e9] transition-colors cursor-pointer"
            >
              + {stats.signsMastered} {t("ký hiệu", "signs")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(`chuẩn xác ${stats.averageScore}%`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              + {stats.averageScore}% {t("chuẩn AI", "AI accuracy")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(learnerName)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F4EFE6] text-[#0F172A] border border-[#E2DBD0] hover:bg-white transition-colors cursor-pointer"
            >
              + {learnerName}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag("#SignLight #VSL #HocNgonNguKyHieu")}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              + Hashtags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
