import { useEffect, type RefObject } from "react";

/**
 * Pin a fixed-position element to the visual viewport while enabled, so
 * the on-screen keyboard cannot pan the user away from it.
 *
 * iOS Safari does not honor `interactive-widget=resizes-content`. When
 * the keyboard appears, the layout viewport stays at full device height
 * and only the visual viewport shrinks, leaving the user free to pan
 * the camera within the layout. A `position: fixed` overlay covers the
 * (taller) layout viewport, so the modal slides off-screen as the user
 * pans even when the body itself is locked.
 *
 * Tracking `window.visualViewport.offsetTop` / `offsetLeft` / `width` /
 * `height` and writing them as inline styles keeps the overlay glued to
 * whatever the user can actually see.
 */
export function useVisualViewportPin(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const el = ref.current;
    if (!el) return;

    const update = () => {
      el.style.top = `${vv.offsetTop}px`;
      el.style.left = `${vv.offsetLeft}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.width = `${vv.width}px`;
      el.style.height = `${vv.height}px`;
    };
    update();
    vv.addEventListener("scroll", update);
    vv.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("scroll", update);
      vv.removeEventListener("resize", update);
      el.style.top = "";
      el.style.left = "";
      el.style.right = "";
      el.style.bottom = "";
      el.style.width = "";
      el.style.height = "";
    };
  }, [enabled, ref]);
}
