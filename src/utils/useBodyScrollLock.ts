import { useEffect } from "react";

/**
 * Locks page scroll while a modal is open.
 *
 * `overflow: hidden` alone is not enough on iOS Safari: as soon as an
 * input inside the modal takes focus and the on-screen keyboard appears,
 * the document underneath becomes scrollable again because Safari uses
 * scroll to bring the focused field into view. The robust workaround is
 * `position: fixed` on the body with `top: -scrollY`, which freezes the
 * page even with the keyboard up. On unlock we restore the saved scroll
 * position so closing the modal lands the user where they left off.
 *
 * Several modals can be open at once (e.g. SearchModal stays open and
 * inert while a destination modal opens on top). Reference-counting
 * keeps body manipulation to the outermost lock — a second `lock()`
 * while already locked would otherwise overwrite `top` with the now-zero
 * `window.scrollY` and snap the page to the top.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedPathname = "";
let savedHtmlOverflow = "";
let savedBodyOverflow = "";
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyLeft = "";
let savedBodyRight = "";
let savedBodyWidth = "";

function lock(): void {
  lockCount += 1;
  if (lockCount > 1) return;
  const html = document.documentElement;
  const body = document.body;
  savedScrollY = window.scrollY;
  savedPathname = window.location.pathname;
  savedHtmlOverflow = html.style.overflow;
  savedBodyOverflow = body.style.overflow;
  savedBodyPosition = body.style.position;
  savedBodyTop = body.style.top;
  savedBodyLeft = body.style.left;
  savedBodyRight = body.style.right;
  savedBodyWidth = body.style.width;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

function unlock(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = savedHtmlOverflow;
  body.style.overflow = savedBodyOverflow;
  body.style.position = savedBodyPosition;
  body.style.top = savedBodyTop;
  body.style.left = savedBodyLeft;
  body.style.right = savedBodyRight;
  body.style.width = savedBodyWidth;
  // Only restore scroll if we're still on the same route. If the modal
  // close coincided with a route change (e.g. "See in timeline"), scrolling
  // to the previous page's offset on the new route briefly triggers iOS
  // Safari's URL-bar animation and lands the new page rendered under the
  // status bar / dynamic island.
  if (window.location.pathname === savedPathname) {
    window.scrollTo(0, savedScrollY);
  }
}

export function useBodyScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    lock();
    return unlock;
  }, [enabled]);
}

/**
 * Returns the page scroll position the user perceives. While a modal is
 * locking the body via `position: fixed`, `window.scrollY` reads as 0,
 * so callers (e.g. route navigation) need the saved value instead.
 */
export function getEffectiveScrollY(): number {
  if (lockCount > 0) return savedScrollY;
  return window.scrollY;
}

/**
 * Whether a modal is currently holding the body in `position: fixed`.
 * Route navigation needs this so it can skip a `window.scrollTo` while
 * the body is frozen — on iOS Safari that call still kicks the URL-bar
 * visibility transition, which can leave the next route rendered with a
 * stale `safe-area-inset-top` and the page tucked under the dynamic
 * island until the user manually reloads.
 */
export function isBodyLocked(): boolean {
  return lockCount > 0;
}
