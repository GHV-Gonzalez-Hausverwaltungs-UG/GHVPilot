// app/SplashProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function SplashProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const total = 1200; // ms
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const p = Math.min(100, Math.round(((t - start) / total) * 100));
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => setShow(false), 100); // weiches Ausblenden starten
    });

    // Failsafe: niemals länger als 3s sichtbar
    const failsafe = setTimeout(() => setShow(false), 3000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-live="polite"
            aria-busy="true"
            role="status"
          >
            <div className="relative flex flex-col items-center">
              <div className="relative h-40 w-40">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500/25"
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-dashed border-orange-500/35"
                  animate={reduce ? undefined : { rotate: -360 }}
                  transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full border-2 border-dashed border-orange-500/50"
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl px-4 py-2 bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
                    <span className="tracking-widest font-semibold">GHV</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 font-mono text-sm text-white/80">
                Booting GHV Pilot
                {!reduce && (
                  <span className="inline-flex w-8 justify-start">
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0,
                      }}
                    >
                      .
                    </motion.span>
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.2,
                      }}
                    >
                      .
                    </motion.span>
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.4,
                      }}
                    >
                      .
                    </motion.span>
                  </span>
                )}
              </div>

              <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
