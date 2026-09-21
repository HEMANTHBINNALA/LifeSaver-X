import {
  evaluateFailureRisk,
  evaluateTaskPriority,
  generateRecoveryPlan,
  detectPlanFailure,
  executeAutoReplan,
  calculateLifeScore,
  generateDailyBriefing
} from "../orchestrator";
import { Task } from "../types";

console.log("==================================================");
console.log("LIFESAVER X — DETERMINISTIC ENGINE VERIFICATION");
console.log("==================================================\n");

// 1. SETUP CRISIS SCENARIO
const now = new Date();
const getIso = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

const task1: Task = {
  id: "task-1",
  title: "Final Year Software Engineering Project Code & Report",
  deadline: getIso(4), // due in 4 hours
  estimated_minutes: 180, // 3 hours
  priority: "critical",
  status: "todo",
  category: "student",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  dependencies: [],
  progress: 0,
  source: "user"
};

const task2: Task = {
  id: "task-2",
  title: "Stripe Software Engineer Mock Interview Preparation",
  deadline: getIso(14), // due in 14 hours (tomorrow 10 AM)
  estimated_minutes: 120, // 2 hours
  priority: "high",
  status: "todo",
  category: "student",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  dependencies: [],
  progress: 0,
  source: "user"
};

const task3: Task = {
  id: "task-3",
  title: "Optional Documentation Polish & Readme Assets",
  deadline: getIso(6), // due in 6 hours
  estimated_minutes: 120, // 2 hours
  priority: "low",
  status: "todo",
  category: "general",
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  dependencies: [],
  progress: 0,
  source: "user"
};

const allTasks: Task[] = [task1, task2, task3];

// TEST 1: RISK ENGINE
console.log("--> TEST 1: RISK ENGINE CALCULATION");
// Available time: only 3.5 hours for 7 hours of work (workload ratio 2.0)
const riskResult = evaluateFailureRisk(allTasks, 3.5, now);
console.log(`Risk Score: ${riskResult.riskScore}% (${riskResult.riskLevel.toUpperCase()})`);
console.log(`Workload Ratio: ${riskResult.workloadRatio} (Required: ${riskResult.requiredHours}h, Available: ${riskResult.availableHours}h)`);
console.log(`Risk Reasons:`, riskResult.riskReasons);
console.log(`Recommended Action:`, riskResult.recommendedAction);
if (riskResult.riskScore < 80) throw new Error("Risk score should be >= 80 for 2.0 workload ratio");
if (riskResult.riskLevel !== "red") throw new Error("Risk level should be red");
console.log("✓ TEST 1 PASSED\n");

// TEST 2: PRIORITY ENGINE
console.log("--> TEST 2: PRIORITY ENGINE CALCULATION");
const p1 = evaluateTaskPriority(task1, allTasks, 3.5, now);
const p2 = evaluateTaskPriority(task2, allTasks, 3.5, now);
const p3 = evaluateTaskPriority(task3, allTasks, 3.5, now);
console.log(`Task 1 Priority: ${p1.priorityScore} (${p1.priorityLevel}) - ${p1.reason}`);
console.log(`Task 2 Priority: ${p2.priorityScore} (${p2.priorityLevel}) - ${p2.reason}`);
console.log(`Task 3 Priority: ${p3.priorityScore} (${p3.priorityLevel}) - ${p3.reason}`);
if (p1.priorityScore <= p2.priorityScore) throw new Error("Task 1 (due in 4h) should rank higher than Task 2");
if (p2.priorityScore <= p3.priorityScore) throw new Error("Task 2 (high) should rank higher than Task 3 (low)");
console.log("✓ TEST 2 PASSED\n");

// TEST 3: RECOVERY PLANNER (PLAN 1)
console.log("--> TEST 3: RECOVERY PLANNER (PLAN 1 GENERATION)");
const plan1 = generateRecoveryPlan(allTasks, 3.5, now);
console.log(`Plan 1 ID: ${plan1.id}, Version: ${plan1.version}, Status: ${plan1.status}`);
console.log(`Total Focus: ${plan1.totalFocusMinutes}m, Breaks: ${plan1.totalBreakMinutes}m`);
console.log(`Time Blocks:`, plan1.timeBlocks.map((b) => `${b.startTime}-${b.endTime}: ${b.taskTitle} (${b.durationMinutes}m)`));
console.log(`Deferred Tasks:`, plan1.deferredTasks);
console.log(`Compressed Tasks:`, plan1.compressedTasks);
console.log(`Critical Path: ${plan1.criticalPath}`);
if (plan1.timeBlocks.length === 0) throw new Error("Plan 1 should have time blocks");
if (!plan1.deferredTasks.some((d) => d.title.includes("Optional Documentation"))) {
  throw new Error("Task 3 should be deferred in Plan 1");
}
console.log("✓ TEST 3 PASSED\n");

