"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ShareChannelActionsProps {
  shareUrl: string;
  shareText: string;
  onCopyAll: () => void;
  isCopied: boolean;
}

export function ShareChannelActions({
  shareUrl,
  shareText,
  onCopyAll,
  isCopied,
}: ShareChannelActionsProps) {
  const { t } = useLanguage();
  const [copiedLinkOnly, setCopiedLinkOnly] = useState(false);

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLinkOnly(true);
      setTimeout(() => setCopiedLinkOnly(false), 2500);
    });
  };

  const handleSocialShare = (platform: "facebook" | "x" | "linkedin" | "telegram") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    let targetUrl = "";
    if (platform === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    } else if (platform === "x") {
      targetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    } else if (platform === "linkedin") {
      targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (platform === "telegram") {
      targetUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "width=600,height=550,menubar=no,toolbar=no");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "SignLight - Hành trình học Ngôn ngữ Ký hiệu",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error, fallback to copy
        onCopyAll();
      }
    } else {
      onCopyAll();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-5">
      <div className="border-b border-[#E2DBD0] pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#08757a]">
          {t("Bước 3", "Step 3")}
        </span>
        <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">
          {t("Đăng tải & Lan toả tới mạng xã hội", "Publish & Spread to your network")}
        </h3>
      </div>

      {/* Direct Verified Link Box */}
      <div className="rounded-2xl bg-[#F4EFE6]/70 p-4 border border-[#E2DBD0] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            {t("Liên kết trực tiếp tới trang", "Direct Accessible Link")}
          </span>
          <span className="text-[11px] font-bold text-[#08757a] bg-[#e6f7f8] px-2 py-0.5 rounded-full border border-[#b2e7e9]">
            ✓ {t("Khả dụng", "Active URL")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 rounded-xl bg-white border border-[#CBD5E1] px-3.5 py-2 text-xs font-mono text-[#0F172A] focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyLinkOnly}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4EFE6] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer shrink-0"
          >
            {copiedLinkOnly ? (
              <>
                <svg className="w-3.5 h-3.5 text-[#08757a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t("Đã sao chép", "Copied")}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>{t("Sao chép link", "Copy link")}</span>
              </>
            )}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("Mở liên kết trên tab mới để kiểm tra", "Open link in a new tab to test")}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#08757a] hover:bg-[#065b5f] text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <span>{t("Mở liên kết", "Open link")}</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Primary Full Copy Button */}
      <button
        type="button"
        onClick={onCopyAll}
        className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-4 font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        <span>
          {isCopied
            ? t("Đã sao chép vào bộ nhớ tạm!", "Copied to Clipboard!")
            : t("Sao chép nội dung & Liên kết", "Copy Message & Link")}
        </span>
      </button>

      {/* Social Channels 1-Click Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleSocialShare("facebook")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#1877F2] transition-all cursor-pointer group"
        >
          <svg className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-xs font-bold text-[#0F172A]">Facebook</span>
        </button>

        {/* X (Twitter) */}
        <button
          type="button"
          onClick={() => handleSocialShare("x")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#0F172A] transition-all cursor-pointer group"
        >
          <svg className="w-5 h-5 text-[#0F172A] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-xs font-bold text-[#0F172A]">X (Twitter)</span>
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={() => handleSocialShare("linkedin")}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#0A66C2] transition-all cursor-pointer group"
        >
          <svg className="w-5 h-5 text-[#0A66C2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          <span className="text-xs font-bold text-[#0F172A]">LinkedIn</span>
        </button>

        {/* Telegram / Mobile Share */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/60 hover:bg-white hover:border-[#0088cc] transition-all cursor-pointer group"
        >
          <svg className="w-5 h-5 text-[#0088cc] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-xs font-bold text-[#0F172A]">{t("Chia sẻ khác", "More Channels")}</span>
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
            "Every share helps expand educational and employment opportunities for the Deaf community in Vietnam."
          )}
        </p>
      </div>
    </div>
  );
}
