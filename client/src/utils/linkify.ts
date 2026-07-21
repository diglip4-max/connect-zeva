// src/utils/linkify.ts
const URL_PATTERN = /(https?:\/\/[^\s]+)/;
const MENTION_PATTERN = /(@\w+(?:\s\w+)?)/;

export function extractUrls(text: string): string[] {
  const matches = text.match(new RegExp(URL_PATTERN, "g"));
  return matches ? [...new Set(matches)] : [];
}

export type TextPart =
  | { type: "text"; value: string }
  | { type: "link"; value: string }
  | { type: "mention"; value: string };

/**
 * Text ko parts me todता hai - plain text, links, aur mentions teenon handle karta hai ek saath
 */
export function parseMessageText(text: string): TextPart[] {
  // dono patterns ko ek combined regex me todte hain, capturing groups ke saath
  const combinedPattern = new RegExp(
    `${URL_PATTERN.source}|${MENTION_PATTERN.source}`,
    "g",
  );
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const matchedText = match[0];
    if (matchedText.startsWith("@")) {
      parts.push({ type: "mention", value: matchedText });
    } else {
      parts.push({ type: "link", value: matchedText });
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}
