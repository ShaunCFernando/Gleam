import { motion, useScroll, useTransform } from "framer-motion";
import { Droplets, Flower2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getProducts } from "@/api";
import FeatureRow from "@/components/FeatureRow";
import HowItWorks from "@/components/HowItWorks";
import IngredientMarquee from "@/components/IngredientMarquee";
import PageContainer from "@/components/PageContainer";
import RoutineLineup from "@/components/RoutineLineup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFlip } from "@/components/ui/text-flip";
import { cn } from "@/lib/utils";

const SKIN_TYPES = ["oily", "dry", "combination", "normal"];

const HERO_IMAGE = "https://images.pexels.com/photos/6476077/pexels-photo-6476077.jpeg?cs=srgb&fm=jpg&w=1600";
const RITUAL_IMAGE =
  "https://images.unsplash.com/photo-1648203276014-20f97ba1f817?fm=jpg&q=80&w=1600&auto=format&fit=crop";
const HYDRATION_IMAGE =
  "https://images.unsplash.com/photo-1619451427882-6aaaded0cc61?fm=jpg&q=80&w=1600&auto=format&fit=crop";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Prevention over correction",
    body: "Daily sunscreen and gentle, consistent care beat harsh treatments applied after the damage is already done.",
  },
  {
    icon: Droplets,
    title: "Hydration is the foundation",
    body: "Toners, essences, and serums go on thin to thick, each one pressed into skin while it's still damp.",
  },
  {
    icon: Flower2,
    title: "Hanbang, modernized",
    body: "Ginseng, rice, mugwort, centella. Traditional Korean herbal medicine, reformulated with modern dermatology.",
  },
  {
    icon: Sparkles,
    title: "Fermentation technology",
    body: "Korean labs were early adopters of fermenting actives like galactomyces, prized for how gently skin takes to them.",
  },
];
const PILLARS_CENTER = (PILLARS.length - 1) / 2;

// Word fans out from/into center based on distance from the middle word.
// mode="exit": converged at scroll 0 (so above-the-fold content still looks
// normal on first paint), scatters as the page scrolls past it — used for
// the hero, which is already in view with nothing scrolled yet on load.
// mode="enter": starts scattered, converges as the section scrolls into
// view — the usual case for anything below the fold.
function ConvergeWord({ word, index, centerIndex, scrollYProgress, mode = "enter", italic }) {
  const distance = index - centerIndex;
  const input = mode === "enter" ? [0, 0.5] : [0, 1];
  const range = mode === "enter" ? [distance * 40, 0] : [0, distance * 30];
  const x = useTransform(scrollYProgress, input, range);
  return (
    <motion.span
      style={{ x }}
      className={cn("mr-[0.28em] inline-block last:mr-0", italic && "not-italic text-primary sm:italic")}
    >
      {word}
    </motion.span>
  );
}

