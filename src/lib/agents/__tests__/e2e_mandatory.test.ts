import {
  evaluateFailureRisk,
  evaluateTaskPriority,
  generateRecoveryPlan,
  detectPlanFailure,
  executeAutoReplan,
  calculateLifeScore
} from "../orchestrator";
import { Task, JournalEvent } from "../types";

console.log("==========================================================");
console.log("MANDATORY END-TO-END VERIFICATION: CRISIS & AUTO-REPLAN");
console.log("==========================================================\n");

// STEP 1: DEFINE MANDATORY SCENARIO TASKS
const now = new Date("2026-09-20T18:00:00.000Z");

const assignmentTask: Task = {
  id: "e2e-task-1",
  title: "Compiler Lab Assignment & Code Submission",
  deadline: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Tonight (4h)
  estimated_minutes: 3 * 60, // 3 hours
  status: "todo",
  priority: "critical",
  category: "student",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  progress: 0,
  source: "user"
};

const interviewTask: Task = {
  id: "e2e-task-2",
  title: "Stripe Software Engineer Mock Interview Prep",
  deadline: new Date(now.getTime() + 16 * 60 * 60 * 1000).toISOString(), // Tomorrow 10 AM (16h)
  estimated_minutes: 2 * 60, // 2 hours
  status: "todo",
  priority: "high",
  category: "student",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  progress: 0,
  source: "user"
};

const otherTask: Task = {
  id: "e2e-task-3",
  title: "Optional Documentation Polish & Readme Assets",
  deadline: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(), // 20h
  estimated_minutes: 2 * 60, // 2 hours
  status: "todo",
  priority: "low",
  category: "student",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  progress: 0,
  source: "user"
};

const initialTasks = [assignmentTask, interviewTask, otherTask];
const availableCapacityHours = 3.5; // Insufficient to complete 7.0 hours of work

console.log("[PHASE 1] Initial Workload Evaluation:");
console.log(`- Total Tasks: ${initialTasks.length}`);
console.log(`- Required Effort: 7.0 hours`);
console.log(`- Available Working Time: ${availableCapacityHours} hours`);

// STEP 2: EVALUATE INITIAL RISK & PRIORITIES
const initialRisk = evaluateFailureRisk(initialTasks, availableCapacityHours, now);
console.log(`\nRisk Score: ${initialRisk.riskScore}% (${initialRisk.riskLevel.toUpperCase()})`);
console.log(`Workload Ratio: ${initialRisk.workloadRatio}`);
console.log(`Risk Reasons:`, initialRisk.riskReasons);

if (initialRisk.riskScore < 75 || initialRisk.riskLevel !== "red") {
  throw new Error(`Expected High/Critical Red Risk, got ${initialRisk.riskScore}% (${initialRisk.riskLevel})`);
}
console.log("✓ Initial Risk confirmed CRITICAL/RED (Score >= 75%)");

const assignmentPriority = evaluateTaskPriority(assignmentTask, initialTasks, availableCapacityHours, now);
const interviewPriority = evaluateTaskPriority(interviewTask, initialTasks, availableCapacityHours, now);
const otherPriority = evaluateTaskPriority(otherTask, initialTasks, availableCapacityHours, now);

console.log(`\nPriorities Evaluated:`);
console.log(`- Assignment: Score ${assignmentPriority.priorityScore} (${assignmentPriority.priorityLevel})`);
console.log(`- Interview: Score ${interviewPriority.priorityScore} (${interviewPriority.priorityLevel})`);
console.log(`- Other Task: Score ${otherPriority.priorityScore} (${otherPriority.priorityLevel})`);

if (assignmentPriority.priorityScore <= otherPriority.priorityScore || interviewPriority.priorityScore <= otherPriority.priorityScore) {
  throw new Error("Priority engine failed to protect important deadlines over low-priority work.");
}
console.log("✓ Priority Engine correctly protected Assignment and Interview deadlines.");

// STEP 3: GENERATE RECOVERY PLAN 1
const plan1 = generateRecoveryPlan(initialTasks, availableCapacityHours, now);
console.log(`\n[PHASE 2] Generated Plan 1 (Version ${plan1.version}):`);
console.log(`- Total Focus Time: ${plan1.totalFocusMinutes} min, Breaks: ${plan1.totalBreakMinutes} min`);
console.log(`- Time Blocks:`, plan1.timeBlocks.map(b => `${b.startTime}-${b.endTime}: ${b.focus} (${b.durationMinutes}m)`));
console.log(`- Deferred Tasks:`, plan1.deferredTasks.map(d => `${d.title} -> Reason: ${d.reason}`));
console.log(`- Critical Path:`, plan1.criticalPath);

