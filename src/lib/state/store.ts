import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  RiskLevel,
  RecoveryPlan,
  TimeBlock,
  JournalEvent,
  DailyBriefingData,
  LifeScoreBreakdown,
  RiskAssessment,
  PriorityAssessment,
  FailureAssessment,
  ReplanningResult
} from "../agents/types";
import {
  evaluateFailureRisk,
  evaluateTaskPriority,
  generateRecoveryPlan,
  detectPlanFailure,
  executeAutoReplan,
  calculateLifeScore,
  generateDailyBriefing
} from "../agents/orchestrator";

// Re-export core types for backward compatibility
export type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  RiskLevel,
  RecoveryPlan,
  TimeBlock,
  JournalEvent,
  DailyBriefingData,
  LifeScoreBreakdown,
  RiskAssessment,
  PriorityAssessment,
  FailureAssessment,
  ReplanningResult
};

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  isConflict: boolean;
  type?: "focus" | "deadline" | "meeting" | "personal";
}

export interface TwinInsight {
  id: string;
  text: string;
  category: "study" | "sleep" | "focus" | "meeting" | "procrastination";
  confidence: number;
}

export interface DigitalTwin {
  peakHours: string;
  sleepStart: string;
  sleepEnd: string;
  delayLikelihood: number; // percentage
  workStyle: string;
  completionRate: number; // percentage
  attentionSpan: string;
  preferredLanguage: string;
  typingSpeed: number; // WPM
  taskSpeed: string;
  avgDelay: number; // hours
  stress: number; // 0-100
  focus: number; // 0-100
  mood: string;
  learningSpeed: string;
  predictions: {
    metric: string;
    value: string;
    confidence: number;
  }[];
  insights: TwinInsight[];
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: "thinking" | "running" | "done" | "idle" | "planning" | "executing" | "monitoring" | "completed";
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  summary: string;
  deadlines: string[];
  tasks: string[];
  quizzes: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
  flashcards: {
    front: string;
    back: string;
  }[];
  suggestedPriorities: string[];
}

export interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  urgency: "low" | "medium" | "high" | "critical";
  urgencyScore: number;
  summary: string;
  actionTaken: string;
  associatedTaskId?: string;
  processed: boolean;
}

export interface MeetingItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string[];
  summary: string;
  actionItems: string[];
}

export interface AnalyticsData {
  name: string;
  productivity: number;
  growth: number;
  deadlineSuccess: number;
  studyHours: number;
  focusSessions: number;
  stress: number;
  burnout: number;
}

export interface ForecastItem {
  period: "Tomorrow" | "This Week" | "Next Month";
  successRate: number;
  burnoutRisk: number;
  deadlineRisk: number;
  readiness: number;
  calendarHealth: number;
}

export interface ScoreChange {
  val: number;
  reason: string;
  timestamp: string;
}

export interface Copilot {
  id: string;
  name: string;
  role: string;
  status: "ONLINE" | "STANDBY" | "ACTIVE" | "OPTIMIZING" | "COLLABORATING" | "LEARNING";
  mission: string;
  confidence: number;
  lastActivity: string;
  activeTasksCount: number;
  completionRate: number;
  gradient: string;
  iconName: string;
}

export interface MarketplaceCopilot {
  id: string;
  name: string;
  desc: string;
  category: string;
  installed: boolean;
}

export interface AppState {
  isDemoMode: boolean;
  demoProfile: "student" | "professional" | "entrepreneur" | "none";
  tasks: Task[];
  events: CalendarEvent[];
  twin: DigitalTwin;
  logs: AgentLog[];
  emergencyMode: boolean;
  streak: number;
  productivityScore: number;
  focusScore: number;
  burnoutRisk: number;
  lifeScore: number;
  lifeScoreDetails?: LifeScoreBreakdown;
  scoreHistory: ScoreChange[];
  forecasts: ForecastItem[];
  
  // Real Recovery Engine state
  activePlan?: RecoveryPlan;
  previousPlan?: RecoveryPlan;
  replanningHistory?: ReplanningResult[];
  lastFailureAssessment?: FailureAssessment;
  
