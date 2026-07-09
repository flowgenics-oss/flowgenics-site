import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Settings,
  Activity,
  CheckCircle,
  TrendingUp,
  Workflow,
  Shield,
  Search,
  Database,
  Cpu,
  FileSpreadsheet,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  ExternalLink,
  Mail,
  Globe,
  Calendar,
  ArrowRight,
  Facebook,
  Linkedin
} from "lucide-react";
import FlowSystemGraphic from "./components/FlowSystemGraphic";

// Steps configuration mapping
// 0: Hero, 1-3: Trust Bar metrics, 4-7: Problem Cards, 8-10: Approach (Combined), 11-14: Why Pillars, 15: CTA & Footer
const TOTAL_STEPS = 16;

interface CircleRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: string;
  opacity: number;
}

export default function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [circleRect, setCircleRect] = useState<CircleRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    borderRadius: "50%",
    opacity: 0
  });

  // Dialog / Modal state for Book Discovery Call
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", notes: "" });

  // For tracking touch swipe gestures on mobile
  const touchStartY = useRef<number | null>(null);
  const scrollCooldown = useRef<boolean>(false);
  const growthNodeRef = useRef<HTMLDivElement | null>(null);

  // Map activeStep to section index
  // Sections: 
  // 0: Hero (Step 0)
  // 1: Trust Bar (Steps 1-3)
  // 2: The Problem (Steps 4-7)
  // 3: Approach (Steps 8-10, now combined Approach & Services)
  // 4: Why Flowgenics (Steps 11-14)
  // 5: CTA / Footer (Step 15)
  const getSectionIndex = (step: number) => {
    if (step === 0) return 0;
    if (step >= 1 && step <= 3) return 1;
    if (step >= 4 && step <= 7) return 2;
    if (step >= 8 && step <= 10) return 3;
    if (step >= 11 && step <= 14) return 4;
    return 5; // CTA & Footer (Step 15)
  };

  const currentSection = getSectionIndex(activeStep);

  // Update Wandering Circle's position based on active step's target element
  const updateCirclePosition = () => {
    const targetId = `step-target-${activeStep}`;
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setCircleRect({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: window.getComputedStyle(targetElement).borderRadius || "50%",
        opacity: 1
      });
    } else {
      setCircleRect((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  // Continuous monitoring loop for the circle to keep it perfectly tracked during layout reflows/scroll transitions
  useEffect(() => {
    updateCirclePosition();
    const interval = setInterval(updateCirclePosition, 100);
    window.addEventListener("resize", updateCirclePosition);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateCirclePosition);
    };
  }, [activeStep]);

  // Handle section steps on scroll/wheel
  const handleNextStep = () => {
    if (activeStep < TOTAL_STEPS - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  // Wheel Event Handler for desktop scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow modal scroll
      if (isBookModalOpen) return;

      e.preventDefault();
      if (scrollCooldown.current) return;

      scrollCooldown.current = true;
      setTimeout(() => {
        scrollCooldown.current = false;
      }, 700); // 700ms threshold for clean snapping transition

      if (e.deltaY > 20) {
        handleNextStep();
      } else if (e.deltaY < -20) {
        handlePrevStep();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeStep, isBookModalOpen]);

  // Key Event Handler for keyboards (Arrow keys / Space / PageUp / PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBookModalOpen) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep, isBookModalOpen]);

  // Touch handlers for mobile/trackpad swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isBookModalOpen) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isBookModalOpen || touchStartY.current === null) return;
    const touchEndY = e.touches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffY) > 50) {
      if (scrollCooldown.current) return;
      scrollCooldown.current = true;
      setTimeout(() => {
        scrollCooldown.current = false;
      }, 700);

      if (diffY > 0) {
        handleNextStep();
      } else {
        handlePrevStep();
      }
      touchStartY.current = null;
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookSuccess(true);
    setTimeout(() => {
      setIsBookModalOpen(false);
      setBookSuccess(false);
      setFormData({ name: "", email: "", company: "", notes: "" });
    }, 2500);
  };

  return (
    <div
      className="w-full h-screen overflow-hidden bg-soft-white text-neutral-900 font-sans flex flex-col relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* GLOBAL BACKGROUND ELEMENTS */}
      {/* Light-dominant Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD4C2_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* FIXED FLOATING HEADER (Floating Pill Design Inspired by Nickel UI Reference) */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <header
          className="w-full max-w-7xl h-18 bg-onyx/80 backdrop-blur-lg border border-neutral-800 text-soft-white rounded-2xl flex items-center justify-between px-6 md:px-10 transition-all duration-300 shadow-elevated pointer-events-auto"
          id="main-header"
        >
          <button
            onClick={() => setActiveStep(0)}
            className="flex items-center gap-3 select-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {/* Flowgenics Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-imperial-blue flex items-center justify-center font-display font-bold text-base text-soft-white select-none">
              F
            </div>
            <span className="text-lg font-display font-bold tracking-tight text-soft-white uppercase">
              Flowgenics
            </span>
          </button>

          {/* Center Nav Link Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
            <button
              onClick={() => setActiveStep(1)}
              className={`hover:text-soft-white transition-colors cursor-pointer ${
                currentSection === 1 ? "text-soft-white font-semibold" : ""
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => setActiveStep(8)}
              className={`hover:text-soft-white transition-colors cursor-pointer ${
                currentSection === 3 ? "text-soft-white font-semibold" : ""
              }`}
            >
              Approach
            </button>
            <button
              onClick={() => setActiveStep(11)}
              className={`hover:text-soft-white transition-colors cursor-pointer ${
                currentSection === 4 ? "text-soft-white font-semibold" : ""
              }`}
            >
              Why Us
            </button>
            <button
              onClick={() => {}}
              className="hover:text-soft-white transition-colors cursor-pointer"
            >
              Case Studies
            </button>
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:block">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="bg-imperial-blue hover:bg-brilliant-azure text-soft-white text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-300 cursor-pointer shadow-sm shadow-imperial-blue/20"
            >
              Book Discovery Call
            </button>
          </div>

          {/* Mobile menu indicator icon */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-neutral-300 hover:text-soft-white p-2"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
      </div>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-4 right-4 bg-onyx/95 backdrop-blur-xl z-40 flex flex-col p-6 md:hidden text-soft-white border border-neutral-800 rounded-2xl shadow-elevated"
          >
            <div className="flex flex-col gap-5 text-base font-medium">
              <button
                onClick={() => {
                  setActiveStep(1);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-1.5 hover:text-brilliant-azure transition-colors"
              >
                Impact
              </button>
              <button
                onClick={() => {
                  setActiveStep(8);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-1.5 hover:text-brilliant-azure transition-colors"
              >
                Approach
              </button>
              <button
                onClick={() => {
                  setActiveStep(11);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-1.5 hover:text-brilliant-azure transition-colors"
              >
                Why Us
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-1.5 hover:text-brilliant-azure transition-colors"
              >
                Case Studies
              </button>

              <button
                onClick={() => {
                  setIsBookModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="bg-imperial-blue hover:bg-brilliant-azure text-soft-white font-semibold py-3 px-5 rounded-xl text-center mt-2 transition-colors shadow-sm shadow-imperial-blue/20"
              >
                Book Discovery Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDE SCROLL PROGRESS NAVIGATION */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 hidden md:flex flex-col gap-3 items-center">
        {Array.from({ length: 6 }).map((_, secIdx) => {
          // Map section index back to step target
          const sectionStepMap = [0, 1, 4, 8, 11, 15];
          const isCurrentSection = currentSection === secIdx;

          return (
            <button
              key={secIdx}
              onClick={() => setActiveStep(sectionStepMap[secIdx])}
              className="group relative flex items-center justify-center p-1.5 cursor-pointer"
              aria-label={`Go to section ${secIdx + 1}`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isCurrentSection ? "bg-imperial-blue scale-125" : "bg-neutral-300 group-hover:bg-neutral-500"
                }`}
              />
              <span className="absolute right-8 text-xs font-semibold bg-onyx text-soft-white py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                {secIdx === 0 && "Home"}
                {secIdx === 1 && "Operational Impact"}
                {secIdx === 2 && "The Core Challenge"}
                {secIdx === 3 && "The Flowgenics Approach"}
                {secIdx === 4 && "Why Flowgenics"}
                {secIdx === 5 && "Book a Call"}
              </span>
            </button>
          );
        })}
      </div>

      {/* INTERACTIVE WANDERING CIRCLE (THE DESIGN SOUL) */}
      <motion.div
        className={`pointer-events-none fixed mix-blend-mode-normal transition-all duration-300 ${
          activeStep === 4 ? "z-10" : "z-30"
        }`}
        animate={{
          left: circleRect.x,
          top: circleRect.y,
          width: circleRect.width,
          height: circleRect.height,
          borderRadius: circleRect.borderRadius,
          opacity: circleRect.opacity
        }}
        transition={{
          type: "spring",
          stiffness: 110,
          damping: 20,
          mass: 0.9
        }}
        style={{
          boxSizing: "border-box",
          // Apply custom outlines or colors depending on active step styling constraints
          border: "none",
          backgroundColor:
            activeStep === 15
              ? "transparent" // let the actual Book CTA render natively below
              : "#0A2472", // Imperial Blue default solid fill
          boxShadow:
            activeStep === 4
              ? "0 0 16px rgba(10, 36, 114, 0.3)" // soft system highlight glow
              : "none"
        }}
      />

      {/* SLIDING SECTIONS CONTAINER (A5 Section Rhythm & Snap Compliant) */}
      <motion.main
        className="w-full flex-1 flex flex-col relative z-20"
        animate={{ y: `-${currentSection * 100}dvh` }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        style={{ height: "600dvh" }} // 6 sections * 100vh
      >
        {/* SECTION 1: ABOVE THE FOLD (HERO) */}
        <section className="w-full h-screen shrink-0 bg-onyx text-soft-white flex flex-col justify-center px-6 md:px-16 pt-20 relative overflow-hidden">
          {/* Curved Flow Pattern Overlay Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#F8FAFC_0.5px,transparent_0.5px)] [background-size:16px_16px]" />

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            {/* Left Narrative Text */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight leading-none text-soft-white">
                Build Systems <br />
                That Scale.
              </h1>
              <p className="text-neutral-100 text-base md:text-lg max-w-xl font-sans leading-relaxed">
                We help growing business automate operations, reduce manual work and scale with confidence.
              </p>

              {/* Action Rows */}
              <div className="flex flex-wrap gap-4 items-center mt-2">
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="bg-imperial-blue hover:bg-brilliant-azure text-soft-white font-medium py-3.5 px-7 rounded-md transition-all duration-300 cursor-pointer text-sm shadow-lg shadow-imperial-blue/10"
                >
                  Book Discovery Call
                </button>
                <button
                  onClick={() => setActiveStep(8)}
                  className="border border-neutral-700 hover:border-soft-white bg-transparent text-soft-white font-medium py-3.5 px-7 rounded-md transition-all duration-300 cursor-pointer text-sm"
                >
                  Explore Our Approach
                </button>
              </div>

              {/* Supporting tagline */}
              <p className="text-xs text-ash-grey font-mono italic">
                We turn operational chaos into operational clarity
              </p>
            </div>

            {/* Right Interactive SVG Graphics Grid */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <FlowSystemGraphic growthNodeRef={growthNodeRef} activeStep={activeStep} />
            </div>
          </div>

          {/* Section Indicator Footer with Node Anchor */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
            <span className="text-xs text-neutral-500 font-mono tracking-widest uppercase">
              Operational Impact
            </span>
            <ChevronDown size={18} className="text-neutral-400" />
          </div>

          {/* Hidden reference node to initialize the wandering circle's launch position */}
          <div
            id="step-target-0"
            className="absolute right-[8%] md:right-[10%] top-[62%] w-3 h-3 bg-transparent rounded-full pointer-events-none"
          />
        </section>

        {/* SECTION 2: TRUST BAR / BENEFIT METRICS */}
        <section className="w-full h-screen shrink-0 bg-soft-white flex flex-col justify-center px-6 md:px-16 pt-20 relative">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-12 z-10">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-imperial-blue font-mono font-semibold">
                Operational Efficiency First
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-onyx tracking-tight">
                Our Foundational Metrics
              </h2>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-stretch">
              {[
                {
                  step: 1,
                  title: "Reduce Manual Work",
                  desc: "Free your team from repetitive tasks and focus on higher-value work."
                },
                {
                  step: 2,
                  title: "Improve Operational Visibility",
                  desc: "Gain clarity across workflows, teams, and systems. Know exactly where processes bottleneck."
                },
                {
                  step: 3,
                  title: "Scale Without Complexity",
                  desc: "Build infrastructure that grows with your business safely. No added headcount bloat."
                }
              ].map((item) => {
                const isActive = activeStep === item.step;

                return (
                  <div
                    key={item.step}
                    onClick={() => setActiveStep(item.step)}
                    className={`p-8 md:p-10 rounded-xl border transition-all duration-500 flex flex-col justify-between cursor-pointer group relative ${
                      isActive
                        ? "bg-white border-ash-grey shadow-card scale-102"
                        : "bg-neutral-50 border-neutral-200/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Absolutely positioned step-target anchor on the left side of the card */}
                    <div
                      id={`step-target-${item.step}`}
                      className="absolute left-6 md:left-10 top-9 md:top-11 w-4 h-4 rounded-full bg-transparent pointer-events-none"
                    />

                    <div className="flex flex-col gap-4">
                      {/* Left-aligned title that translates dynamically when the circle is active */}
                      <h3
                        className={`text-xl md:text-2xl font-display font-medium text-onyx transition-all duration-500 ${
                          isActive ? "translate-x-6 md:translate-x-8 pl-1" : "translate-x-0"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-neutral-700 text-sm md:text-base leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bouncing navigation arrow */}
          <div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 text-neutral-400 animate-bounce cursor-pointer select-none"
            onClick={handleNextStep}
          >
            <span className="text-[9px] font-mono tracking-widest uppercase opacity-60">Scroll</span>
            <ChevronDown size={18} />
          </div>
        </section>

        {/* SECTION 3: THE PROBLEM */}
        <section className="w-full h-screen shrink-0 bg-transparent flex flex-col justify-center px-6 md:px-16 pt-20 relative">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            
            {/* Left Column Narrative text */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <span className="text-xs uppercase tracking-wider text-imperial-blue font-mono font-semibold">
                The Problem
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-onyx tracking-tight leading-tight">
                Most businesses don't have an AI problem. <br />
                <span className="text-neutral-500">They have a </span>
                <span className="relative inline-block px-1">
                  <span
                    id="step-target-4"
                    className="absolute inset-0 bg-transparent rounded-sm"
                  />
                  <span className={`relative z-40 font-bold transition-colors duration-500 ${activeStep === 4 ? "text-amber-flame" : "text-imperial-blue"}`}>systems</span>
                </span>
                <span className="text-neutral-500"> problem.</span>
              </h2>
              <p className="text-neutral-700 text-sm md:text-base leading-relaxed">
                As businesses grow, operations become more complex. Processes become inconsistent, information becomes fragmented, and teams spend more time managing work than actually executing it.
              </p>
              <p className="text-neutral-600 text-xs md:text-sm font-mono bg-white p-4 rounded-md border border-neutral-200">
                The result: Slower execution speeds, higher communication overheads, and severely limited visibility.
              </p>
            </div>

            {/* Right Column problem cards */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {[
                {
                  step: 5,
                  num: "01",
                  title: "Operations",
                  desc: "Processes live in people’s head."
                },
                {
                  step: 6,
                  num: "02",
                  title: "Data",
                  desc: "Information is scattered."
                },
                {
                  step: 7,
                  num: "03",
                  title: "Growth",
                  desc: "Complexity increases faster than revenue."
                }
              ].map((card) => {
                const isActive = activeStep === card.step;

                return (
                  <div
                    key={card.step}
                    onClick={() => setActiveStep(card.step)}
                    className={`p-6 rounded-lg border transition-all duration-300 flex items-start gap-5 cursor-pointer relative ${
                      isActive
                        ? "bg-white border-ash-grey shadow-card"
                        : "bg-white/40 border-neutral-200/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Circle Anchor positioning inside card */}
                    <div className="relative pt-1 shrink-0">
                      <div
                        id={`step-target-${card.step}`}
                        className="w-3.5 h-3.5 rounded-full bg-transparent"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-semibold text-lg text-onyx">
                          {card.title}
                        </h4>
                        <span className="text-xs font-mono text-neutral-400 font-bold">
                          {card.num}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-neutral-700 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: THE APPROACH (CONSOLIDATED WITH SERVICES) */}
        <section className="w-full h-screen shrink-0 bg-[#0A0B0A] flex flex-col justify-center px-6 md:px-16 pt-20 relative">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            {/* Left Column layout: Clean text headers */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-[#FFBA08] font-mono font-semibold">
                  The Flowgenics Approach
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-medium text-soft-white tracking-tight">
                  Operational Systems Built For Growth
                </h2>
                <p className="text-neutral-400 text-sm md:text-base leading-relaxed font-sans">
                  A Proven Framework for Operational Growth
                </p>
              </div>
            </div>

            {/* Right Column Layout: Beautiful Vertical Flow Diagram */}
            <div className="lg:col-span-7 flex flex-col justify-center relative pl-4 md:pl-10">
              <div className="flex flex-col gap-8 relative w-full">
                {/* Vertical linking pipeline indicator */}
                <div className="absolute left-4 md:left-5 top-8 bottom-8 w-0.5 bg-neutral-800" />
                
                {/* Dynamic colored progress indicator overlay on pipeline line */}
                <div 
                  className="absolute left-4 md:left-5 top-8 w-0.5 bg-brilliant-azure transition-all duration-500"
                  style={{
                    height: activeStep < 8 ? "0%" : activeStep === 8 ? "0%" : activeStep === 9 ? "50%" : "100%"
                  }}
                />

                {[
                  {
                    step: 8,
                    num: "1",
                    title: "Flow Audit - Design",
                    desc: "Understand your business, workflows and operational challenges.",
                    bullets: ["Map workflows.", "Document processes.", "Create clarity."]
                  },
                  {
                    step: 9,
                    num: "2",
                    title: "Flow Build - Automate",
                    desc: "Create and implement scalable systems tailored to your business objectives.",
                    bullets: ["Remove repetitive tasks.", "Integrate tools.", "Reduce friction."]
                  },
                  {
                    step: 10,
                    num: "3",
                    title: "Flow Scale - Optimize",
                    desc: "Monitor performance, compliance, relevance and continuously improve outcomes.",
                    bullets: ["Measure performance.", "Improve continuously.", "Scale sustainably."]
                  }
                ].map((item) => {
                  const isActive = activeStep === item.step;
                  const isPassed = activeStep >= item.step;

                  return (
                    <div
                       key={item.step}
                       onClick={() => setActiveStep(item.step)}
                       className={`relative flex gap-6 md:gap-8 items-start cursor-pointer group transition-all duration-300`}
                    >
                      {/* Node on vertical pipeline line */}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-display font-semibold border text-xs md:text-sm transition-all duration-300 ${
                            isActive
                              ? "bg-brilliant-azure text-soft-white border-brilliant-azure shadow-lg shadow-brilliant-azure/25"
                              : isPassed
                              ? "bg-brilliant-azure/10 text-brilliant-azure border-brilliant-azure/30"
                              : "bg-neutral-900 text-neutral-500 border-neutral-800"
                          }`}
                        >
                          {item.num}
                        </div>
                      </div>

                      {/* Card contents formatted beautifully as requested */}
                      <div
                        className={`flex-1 p-5 md:p-6 rounded-xl border transition-all duration-300 relative ${
                          isActive
                            ? "bg-neutral-900 border-neutral-700 shadow-elevated scale-102"
                            : "bg-neutral-900/40 border-neutral-800/60 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* Target Anchor positioned right inside card next to title */}
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            id={`step-target-${item.step}`}
                            className="w-3.5 h-3.5 rounded-full bg-transparent shrink-0"
                          />
                          <h4 className={`font-display font-bold text-base md:text-lg transition-colors ${
                            isActive ? "text-soft-white" : "text-neutral-300 group-hover:text-soft-white"
                          }`}>
                            {item.title}
                          </h4>
                        </div>

                        {/* Distinct block lines exactly matching the requested details */}
                        <div className="flex flex-col gap-2 pl-6.5">
                          <p className={`text-xs md:text-sm leading-relaxed font-sans transition-colors ${
                            isActive ? "text-neutral-200" : "text-neutral-400"
                          }`}>
                            {item.desc}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {item.bullets.map((bullet, bIdx) => (
                              <span key={bIdx} className={`text-xs font-mono flex items-center gap-1 transition-colors ${
                                isActive ? "text-neutral-300" : "text-neutral-500"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-brilliant-azure" />
                                {bullet}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHY FLOWGENICS */}
        <section className="w-full h-screen shrink-0 bg-neutral-50 flex flex-col justify-center px-6 md:px-16 pt-20 relative">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            {/* Left Column explanation */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <span className="text-xs uppercase tracking-wider text-imperial-blue font-mono font-semibold">
                Why Flowgenics
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-onyx tracking-tight leading-tight">
                Technology is Easy. <br />
                <span className="text-imperial-blue">Adoption is Hard.</span>
              </h2>
              <p className="text-neutral-700 text-sm md:text-base leading-relaxed">
                Successful automation isn't about tools. <br className="hidden md:inline" />
                It's about creating systems that people trust, understand, and use consistently.
              </p>
              <div className="h-[2px] w-12 bg-imperial-blue" />
              <p className="text-xs text-neutral-500 font-mono italic">
                That's why we focus on operational design first and technology second.
              </p>
            </div>

            {/* Right Column 2x2 grid with morphing vertical line */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {[
                {
                  step: 11,
                  title: "Clarity",
                  desc: "We simplify complex operations"
                },
                {
                  step: 12,
                  title: "Efficiency",
                  desc: "We reduce friction and wasted effort"
                },
                {
                  step: 13,
                  title: "Precision",
                  desc: "We build reliable systems that perform consistently"
                },
                {
                  step: 14,
                  title: "Responsibility",
                  desc: "We create solutions that support people and data"
                }
              ].map((item) => {
                const isActive = activeStep === item.step;

                return (
                  <div
                    key={item.step}
                    onClick={() => setActiveStep(item.step)}
                    className={`p-6 rounded-lg bg-white border transition-all duration-300 flex items-start gap-4 cursor-pointer relative ${
                      isActive
                        ? "border-ash-grey shadow-card scale-102"
                        : "border-neutral-200/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* The circle target. Will stretch vertically beside the active pillar */}
                    <div
                      id={`step-target-${item.step}`}
                      className="absolute left-0 top-6 bottom-6 w-1 bg-transparent rounded-r-md pointer-events-none"
                    />

                    <div className="flex flex-col gap-2 pl-2">
                      <h4 className="font-display font-semibold text-lg text-onyx">
                        {item.title}
                      </h4>
                      <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7: FINAL CTA & COMPREHENSIVE FOOTER */}
        <section className="w-full h-screen shrink-0 bg-onyx text-soft-white flex flex-col justify-between pt-28 pb-10 px-6 md:px-16 relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#F8FAFC_0.5px,transparent_0.5px)] [background-size:20px_20px]" />

          {/* Core Call-to-Action Card */}
          <div className="max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-6 z-10 flex-1 justify-center">
            <span className="text-xs uppercase tracking-widest text-amber-flame font-mono font-semibold">
              Operational Scale
            </span>
            <h2 className="text-3xl md:text-6xl font-display font-medium text-soft-white tracking-tight leading-tight">
              Build Systems That Scale.
            </h2>
            <p className="text-neutral-400 text-sm md:text-lg max-w-xl leading-relaxed">
              Growing businesses don't need more complexity. <br className="hidden md:inline" />
              They need better systems. <br className="hidden md:inline" />
              Let's identify the biggest opportunities inside your operations.
            </p>

            <div className="relative mt-4">
              {/* Wandering circle morphs directly into this button's boundary */}
              <button
                id="step-target-15" // Anchor index mapped for step 14 final morph
                onClick={() => setIsBookModalOpen(true)}
                className="bg-imperial-blue hover:bg-brilliant-azure text-soft-white text-base font-semibold py-4 px-8 rounded-md transition-all duration-300 shadow-xl shadow-imperial-blue/20 cursor-pointer flex items-center gap-3 relative z-10"
              >
                <span>Book Discovery Call</span>
                <Calendar size={18} />
              </button>
            </div>
          </div>

          {/* COMPREHENSIVE COMPLIANT FOOTER (A3 Compliant) */}
          <footer className="max-w-7xl mx-auto w-full border-t border-neutral-800 pt-8 z-10 mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8 text-sm text-neutral-400">
              {/* Col 1: Brand details */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-imperial-blue flex items-center justify-center font-display font-bold text-xs text-soft-white">
                    F
                  </div>
                  <span className="text-base font-display font-bold text-soft-white tracking-wide">
                    FLOWGENICS
                  </span>
                </div>
                <p className="text-sm font-semibold tracking-wide font-display mt-1">
                  <span className="text-[#0889D9]">Automate.</span>{" "}
                  <span className="text-[#0889D9]">Operate.</span>{" "}
                  <span className="text-[#FFBA08]">Grow.</span>
                </p>
              </div>

              {/* Col 2: Contact details */}
              <div className="md:col-span-5 flex flex-col gap-2 md:items-end">
                <span className="text-xs font-semibold text-soft-white uppercase tracking-wider mb-1">
                  Contact
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-2 md:justify-end">
                  <Mail size={14} />
                  flowgenics1803@gmail.com
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-2 md:justify-end">
                  <Globe size={14} />
                  www.flowgenicsent.com
                </span>
              </div>
            </div>

            {/* Legal Row */}
            <div className="border-t border-neutral-900 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-neutral-500 gap-4">
              <span>&copy; {new Date().getFullYear()} Flowgenics. All rights reserved.</span>
              <div className="flex gap-4 items-center">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-soft-white transition-colors cursor-pointer"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-soft-white transition-colors cursor-pointer"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </footer>
        </section>
      </motion.main>

      {/* DISCOVERY BOOKING CALL MODAL */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 bg-onyx/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-elevated border border-neutral-200 p-6 md:p-8 max-w-md w-full relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col gap-2 mb-6">
                <span className="text-xs font-mono font-bold text-imperial-blue uppercase tracking-widest">
                  Let's Collaborate
                </span>
                <h3 className="text-xl md:text-2xl font-display font-medium text-onyx">
                  Book a Discovery Call
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Identify your core system bottlenecks and start designing automated operational pipelines.
                </p>
              </div>

              {bookSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-success mb-2">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-lg font-semibold text-onyx">Discovery Request Received</h4>
                  <p className="text-xs text-neutral-600 max-w-xs">
                    Our systems integration strategist will reach out to you within 24 business hours at your email address.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border border-neutral-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-imperial-blue text-neutral-900 bg-soft-white h-11"
                      placeholder="e.g. Alex Johnson"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border border-neutral-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-imperial-blue text-neutral-900 bg-soft-white h-11"
                      placeholder="alex@company.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Company Name</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="border border-neutral-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-imperial-blue text-neutral-900 bg-soft-white h-11"
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Brief Process Details (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="border border-neutral-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-imperial-blue text-neutral-900 bg-soft-white h-20 resize-none"
                      placeholder="What spreadsheets or workflows would you like to automate?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-imperial-blue hover:bg-brilliant-azure text-soft-white font-semibold py-3 px-6 rounded-md transition-all duration-300 text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Submit Request</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