if (plan1.deferredTasks.length === 0 || !plan1.deferredTasks.some(d => d.id === otherTask.id)) {
  throw new Error("Plan 1 failed to defer low-priority task during capacity deficit.");
}
console.log("✓ Plan 1 successfully allocated focus blocks and deferred low-priority work.");

// STEP 4: SIMULATE PROGRESS DEVIATION & FAILURE DETECTION
console.log("\n[PHASE 3] Simulating Progress Slip on Assignment:");
console.log("- Expected Progress at 2-hour checkpoint: ~60%");
console.log("- Actual Progress Reported: 25%");

const elapsedMinutes = 120; // 2 hours in
const midExecutionTasks: Task[] = [
  { ...assignmentTask, progress: 25 }, // User only finished 25% instead of ~60%
  { ...interviewTask, progress: 0 },
  { ...otherTask, progress: 0 }
];

const failureResult = detectPlanFailure(plan1, midExecutionTasks, elapsedMinutes);
console.log(`\nFailure Detected: ${failureResult.isPlanFailed}`);
console.log(`Schedule Deviation: ${failureResult.deviationPercentage}%`);
console.log(`Failure Reason: "${failureResult.failureReason}"`);
console.log(`Affected Tasks:`, failureResult.affectedTasks);

if (!failureResult.isPlanFailed || failureResult.deviationPercentage < 25) {
  throw new Error("Failure Detector failed to detect progress deviation >= 25%");
}
console.log("✓ Failure Detector successfully triggered on deviation >= 25%");

// STEP 5: RECALCULATE RISK & AUTO-REPLAN (PLAN 2)
console.log("\n[PHASE 4] Executing Auto-Replanning (Plan 1 -> Plan 2):");
const replanResult = executeAutoReplan(plan1, midExecutionTasks, 60, availableCapacityHours, new Date(now.getTime() + 2 * 60 * 60 * 1000));
const plan2 = replanResult.updatedPlan;

console.log(`- Plan 1 Status: ${replanResult.previousPlan.status.toUpperCase()}`);
console.log(`- Plan 2 ID: ${plan2.id} (Version ${plan2.version})`);
console.log(`- Plan 2 Time Blocks:`, plan2.timeBlocks.map(b => `${b.startTime}-${b.endTime}: ${b.focus} (${b.durationMinutes}m)`));
console.log(`- Diff Summary ("What Changed?"): "${replanResult.changesSummary.rationale}"`);
console.log(`- Deferred Tasks in Plan 2:`, plan2.deferredTasks.map(d => d.title));

if (plan2.version <= plan1.version) {
  throw new Error("Plan 2 version must be strictly greater than Plan 1.");
}
if (JSON.stringify(plan1.timeBlocks) === JSON.stringify(plan2.timeBlocks)) {
  throw new Error("Plan 2 must visibly differ from Plan 1 in time blocks!");
}
console.log("✓ Plan 2 is mathematically and structurally distinct from Plan 1.");

// STEP 6: JOURNAL & LIFESCORE EVENT UPDATES
console.log("\n[PHASE 5] Journaling & LifeScore Calculation:");
const journalEntry: JournalEvent = {
  id: `journal-${Date.now()}`,
  timestamp: new Date().toISOString(),
  category: "Plan Failed",
  title: "Plan 1 Failure & Auto-Replan to Plan 2",
  content: `${failureResult.failureReason} ${replanResult.changesSummary.rationale}`
};
console.log(`- Journal Entry Created: [${journalEntry.category}] ${journalEntry.title}`);

const updatedLifeScore = calculateLifeScore(
  midExecutionTasks,
  0,
  0,
  [
    { val: 78, reason: "Initial setup", timestamp: now.toISOString() },
    { val: 52, reason: "Progress slip on Compiler Lab", timestamp: new Date().toISOString() }
  ]
);
console.log(`- Recomputed LifeScore: ${updatedLifeScore.currentScore}/100 (Confidence: ${updatedLifeScore.confidenceScore}%)`);
console.log(`- Score Factors:`, updatedLifeScore.contributingFactors);

console.log("\n==========================================================");
console.log("MANDATORY END-TO-END VERIFICATION: ALL STEPS PASSED 100%");
console.log("==========================================================");
