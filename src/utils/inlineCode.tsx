import { Fragment, type ReactNode } from "react";

// Splits a string on backtick-delimited spans, returning the segments as text
// nodes and the spans as <code>. Pairs are matched left-to-right; an unmatched
// trailing backtick is rendered verbatim. Two adjacent backticks (``) escape to
// a single literal backtick — the only escape we need.
export function renderInlineCode(text: string): ReactNode {
  if (!text || text.indexOf("`") === -1) return text;

  const parts: ReactNode[] = [];
  let buffer = "";
  let i = 0;
  let key = 0;

  const flushText = () => {
    if (buffer) {
      parts.push(buffer);
      buffer = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];
    if (ch === "`") {
      if (text[i + 1] === "`") {
        buffer += "`";
        i += 2;
        continue;
      }
      const close = text.indexOf("`", i + 1);
      if (close === -1) {
        buffer += text.slice(i);
        i = text.length;
        continue;
      }
      flushText();
      parts.push(<code key={`c${key++}`}>{text.slice(i + 1, close)}</code>);
      i = close + 1;
      continue;
    }
    buffer += ch;
    i++;
  }
  flushText();

  return parts.length === 1 ? parts[0] : <Fragment>{parts}</Fragment>;
}

// Strip backtick code-span markup so the raw string can be used in places that
// don't render React (search index payloads, alt text, etc.). Mirrors the
// matching rules above so both renderers stay consistent.
export function stripInlineCode(text: string): string {
  if (!text || text.indexOf("`") === -1) return text;
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "`") {
      if (text[i + 1] === "`") {
        out += "`";
        i += 2;
        continue;
      }
      const close = text.indexOf("`", i + 1);
      if (close === -1) {
        out += text.slice(i);
        i = text.length;
        continue;
      }
      out += text.slice(i + 1, close);
      i = close + 1;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}
