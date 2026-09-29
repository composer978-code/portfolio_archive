import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const PHASES = ["INITIALIZE", "RENDER", "EXPERIENCE"];

export default function SpatialLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 320 : 1450;
    const startedAt = performance.now();
    let frame = 0;
    let exitTimer = 0;

    const update = (now: number) => {
      const next = Math.min(100, Math.round(((now - startedAt) / duration) * 100));
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(update);
      else exitTimer = window.setTimeout(() => setVisible(false), reduceMotion ? 0 : 170);
    };

    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
    };
  }, []);

  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor(progress / 34))];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="spatial-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
          aria-hidden="true"
        >
          <div className="spatial-loader-meta"><span>FIELD / 01</span><span>SPATIAL INTERFACE</span></div>
          <div className="spatial-loader-center">
            <span className="spatial-loader-word">{phase}</span>
            <span className="spatial-loader-number">{String(progress).padStart(3, "0")}</span>
          </div>
          <div className="spatial-loader-track"><span style={{ width: `${progress}%` }} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
