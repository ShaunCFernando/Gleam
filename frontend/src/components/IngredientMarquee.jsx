import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const INGREDIENTS = [
  "Ginseng",
  "Centella Asiatica",
  "Rice Water",
  "Mugwort",
  "Snail Mucin",
  "Licorice Root",
  "Galactomyces",
  "Panthenol",
  "Ceramides",
  "Fermented Soybean",
];

function Track({ items }) {
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((ingredient, i) => (
        <div key={i} className="flex shrink-0 items-center gap-10">
          <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
            {ingredient}
          </span>
          <span className="text-border" aria-hidden="true">
            &bull;
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IngredientMarquee() {
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();

  // Driven imperatively (rather than a declarative `animate` keyframe array) because
  // nesting under the route-level AnimatePresence's `initial={false}` otherwise makes
  // this infinite loop resolve straight to its final frame on mount and never advance.
  useEffect(() => {
    if (reduceMotion) return;
    controls.set({ x: "0%" });
    controls.start({ x: "-50%", transition: { duration: 26, ease: "linear", repeat: Infinity } });
  }, [reduceMotion, controls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden border-y border-border/70 bg-secondary/40 py-5"
    >
      <div className="flex w-max">
        <motion.div className="flex" animate={controls}>
          <Track items={INGREDIENTS} />
          <Track items={INGREDIENTS} />
        </motion.div>
      </div>
    </motion.div>
  );
}
