import { useCallback, useEffect, useRef, useState } from "react";

/** State mirrored to localStorage (safe when storage is unavailable). */
export function useStoredState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  return [value, update];
}

/**
 * Smooth auto scroll driven by rAF (no layout thrash, cancels at page end).
 * `speed` 1–10 maps to roughly 10–110 px/s.
 */
export function useAutoScroll(speed: number) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const last = useRef<number>(0);
  const carry = useRef<number>(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const stop = useCallback(() => {
    setPlaying(false);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    carry.current = 0;
  }, []);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min(now - last.current, 100);
      last.current = now;
      // Tingkatkan kecepatan scroll: kecepatan 1 = 20px/s, kecepatan 10 = 260px/s
      const pxPerSecond = Math.pow(speedRef.current, 1.4) * 12;
      carry.current += (pxPerSecond * dt) / 1000;
      const whole = Math.floor(carry.current);

      if (whole >= 1) {
        carry.current -= whole;
        const before = window.scrollY;
        window.scrollBy(0, whole);
        const atBottom =
          window.scrollY === before &&
          window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
        if (atBottom) {
          setPlaying(false);
          return;
        }
      }
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [playing]);

  return { playing, toggle: () => setPlaying((p) => !p), stop, start: () => setPlaying(true) };
}

/** Registers keyboard shortcuts, ignoring typing inside form fields. */
export function useShortcuts(map: Record<string, () => void>) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.closest("button") && (event.key === " " || event.key === "Enter")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const fn = mapRef.current[event.key];
      if (fn) {
        event.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
