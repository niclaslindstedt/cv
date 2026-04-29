import { useEffect } from "react";

/**
 * Locks page scroll while a modal is open. Locking only `document.body`
 * is not enough: Firefox keeps the document scrollable through the
 * `<html>` element, so the page scrolls behind the modal. Mirror what
 * the timeline does and lock both elements.
 */
export function useBodyScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [enabled]);
}
