// src/utils/linkify.ts (backend)
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN);
  return matches ? [...new Set(matches)] : [];
}