function PillarCard({ pillar, index, scrollYProgress }) {
  const distance = index - PILLARS_CENTER;
  const x = useTransform(scrollYProgress, [0, 0.5], [distance * 60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  return (
    <motion.div style={{ x, opacity }}>
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-3 p-6">
          <pillar.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
          <h3 className="font-serif-display text-lg">{pillar.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeaturedProducts() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    getProducts()
      .then((all) => setProducts(all.filter((p) => p.image_url).slice(0, 4)))
      .catch(() => setProducts([]));
  }, []);

  if (products && products.length === 0) return null;

  return (
    <PageContainer className="max-w-5xl py-20">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-serif-display text-2xl sm:text-3xl">From the shelf</h2>
        <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground">
          Browse all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(products ?? Array.from({ length: 4 })).map((p, i) => (
          <motion.div
            key={p?.id ?? i}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {p ? (
              <Card className="overflow-hidden">
                <img src={p.image_url} alt="" className="h-32 w-full bg-muted object-contain p-3" />
                <CardContent className="p-3">
                  <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                    {p.brand}
                  </div>
                  <div className="truncate text-sm font-medium">{p.name}</div>
                </CardContent>
              </Card>
            ) : (
              <Skeleton className="aspect-square w-full" />
            )}
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const pillarsRef = useRef(null);
  const { scrollYProgress: pillarsProgress } = useScroll({ target: pillarsRef, offset: ["start end", "end center"] });

  const hydrationRef = useRef(null);
  const { scrollYProgress: hydrationProgress } = useScroll({
    target: hydrationRef,
    offset: ["start end", "start center"],
  });
  const hydrationImageY = useTransform(hydrationProgress, [0, 1], ["-6%", "6%"]);

  const heroLine1 = ["Korean", "skincare,"];
  const heroLine2 = ["translated", "for", "you."];
  const heroCenter = (heroLine1.length + heroLine2.length - 1) / 2;

  const hydrationTitle = ["Layered,", "not", "loaded."];
  const hydrationCenter = (hydrationTitle.length - 1) / 2;

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <div ref={heroRef} className="grid grid-cols-1 items-stretch lg:grid-cols-[1.1fr_1fr]">
        <div className="flex items-center px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
            >
              Gleam
            </motion.div>
            <h1 className="mt-3 font-serif-display text-4xl leading-[1.08] sm:text-6xl lg:text-6xl">
              {heroLine1.map((word, i) => (
                <ConvergeWord
                  key={word}
                  word={word}
                  index={i}
                  centerIndex={heroCenter}
                  scrollYProgress={heroProgress}
                  mode="exit"
                />
              ))}
              <br />
              {heroLine2.map((word, i) => (
                <ConvergeWord
                  key={word}
                  word={word}
                  index={heroLine1.length + i}
                  centerIndex={heroCenter}
                  scrollYProgress={heroProgress}
                  mode="exit"
                  italic
                />
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground"
            >
              The best of the Seoul beauty aisle, matched to your skin, your concerns, and your
              budget. No Korean required, no 12-step overwhelm.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button size="lg" onClick={() => navigate("/quiz")}>
                Build my routine
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate("/about")}>
                Why Korean skincare works
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
            >
              Built for <TextFlip words={SKIN_TYPES} /> skin.
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[380px] overflow-hidden sm:h-[480px] lg:h-auto"
        >
          <img
            src={HERO_IMAGE}
            alt="Applying facial serum as part of a skincare routine"
            className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
            Photo: Anna Nekrashevich / Pexels
          </span>
        </motion.div>
      </div>

      <IngredientMarquee />

      {/* ---------- MISSION / RITUAL ---------- */}
      <FeatureRow
        image={RITUAL_IMAGE}
        imageAlt="A skincare ritual: cream applied with a warm towel wrap"
        imageCredit="Photo: Kaeme / Unsplash"
        eyebrow="Our mission"
        title="A routine that actually fits your skin."
        action={
          <Button variant="link" className="mt-2 px-0" onClick={() => navigate("/about")}>
            Read the philosophy &rarr;
          </Button>
        }
      >
        <p>
          Most routines fail for one reason. They weren't built for your skin in the first
          place. We match real, verified products to your skin type, your sensitivity, and your
          budget instead of whatever's trending this week.
        </p>
        <p>Answer five questions and you'll have a routine you can actually stick with.</p>
      </FeatureRow>

      <HowItWorks />

      {/* ---------- PILLARS ---------- */}
      <PageContainer ref={pillarsRef} className="max-w-5xl py-20">
        <h2 className="mb-10 font-serif-display text-2xl sm:text-3xl">The Gleam philosophy</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} scrollYProgress={pillarsProgress} />
          ))}
        </div>
      </PageContainer>

      {/* ---------- HYDRATION (inlined, not the shared FeatureRow, so the
          scroll-convergence effect here doesn't also apply to FeatureRow's
          other usages on the About page) ---------- */}
      <div ref={hydrationRef} className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="relative order-2 h-[340px] overflow-hidden sm:h-[440px] lg:order-1 lg:h-auto lg:min-h-[520px]">
          <motion.img
            src={HYDRATION_IMAGE}
            alt="Hands applying lotion as part of a hydration routine"
            style={{ y: hydrationImageY }}
            className="absolute inset-0 h-[130%] w-full object-cover"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
            Photo: Nataliya Melnychuk / Unsplash
          </span>
        </div>
        <div className="order-1 flex items-center px-6 py-16 sm:px-12 lg:order-2 lg:px-16">
          <div className="max-w-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Hydration first
            </div>
            <h2 className="mt-3 font-serif-display text-3xl leading-tight sm:text-4xl">
              {hydrationTitle.map((word, i) => (
                <ConvergeWord
                  key={word}
                  word={word}
                  index={i}
                  centerIndex={hydrationCenter}
                  scrollYProgress={hydrationProgress}
                  mode="enter"
                />
              ))}
            </h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Korean routines separate hydration into stages: a watery toner first, then an
                essence, then a heavier cream. Each layer actually absorbs instead of sitting on
                top of the last.
              </p>
              <p>Your matched routine is sized to what you'll really use. Four steps, five, or seven.</p>
            </div>
          </div>
        </div>
      </div>

      <FeaturedProducts />

      {/* ---------- ROUTINE LINEUP (hover-driven, not scroll-linked on purpose) ---------- */}
      <RoutineLineup />

      {/* ---------- FINAL CTA ---------- */}
      <div className="bg-primary py-20 text-primary-foreground">
        <PageContainer className="text-center">
          <h2 className="font-serif-display text-3xl sm:text-4xl">Five questions, one routine.</h2>
          <p className="mx-auto mt-3 max-w-[42ch] text-primary-foreground/80">
            Tell us about your skin and we'll match you to real, curated products. Matched, not
            guessed.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="mt-7 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/quiz")}
          >
            Get started
          </Button>
        </PageContainer>
      </div>
    </div>
  );
}
