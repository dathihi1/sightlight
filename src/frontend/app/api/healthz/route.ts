/** Healthcheck của container web — docker-compose gọi đường dẫn này. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "UP" });
}
