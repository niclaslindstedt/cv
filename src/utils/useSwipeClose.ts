import { useEffect, type RefObject } from "react";

const SWIPE_THRESHOLD_PX = 80;
const AXIS_DOMINANCE_RATIO = 1.3;
const MAX_SWIPE_DURATION_MS = 600;

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
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let scrollTopAtStart = 0;
    let scrollableAtStart: HTMLElement | null = null;
    let tracking = false;

    const handleStart = (e: TouchEvent) => {
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
    };

    const handleEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      if (e.timeStamp - startTime > MAX_SWIPE_DURATION_MS) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (dx > SWIPE_THRESHOLD_PX && adx > ady * AXIS_DOMINANCE_RATIO) {
        onClose();
        return;
      }

      if (dy > SWIPE_THRESHOLD_PX && ady > adx * AXIS_DOMINANCE_RATIO) {
        if (!scrollableAtStart || scrollTopAtStart <= 0) {
          onClose();
        }
      }
    };

    const handleCancel = () => {
      tracking = false;
    };

    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchend", handleEnd, { passive: true });
    el.addEventListener("touchcancel", handleCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleCancel);
    };
  }, [enabled, onClose, ref]);
}
