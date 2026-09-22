"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlaceholderVideo } from "./PlaceholderVideo";

export interface SignVideoPlayerProps {
  videoUrl?: string | null;
  driveFileId?: string | null;
  placeholderVideo?: boolean;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/**
 * Trích xuất Google Drive File ID từ nhiều định dạng URL khác nhau.
 */
export function extractGoogleDriveId(url?: string | null): string | null {
  if (!url) return null;

  // 1. Dạng /file/d/{fileId}/...
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) {
    return fileDMatch[1];
  }

  // 2. Dạng tham số id={fileId} (drive.usercontent.google.com hoặc drive.google.com)
  if (url.includes("drive.google.com") || url.includes("drive.usercontent.google.com")) {
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch?.[1]) {
      return idParamMatch[1];
    }
  }

  return null;
}

/**
 * Trình phát video ký hiệu thông minh:
 * - Hỗ trợ phát lại liên tục (loop) tự động giúp người học rèn luyện ký hiệu nhiều lần.
 * - Phát luồng MP4 trực tiếp qua endpoint /api/media/drive/[fileId] để thẻ <video>
 *   chạy mượt mà, hỗ trợ loop vô tận, tua byte-range và đổi tốc độ học (0.5x, 0.75x, 1x).
 * - Tự động dự phòng sang thẻ iframe nếu trình duyệt không hỗ trợ định dạng trực tiếp.
 */
export function SignVideoPlayer({
  videoUrl,
  driveFileId,
  placeholderVideo = false,
  title,
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
}: SignVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLooping, setIsLooping] = useState(loop);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  const resolvedDriveId = useMemo(() => {
    if (driveFileId && driveFileId.trim().length > 0) {
      return driveFileId.trim();
    }
    return extractGoogleDriveId(videoUrl);
  }, [driveFileId, videoUrl]);

  // Reset fallback khi đổi video
  useEffect(() => {
    setUseIframeFallback(false);
  }, [videoUrl, driveFileId]);

  // Nguồn phát trực tiếp cho thẻ HTML5 <video>
  const directSrc = useMemo(() => {
    // 1. Ưu tiên tuyệt đối đường dẫn tĩnh cục bộ hoặc backend streaming (tránh iframe Google Drive)
    if (
      videoUrl &&
      !videoUrl.includes("drive.google.com") &&
      !videoUrl.includes("drive.usercontent.google.com")
    ) {
      return videoUrl;
    }
    // 2. Nếu videoUrl là liên kết Google Drive nhưng có driveId, dùng endpoint proxy
    if (resolvedDriveId) {
      return `/api/media/drive/${resolvedDriveId}`;
    }
    return videoUrl || null;
  }, [resolvedDriveId, videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.loop = isLooping;
    }
  }, [playbackRate, isLooping]);

  if (placeholderVideo || (!videoUrl && !resolvedDriveId)) {
    return <PlaceholderVideo label={title || "Video ký hiệu mẫu"} />;
  }

  // Dự phòng nhúng qua iframe nếu thẻ <video> gặp lỗi nạp nguồn
  if (useIframeFallback && resolvedDriveId) {
    const previewSrc = `https://drive.google.com/file/d/${resolvedDriveId}/preview`;
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner ${className}`}>
        <iframe
          src={previewSrc}
          className="h-full w-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={title || "Video ký hiệu mẫu VSL"}
        />
      </div>
    );
  }

  return (
    <div className={`group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner border border-[#E2DBD0]/60 ${className}`}>
      <video
        ref={videoRef}
        key={directSrc}
        src={directSrc || undefined}
        controls
        autoPlay={autoPlay}
        loop={isLooping}
        muted={muted}
        playsInline
        onError={() => {
          if (resolvedDriveId) {
            setUseIframeFallback(true);
          }
        }}
        className="h-full w-full object-contain bg-black"
      />

      {/* Thanh công cụ hỗ trợ người học: Bật/Tắt lặp lại liên tục và chỉnh tốc độ */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs text-white shadow-md">
        {/* Nút bật tắt lặp lại */}
        <button
          type="button"
          onClick={() => setIsLooping((prev) => !prev)}
          title={isLooping ? "Đang bật phát lại liên tục" : "Đã tắt phát lại liên tục"}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
            isLooping ? "bg-[#0d9fa5] text-white font-bold" : "bg-white/20 text-[#CBD5E1] hover:bg-white/30"
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
          <span>{isLooping ? "Lặp: Bật" : "Lặp: Tắt"}</span>
        </button>

        {/* Nút chỉnh tốc độ: 0.5x, 0.75x, 1x */}
        <button
          type="button"
          onClick={() => {
            const rates = [1, 0.75, 0.5];
            const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
            setPlaybackRate(rates[nextIdx]);
          }}
          title="Thay đổi tốc độ phát (chậm để dễ quan sát)"
          className="px-2 py-0.5 rounded-full bg-white/20 text-[#CBD5E1] hover:bg-white/30 transition-colors font-medium cursor-pointer"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
}
