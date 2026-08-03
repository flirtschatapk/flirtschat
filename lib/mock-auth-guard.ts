export const AUTH_KEY = "flirtschat:mock-auth";

export type MockSessionMode = "persistent" | "session";

export function isMockAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_KEY) === "authenticated"
      || sessionStorage.getItem(AUTH_KEY) === "authenticated";
  } catch {
    return false;
  }
}

export function establishMockSession(remember = true) {
  if (typeof window === "undefined") return;
  clearMockSession();
  (remember ? localStorage : sessionStorage).setItem(AUTH_KEY, "authenticated");
}

export function getMockSessionMode(): MockSessionMode | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(AUTH_KEY) === "authenticated") return "persistent";
    if (sessionStorage.getItem(AUTH_KEY) === "authenticated") return "session";
  } catch {}
  return null;
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(AUTH_KEY); } catch {}
  try { sessionStorage.removeItem(AUTH_KEY); } catch {}
}
