import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createRoutine, getQuizConfig } from "@/api";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "gleam:quiz-progress";

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function OptionButton({ selected, label, detail, onClick, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors disabled:opacity-70",
        selected ? "border-primary bg-secondary" : "hover:border-primary/50"
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-base font-semibold">{label}</span>
        {selected && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check className="h-4 w-4 text-primary" />
          </motion.span>
        )}
      </span>
      {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
    </motion.button>
  );
}

export default function Quiz() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState(null);
  const [configError, setConfigError] = useState(null);

  const saved = useMemo(loadSavedProgress, []);
  const [stepIndex, setStepIndex] = useState(saved?.stepIndex ?? 0);
  const [answers, setAnswers] = useState(
    saved?.answers ?? {
      skin_type: null,
      sensitivity: null,
      concerns: [],
      budget: null,
      routine_size: null,
    }
  );
  const [advancing, setAdvancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    getQuizConfig()
      .then(setSteps)
      .catch((err) => setConfigError(err.message));
  }, []);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ stepIndex, answers }));
  }, [stepIndex, answers]);

  if (configError) {
    return (
      <PageContainer className="py-24 text-center text-muted-foreground">
        <p>Couldn't load the quiz ({configError}).</p>
        <Button variant="ghost" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </PageContainer>
    );
  }

  if (!steps) {
    return <PageContainer className="py-24 text-center text-muted-foreground">Loading quiz&hellip;</PageContainer>;
  }

  const step = steps[stepIndex];
  const progressPct = ((stepIndex + 1) / steps.length) * 100;

  async function finish(finalAnswers) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const routine = await createRoutine(finalAnswers);
      localStorage.removeItem(PROGRESS_KEY);
      navigate(`/r/${routine.slug}`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  function advance(nextAnswers) {
    if (stepIndex < steps.length - 1) {
      setDirection(1);
      setStepIndex(stepIndex + 1);
    } else {
      finish(nextAnswers);
    }
  }

  function selectSingle(value) {
    const next = { ...answers, [step.id]: value };
    setAnswers(next);
    setAdvancing(true);
    setTimeout(() => {
      setAdvancing(false);
      advance(next);
    }, 220);
  }

  function toggleMulti(value) {
    const current = answers.concerns;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : current.length < step.max
      ? [...current, value]
      : current;
    setAnswers({ ...answers, concerns: next });
  }

  function goBack() {
    setDirection(-1);
    setStepIndex(stepIndex - 1);
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <Progress value={progressPct} className="mb-3" />
      <div className="mb-8 flex items-center justify-between text-xs tracking-wide text-muted-foreground">
        <span>
          {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        {stepIndex > 0 && (
          <button
            onClick={goBack}
            disabled={submitting}
            className="flex items-center gap-1 hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 className="font-serif-display text-2xl leading-snug sm:text-3xl">{step.question}</h1>
          <p className="mt-2 mb-8 text-muted-foreground">{step.hint}</p>

          <div className="flex flex-col gap-2.5">
            {step.options.map((opt) => {
              const selected =
                step.type === "multi"
                  ? answers.concerns.includes(opt.value)
                  : answers[step.id] === opt.value;
              return (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  detail={opt.detail}
                  selected={selected}
                  disabled={advancing || submitting}
                  onClick={() =>
                    step.type === "multi" ? toggleMulti(opt.value) : selectSingle(opt.value)
                  }
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {submitError && (
        <p className="mt-4 text-sm text-destructive">Couldn't save your routine ({submitError}).</p>
      )}

      {step.type === "multi" && (
        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            disabled={answers.concerns.length === 0 || submitting}
            onClick={() => advance(answers)}
          >
            {submitting ? "Building your routine…" : `Continue (${answers.concerns.length}/${step.max})`}
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
