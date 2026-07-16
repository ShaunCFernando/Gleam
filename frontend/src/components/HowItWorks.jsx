import { motion } from "framer-motion";

import PageContainer from "@/components/PageContainer";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    title: "Answer five questions",
    body: "Skin type, sensitivity, concerns, and budget. No 12-step vocabulary required.",
  },
  {
    title: "Get matched to real products",
    body: "Every pick is checked against your answers, not just whatever's trending this week.",
  },
  {
    title: "Follow a routine sized to you",
    body: "Four steps, five, or seven. Only what you'll actually use, in the right order.",
  },
];

export default function HowItWorks() {
  return (
    <PageContainer className="max-w-5xl py-20">
      <h2 className="mb-2 font-serif-display text-2xl sm:text-3xl">How your routine gets built</h2>
      <p className="mb-16 max-w-[52ch] text-muted-foreground sm:mb-24">
        Three steps between "I don't know where to start" and a routine that's actually yours.
      </p>

      <div className="relative mx-auto h-[340px] max-w-sm sm:h-[300px]">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: i * 26, x: i * 22, rotate: (i - 1) * 5 }}
            whileHover={{ y: i * 26 - 20, rotate: 0, scale: 1.03 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            style={{ zIndex: i + 1 }}
            className="absolute inset-x-0 top-0 mx-auto w-full"
          >
            <Card className="bg-card">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-serif-display text-lg">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}
