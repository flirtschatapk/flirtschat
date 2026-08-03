export type DailyDiscoverQuota = {
  date: string;
  rewind: number;
  superlike: number;
};

const QUOTA_KEY = "flirtschat:discover-daily-quota";
const PREMIUM_KEY = "flirtschat:premium";
const DAILY_FREE_LIMIT = 1;

const today = () => new Date().toLocaleDateString("en-CA");
const freshQuota = (): DailyDiscoverQuota => ({
  date: today(),
  rewind: DAILY_FREE_LIMIT,
  superlike: DAILY_FREE_LIMIT,
});

export function isPremiumUser() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PREMIUM_KEY) === "true";
}

export function setPremiumUser(active: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREMIUM_KEY, String(active));
  window.dispatchEvent(new Event("flirtschat:premium-change"));
}

export function loadDailyDiscoverQuota(): DailyDiscoverQuota {
  if (typeof window === "undefined") return freshQuota();
  try {
    const saved = JSON.parse(window.localStorage.getItem(QUOTA_KEY) ?? "null") as DailyDiscoverQuota | null;
    if (saved?.date === today()) return saved;
  } catch {
    // Invalid mock state is safely replaced with today's allowance.
  }
  const quota = freshQuota();
  window.localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
  return quota;
}

export function consumeDailyDiscoverAction(action: "rewind" | "superlike") {
  if (isPremiumUser()) return {allowed: true, premium: true, quota: loadDailyDiscoverQuota()};
  const quota = loadDailyDiscoverQuota();
  if (quota[action] <= 0) return {allowed: false, premium: false, quota};
  const next = {...quota, [action]: quota[action] - 1};
  window.localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("flirtschat:quota-change", {detail: next}));
  return {allowed: true, premium: false, quota: next};
}
