import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/Footer.jsx";
import NavBar from "./components/NavBar.jsx";
import PageTransition from "./components/PageTransition.jsx";
import About from "./pages/About.jsx";
import Build from "./pages/Build.jsx";
import Catalog from "./pages/Catalog.jsx";
import Experience from "./pages/Experience.jsx";
import Home from "./pages/Home.jsx";
import Quiz from "./pages/Quiz.jsx";
import Results from "./pages/Results.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />

      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/quiz" element={<PageTransition><Quiz /></PageTransition>} />
            <Route path="/r/:slug" element={<PageTransition><Results /></PageTransition>} />
            <Route path="/catalog" element={<PageTransition><Catalog /></PageTransition>} />
            <Route path="/build" element={<PageTransition><Build /></PageTransition>} />
            <Route path="/experience" element={<PageTransition><Experience /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