  // Expanded Ecosystem States
  emails: EmailItem[];
  documents: DocumentItem[];
  meetings: MeetingItem[];
  analytics: AnalyticsData[];
  memoryLogs: JournalEvent[];
  dailyBriefing: DailyBriefingData;
  replayLogs: {
    id: string;
    time: string;
    agent: string;
    action: string;
    impact: string;
  }[];

  // Autonomous Copilots Ecosystem
  copilots: Copilot[];
  activeCopilotId: string | null;
  marketplaceCopilots: MarketplaceCopilot[];
  healthState: {
    waterIntakeGrams: number;
    stressLevel: number;
    focusMinutes: number;
    activeBreakLevel: string;
  };
  financialState: {
    bills: Array<{ id: string; name: string; amount: number; dueDate: string; category: string; paid: boolean }>;
    subscriptions: Array<{ id: string; name: string; amount: number; renewDate: string; category: string; active: boolean }>;
    monthlyForecast: { expenses: number; savings: number };
  };
  solvedDsaCount: number;
}

export const getInitialCopilots = (): Copilot[] => [
  {
    id: "student",
    name: "Student Copilot",
    role: "Ultimate Academic Assistant",
    status: "ONLINE",
    mission: "Decompose assignments, map study timetables, and monitor exam readiness.",
    confidence: 96,
    lastActivity: "System idle. Awaiting academic trigger.",
    activeTasksCount: 0,
    completionRate: 92,
    gradient: "from-cyan-500 to-blue-600",
    iconName: "GraduationCap"
  },
  {
    id: "professional",
    name: "Professional Copilot",
    role: "Executive Assistant",
    status: "ONLINE",
    mission: "Transcribe discussions, extract action deliverables, and draft agendas.",
    confidence: 94,
    lastActivity: "Standing by. Inbox prioritized.",
    activeTasksCount: 0,
    completionRate: 88,
    gradient: "from-blue-500 to-indigo-600",
    iconName: "Briefcase"
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur Copilot",
    role: "Startup Advisor",
    status: "ONLINE",
    mission: "Track OKRs, audit fundraising timelines, and generate pitch checklists.",
    confidence: 92,
    lastActivity: "Standing by. Product roadmap initialized.",
    activeTasksCount: 0,
    completionRate: 85,
    gradient: "from-purple-500 to-pink-600",
    iconName: "Zap"
  },
  {
    id: "health",
    name: "Health & Wellbeing Copilot",
    role: "Burnout Prevention Specialist",
    status: "ONLINE",
    mission: "Monitor stress indices, trigger water notifications, and track break counts.",
    confidence: 97,
    lastActivity: "Water balance logged.",
    activeTasksCount: 0,
    completionRate: 94,
    gradient: "from-teal-400 to-emerald-600",
    iconName: "Activity"
  },
  {
    id: "financial",
    name: "Financial Copilot",
    role: "Liquidity Guard & Due Planner",
    status: "ONLINE",
    mission: "Audit active subscriptions, trace utilities due dates, and forecast savings.",
    confidence: 95,
    lastActivity: "Verified subscription log. Rent paid.",
    activeTasksCount: 0,
    completionRate: 91,
    gradient: "from-yellow-500 to-amber-600",
    iconName: "CreditCard"
  },
  {
    id: "document",
    name: "Smart Document Copilot",
    role: "Multi-Format PDF Analyzer",
    status: "ONLINE",
    mission: "Extract schedules, construct flashcard nodes, and analyze DOCX/Images.",
    confidence: 98,
    lastActivity: "File scanner initialized.",
    activeTasksCount: 0,
    completionRate: 95,
    gradient: "from-emerald-400 to-green-600",
    iconName: "FileText"
  },
  {
    id: "email",
    name: "Email Copilot",
    role: "Gmail Pipeline Manager",
    status: "ONLINE",
    mission: "Classify incoming mail tags, detect schedules, and outline response drafts.",
    confidence: 91,
    lastActivity: "Scan complete. No high-urgency notifications.",
    activeTasksCount: 0,
    completionRate: 86,
    gradient: "from-rose-500 to-red-600",
    iconName: "Inbox"
  },
  {
    id: "voice",
    name: "Voice Copilot",
    role: "Vocal Command Coordinator",
    status: "ONLINE",
    mission: "Process natural commands, output summaries, and direct active tabs.",
    confidence: 96,
    lastActivity: "Listening for trigger prompt...",
    activeTasksCount: 0,
    gradient: "from-cyan-400 to-purple-500",
    iconName: "Mic",
    completionRate: 92
  },
  {
    id: "twin",
    name: "Digital Twin Copilot",
    role: "Behavioral Predictor Advisor",
    status: "ONLINE",
    mission: "Generate daily insights, identify peak focus loops, and recommend pacing.",
    confidence: 93,
    lastActivity: "Pacing parameters recalculated.",
    activeTasksCount: 0,
    gradient: "from-indigo-400 to-pink-500",
    iconName: "UserCheck",
    completionRate: 90
  },
  {
    id: "recovery",
    name: "Recovery Copilot",
    role: "Emergency Timeline Reallocator",
    status: "ONLINE",
    mission: "Prune secondary meetings, compress timelines, and draft emergency plans.",
    confidence: 95,
    lastActivity: "Backlog checks complete. Risk levels stable.",
    activeTasksCount: 0,
    gradient: "from-red-600 to-orange-600",
    iconName: "ShieldAlert",
    completionRate: 93
  },
  {
    id: "coach",
    name: "Life Coach Copilot",
    role: "Motivational Performance Coach",
    status: "ONLINE",
    mission: "Track long-term habits, suggest challenges, and narrate daily briefings.",
    confidence: 93,
    lastActivity: "Daily brief compiled.",
    activeTasksCount: 0,
    gradient: "from-amber-400 to-orange-500",
    iconName: "Award",
    completionRate: 89
  }
];

