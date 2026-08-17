/**
 * ~1KB history router.
 * Mirrors Astro's file routes so the migration is a copy/paste of page bodies:
 *   /                /search        /artists      /artist/[slug]
 *   /chord/[slug]    /about         /contact      /privacy      /terms
 */

import { useCallback, useSyncExternalStore } from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

export type RouteName =
  | "home"
  | "search"
  | "artists"
  | "artist"
  | "chord"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "notfound";

export interface RouteMatch {
  name: RouteName;
  params: Record<string, string>;
  pathname: string;
  search: string;
}

const ROUTES: { pattern: RegExp; name: RouteName; keys: string[] }[] = [
  { pattern: /^\/$/, name: "home", keys: [] },
  { pattern: /^\/search$/, name: "search", keys: [] },
  { pattern: /^\/artists$/, name: "artists", keys: [] },
  { pattern: /^\/artist\/([^/]+)$/, name: "artist", keys: ["slug"] },
  { pattern: /^\/chord\/([^/]+)$/, name: "chord", keys: ["slug"] },
  { pattern: /^\/about$/, name: "about", keys: [] },
  { pattern: /^\/contact$/, name: "contact", keys: [] },
  { pattern: /^\/privacy$/, name: "privacy", keys: [] },
  { pattern: /^\/terms$/, name: "terms", keys: [] },
];

/** True when the app is served from a static file host without SPA rewrites. */
let hashMode = typeof window !== "undefined" && window.location.hash.startsWith("#/");

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function currentLocation(): { pathname: string; search: string } {
  if (typeof window === "undefined") return { pathname: "/", search: "" };
  if (hashMode) {
    const raw = window.location.hash.slice(1) || "/";
    const [pathname, search = ""] = raw.split("?");
    return { pathname: pathname || "/", search: search ? "?" + search : "" };
  }
  return { pathname: window.location.pathname || "/", search: window.location.search };
}

export function matchRoute(pathname: string, search: string): RouteMatch {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const route of ROUTES) {
    const found = route.pattern.exec(clean);
    if (found) {
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(found[i + 1])));
      return { name: route.name, params, pathname: clean, search };
    }
  }
  return { name: "notfound", params: {}, pathname: clean, search };
}

let snapshot = (() => {
  const loc = currentLocation();
  return matchRoute(loc.pathname, loc.search);
})();

function refresh() {
  const loc = currentLocation();
  const next = matchRoute(loc.pathname, loc.search);
  if (next.name !== snapshot.name || next.pathname !== snapshot.pathname || next.search !== snapshot.search) {
    snapshot = next;
    emit();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", refresh);
  window.addEventListener("hashchange", refresh);
}

export function navigate(to: string, options: { replace?: boolean; scroll?: boolean } = {}): void {
  const { replace = false, scroll = true } = options;
  const [pathname, search = ""] = to.split("?");
  const url = pathname + (search ? "?" + search : "");

  if (!hashMode) {
    try {
      window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    } catch {
      hashMode = true;
    }
  }
  if (hashMode) {
    const hash = "#" + url;
    if (replace) window.history.replaceState({}, "", hash);
    else window.location.hash = hash;
  }

  snapshot = matchRoute(pathname, search ? "?" + search : "");
  emit();
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
}

export function useRoute(): RouteMatch {
  const subscribe = useCallback((fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}

export function useQueryParam(key: string): string {
  const route = useRoute();
  return new URLSearchParams(route.search).get(key) ?? "";
}

/** Real anchors (crawlable, middle-click friendly) with SPA interception. */
export function Link({
  href,
  children,
  onClick,
  ...rest
}: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:")
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return (
    <a href={hashMode ? "#" + href : href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
