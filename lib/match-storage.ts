export type MockMatch = {
  profileId: string;
  profileName: string;
  matchedAt: string;
  status: "new" | "dismissed" | "messaged";
};

const MATCHES_KEY = "flirtschat:matches";

export function loadMatches(): MockMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(MATCHES_KEY) ?? "[]");
    return Array.isArray(value) ? value as MockMatch[] : [];
  } catch {
    return [];
  }
}

function saveMatches(matches: MockMatch[]) {
  window.localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  window.dispatchEvent(new CustomEvent("flirtschat:matches-change", {detail: matches}));
}

export function registerMatch(profileId: string, profileName: string) {
  const matches = loadMatches();
  const existing = matches.find(match => match.profileId === profileId);
  if (existing) {
    const next = matches.map(match => match.profileId === profileId ? {...match, status: "new" as const} : match);
    saveMatches(next);
    return next.find(match => match.profileId === profileId)!;
  }
  const match: MockMatch = {profileId, profileName, matchedAt: new Date().toISOString(), status: "new"};
  saveMatches([match, ...matches]);
  return match;
}

export function updateMatchStatus(profileId: string, status: MockMatch["status"]) {
  const next = loadMatches().map(match => match.profileId === profileId ? {...match, status} : match);
  saveMatches(next);
}
