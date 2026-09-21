"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  Brain,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  MessageSquare,
  Volume2,
  FileText,
  UserCheck,
  TrendingUp,
  Award,
  ChevronRight,
  Send,
  Zap,
  Briefcase,
  Upload,
  BookOpen,
  Search,
  Inbox,
  Layers,
  Settings,
  Mic,
  MicOff,
  Video,
  History,
  Shield,
  Maximize2,
  Moon,
  Sun,
  User,
  Coffee,
  Check,
  X,
  Lock,
  GraduationCap,
  DollarSign,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";
import {
  AppState,
  Task,
  CalendarEvent,
  AgentLog,
  DocumentItem,
  EmailItem,
  MeetingItem,
  JournalEvent,
  getInitialState,
  getDemoData,
  loadPersistedState,
  savePersistedState,
  resetUserState,
  refreshComputedState
} from "@/lib/state/store";
import {
  analyzeDeadlineRiskAction,
  generateRecoveryPlanAction,
  generateInterviewRoadmapAction,
  parseAssignmentDocumentAction,
  voiceCommandAction,
  decomposeTaskAction,
  optimizeWeekAction,
  recordMeetingAction,
  searchMemoryAction
} from "../actions";
import {
  evaluateFailureRisk,
  evaluateTaskPriority,
  generateRecoveryPlan,
  detectPlanFailure,
  executeAutoReplan,
  calculateLifeScore,
  generateDailyBriefing,
  calculatePriorityScore
} from "@/lib/agents/orchestrator";
import OnboardingCompanion from "./OnboardingCompanion";

// Definition for visual pipeline steps
const PIPELINE_STEPS = [
  { id: "trigger", label: "User Trigger", desc: "Voice or Document event detected" },
  { id: "voice", label: "Voice/Scan Agent", desc: "Speech parsed & files analyzed" },
  { id: "orchestrate", label: "Orchestrator", desc: "Internally routes goal requests" },
  { id: "priority", label: "Priority Engine", desc: "Calculates live priority index" },
  { id: "scheduler", label: "Scheduler", desc: "Maps and blocks calendar slots" },
  { id: "recovery", label: "Recovery Agent", desc: "Prunes scope & drafts rescues" },
  { id: "outcome", label: "Cockpit UI", desc: "Gauges & schedules updated" }
];

