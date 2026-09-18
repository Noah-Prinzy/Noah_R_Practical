"use client";

import { useRef } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { duration, ease } from "@/lib/motion";

export type ViewerFigure = {
  number: number;
  title: string;
  type: string;
  interpretation: string;
  src: string;
  width: number;
  height: number;
};

/**
 * Full-screen view of an R figure (the PNG is shown unaltered).
 * Radix Dialog supplies focus trapping, focus return, Escape, scroll locking and
 * ARIA labelling; Motion animates the enter/exit. `data-lenis-prevent` stops Lenis
 * from scrolling the page behind the dialog.
 */
export function FigureDialog({
  figure,
  open,
  onOpenChange,
}: {
  figure: ViewerFigure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Radix returns focus to a <Dialog.Trigger>; these dialogs are opened from
  // ordinary buttons, so remember the opener and restore focus to it on close.
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && figure && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                data-lenis-prevent
                className="fixed inset-0 z-[80] bg-zinc-950/85 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: duration.fast, ease: ease.out } }}
                exit={{ opacity: 0, transition: { duration: duration.fast * 0.7, ease: ease.in } }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onOpenAutoFocus={() => {
                returnFocus.current = document.activeElement as HTMLElement | null;
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                returnFocus.current?.focus();
              }}
            >
              <motion.div
                data-lenis-prevent
                className="fixed inset-0 z-[81] m-auto flex h-fit max-h-[94svh] w-[min(1180px,96vw)] flex-col overflow-y-auto overscroll-contain rounded-2xl bg-white p-3 shadow-2xl focus:outline-none md:p-5"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: duration.base, ease: ease.out } }}
                exit={{ opacity: 0, scale: 0.98, y: 6, transition: { duration: duration.base * 0.7, ease: ease.in } }}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.16em] text-zinc-500">
                      FIGURE {figure.number} · {figure.type.toUpperCase()}
                    </p>
                    <Dialog.Title className="mt-0.5 text-base font-semibold text-zinc-950 md:text-lg">{figure.title}</Dialog.Title>
                  </div>
                  <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-zinc-100" aria-label="Close figure">
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
                <Image
                  src={figure.src}
                  alt={`Figure ${figure.number}: ${figure.title}`}
                  width={figure.width}
                  height={figure.height}
                  sizes="96vw"
                  className="h-auto w-full"
                />
                <Dialog.Description className="mt-4 max-w-4xl text-sm leading-6 text-zinc-600">{figure.interpretation}</Dialog.Description>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
