"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Gentle fade-up on first view, using the template's spring. Disabled for reduced-motion users. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  // min-w-0: as a grid/flex item, never let wide content (tables) stretch the track
  const classes = `min-w-0 ${className}`;
  if (reduce) return <div className={classes}>{children}</div>;
  return (
    <motion.div
      className={classes}
      initial={{ y: 28, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 60, mass: 1 }}
    >
      {children}
    </motion.div>
  );
}