export default function Dashboard() {
  const [state, setState] = useState<AppState>(getInitialState());
  const [activeTab, setActiveTab] = useState<
    "mission-control" | "copilots" | "agents" | "twin" | "calendar" | "documents" | "emails" | "timeline" | "recovery" | "memory" | "analytics" | "journey"
  >("mission-control");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [explainTopic, setExplainTopic] = useState<string | null>(null);
  const [triggerJudgeTour, setTriggerJudgeTour] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const playSynthSound = (type: "startup" | "success" | "emergency" | "click" | "complete") => {
    if (soundMuted || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, duration: number, delay = 0, waveType: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === "startup") {
        playTone(330, 0.4, 0); // E4
        playTone(440, 0.4, 0.1); // A4
        playTone(554, 0.6, 0.2); // C#5
      } else if (type === "success" || type === "complete") {
        playTone(523.25, 0.3, 0); // C5
        playTone(659.25, 0.4, 0.08); // E5
        playTone(783.99, 0.5, 0.16); // G5
      } else if (type === "emergency") {
        playTone(220, 0.3, 0, "sawtooth"); // A3
        playTone(220, 0.3, 0.2, "sawtooth"); // A3
      } else if (type === "click") {
        playTone(600, 0.05, 0);
      }
    } catch (e) {
      console.warn("AudioContext synthesis failed: ", e);
    }
  };
  
  // Custom theme toggle
  const [darkTheme, setDarkTheme] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleToggleTheme = () => {
    setDarkTheme(!darkTheme);
    if (darkTheme) {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  };

  // Pomodoro timer state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Meeting Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingData, setRecordingData] = useState<any>(null);

  // Command Palette (Ctrl+K) states
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  // Search Memory input
  const [memorySearch, setMemorySearch] = useState("");
  const [filteredMemory, setFilteredMemory] = useState<any[]>([]);

  const [lifeScoreExplainOpen, setLifeScoreExplainOpen] = useState(false);
  const [documentaryOpen, setDocumentaryOpen] = useState(false);
  const [documentaryStep, setDocumentaryStep] = useState(0);
  const [briefingMode, setBriefingMode] = useState<"morning" | "evening">("morning");

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs >= 17 || hrs < 5) {
      setBriefingMode("evening");
    } else {
      setBriefingMode("morning");
    }
  }, []);

  const triggerLocalConfetti = () => {
    const canvas = document.getElementById("local-confetti-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#fbbf24", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
    const particles: any[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 15;
        if (p.y < canvas.height) active = true;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      if (active) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
  };

  const handleStartDocumentary = () => {
    setDocumentaryOpen(true);
    setDocumentaryStep(0);
    playSynthSound("startup");
    speakDocumentarySlide(0);
  };

  const speakDocumentarySlide = (slideIdx: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    let text = "";
    if (slideIdx === 0) {
      text = "Starting AI Documentary. Welcome to the personal journey of engineering student Rahul. His initial state logged a stress index of 92 percent.";
    } else if (slideIdx === 1) {
      text = "Phase one. Smart Document Copilot parses his compiler lab syllabus, extracting milestones and creating action targets.";
    } else if (slideIdx === 2) {
      text = "Phase two. Real time risk evaluations detect critical overlaps. Recovery agents block focus sessions and lock cockpit shields.";
    } else if (slideIdx === 3) {
      text = "Phase three. The schedule optimizer reallocates conflicting advisor meetings, preserving high impact compiler milestones.";
    } else if (slideIdx === 4) {
      text = "Phase four. Career focus: mock interview prep templates are synced. Stress drops, and digital twin calibrations succeed.";
    } else if (slideIdx === 5) {
      text = "Graduation complete! Certified perfect score achieved. Congratulations! The AI Operating System successfully prevented failure.";
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Guided Tour 60s Demo script state
  const [demoStep, setDemoStep] = useState<number>(-1);
  const [demoTimeLeft, setDemoTimeLeft] = useState<number>(60);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Floating Voice Assistant states
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [voiceLogs, setVoiceLogs] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "LifeSaver X Operating System vocal core initialized. Ask me to: 'Plan my week', 'Load Student Crisis', 'Start Pomodoro', or 'Check my emails'." }
  ]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voicePlaybackTrack, setVoicePlaybackTrack] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");

  // State for document center interaction
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  // Countdown timer for Emergency Mode
  const [emergencyCountdown, setEmergencyCountdown] = useState("17:59:58");

  // Phase 6: Copilot Hub UI filters & interaction states
  const [copilotsFilter, setCopilotsFilter] = useState<"all" | "active" | "online" | "collaborating">("all");
  const [copilotsSearch, setCopilotsSearch] = useState("");
  
  // Student Copilot states
  const [studentTaskTitle, setStudentTaskTitle] = useState("");
  const [studentTaskEffort, setStudentTaskEffort] = useState(6);
  const [studentSelectedTopic, setStudentSelectedTopic] = useState("React 19");
  
  // Professional Copilot states
  const [professionalMeetingTopic, setProfessionalMeetingTopic] = useState("Q3 Product Sync");
  const [professionalAgendaList, setProfessionalAgendaList] = useState<string[]>([]);
  
  // Entrepreneur Copilot states
  const [entrepreneurGoalInput, setEntrepreneurGoalInput] = useState("Launch Beta Product");
  const [entrepreneurOKRs, setEntrepreneurOKRs] = useState<Array<{ objective: string; kr: string[] }>>([]);
  
  // Health Copilot states
  const [mindfulnessSecondsLeft, setMindfulnessSecondsLeft] = useState(120);
  const [isMindfulnessActive, setIsMindfulnessActive] = useState(false);
  const mindfulnessTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smart Document Copilot states
  const [smartDocInputText, setSmartDocInputText] = useState("");
  
  // Life Coach Copilot states
  const [dailyReflectionInput, setDailyReflectionInput] = useState("");

  // Global CPU/Brain live ticker
  const [brainLoad, setBrainLoad] = useState(32);
  const [brainThoughts, setBrainThoughts] = useState("Monitoring local workspace logs...");

  // Form states for creating manual tasks
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEffort, setNewTaskEffort] = useState(8);
  const [newTaskDeadlineHours, setNewTaskDeadlineHours] = useState(24);

  // Phase 5: Thinking Engine States
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [thinkingStagesLogs, setThinkingStagesLogs] = useState<string[]>([]);

  // Phase 5: Visual Pipeline States
  const [pipelineActiveNode, setPipelineActiveNode] = useState<number>(-1);
  const [pipelineElapsed, setPipelineElapsed] = useState<string>("0.0s");

  // Phase 5: Live Ops Stream logger state
  const [opsFilterAgent, setOpsFilterAgent] = useState<string>("all");
  const [opsList, setOpsList] = useState<Array<{ id: string; time: string; agent: string; action: string; type: "info" | "warning" | "success" | "critical" }>>([
    { id: "o-1", time: "21:02:13", agent: "🎤 Voice Agent", action: "Listening for triggers...", type: "info" },
    { id: "o-2", time: "21:02:14", agent: "🧠 Orchestrator", action: "Analyzing calendar slots & backlog risk scores.", type: "info" },
    { id: "o-3", time: "21:02:15", agent: "📅 Scheduler", action: "Conflict alert triggered regarding presentation overlaps.", type: "warning" }
  ]);

  const filteredOpsList = opsFilterAgent === "all"
    ? opsList
    : opsList.filter((ops) => ops.agent.toLowerCase().includes(opsFilterAgent.toLowerCase()));

  // Phase 5: AI Replay Cinematic Modal State
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [replayStep, setReplayStep] = useState(-1);
  const [replayNarrativeText, setReplayNarrativeText] = useState("");

  // Real Document ingestion confirmation state
  const [docConfirmOpen, setDocConfirmOpen] = useState(false);
  const [pendingExtractedTasks, setPendingExtractedTasks] = useState<Task[]>([]);
  const [pendingDocName, setPendingDocName] = useState("");

  // Web Speech API recognition state
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Load persisted user state safely on mount (or initial state)
  useEffect(() => {
    setMounted(true);
    const persisted = loadPersistedState();
    setState(persisted);
    setFilteredMemory(persisted.memoryLogs);
    if (persisted.tasks.length > 0) {
      setSelectedTaskId(persisted.tasks[0].id);
    }
    if (persisted.documents.length > 0) {
      setSelectedDocId(persisted.documents[0].id);
    }
    playSynthSound("startup");
  }, []);

  // Save persisted state safely on changes ONLY for real user data
  useEffect(() => {
    if (mounted && !state.isDemoMode) {
      savePersistedState(state);
    }
  }, [state, mounted]);

  // Listen for Ctrl+K command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // CPU and thoughts ticker simulator + Global AI Operating Layer runtime
  useEffect(() => {
    const thoughts = [
      "Analyzing available calendar slots...",
      "Predicting delay probabilities...",
      "Syncing Gmail inbox notifications...",
      "Recalculating task priority vectors...",
      "Evaluating stress & burnout risk charts...",
      "Orchestrating agent workflows...",
      "Awaiting user voice instructions..."
    ];
    const liveOpsTemplates = [
      { agent: "🧬 Digital Twin", action: "Updated behavioral performance parameters. Completed tasks model synced.", type: "success" as const },
      { agent: "🎯 Priority Agent", action: "Recalculated workspace task vectors. Score shifts applied.", type: "info" as const },
      { agent: "🧠 Orchestrator", action: "System health check complete. Overall stress load within margins.", type: "info" as const },
      { agent: "📅 Scheduler", action: "Optimized week timeline indexes. Focus window cleared.", type: "success" as const },
      { agent: "📄 Assignment Agent", action: "Checking local document changes. Scanned pdf structures.", type: "info" as const },
      { agent: "💼 Interview Agent", action: "Updating concurrent mock preparation files.", type: "info" as const }
    ];

    const interval = setInterval(() => {
      setBrainLoad(Math.round(20 + Math.random() * 45));
      const idx = Math.floor(Math.random() * thoughts.length);
      setBrainThoughts(thoughts[idx]);

      // Global AI Operating Layer: background updates of live ops stream
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const opsIdx = Math.floor(Math.random() * liveOpsTemplates.length);
      const chosenOps = liveOpsTemplates[opsIdx];
      
      setOpsList((prev) => [
        {
          id: `ops-${Date.now()}`,
          time: timeStr,
          agent: chosenOps.agent,
          action: chosenOps.action,
          type: chosenOps.type
        },
        ...prev
      ].slice(0, 40));

      // Global AI Operating Layer: shift LifeScore slightly to feel alive
      setState((prev) => {
        if (prev.demoProfile === "none") return prev;
        const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        if (delta === 0) return prev;
        const newScore = Math.max(10, Math.min(99, prev.lifeScore + delta));
        
        const changeLog = {
          val: newScore,
          reason: delta > 0 ? "Workspace focus session efficiency aligned." : "Minor sleep cycle variance forecast adjusted.",
          timestamp: new Date().toISOString()
        };

        return {
          ...prev,
          lifeScore: newScore,
          scoreHistory: [changeLog, ...prev.scoreHistory].slice(0, 15)
        };
      });

    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Update Pomodoro Clock
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            addLog("Focus Coach", "Completed Pomodoro focus session. Triggering 5-minute break.", "done");
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Update Emergency Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(target.getHours() + 17);
      target.setMinutes(target.getMinutes() + 42);
      
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        const pad = (num: number) => String(num).padStart(2, "0");
        setEmergencyCountdown(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Meeting recording clock
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Mindfulness timer clock
  useEffect(() => {
    if (isMindfulnessActive) {
      mindfulnessTimerRef.current = setInterval(() => {
        setMindfulnessSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsMindfulnessActive(false);
            if (mindfulnessTimerRef.current) clearInterval(mindfulnessTimerRef.current);
            addLog("Health & Wellbeing Copilot", "Mindfulness breathing session completed. Stress indicators aligned.", "completed");
            setState((prevVal) => ({
              ...prevVal,
              twin: {
                ...prevVal.twin,
                stress: Math.max(15, prevVal.twin.stress - 20)
              }
            }));
            return 120;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (mindfulnessTimerRef.current) clearInterval(mindfulnessTimerRef.current);
    }
    return () => {
      if (mindfulnessTimerRef.current) clearInterval(mindfulnessTimerRef.current);
    };
  }, [isMindfulnessActive]);

  const addLog = (agentName: string, action: string, status: AgentLog["status"]) => {
    const newLog: AgentLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      agentName,
      action,
      timestamp: new Date().toISOString(),
      status
    };
    setState((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 30)
    }));
  };

  // Phase 5: Thinking Engine Solver Simulator
  const triggerThinkingSession = async (stages: string[], finalAction: () => Promise<void>) => {
    setIsThinking(true);
    setThinkingStagesLogs([]);
    
    for (let i = 0; i < stages.length; i++) {
      setThinkingStage(i);
      setThinkingStagesLogs((prev) => [...prev, stages[i]]);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
    
    // Run pipeline animation concurrently or after
    await triggerPipelineAnimation();
    
    await finalAction();
    setIsThinking(false);
  };

  // Phase 5: Pipeline Connection Animation Ticker
  const triggerPipelineAnimation = async () => {
    setPipelineActiveNode(0);
    setPipelineElapsed("0.0s");
    
    const startTime = Date.now();
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setPipelineActiveNode(i);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
      setPipelineElapsed(elapsed);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setPipelineElapsed(((Date.now() - startTime) / 1000).toFixed(1) + "s");
  };

  const handleLoadDemo = (profile: "student" | "professional" | "entrepreneur") => {
    const demo = getDemoData(profile);
    setState(demo);
    setFilteredMemory(demo.memoryLogs);
    if (demo.tasks.length > 0) {
      setSelectedTaskId(demo.tasks[0].id);
    }
    if (demo.documents.length > 0) {
      setSelectedDocId(demo.documents[0].id);
    }
    addLog("Orchestrator", `Loaded ${profile.toUpperCase()} Crisis Demo Scenario. Dynamic assets updated.`, "done");

    if (demo.emergencyMode) {
      playSynthSound("emergency");
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("This situation is recoverable. Let's focus on the highest impact work first. I will guide you step by step.");
        utterance.rate = 0.95;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      playSynthSound("startup");
    }
  };

  // Reschedule calendar via Server Action + Thinking Engine
  const handleOptimizeMyWeek = async () => {
    const stages = [
      "Understanding optimization request",
      "Analyzing active calendar events backlog",
      "Consulting Digital Twin peak efficiency hours",
      "Running Agent Collaboration (Scheduler & Orchestrator)",
      "Generating optimal slot reallocation maps",
      "Applying focus buffer blocks",
      "Finalizing schedule updates"
    ];

    await triggerThinkingSession(stages, async () => {
      addLog("Scheduler Agent", "Starting AI scheduling optimization solver...", "thinking");
      const result = await optimizeWeekAction(state.events, state.tasks);
      
      // Update LifeScore shifts
      const prevScore = state.lifeScore;
      const targetScore = Math.min(99, prevScore + 16);

      setState((prev) => ({
        ...prev,
        events: result.optimizedEvents,
        tasks: result.updatedTasks,
        emergencyMode: false,
        lifeScore: targetScore,
        scoreHistory: [
          { val: targetScore, reason: "Executed Optimize My Week. Shifts resolved 1 slot overlap.", timestamp: new Date().toISOString() },
          ...prev.scoreHistory
        ],
        productivityScore: Math.min(100, prev.productivityScore + 12),
        focusScore: Math.min(100, prev.focusScore + 8)
      }));

      addLog("Scheduler Agent", `Optimization complete! Rescheduled overlaps: ${result.focusBlocksAdded.length} focus blocks established.`, "done");
      
      // Update execution logs
      setState((prev) => ({
        ...prev,
        replayLogs: [
          {
            id: `rep-${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agent: "Scheduler Agent",
            action: "Executed 'Optimize My Week' conflict resolution.",
            impact: "Moved internal review slots out by 4.5 hours. Task Risk reduced to Yellow."
          },
          ...prev.replayLogs
        ]
      }));
    });
  };

  // Create task manually with full deterministic calculations + Thinking
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const stages = [
      "Registering task guidelines",
      "Running predictive failure check",
      "Consulting Twin delay indexes",
      "Computing priority scores",
      "Decomposing milestones path"
    ];

    await triggerThinkingSession(stages, async () => {
      addLog("Orchestrator", `Registering task "${newTaskTitle}"...`, "thinking");
      
      const now = new Date();
      const deadlineDate = new Date(now.getTime() + newTaskDeadlineHours * 60 * 60 * 1000);
      const estMinutes = newTaskEffort * 60;

      const taskCandidate: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        deadline: deadlineDate.toISOString(),
        estimated_minutes: estMinutes,
        estimatedEffort: newTaskEffort,
        status: "todo",
        priority: "medium",
        category: state.demoProfile === "none" ? "general" : state.demoProfile,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        progress: 0,
        source: "user"
      };

      const taskPriority = evaluateTaskPriority(taskCandidate, [...state.tasks, taskCandidate]);
      const candidateRisk = evaluateFailureRisk([taskCandidate]);

      let recoveryPlan = undefined;
      if (candidateRisk.riskScore > 70) {
        addLog("Recovery Agent", "Task risk is critical. Generating recovery checklist...", "thinking");
        recoveryPlan = generateRecoveryPlan([taskCandidate, ...state.tasks], 8, now);
      }

      const newTask: Task = {
        ...taskCandidate,
        priority: taskPriority.calculatedPriority,
        priorityScore: taskPriority.priorityScore,
        riskScore: candidateRisk.riskScore,
        riskLevel: candidateRisk.riskLevel,
        riskReason: candidateRisk.riskReasons[0] || "Standard backlog goal.",
        recoveryPlan,
        explainability: {
          why: `Task requires ${newTaskEffort} hours within a ${newTaskDeadlineHours}-hour deadline window.`,
          evidence: `Mathematical risk evaluated at ${candidateRisk.riskScore}% by Priority Engine.`,
          confidence: 95,
          alternatives: "Adjust estimated effort limit or run calendar rescheduling.",
          outcome: `Assigned priority: ${taskPriority.calculatedPriority.toUpperCase()} (Score: ${taskPriority.priorityScore}/100).`
        }
      };

      const updatedTasks = [...state.tasks, newTask];
      let nextState = refreshComputedState({
        ...state,
        tasks: updatedTasks
      });

      // If risk is high, auto-generate initial Plan 1 if not present
      if (nextState.emergencyMode && !nextState.activePlan) {
        nextState.activePlan = generateRecoveryPlan(updatedTasks, 8, now);
      }

      setState(nextState);
      setSelectedTaskId(newTask.id);
      setNewTaskTitle("");
      addLog("Orchestrator", `Successfully scheduled "${newTaskTitle}" with priority score of ${taskPriority.priorityScore}/100.`, "done");
    });
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = state.tasks.find((t) => t.id === id);
    playSynthSound("complete");

    const remainingTasks = state.tasks.filter((t) => t.id !== id);
    const scoreGain = 6;
    const newLifeScore = Math.min(99, state.lifeScore + scoreGain);
    
    const changeLog = {
      val: newLifeScore,
      reason: taskToDelete ? `Successfully completed task: "${taskToDelete.title}".` : "Task completed.",
      timestamp: new Date().toISOString()
    };

    const nextState = refreshComputedState({
      ...state,
      tasks: remainingTasks,
      scoreHistory: [changeLog, ...state.scoreHistory].slice(0, 15),
      productivityScore: Math.min(100, state.productivityScore + 5)
    });

    setState(nextState);
    if (selectedTaskId === id) setSelectedTaskId(null);

    // Speak announcement if window.speechSynthesis is available
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const sentence = taskToDelete 
        ? `Excellent work! You completed: ${taskToDelete.title}. Deadline risk is reduced, and your Life Score has increased.`
        : "Task completed. Well done!";
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 1.05;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Phase 4: Interactive Progress Deviation & Deterministic Auto-Replanning
  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    const updatedTasks = state.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            progress: newProgress,
            status: newProgress >= 100 ? ("completed" as const) : ("in_progress" as const)
          }
        : t
    );

    let nextState = refreshComputedState({
      ...state,
      tasks: updatedTasks
    });

    // Check if an active plan exists and evaluate progress deviation
    if (state.activePlan) {
      const failureCheck = detectPlanFailure(state.activePlan, updatedTasks, 120);

      if (failureCheck.isFailed) {
        // Trigger auto-replanning (Plan 1 -> Plan 2)
        const replan = executeAutoReplan(state.activePlan, updatedTasks, 60);
        
        const journalEntry: JournalEvent = {
          id: `journal-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: "Failure Detected",
          title: "Plan 1 Failure & Auto-Replan to Plan 2",
          content: `${failureCheck.failureReason} ${replan.diffSummary}`
        };

        nextState = {
          ...nextState,
          previousPlan: replan.previousPlan,
          activePlan: replan.newPlan,
          lastFailureAssessment: failureCheck,
          replanningHistory: [replan, ...(nextState.replanningHistory || [])],
          memoryLogs: [journalEntry, ...nextState.memoryLogs]
        };

        addLog("Recovery Agent", `Plan 1 failed due to progress deviation (${Math.round(failureCheck.deviation * 100)}%). Formulated Plan 2.`, "done");
        playSynthSound("emergency");
      }
    }

    setState(nextState);
  };

  // Phase 4 & Demo: Simulate Progress Delay (+45m)
  const handleSimulateDelay = () => {
    let currentPlan = state.activePlan;
    if (!currentPlan && state.tasks.length > 0) {
      currentPlan = generateRecoveryPlan(state.tasks, 6);
    }
    if (!currentPlan) return;

    // Simulate progress delay on the primary critical task
    const criticalTask = state.tasks.find((t) => t.priority === "critical") || state.tasks[0];
    if (!criticalTask) return;

    const modifiedTasks = state.tasks.map((t) =>
      t.id === criticalTask.id ? { ...t, progress: 25 } : t
    );

    const failureCheck = detectPlanFailure(currentPlan, modifiedTasks, 180);
    const replan = executeAutoReplan(currentPlan, modifiedTasks, 75);

    const journalEntry: JournalEvent = {
      id: `journal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: "Risk Warning",
      title: "Simulated Delay (+45m) Triggered Replanning",
      content: `Progress delay created 45m deficit (Expected: 60% vs Actual: 25%). Plan 1 invalidated; Plan 2 generated. ${replan.diffSummary}`
    };

    const nextState = refreshComputedState({
      ...state,
      tasks: modifiedTasks,
      previousPlan: replan.previousPlan,
      activePlan: replan.newPlan,
      lastFailureAssessment: failureCheck,
      replanningHistory: [replan, ...(state.replanningHistory || [])],
      memoryLogs: [journalEntry, ...state.memoryLogs]
    });

    setState(nextState);
    addLog("Failure Detector", "Simulated delay triggered Plan 1 failure check. Plan 2 formulated.", "done");
    playSynthSound("emergency");
  };

  // Reset Demo to Real User Workspace
  const handleResetToRealData = () => {
    const realState = loadPersistedState();
    setState(realState);
    setFilteredMemory(realState.memoryLogs);
    addLog("Orchestrator", "Reset workspace to Real User Data.", "done");
    playSynthSound("startup");
  };

  // Phase 6: Real Document File Ingestion with Confirmation Modal
  const handleFileUpload = async (file: File) => {
    const fileName = file.name;
    setPendingDocName(fileName);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textContent = (e.target?.result as string) || "";
      addLog("Assignment Agent", `Reading document: ${fileName} (${Math.round(file.size / 1024)} KB)...`, "thinking");

      const res = await parseAssignmentDocumentAction(textContent.slice(0, 4000) || fileName);
      const now = new Date();

      const extracted: Task[] = (res.milestones || []).map((m: any, idx: number) => {
        const estMinutes = (m.suggestedHours || 3) * 60;
        const deadline = new Date(now.getTime() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString();
        return {
          id: `task-doc-${Date.now()}-${idx}`,
          title: m.name || m.title || `Deliverable ${idx + 1}`,
          deadline,
          estimated_minutes: estMinutes,
          estimatedEffort: Math.round(estMinutes / 60),
          status: "todo",
          priority: idx === 0 ? "high" : "medium",
          priorityScore: idx === 0 ? 80 : 60,
          riskScore: idx === 0 ? 65 : 35,
          riskLevel: idx === 0 ? "yellow" : "green",
          riskReason: "Extracted from syllabus document.",
          category: state.demoProfile === "none" ? "general" : state.demoProfile,
          source: "document"
        };
      });

      if (extracted.length === 0) {
        extracted.push({
          id: `task-doc-${Date.now()}-0`,
          title: `Study & Submit: ${fileName}`,
          deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          estimated_minutes: 4 * 60,
          estimatedEffort: 4,
          status: "todo",
          priority: "high",
          priorityScore: 75,
          riskScore: 50,
          riskLevel: "yellow",
          riskReason: "Parsed from document upload.",
          category: "general",
          source: "document"
        });
      }

      setPendingExtractedTasks(extracted);
      setDocConfirmOpen(true);
      addLog("Assignment Agent", `Extracted ${extracted.length} deliverables from ${fileName}. Waiting for confirmation.`, "done");
    };

    reader.readAsText(file);
  };

  const handleConfirmDocTasks = () => {
    const newTasks = [...state.tasks, ...pendingExtractedTasks];
    const nextState = refreshComputedState({
      ...state,
      tasks: newTasks,
      documents: [
        {
          id: `doc-${Date.now()}`,
          name: pendingDocName,
          type: "PDF/DOC",
          size: "1.2 MB",
          uploadDate: "Today, Just Now",
          summary: `Parsed ${pendingExtractedTasks.length} action milestones from ${pendingDocName}.`,
          deadlines: pendingExtractedTasks.map((t) => `${t.title} (Due in 24h)`),
          tasks: pendingExtractedTasks.map((t) => t.title),
          quizzes: [
            {
              question: `What is the primary deliverable for ${pendingDocName}?`,
              options: [pendingExtractedTasks[0]?.title || "Project Report", "Optional Reading", "Attendance Sync", "None"],
              answer: pendingExtractedTasks[0]?.title || "Project Report",
              explanation: "Identified as the highest priority extracted task."
            }
          ],
          flashcards: [
            { front: pendingDocName, back: `Key focus: ${pendingExtractedTasks[0]?.title || 'Main objective'}` }
          ],
          suggestedPriorities: pendingExtractedTasks.map((t) => t.title)
        },
        ...state.documents
      ]
    });

    setState(nextState);
    setDocConfirmOpen(false);
    setPendingExtractedTasks([]);
    addLog("Orchestrator", `Confirmed and added ${pendingExtractedTasks.length} tasks to active schedule.`, "done");
    playSynthSound("success");
  };

  // Phase 5: Real Web Speech API Recognition
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setVoiceLogs((prev) => [
        ...prev,
        { sender: "ai", text: "Web Speech API is not supported in this browser. Please type your command below." }
      ]);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsVoiceListening(true);
        addLog("Voice Agent", "Listening to microphone...", "running");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsVoiceListening(false);
        handleVoiceSubmit(undefined, transcript);
      };

      recognition.onerror = (event: any) => {
        setIsVoiceListening(false);
        console.warn("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsVoiceListening(false);
      setSpeechSupported(false);
    }
  };

  // Simulated Document upload + Thinking
  const handleSelectMockDoc = (docId: string) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    triggerThinkingSession([
      "Parsing document format",
      "Extracting critical tasks & deadlines",
      "Evaluating key syllabus guidelines",
      "Compiling study flashcards & practice questions"
    ], async () => {
      setSelectedDocId(docId);
      setSelectedQuizIdx(0);
      setQuizAnswers({});
      addLog("Assignment Agent", `Processed ${doc.name}. Flashcards generated.`, "done");
    });
  };

  const handleQuizAnswer = (quizIdx: number, selectedOption: string, doc: DocumentItem) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [quizIdx]: selectedOption
    }));

    addLog("Study Coach", `Logged answer for quiz question ${quizIdx + 1}.`, "done");
  };

  // Gmail actions + Thinking
  const handleEmailAction = (emailId: string, actionType: "schedule" | "prune" | "ignore") => {
    triggerThinkingSession([
      "Analyzing email content guidelines",
      "Mapping task vectors",
      "Executing schedule blocking"
    ], async () => {
      setState((prev) => {
        const updatedEmails = prev.emails.map((em) => {
          if (em.id === emailId) {
            return {
              ...em,
              processed: true,
              actionTaken: actionType === "schedule" ? "Calendar focus block booked." : "Pruned presentation templates."
            };
          }
          return em;
        });

        // Trigger action outcomes
        if (actionType === "schedule") {
          addLog("Scheduler Agent", "Scheduled technical interview study block for tomorrow 2:00 PM.", "done");
        } else if (actionType === "prune") {
          addLog("Recovery Agent", "Pruned slide decks scope requirement checklist.", "done");
        }

        return {
          ...prev,
          emails: updatedEmails
        };
      });
    });
  };

  // Memory Search handler
  const handleMemorySearchChange = async (val: string) => {
    setMemorySearch(val);
    if (!val.trim()) {
      setFilteredMemory(state.memoryLogs);
      return;
    }
    const res = await searchMemoryAction(val, state.memoryLogs);
    setFilteredMemory(res.results);
  };

  // Voice submit handler + Thinking
  const handleVoiceSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || voiceQuery;
    if (!query.trim()) return;

    setVoiceLogs((prev) => [...prev, { sender: "user", text: query }]);
    setVoiceQuery("");

    const stages = [
      "Parsing speech frequencies",
      "Extracting intent parameters",
      "Routing actions checklist"
    ];

    await triggerThinkingSession(stages, async () => {
      setIsVoiceListening(true);
      const res = await voiceCommandAction(query, {
        tasksCount: state.tasks.length,
        emergencyMode: state.emergencyMode,
        activeDemo: state.demoProfile
      });

      setIsVoiceListening(false);
      setVoiceLogs((prev) => [...prev, { sender: "ai", text: res.response }]);

      // Trigger action scripts
      if (res.action === "trigger_student_demo") {
        handleLoadDemo("student");
      } else if (res.action === "trigger_professional_demo") {
        handleLoadDemo("professional");
      } else if (res.action === "trigger_entrepreneur_demo") {
        handleLoadDemo("entrepreneur");
      } else if (res.action === "start_pomodoro") {
        setIsTimerRunning(true);
        addLog("Focus Coach", "Voice prompt started Pomodoro timer.", "running");
      } else if (res.action === "activate_emergency") {
        setState(prev => ({ ...prev, emergencyMode: true }));
        addLog("Orchestrator", "Voice command forced Red Alert Emergency state.", "done");
      }
    });
  };

  // Meeting Recording trigger + Thinking
  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      addLog("Meeting Recorder", `Analyzing recording of ${recordingSeconds}s...`, "thinking");
      
      triggerThinkingSession([
        "Parsing audio recording data",
        "Generating transcript nodes",
        "Extracting summaries & action items"
      ], async () => {
        const result = await recordMeetingAction(recordingSeconds);
        setRecordingData(result);
        setRecordingSeconds(0);

        // Auto-add tasks from recording
        const now = new Date();
        const newTasks: Task[] = result.actionItems.map((item: string, idx: number) => ({
          id: `rec-task-${Date.now()}-${idx}`,
          title: `Meeting Action: ${item}`,
          deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          estimatedEffort: 3,
          status: "todo",
          priority: "medium",
          priorityScore: 55,
          riskScore: 30,
          riskLevel: "green",
          riskReason: "Automatically extracted from meeting transcription.",
          category: state.demoProfile === "none" ? "general" : state.demoProfile,
          explainability: {
            why: "Identified as active item in meeting recording transcription.",
            evidence: "Meeting sync outlined need for index review.",
            confidence: 91,
            alternatives: "Archive item without logging to backlog.",
            outcome: "Logs task to active backlog; tracks completion."
          }
        }));

        setState((prev) => ({
          ...prev,
          tasks: [...prev.tasks, ...newTasks],
          meetings: [
            {
              id: `meeting-${Date.now()}`,
              title: "Live Command Sync Recording",
              date: "Today, Just Now",
              duration: "1 min",
              transcript: result.transcript,
              summary: result.summary,
              actionItems: result.actionItems
            },
            ...prev.meetings
          ]
        }));

        addLog("Meeting Recorder", `Meeting processed. Transcribed ${result.transcript.length} lines. Created ${newTasks.length} action tasks.`, "done");
        setActiveTab("documents");
      });
    } else {
      setRecordingData(null);
      setRecordingSeconds(0);
      setIsRecording(true);
      addLog("Meeting Recorder", "Recording active. Speak to log task parameters...", "running");
    }
  };

  // Raycast command execution
  const executeCommand = (cmd: string) => {
    setIsPaletteOpen(false);
    setPaletteQuery("");

    if (cmd === "student") {
      handleLoadDemo("student");
    } else if (cmd === "professional") {
      handleLoadDemo("professional");
    } else if (cmd === "entrepreneur") {
      handleLoadDemo("entrepreneur");
    } else if (cmd === "optimize") {
      handleOptimizeMyWeek();
    } else if (cmd === "pomodoro") {
      setIsTimerRunning(true);
    } else if (cmd === "emergency") {
      setState(prev => ({ ...prev, emergencyMode: true }));
      addLog("Orchestrator", "Manual emergency overrides active.", "done");
    } else if (cmd === "tab-agents") {
      setActiveTab("agents");
    } else if (cmd === "tab-twin") {
      setActiveTab("twin");
    } else if (cmd === "tab-calendar") {
      setActiveTab("calendar");
    } else if (cmd === "tab-recovery") {
      setActiveTab("recovery");
    } else if (cmd === "replay") {
      handleStartReplay();
    }
  };

  // Voice OS playbacks
  const handleToggleVoicePlayback = (trackName: string) => {
    if (voicePlaybackTrack === trackName) {
      setVoicePlaybackTrack(null);
    } else {
      setVoicePlaybackTrack(trackName);
      addLog("Voice Agent", `Playing briefing audio track: ${trackName}.`, "running");
    }
  };

  // Replay My Day cinematic script player
  const handleStartReplay = () => {
    setIsReplayOpen(true);
    setReplayStep(0);
    setReplayNarrativeText("Initializing Cinematic Replay. Loading first event...");
  };

  useEffect(() => {
    if (!isReplayOpen) return;
    const replayStages = [
      { step: 0, text: "09:00 AM — CS Final Year Syllabus PDF uploaded to Document Center.", log: "Assignment Agent auto-scanned syllabus deadlines." },
      { step: 1, text: "10:15 AM — Urgent Warning Email scanned from Professor Sarah Jenkins.", log: "Risk Predictor flagged critical failure risk score at 84%." },
      { step: 2, text: "11:02 AM — Emergency Mode activated. Red alert transform applied to Cockpit UI.", log: "Voice Agent triggered audio warning notice." },
      { step: 3, text: "11:30 AM — Scheduler Agent executed optimize scheduling solver.", log: "Shifted internalRetro meetings, cleared 3-hour Pomodoro block." },
      { step: 4, text: "01:00 PM — Focus Coach locked deep work shield. Slack notifications muted.", log: "Active Pomodoro clock initiated." },
      { step: 5, text: "04:30 PM — LifeScore improved from 62 to 78 points.", log: "Cinematic Replay finished. Task indicators stable." }
    ];

    const timer = setTimeout(() => {
      if (replayStep < replayStages.length - 1) {
        const next = replayStep + 1;
        setReplayStep(next);
        setReplayNarrativeText(replayStages[next].text);
      } else {
        // finished
        setReplayNarrativeText("Replay finished. System parameters optimized.");
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [isReplayOpen, replayStep]);

  // AI Documentary (Watch My Journey) step-by-step sequencer effect
  useEffect(() => {
    if (!documentaryOpen) return;

    const interval = setInterval(() => {
      setDocumentaryStep((prev) => {
        const next = prev + 1;
        if (next <= 5) {
          speakDocumentarySlide(next);
          return next;
        } else {
          clearInterval(interval);
          setDocumentaryOpen(false);
          // Ending celebration chimes + particles
          playSynthSound("success");
          setTimeout(() => {
            triggerLocalConfetti();
          }, 300);
          return 0;
        }
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [documentaryOpen]);

  // Guided Tour 90s Autonomous AI Ecosystem script solver
  const handleStartGuidedDemo = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
    setDemoStep(0);
    setDemoTimeLeft(90);
    handleLoadDemo("student");
    setActiveTab("copilots");
    
    setVoiceLogs((prev) => [
      ...prev,
      { sender: "ai", text: "Autonomous AI Ecosystem launched. Smart Document Copilot is initiating deep scan on newly uploaded syllabus guidelines..." }
    ]);
    addLog("Smart Document Copilot", "Syllabus document detected in queue. Initiating text analysis...", "thinking");

    demoIntervalRef.current = setInterval(() => {
      setDemoTimeLeft((prev) => {
        const nextTime = prev - 1;
        
        if (nextTime === 75) {
          setDemoStep(1);
          setActiveTab("documents");
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Smart Document Copilot completed PDF scan. Extracted 3 study deliverables and generated 5 practice quiz questions. Handing data to Student Copilot..." }
          ]);
          addLog("Smart Document Copilot", "Extracted 3 deadlines and compiled interactive quizzes from Syllabus.pdf.", "done");
        } else if (nextTime === 60) {
          setDemoStep(2);
          setActiveTab("copilots");
          setState(prev => ({
            ...prev,
            activeCopilotId: "student",
            solvedDsaCount: 15
          }));
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Student Copilot has mapped the study roadmap. Interactive milestones logged and practice quizzes are active. Solved DSA problems: 15/100." }
          ]);
          addLog("Student Copilot", "Built academic milestones roadmap. Solving practice quiz triggers active.", "done");
        } else if (nextTime === 45) {
          setDemoStep(3);
          setActiveTab("mission-control");
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Priority Agent has computed urgency index for 'Final Year Project'. Assigned urgency vector set to critical 95/100." }
          ]);
          addLog("Priority Agent", "Recalculated task vectors. Urgency score calculated: 95/100.", "done");
        } else if (nextTime === 30) {
          setDemoStep(4);
          setActiveTab("recovery");
          setState(prev => ({ ...prev, emergencyMode: true }));
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Recovery Agent flags high delay warning. Target requires 16 effort hours but only 8 are available. Triggering emergency cockpit shields." }
          ]);
          addLog("Recovery Agent", "Critical schedule deficit warning generated. Overriding notifications...", "planning");
        } else if (nextTime === 15) {
          setDemoStep(5);
          setActiveTab("calendar");
          handleOptimizeMyWeek(); // triggers optimizer
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Scheduler Copilot solved calendar congestion. Rescheduled 1 conflicting meeting block, lowering risk index." }
          ]);
          addLog("Scheduler Copilot", "Calendar optimization executed. Conflicts resolved.", "done");
        } else if (nextTime === 5) {
          setDemoStep(6);
          setActiveTab("twin");
          setState(prev => {
            const nextScore = Math.min(99, prev.lifeScore + 18);
            return {
              ...prev,
              emergencyMode: false,
              lifeScore: nextScore,
              scoreHistory: [
                { val: nextScore, reason: "Ecosystem Rescheduling. Restored focus balance.", timestamp: new Date().toISOString() },
                ...prev.scoreHistory
              ],
              twin: {
                ...prev.twin,
                stress: 35,
                focus: 92,
                delayLikelihood: 45,
                attentionSpan: "50 mins"
              }
            };
          });
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Voice Copilot confirms scheduling resolution. Digital Twin synced learning model: stress down to 35%, LifeScore boosted to 80+." }
          ]);
          addLog("Digital Twin Copilot", "Updated attention index to 50 mins. Stress parameters lowered.", "done");
        } else if (nextTime === 0) {
          setDemoStep(7);
          setActiveTab("copilots");
          setState(prev => ({ ...prev, activeCopilotId: null }));
          clearInterval(demoIntervalRef.current!);
          setVoiceLogs((prevLogs) => [
            ...prevLogs,
            { sender: "ai", text: "Ecosystem Demonstration finished. 11 specialized copilots coordinated autonomously under unified brain intelligence." }
          ]);
          addLog("Orchestrator", "Ecosystem sync complete. System parameters stable.", "completed");
        }
        
        return nextTime;
      });
    }, 1000);
  };

  const handleStopGuidedDemo = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
    setDemoStep(-1);
    setDemoTimeLeft(90);
  };

  const activeTask = state.tasks.find((t) => t.id === selectedTaskId);
  const activeDoc = state.documents.find((d) => d.id === selectedDocId);

  // ==========================================
  // Phase 6: Autonomous Copilots Action Helpers
  // ==========================================
  
  const handleStudentDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentTaskTitle.trim()) return;
    const stages = [
      "Consulting Academic Twin datasets",
      "Mapping assignment due dates",
      "Drafting syllabus milestones roadmap"
    ];
    await triggerThinkingSession(stages, async () => {
      addLog("Student Copilot", `Analyzing task: ${studentTaskTitle}`, "thinking");
      const res = await decomposeTaskAction(studentTaskTitle, new Date(Date.now() + 48*60*60*1000).toISOString());
      
      const newTasks = res.milestones.map((m: any, idx: number) => ({
        id: `student-milestone-${Date.now()}-${idx}`,
        title: `Academic Target: ${m.title}`,
        deadline: m.dueDate,
        estimatedEffort: m.effort,
        status: "todo" as const,
        priority: m.riskScore > 70 ? "critical" as const : m.riskScore > 50 ? "high" as const : "medium" as const,
        priorityScore: 70,
        riskScore: m.riskScore,
        riskLevel: m.riskScore > 70 ? "red" as const : m.riskScore > 50 ? "orange" as const : "green" as const,
        riskReason: "Generated by Student Copilot assignment planner.",
        category: "student" as const,
        explainability: {
          why: "Extracted from academic syllabus planner directives.",
          evidence: `Risk level parsed at ${m.riskScore}% relative to duration.`,
          confidence: 94,
          alternatives: "Adjust milestone dates manually in calendar.",
          outcome: "Task added to student dashboard backlog."
        }
      }));

      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, ...newTasks]
      }));
      setStudentTaskTitle("");
      addLog("Student Copilot", `Successfully mapped ${newTasks.length} milestones for ${studentTaskTitle}.`, "done");
    });
  };

  const handleGenerateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalMeetingTopic.trim()) return;
    const stages = [
      "Analyzing calendar invite agendas",
      "Consulting corporate objectives",
      "Drafting executive agendas"
    ];
    await triggerThinkingSession(stages, async () => {
      addLog("Professional Copilot", `Compiling agenda for: ${professionalMeetingTopic}`, "thinking");
      const agenda = [
        `1. Project Sync: Address bottleneck items regarding '${professionalMeetingTopic}' (15 mins)`,
        `2. SLA Operations: Trace running agent diagnostic vectors and CPU limits (10 mins)`,
        `3. Next Actions: Review timeline priorities and assign task scopes (10 mins)`
      ];
      setProfessionalAgendaList(agenda);
      addLog("Professional Copilot", `Agenda compiled successfully. Logged to workspace summaries.`, "done");
    });
  };

  const handleGenerateOKRs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrepreneurGoalInput.trim()) return;
    const stages = [
      "Analyzing startup objectives",
      "Mapping VC term sheet requirements",
      "Drafting key results indicators"
    ];
    await triggerThinkingSession(stages, async () => {
      addLog("Entrepreneur Copilot", `Compiling OKRs for: ${entrepreneurGoalInput}`, "thinking");
      const okrs = [
        {
          objective: `Objective: Achieve launch alignment for ${entrepreneurGoalInput}`,
          kr: [
            "Key Result 1: Complete 100% of critical slides review checklist",
            "Key Result 2: Lower VPC server checkout webhook error rates below 0.1%",
            "Key Result 3: Secure partner verification sign-offs within 48 hours"
          ]
        }
      ];
      setEntrepreneurOKRs(okrs);
      addLog("Entrepreneur Copilot", `OKRs generated and synced to startup board.`, "done");
    });
  };

  const handleAddWater = (grams: number) => {
    addLog("Health & Wellbeing Copilot", `Water intake logged: +${grams}ml`, "completed");
    setState(prev => {
      const nextWater = prev.healthState.waterIntakeGrams + grams;
      const nextStress = Math.max(10, prev.twin.stress - 3);
      return {
        ...prev,
        healthState: {
          ...prev.healthState,
          waterIntakeGrams: nextWater,
          activeBreakLevel: nextWater >= 1500 ? "Water limit satisfied for afternoon" : "Log more water inputs"
        },
        twin: {
          ...prev.twin,
          stress: nextStress
        }
      };
    });
  };

  const handleToggleSubscription = (subId: string) => {
    setState(prev => {
      let savedAmount = 0;
      const updated = prev.financialState.subscriptions.map(s => {
        if (s.id === subId) {
          savedAmount = s.amount;
          return { ...s, active: !s.active };
        }
        return s;
      });

      const wasActive = prev.financialState.subscriptions.find(s => s.id === subId)?.active;
      const savingsDiff = wasActive ? savedAmount : -savedAmount;
      const nextSavings = prev.financialState.monthlyForecast.savings + savingsDiff;
      const nextExpenses = prev.financialState.monthlyForecast.expenses - savingsDiff;

      addLog("Financial Copilot", `${wasActive ? "Pruned" : "Restored"} subscription. Updated monthly savings.`, "completed");

      return {
        ...prev,
        financialState: {
          ...prev.financialState,
          subscriptions: updated,
          monthlyForecast: {
            expenses: nextExpenses,
            savings: nextSavings
          }
        }
      };
    });
  };

  const handleScanSmartDocText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartDocInputText.trim()) return;
    const stages = [
      "Analyzing input text blocks",
      "Extracting schedule milestones",
      "Validating timeline guidelines"
    ];
    await triggerThinkingSession(stages, async () => {
      addLog("Smart Document Copilot", "Scanning custom document text...", "thinking");
      const res = await parseAssignmentDocumentAction(smartDocInputText);
      const now = new Date();
      const newTasks = res.tasks.map((t: string, idx: number) => ({
        id: `smart-doc-task-${Date.now()}-${idx}`,
        title: `Doc Extracted: ${t}`,
        deadline: new Date(now.getTime() + 48*60*60*1000).toISOString(),
        estimatedEffort: 4,
        status: "todo" as const,
        priority: "high" as const,
        priorityScore: 75,
        riskScore: 40,
        riskLevel: "green" as const,
        riskReason: "Extracted from custom text analysis.",
        category: "general" as const,
        explainability: {
          why: "Identified in custom uploaded text segment.",
          evidence: "Smart Document Copilot parsed direct guidelines.",
          confidence: 91,
          alternatives: "Archive without parsing to backlog.",
          outcome: "Saves task item to backlog."
        }
      }));

      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, ...newTasks]
      }));
      setSmartDocInputText("");
      addLog("Smart Document Copilot", `Successfully extracted ${newTasks.length} tasks.`, "done");
    });
  };

  const handleSaveReflection = () => {
    if (!dailyReflectionInput.trim()) return;
    addLog("Life Coach Copilot", "Saving reflection to Memory Vault...", "thinking");
    const newMemory = {
      id: `mem-ref-${Date.now()}`,
      category: "Daily Reflection",
      content: dailyReflectionInput,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      memoryLogs: [newMemory, ...prev.memoryLogs]
    }));
    setFilteredMemory(prev => [newMemory, ...prev]);
    setDailyReflectionInput("");
    addLog("Life Coach Copilot", "Saved reflection successfully. Synced to AI Memory Vault.", "done");
  };

  const handleRecoveryCompress = async () => {
    const stages = [
      "Analyzing active priority scores",
      "Pruning low-priority task cards",
      "Compressing calendar focus blocks",
      "Estimating recovery safety metrics"
    ];
    await triggerThinkingSession(stages, async () => {
      addLog("Recovery Copilot", "Initiating timeline compression optimizer...", "thinking");
      setState(prev => {
        const prunedTasks = prev.tasks.filter(t => t.priority === "critical" || t.priority === "high");
        const nextScore = Math.min(99, prev.lifeScore + 15);
        return {
          ...prev,
          tasks: prunedTasks,
          emergencyMode: false,
          lifeScore: nextScore,
          scoreHistory: [
            { val: nextScore, reason: "Executed Recovery schedule compression. Removed low priority items.", timestamp: new Date().toISOString() },
            ...prev.scoreHistory
          ],
          twin: {
            ...prev.twin,
            stress: Math.max(20, prev.twin.stress - 30),
            focus: Math.min(100, prev.twin.focus + 15)
          }
        };
      });
      addLog("Recovery Copilot", "Timeline compression completed successfully. Safety index: 95%.", "done");
    });
  };

  const getCopilotIcon = (iconName: string) => {
    switch (iconName) {
      case "GraduationCap": return <GraduationCap className="w-5 h-5" />;
      case "Briefcase": return <Briefcase className="w-5 h-5" />;
      case "Zap": return <Zap className="w-5 h-5" />;
      case "Activity": return <Activity className="w-5 h-5" />;
      case "CreditCard": return <DollarSign className="w-5 h-5" />;
      case "FileText": return <FileText className="w-5 h-5" />;
      case "Inbox": return <Inbox className="w-5 h-5" />;
      case "Mic": return <Mic className="w-5 h-5" />;
      case "UserCheck": return <UserCheck className="w-5 h-5" />;
      case "ShieldAlert": return <ShieldAlert className="w-5 h-5" />;
      case "Award": return <Award className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const renderCopilotWorkspaceDetail = (id: string) => {
    const copilot = state.copilots.find(c => c.id === id);
    if (!copilot) return null;

    return (
      <div className="space-y-6 text-left">
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-black/60 to-cyan-950/20 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="space-y-1">
            <button
              onClick={() => setState(prev => ({ ...prev, activeCopilotId: null }))}
              className="text-xs text-cyan-400 font-bold mb-2 flex items-center gap-1 hover:text-cyan-300 transition-all font-mono"
            >
              ← BACK TO COPILOT HUB
            </button>
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400`}>
                {getCopilotIcon(copilot.iconName)}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  {copilot.name}
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest animate-pulse">
                    {copilot.status}
                  </span>
                </h3>
                <p className="text-xs opacity-70 leading-normal">{copilot.role} • {copilot.mission}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-[9px] min-w-[280px] shrink-0">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
              <span className="opacity-55 block uppercase text-[8px]">AI CONFIDENCE</span>
              <span className="text-cyan-400 font-extrabold text-sm">{copilot.confidence}%</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
              <span className="opacity-55 block uppercase text-[8px]">ACTIVE CHECKS</span>
              <span className="text-purple-400 font-extrabold text-sm">{state.tasks.filter(t => t.category === id).length} pending</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
              <span className="opacity-55 block uppercase text-[8px]">SUCCESS RATE</span>
              <span className="text-green-400 font-extrabold text-sm">{copilot.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE CONTENT LAYOUTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Action Workspace Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Student Copilot Details */}
            {id === "student" && (
              <div className="space-y-6">
                
                {/* Milestone Roadmap Generator */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. ASSIGNMENT MILESTONE PLANNER</span>
                    <h4 className="font-bold text-sm text-white">Extract roadmap & milestones from syllabus description</h4>
                  </div>
                  
                  <form onSubmit={handleStudentDecompose} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter assignment: e.g. 'Advanced AI VPC subnets report'"
                      value={studentTaskTitle}
                      onChange={(e) => setStudentTaskTitle(e.target.value)}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg hover:shadow-cyan-500/10 transition-all shrink-0"
                    >
                      Map Roadmap
                    </button>
                  </form>
                </div>

                {/* Solving DSA problems tracker */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">2. CODING INTERVIEW COACH</span>
                      <h4 className="font-bold text-sm text-white font-sans">Track Solved DSA Challenges</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                      {state.solvedDsaCount} / 100 Solved
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs">
                      <span className="font-bold text-white block">Next suggested: Dynamic Programming LIS</span>
                      <span className="opacity-60 text-[10px]">Optimal study window based on Digital Twin: 3-5 PM</span>
                    </div>
                    <button
                      onClick={() => setState(prev => ({ ...prev, solvedDsaCount: prev.solvedDsaCount + 1 }))}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 text-[11px] font-bold transition-all"
                    >
                      + Solved Problem
                    </button>
                  </div>
                </div>

                {/* Exam Planner practice quiz */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">3. EXAM RESCUE COACH</span>
                      <h4 className="font-bold text-sm text-white">Advanced AI Exam Quiz Practice</h4>
                    </div>
                    <span className="text-[10px] opacity-50 font-mono">Readiness: 62%</span>
                  </div>

                  <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-xl">
                    <h5 className="text-xs font-bold text-white leading-normal">Question: Which of the following is true regarding React Server Components (RSC) and Client Components?</h5>
                    <div className="space-y-2 pt-1 text-xs">
                      {[
                        "RSCs render only on the client, while Client Components render on the server and client.",
                        "RSCs render on the server and have zero client bundle cost, whereas Client Components can use React hooks like useState.",
                        "Client Components cannot import server actions."
                      ].map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => alert("Correct option selected! Review explanation under syllabus.")}
                          className="w-full text-left p-3 rounded-lg bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all leading-relaxed"
                        >
                          {i === 1 ? "✓ " : ""} {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Copilot details */}
            {id === "professional" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. MEETING AGENDA GENERATOR</span>
                    <h4 className="font-bold text-sm text-white">Create instant checklists for corporate discussions</h4>
                  </div>
                  
                  <form onSubmit={handleGenerateAgenda} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter meeting topic: e.g. 'AWS VPC deployment review'"
                      value={professionalMeetingTopic}
                      onChange={(e) => setProfessionalMeetingTopic(e.target.value)}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg hover:shadow-cyan-500/10 transition-all shrink-0"
                    >
                      Compile Agenda
                    </button>
                  </form>

                  {professionalAgendaList.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[9px] font-mono text-white/40 block font-bold uppercase">Generated Agendas:</span>
                      <div className="space-y-1.5 p-3 rounded-xl bg-black/35 border border-white/5 font-mono text-[10px] leading-relaxed">
                        {professionalAgendaList.map((ag, i) => (
                          <div key={i} className="text-white/80">{ag}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcription Summary info card */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">2. MEETING RECORDER & TRANSCRIPTIONS</span>
                      <h4 className="font-bold text-sm text-white">Last processed discussions overview</h4>
                    </div>
                    <span className="text-[10px] opacity-40 font-mono">1 min ago</span>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                    <span className="text-[9px] font-mono text-cyan-400 block font-bold">LATEST TRANSCRIPT EXTRACT</span>
                    <div className="text-[11px] font-mono opacity-80 leading-normal space-y-1 text-white">
                      <div>[00:12] User: We have a major presentation tomorrow. We need to compile the performance index.</div>
                      <div>[00:25] AI Coach: I recommend cloning the Q2 slide template and loading direct SLA tables.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Entrepreneur Copilot details */}
            {id === "entrepreneur" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. OKR CREATOR WORKSPACE</span>
                    <h4 className="font-bold text-sm text-white">Generate Objectives & Key Results indices</h4>
                  </div>
                  
                  <form onSubmit={handleGenerateOKRs} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Objective goal: e.g. 'Deploy Checkout portal beta'"
                      value={entrepreneurGoalInput}
                      onChange={(e) => setEntrepreneurGoalInput(e.target.value)}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all shrink-0"
                    >
                      Create OKR
                    </button>
                  </form>

                  {entrepreneurOKRs.length > 0 && (
                    <div className="pt-2 space-y-3">
                      {entrepreneurOKRs.map((o, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-black/35 border border-white/5 space-y-2 text-xs">
                          <span className="font-bold text-white block">{o.objective}</span>
                          <ul className="space-y-1 pl-3 text-[11px] opacity-80 text-white leading-normal">
                            {o.kr.map((krStr, kIdx) => (
                              <li key={kIdx} className="list-disc">{krStr}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">2. VENTURE PRESENTATION CHECKLIST</span>
                    <h4 className="font-bold text-sm text-white">Core slides verification checklist</h4>
                  </div>

                  <div className="space-y-3 font-mono text-[10px]">
                    {[
                      { slide: "1. Problem & Value Statement", rate: 100 },
                      { slide: "2. Product Architecture VPC Subnets", rate: 90 },
                      { slide: "3. Cap Table Option Pool splits (15%)", rate: 70 },
                      { slide: "4. Projected Revenue Forecast Growth", rate: 50 }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-white">
                          <span>{item.slide}</span>
                          <span>{item.rate}% Ready</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Health Copilot Details */}
            {id === "health" && (
              <div className="space-y-6">
                
                {/* Hydration Tracker */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. HYDRATION MANAGER</span>
                      <h4 className="font-bold text-sm text-white">Track water intake balance</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                      {state.healthState.waterIntakeGrams}ml / 2000ml Target
                    </span>
                  </div>

                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => handleAddWater(250)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-xs font-bold text-white transition-all"
                    >
                      🥛 +250ml Water
                    </button>
                    <button
                      onClick={() => handleAddWater(500)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-xs font-bold text-white transition-all"
                    >
                      🍼 +500ml Water
                    </button>
                  </div>
                </div>

                {/* Mindfulness Breathing Sphere */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">2. STRESS RECOVERY SESSIONS</span>
                      <h4 className="font-bold text-sm text-white">Mindfulness Breathing Coach</h4>
                    </div>
                    <span className="text-xs font-mono text-purple-400 font-bold">
                      {Math.floor(mindfulnessSecondsLeft / 60)}:{(mindfulnessSecondsLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    {/* Breathing circle indicator */}
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-teal-400/20 to-cyan-500/30 flex items-center justify-center border border-teal-500/30 ${isMindfulnessActive ? "orb-pulse" : ""}`}>
                      <div className="text-center font-mono text-xs">
                        <span className="text-white font-extrabold block">Stress Level</span>
                        <span className="text-teal-400 font-extrabold text-sm">{state.twin.stress}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMindfulnessActive(!isMindfulnessActive)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${isMindfulnessActive ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-teal-950/20 text-teal-400 border border-teal-500/30 hover:bg-teal-950/40"}`}
                    >
                      {isMindfulnessActive ? "Stop Breathing Exercise" : "Start 2-Min Exercise"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Copilot Details */}
            {id === "financial" && (
              <div className="space-y-6">
                
                {/* Subscription Auditor */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. SUBSCRIPTION PORTAL AUDITOR</span>
                    <h4 className="font-bold text-sm text-white">Trace active memberships & prune expenditures</h4>
                  </div>

                  <div className="space-y-3 text-xs leading-normal">
                    {state.financialState.subscriptions.map((sub) => (
                      <div key={sub.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <span className="font-bold text-white block">{sub.name}</span>
                          <span className="opacity-50 text-[10px]">${sub.amount}/mo • Renews: {sub.renewDate}</span>
                        </div>

                        <button
                          onClick={() => handleToggleSubscription(sub.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${sub.active ? "bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-950/40" : "bg-green-950/20 text-green-400 border-green-500/20 hover:bg-green-950/40"}`}
                        >
                          {sub.active ? "Cancel Subscription" : "Re-activate"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Due Bills */}
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">2. UTILITY BILLS SCHEDULE</span>
                      <h4 className="font-bold text-sm text-white">Monitor due dates to prevent penalties</h4>
                    </div>
                    <span className="text-[10px] opacity-40 font-mono">Monthly Budget: ${state.financialState.monthlyForecast.expenses}/mo</span>
                  </div>

                  <div className="space-y-2 text-xs leading-normal">
                    {state.financialState.bills.map((bill) => (
                      <div key={bill.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <span className="font-bold text-white block">{bill.name}</span>
                          <span className="opacity-50 text-[10px]">${bill.amount} • Due: {bill.dueDate}</span>
                        </div>

                        <button
                          onClick={() => setState(prev => ({
                            ...prev,
                            financialState: {
                              ...prev.financialState,
                              bills: prev.financialState.bills.map(b => b.id === bill.id ? { ...b, paid: !b.paid } : b)
                            }
                          }))}
                          className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono transition-all ${bill.paid ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}
                        >
                          {bill.paid ? "✓ PAID" : "PENDING"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Document Copilot */}
            {id === "document" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. DOCUMENT PARSER SANDBOX</span>
                    <h4 className="font-bold text-sm text-white">Extract schedules and milestones from raw text descriptions</h4>
                  </div>

                  <form onSubmit={handleScanSmartDocText} className="space-y-3">
                    <textarea
                      placeholder="Paste syllabus/assignment text description: e.g. 'Project deliverables due Day 5: complete AWS subnet schemas, VPC blueprint drafting...'"
                      value={smartDocInputText}
                      onChange={(e) => setSmartDocInputText(e.target.value)}
                      rows={4}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all"
                      >
                        Scan Text Deliverables
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Email Copilot details */}
            {id === "email" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. PRIORITY INBOX CLASSIFIER</span>
                    <h4 className="font-bold text-sm text-white">Trace Gmail notifications automatically classified by urgency</h4>
                  </div>

                  <div className="space-y-3 text-xs leading-normal">
                    {state.emails.map((email) => (
                      <div key={email.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white block">{email.sender}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold border ${email.urgency === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                            {email.urgency.toUpperCase()}
                          </span>
                        </div>
                        <h5 className="font-semibold text-cyan-300 font-mono text-[10px]">{email.subject}</h5>
                        <p className="opacity-75 text-[11px] leading-relaxed text-white">{email.body}</p>
                        
                        {email.processed ? (
                          <div className="text-[10px] text-green-400 font-mono font-bold pt-1">
                            ✓ Auto Action Taken: {email.actionTaken}
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleEmailAction(email.id, "schedule")}
                              className="px-2.5 py-1 rounded bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold"
                            >
                              Auto-Schedule Focus Block
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice Copilot details */}
            {id === "voice" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. VOCAL COPILOT BRIEFINGS</span>
                    <h4 className="font-bold text-sm text-white">Audio briefings and transcript searches</h4>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs text-white">
                    <span>🔊 SYNTHESIZED BRIEFINGS:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleVoicePlayback("Daily briefing track")}
                        className={`px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${voicePlaybackTrack === "Daily briefing track" ? "bg-red-500/20 text-red-400 border-red-500/30 font-bold" : "bg-white/5 border-white/5 text-white hover:text-cyan-400"}`}
                      >
                        {voicePlaybackTrack === "Daily briefing track" ? "Stop" : "Play Briefing"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Digital Twin Copilot */}
            {id === "twin" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. COGNITIVE BEHAVIORAL insights</span>
                    <h4 className="font-bold text-sm text-white">Proactive Twin Recommendations</h4>
                  </div>

                  <div className="space-y-3 text-xs leading-normal">
                    {[
                      "Complete coding project schemas before dinner tonight.",
                      "You retain information 30% better in the early morning slots.",
                      "Reduce workload tomorrow afternoon due to expected cognitive fatigue.",
                      "You have been working continuously for 3 hours. Schedule a break slot."
                    ].map((ins, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                        <span className="text-cyan-400 mt-0.5">▪</span>
                        <p className="text-white opacity-85 leading-relaxed">{ins}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recovery Copilot */}
            {id === "recovery" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. EMERGENCY TIMELINE RESOLUTIONS</span>
                    <h4 className="font-bold text-sm text-white">Timeline Compression Optimizer</h4>
                  </div>

                  <p className="text-xs opacity-75 leading-relaxed">
                    Executing the compression algorithm will automatically defer secondary meetings, prune low-priority task components, and block focus windows.
                  </p>

                  <button
                    onClick={handleRecoveryCompress}
                    className="w-full py-3 rounded-xl bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-950/40 text-xs font-bold transition-all"
                  >
                    Execute Timeline Compression
                  </button>
                </div>
              </div>
            )}

            {/* Life Coach Copilot */}
            {id === "coach" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. REFLECTIONS VAULT LOG</span>
                    <h4 className="font-bold text-sm text-white">Daily motivational briefings and reflections notepad</h4>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      placeholder="Write your reflection note: e.g. 'Finished VPC databases VPC and AWS schemas. Energy levels solid.'..."
                      value={dailyReflectionInput}
                      onChange={(e) => setDailyReflectionInput(e.target.value)}
                      rows={4}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveReflection}
                        className="px-4 py-2 text-xs font-bold bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all"
                      >
                        Save Daily Reflection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Expanded Side Activity logs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Copilot diagnostics info */}
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40">COPILOT LOG ACTIVITY</span>
              
              <div className="space-y-3 font-mono text-[9px] max-h-[300px] overflow-y-auto pr-1">
                {state.logs
                  .filter((log) => log.agentName.toLowerCase().includes(copilot.id) || log.agentName.toLowerCase().includes(copilot.name.split(" ")[0].toLowerCase()))
                  .map((log) => (
                    <div key={log.id} className="border-b border-white/5 pb-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-400">[{log.agentName}]</span>
                        <span className="opacity-40">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="opacity-80 text-white leading-tight">{log.action}</p>
                    </div>
                  ))}
                {state.logs.filter((log) => log.agentName.toLowerCase().includes(copilot.id) || log.agentName.toLowerCase().includes(copilot.name.split(" ")[0].toLowerCase())).length === 0 && (
                  <div className="text-center py-6 opacity-40">No activity logs recorded yet.</div>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-3">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40 text-cyan-400">STATE HARMONY</span>
              <p className="text-[10px] opacity-75 leading-relaxed text-white">
                This copilot communicates directly with the Orchestrator and saves insights to the shared AI Memory Vault database.
              </p>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const getDynamicBackgroundClass = () => {
    if (state.emergencyMode) return "bg-[#110103]"; // Red Emergency
    if (documentaryOpen || activeTab === "journey") return "bg-[#0f0b01]"; // Gold Celebration
    if (state.demoProfile === "student" || state.activeCopilotId === "student") return "bg-[#02030d]"; // Focused Indigo Exam
    if (state.demoProfile === "professional" || state.activeCopilotId === "professional") return "bg-[#020610]"; // Professional Blue Interview
    
    // Time Adaptive
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return "bg-[#030712]"; // Soft Blue Morning
    if (hrs >= 12 && hrs < 17) return "bg-[#0d0e12]"; // Bright Silver/White blend Afternoon
    if (hrs >= 17 && hrs < 21) return "bg-[#090212]"; // Purple Evening
    return "bg-[#020208]"; // Deep Navy Night
  };

  const getDynamicGradientClass = () => {
    if (state.emergencyMode) return "from-red-500/20 via-red-950/5"; // Red Emergency
    if (documentaryOpen || activeTab === "journey") return "from-amber-500/20 via-amber-950/5"; // Gold Celebration
    if (state.demoProfile === "student" || state.activeCopilotId === "student") return "from-indigo-600/20 via-indigo-950/5"; // Focused Indigo Exam
    if (state.demoProfile === "professional" || state.activeCopilotId === "professional") return "from-blue-600/20 via-blue-950/5"; // Professional Blue Interview
    
    // Time Adaptive
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return "from-cyan-500/15 via-blue-950/5"; // Soft Blue Morning
    if (hrs >= 12 && hrs < 17) return "from-white/10 via-slate-900/5"; // Bright White/Chrome Afternoon
    if (hrs >= 17 && hrs < 21) return "from-fuchsia-600/15 via-purple-950/5"; // Purple Evening
    return "from-blue-950/30 via-slate-950/5"; // Deep Navy Night
  };

  return (
    <div className={`min-h-screen grid-bg relative flex flex-col font-sans transition-all duration-1000 ${darkTheme ? getDynamicBackgroundClass() : "bg-[#f8fafc] text-slate-900"}`}>
      
      {/* Background radial gradient mask */}
      <div className={`absolute top-0 left-0 w-full h-[650px] bg-gradient-to-b ${darkTheme ? getDynamicGradientClass() : "from-slate-200/40"} to-transparent pointer-events-none transition-all duration-1000`} />

      {/* Guided Tour Banner Overlay */}
      {demoStep >= 0 && (
        <div className="bg-cyan-950/70 border-b border-cyan-500/30 text-white text-center py-2 px-6 flex items-center justify-between text-xs font-bold z-50 overflow-hidden shadow-lg shadow-cyan-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>90s AUTONOMOUS AI ECOSYSTEM DEMO — STEP {demoStep + 1} OF 8</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-cyan-300">
              {demoStep === 0 && "🚀 Step 1: Syllabus PDF Uploaded to Document Copilot (90-75s)"}
              {demoStep === 1 && "📄 Step 2: Document Copilot Extracts Deliverables & Quizzes (75-60s)"}
              {demoStep === 2 && "🎓 Step 3: Student Copilot Creates Roadmap & solved DSA problems (60-45s)"}
              {demoStep === 3 && "🎯 Step 4: Priority Agent Calculates Urgency Score (45-30s)"}
              {demoStep === 4 && "🚨 Step 5: Recovery Agent Warns of Schedule Deficits (30-15s)"}
              {demoStep === 5 && "📅 Step 6: Scheduler Reorganizes Calendar & Focus Blocks (15-5s)"}
              {demoStep === 6 && "🎙️ Step 7: Voice OS Explains Plan & Twin Updates Learning Model (5-0s)"}
              {demoStep === 7 && "✓ Ecosystem Demo Finished!"}
            </span>
            <div className="bg-black/30 px-3 py-1 rounded border border-white/10 font-mono text-sm tracking-wider flex items-center gap-2">
              TIME LEFT: <span className="text-cyan-400 font-extrabold">{demoTimeLeft}s</span>
              <button
                onClick={handleStopGuidedDemo}
                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px]"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Alert Emergency Banner */}
      <AnimatePresence>
        {state.emergencyMode && demoStep < 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-red-600 via-rose-700 to-red-600 text-white text-center py-2 px-6 flex items-center justify-between text-xs font-bold z-50 border-b border-red-500/30 overflow-hidden shadow-lg shadow-red-500/20"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
              <span>EMERGENCY CRITICAL STATE DETECTED — DEADLINES EXCEED SLOTS AVAILABILITY</span>
            </div>
            <div className="font-mono text-sm tracking-wider flex items-center gap-2 bg-black/35 px-3 py-1 rounded border border-white/10 shrink-0">
              CRITICAL TIMELINE RESCUE LIMIT: <span className="text-red-400 font-extrabold">{emergencyCountdown}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main OS Header Bar */}
      <header className="border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white shadow shadow-cyan-500/20">
                ⚡
              </div>
              <span className="font-extrabold tracking-tight text-base bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                LifeSaver <span className="text-cyan-400">X</span>
              </span>
            </Link>

            {/* Demo Mode Badge and Reset Controls */}
            {state.isDemoMode && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  DEMO EXPERIENCE
                </span>
                <button
                  onClick={handleResetToRealData}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] font-bold transition-all"
                  title="Reset to your saved real user data"
                >
                  ↺ Reset Real Data
                </button>
              </div>
            )}

            {/* Quick-switch layout selectors */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg p-1">
              <span className="text-[10px] font-mono font-bold uppercase px-2 opacity-50">SCENARIOS:</span>
              <button
                onClick={() => handleLoadDemo("student")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${state.demoProfile === "student" ? "bg-red-500 text-white shadow shadow-red-500/20" : "hover:bg-white/5 opacity-75"}`}
              >
                🎓 Student
              </button>
              <button
                onClick={() => handleLoadDemo("professional")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${state.demoProfile === "professional" ? "bg-orange-500 text-white shadow shadow-orange-500/20" : "hover:bg-white/5 opacity-75"}`}
              >
                💼 Professional
              </button>
              <button
                onClick={() => handleLoadDemo("entrepreneur")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${state.demoProfile === "entrepreneur" ? "bg-purple-500 text-white shadow shadow-purple-500/20" : "hover:bg-white/5 opacity-75"}`}
              >
                🚀 Entrepreneur
              </button>
            </div>
            
            {/* Guided Tour Trigger Button */}
            <button
              onClick={handleStartGuidedDemo}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              🚀 AI ECOSYSTEM
            </button>

            {/* Simulate Delay Replan Trigger Button */}
            <button
              onClick={handleSimulateDelay}
              className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold transition-all shadow-md shadow-rose-500/10"
              title="Simulate delay to trigger failure detection and Plan 2 auto-replan"
            >
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              ⚡ Simulate Delay (+45m)
            </button>
          </div>

          {/* Global brain health bar */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono font-bold border-l border-white/5 pl-6">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="text-left leading-none">
                <span className="text-[10px] opacity-50 block font-normal">GLOBAL BRAIN USE</span>
                <span className="text-xs text-cyan-400 font-extrabold">{brainLoad}% LOAD</span>
              </div>
            </div>
            <div className="text-left max-w-[200px] truncate leading-none">
              <span className="text-[10px] opacity-40 block font-normal">CURRENT THOUGHT</span>
              <span className="text-[11px] opacity-80 font-medium truncate block">{brainThoughts}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            {/* Experience LifeSaver X Judge presentation */}
            <button
              onClick={() => setTriggerJudgeTour(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-cyan-500/30 hover:shadow-lg text-white transition-all flex items-center gap-1.5 shrink-0 border border-cyan-400/30 font-sans"
              title="Experience LifeSaver X (Judge Mode)"
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>Experience LifeSaver X</span>
            </button>

            {/* Cinematic Replay button */}
            <button
              onClick={handleStartReplay}
              className="px-3.5 py-2 rounded-xl bg-purple-950/20 text-purple-400 border border-purple-500/20 hover:bg-purple-950/40 transition-all flex items-center gap-1 shrink-0"
            >
              <History className="w-3.5 h-3.5" />
              Replay My Day
            </button>

            {/* Search command palette shortcut block */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 transition-all font-mono text-xs animate-pulse"
            >
              <span>Search Command</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/45 border border-white/10 text-[10px] text-white/70">Ctrl+K</kbd>
            </button>

            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {darkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>

            <button
              onClick={() => {
                setSoundMuted(!soundMuted);
                if (soundMuted) {
                  // Play a small beep trigger when unmuting
                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.frequency.setValueAtTime(600, ctx.currentTime);
                    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                  }
                }
              }}
              className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
              title={soundMuted ? "Unmute System Sounds" : "Mute System Sounds"}
            >
              {soundMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full relative">
        
        {/* Left Dashboard Tabs Sidebar */}
        <aside className="w-64 border-r border-white/5 p-6 space-y-6 hidden md:block shrink-0 bg-black/5">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-40 block px-3 mb-2">Life OS System</span>
            
            {[
              { id: "mission-control", label: "Mission Control", icon: Layers, badge: state.emergencyMode ? "ALERT" : undefined, badgeColor: "bg-red-500/20 text-red-400 border-red-500/30" },
              { id: "copilots", label: "AI Copilot Hub", icon: Sparkles, badge: "11 Active", badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
              { id: "agents", label: "AI Agent Team", icon: Brain, badge: "10 Running", badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
              { id: "twin", label: "Digital Twin", icon: UserCheck, badge: "Learning", badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              { id: "calendar", label: "Predictive Calendar", icon: CalendarIcon, badge: state.events.some(e => e.isConflict) ? "CONFLICT" : undefined, badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
              { id: "documents", label: "Document Center", icon: FileText, badge: state.documents.length > 0 ? `${state.documents.length} Docs` : undefined },
              { id: "emails", label: "Gmail Agent", icon: Inbox, badge: state.emails.filter(e => !e.processed).length > 0 ? `${state.emails.filter(e => !e.processed).length} Urg` : undefined, badgeColor: "bg-rose-500/25 text-rose-400 border-rose-500/30" },
              { id: "timeline", label: "Life Timeline", icon: History },
              { id: "journey", label: "My Journey", icon: Award, badge: "Mastery", badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
              { id: "recovery", label: "Recovery Center", icon: ShieldAlert, badge: state.emergencyMode ? "DANGER" : "SAFE", badgeColor: state.emergencyMode ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-green-500/20 text-green-400 border-green-500/30" },
              { id: "memory", label: "AI Memory Vault", icon: MessageSquare },
              { id: "analytics", label: "Analytics Hub", icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`${tab.id}-tab`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border ${isActive ? "bg-white/5 text-cyan-400 border-cyan-500/20 shadow-md shadow-cyan-500/5" : "text-white/60 border-transparent hover:text-white hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "opacity-60"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${tab.badgeColor || "bg-white/5 text-white/50 border-white/5"}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-40 block px-3">Quick Diagnostics</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                <span className="text-[9px] font-mono opacity-50 block leading-tight">STRESS</span>
                <span className={`text-sm font-extrabold ${state.twin.stress > 80 ? "text-red-500 animate-pulse" : state.twin.stress > 50 ? "text-orange-500" : "text-green-500"}`}>
                  {state.twin.stress}%
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                <span className="text-[9px] font-mono opacity-50 block leading-tight">PRODUCTIVITY</span>
                <span className="text-sm font-extrabold text-green-400">{state.productivityScore}%</span>
              </div>
            </div>
            
            {/* Live Meeting Sync Shortcut */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono opacity-50 uppercase">Meeting Recorder</span>
                {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <button
                onClick={handleToggleRecording}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${isRecording ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-950/40"}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    Stop Recorder ({recordingSeconds}s)
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    Record Live Sync
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Dashboard Main Interactive Tab Content Grid */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8">
          
          {/* Top Panel: Daily Briefing Ticker */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-r from-black/60 to-cyan-950/10 text-left relative overflow-hidden">
            <div className="absolute right-4 top-4 px-2 py-0.5 rounded border border-white/5 bg-white/5 font-mono text-[9px] text-cyan-400 uppercase tracking-widest">
              DAILY EXECUTIVE BRIEFING
            </div>
            
            {/* Interactive Cycle Mode Toggle */}
            <div className="flex gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl w-fit mb-4">
              <button
                onClick={() => setBriefingMode("morning")}
                className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${briefingMode === "morning" ? "bg-cyan-500 text-black" : "text-white/60 hover:text-white"}`}
              >
                ☀️ MORNING BRIEFING
              </button>
              <button
                onClick={() => setBriefingMode("evening")}
                className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${briefingMode === "evening" ? "bg-purple-500 text-white" : "text-white/60 hover:text-white"}`}
              >
                🌙 EVENING SUMMARY
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="space-y-1 flex-1">
                {briefingMode === "morning" ? (
                  <>
                    {(() => {
                      const hrs = new Date().getHours();
                      let periodGreeting = "Good Morning";
                      if (hrs >= 12 && hrs < 17) periodGreeting = "Good Afternoon";
                      else if (hrs >= 17 && hrs < 21) periodGreeting = "Good Evening";
                      else if (hrs >= 21 || hrs < 5) periodGreeting = "Good Night";
                      
                      return (
                        <h2 className="text-xl font-extrabold text-white">
                          {periodGreeting}, {state.dailyBriefing.greeting.replace(/^Good\s+(Morning|Afternoon|Evening|Night),\s*/i, "") || "Welcome Back"}
                        </h2>
                      );
                    })()}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-white/50 pt-1">
                      <span className="text-green-400 font-bold">✓ Success Probability: {state.dailyBriefing.successProb}%</span>
                      <span>•</span>
                      <span>Tasks: {state.tasks.length} Critical Pending</span>
                      <span>•</span>
                      <span className="text-cyan-400">
                        Recommendation: {new Date().getHours() >= 21 || new Date().getHours() < 5 ? "Rest mode approaching. Secure focus buffer." : state.dailyBriefing.actions[0] || "Maintain focus window buffer."}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold text-white">
                      Good Evening Summary, Rahul
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-white/50 pt-1">
                      <span className="text-purple-400 font-bold">✓ Day complete • Saved: 3 Hours • Prevented: 2 Failures</span>
                      <span>•</span>
                      <span className="text-emerald-400">LifeScore: {state.lifeScore} Index (+18)</span>
                    </div>
                  </>
                )}
              </div>

              {/* Circular LifeScore KPI */}
              <div 
                onClick={() => setLifeScoreExplainOpen(true)}
                className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl shrink-0 cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                title="Click to view LifeScore Evolution"
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-white/10" strokeWidth="3" fill="transparent" />
                    <circle cx="28" cy="28" r="24" className="stroke-cyan-400 transition-all duration-500" strokeWidth="3.5" fill="transparent" strokeDasharray={150.7} strokeDashoffset={150.7 - (150.7 * state.lifeScore) / 100} />
                  </svg>
                  <span className="absolute font-mono text-base font-extrabold text-cyan-400">{state.lifeScore}</span>
                </div>
                
                <div className="text-left font-mono text-[10px] leading-tight max-w-[120px]">
                  <span className="opacity-50 block uppercase text-[8px] flex items-center gap-1">
                    LifeScore KPI
                    <HelpCircle className="w-3 h-3 inline text-white/40" />
                  </span>
                  <span className="text-white font-bold block truncate">{state.scoreHistory[0]?.reason || "System optimized."}</span>
                  <span className="text-[8px] opacity-40 block">Last changed: Just now</span>
                </div>
              </div>
            </div>
            
            {briefingMode === "morning" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">TODAY'S CRITICAL PRIORITIES</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    {state.dailyBriefing.priorities.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="text-cyan-400">▪</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">UPCOMING FORECASTED RISKS</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    {state.dailyBriefing.risks.map((r, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="text-orange-400">▪</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">RECOMMENDED ACTIONS</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    {state.dailyBriefing.actions.map((a, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="text-green-400">✓</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">NOVA SYSTEM TELEMETRY</span>
                  <div className="space-y-1 text-[11px] font-mono leading-tight text-white/80 text-left">
                    <div className="text-green-400 font-bold">✓ 11 Active Agents Running</div>
                    <div>⏳ Focus Block: 14:00 - 17:30</div>
                    <div>🎯 Est. Productive: 6.5 Hrs</div>
                    <div className="text-purple-400 text-[10px] italic">"Maintain focus window buffer."</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">COMPLETED WORKSLOTS</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    <li className="flex items-center gap-1.5 truncate"><span className="text-purple-400">✓</span> Next.js API Schemas</li>
                    <li className="flex items-center gap-1.5 truncate"><span className="text-purple-400">✓</span> Stripe payment mock checks</li>
                    <li className="flex items-center gap-1.5 truncate"><span className="text-purple-400">✓</span> Compiler milestones set</li>
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">DE-CONGESTIONS LOGGED</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    <li className="flex items-center gap-1.5 truncate"><span className="text-cyan-400">✓</span> 2 critical deadlines protected</li>
                    <li className="flex items-center gap-1.5 truncate"><span className="text-cyan-400">✓</span> Muted secondary notifications</li>
                    <li className="flex items-center gap-1.5 truncate"><span className="text-cyan-400">✓</span> Focus block secured</li>
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">TOMORROW'S PLAN</span>
                  <ul className="space-y-1 text-white/80 text-left">
                    <li className="flex items-center gap-1.5 truncate"><span className="text-amber-400">▪</span> Run Stripe code reviews</li>
                    <li className="flex items-center gap-1.5 truncate"><span className="text-amber-400">▪</span> Attend advisor demo review</li>
                  </ul>
                </div>
                <div>
                  <span className="font-mono font-bold text-[9px] opacity-40 uppercase tracking-widest block mb-1">NOVA SYSTEM CLOSING NOTE</span>
                  <p className="text-[11px] leading-relaxed italic text-purple-300 text-left">
                    "Wish you a highly productive and restful tomorrow, Rahul!"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Render Tab Contents */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* TAB 0: AI COPILOT HUB */}
              {activeTab === "copilots" && (
                <div className="space-y-8">
                  {state.activeCopilotId ? (
                    renderCopilotWorkspaceDetail(state.activeCopilotId)
                  ) : (
                    <>
                      {/* Hub Header & Status */}
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-gradient-to-r from-black/60 to-cyan-950/10 p-6 rounded-2xl border border-white/5 text-left relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase tracking-widest font-bold">Autonomous Agent Core</span>
                          <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                            AI Copilot Hub
                            <button
                              onClick={() => setExplainTopic("copilots")}
                              className="text-white/40 hover:text-cyan-400 transition-all p-1 cursor-pointer"
                              title="Explain Copilot Hub"
                            >
                              <HelpCircle className="w-4 h-4 inline" />
                            </button>
                          </h3>
                          <p className="text-xs opacity-75 mt-1">Specialized expert copilots communicating and executing state optimizations autonomously.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 font-mono text-[9px]">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <span className="opacity-55 block">TOTAL RUNNING</span>
                            <span className="text-cyan-400 font-extrabold text-sm">11 COPILOTS</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <span className="opacity-55 block">SHARED MEMORY</span>
                            <span className="text-purple-400 font-extrabold text-sm">{state.memoryLogs.length} LOGS</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <span className="opacity-55 block">AVG CONFIDENCE</span>
                            <span className="text-green-400 font-extrabold text-sm">94.6%</span>
                          </div>
                        </div>
                      </div>

                      {/* Filter / Search Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="flex flex-wrap gap-1 bg-black/45 rounded-lg p-1 border border-white/5 shrink-0">
                          {[
                            { id: "all", label: "All Copilots" },
                            { id: "active", label: "Active" },
                            { id: "online", label: "Online" }
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setCopilotsFilter(f.id as any)}
                              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${copilotsFilter === f.id ? "bg-cyan-500 text-black" : "text-white/60 hover:text-white"}`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-3 opacity-30 text-white" />
                          <input
                            type="text"
                            placeholder="Search copilots..."
                            value={copilotsSearch}
                            onChange={(e) => setCopilotsSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Copilots Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.copilots
                          .filter((c) => {
                            if (copilotsFilter === "active" && c.status !== "ACTIVE" && c.status !== "COLLABORATING") return false;
                            if (copilotsFilter === "online" && c.status !== "ONLINE") return false;
                            return c.name.toLowerCase().includes(copilotsSearch.toLowerCase()) || c.role.toLowerCase().includes(copilotsSearch.toLowerCase());
                          })
                          .map((c) => (
                            <div
                              key={c.id}
                              className="glass-panel p-5 rounded-2xl border-white/5 hover:border-white/15 transition-all text-left flex flex-col justify-between h-[240px] relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-black/45"
                            >
                              {/* Glowing border outline */}
                              <div className={`absolute inset-0 bg-gradient-to-tr ${c.gradient} opacity-0 group-hover:opacity-5 transition-all duration-300 pointer-events-none`} />
                              
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400`}>
                                    {getCopilotIcon(c.iconName)}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border flex items-center gap-1 ${c.status === "ACTIVE" || c.status === "COLLABORATING" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-white/5 text-white/50 border-white/5"}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    {c.status}
                                  </span>
                                </div>

                                <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-400 transition-colors">{c.name}</h4>
                                <span className="text-[10px] font-mono text-white/55 block mb-2">{c.role}</span>
                                <p className="text-[11px] opacity-75 leading-relaxed text-white line-clamp-2 mb-4">{c.mission}</p>
                              </div>

                              <div className="space-y-3 pt-3 border-t border-white/5">
                                <div className="flex justify-between items-center text-[9px] font-mono text-white/50">
                                  <span>CONFIDENCE: <strong className="text-cyan-400">{c.confidence}%</strong></span>
                                  <span>COMPLETED: <strong className="text-green-400">{c.completionRate}%</strong></span>
                                </div>
                                <button
                                  onClick={() => setState(prev => ({ ...prev, activeCopilotId: c.id }))}
                                  className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-center text-white transition-all"
                                >
                                  Expand Operations
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Copilot Marketplace */}
                      <div className="pt-8 border-t border-white/5 text-left space-y-6">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase tracking-widest font-bold">Scale Architecture ready</span>
                          <h3 className="text-lg font-extrabold text-white">Copilot Extension Marketplace</h3>
                          <p className="text-xs opacity-75 mt-1">Install or scale third-party specialist copilots using plug-in templates.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {state.marketplaceCopilots.map((sub) => (
                            <div key={sub.id} className="p-5 rounded-2xl border border-white/5 bg-black/35 text-left flex flex-col justify-between h-[150px]">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 text-white/50 border border-white/5 uppercase">
                                    {sub.category}
                                  </span>
                                  <span className="text-[8px] font-mono text-cyan-400 font-bold">READY</span>
                                </div>
                                <h4 className="font-bold text-xs text-white">{sub.name}</h4>
                                <p className="text-[10px] opacity-70 mt-1 leading-normal line-clamp-2 text-white">{sub.desc}</p>
                              </div>

                              <button
                                onClick={() => {
                                  alert(`Scale plugin verified: ${sub.name} extension registered in local configuration.`);
                                  setState(prev => ({
                                    ...prev,
                                    marketplaceCopilots: prev.marketplaceCopilots.map(m => m.id === sub.id ? { ...m, installed: true } : m)
                                  }));
                                }}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold text-center transition-all ${sub.installed ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"}`}
                              >
                                {sub.installed ? "✓ Plugin Activated" : "Activate Extension"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 1: MISSION CONTROL */}
              {activeTab === "mission-control" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Center panels (Cockpit) */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Running Mission & Objectives */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 block">CURRENT COCKPIT STATUS</span>
                          <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                            NASA-Style Mission Control
                            <button
                              onClick={() => setExplainTopic("mission-control")}
                              className="text-white/40 hover:text-cyan-400 transition-all p-1 cursor-pointer"
                              title="Explain Mission Control"
                            >
                              <HelpCircle className="w-4 h-4 inline" />
                            </button>
                          </h3>
                        </div>
                        <div className="px-3 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-mono font-bold animate-pulse">
                          SYSTEM STATUS: ONLINE
                        </div>
                      </div>

                      {/* Objectives cards */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Active Recovery Milestones</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">Core Mission Target</span>
                              <span className="text-[10px] font-mono opacity-50">9 hrs remaining</span>
                            </div>
                            <h4 className="text-sm font-bold truncate">
                              {state.tasks.find(t => t.priority === "critical")?.title || "Execute general schedule task optimization"}
                            </h4>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full" style={{ width: "65%" }} />
                            </div>
                            <span className="text-[10px] font-mono opacity-60 block text-right">Completion Est: 65%</span>
                          </div>

                          <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-orange-400 uppercase">Rescheduling Pipeline</span>
                              <span className="text-[10px] font-mono opacity-50 font-bold">1 conflict alert</span>
                            </div>
                            <p className="text-xs opacity-75">
                              Conflicts detected in calendar sync items. Auto-rescheduler is armed.
                            </p>
                            {state.events.some(e => e.isConflict) ? (
                              <button
                                onClick={handleOptimizeMyWeek}
                                className="px-3 py-1.5 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow shadow-orange-500/20"
                              >
                                Optimize Calendar Slots
                              </button>
                            ) : (
                              <div className="text-green-400 text-xs font-bold flex items-center gap-1">
                                ✓ Schedule optimized and buffered.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phase 5: Interactive Agent Execution Pipeline */}
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Agent Execution Pipeline</span>
                          <span className="text-[9px] font-mono text-cyan-400">Total elapsed: {pipelineElapsed}</span>
                        </div>
                        
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-1 overflow-x-auto relative">
                          {PIPELINE_STEPS.map((step, idx) => {
                            const isNodeActive = idx <= pipelineActiveNode;
                            return (
                              <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center shrink-0 max-w-[80px] text-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${isNodeActive ? "bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/35" : "bg-white/5 border-white/10 text-white/40"}`}>
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[8px] font-mono mt-1.5 truncate w-full ${isNodeActive ? "text-cyan-300 font-bold" : "text-white/30"}`}>
                                    {step.label}
                                  </span>
                                </div>
                                {idx < PIPELINE_STEPS.length - 1 && (
                                  <div className="flex-1 min-w-[20px] h-[2px] bg-white/5 relative self-center">
                                    <div className={`absolute inset-0 bg-cyan-400 transition-all duration-300 ${isNodeActive ? "w-full" : "w-0"}`} />
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Task Creation Section */}
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 block mb-3">Add Custom Goal Task</span>
                        <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-6">
                            <input
                              type="text"
                              placeholder="Enter task name (e.g. Write review report)"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[8px] font-mono opacity-50 block mb-1">EFFORT (H)</label>
                            <input
                              type="number"
                              min="1"
                              value={newTaskEffort}
                              onChange={(e) => setNewTaskEffort(Number(e.target.value))}
                              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[8px] font-mono opacity-50 block mb-1">DUE IN (H)</label>
                            <input
                              type="number"
                              min="1"
                              value={newTaskDeadlineHours}
                              onChange={(e) => setNewTaskDeadlineHours(Number(e.target.value))}
                              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl text-xs font-bold text-white shadow shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all"
                            >
                              Add Task
                            </button>
                          </div>
                        </form>
                      </div>

                    </div>

                    {/* Phase 4: Plan 1 vs Plan 2 Autonomous Replanning Comparison Card */}
                    {(state.activePlan || state.previousPlan) && (
                      <div className="glass-panel p-6 rounded-2xl border-white/10 bg-black/50 text-left space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">AUTONOMOUS RECOVERY ENGINE</span>
                            <h4 className="text-base font-extrabold text-white">Plan 1 vs Plan 2 Auto-Replanning Engine</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSimulateDelay}
                              className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold transition-all"
                            >
                              ⚡ Simulate Delay (+45m)
                            </button>
                          </div>
                        </div>

                        {state.previousPlan ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Plan 1: Inactive / Failed */}
                            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wide">PLAN 1 (INITIAL)</span>
                                <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-[9px] font-extrabold">
                                  INVALIDATED (DELAY &gt; 25%)
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <span className="text-[9px] font-mono opacity-50 block uppercase">Original Time Allocation:</span>
                                {state.previousPlan.timeBlocks.slice(0, 3).map((tb, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] bg-black/30 p-1.5 rounded text-white/70">
                                    <span className="font-mono text-red-300">{tb.time}</span>
                                    <span className="truncate max-w-[140px]">{tb.focus}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-red-500/10 text-[10px] text-red-200">
                                <strong>Why Plan 1 Failed: </strong>
                                {state.lastFailureAssessment?.failureReason || "Progress deviation exceeded capacity threshold."}
                              </div>
                            </div>

                            {/* Plan 2: Active / Re-engineered */}
                            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wide">PLAN 2 (ACTIVE RESCUE)</span>
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] font-extrabold animate-pulse">
                                  CURRENT RECOVERY PLAN
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <span className="text-[9px] font-mono opacity-50 block uppercase">Adjusted Time Allocation:</span>
                                {state.activePlan?.timeBlocks.slice(0, 3).map((tb, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] bg-black/40 p-1.5 rounded text-cyan-200">
                                    <span className="font-mono text-cyan-400 font-bold">{tb.time}</span>
                                    <span className="truncate max-w-[140px]">{tb.focus}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-cyan-500/10 text-[10px] text-cyan-200">
                                <strong>What Changed: </strong>
                                {state.replanningHistory?.[0]?.diffSummary || "Non-critical scope deferred; focus allocated to highest-impact milestone."}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono font-bold text-green-400 uppercase">PLAN 1 (HEALTHY EXECUTION)</span>
                              <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-300 font-mono text-[9px] font-extrabold">
                                ON SCHEDULE
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {state.activePlan?.timeBlocks.map((tb, idx) => (
                                <div key={idx} className="p-2 rounded bg-black/30 border border-white/5 text-[10px]">
                                  <span className="font-mono text-cyan-400 block font-bold">{tb.time}</span>
                                  <span className="opacity-80 text-white truncate block">{tb.focus}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Today's Action commitments view */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Today's Schedule commitments</span>
                        <span className="text-[10px] font-mono opacity-60 font-bold">{state.tasks.length} total tasks</span>
                      </div>
                      
                      {state.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/5 border-dashed rounded-2xl space-y-4">
                          <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            🤖
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-white block">You have a clear schedule today!</span>
                            <span className="text-[10px] opacity-60 block leading-normal mt-1 text-gray-400 max-w-[280px] mx-auto">
                              This is a perfect opportunity to work on your long-term goals or start a new Academy mission below.
                            </span>
                          </div>
                          <button
                            onClick={() => setTriggerJudgeTour(true)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 transition-all"
                          >
                            Load Scenarios
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {state.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                if (task.riskLevel === "red") {
                                  setActiveTab("recovery");
                                }
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer text-left transition-all space-y-3 ${selectedTaskId === task.id ? "bg-white/5 border-cyan-500/50 shadow-md" : "bg-black/25 border-white/5 hover:border-white/10"}`}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono border font-extrabold uppercase ${task.riskLevel === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : task.riskLevel === 'orange' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                  {task.riskLevel} risk ({task.riskScore}%)
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="text-red-400 opacity-60 hover:opacity-100 p-0.5 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold leading-tight mb-1 truncate text-white">{task.title}</h4>
                                <div className="flex items-center justify-between text-[10px] font-mono opacity-50">
                                  <span>Effort: {task.estimatedEffort || Math.round((task.estimated_minutes || 60) / 60)} hrs</span>
                                  <span>Priority: {task.priorityScore}/100</span>
                                </div>
                              </div>

                              {/* Interactive Progress Slider & Auto-replan trigger */}
                              <div className="pt-2 border-t border-white/5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                  <span className="opacity-60">PROGRESS:</span>
                                  <span className="font-bold text-cyan-400">{task.progress || 0}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={task.progress || 0}
                                  onChange={(e) => handleUpdateTaskProgress(task.id, Number(e.target.value))}
                                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                                />
                                <div className="flex gap-1 justify-end">
                                  {[25, 50, 75, 100].map((pct) => (
                                    <button
                                      key={pct}
                                      onClick={() => handleUpdateTaskProgress(task.id, pct)}
                                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[8px] font-mono text-white/70"
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Phase 5: AI Explainability Panel */}
                    <AnimatePresence>
                      {activeTask?.explainability && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="glass-panel p-6 rounded-2xl border-white/5 bg-cyan-950/5 text-left space-y-4 overflow-hidden border-l-2 border-l-cyan-400"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">AI EXPLAINABILITY PANEL</span>
                            <span className="text-[9px] font-mono opacity-40">Confidence: {activeTask.explainability.confidence}%</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div className="space-y-2">
                              <div>
                                <span className="font-mono text-[9px] opacity-40 uppercase block">WHY RECOMMENDATION DETECTED</span>
                                <p className="opacity-90 leading-relaxed font-sans">{activeTask.explainability.why}</p>
                              </div>
                              <div>
                                <span className="font-mono text-[9px] opacity-40 uppercase block">EVIDENCE PARAMETERS</span>
                                <p className="opacity-90 leading-relaxed font-sans">{activeTask.explainability.evidence}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <span className="font-mono text-[9px] opacity-40 uppercase block">ALTERNATIVE PLAN OPTION</span>
                                <p className="opacity-90 leading-relaxed font-sans">{activeTask.explainability.alternatives}</p>
                              </div>
                              <div>
                                <span className="font-mono text-[9px] opacity-40 uppercase block">EXPECTED SUCCESS OUTCOME</span>
                                <p className="opacity-95 text-green-400 font-bold leading-relaxed">{activeTask.explainability.outcome}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  {/* Right Column: Mini Widgets (Twin, Live Ops console, Voice logs) */}
                  <div className="lg:col-span-4 space-y-8 text-left">
                    
                    {/* Phase 5: Permanent Live AI Operations Monitoring Center */}
                    <div className="glass-panel p-5 rounded-2xl border-white/5 bg-black/40 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">LIVE AI OPERATIONS MONITOR</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span className="text-[9px] font-mono text-cyan-400 font-bold">STREAMING</span>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-1">
                        {["all", "Orchestrator", "Scheduler", "Twin", "Priority"].map((f) => (
                          <button
                            key={f}
                            onClick={() => setOpsFilterAgent(f)}
                            className={`px-2 py-0.5 rounded text-[8px] font-mono border transition-all ${opsFilterAgent === f ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/35 font-bold" : "bg-white/5 text-white/50 border-white/5 hover:text-white"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {filteredOpsList.map((ops) => (
                          <div key={ops.id} className="text-[10px] border-b border-white/5 pb-2 font-mono flex flex-col gap-0.5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-cyan-400">{ops.agent}</span>
                              <span className="opacity-40 text-[8px]">{ops.time}</span>
                            </div>
                            <p className="opacity-90 font-sans leading-normal text-white">{ops.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini Digital Twin Panel - Hidden in Emergency Mode for focus */}
                    {!state.emergencyMode && (
                      <div className="glass-panel p-5 rounded-2xl border-white/5 bg-black/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Twin behavioral Model</span>
                          <button onClick={() => setActiveTab("twin")} className="text-[10px] font-mono text-cyan-400 font-bold hover:underline">
                            Twin Profile
                          </button>
                        </div>
                        
                        <div className="space-y-3 text-xs leading-relaxed">
                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1.5">
                            <div className="flex justify-between font-mono text-[10px] opacity-60">
                              <span>WORK STYLE</span>
                              <span>ATTENTION</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="truncate max-w-[150px] text-white">{state.twin.workStyle}</span>
                              <span className="text-white">{state.twin.attentionSpan}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 font-mono">
                              <span className="text-[9px] opacity-50 block leading-tight">AVG DELAY</span>
                              <span className="font-bold text-orange-400">{state.twin.avgDelay} hrs</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 font-mono">
                              <span className="text-[9px] opacity-50 block leading-tight">TYPING SPEED</span>
                              <span className="font-bold text-cyan-400">{state.twin.typingSpeed} WPM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Memory Search Box - Hidden in Emergency Mode for focus */}
                    {!state.emergencyMode && (
                      <div className="glass-panel p-5 rounded-2xl border-white/5 bg-black/40 space-y-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 block">Semantic Memory search</span>
                        
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-3.5 opacity-40" />
                          <input
                            type="text"
                            placeholder="Search queries: 'What did I discuss last Tuesday?'..."
                            value={memorySearch}
                            onChange={(e) => handleMemorySearchChange(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                          />
                        </div>

                        {memorySearch.trim() && (
                          <div className="p-3 bg-black/35 rounded-xl border border-cyan-500/20 max-h-[140px] overflow-y-auto space-y-2">
                            {filteredMemory.map((log, idx) => (
                              <div key={idx} className="text-[10px] border-b border-white/5 pb-1">
                                <span className="font-bold text-cyan-400">[{log.category}] </span>
                                <span className="opacity-80 font-sans text-white">{log.content}</span>
                              </div>
                            ))}
                            {filteredMemory.length === 0 && (
                              <span className="text-[10px] opacity-50 italic">No semantic memory match.</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* TAB 2: AI AGENTS */}
              {activeTab === "agents" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">AGENTS TEAM REGISTRY</span>
                    <h3 className="text-xl font-extrabold text-white">Autonomous Multi-Agent Directory</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: "🧠 Orchestrator", desc: "Monitors overall workspace logs, evaluates task parameters, and initiates recovery pipelines.", status: "ONLINE", confidence: 98, task: "Scanning active dashboard events list", log: "Scanned 12 schedule blocks. System indicators stable.", health: 100, memory: 12, success: 99, execs: 140 },
                      { name: "📅 Scheduler Agent", desc: "Detects calendar overlap conflicts, maps available focus slots, and manages rescheduling.", status: "OPTIMIZED", confidence: 95, task: "Holding calendar slot buffers", log: "De-conflicted Q3 Retro overlap; cleared afternoon block.", health: 99, memory: 8, success: 98, execs: 85 },
                      { name: "🎯 Priority Engine", desc: "Calculates live priority indices (0-100) using deadline urgency parameters and task effort.", status: "CALCULATING", confidence: 92, task: "Aggregating priority vectors", log: "Recalculated Project Code priority to 95/100.", health: 100, memory: 6, success: 99, execs: 110 },
                      { name: "📚 Study Coach", desc: "Parses syllabus instructions, extracts goals, and compiles active study flashcards and practice quizzes.", status: "STANDBY", confidence: 89, task: "Loaded PDF syllabus structure", log: "Prepared AI reinforcement learning mock questions.", health: 98, memory: 14, success: 96, execs: 42 },
                      { name: "💼 Interview Coach", desc: "Scans role requirements, designs preparation maps, and conducts interactive tech mocks.", status: "STANDBY", confidence: 91, task: "Extracting Stripe tech skills", log: "Assembled Next.js server actions preparation guide.", health: 99, memory: 15, success: 97, execs: 38 },
                      { name: "📄 Assignment Agent", desc: "Scans uploaded PDFs, notes, and invoice documents to automatically build structured subtasks.", status: "STANDBY", confidence: 88, task: "Analyzing syllabus uploads", log: "Auto-created final report task list parameters.", health: 98, memory: 11, success: 97, execs: 29 },
                      { name: "🛡️ Recovery Agent", desc: "Triggers under critical risks, drafts emergency roadmaps, prunes scope, and locks Pomodoro coaches.", status: state.emergencyMode ? "ACTIVE" : "STANDBY", confidence: 94, task: state.emergencyMode ? "Running project rescue sequence" : "Standby for critical alerts", log: state.emergencyMode ? "Formulated 3-hour simplified code draft checklist." : "Ready to handle project deadlines.", health: 100, memory: 18, success: 99, execs: 14 },
                      { name: "🎤 Voice Agent", desc: "Vocal operating core. Processes client prompts and delivers contextual speech alerts (English/Hindi/Telugu).", status: "ONLINE", confidence: 96, task: "Listening for trigger speech", log: "Dispatched warning alert regarding 18-hour project deadline.", health: 100, memory: 9, success: 98, execs: 64 },
                      { name: "🧬 Digital Twin", desc: "Generates behavioral stress modeling coordinates, delay predictions, and optimal work schedules.", status: "LEARNING", confidence: 88, task: "Modeling delay likelihood curves", log: "Warned of procrastinate spikes after 8:00 PM tonight.", health: 99, memory: 24, success: 97, execs: 180 },
                      { name: "⚡ Emergency Agent", desc: "Locks systems into high-urgency warnings, sets red alerts, and triggers silent notifications.", status: state.emergencyMode ? "ACTIVE" : "STANDBY", confidence: 97, task: state.emergencyMode ? "Enforcing system red overrides" : "Monitoring deadline indicators", log: state.emergencyMode ? "Enforced Red UI banner; loaded countdown widgets." : "Monitoring risk buffers.", health: 100, memory: 5, success: 99, execs: 22 }
                    ].map((agent, i) => (
                      <div key={i} className={`glass-panel p-5 rounded-2xl text-left space-y-4 border transition-all ${agent.status === "ACTIVE" ? "border-red-500/40 bg-red-950/5 shadow-md animate-pulseAgent" : "border-white/5 hover:border-white/10"}`}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-sm text-cyan-400">{agent.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold border ${agent.status === "ACTIVE" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"}`}>
                            {agent.status}
                          </span>
                        </div>
                        
                        <p className="text-[11px] opacity-75 leading-relaxed">{agent.desc}</p>
                        
                        {/* Phase 5: Expanded Agent Dashboard metrics */}
                        <div className="grid grid-cols-2 gap-2 text-[8px] font-mono opacity-50 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div>HEALTH: <strong className="text-white font-bold">{agent.health}%</strong></div>
                          <div>MEMORY: <strong className="text-white font-bold">{agent.memory}MB</strong></div>
                          <div>SUCCESS RATE: <strong className="text-white font-bold">{agent.success}%</strong></div>
                          <div>EXEC COUNT: <strong className="text-white font-bold">{agent.execs} runs</strong></div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-white/5 text-[10px] font-mono">
                          <div>
                            <span className="opacity-50">RUNNING TASK: </span>
                            <span className="font-bold text-white">{agent.task}</span>
                          </div>
                          <div>
                            <span className="opacity-50">CONFIDENCE: </span>
                            <span className="font-bold text-cyan-300">{agent.confidence}% Accuracy</span>
                          </div>
                          <div>
                            <span className="opacity-50">LATEST LOG: </span>
                            <span className="opacity-80 block text-[9px] bg-black/20 p-1.5 rounded border border-white/5 mt-1 text-white">{agent.log}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DIGITAL TWIN */}
              {activeTab === "twin" && (
                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">TWIN BEHAVIORAL PROFILE</span>
                      <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                        Digital Behavioral Twin
                        <button
                          onClick={() => setExplainTopic("twin")}
                          className="text-white/40 hover:text-cyan-400 transition-all p-1 cursor-pointer"
                          title="Explain Digital Twin"
                        >
                          <HelpCircle className="w-4 h-4 inline" />
                        </button>
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                      MODEL ACCURACY: {state.twin.completionRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Behavioral parameters */}
                    <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">LEARNED PARAMETERS</span>
                      
                      <div className="space-y-4">
                        {[
                          { label: "TYPING VELOCITY", val: `${state.twin.typingSpeed} WPM`, sub: "High consistency indicators" },
                          { label: "ATTENTION INTERVAL", val: state.twin.attentionSpan, sub: "Decreases after 2:30 PM" },
                          { label: "SLEEPING CYCLE", val: `${state.twin.sleepStart} - ${state.twin.sleepEnd}`, sub: "7 hours average buffer" },
                          { label: "DELAY LIKELIHOOD", val: `${state.twin.delayLikelihood}% Probability`, sub: "Spikes during night slots" },
                          { label: "WORK LANGUAGE", val: state.twin.preferredLanguage, sub: "Handles Hindi triggers" },
                          { label: "COGNITIVE SPEED", val: state.twin.learningSpeed, sub: "Rapid under crisis pressure" }
                        ].map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0">
                            <div>
                              <span className="font-mono text-[10px] opacity-50 block leading-tight">{p.label}</span>
                              <span className="font-bold text-white">{p.val}</span>
                            </div>
                            <span className="text-[9px] font-mono opacity-40 text-right">{p.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle/Right: Chart forecasting */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">PREDICTIVE STRESS & BURNOUT SHIELDS</span>
                      
                      {/* Recharts Area Chart */}
                      <div className="h-[280px] w-full pt-4">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={(state.analytics.length > 0 ? state.analytics : [
                              { name: "Mon", stress: 45, burnout: 35 },
                              { name: "Tue", stress: 55, burnout: 45 },
                              { name: "Wed", stress: 78, burnout: 60 },
                              { name: "Thu", stress: 86, burnout: 82 },
                              { name: "Fri", stress: 62, burnout: 70 },
                              { name: "Sat", stress: 40, burnout: 55 }
                            ]) as any}>
                              <defs>
                                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorBurnout" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "#0d0e12", borderColor: "rgba(255,255,255,0.08)" }} />
                              <Area type="monotone" dataKey="stress" stroke="#ef4444" fillOpacity={1} fill="url(#colorStress)" name="Stress Level" />
                              <Area type="monotone" dataKey="burnout" stroke="#f97316" fillOpacity={1} fill="url(#colorBurnout)" name="Burnout Risk" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      {/* Phase 5: Digital Twin Evolution Insights with confidence */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono font-bold opacity-45 uppercase tracking-wider block">EVOLUTION LOG INSIGHTS</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {state.twin.insights.map((insight) => (
                            <div key={insight.id} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                              <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold block">[{insight.category}]</span>
                              <p className="text-[11px] leading-normal text-white">{insight.text}</p>
                              <span className="text-[9px] font-mono opacity-40 block text-right">Confidence: {insight.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: SMART CALENDAR */}
              {activeTab === "calendar" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end text-left">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">PREDICTIVE SLOT HEATMAP</span>
                      <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                        Smart Calendar & Rescheduling
                        <button
                          onClick={() => setExplainTopic("calendar")}
                          className="text-white/40 hover:text-cyan-400 transition-all p-1 cursor-pointer"
                          title="Explain Smart Calendar"
                        >
                          <HelpCircle className="w-4 h-4 inline" />
                        </button>
                      </h3>
                    </div>
                    {state.events.some(e => e.isConflict) && (
                      <button
                        onClick={handleOptimizeMyWeek}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-orange-500/20 hover:shadow-lg text-white text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse"
                      >
                        <Zap className="w-4 h-4" />
                        De-conflict and Optimize Calendar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Calendar grid view */}
                    <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-xs font-extrabold font-mono text-white">Today's Focus Slots & Overlaps</span>
                        <div className="flex gap-2 text-[9px] font-mono">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500" /> Conflict</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> Focus Buffer</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-500" /> Standby</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {state.events.map((ev) => {
                          const start = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const end = new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={ev.id}
                              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${ev.isConflict ? "bg-orange-950/20 border-orange-500/40 text-orange-200" : "bg-black/25 border-white/5"}`}
                            >
                              <div>
                                <h4 className="text-xs font-bold leading-tight mb-1 text-white">{ev.title}</h4>
                                <span className="text-[10px] font-mono opacity-50">{start} - {end}</span>
                              </div>
                              {ev.isConflict ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  OVERLAP WARNING
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/5 text-white/50 border border-white/5">
                                  SYNCED
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk parameters widget */}
                    <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">CALENDAR CRITICAL HEATMAP</span>
                      
                      <div className="space-y-4">
                        {[
                          { label: "DEADLINE DENSITY INDEX", score: state.emergencyMode ? "82% - HIGH" : "28% - STABLE", width: state.emergencyMode ? "w-[82%]" : "w-[28%]", color: state.emergencyMode ? "bg-red-500" : "bg-cyan-500" },
                          { label: "FREE TIME BUFFER SCORE", score: state.events.some(e => e.isConflict) ? "35% - DEFICIT" : "78% - HEALTHY", width: state.events.some(e => e.isConflict) ? "w-[35%]" : "w-[78%]", color: state.events.some(e => e.isConflict) ? "bg-orange-500" : "bg-green-500" },
                          { label: "FOCUS WINDOW EFFICIENCY", score: `${state.focusScore}% Output`, width: `w-[${state.focusScore}%]`, color: "bg-cyan-500" }
                        ].map((m, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="opacity-60">{m.label}</span>
                              <span className="font-bold text-white">{m.score}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <div className={`${m.color} h-full transition-all duration-500`} style={{ width: m.width.replace('w-[', '').replace('%]', '%').replace('w-', '') }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">Weekly Slot Forecast</span>
                        <p className="text-xs opacity-80 leading-relaxed text-white">
                          Rescheduling non-essential slots provides <strong>8 additional focus hours</strong>. Click <strong>Optimize My Week</strong> to apply.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 5: SMART DOCUMENT CENTER */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">MOCK UPLOAD CENTER</span>
                    <h3 className="text-xl font-extrabold text-white">Smart Document Center</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Files selectors */}
                    <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Select PDF Syllabus Instructions</span>
                      
                      <div className="space-y-3">
                        {state.documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => handleSelectMockDoc(doc.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all text-left space-y-2 ${selectedDocId === doc.id ? "bg-white/5 border-cyan-500/50" : "bg-black/25 border-white/5 hover:border-white/10"}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs truncate max-w-[150px] text-white">{doc.name}</span>
                              <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5 uppercase text-cyan-400">{doc.type}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[9px] opacity-50">
                              <span>Size: {doc.size}</span>
                              <span>Uploaded: {doc.uploadDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Real Document upload input & dropzone */}
                      <input
                        type="file"
                        accept=".pdf,.txt,.md,.json,.csv"
                        className="hidden"
                        id="real-doc-upload-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                      <div
                        onClick={() => document.getElementById("real-doc-upload-input")?.click()}
                        className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/25 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-all"
                      >
                        <Upload className="w-6 h-6 text-cyan-400 mx-auto animate-float" />
                        <span className="text-xs font-semibold block text-white">Upload Syllabus (PDF / TXT / MD)</span>
                        <span className="text-[9px] opacity-60 text-cyan-300 block">Click to browse or drop file to extract action tasks</span>
                      </div>
                    </div>

                    {/* Right: Extracted milestones, summary, flashcards, quizzes */}
                    <div className="lg:col-span-8 space-y-6 text-left">
                      {activeDoc ? (
                        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 space-y-6">
                          
                          {/* File metadata */}
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">EXTRACTED SYLLABUS SUMMARY</span>
                              <h4 className="text-base font-extrabold text-white">{activeDoc.name}</h4>
                            </div>
                            <span className="text-[10px] font-mono opacity-50 font-bold">Processed by Assignment Agent</span>
                          </div>

                          <p className="text-xs opacity-80 leading-relaxed text-white">{activeDoc.summary}</p>

                          {/* Extracted deadlines & priorities */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <span className="text-[9px] font-mono font-bold opacity-50 uppercase tracking-widest block">EXTRACTED DEADLINES</span>
                              <div className="space-y-1.5">
                                {activeDoc.deadlines.map((dl, idx) => (
                                  <div key={idx} className="p-2 rounded bg-black/20 border border-white/5 text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {dl}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[9px] font-mono font-bold opacity-50 uppercase tracking-widest block">SUGGESTED PRIORITIES</span>
                              <div className="space-y-1.5">
                                {activeDoc.suggestedPriorities.map((sp, idx) => (
                                  <div key={idx} className="p-2 rounded bg-black/20 border border-white/5 text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    {sp}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quizzes generated */}
                          <div className="pt-4 border-t border-white/5 space-y-3">
                            <span className="text-[9px] font-mono font-bold opacity-50 uppercase tracking-widest block">STUDY COACH INTERACTIVE MOCK QUESTIONS</span>
                            
                            <div className="p-4 bg-black/35 rounded-xl border border-white/5 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono opacity-50">QUESTION {selectedQuizIdx + 1} OF {activeDoc.quizzes.length}</span>
                              </div>
                              
                              <p className="text-xs font-bold leading-relaxed text-white">{activeDoc.quizzes[selectedQuizIdx].question}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                {activeDoc.quizzes[selectedQuizIdx].options.map((opt, optIdx) => {
                                  const ansSelected = quizAnswers[selectedQuizIdx];
                                  const isCorrect = opt === activeDoc.quizzes[selectedQuizIdx].answer;
                                  const isThis = opt === ansSelected;
                                  
                                  let style = "bg-black/35 border-white/5 hover:border-cyan-500/30 text-white/80";
                                  if (ansSelected) {
                                    if (isCorrect) style = "bg-green-950/20 border-green-500/40 text-green-400";
                                    else if (isThis) style = "bg-red-950/20 border-red-500/40 text-red-400";
                                    else style = "bg-black/35 border-white/5 opacity-40";
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => !ansSelected && handleQuizAnswer(selectedQuizIdx, opt, activeDoc)}
                                      className={`p-2.5 rounded-xl border text-[11px] text-left font-medium transition-all ${style}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {quizAnswers[selectedQuizIdx] && (
                                <div className="mt-2 text-[10px] leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 text-white">
                                  <strong>EXPLANATION:</strong> {activeDoc.quizzes[selectedQuizIdx].explanation}
                                </div>
                              )}

                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                                <button
                                  onClick={() => setSelectedQuizIdx((prev) => Math.max(0, prev - 1))}
                                  disabled={selectedQuizIdx === 0}
                                  className="text-[10px] font-mono hover:text-cyan-400 disabled:opacity-30"
                                >
                                  Previous Question
                                </button>
                                <button
                                  onClick={() => setSelectedQuizIdx((prev) => Math.min(activeDoc.quizzes.length - 1, prev + 1))}
                                  disabled={selectedQuizIdx === activeDoc.quizzes.length - 1}
                                  className="text-[10px] font-mono hover:text-cyan-400 disabled:opacity-30"
                                >
                                  Next Question
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="glass-panel p-10 rounded-2xl border-white/5 bg-black/40 text-center opacity-50">
                          Upload or select a mock document on the left sidebar to generate summaries and flashcards.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 6: SMART EMAIL AGENT */}
              {activeTab === "emails" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">GMAIL AUTONOMOUS LINK</span>
                    <h3 className="text-xl font-extrabold text-white">Smart Email Agent (Inbox)</h3>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-xs font-bold font-mono text-cyan-400">Syncing active alerts inbox</span>
                      <span className="text-[10px] font-mono opacity-50 font-bold">Auto-scanned every 15s</span>
                    </div>

                    <div className="space-y-4">
                      {state.emails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${email.processed ? "bg-black/20 border-white/5 opacity-60" : "bg-white/5 border-cyan-500/20"}`}
                        >
                          <div className="space-y-1.5 flex-1 max-w-2xl">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${email.urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`} />
                              <strong className="text-xs text-white">{email.sender}</strong>
                              <span className="text-[10px] font-mono opacity-40 font-bold">| {email.date}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${email.urgency === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-white/50 border-white/5'}`}>
                                Urg Score: {email.urgencyScore}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-cyan-300 leading-tight">{email.subject}</h4>
                            <p className="text-[11px] opacity-75 font-sans leading-relaxed text-white">{email.body}</p>
                            <p className="text-[10px] font-mono text-cyan-400/90 leading-tight">
                              <strong>AI Diagnosis: </strong>{email.summary}
                            </p>
                          </div>

                          <div className="shrink-0 flex md:flex-col gap-2 items-end justify-center">
                            {email.processed ? (
                              <div className="text-[10px] font-mono text-green-400 font-bold flex items-center gap-1">
                                ✓ Action taken: {email.actionTaken}
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEmailAction(email.id, email.urgency === "critical" ? "prune" : "schedule")}
                                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-mono font-bold"
                                >
                                  {email.urgency === "critical" ? "Prune Milestones Scope" : "Auto-schedule Focus Slot"}
                                </button>
                                <button
                                  onClick={() => handleEmailAction(email.id, "ignore")}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-mono font-bold"
                                >
                                  Archive Alert
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: LIFE TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">CHRONOLOGICAL LANE</span>
                    <h3 className="text-xl font-extrabold text-white">Life Timeline & Execution Replay</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Visual chronological timeline */}
                    <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 block mb-2">Past, Present, & Forecasted Future</span>
                      
                      <div className="relative pl-6 border-l-2 border-white/5 space-y-8">
                        
                        {/* Future forecast */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white text-[9px]">F</span>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-purple-400 font-extrabold uppercase block">Forecasted Future (Next 2-5 Days)</span>
                            <h4 className="text-xs font-bold leading-tight text-white">Advanced AI Exam (Due in 44 hours)</h4>
                            <p className="text-[10px] opacity-70">
                              Stress indexes predicted to peak at 86% during evening revision slots.
                            </p>
                          </div>
                        </div>

                        {/* Present active status */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-white text-[9px] animate-ping" />
                          <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-white text-[9px]">P</span>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-cyan-400 font-extrabold uppercase block">Present Active commitments (Today)</span>
                            <h4 className="text-xs font-bold leading-tight text-white">Final Year Software project code Report (Due in 18 hours)</h4>
                            <p className="text-[10px] opacity-70">
                              Emergency scope reduction active. 3 focus Pomodoro sprints starting now.
                            </p>
                          </div>
                        </div>

                        {/* Past completed logs */}
                        <div className="relative opacity-60">
                          <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center font-bold text-white text-[9px]">P</span>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-white/50 font-extrabold uppercase block">Past Completed logs (Yesterday)</span>
                            <h4 className="text-xs font-bold leading-tight text-white">Reviewed Neural networks & backprop lecture guide</h4>
                            <p className="text-[10px] opacity-70">
                              Completed 2 focus sessions. Performance rate stable at 92%.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right: Real-time action replay */}
                    <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">AI EXECUTION TIMELINE (REPLAY)</span>
                      
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {state.replayLogs.map((log) => (
                          <div key={log.id} className="text-left text-[11px] border-b border-white/5 pb-2">
                            <div className="flex justify-between items-center gap-2 mb-0.5 font-mono text-[10px]">
                              <span className="font-bold text-cyan-400">[{log.agent}]</span>
                              <span className="opacity-40">{log.time}</span>
                            </div>
                            <h5 className="font-semibold text-white/90">{log.action}</h5>
                            <p className="text-[10px] text-cyan-300 opacity-90 leading-tight">
                              <strong>Impact: </strong>{log.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 8: RECOVERY CENTER */}
              {activeTab === "recovery" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 animate-pulse">EMERGENCY ACTIVE WARNING SYSTEM</span>
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                      Emergency Recovery Center
                      <button
                        onClick={() => setExplainTopic("recovery")}
                        className="text-white/40 hover:text-cyan-400 transition-all p-1 cursor-pointer"
                        title="Explain Recovery Center"
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                    </h3>
                  </div>

                  {/* High urgency red styling cockpit container */}
                  <div className="p-8 rounded-3xl border border-red-500/50 bg-[#160408]/60 text-left space-y-8 relative overflow-hidden shadow-2xl shadow-red-500/10">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-red-500/20 pb-6">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest block">EMERGENCY ALERTS OVERRIDE CONTROL</span>
                        <h4 className="text-lg font-extrabold text-white">CRITICAL ACTION PLAN FOR: FINAL YEAR PROJECT CODE</h4>
                      </div>
                      
                      <div className="font-mono text-center md:text-right shrink-0">
                        <span className="text-[10px] opacity-60 block uppercase">RESCUE COUNTDOWN TIMEOUT</span>
                        <span className="text-2xl font-extrabold text-red-500 tracking-wider animate-pulse">{emergencyCountdown}</span>
                      </div>
                    </div>

                    {/* Progress dials */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "TIME BUDGET REMAINING", val: "18 Hours", color: "text-red-400" },
                        { label: "PRUNED SCOPE COMPLETION", val: "65% Completed", color: "text-cyan-400" },
                        { label: "ESTIMATED SUCCESS RATE", val: "91% Probability", color: "text-green-400" },
                        { label: "CURRENT INTENSITY", val: "POMODORO RUNNING", color: "text-red-400 animate-pulse" }
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-black/40 border border-red-500/10 rounded-2xl text-center space-y-1">
                          <span className="text-[8px] font-mono opacity-50 block leading-tight">{item.label}</span>
                          <span className={`text-base font-extrabold ${item.color}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Active rescue roadmap steps */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">RESCUE ROADMAP STEP-BY-STEP</span>
                      
                      {activeTask?.recoveryPlan ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-5 bg-black/40 border border-red-500/10 rounded-2xl text-left space-y-3">
                            <span className="text-[9px] font-mono text-red-400 block font-bold">1. simplified Scope Checklists</span>
                            <ul className="space-y-2 text-[11px] leading-relaxed opacity-90 text-white">
                              {activeTask.recoveryPlan.simplifiedScope.map((scope, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-red-500 mt-0.5">▪</span>
                                  <span>{scope}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-5 bg-black/40 border border-red-500/10 rounded-2xl text-left space-y-3">
                            <span className="text-[9px] font-mono text-cyan-400 block font-bold">2. Focus Workslots Allocations</span>
                            <div className="space-y-2">
                              {activeTask.recoveryPlan.timeBlocks.map((block, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-black/20 p-2 rounded border border-white/5">
                                  <span className="font-mono text-cyan-400 font-bold">{block.time}</span>
                                  <span className="opacity-80 truncate max-w-[120px] text-white">{block.focus}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-5 bg-black/40 border border-red-500/10 rounded-2xl text-left space-y-3">
                            <span className="text-[9px] font-mono text-green-400 block font-bold">3. critical Path bottleneck</span>
                            <p className="text-[11px] leading-relaxed opacity-90 italic text-red-300">
                              {activeTask.recoveryPlan.criticalPath}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-black/20 border border-red-500/10 rounded-2xl text-center text-xs opacity-60">
                          No active emergency plan. Load a demo scenario to preview warning state recovery plans.
                        </div>
                      )}
                    </div>

                    {/* AI Recovery Coach chat logs */}
                    <div className="pt-4 border-t border-red-500/20 text-left space-y-3">
                      <span className="text-[9px] font-mono font-bold text-red-400 block">AI Recovery Coach Instructions</span>
                      <p className="text-xs opacity-85 leading-relaxed bg-black/30 p-4 rounded-xl border border-red-500/10 italic text-red-200">
                        "Your energy twin predictions forecast a fatigue drop by 11:00 PM. Execute the remaining code structures immediately. Slack alerts have been disabled automatically. Good luck."
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 9: AI MEMORY VAULT */}
              {activeTab === "memory" && (
                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">MEMORY DEEP RECALL</span>
                    <h3 className="text-xl font-extrabold text-white">AI Memory Vault</h3>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-xs font-bold font-mono text-cyan-400">Search Workspace Recall Logs</span>
                      <span className="text-[10px] font-mono opacity-50 font-bold">{state.memoryLogs.length} total entries</span>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-3.5 opacity-40" />
                      <input
                        type="text"
                        placeholder="Type queries: e.g. 'Stripe', 'Advisor', 'Slack', 'Syllabus'..."
                        value={memorySearch}
                        onChange={(e) => handleMemorySearchChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {filteredMemory.map((log) => (
                        <div key={log.id} className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-1.5 flex justify-between gap-4">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase text-white">
                              {log.category}
                            </span>
                            <p className="text-xs text-white opacity-90 mt-1 leading-relaxed">{log.content}</p>
                          </div>
                          <span className="text-[9px] font-mono opacity-40 text-right whitespace-nowrap pt-1">
                            {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                      {filteredMemory.length === 0 && (
                        <div className="text-center py-10 text-xs opacity-50">No search logs found. Try another query.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10: PRODUCTIVITY ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  
                  {/* Phase 5: Productivity Forecast Predictions Panels */}
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">AI PREDICTIVE DIAGNOSTICS</span>
                    <h3 className="text-xl font-extrabold text-white">Productivity Forecasts</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {state.forecasts.map((fc, i) => (
                      <div key={i} className="glass-panel p-5 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">Forecast: {fc.period}</span>
                        
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="opacity-60">SUCCESS RATE</span>
                            <span className="font-bold text-green-400">{fc.successRate}% Probability</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="opacity-60">BURNOUT RISK</span>
                            <span className="font-bold text-orange-400">{fc.burnoutRisk}% Forecast</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="opacity-60">DEADLINE SAFETY</span>
                            <span className="font-bold text-cyan-400">{100 - fc.deadlineRisk}% Safety</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-60">CALENDAR WINDOWS</span>
                            <span className="font-bold text-white">{fc.calendarHealth}% Health</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    
                    {/* Growth analytics chart */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">WEEKLY SYSTEM PRODUCTIVITY SCORE</span>
                      
                      <div className="h-[260px] w-full pt-4">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(state.analytics.length > 0 ? state.analytics : [
                              { name: "Mon", productivity: 40, growth: 10 },
                              { name: "Tue", productivity: 45, growth: 15 },
                              { name: "Wed", productivity: 50, growth: 18 },
                              { name: "Thu", productivity: 35, growth: 12 },
                              { name: "Fri", productivity: 75, growth: 30 }
                            ]) as any}>
                              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "#0d0e12", borderColor: "rgba(255,255,255,0.08)" }} />
                              <Bar dataKey="productivity" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Productivity Score" />
                              <Bar dataKey="growth" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Growth Rate %" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Deadline Success vs Study Hours charts */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">DEADLINE SUCCESS & FOCUS HOURS</span>
                      
                      <div className="h-[260px] w-full pt-4">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(state.analytics.length > 0 ? state.analytics : [
                              { name: "Mon", deadlineSuccess: 50, studyHours: 2, focusSessions: 1 },
                              { name: "Tue", deadlineSuccess: 55, studyHours: 3, focusSessions: 2 },
                              { name: "Wed", deadlineSuccess: 60, studyHours: 4, focusSessions: 2 },
                              { name: "Thu", deadlineSuccess: 45, studyHours: 1, focusSessions: 0 },
                              { name: "Fri", deadlineSuccess: 90, studyHours: 6, focusSessions: 4 }
                            ]) as any}>
                              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "#0d0e12", borderColor: "rgba(255,255,255,0.08)" }} />
                              <Line type="monotone" dataKey="deadlineSuccess" stroke="#22c55e" strokeWidth={2} name="Deadline Success Rate %" />
                              <Line type="monotone" dataKey="focusSessions" stroke="#f97316" strokeWidth={2} name="Focus Sessions Completed" />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 11: MY JOURNEY */}
              {activeTab === "journey" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4 text-left">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">Personal Growth Timeline & Insights</span>
                      <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                        My Personal Journey
                      </h3>
                    </div>
                    <button
                      onClick={handleStartDocumentary}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer border border-amber-400/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      Watch My Journey (Interactive Movie)
                    </button>
                  </div>

                  {/* Failure prevention visual grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "FAILURES PREVENTED", val: "6 Deadlines", desc: "Predicted overlaps defused", color: "text-red-400" },
                      { label: "TIME RESERVES SAVED", val: "18 Hours", desc: "Scope pruning gains", color: "text-cyan-400" },
                      { label: "INTERVIEWS PREPARED", val: "3 Interviews", desc: "Syllabi roadmaps generated", color: "text-green-400" },
                      { label: "ASSIGNMENTS COMPLETED", val: "21 Assignments", desc: "Copilot checklists synced", color: "text-purple-400" },
                      { label: "STRESS REDUCED", val: "27% Average", desc: "Digital Twin mental relief", color: "text-amber-400" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center space-y-1 hover:border-amber-500/20 transition-all">
                        <span className="text-[8px] font-mono opacity-50 block leading-tight">{card.label}</span>
                        <span className={`text-base font-extrabold ${card.color} block`}>{card.val}</span>
                        <span className="text-[9px] opacity-40 block">{card.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Journey Timeline nodes */}
                    <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 block">Chronicle of Achievements & Rescues</span>
                      
                      <div className="relative pl-6 border-l border-amber-500/20 space-y-6">
                        {[
                          { title: "Academic Rescue: AST Compiler Lab", desc: "Nova detected an impossible 12-hour workload in an 18-hour window. Auto-pruned milestones and scheduled 3 focus sessions, preventing critical failure.", status: "Prevented Failure", color: "bg-red-500" },
                          { title: "Graduation: Certified AI Mastery", desc: "Successfully completed all 13 interactive curriculum units in the Academy and achieved perfect performance metrics.", status: "Milestone", color: "bg-amber-500" },
                          { title: "Job Placement: Tech Mock Preparation", desc: "Compiled syllabus mock reviews and generated interview guides for front-end architecture checks.", status: "Completed", color: "bg-green-500" },
                          { title: "Executive Calibration: Board Pitch Deck", desc: "Identified dual overlaps in investor schedule. Resolved slots with automatic focus buffer allocations.", status: "Recovered", color: "bg-cyan-500" }
                        ].map((node, i) => (
                          <div key={i} className="relative">
                            <span className={`absolute -left-[30px] top-1.5 w-3 h-3 rounded-full ${node.color} ring-4 ring-black`} />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-cyan-400 font-extrabold uppercase">{node.status}</span>
                                <span className="text-[9px] opacity-35">• 2 days ago</span>
                              </div>
                              <h4 className="text-xs font-bold leading-tight text-white">{node.title}</h4>
                              <p className="text-[10px] opacity-70 leading-normal text-white">{node.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Personal Insights Observations */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 block">Digital Twin Observations</span>
                        
                        <div className="space-y-3">
                          {[
                            { text: "You achieve peak productivity after lunch (14:00 - 16:30). Prioritize critical tasks here.", tag: "Peak Hours", tagColor: "text-green-400 bg-green-500/10 border-green-500/20" },
                            { text: "Friday is forecast to be your least productive day. Secure calendar buffers early.", tag: "Delay Vector", tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                            { text: "Focus velocity drops after 90 continuous minutes of keyboard speed. Take short breaks.", tag: "Focus Decay", tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                            { text: "Morning interview preparation slots are linked to higher completion scores.", tag: "Confidence Boost", tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
                          ].map((obs, i) => (
                            <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1 text-[11px] leading-relaxed text-white">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${obs.tagColor}`}>
                                {obs.tag}
                              </span>
                              <p className="opacity-80 mt-1">{obs.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Smart Motivation Panel */}
                      <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 text-left space-y-2">
                        <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">SMART PERFORMANCE GUIDANCE</span>
                        <p className="text-[11px] leading-relaxed opacity-95 text-cyan-200 font-medium">
                          "Rahul, based on your metrics: starting your assignments now increases completion probability by 18%. Muting Slack early this week saved 3 focus hours. Excellent consistency!"
                        </p>
                      </div>

                      {/* Gratitude panel */}
                      <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 text-left space-y-2.5">
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block">A MESSAGE FROM NOVA</span>
                        <p className="text-[11px] leading-relaxed opacity-95 text-amber-200 italic font-medium">
                          "Thank you for trusting me. I am glad we completed today's goals together. Let's make tomorrow even more successful."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* AI Log Timeline */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Continuous AI brain thought logs</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">10 agents actively communicating</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[140px] overflow-y-auto pr-1">
              {state.logs.map((log) => (
                <div key={log.id} className="p-3 bg-black/20 border border-white/5 rounded-xl text-left space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-cyan-400 font-mono">[{log.agentName}]</span>
                    <span className="text-[8px] opacity-40 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] leading-normal opacity-75 text-white">{log.action}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* FLOATING VOICE ORB COMPANION WIDGET (VOICE AGENT 2.0) */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isVoiceOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-80 h-96 rounded-2xl border-white/10 shadow-2xl overflow-hidden flex flex-col mb-4 bg-black/90 text-left"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white font-mono">Voice Agent 2.0 Orb</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-green-400">ONLINE</span>
                </div>
              </div>

              {/* Speech Waveform Animation if speaking or playback active */}
              {(isVoiceListening || voicePlaybackTrack) && (
                <div className="h-10 bg-cyan-950/20 flex items-center justify-center gap-1 border-b border-white/5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((bar, i) => (
                    <div
                      key={i}
                      className="wave-bar animate-waveform"
                      style={{ animationDelay: `${i * 0.08}s`, height: voicePlaybackTrack ? '22px' : undefined }}
                    />
                  ))}
                </div>
              )}

              {/* Phase 5: Voice 2.0 Audio Briefing Player Widget */}
              <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono text-white">
                <span>🔊 AI AUDIO BRIEFINGS:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleToggleVoicePlayback("Daily briefing track")}
                    className={`px-2 py-0.5 rounded border transition-all ${voicePlaybackTrack === "Daily briefing track" ? "bg-red-500/20 text-red-400 border-red-500/30 font-bold" : "bg-white/5 border-white/5 hover:text-cyan-400"}`}
                  >
                    {voicePlaybackTrack === "Daily briefing track" ? "Stop" : "Play Briefing"}
                  </button>
                  <button
                    onClick={() => handleToggleVoicePlayback("Mock interview track")}
                    className={`px-2 py-0.5 rounded border transition-all ${voicePlaybackTrack === "Mock interview track" ? "bg-red-500/20 text-red-400 border-red-500/30 font-bold" : "bg-white/5 border-white/5 hover:text-cyan-400"}`}
                  >
                    {voicePlaybackTrack === "Mock interview track" ? "Stop" : "Play Mock Guidance"}
                  </button>
                </div>
              </div>

              {/* Chat Message Logs with query search */}
              <div className="p-2 border-b border-white/5 relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-3.5 opacity-30 text-white" />
                <input
                  type="text"
                  placeholder="Filter dialogue logs..."
                  value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                {voiceLogs
                  .filter((log) => log.text.toLowerCase().includes(voiceSearchQuery.toLowerCase()))
                  .map((log, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] p-2.5 rounded-xl text-[11px] leading-relaxed text-left ${log.sender === "user" ? "bg-cyan-600 text-white self-end" : "bg-white/5 border border-white/5 self-start text-cyan-300"}`}
                    >
                      {log.text}
                    </div>
                  ))}
                {isVoiceListening && (
                  <div className="self-start bg-white/5 p-2.5 rounded-xl border border-white/5 text-[11px] text-cyan-300 italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Assistant is thinking...
                  </div>
                )}
              </div>

              {/* Input Form with preset voice suggestions */}
              <div className="p-2 bg-black/40 border-t border-white/5 flex flex-wrap gap-1.5 justify-center">
                {[
                  { label: "Optimize Week", query: "Optimize my week schedule" },
                  { label: "Pomodoro", query: "Start pomodoro focus shield" },
                  { label: "Corporate", query: "Activate professional crisis" }
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleVoiceSubmit(undefined, s.query)}
                    className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/5 hover:bg-cyan-950/30 text-cyan-400 border border-white/5"
                  >
                    "{s.label}"
                  </button>
                ))}
              </div>

              {!speechSupported && (
                <div className="px-3 py-1 bg-amber-950/30 border-t border-amber-500/20 text-[9px] text-amber-300 font-mono text-left">
                  Note: Web Speech API unsupported in this browser. Text command fallback active.
                </div>
              )}

              <form onSubmit={handleVoiceSubmit} className="p-3 border-t border-white/5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className={`p-2 rounded-lg border transition-all ${isVoiceListening ? "bg-red-600 text-white animate-pulse border-red-500" : "bg-white/5 border-white/10 text-cyan-400 hover:bg-cyan-950/40"}`}
                  title="Speak via Web Speech API"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  placeholder={isVoiceListening ? "Listening to microphone..." : "Ask Voice OS (or speak)..."}
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="submit"
                  className="p-2 bg-gradient-to-tr from-cyan-500 to-purple-600 hover:shadow-cyan-500/20 hover:shadow-lg rounded-lg text-white transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Float Orb toggle */}
        <button
          id="voice-orb-btn"
          onClick={() => setIsVoiceOpen(!isVoiceOpen)}
          className={`w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 hover:shadow-cyan-500/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white text-base shadow-xl orb-pulse ${isVoiceOpen ? "rotate-45" : ""}`}
        >
          {isVoiceOpen ? "✖" : "🎙"}
        </button>
      </div>

      {/* PHASE 5: AI THINKING ENGINE TRANSITIONS MODAL */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl border-white/10 bg-black/90 text-center space-y-6 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-scan" />
              
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <Brain className="w-10 h-10 text-cyan-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full animate-ping" />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-white font-mono tracking-wider uppercase">AI Reasoning Core Active</h4>
                <p className="text-xs opacity-60">Consulting parameters, evaluating scheduler overrides...</p>
              </div>

              <div className="space-y-2 pt-2 text-left font-mono text-[10px] text-cyan-300 max-w-[280px] mx-auto">
                {thinkingStagesLogs.map((logStr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx === thinkingStage ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    ) : (
                      <Check className="w-3 h-3 text-green-400" />
                    )}
                    <span className={idx === thinkingStage ? "text-white font-bold" : "opacity-50"}>{logStr}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 5: CINEMATIC REPLAY PLAYER MODAL */}
      <AnimatePresence>
        {isReplayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setIsReplayOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-2xl rounded-3xl border-white/10 bg-black/95 overflow-hidden text-left p-6 shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <History className="w-5 h-5 text-purple-400" />
                  <span className="font-extrabold text-sm font-mono uppercase tracking-wider">Cinematic Activity Replay</span>
                </div>
                <button
                  onClick={() => setIsReplayOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Narration voice simulation bubble */}
              <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 animate-pulse">
                  🎙
                </div>
                <div className="text-xs italic text-purple-200 font-sans leading-relaxed">
                  "{replayNarrativeText}"
                </div>
              </div>

              {/* Progress bar steps */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase block">Day Activity sequence</span>
                
                <div className="relative pl-6 border-l border-white/10 space-y-6 text-xs">
                  {[
                    { stepIdx: 0, time: "09:00 AM", title: "Syllabus Added", desc: "Syllabus parsed; study milestones successfully logged." },
                    { stepIdx: 1, time: "10:15 AM", title: "Failure Risk Flagged by Twin", desc: "Twin forecast warning active for project codes." },
                    { stepIdx: 2, time: "11:02 AM", title: "Recovery Plan Created", desc: "Formulated simplified scopes; disabled slack popups." },
                    { stepIdx: 3, time: "11:30 AM", title: "Meetings Rescheduled to Tomorrow", desc: "De-conflicted calendar sync overlaps." },
                    { stepIdx: 4, time: "01:00 PM", title: "Pomodoro started", desc: "Focus coach shield timer initiated." },
                    { stepIdx: 5, time: "04:30 PM", title: "LifeScore Improved to 78", desc: "Optimizations logged; stress levels lowered." }
                  ].map((item) => {
                    const isPassed = replayStep >= item.stepIdx;
                    return (
                      <div key={item.stepIdx} className={`relative transition-all duration-300 ${isPassed ? "opacity-100" : "opacity-20"}`}>
                        <div className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black font-mono transition-all ${isPassed ? "bg-purple-400" : "bg-white/10"}`}>
                          {item.stepIdx + 1}
                        </div>
                        
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono text-purple-400 block font-bold">{item.time} — {item.title}</span>
                          <p className="text-[11px] opacity-80 leading-normal text-white">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RAYCAST COMMAND PALETTE OVERLAY (Ctrl+K) */}
      <AnimatePresence>
        {isPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="glass-panel w-full max-w-xl rounded-2xl border-white/10 shadow-2xl bg-black/90 overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Search className="w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Type a command: 'student', 'professional', 'optimize', 'pomodoro'..."
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder-white/30 focus:outline-none text-sm"
                  autoFocus
                />
              </div>

              <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-40 block px-2 mb-2">Available System Commands</span>
                
                {[
                  { id: "student", label: "🎓 Load Student Crisis Scenario", desc: "Simulate academic deadline pressure with Recovery plans active." },
                  { id: "professional", label: "💼 Load Corporate Crisis Scenario", desc: "Sync client presentation review deck with high risk parameters." },
                  { id: "entrepreneur", label: "🚀 Load Startup Pitch Crisis Scenario", desc: "Initiate funding pitch deck cap table reviews." },
                  { id: "optimize", label: "⚡ Run Schedule Optimizer Action", desc: "Shift conflicting calendar event slots to clear focus hours." },
                  { id: "pomodoro", label: "🛡️ Activate Focus Shield (Pomodoro)", desc: "Start a 25-minute Pomodoro coach session." },
                  { id: "emergency", label: "🚨 Force Red Alert Warning state", desc: "Lock command dashboard interfaces into Warning overrides." },
                  { id: "tab-agents", label: "🧠 Open AI Agents Directory Tab", desc: "Navigate directly to 10 agent status boards." },
                  { id: "tab-twin", label: "🧬 Open Digital Twin Predictions Tab", desc: "Navigate to learned stress graphs and sleeping cycle loops." },
                  { id: "replay", label: "🎬 Cinematic Replay My Day", desc: "Narrate how the AI intervened throughout the day." }
                ].filter(cmd => cmd.label.toLowerCase().includes(paletteQuery.toLowerCase()) || cmd.id.toLowerCase().includes(paletteQuery.toLowerCase()))
                .map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => executeCommand(cmd.id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all flex items-center justify-between border border-transparent hover:border-white/5"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{cmd.label}</span>
                      <span className="text-[10px] opacity-60 block">{cmd.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingCompanion
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        state={state}
        setState={setState}
        isVoiceOpen={isVoiceOpen}
        setIsVoiceOpen={setIsVoiceOpen}
        handleOptimizeMyWeek={handleOptimizeMyWeek}
        handleStartReplay={handleStartReplay}
        handleLoadDemo={handleLoadDemo}
        explainTopic={explainTopic}
        setExplainTopic={setExplainTopic}
        triggerJudgeTour={triggerJudgeTour}
        setTriggerJudgeTour={setTriggerJudgeTour}
      />

      {/* 12. HACKATHON AI DOCUMENTARY MODE (WATCH MY JOURNEY MOVIE) */}
      <AnimatePresence>
        {documentaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none text-white"
          >
            {/* Ambient scanlines */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40 animate-scan" />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-black/80 border border-amber-500/20 rounded-3xl p-8 space-y-6 shadow-2xl shadow-amber-500/5 text-white"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">Interactive AI Movie — Rahul's Journey</span>
                </div>
                <button
                  onClick={() => {
                    setDocumentaryOpen(false);
                    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className="px-2.5 py-1 rounded bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase font-bold cursor-pointer hover:bg-red-600/30"
                >
                  Exit Movie
                </button>
              </div>

              {/* Movie slides visual screen */}
              <div className="h-[220px] flex flex-col items-center justify-center space-y-4 my-8">
                {documentaryStep === 0 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">🎒</span>
                    <h4 className="text-base font-extrabold text-amber-200">Rahul's Initial Conflict Backlog</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Rahul started with 18 hours until a compiler parser lab deadline, suffering from a 92% stress index and a low 58 LifeScore.</p>
                  </div>
                )}
                {documentaryStep === 1 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">📄</span>
                    <h4 className="text-base font-extrabold text-cyan-200">Syllabus PDF Checklist Analysis</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Smart Document Copilot parsed his compiler guidelines to generate interactive study milestones automatically.</p>
                  </div>
                )}
                {documentaryStep === 2 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">🚨</span>
                    <h4 className="text-base font-extrabold text-red-300">Emergency Cockpit Overrides</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Urgency scores spiked to 95%. Nova activated Red Alert, muted distracting Slack warnings, and blocked priority hours.</p>
                  </div>
                )}
                {documentaryStep === 3 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">📅</span>
                    <h4 className="text-base font-extrabold text-green-300">Conflict Slot De-Congestion</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Scheduler Copilot executed optimization solvers to shift overlapping mentorship calls, locking the focus hours.</p>
                  </div>
                )}
                {documentaryStep === 4 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">🧬</span>
                    <h4 className="text-base font-extrabold text-purple-300">Digital Twin Behavioral Learning</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Rahul completed Next.js prep and solved 15 practice items, boosting performance indexes and decreasing stress to 35%.</p>
                  </div>
                )}
                {documentaryStep === 5 && (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-4xl">🎉</span>
                    <h4 className="text-base font-extrabold text-emerald-300">Ecosystem Rescue: Graduation Complete!</h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">Schedules fully optimized. Stress resolved, LifeScore boosted to 95. Proactive prevention of human failure accomplished.</p>
                  </div>
                )}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${documentaryStep === idx ? "bg-amber-400 scale-125 shadow shadow-amber-400" : "bg-white/10"}`}
                  />
                ))}
              </div>

              {/* Audio playback notification banner */}
              <div className="text-[9px] font-mono text-amber-300 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 max-w-xs mx-auto animate-pulse flex items-center justify-center gap-1.5 mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>📢 NOVA AI NARRATING INTERACTIVE STORY MODE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIFESCORE EVOLUTION INDEX MODAL */}
      <AnimatePresence>
        {lifeScoreExplainOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setLifeScoreExplainOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-xl rounded-3xl border-white/10 bg-black/95 text-left p-6 shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span className="font-extrabold text-sm font-mono uppercase tracking-wider">LifeScore Evolution Index</span>
                </div>
                <button
                  onClick={() => setLifeScoreExplainOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
                <div className="text-center font-mono">
                  <span className="text-[10px] opacity-60 block uppercase">CURRENT SCORE</span>
                  <span className="text-4xl font-extrabold text-cyan-400">{state.lifeScore}</span>
                  <span className="text-[9px] text-green-400 block font-bold">/ 100 MAX</span>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-white block">Deterministic Composite Metric</span>
                  <p className="opacity-75 leading-relaxed text-white">
                    Calculated from completion rate (40%), task adherence (30%), risk penalty (20%), and overdue debt (10%).
                  </p>
                </div>
              </div>

              {/* Mathematical Breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">MATHEMATICAL SCORE BREAKDOWN</span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <span className="opacity-70">Base Score</span>
                    <span className="font-bold text-white">50</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <span className="opacity-70">Completion Bonus</span>
                    <span className="font-bold text-green-400">+{state.lifeScoreDetails?.completionBonus || 20}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <span className="opacity-70">Adherence Boost</span>
                    <span className="font-bold text-cyan-400">+{state.lifeScoreDetails?.adherenceBonus || 15}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <span className="opacity-70">Risk / Overdue Penalty</span>
                    <span className="font-bold text-red-400">-{Math.round((state.lifeScoreDetails?.riskPenalty || 0) + (state.lifeScoreDetails?.overduePenalty || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Score History Trail */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-50 block">RECENT SCORE EVENT DELTAS</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {state.scoreHistory.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="font-bold text-white block">{s.reason}</span>
                        <span className="text-[8px] font-mono opacity-40">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="font-mono font-extrabold text-cyan-400 text-xs px-2 py-0.5 rounded bg-white/5">
                        {s.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOCUMENT INGESTION CONFIRMATION MODAL */}
      <AnimatePresence>
        {docConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-xl rounded-3xl border-white/10 bg-black/95 text-left p-6 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="font-extrabold text-sm font-mono uppercase tracking-wider">Confirm Extracted Document Goals</span>
                </div>
                <button
                  onClick={() => setDocConfirmOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">SOURCE FILE: {pendingDocName}</span>
                <p className="text-xs opacity-80 text-white">
                  The document parser extracted the following deliverables and deadlines. Confirm to add them to your active schedule:
                </p>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {pendingExtractedTasks.map((task, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{task.title}</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono opacity-60">
                      <span>Effort: {task.estimatedEffort}h</span>
                      <span>Due: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setDocConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDocTasks}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-cyan-500/30 text-xs font-bold text-white transition-all shadow-md"
                >
                  Confirm &amp; Add to Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Confetti Canvas Layer */}
      <canvas id="local-confetti-canvas" className="fixed inset-0 pointer-events-none z-[60] w-full h-full" />

    </div>
  );
}
