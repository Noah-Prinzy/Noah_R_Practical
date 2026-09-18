"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * reducedMotion="user": when the OS asks for reduced motion, Motion drops
 * transform/layout animation and keeps only opacity. Individual primitives
 * additionally skip entrances, parallax, counters and sticky storytelling.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
