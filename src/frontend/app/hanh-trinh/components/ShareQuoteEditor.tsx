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
    <div className="card p-6 sm:p-8 space-y-6">
      {/* Step 1: Choose Theme */}
      <div className="space-y-3">
        <div className="border-b border-ink-200 pb-3">
          <span className="text-xs font-bold text-brand-600">
            {t("Bước 1", "Step 1")}
          </span>
          <h3 className="text-lg font-semibold text-ink-900 mt-0.5">
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
                    ? "border-brand-500 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/20"
                    : "border-ink-200 bg-white hover:bg-ink-50/60 hover:border-ink-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink-900">
                    {lang === "vi" ? preset.titleVi : preset.titleEn}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-brand-500 bg-brand-500" : "border-ink-300 bg-white"
                    }`}
                  >
                    {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-ink-600 mt-1 line-clamp-1">
                  {lang === "vi" ? preset.descriptionVi : preset.descriptionEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Edit Custom Quote */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-ink-200 pb-3">
          <div>
            <span className="text-xs font-bold text-brand-600">
              {t("Bước 2", "Step 2")}
            </span>
            <h3 className="text-lg font-semibold text-ink-900 mt-0.5">
              {t("Tuỳ chỉnh đoạn văn truyền cảm hứng của bạn", "Customize your inspiring quote")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onResetQuote}
            className="text-xs font-bold text-ink-600 hover:text-brand-500 underline transition-colors cursor-pointer"
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
            className={`w-full rounded-2xl border p-4 text-xs sm:text-sm text-ink-900 focus:outline-none focus:ring-2 transition-all resize-y ${
              isOverLength
                ? "border-sun-400 focus:ring-sun-200"
                : "border-ink-200 focus:border-brand-500 focus:ring-brand-500/20 bg-ink-50"
            }`}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-600">
              {t("Khuyến nghị: 80 - 350 ký tự để thẻ hiển thị trọn vẹn nhất.", "Recommended: 80 - 350 chars for optimal display.")}
            </span>
            <span className={`font-mono font-bold ${isOverLength ? "text-sun-600" : "text-ink-600"}`}>
              {charCount}/{maxRecommended}
            </span>
          </div>
        </div>

        {/* Quick Insert Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-ink-600">
            {t("Chèn nhanh thông số cá nhân", "Quick Insert Tags")}:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleInsertTag(`chuỗi ${stats.streakDays} ngày`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sun-100 text-sun-700 border border-sun-200 hover:bg-sun-200 transition-colors cursor-pointer"
            >
              + {stats.streakDays} {t("ngày học", "days")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(`${stats.signsMastered} ký hiệu`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-200 transition-colors cursor-pointer"
            >
              + {stats.signsMastered} {t("ký hiệu", "signs")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(`chuẩn xác ${stats.averageScore}%`)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors cursor-pointer"
            >
              + {stats.averageScore}% {t("chuẩn AI", "AI accuracy")}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag(learnerName)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-50 text-ink-900 border border-ink-200 hover:bg-white transition-colors cursor-pointer"
            >
              + {learnerName}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag("#SignLight #VSL #HocNgonNguKyHieu")}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              + Hashtags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
