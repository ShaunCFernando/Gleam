import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import PageContainer from "@/components/PageContainer";

export default function Footer() {
  return (
    <footer className="border-t border-border/70">
      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p>Gleam. Korean skincare, translated for you.</p>
          <p>
            Product photography via{" "}
            <a
              href="https://world.openbeautyfacts.org"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm underline decoration-border underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Open Beauty Facts
            </a>{" "}
            (CC BY-SA) &middot; <Link to="/about" className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">about our picks</Link>
          </p>
        </motion.div>
      </PageContainer>
    </footer>
  );
}
