import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { getProduct, getProducts } from "@/api";
import PageContainer from "@/components/PageContainer";
import RoutinePath from "@/components/RoutinePath";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PROGRESS_KEY = "gleam:build-routine";

const STEPS = [
  { category: "cleanser", label: "Cleanser" },
  { category: "toner", label: "Toner" },
  { category: "essence", label: "Essence" },
  { category: "serum", label: "Serum" },
  { category: "moisturizer", label: "Moisturizer" },
  { category: "spf", label: "SPF" },
  { category: "mask", label: "Mask" },
];

function loadSavedIds() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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

export default function Build() {
  const [picks, setPicks] = useState({}); // { [category]: productObject }
  const [hydrated, setHydrated] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [options, setOptions] = useState(null);
  const [search, setSearch] = useState("");

  // Only ids are persisted; hydrate to full product objects on mount so a
  // stored pick always reflects current price/tags rather than a stale copy.
  useEffect(() => {
    const savedIds = loadSavedIds();
    const entries = Object.entries(savedIds);
    if (entries.length === 0) {
      setHydrated(true);
      return;
    }
    Promise.all(
      entries.map(([category, id]) =>
        getProduct(id)
          .then((product) => [category, product])
          .catch(() => [category, null])
      )
    ).then((results) => {
      const next = {};
      for (const [category, product] of results) {
        if (product) next[category] = product;
      }
      setPicks(next);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Object.fromEntries(Object.entries(picks).map(([category, p]) => [category, p.id]));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  }, [picks, hydrated]);

  useEffect(() => {
    if (!openCategory) return;
    setOptions(null);
    const handle = setTimeout(() => {
      getProducts({ category: openCategory, source: "curated", q: search || undefined })
        .then(setOptions)
        .catch(() => setOptions([]));
    }, 150);
    return () => clearTimeout(handle);
  }, [openCategory, search]);

  function selectProduct(category, product) {
    setPicks((prev) => ({ ...prev, [category]: product }));
    setOpenCategory(null);
    setSearch("");
  }

  function removeProduct(category) {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  const selected = Object.values(picks);
  const total = selected.reduce((sum, p) => sum + (p.price || 0), 0);
  const activeStepLabels = STEPS.filter((s) => picks[s.category]?.actives).map((s) => s.label);
  const openStepLabel = STEPS.find((s) => s.category === openCategory)?.label ?? "";

  return (
    <PageContainer className="max-w-3xl py-10 sm:py-14">
      <h1 className="font-serif-display text-3xl sm:text-4xl">Build your own routine</h1>
      <p className="mt-2 text-muted-foreground">
        Assemble a routine step by step from the full catalog, at your own pace.
      </p>

      <AnimatePresence>
        {activeStepLabels.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6 overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5"
          >
            <p className="p-4 text-sm leading-relaxed text-destructive">
              <strong>{activeStepLabels.join(" + ")}</strong> both carry active ingredients. Most
              people introduce actives one at a time, not stacked together — consider spacing them
              across different days instead of using both daily.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <RoutinePath steps={STEPS} picks={picks} onChoose={setOpenCategory} onRemove={removeProduct} />
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center justify-between border-t border-border pt-6"
          >
            <span className="text-sm text-muted-foreground">
              {selected.length} of {STEPS.length} steps picked
            </span>
            <span className="text-lg font-semibold text-primary">${total.toFixed(0)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:pt-24"
            onClick={() => setOpenCategory(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif-display text-xl">Choose a {openStepLabel.toLowerCase()}</h2>
                <Button size="icon" variant="ghost" onClick={() => setOpenCategory(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Input
                autoFocus
                placeholder="Search brand or product…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />

              <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
                {options === null && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                )}
                {options?.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No matches.</p>
                )}
                {options?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProduct(openCategory, p)}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
                  >
                    <ProductThumb product={p} className="h-12 w-12 shrink-0 rounded-lg object-contain p-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                        {p.brand}
                      </div>
                      <div className="truncate text-sm font-medium">{p.name}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.actives && <Badge variant="outline">actives</Badge>}
                      {p.price != null && (
                        <span className="whitespace-nowrap text-sm font-semibold text-primary">${p.price}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
