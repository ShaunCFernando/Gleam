import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Droplets, Flower2, Layers, Pipette, Sparkles, Sun, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEP_ICONS = {
  cleanser: Droplets,
  toner: Waves,
  essence: Sparkles,
  serum: Pipette,
  moisturizer: Flower2,
  spf: Sun,
  mask: Layers,
};

// A decorative winding path behind the steps: alternating left/right waypoints
// connected with smooth S-curves. Built in the container's *actual* pixel
// dimensions (not an abstract 0-100 box stretched via preserveAspectRatio
//="none") — combining that stretch with pathLength scroll-animation makes
// the stroke-dasharray Framer computes render as disconnected segments
// instead of one continuous growing trail, since the non-uniform x/y scale
// throws off how the browser measures the path. Matching the viewBox to the
// real width/height keeps the scale uniform, so the trail draws correctly.
function buildWindingPath(count, width, height, amplitude) {
  if (!width || !height) return "";
  const amp = amplitude ?? width * 0.28;
  const midX = width / 2;
  const rowHeight = height / count;
  const points = Array.from({ length: count }, (_, i) => ({
    x: midX + (i % 2 === 0 ? -amp : amp),
    y: rowHeight * (i + 0.5),
  }));
  let d = `M ${midX} 0 C ${midX} ${points[0].y * 0.4}, ${points[0].x} ${points[0].y * 0.4}, ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${height}`;
  return d;
}

function ProductThumb({ product, className }) {
  if (product.image_url) {
    return <img src={product.image_url} alt="" className={className} />;
  }
  return (
    <div className={`flex items-center justify-center bg-muted font-serif-display text-primary/40 ${className}`}>
      {product.brand.slice(0, 1)}
    </div>
  );
}

function StepNode({ step, isActive, isDone }) {
  const Icon = STEP_ICONS[step.category];
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.12 : 1,
        backgroundColor: isDone ? "hsl(var(--primary))" : "hsl(var(--card))",
        borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
      }}
      transition={{ duration: 0.25 }}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
    >
      <Icon className={cn("h-5 w-5", isDone ? "text-primary-foreground" : "text-primary")} strokeWidth={1.75} />
    </motion.div>
  );
}

function StepRow({ step, index, pick, isActive, side, onChoose, onRemove, rowRef }) {
  const alignRight = side === "right";
  return (
    <div
      ref={rowRef}
      className={cn(
        "flex min-h-[220px] items-center py-6",
        alignRight ? "justify-end pl-6 pr-4 sm:pr-10" : "justify-start pl-4 pr-6 sm:pl-10"
      )}
    >
      <div className={cn("flex w-full max-w-md items-start gap-4", alignRight && "flex-row-reverse text-right")}>
        <StepNode step={step} isActive={isActive} isDone={Boolean(pick)} />

        {pick ? (
          <Card className="min-w-0 flex-1">
            <CardContent className="p-4">
              <div className={cn("flex items-start gap-3", alignRight && "flex-row-reverse")}>
                <ProductThumb product={pick} className="h-14 w-14 shrink-0 rounded-xl object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">{step.label}</div>
                  <div className="truncate font-serif-display text-base leading-snug">
                    {pick.brand} {pick.name}
                  </div>
                  <div className={cn("mt-1 flex items-center gap-2", alignRight && "justify-end")}>
                    {pick.price != null && <span className="text-sm font-semibold text-primary">${pick.price}</span>}
                    {pick.actives && <Badge variant="outline">actives</Badge>}
                  </div>
                </div>
              </div>

              {pick.blurb && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4 }}
                  className="mt-3 text-sm leading-relaxed text-muted-foreground"
                >
                  {pick.blurb}
                </motion.p>
              )}

              <div className={cn("mt-3 flex gap-2", alignRight && "justify-end")}>
                <Button size="sm" variant="ghost" onClick={() => onChoose(step.category)}>
                  Change
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onRemove(step.category)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.button
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => onChoose(step.category)}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
              alignRight ? "items-end text-right" : "items-start text-left"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">{step.label}</span>
            <span className="text-sm">+ Choose a {step.label.toLowerCase()}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default function RoutinePath({ steps, picks, onChoose, onRemove }) {
  const containerRef = useRef(null);
  const rowRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start center", "end center"] });
  const rawIndex = useTransform(scrollYProgress, [0, 1], [0, steps.length - 1]);
  useMotionValueEvent(rawIndex, "change", (v) => {
    const next = Math.min(steps.length - 1, Math.max(0, Math.round(v)));
    setActiveIndex((prev) => (prev === next ? prev : next));
  });

  const pathD = buildWindingPath(steps.length, size.width, size.height);
  const doneCount = steps.filter((s) => picks[s.category]).length;

  return (
    <div ref={containerRef} className="relative">
      {pathD && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <path d={pathD} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <motion.path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" style={{ pathLength: scrollYProgress }} />
        </svg>
      )}

      <div className="relative flex flex-col">
        {steps.map((step, i) => (
          <StepRow
            key={step.category}
            rowRef={(el) => (rowRefs.current[i] = el)}
            step={step}
            index={i}
            pick={picks[step.category]}
            isActive={activeIndex === i}
            side={i % 2 === 0 ? "left" : "right"}
            onChoose={onChoose}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Progress key: fixed so it stays put while the winding path scrolls by. */}
      <div className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex xl:right-10">
        {steps.map((step, i) => {
          const done = Boolean(picks[step.category]);
          const isActive = activeIndex === i;
          return (
            <button
              key={step.category}
              type="button"
              onClick={() => rowRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="group relative flex items-center justify-center p-1"
              aria-label={`Jump to ${step.label}`}
            >
              <motion.span
                animate={{
                  scale: isActive ? 1.4 : 1,
                  backgroundColor: done ? "hsl(var(--primary))" : isActive ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                }}
                transition={{ duration: 0.2 }}
                className="block h-2.5 w-2.5 rounded-full"
              />
              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full bg-card px-2.5 py-1 text-xs text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {step.label}
              </span>
            </button>
          );
        })}
        <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {doneCount}/{steps.length}
        </div>
      </div>
    </div>
  );
}
