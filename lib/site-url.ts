export function getSiteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
}

export function safeNextPath(next?: string | null) {
  if(!next?.startsWith("/")||next.startsWith("//")||next.includes("\\"))return null;
  return next;
}