export const getInitialMarketplace = (): MarketplaceCopilot[] => [
  { id: "fitness", name: "Fitness & Nutrition Copilot", desc: "Sync workout schedules, analyze calorie intakes, and automatically generate recovery plans.", category: "Health & Fitness", installed: false },
  { id: "travel", name: "Autonomous Travel Copilot", desc: "Auto-scan flight bookings, prioritize packing lists, and dynamically shift calendar timezones.", category: "Productivity", installed: false },
  { id: "legal", name: "Legal Document Auditor", desc: "Audit contract liability clauses, extract critical signing limits, and schedule review blocks.", category: "Professional", installed: false },
  { id: "healthcare", name: "Chronic Health & Med Companion", desc: "Track prescription timelines, monitor fatigue forecasts, and notify family channels.", category: "Health & Wellbeing", installed: false },
  { id: "career", name: "Resume & Career Copilot", desc: "Build tailored resume structures, mock technical screenings, and alert on application openings.", category: "Professional", installed: false },
  { id: "language", name: "Conversational Language Tutor", desc: "Generate daily vocabulary quizzes, correct voice pronunciation errors, and map learning graphs.", category: "Education", installed: false }
];

export const getInitialState = (): AppState => {
  const initialHistory: ScoreChange[] = [
    { val: 85, reason: "Initial workspace created.", timestamp: new Date().toISOString() }
  ];
  const initialLifeScore = calculateLifeScore([], 0, 0, initialHistory);
  const initialBriefing = generateDailyBriefing([], "morning", "Hemanth");

  return {
    isDemoMode: false,
    demoProfile: "none",
    tasks: [],
    events: [],
    lifeScore: initialLifeScore.currentScore,
    lifeScoreDetails: initialLifeScore,
    scoreHistory: initialHistory,
    twin: {
      peakHours: "4:00 PM - 6:00 PM",
      sleepStart: "11:00 PM",
      sleepEnd: "7:00 AM",
      delayLikelihood: 15,
      workStyle: "Structured morning execution, steady work rate.",
      completionRate: 92,
      attentionSpan: "45 mins",
      preferredLanguage: "English",
      typingSpeed: 75,
      taskSpeed: "Fast",
      avgDelay: 1.2,
      stress: 25,
      focus: 88,
      mood: "Focused",
      learningSpeed: "High",
      predictions: [
        { metric: "Best study time", value: "9:00 AM - 11:30 AM", confidence: 94 },
        { metric: "Best interview time", value: "2:00 PM - 4:00 PM", confidence: 89 },
        { metric: "Burnout forecast", value: "Low burnout indicator for Q3", confidence: 91 }
      ],
      insights: [
        { id: "ti-1", text: "Morning hours produce peak productivity yields.", category: "focus", confidence: 92 },
        { id: "ti-2", text: "Attention capacity collapses after 8:00 PM.", category: "procrastination", confidence: 88 }
      ]
    },
    logs: [
      {
        id: "log-1",
        agentName: "Orchestrator",
        action: "LifeSaver X initialized. Ready for task input.",
        timestamp: new Date().toISOString(),
        status: "idle",
      },
    ],
    emergencyMode: false,
    streak: 1,
    productivityScore: 85,
    focusScore: 90,
    burnoutRisk: 22,
    emails: [],
    documents: [],
    meetings: [],
    analytics: [
      { name: "Mon", productivity: 75, growth: 20, deadlineSuccess: 80, studyHours: 3, focusSessions: 3, stress: 30, burnout: 20 },
      { name: "Tue", productivity: 80, growth: 25, deadlineSuccess: 85, studyHours: 4, focusSessions: 4, stress: 25, burnout: 20 },
      { name: "Wed", productivity: 85, growth: 28, deadlineSuccess: 90, studyHours: 5, focusSessions: 4, stress: 20, burnout: 15 }
    ],
    forecasts: [
      { period: "Tomorrow", successRate: 92, burnoutRisk: 25, deadlineRisk: 10, readiness: 88, calendarHealth: 90 },
      { period: "This Week", successRate: 88, burnoutRisk: 30, deadlineRisk: 15, readiness: 85, calendarHealth: 85 },
      { period: "Next Month", successRate: 85, burnoutRisk: 35, deadlineRisk: 20, readiness: 82, calendarHealth: 80 }
    ],
    memoryLogs: [
      {
        id: "m-init",
        timestamp: new Date().toISOString(),
        category: "System Insight",
        title: "Workspace Initialized",
        content: "LifeSaver X mission control activated in real user mode. All engines ready."
      }
    ],
    dailyBriefing: initialBriefing,
    replayLogs: [],
    copilots: getInitialCopilots(),
    activeCopilotId: null,
    marketplaceCopilots: getInitialMarketplace(),
    healthState: {
      waterIntakeGrams: 0,
      stressLevel: 25,
      focusMinutes: 0,
      activeBreakLevel: "No break suggested yet"
    },
    financialState: {
      bills: [
        { id: "bill-1", name: "Rent Payment", amount: 1200, dueDate: "2026-07-01", category: "Housing", paid: false },
        { id: "bill-2", name: "Electricity Utility", amount: 150, dueDate: "2026-07-05", category: "Utilities", paid: false }
      ],
      subscriptions: [
        { id: "sub-1", name: "Adobe Creative Cloud", amount: 55, renewDate: "2026-07-15", category: "Design", active: true },
        { id: "sub-2", name: "AWS Cloud Hosting", amount: 120, renewDate: "2026-07-20", category: "Development", active: true }
      ],
      monthlyForecast: {
        expenses: 1525,
        savings: 500
      }
    },
    solvedDsaCount: 0
  };
};

