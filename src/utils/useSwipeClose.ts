import { useEffect, useRef, type RefObject } from "react";

const SWIPE_AXIS_LOCK_PX = 8;
const SWIPE_CLOSE_THRESHOLD_PX = 80;
const SWIPE_CLOSE_VELOCITY = 0.5;
const CLOSE_ANIMATION_MS = 220;
const SNAP_BACK_MS = 180;

function findScrollableAncestor(
  start: HTMLElement | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let node: HTMLElement | null = start;
  while (node && boundary.contains(node)) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    if (node === boundary) return null;
    node = node.parentElement;
  }
  return null;
}

export function useSwipeClose(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const overlay = el.parentElement;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let scrollTopAtStart = 0;
    let scrollableAtStart: HTMLElement | null = null;
    let tracking = false;
    let axis: "x" | "y" | null = null;
    let closing = false;
    let snapTimer = 0;

    const clearStyles = () => {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.transition = "";
      if (overlay) {
        overlay.style.opacity = "";
        overlay.style.transition = "";
      }
    };

    const applyTransform = (offsetX: number, offsetY: number) => {
      el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      const dist = Math.hypot(offsetX, offsetY);
      const max = offsetX !== 0 ? window.innerWidth : window.innerHeight;
      const progress = Math.min(1, dist / max);
      const remain = 1 - progress * 0.7;
      el.style.opacity = String(remain);
      if (overlay) overlay.style.opacity = String(remain);
    };

    const animateOff = (offsetX: number, offsetY: number) => {
      closing = true;
      el.style.transition = `transform ${CLOSE_ANIMATION_MS}ms ease-out, opacity ${CLOSE_ANIMATION_MS}ms ease-out`;
      if (overlay) {
        overlay.style.transition = `opacity ${CLOSE_ANIMATION_MS}ms ease-out`;
      }
      requestAnimationFrame(() => {
        el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        el.style.opacity = "0";
        if (overlay) overlay.style.opacity = "0";
      });
      window.setTimeout(() => {
        onCloseRef.current();
      }, CLOSE_ANIMATION_MS);
    };

    const snapBack = () => {
      el.style.transition = `transform ${SNAP_BACK_MS}ms ease-out, opacity ${SNAP_BACK_MS}ms ease-out`;
      if (overlay) {
        overlay.style.transition = `opacity ${SNAP_BACK_MS}ms ease-out`;
      }
      requestAnimationFrame(() => {
        el.style.transform = "translate(0, 0)";
        el.style.opacity = "1";
        if (overlay) overlay.style.opacity = "1";
      });
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        clearStyles();
        axis = null;
      }, SNAP_BACK_MS);
    };

    const handleStart = (e: TouchEvent) => {
      if (closing) return;
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = e.timeStamp;
      scrollableAtStart = findScrollableAncestor(
        e.target as HTMLElement | null,
        el,
      );
      scrollTopAtStart = scrollableAtStart ? scrollableAtStart.scrollTop : 0;
      tracking = true;
      axis = null;
      window.clearTimeout(snapTimer);
      el.style.transition = "none";
      if (overlay) overlay.style.transition = "none";
    };

    const handleMove = (e: TouchEvent) => {
      if (!tracking || closing) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (axis === null) {
        if (adx < SWIPE_AXIS_LOCK_PX && ady < SWIPE_AXIS_LOCK_PX) return;
        if (adx > ady) {
          if (dx <= 0) {
            tracking = false;
            return;
          }
          axis = "x";
        } else {
          if (dy <= 0) {
            tracking = false;
            return;
          }
          if (scrollableAtStart && scrollTopAtStart > 0) {
            tracking = false;
            return;
          }
          axis = "y";
        }
      }

      if (e.cancelable) e.preventDefault();

      if (axis === "x") {
        applyTransform(Math.max(0, dx), 0);
      } else {
        applyTransform(0, Math.max(0, dy));
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (!tracking || closing) {
        tracking = false;
        return;
      }
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) {
        snapBack();
        return;
      }
      const dx = Math.max(0, t.clientX - startX);
      const dy = Math.max(0, t.clientY - startY);
      const dt = Math.max(1, e.timeStamp - startTime);

      if (axis === "x") {
        const velocity = dx / dt;
        if (dx > SWIPE_CLOSE_THRESHOLD_PX || velocity > SWIPE_CLOSE_VELOCITY) {
          animateOff(window.innerWidth, 0);
          return;
        }
      } else if (axis === "y") {
        const velocity = dy / dt;
        if (dy > SWIPE_CLOSE_THRESHOLD_PX || velocity > SWIPE_CLOSE_VELOCITY) {
          animateOff(0, window.innerHeight);
          return;
        }
      }

      snapBack();
    };

    const handleCancel = () => {
      if (!tracking || closing) {
        tracking = false;
        return;
      }
      tracking = false;
      snapBack();
    };

    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd, { passive: true });
    el.addEventListener("touchcancel", handleCancel, { passive: true });
    return () => {
      window.clearTimeout(snapTimer);
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleCancel);
      clearStyles();
    };
  }, [enabled, ref]);
}
