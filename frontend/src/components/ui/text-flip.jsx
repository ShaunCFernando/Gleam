import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Cycles through `words`, animating the pill's width and the word's blur/slide-in. */
export function TextFlip({ words, interval = 2200, className }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-secondary px-3 py-0.5 text-primary",
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block font-semibold"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
