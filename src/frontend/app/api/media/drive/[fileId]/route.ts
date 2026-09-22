import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint proxy phát video MP4 trực tiếp từ Google Drive.
 *
 * Cho phép trình phát HTML5 <video> hỗ trợ các thuộc tính:
 * - loop (phát lại liên tục)
 * - autoPlay (tự động phát)
 * - playsInline
 * - Byte Range requests (tua video mượt mà)
 * Đồng thời vượt qua cơ chế chặn CORS / Cross-Origin-Resource-Policy của trình duyệt khi nhúng trực tiếp.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;

  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return new NextResponse("Invalid file ID", { status: 400 });
  }

  const rangeHeader = request.headers.get("range");
  const driveUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  const fetchHeaders: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };
  if (rangeHeader) {
    fetchHeaders["Range"] = rangeHeader;
  }

  try {
    const upstream = await fetch(driveUrl, {
      headers: fetchHeaders,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse("Failed to load video from source", {
        status: upstream.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      upstream.headers.get("content-type") || "video/mp4"
    );
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800"
    );

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new NextResponse("Internal proxy error", { status: 500 });
  }
}
