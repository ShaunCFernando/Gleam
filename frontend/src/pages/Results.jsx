import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getRoutine } from "@/api";
import PageContainer from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Results() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRoutine(null);
    setError(null);
    getRoutine(slug)
      .then(setRoutine)
      .catch((err) => setError(err.message));
  }, [slug]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  if (error) {
    return (
      <PageContainer className="py-24 text-center text-muted-foreground">
        <p>Couldn't find that routine ({error}).</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/quiz")}>
          Take the quiz
        </Button>
      </PageContainer>
    );
  }

  if (!routine) {
    return (
      <PageContainer className="py-24 text-center text-muted-foreground">
        Building your routine&hellip;
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <h1 className="font-serif-display text-3xl sm:text-4xl">Your routine</h1>
      <p className="mt-2 text-muted-foreground">
        {routine.steps.length} steps, in the order you apply them &middot;{" "}
        <strong className="text-primary">${routine.total_price}</strong> total
      </p>

      <div className="mt-10 flex flex-col">
        {routine.steps.map((stepResult, i) => {
          const pick = stepResult.pick;
          return (
            <motion.div
              key={stepResult.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                {i < routine.steps.length - 1 && <div className="my-1.5 w-px flex-1 bg-border" />}
              </div>

              <div className="min-w-0 flex-1 pb-7">
                <div className="mb-2.5 mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  {stepResult.label}
                </div>

                {pick ? (
                  <Card>
                    <CardContent className="p-6">
                      {pick.product.image_url && (
                        <img
                          src={pick.product.image_url}
                          alt=""
                          loading="lazy"
                          className="mb-4 h-40 w-full rounded-xl bg-muted object-contain p-3"
                        />
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {pick.product.brand}
                          </div>
                          <div className="font-serif-display text-lg leading-snug">{pick.product.name}</div>
                        </div>
                        {pick.product.price != null && (
                          <div className="whitespace-nowrap font-semibold text-primary">
                            ${pick.product.price}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-primary/80">{pick.product.ingredient}</div>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                        {pick.product.blurb}
                      </p>
                      {pick.reasons.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {pick.reasons.map((r) => (
                            <Badge key={r}>{r}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-3.5 border-t border-dashed border-border pt-3 text-sm italic text-muted-foreground">
                        {stepResult.tip}
                      </div>
                      {stepResult.alt && (
                        <div className="mt-2.5 text-sm text-muted-foreground">
                          Also good: {stepResult.alt.product.brand} {stepResult.alt.product.name} ($
                          {stepResult.alt.product.price})
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      No safe match for this step given your sensitivity settings. Skip it for now.
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button size="lg" onClick={copyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Link copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy shareable link
            </>
          )}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate("/quiz")}>
          Start over
        </Button>
      </div>
    </PageContainer>
  );
}