// TEST 4: SIMULATE PROGRESS DELAY & FAILURE DETECTION
console.log("--> TEST 4: PROGRESS MONITORING & FAILURE DETECTION");
// Expected: user should be 60% done with task 1 after 2 hours
// Actual: user is only 25% done (+35% schedule deviation)
task1.progress = 25;
const failureAssessment = detectPlanFailure(plan1, [task1, task2, task3], 120); // 120 mins elapsed
console.log(`Plan Failure Detected: ${failureAssessment.isPlanFailed}`);
console.log(`Deviation: ${failureAssessment.deviationPercentage}%`);
console.log(`Failure Reason: ${failureAssessment.failureReason}`);
console.log(`Affected Tasks:`, failureAssessment.affectedTasks);
if (!failureAssessment.isPlanFailed) throw new Error("Failure detector must flag plan failure");
console.log("✓ TEST 4 PASSED\n");

// TEST 5: AUTO-REPLANNING (PLAN 2 GENERATION)
console.log("--> TEST 5: AUTO-REPLANNING ENGINE (PLAN 1 -> PLAN 2)");
const replanResult = executeAutoReplan(plan1, [task1, task2, task3], 45, 2.0, new Date(now.getTime() + 120 * 60000));
console.log(`Plan 1 Status: ${replanResult.previousPlan.status}`);
console.log(`Plan 2 ID: ${replanResult.updatedPlan.id}, Version: ${replanResult.updatedPlan.version}`);
console.log(`Plan 2 Blocks:`, replanResult.updatedPlan.timeBlocks.map((b) => `${b.startTime}-${b.endTime}: ${b.taskTitle} (${b.durationMinutes}m)`));
console.log(`Changes Summary:`, replanResult.changesSummary);
if (replanResult.previousPlan.status !== "failed") throw new Error("Plan 1 must be marked as failed");
if (replanResult.updatedPlan.version !== 2) throw new Error("Plan 2 must have version 2");
if (replanResult.updatedPlan.timeBlocks.length === 0) throw new Error("Plan 2 must have time blocks");
console.log("✓ TEST 5 PASSED\n");

// TEST 6: LIFESCORE ENGINE
console.log("--> TEST 6: DYNAMIC LIFESCORE CALCULATION");
const lifeScoreResult = calculateLifeScore([task1, task2, task3], 4, 1, [
  { val: 75, reason: "Initial baseline", timestamp: getIso(-24) }
]);
console.log(`LifeScore: ${lifeScoreResult.currentScore}/100 (Delta: ${lifeScoreResult.scoreDelta})`);
console.log(`Confidence: ${lifeScoreResult.confidenceScore}% (Derived from ${lifeScoreResult.historicalChanges.length + 3} data samples)`);
console.log(`Contributing Factors:`, lifeScoreResult.contributingFactors);
if (lifeScoreResult.currentScore <= 0 || lifeScoreResult.currentScore > 100) throw new Error("LifeScore must be 0-100");
console.log("✓ TEST 6 PASSED\n");

// TEST 7: DAILY BRIEFING GENERATOR
console.log("--> TEST 7: DAILY BRIEFING GENERATOR (MORNING & EVENING)");
const morningBriefing = generateDailyBriefing([task1, task2, task3], "morning", "Hemanth");
const eveningBriefing = generateDailyBriefing([task1, task2, task3], "evening", "Hemanth");
console.log(`Morning Greeting: ${morningBriefing.greeting}`);
console.log(`Morning Priorities:`, morningBriefing.priorities);
console.log(`Evening Summary: ${eveningBriefing.summary}`);
if (morningBriefing.priorities.length === 0) throw new Error("Morning briefing must extract priorities");
console.log("✓ TEST 7 PASSED\n");

console.log("==================================================");
console.log("ALL 7 DETERMINISTIC ENGINES VERIFIED SUCCESSFULLY!");
console.log("==================================================");
