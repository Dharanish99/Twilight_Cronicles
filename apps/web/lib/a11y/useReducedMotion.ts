"use client";
import { useEffect, useState } from "react";

/**
 * Returns true if the user prefers reduced motion.
 * Checked once at mount and provided via context-compatible hook.
 * Use this everywhere instead of Framer Motion's useReducedMotion
 * so the value is consistent across the entire render tree.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