// ==========================================
// PERSISTENCE ENGINE (LocalStorage)
// ==========================================
const USER_STORAGE_KEY = "lifesaver_x_user_state_v1";

export function loadPersistedState(): AppState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    const initial = getInitialState();

    // Deep merge to ensure no missing properties
    const state: AppState = {
      ...initial,
      ...parsed,
      isDemoMode: false,
      demoProfile: "none",
      copilots: initial.copilots.map((cp) => {
        const found = (parsed.copilots || []).find((p: any) => p.id === cp.id);
        return found ? { ...cp, ...found } : cp;
      })
    };

    // Recompute dynamic state on load to ensure absolute mathematical sync
    return refreshComputedState(state);
  } catch (err) {
    console.warn("Failed to load persisted state from localStorage:", err);
    return getInitialState();
  }
}

export function savePersistedState(state: AppState): void {
  if (typeof window === "undefined") return;
  // CRITICAL: NEVER persist demo state over user data
  if (state.isDemoMode) return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save state to localStorage:", err);
  }
}

export function resetUserState(): AppState {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  }
  return getInitialState();
}

// ==========================================
// REFRESH COMPUTED STATE
// ==========================================
export function refreshComputedState(state: AppState): AppState {
  const risk = evaluateFailureRisk(state.tasks);
  
  // Update priority and risk fields on each task deterministically
  const updatedTasks = state.tasks.map((task) => {
    const priorityAssessment = evaluateTaskPriority(task, state.tasks);
    const taskRisk = evaluateFailureRisk([task]);
    return {
      ...task,
      priorityScore: priorityAssessment.priorityScore,
      riskScore: taskRisk.riskScore,
      riskLevel: taskRisk.riskLevel,
      riskReason: taskRisk.riskReasons[0] || "Steady progress."
    };
  });

  const lifeScoreDetails = calculateLifeScore(
    updatedTasks,
    0,
    0,
    state.scoreHistory
  );

  const dailyBriefing = generateDailyBriefing(
    updatedTasks,
    state.dailyBriefing?.mode || "morning",
    "Hemanth"
  );

  const emergencyMode = risk.riskLevel === "red" || risk.riskScore >= 75;

  return {
    ...state,
    tasks: updatedTasks,
    emergencyMode,
    lifeScore: lifeScoreDetails.currentScore,
    lifeScoreDetails,
    dailyBriefing,
    productivityScore: Math.min(100, Math.max(10, 100 - Math.round(risk.riskScore * 0.4))),
    focusScore: Math.min(100, Math.max(10, 95 - (emergencyMode ? 25 : 5))),
    burnoutRisk: Math.min(100, Math.max(5, Math.round(risk.riskScore * 0.9)))
  };
}

