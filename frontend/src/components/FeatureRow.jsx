import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { cn } from "@/lib/utils";

/** A full-bleed image + text row, alternating sides, with a subtle scroll parallax on the image. */
export default function FeatureRow({
  image,
  imageAlt,
  imageCredit,
  eyebrow,
  title,
  children,
  reverse = false,
  action,
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div ref={ref} className="grid grid-cols-1 items-stretch lg:grid-cols-2">
      <div
        className={cn(
          "relative h-[340px] overflow-hidden sm:h-[440px] lg:h-auto lg:min-h-[520px]",
          reverse && "lg:order-2"
        )}
      >
        <motion.img
          src={image}
          alt={imageAlt}
          style={{ y }}
          className="absolute inset-0 h-[130%] w-full object-cover"
        />
        {imageCredit && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
            {imageCredit}
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex items-center px-6 py-16 sm:px-12 lg:px-16",
          reverse && "lg:order-1"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md"
        >
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-3 font-serif-display text-3xl leading-tight sm:text-4xl">{title}</h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
          {action}
        </motion.div>
      </div>
    </div>
  );
}
