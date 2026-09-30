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

const RATES = [0.5, 0.75, 1];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Trình phát video ký hiệu:
 * - Phát MP4 trực tiếp qua /api/media/drive/[fileId] (loop, tua byte-range, đổi tốc độ).
 * - Thanh điều khiển tự vẽ (không dùng `controls` của trình duyệt — bị cắt trong khung bo góc và mỗi trình duyệt một kiểu).
 * - Khung tự khớp tỉ lệ thật của video, cao tối đa 70vh.
 * - Dự phòng sang iframe Google Drive nếu thẻ <video> không nạp được nguồn.
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isLooping, setIsLooping] = useState(loop);
  const [rate, setRate] = useState(1);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState(16 / 9);

  const resolvedDriveId = useMemo(() => {
    if (driveFileId && driveFileId.trim().length > 0) {
      return driveFileId.trim();
    }
    return extractGoogleDriveId(videoUrl);
  }, [driveFileId, videoUrl]);

  useEffect(() => {
    setUseIframeFallback(false);
    setTime(0);
    setDuration(0);
  }, [videoUrl, driveFileId]);

  // Nguồn phát trực tiếp cho thẻ HTML5 <video>
  const directSrc = useMemo(() => {
    if (videoUrl && !videoUrl.includes("drive.google.com") && !videoUrl.includes("drive.usercontent.google.com")) {
      return videoUrl;
    }
    if (resolvedDriveId) {
      return `/api/media/drive/${resolvedDriveId}`;
    }
    return videoUrl || null;
  }, [resolvedDriveId, videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      videoRef.current.loop = isLooping;
    }
  }, [rate, isLooping]);

  if (placeholderVideo || (!videoUrl && !resolvedDriveId)) {
    return <PlaceholderVideo label={title || "Video ký hiệu mẫu"} />;
  }

  if (useIframeFallback && resolvedDriveId) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-3xl bg-black ${className}`}>
        <iframe
          src={`https://drive.google.com/file/d/${resolvedDriveId}/preview`}
          className="h-full w-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={title || "Video ký hiệu mẫu VSL"}
        />
      </div>
    );
  }

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <div
      ref={wrapRef}
      className={`group relative mx-auto w-full overflow-hidden rounded-3xl bg-ink-950 ${className}`}
      style={{ aspectRatio: ratio, maxHeight: "70vh" }}
    >
      <video
        ref={videoRef}
        key={directSrc}
        src={directSrc || undefined}
        autoPlay={autoPlay}
        loop={isLooping}
        muted={muted}
        playsInline
        aria-label={title || "Video ký hiệu mẫu"}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          v.playbackRate = rate;
          setDuration(v.duration || 0);
          // Giữ khung trong khoảng 3:4 (dọc) → 16:9 (ngang) để video không quá cao hay quá dẹt.
          if (v.videoWidth && v.videoHeight) setRatio(Math.min(16 / 9, Math.max(3 / 4, v.videoWidth / v.videoHeight)));
        }}
        onError={() => resolvedDriveId && setUseIframeFallback(true)}
        className="h-full w-full cursor-pointer object-contain"
      />

      {/* Tốc độ + lặp: luôn hiện (không ẩn sau hover) vì đây là công cụ học chính */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 p-1 text-sm text-white backdrop-blur">
        {RATES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRate(r)}
            aria-pressed={rate === r}
            aria-label={`Tốc độ ${r}x`}
            className={`min-h-0 rounded-full px-2.5 py-1 font-semibold transition-colors ${rate === r ? "bg-white text-ink-900" : "text-white/85 hover:bg-white/15"}`}
          >
            {r}x
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsLooping((p) => !p)}
          aria-pressed={isLooping}
          title={isLooping ? "Đang lặp lại" : "Không lặp lại"}
          aria-label="Lặp lại video"
          className={`grid min-h-0 h-8 w-8 place-items-center rounded-full transition-colors ${isLooping ? "bg-brand-500 text-white" : "text-white/85 hover:bg-white/15"}`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>

      {/* Thanh điều khiển dưới */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-white">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Tạm dừng" : "Phát"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform active:scale-95"
        >
          {playing ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
        </button>
        <span className="w-10 shrink-0 text-sm tabular-nums">{fmt(time)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={time}
          onChange={(e) => {
            const v = videoRef.current;
            if (v) v.currentTime = Number(e.target.value);
          }}
          aria-label="Tua video"
          className="h-1.5 flex-1 cursor-pointer accent-brand-400"
        />
        <span className="w-10 shrink-0 text-sm tabular-nums text-white/80">{fmt(duration)}</span>
        <button
          type="button"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrapRef.current?.requestFullscreen())}
          aria-label="Toàn màn hình"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/15"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