// ==========================================
// HACKATHON DEMO DATA PREPOPULATE (ISOLATED)
// ==========================================
export const getDemoData = (profile: "student" | "professional" | "entrepreneur"): AppState => {
  const base = getInitialState();
  const now = new Date();
  
  const getRelativeISO = (hoursDiff: number) => {
    const d = new Date(now);
    d.setHours(d.getHours() + hoursDiff);
    return d.toISOString();
  };

  let demoTasks: Task[] = [];
  let demoEvents: CalendarEvent[] = [];
  let demoLogs: AgentLog[] = [];
  let demoMemory: JournalEvent[] = [];

  if (profile === "student") {
    demoTasks = [
      {
        id: "student-1",
        title: "Final Year Software Engineering Project Code & Report",
        deadline: getRelativeISO(18), // 18 hours
        estimated_minutes: 16 * 60, // 16 hours
        priority: "critical",
        status: "todo",
        category: "student",
        created_at: getRelativeISO(-48),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo",
        explainability: {
          why: "Deadline is within 18 hours, requiring 16 effort hours, leaving an 8-hour schedule deficit.",
          evidence: "Historical twin behavioral data indicates a delay rate of 84% under evening slots.",
          confidence: 98,
          alternatives: "Trim minor slides layouts, request advisor extensions, or deploy static mockup datasets.",
          outcome: "Pruning visual slide transitions secures 91% expected completion rates."
        }
      },
      {
        id: "student-2",
        title: "Stripe Software Engineer Mock Interview Preparation",
        deadline: getRelativeISO(14), // tomorrow morning
        estimated_minutes: 3 * 60, // 3 hours
        priority: "high",
        status: "todo",
        category: "student",
        created_at: getRelativeISO(-24),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      },
      {
        id: "student-3",
        title: "Optional Documentation Polish & Style Refactoring",
        deadline: getRelativeISO(20),
        estimated_minutes: 2 * 60,
        priority: "low",
        status: "todo",
        category: "student",
        created_at: getRelativeISO(-12),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      }
    ];

    demoEvents = [
      {
        id: "student-ev-1",
        title: "Project Progress Sync Presentation",
        start: getRelativeISO(2),
        end: getRelativeISO(3.5),
        isConflict: true,
        type: "meeting"
      }
    ];

    demoLogs = [
      { id: "sl-1", agentName: "Orchestrator", action: "Demo profile initialized: Student Crisis scenario.", timestamp: getRelativeISO(-0.1), status: "done" },
      { id: "sl-2", agentName: "Priority Engine", action: "Flagged 'Software Engineering Project' as Critical (Risk: 84%). Urgency score bumped to 95.", timestamp: getRelativeISO(-0.08), status: "done" },
      { id: "sl-3", agentName: "Recovery Agent", action: "Drafting Plan 1: allocating focus slots and deferring low-priority polish.", timestamp: getRelativeISO(-0.06), status: "done" }
    ];

    demoMemory = [
      { id: "m-1", timestamp: getRelativeISO(-48), category: "Task Created", title: "Project Ingested", content: "Syllabus outlines 16 estimated hours required for Next.js app setup and report." },
      { id: "m-2", timestamp: getRelativeISO(-0.1), category: "Risk Warning", title: "Crisis Detected", content: "Workload ratio 2.0 exceeded capacity threshold. Emergency Recovery activated." }
    ];
  } else if (profile === "professional") {
    demoTasks = [
      {
        id: "prof-1",
        title: "Executive Q2 Client Strategy Review Deck",
        deadline: getRelativeISO(8),
        estimated_minutes: 7 * 60,
        priority: "critical",
        status: "todo",
        category: "professional",
        created_at: getRelativeISO(-24),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      },
      {
        id: "prof-2",
        title: "Engineering Team OKR Audit & Alignment",
        deadline: getRelativeISO(24),
        estimated_minutes: 3 * 60,
        priority: "high",
        status: "todo",
        category: "professional",
        created_at: getRelativeISO(-12),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      }
    ];
    demoEvents = [
      { id: "prof-ev-1", title: "Internal Weekly Retro", start: getRelativeISO(3), end: getRelativeISO(4), isConflict: true, type: "meeting" }
    ];
    demoLogs = [
      { id: "pl-1", agentName: "Orchestrator", action: "Demo profile initialized: Professional Crisis scenario.", timestamp: getRelativeISO(-0.1), status: "done" }
    ];
    demoMemory = [
      { id: "pm-1", timestamp: getRelativeISO(-10), category: "Risk Warning", title: "Review Deck at Risk", content: "Q2 Client strategy deck deadline due in 8 hours." }
    ];
  } else {
    demoTasks = [
      {
        id: "ent-1",
        title: "Seed Round Venture Pitch Deck & Cap Table submission",
        deadline: getRelativeISO(9),
        estimated_minutes: 10 * 60,
        priority: "critical",
        status: "todo",
        category: "entrepreneur",
        created_at: getRelativeISO(-24),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      },
      {
        id: "ent-2",
        title: "Landing Page & Stripe Beta Checkout deploy",
        deadline: getRelativeISO(20),
        estimated_minutes: 8 * 60,
        priority: "high",
        status: "todo",
        category: "entrepreneur",
        created_at: getRelativeISO(-12),
        updated_at: now.toISOString(),
        dependencies: [],
        progress: 0,
        source: "demo"
      }
    ];
    demoEvents = [
      { id: "ent-ev-1", title: "Call with Lead Seed Investors", start: getRelativeISO(4), end: getRelativeISO(5), isConflict: true, type: "meeting" }
    ];
    demoLogs = [
      { id: "el-1", agentName: "Orchestrator", action: "Demo profile initialized: Entrepreneur Emergency scenario.", timestamp: getRelativeISO(-0.1), status: "done" }
    ];
    demoMemory = [
      { id: "em-1", timestamp: getRelativeISO(-8), category: "Task Created", title: "Venture Pitch Ingested", content: "Term sheet deadline due in 9 hours." }
    ];
  }

  // Generate initial Plan 1 deterministically for this demo scenario
  const demoPlan1 = generateRecoveryPlan(demoTasks, 6, now);

  const demoState: AppState = {
    ...base,
    isDemoMode: true,
    demoProfile: profile,
    tasks: demoTasks,
    events: demoEvents,
    logs: demoLogs,
    memoryLogs: demoMemory,
    activePlan: demoPlan1,
    emergencyMode: true,
    scoreHistory: [
      { val: 78, reason: "Initial week setup complete.", timestamp: getRelativeISO(-48) },
      { val: 62, reason: "Critical project deadline under 24 hours.", timestamp: getRelativeISO(-0.1) }
    ]
  };

  return refreshComputedState(demoState);
};
