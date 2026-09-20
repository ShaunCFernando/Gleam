import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/Footer.jsx";
import NavBar from "./components/NavBar.jsx";
import PageTransition from "./components/PageTransition.jsx";

const About = lazy(() => import("./pages/About.jsx"));
const Build = lazy(() => import("./pages/Build.jsx"));
const Catalog = lazy(() => import("./pages/Catalog.jsx"));
const Experience = lazy(() => import("./pages/Experience.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Quiz = lazy(() => import("./pages/Quiz.jsx"));
const Results = lazy(() => import("./pages/Results.jsx"));

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />

      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <Suspense key={location.pathname} fallback={<div className="min-h-screen bg-background" />}>
            <Routes location={location}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/quiz" element={<PageTransition><Quiz /></PageTransition>} />
              <Route path="/r/:slug" element={<PageTransition><Results /></PageTransition>} />
              <Route path="/catalog" element={<PageTransition><Catalog /></PageTransition>} />
              <Route path="/build" element={<PageTransition><Build /></PageTransition>} />
              <Route path="/experience" element={<PageTransition><Experience /></PageTransition>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
