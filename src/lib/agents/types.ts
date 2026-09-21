export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "completed" | "deferred" | "cancelled";
export type TaskCategory = "student" | "professional" | "entrepreneur" | "general";
export type RiskLevel = "green" | "yellow" | "orange" | "red";

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO string
  estimated_minutes: number; // Duration in minutes
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  created_at: string;
  updated_at: string;
  dependencies: string[]; // Task IDs
  progress: number; // 0 to 100 percentage
  source: "user" | "voice" | "document" | "email" | "demo";
  priorityScore?: number; // 0-100 calculated
  riskScore?: number; // 0-100 calculated
  riskLevel?: RiskLevel;
  riskReason?: string;
  assignedAgent?: string;
  explainability?: {
    why: string;
    evidence: string;
    confidence: number;
    alternatives: string;
    outcome: string;
  };
  milestones?: {
    title: string;
    completed: boolean;
    dueDate: string;
  }[];
  recoveryPlan?: RecoveryPlan;
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  taskTitle: string;
  startTime: string; // "19:00" or ISO
  endTime: string; // "20:00" or ISO
  durationMinutes: number;
  type: "task" | "break" | "buffer";
  focus: string;
  isCompressed?: boolean;
}

export interface RecoveryPlan {
  id: string;
  createdAt: string;
  version: 1 | 2;
  status: "active" | "failed" | "completed" | "superseded";
  simplifiedScope: string[];
  timeBlocks: TimeBlock[];
  completionSequence: string[];
  criticalPath: string;
  deferredTasks: { id: string; title: string; reason: string }[];
  compressedTasks: { id: string; title: string; originalMinutes: number; compressedMinutes: number }[];
  tradeOffs: string[];
  totalFocusMinutes: number;
  totalBreakMinutes: number;
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskReasons: string[];
  affectedTasks: string[];
  recommendedAction: string;
  workloadRatio: number;
  availableHours: number;
  requiredHours: number;
}

export interface PriorityAssessment {
  priorityScore: number; // 0-100
  priorityLevel: TaskPriority;
  reason: string;
  urgencyRatio: number;
  importanceWeight: number;
}

export interface FailureAssessment {
  isPlanFailed: boolean;
  failureReason?: string;
  deviationPercentage: number;
  affectedTasks: string[];
  newRiskScore: number;
  recommendedReplan: boolean;
}

export interface ReplanningResult {
  previousPlan: RecoveryPlan;
  updatedPlan: RecoveryPlan;
  changesSummary: {
    delayMinutesDetected: number;
    movedTasks: string[];
    deferredTasks: string[];
    compressedTasks: string[];
    rationale: string;
  };
  newRiskScore: number;
  newRiskLevel: RiskLevel;
}

export interface JournalEvent {
  id: string;
  timestamp: string;
  category: "Task Created" | "Task Completed" | "Task Delayed" | "Risk Warning" | "Plan Generated" | "Plan Failed" | "Plan Regenerated" | "Calendar Conflict" | "Voice Command" | "Document Analyzed" | "System Insight";
  title: string;
  content: string;
  impact?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

export interface DailyBriefingData {
  mode: "morning" | "evening";
  greeting: string;
  summary: string;
  priorities: string[];
  risks: string[];
  actions: string[];
  completedTasksCount: number;
  pendingTasksCount: number;
  totalFocusMinutesToday: number;
  currentRiskScore: number;
  scoreDeltaToday: number;
}

export interface LifeScoreBreakdown {
  currentScore: number; // 0-100
  previousScore: number;
  scoreDelta: number;
  confidenceScore: number; // Based on data sample size
  metrics: {
    taskCompletionRate: number; // 0-100
    deadlineAdherenceRate: number; // 0-100
    focusConsistencyRate: number; // 0-100
    riskMitigationScore: number; // 0-100
    overduePenalty: number;
  };
  explanation: string;
  contributingFactors: string[];
  historicalChanges: {
    val: number;
    reason: string;
    timestamp: string;
  }[];
}
