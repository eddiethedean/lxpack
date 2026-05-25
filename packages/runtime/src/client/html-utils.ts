export function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/${path}`;
}

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

import DOMPurify from "dompurify";

const MARKDOWN_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "span",
  "div",
] as const;

const MARKDOWN_ALLOWED_ATTR = [
  "href",
  "title",
  "alt",
  "src",
  "class",
  "id",
  "colspan",
  "rowspan",
] as const;

const BLOCKED_URI_PREFIXES = ["javascript:", "vbscript:", "data:text/html"];

function isBlockedUri(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, "").toLowerCase();
  return BLOCKED_URI_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function sanitizeHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...MARKDOWN_ALLOWED_TAGS],
    ALLOWED_ATTR: [...MARKDOWN_ALLOWED_ATTR],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
  return clean
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (match, attr, _q, d1, d2, d3) => {
        const value = (d1 ?? d2 ?? d3 ?? "").trim();
        if (value && isBlockedUri(value)) {
          return ` ${attr}=""`;
        }
        return match;
      },
    );
}
