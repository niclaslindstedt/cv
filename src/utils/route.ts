import { useEffect, useState } from "react";

import { getEffectiveScrollY } from "./useBodyScrollLock";

export type Route = "home" | "timeline";

const ROUTE_CHANGE_EVENT = "cv:routechange";

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function pathnameToRoute(pathname: string): Route {
  const stripped = pathname.replace(/\/+$/, "");
  if (stripped.endsWith("/timeline")) return "timeline";
  return "home";
}

export function getCurrentRoute(): Route {
  if (typeof window === "undefined") return "home";
  return pathnameToRoute(window.location.pathname);
}

export function navigate(path: string): void {
  const target = new URL(path, window.location.origin);
  const same =
    window.location.pathname === target.pathname &&
    window.location.search === target.search &&
    window.location.hash === target.hash;
  if (same) return;
  window.history.replaceState(
    { ...(window.history.state ?? {}), scrollY: getEffectiveScrollY() },
    "",
  );
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  window.scrollTo({ top: 0, left: 0 });
}

function restoreScrollFromHistory(): void {
  const scrollY = (window.history.state as { scrollY?: unknown } | null)
    ?.scrollY;
  if (typeof scrollY !== "number") return;
  // Wait for the new route's content to mount before scrolling.
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0 });
  });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => getCurrentRoute());
  useEffect(() => {
    const onPop = () => {
      setRoute(getCurrentRoute());
      restoreScrollFromHistory();
    };
    const onRouteChange = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", onPop);
    window.addEventListener(ROUTE_CHANGE_EVENT, onRouteChange);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener(ROUTE_CHANGE_EVENT, onRouteChange);
    };
  }, []);
  return route;
}
