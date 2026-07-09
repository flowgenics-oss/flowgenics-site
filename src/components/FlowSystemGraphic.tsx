import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Node {
  id: string;
  label: string;
  description: string;
  x: number; // percentage
  y: number; // percentage
}

const NODES: Node[] = [
  { id: "input", label: "Input", description: "Operational Data ingest", x: 10, y: 50 },
  { id: "process", label: "Process", description: "Standard Workflows Map", x: 30, y: 30 },
  { id: "automation", label: "Automation", description: "Frictionless execution", x: 50, y: 70 },
  { id: "insight", label: "Insight", description: "Performance visibility", x: 70, y: 30 },
  { id: "growth", label: "Growth", description: "Scale with confidence", x: 90, y: 50 },
];

interface FlowSystemGraphicProps {
  growthNodeRef: React.RefObject<HTMLDivElement | null>;
  activeStep: number;
}

export default function FlowSystemGraphic({ growthNodeRef, activeStep }: FlowSystemGraphicProps) {
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);

  // Auto-cycle the active node highlight in the hero graphic for a subtle continuous hover-like feel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % NODES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center select-none overflow-visible">
      {/* Wave Form and Curved Connections SVG */}
      <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: "none" }}>
        <defs>
          <linearGradient id="gradient-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0A2472" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#0889D9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFBA08" stopOpacity="0.4" />
          </linearGradient>

          {/* Glowing filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* The Flow Path (Bezier Spline) */}
        <path
          d="M 50,200 C 150,50 250,350 400,200 C 500,100 650,300 750,200"
          className="stroke-[url(#gradient-flow)] fill-none stroke-[2.5]"
          style={{
            strokeDasharray: "12, 12",
            animation: "flowing-dash 40s linear infinite",
          }}
          // Approximate responsive coordinates using viewport relative SVG path on resize
          pathLength="100"
        />

        {/* Flowing animated circles traveling between nodes */}
        <motion.circle
          r="4"
          fill="#0889D9"
          filter="url(#glow)"
          animate={{
            cx: ["10%", "30%", "50%", "70%", "90%"],
            cy: ["50%", "30%", "70%", "30%", "50%"],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        
        <motion.circle
          r="3"
          fill="#FFBA08"
          filter="url(#glow)"
          animate={{
            cx: ["10%", "30%", "50%", "70%", "90%"],
            cy: ["50%", "30%", "70%", "30%", "50%"],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 4,
          }}
        />
      </svg>

      {/* Styled Nodes Overlay */}
      <div className="absolute inset-0 w-full h-full flex justify-between items-center px-[4%] md:px-[6%]">
        {NODES.map((node, idx) => {
          const isActive = activeNodeIndex === idx;
          const isGrowthNode = node.id === "growth";

          return (
            <div
              key={node.id}
              ref={isGrowthNode ? (growthNodeRef as any) : null}
              id={`node-${node.id}`}
              className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
            >
              {/* Outer Pulsing Aura */}
              <div
                className={`absolute w-12 h-12 rounded-full border transition-all duration-700 flex items-center justify-center ${
                  isActive
                    ? "border-brilliant-azure scale-125 bg-brilliant-azure/10"
                    : "border-ash-grey/30 bg-transparent"
                }`}
              >
                {/* Core Dot */}
                <motion.div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isActive ? "bg-brilliant-azure shadow-md" : "bg-neutral-600"
                  }`}
                  animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>

              {/* Node Text Content Card */}
              <div
                className={`mt-14 flex flex-col items-center text-center p-2 rounded-lg transition-all duration-500 max-w-[120px] ${
                  isActive
                    ? "bg-onyx-alpha-40 border border-neutral-700/50 scale-105"
                    : "opacity-60 scale-95"
                }`}
              >
                <span
                  className={`text-xs md:text-sm font-display font-semibold uppercase tracking-wider ${
                    isActive ? "text-soft-white" : "text-neutral-400"
                  }`}
                >
                  {node.label}
                </span>
                <span className="hidden md:block text-[10px] text-neutral-400 font-sans mt-0.5 whitespace-nowrap leading-tight">
                  {node.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom flowing dash keyframe style block inside component */}
      <style>{`
        @keyframes flowing-dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
