const supportedVoiceMimes = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
]);

export function canonicalVoiceMime(value: string | undefined) {
  const normalized = value?.trim().toLowerCase().replace(/\s*;\s*/g, ";").replace(/\s*=\s*/g, "=");
  return normalized && supportedVoiceMimes.has(normalized) ? normalized : null;
}

export function voiceMimeExtension(value: string) {
  return value.startsWith("audio/ogg") ? "ogg" : "webm";
}
