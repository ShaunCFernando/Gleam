import { motion } from "framer-motion";
import { BadgeCheck, FlaskConical, Layers, Leaf, ShieldHalf } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getProducts } from "@/api";
import FeatureRow from "@/components/FeatureRow";
import PageContainer from "@/components/PageContainer";
import RoutineLineup from "@/components/RoutineLineup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1773304189617-0e89faa81c6e?fm=jpg&q=80&w=1600&auto=format&fit=crop";
const FERMENT_IMAGE =
  "https://images.unsplash.com/photo-1747303969063-3b90bcb3942e?fm=jpg&q=80&w=1600&auto=format&fit=crop";

const CARDS = [
  {
    icon: ShieldHalf,
    title: "Prevention over correction",
    body: "The most repeated advice in Korean skincare is also the least exciting: wear sunscreen every day, rain or shine. Daily SPF heads off the dark spots and fine lines that most routines end up treating after the fact.",
  },
  {
    icon: Leaf,
    title: "Barrier-first, not actives-first",
    body: "Strong acids and retinoids have their place. But the default in Korean formulation is gentleness. Centella asiatica, panthenol, and ceramides show up constantly because a healthy moisture barrier comes before anything else.",
  },
];

const SPOTLIGHTS = [
  { query: { q: "ginseng" }, label: "Ginseng" },
  { query: { q: "rice" }, label: "Rice water" },
  { query: { q: "snail" }, label: "Snail mucin" },
];

function IngredientSpotlight() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    Promise.all(
      SPOTLIGHTS.map(({ query }) =>
        getProducts(query).then((results) => results.find((p) => p.image_url) ?? null)
      )
    ).then((results) => setProducts(results.filter(Boolean)));
  }, []);

  if (products && products.length === 0) return null;

  return (
    <PageContainer className="max-w-5xl py-20">
      <h2 className="mb-2 font-serif-display text-2xl sm:text-3xl">Ingredients worth knowing</h2>
      <p className="mb-10 max-w-[60ch] text-muted-foreground">
        A handful of names come up again and again in Korean formulas. Here's each one, and a
        real product from the shelf that uses it.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {(products ?? SPOTLIGHTS).map((p, i) => (
          <motion.div
            key={p?.id ?? i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            {p?.id ? (
              <Card className="overflow-hidden">
                <img src={p.image_url} alt="" className="h-40 w-full bg-muted object-contain p-4" />
                <CardContent className="p-4">
                  <div className="text-[11px] uppercase tracking-wide text-primary">
                    {SPOTLIGHTS[i]?.label}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">
                    {p.brand} {p.name}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[220px] animate-pulse rounded-2xl bg-secondary" />
            )}
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-[1.1fr_1fr]">
        <div className="flex items-center px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Why K-Beauty
            </div>
            <h1 className="mt-3 font-serif-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Not a trend. A different philosophy.
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              "K-beauty" isn't one ingredient or one 10-step routine. It's a handful of ideas
              about how skincare should work, most of them older than the marketing around them.
              Here's what's actually behind the products on this shelf.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/quiz")}>
                Take the quiz
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate("/catalog")}>
                Browse the shelf
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[320px] overflow-hidden sm:h-[440px] lg:h-auto"
        >
          <img
            src={HERO_IMAGE}
            alt="A traditional Korean ginseng shop"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
            Photo: Chelaxy Designs / Unsplash
          </span>
        </motion.div>
      </div>

      {/* ---------- HANBANG INTRO ---------- */}
      <PageContainer className="max-w-3xl py-16">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Hanbang is Korean traditional herbal medicine, the same body of knowledge behind
          ginseng tea and mugwort baths. Korean cosmetic labs took those same botanicals, ginseng
          root, rice water, centella asiatica, mugwort, licorice root, and reformulated them
          alongside modern dermatology instead of throwing tradition out to make room for it.
          That's the throughline in almost everything on this shelf: old ingredients, tested and
          adapted rather than replaced.
        </p>
      </PageContainer>

      {/* ---------- LAYERING / ROUTINE LINEUP ---------- */}
      <RoutineLineup />

      {/* ---------- CARDS ---------- */}
      <PageContainer className="max-w-5xl py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-3 p-8">
                  <card.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                  <h3 className="font-serif-display text-xl">{card.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{card.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageContainer>

      {/* ---------- FERMENTATION ---------- */}
      <FeatureRow
        image={FERMENT_IMAGE}
        imageAlt="A skincare serum in a dropper bottle"
        imageCredit="Photo: Mona Jain / Unsplash"
        eyebrow="Fermentation technology"
        title="Broken down to work better."
        reverse
      >
        <p>
          Korean labs were early adopters of fermenting cosmetic actives: yeast filtrates,
          fermented soybean, fermented rice. Fermentation breaks these ingredients into smaller
          molecules that skin absorbs more easily.
        </p>
        <p>It's a big part of why so many Korean essences feel light but still do something.</p>
      </FeatureRow>

      <IngredientSpotlight />

      {/* ---------- METHODOLOGY BAND ---------- */}
      <div className="bg-secondary py-20">
        <PageContainer className="max-w-3xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            <BadgeCheck className="h-4 w-4" /> How we build your routine
          </div>
          <h2 className="mt-3 font-serif-display text-2xl sm:text-4xl">Matched, not guessed.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Every product the quiz recommends comes from a small, hand-tagged catalog. Each one
            is checked for skin type fit, targeted concerns, and whether it's safe for reactive
            skin. Tell us your skin reacts easily, and anything with strong actives is excluded
            outright, not just pushed further down the list.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The wider catalog you can browse also includes real products pulled from{" "}
            <a
              href="https://world.openbeautyfacts.org"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              Open Beauty Facts
            </a>
            , an open cosmetics database. Those are there so you can browse with real photos, but
            since nobody has published verified skin type or sensitivity data for them, they
            never factor into your personal match.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" /> Fewer, better-vetted picks beat a bigger, unverified pile.
          </div>
        </PageContainer>
      </div>

      {/* ---------- CTA ---------- */}
      <PageContainer className="max-w-3xl py-20 text-center">
        <FlaskConical className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
        <h2 className="mt-4 font-serif-display text-2xl sm:text-3xl">See it in action.</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-muted-foreground">
          Five questions and you'll have a routine built around your actual skin.
        </p>
        <Button size="lg" className="mt-7" onClick={() => navigate("/quiz")}>
          Take the quiz
        </Button>
      </PageContainer>
    </div>
  );
}
