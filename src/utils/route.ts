import { useEffect, useState } from "react";

export type Route = "home" | "timeline";

const ROUTE_CHANGE_EVENT = "cv:routechange";

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
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  window.scrollTo({ top: 0, left: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => getCurrentRoute());
  useEffect(() => {
    const update = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", update);
    window.addEventListener(ROUTE_CHANGE_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(ROUTE_CHANGE_EVENT, update);
    };
  }, []);
  return route;
}
