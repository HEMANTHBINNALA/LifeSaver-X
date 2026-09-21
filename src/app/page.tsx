"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
  Users,
  Compass,
  DollarSign,
  HelpCircle,
  Play,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  Award,
  Sun,
  Moon,
  MessageSquare
} from "lucide-react";

export default function LandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [effortHours, setEffortHours] = useState(15);
  const [hoursLeft, setHoursLeft] = useState(18);
  const [riskPercent, setRiskPercent] = useState(84);
  const [timelineIndex, setTimelineIndex] = useState(0);

  // Auto-toggle theme utility
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  };

  // Recalculate Risk on sliders change
  useEffect(() => {
    const sleepHours = Math.max(1, Math.round((hoursLeft / 24) * 8));
    const available = Math.max(1, hoursLeft - sleepHours);
    const ratio = effortHours / available;
    let score = 0;
    if (ratio >= 1.2 || (hoursLeft < 24 && effortHours > hoursLeft)) {
      score = Math.min(99, Math.round(80 + ratio * 8));
    } else if (ratio >= 0.8) {
      score = Math.min(79, Math.round(60 + ratio * 15));
    } else if (ratio >= 0.5) {
      score = Math.min(59, Math.round(35 + ratio * 20));
    } else {
      score = Math.round(ratio * 50);
    }
    setRiskPercent(score);
  }, [effortHours, hoursLeft]);

  // Simulated AI logs tick
  const logs = [
    { text: "Scanning deadline schedule & event availability...", agent: "Orchestrator" },
    { text: "Flagged 'Vercel Deployment' due in 18 hrs as Critical (84% Risk)", agent: "Risk Predictor" },
    { text: "Priority score re-calculated: Urgent priority set to 95/100", agent: "Priority Agent" },
    { text: "Recovery Plan drafted: simplified 3-milestone sequence, 3 focus hours", agent: "Recovery Agent" },
    { text: "Proposing Calendar shift: moving non-essential team sync to Friday", agent: "Scheduler Agent" },
    { text: "Digital Twin warns: Procrastination spike likely after 8:00 PM tonight", agent: "Digital Twin" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimelineIndex((prev) => (prev + 1) % logs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative min-h-screen grid-bg overflow-x-hidden ${theme === "light" ? "text-slate-900" : "text-white"}`}>
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-black/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              LifeSaver <span className="text-cyan-400">X</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium opacity-80">
            <a href="#features" className="hover:opacity-100 transition-opacity">Features</a>
            <a href="#how-it-works" className="hover:opacity-100 transition-opacity">How It Works</a>
            <a href="#agents" className="hover:opacity-100 transition-opacity">AI Agents</a>
            <a href="#pricing" className="hover:opacity-100 transition-opacity">Pricing</a>
            <a href="#faq" className="hover:opacity-100 transition-opacity">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition-all shadow-md shadow-white/10 flex items-center gap-1.5"
            >
              Enter Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Autonomous Multi-Agent operating system
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
            Never Miss <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              What Matters
            </span>{" "}
            Again.
          </h1>
          <p className="text-lg md:text-xl opacity-80 leading-relaxed max-w-lg">
            LifeSaver X predicts missed deadlines before they happen and creates intelligent action plans to keep you ahead.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              Launch Mission Control <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 font-semibold text-lg hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Watch Walkthrough
            </a>
          </div>
        </div>

        {/* Interactive AI Visualization Card */}
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden shadow-2xl border-white/10"
          >
            {/* Scanner line animation */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-transparent opacity-65 animate-scan" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs uppercase tracking-wider font-extrabold opacity-60">Live OS Simulator</span>
              </div>
              <div className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 font-mono text-cyan-400">
                ACTIVE
              </div>
            </div>

            {/* Sliders Container */}
            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="opacity-70">DEADLINE (Hours Remaining)</span>
                  <span className="text-cyan-400 font-bold">{hoursLeft} hrs</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="72"
                  value={hoursLeft}
                  onChange={(e) => setHoursLeft(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="opacity-70">WORK REQUIRED (Effort Estimate)</span>
                  <span className="text-purple-400 font-bold">{effortHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={effortHours}
                  onChange={(e) => setEffortHours(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Simulated Live Output widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Panel */}
              <div className={`p-4 rounded-xl border transition-all ${riskPercent > 75 ? "bg-red-950/20 border-red-500/30 text-red-200" : riskPercent > 50 ? "bg-orange-950/20 border-orange-500/30 text-orange-200" : "bg-cyan-950/10 border-cyan-500/20 text-cyan-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono opacity-70">FAILURE RISK</span>
                  <ShieldAlert className={`w-4 h-4 ${riskPercent > 75 ? "text-red-400" : riskPercent > 50 ? "text-orange-400" : "text-cyan-400"}`} />
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{riskPercent}%</div>
                <p className="text-[11px] opacity-75 mt-1 leading-snug">
                  {riskPercent > 75 
                    ? "Critical risk of postponement. Schedule buffer exhausted."
                    : riskPercent > 50
                    ? "Substantial schedule pressure. Mind the procrastination trigger."
                    : "Low risk. Complete tasks at current steady work rate."}
                </p>
              </div>

              {/* Dynamic Action Recommended */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <div className="flex items-center gap-1.5 text-xs font-mono opacity-70 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  RESCUE WORKFLOW
                </div>
                <div className="text-xs font-semibold leading-relaxed">
                  {riskPercent > 75 ? (
                    <span className="text-red-400">
                      ⚡ <strong>Plan activated:</strong> Trim scope, block 4-6 PM for Deep Work, override slack.
                    </span>
                  ) : (
                    <span className="text-green-400">
                      ✓ System healthy. Daily schedule remains active.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Communicating logs timeline */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-mono tracking-widest opacity-40">Agent Communication Output</span>
              <div className="h-10 mt-2 flex items-center justify-between text-xs font-mono bg-black/35 rounded-lg px-3 border border-white/5 relative overflow-hidden">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-cyan-400 font-bold shrink-0">[{logs[timelineIndex].agent}]</span>
                  <span className="opacity-80 truncate">{logs[timelineIndex].text}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 border-t border-white/5 bg-black/20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">This is NOT a reminder application.</h2>
            <p className="text-lg opacity-75">
              LifeSaver X is an autonomous AI execution and recovery system designed to proactively predict failure and step in to resolve it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:border-cyan-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Failure Prediction</h3>
              <p className="opacity-75 leading-relaxed text-sm">
                Scans deadlines, estimated effort, and available slots to predict exact percentages of missing commitments.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Recovery Engine</h3>
              <p className="opacity-75 leading-relaxed text-sm">
                When risk peaks, the recovery agent steps in: simplifying scope, blocking focus slots, and outlining a critical completion sequence.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-pink-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-950/40 border border-pink-500/30 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Digital Twin Behavior Modeling</h3>
              <p className="opacity-75 leading-relaxed text-sm">
                Learns your delay tendencies, peak focus patterns, and sleep habits to forecast delays and allocate optimized workspaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">Autonomous Recovery in Action</h2>
            <p className="text-lg opacity-75">
              How the multi-agent system keeps you from failing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 hidden lg:block -z-10" />

            {[
              { step: "01", title: "Scan & Flag", desc: "Orchestrator tracks upcoming deadlines, calendar conflicts, and estimated efforts." },
              { step: "02", title: "Decompose Goal", desc: "Agent automatically deconstructs goals into logical, milestones and deliverables." },
              { step: "03", title: "Predict Delays", desc: "Digital Twin warns if work patterns suggest postponement (e.g. 82% delay risk after 8 PM)." },
              { step: "04", title: "Generate Action Plan", desc: "Recovery Agent implements scope reduction and emergency shields to guarantee delivery." }
            ].map((stepObj, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl text-left space-y-4 border-white/5 bg-black/35 relative">
                <span className="text-3xl font-extrabold bg-gradient-to-br from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                  {stepObj.step}
                </span>
                <h3 className="text-lg font-bold">{stepObj.title}</h3>
                <p className="text-xs opacity-75 leading-relaxed">{stepObj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section id="agents" className="py-24 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">The Agent Team</h2>
            <p className="text-lg opacity-75">
              An specialized group of AI agents coordinate internally to optimize your schedule and protect your time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: "Deadline Risk Predictor", desc: "Predicts task failures based on behavior, slots, and timelines." },
              { name: "Priority Engine", desc: "Calculates live Priority Scores using urgency, effort, and goals." },
              { name: "Recovery Agent", desc: "Formulates simplified scopes and timelines under pressure." },
              { name: "Interview Copilot", desc: "Builds job study roadmaps and conducts interactive mocks." },
              { name: "Assignment Copilot", desc: "Extracts milestones and requirements from PDFs and images." },
              { name: "Exam Rescue Agent", desc: "Identifies knowledge gaps and constructs revision plans." },
              { name: "Focus Coach", desc: "Detects procrastination habits and starts custom focus shields." },
              { name: "Goal Planner", desc: "Converts high-level outcomes into tracked subtasks." }
            ].map((agent, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border-white/5 bg-black/40 hover:border-cyan-500/20 transition-all text-left">
                <div className="text-xs font-mono font-bold text-cyan-400 mb-2">AGENT 0{i + 1}</div>
                <h4 className="font-bold text-sm mb-1">{agent.name}</h4>
                <p className="text-[11px] opacity-70 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">Trusted by High-Performers</h2>
            <p className="text-lg opacity-75">
              How LifeSaver X saved founders, graduates, and professionals from missing critical targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "I was on the verge of failing my final year engineering project. LifeSaver X ran a rescue plan, chopped the scope, and literally scheduled my day. I submitted with 3 hours to spare.", author: "Aditya K., CS Graduate" },
              { quote: "Typical task managers send standard notifications that I ignore. LifeSaver X predicted I had a 91% risk of missing a client proposal and forced me into focus blocks. Pitch won.", author: "Elena R., Seed Founder" },
              { quote: "The Next.js Interview Copilot is insane. Built a custom study plan, quizzes, and mock session. Passed the tech test and joined Stripe.", author: "Siddharth T., Software Engineer" }
            ].map((test, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5 text-left flex flex-col justify-between">
                <p className="italic text-sm opacity-80 leading-relaxed">"{test.quote}"</p>
                <span className="block mt-6 text-xs font-bold text-cyan-400 font-mono">— {test.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Productivity Stats Section */}
      <section className="py-24 border-t border-white/5 bg-black/25">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h2 className="text-4xl font-extrabold tracking-tight">Designed to Defy Procrastination</h2>
            <p className="opacity-80 leading-relaxed">
              Standard reminder applications only notify. Research shows that proactive AI scoping and schedule blocking reduces task abandonment by over 60%.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-3xl font-extrabold">91%</div>
                <div className="text-xs opacity-70">Task Completion Rate</div>
              </div>
              <div className="border-l-2 border-purple-500 pl-4">
                <div className="text-3xl font-extrabold">4.2x</div>
                <div className="text-xs opacity-70">Reduction in Late Deliveries</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/10 bg-black/35 flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono tracking-wider opacity-60">Completion Success Rates</span>
              </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 pt-6">
              {[
                { label: "Reminders Only", val: "h-24", color: "bg-red-500/40", rate: "38%" },
                { label: "Calendar Block", val: "h-36", color: "bg-orange-500/50", rate: "54%" },
                { label: "LifeSaver X System", val: "h-48", color: "bg-gradient-to-t from-cyan-500 to-purple-600", rate: "91%" }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-full ${bar.val} ${bar.color} rounded-t-lg relative flex items-end justify-center pb-2`}>
                    <span className="text-xs font-bold text-white">{bar.rate}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 text-center">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">Flexible SaaS Subscriptions</h2>
            <p className="text-lg opacity-75">
              Choose the level of autonomy your productivity demands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Free Trial", price: "$0", desc: "Basic single task planning and deadline risk metrics.", features: ["3 Active Tasks", "Manual Risk checks", "Standard templates", "Web dashboard access"] },
              { title: "Pro Engine", price: "$19", desc: "Full access to specialized study and business agents.", features: ["Unlimited Tasks", "Auto Risk alerts", "Interview & Assignment copilots", "Calendar Rescheduling", "Basic Digital Twin stats"], highlight: true },
              { title: "Autonomous Core", price: "$49", desc: "Maximum executive authority with continuous rescue planning.", features: ["Everything in Pro", "Advanced multi-agent orchestrator", "Complete Digital Twin projections", "Active Voice Floating Copilot", "Aggressive emergency shields"] }
            ].map((tier, i) => (
              <div key={i} className={`glass-panel p-8 rounded-2xl text-left flex flex-col justify-between relative ${tier.highlight ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10 bg-cyan-950/10" : "border-white/5 bg-black/40"}`}>
                {tier.highlight && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-cyan-500 text-[10px] font-extrabold text-black tracking-wider uppercase">
                    RECOMMENDED
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold">{tier.price}</span>
                    <span className="text-xs opacity-60">/ month</span>
                  </div>
                  <p className="text-xs opacity-75 mb-6">{tier.desc}</p>
                  <ul className="space-y-3 mb-8 border-t border-white/5 pt-6">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="text-xs opacity-85 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className={`w-full py-3 rounded-xl font-bold text-center text-sm transition-all ${tier.highlight ? "bg-white text-black hover:bg-white/90" : "border border-white/10 hover:bg-white/5"}`}
                >
                  Start Saving Deadlines
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-white/5 bg-black/25">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">Frequently Answered Questions</h2>
            <p className="text-lg opacity-75">Everything you need to know about the LifeSaver X OS.</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "How does the Deadline Risk Predictor calculate risk percentages?", a: "The predictor scans your target deadline date, calculates sleep and calendar sync commitments, subtracts available slot times, and contrasts this with the estimated effort hours. Our proprietary formula factors in procrastination patterns mapped by your Digital Twin." },
              { q: "Is a document upload supported by the Assignment Copilot?", a: "Yes. You can paste assignment syllabi or text guidelines. The AI extracts deliverables, suggests milestones, and automatically creates task entries with deadlines." },
              { q: "Does the voice assistant work in other languages?", a: "Yes, our voice floating copilot is built to handle queries and reply back in English, Hindi, and Telugu natively, using simple client voice recognition triggers." }
            ].map((faq, i) => (
              <div key={i} className="glass-panel p-6 rounded-xl border-white/5 bg-black/40 text-left space-y-2">
                <h4 className="font-bold text-base flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  {faq.q}
                </h4>
                <p className="text-sm opacity-75 pl-7 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
              ⚡
            </div>
            <span className="font-bold text-sm tracking-tight">LifeSaver X</span>
          </div>
          <span className="text-xs opacity-50">&copy; 2026 LifeSaver X Systems. All rights reserved. Built for Vibe2Ship.</span>
          <div className="flex items-center gap-4 text-xs opacity-70">
            <a href="#" className="hover:opacity-100">Privacy Policy</a>
            <a href="#" className="hover:opacity-100">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
