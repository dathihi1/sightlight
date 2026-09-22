/**
 * Bien moi truong frontend.
 * Cac bien NEXT_PUBLIC_ duoc Next.js nhung vao bundle tai build time.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
