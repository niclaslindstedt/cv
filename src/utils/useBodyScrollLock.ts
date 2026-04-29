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
  window.scrollTo(0, savedScrollY);
}

export function useBodyScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    lock();
    return unlock;
  }, [enabled]);
}
