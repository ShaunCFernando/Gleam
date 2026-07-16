import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import PageContainer from "@/components/PageContainer";

const STEPS = [
  {
    id: "cleanser",
    number: "01",
    label: "Cleanser",
    image: "/routine/cleanser.png",
    imageAlt: "Anua Heartleaf Quercetinol cleansing foam tube",
    description:
      "One to two pumps is plenty — a gentle, low-pH formula shouldn't need more. Heartleaf and centella calm skin while it's most exposed, and rinse-off should never leave it feeling tight.",
  },
  {
    id: "toner",
    number: "02",
    label: "Toner",
    image: "/routine/toner.png",
    imageAlt: "Anua Heartleaf 77 Soothing Toner bottle",
    description:
      "Patted into damp skin, not rubbed in — that's what separates a toner from a rinse. Watery, humectant-forward formulas like birch juice prep skin for everything heavier behind them.",
  },
  {
    id: "essence",
    number: "03",
    label: "Essence",
    image: "/routine/essence.png",
    imageAlt: "mixsoon Reishi Mushroom Essence bottle",
    description:
      "Dosed in drops, not poured. This is where fermented actives like galactomyces usually live — broken down into molecules small enough for skin to actually use.",
  },
  {
    id: "serum",
    number: "04",
    label: "Serum",
    image: "/routine/serum.png",
    imageAlt: "JUMISO All Day Vitamin Brightening & Balancing Facial Serum bottle",
    description:
      "A serum's whole job is precision: one concentrated active, dosed exactly once. Slight tackiness right after application is normal — that's the active absorbing, not sitting on top.",
  },
  {
    id: "moisturizer",
    number: "05",
    label: "Moisturizer",
    image: "/routine/moisturizer.png",
    imageAlt: "Beauty of Joseon Revive Firming Moisturizer tube",
    description:
      "Sealed tight between uses, since air and light break down actives like ginseng faster than use does. Pressed on while every layer underneath is still damp — the step that locks everything else in.",
  },
  {
    id: "spf",
    number: "06",
    label: "SPF",
    image: "/routine/spf.png",
    imageAlt: "Round Lab Birch Juice Moisturizing UV Lock sunscreen tube",
    description:
      "Sealed and kept out of direct sun, since UV filters degrade with exposure too. The one step dermatologists agree on across the board: daily SPF, rain or shine, is prevention, not correction.",
  },
];

const CENTER = (STEPS.length - 1) / 2;
const CENTER_OFFSET = 170;

export default function RoutineLineup() {
  const [hovered, setHovered] = useState(null);
  const activeStep = STEPS.find((s) => s.id === hovered);

  return (
    <div className="py-20">
      <PageContainer className="max-w-6xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">How it's applied</div>
        <h2 className="mt-3 max-w-[28ch] font-serif-display text-3xl leading-tight sm:text-4xl">
          Every bottle, in order.
        </h2>
        <p className="mt-4 max-w-[56ch] text-muted-foreground">Hover a step to see what it's actually for.</p>
      </PageContainer>

      {/* Wider than the page's normal reading column so all six bottles have
          room to sit at full size without the outer ones getting clipped.
          (Deliberately not a `w-screen` full-bleed break-out: 100vw can be
          wider than the visible viewport when a scrollbar is present, which
          silently adds a horizontal scrollbar to the whole page.) */}
      <div className="mx-auto mt-16 w-full max-w-[100rem] px-4">
        <div className="flex items-end justify-center gap-3 overflow-x-auto sm:gap-6 lg:gap-10">
        {STEPS.map((step, i) => {
          const isHovered = hovered === step.id;
          const someHovered = hovered !== null;
          return (
            // Stable hit-box: never transformed, so it never moves out from under
            // the (stationary) cursor. Only the motion.div inside it animates —
            // translating this element instead would make the mouse fall outside
            // its new position mid-hover, firing mouseleave, snapping it back
            // under the cursor, re-firing mouseenter — an endless flicker.
            <button
              key={step.id}
              type="button"
              onMouseEnter={() => setHovered(step.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(step.id)}
              onBlur={() => setHovered(null)}
              style={{ zIndex: isHovered ? 30 : 1 }}
              className="relative shrink-0 focus-visible:outline-none"
            >
              <motion.div
                animate={{
                  x: isHovered ? (CENTER - i) * CENTER_OFFSET : 0,
                  filter: isHovered || !someHovered ? "blur(0px)" : "blur(6px)",
                  opacity: isHovered || !someHovered ? 1 : 0.4,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col items-center gap-3"
              >
                <img
                  src={step.image}
                  alt={step.imageAlt}
                  className="h-64 w-auto object-contain sm:h-80 lg:h-[26rem]"
                />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {step.label}
                </span>
              </motion.div>
            </button>
          );
        })}
        </div>
      </div>

      <PageContainer className="max-w-6xl">
        <div className="mx-auto mt-6 min-h-[6.5rem] max-w-md text-center">
          <AnimatePresence mode="wait">
            {activeStep && (
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  {activeStep.number} — {activeStep.label}
                </div>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{activeStep.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageContainer>
    </div>
  );
}
