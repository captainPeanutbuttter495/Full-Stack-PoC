"use client";
import { motion } from "motion/react";

export const ease = [0.22, 0.61, 0.36, 1] as const;

export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
      viewport={{ once: true, amount: 0.14 }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span
      className={`flex items-center gap-[11px] font-mono text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground ${center ? "justify-center" : ""}`}
    >
      {children}
    </span>
  );
}

export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-[10px] font-mono text-[11.5px] uppercase tracking-[0.16em] text-primary ">
    {children}
    </span>
  );
}
