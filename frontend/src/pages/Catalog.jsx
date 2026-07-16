import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { getProducts } from "@/api";
import PageContainer from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "cleanser", label: "Cleanser" },
  { value: "toner", label: "Toner" },
  { value: "essence", label: "Essence" },
  { value: "serum", label: "Serum" },
  { value: "moisturizer", label: "Moisturizer" },
  { value: "spf", label: "SPF" },
  { value: "mask", label: "Mask" },
];

const SKIN_TYPES = [
  { value: "all", label: "Any skin type" },
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "normal", label: "Normal" },
];

const SORTS = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function ProductImage({ product }) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt=""
        loading="lazy"
        className="h-40 w-full rounded-t-2xl bg-muted object-contain p-4"
      />
    );
  }
  return (
    <div className="flex h-40 w-full items-center justify-center rounded-t-2xl bg-muted font-serif-display text-4xl text-primary/40">
      {product.brand.slice(0, 1)}
    </div>
  );
}

export default function Catalog() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [skinType, setSkinType] = useState("all");
  const [curatedOnly, setCuratedOnly] = useState(false);
  const [sort, setSort] = useState("name");
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      getProducts({
        q,
        category: category === "all" ? undefined : category,
        skin_type: skinType === "all" ? undefined : skinType,
        sort,
        source: curatedOnly ? "curated" : undefined,
      })
        .then(setProducts)
        .catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(handle);
  }, [q, category, skinType, sort, curatedOnly]);

  return (
    <PageContainer className="max-w-5xl py-10 sm:py-14">
      <h1 className="font-serif-display text-3xl sm:text-4xl">Browse the shelf</h1>
      <p className="mt-2 text-muted-foreground">Every product in the catalog. Search or filter to find what you need.</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            type="search"
            placeholder="Search brand or product…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[168px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={skinType} onValueChange={setSkinType}>
          <SelectTrigger className="w-[168px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKIN_TYPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[188px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={curatedOnly} onCheckedChange={(v) => setCuratedOnly(v === true)} />
          Quiz-matched picks only
        </label>
      </div>

      {error && <p className="mt-8 text-sm text-destructive">Couldn't load products ({error}).</p>}

      {products && products.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">No products match those filters.</p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products ? (
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
              >
                <Card className="h-full overflow-hidden">
                  <ProductImage product={p} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                          {p.brand}
                        </div>
                        <div className="font-serif-display text-lg leading-snug">{p.name}</div>
                      </div>
                      {p.price != null && (
                        <div className="whitespace-nowrap font-semibold text-primary">${p.price}</div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-primary/80">{p.ingredient}</div>
                    {p.blurb && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.blurb}</p>}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Badge>{p.category}</Badge>
                      {p.skin_types.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                      {p.source === "external" && <Badge variant="muted">not in quiz matching</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
        )}
      </div>
    </PageContainer>
  );
}
