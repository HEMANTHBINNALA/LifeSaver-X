import {
  Task,
  TaskPriority,
  RiskLevel,
  RiskAssessment,
  PriorityAssessment,
  RecoveryPlan,
  FailureAssessment,
  ReplanningResult,
  TimeBlock,
  DailyBriefingData,
  LifeScoreBreakdown,
  JournalEvent
} from "./types";

// ==========================================
// 1. DETERMINISTIC RISK ENGINE
// ==========================================
export function evaluateFailureRisk(
  tasks: Task[],
  availableWorkingHours?: number,
  currentTime: Date = new Date()
): RiskAssessment {
  const activeTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  );

  if (activeTasks.length === 0) {
    return {
      riskScore: 5,
      riskLevel: "green",
      riskReasons: ["All active tasks completed or backlog is clear."],
      affectedTasks: [],
      recommendedAction: "Maintain steady workflow and plan upcoming objectives.",
      workloadRatio: 0,
      availableHours: availableWorkingHours || 8,
      requiredHours: 0
    };
  }

  // Calculate total remaining effort in hours
  let totalRemainingMinutes = 0;
  let nearestDeadlineMs = Number.MAX_SAFE_INTEGER;
  const affectedTasks: string[] = [];
  const riskReasons: string[] = [];

  let criticalCount = 0;
  let overdueCount = 0;

  activeTasks.forEach((t) => {
    const remainingPct = Math.max(0, 100 - (t.progress || 0)) / 100;
    const taskMinutes = (t.estimated_minutes || 60) * remainingPct;
    totalRemainingMinutes += taskMinutes;

    const deadlineTime = new Date(t.deadline).getTime();
    if (!isNaN(deadlineTime)) {
      if (deadlineTime < currentTime.getTime()) {
        overdueCount++;
        riskReasons.push(`Task "${t.title}" is already past its deadline.`);
      } else if (deadlineTime < nearestDeadlineMs) {
        nearestDeadlineMs = deadlineTime;
      }
    }

    if (t.priority === "critical" || t.priority === "high") {
      criticalCount++;
      affectedTasks.push(t.title);
    }
  });

  const requiredHours = totalRemainingMinutes / 60;

  // Compute available hours until nearest deadline if not explicitly given
  let calculatedAvailableHours = availableWorkingHours;
  if (!calculatedAvailableHours) {
    if (nearestDeadlineMs !== Number.MAX_SAFE_INTEGER) {
      const hoursToNearest = Math.max(
        0.5,
        (nearestDeadlineMs - currentTime.getTime()) / (1000 * 60 * 60)
      );
      // Assume 75% of remaining time is productive working time (accounting for sleep/breaks)
      calculatedAvailableHours = Math.max(1, hoursToNearest * 0.75);
    } else {
      calculatedAvailableHours = 8; // Default daily working capacity
    }
  }

  const workloadRatio = requiredHours / Math.max(0.5, calculatedAvailableHours);

  // Deterministic Mathematical Formula for Risk:
  let rawScore = 0;
  if (workloadRatio >= 1.5) {
    rawScore = 85 + Math.min(14, (workloadRatio - 1.5) * 10);
  } else if (workloadRatio >= 1.0) {
    rawScore = 65 + (workloadRatio - 1.0) * 40;
  } else if (workloadRatio >= 0.7) {
    rawScore = 40 + (workloadRatio - 0.7) * 80;
  } else {
    rawScore = Math.max(5, workloadRatio * 50);
  }

  // Adjust for critical density and overdue tasks
  if (overdueCount > 0) {
    rawScore = Math.min(99, rawScore + overdueCount * 15);
  }
  if (criticalCount >= 2 && workloadRatio > 0.8) {
    rawScore = Math.min(98, rawScore + 10);
    riskReasons.push(`Multiple high-priority deadlines (${criticalCount}) compete for the same focus window.`);
  }

  const riskScore = Math.min(99, Math.max(5, Math.round(rawScore)));

  let riskLevel: RiskLevel = "green";
  if (riskScore >= 75) riskLevel = "red";
  else if (riskScore >= 55) riskLevel = "orange";
  else if (riskScore >= 35) riskLevel = "yellow";
  else riskLevel = "green";

  // Build clear explainable reasons
  riskReasons.unshift(
    `${requiredHours.toFixed(1)} hours of work remain with only ~${calculatedAvailableHours.toFixed(1)} available hours.`
  );

  let recommendedAction = "Schedule steady focus intervals.";
  if (riskLevel === "red") {
    recommendedAction = "Activate Emergency Recovery: defer low-value tasks and compress flexible scope immediately.";
  } else if (riskLevel === "orange") {
    recommendedAction = "Reprioritize backlog, protect critical deadlines, and minimize non-essential meetings.";
  } else if (riskLevel === "yellow") {
    recommendedAction = "Block uninterrupted focus slots to avoid falling behind schedule.";
  }

  return {
    riskScore,
    riskLevel,
    riskReasons,
    affectedTasks: affectedTasks.slice(0, 4),
    recommendedAction,
    workloadRatio: Number(workloadRatio.toFixed(2)),
    availableHours: Number(calculatedAvailableHours.toFixed(1)),
    requiredHours: Number(requiredHours.toFixed(1))
  };
}

// ==========================================
// 2. DETERMINISTIC PRIORITY ENGINE
// ==========================================
export function evaluateTaskPriority(
  task: Task,
  allTasks: Task[] = [],
  availableHours: number = 8,
  currentTime: Date = new Date()
): PriorityAssessment {
  const deadlineTime = new Date(task.deadline).getTime();
  const nowMs = currentTime.getTime();
  const hoursUntilDeadline = !isNaN(deadlineTime)
    ? Math.max(0.1, (deadlineTime - nowMs) / (1000 * 60 * 60))
    : 48;

  const remainingEffortHours =
    ((task.estimated_minutes || 60) * Math.max(0, 100 - (task.progress || 0))) / (100 * 60);

  // Importance weights
  const baseWeights: Record<TaskPriority, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  };
  const importanceWeight = baseWeights[task.priority] || 20;

  // Urgency ratio: remaining effort vs time remaining
  const urgencyRatio = remainingEffortHours / Math.max(0.5, hoursUntilDeadline);

  // Dependency impact: tasks that block other tasks get priority boost
  const dependentCount = allTasks.filter((t) =>
    (t.dependencies || []).includes(task.id)
  ).length;
  const dependencyBoost = Math.min(15, dependentCount * 7.5);

  // Raw Priority Score calculation (0-100)
  let rawScore =
    importanceWeight +
    Math.min(45, urgencyRatio * 40) +
    dependencyBoost +
    (task.priority !== "low" && hoursUntilDeadline < 12 ? 15 : task.priority !== "low" && hoursUntilDeadline < 24 ? 10 : 0);

  const priorityScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  let priorityLevel: TaskPriority = task.priority;
  let reason = "";

  if (priorityScore >= 75 || (hoursUntilDeadline < 6 && task.priority !== "low")) {
    priorityLevel = "critical";
    reason = `Critical urgency: due in ${hoursUntilDeadline.toFixed(1)}h with ${remainingEffortHours.toFixed(1)}h work remaining.`;
  } else if (priorityScore >= 50 || (hoursUntilDeadline < 20 && task.priority !== "low")) {
    priorityLevel = "high";
    reason = `High priority: tight deadline proximity (${hoursUntilDeadline.toFixed(1)}h remaining).`;
  } else if (priorityScore >= 30) {
    priorityLevel = "medium";
    reason = `Moderate priority: steady execution required.`;
  } else {
    priorityLevel = "low";
    reason = `Low priority: non-essential deliverable with flexible impact.`;
  }

  return {
    priorityScore,
    priorityLevel,
    reason,
    urgencyRatio: Number(urgencyRatio.toFixed(2)),
    importanceWeight
  };
}

export function calculatePriorityScore(
  deadline: string,
  estimatedEffortHours: number,
  basePriority: string = "medium"
): number {
  const dummyTask: Task = {
    id: "temp",
    title: "Temp",
    deadline,
    estimated_minutes: estimatedEffortHours * 60,
    priority: (basePriority as TaskPriority) || "medium",
    status: "todo",
    category: "general",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dependencies: [],
    progress: 0,
    source: "user"
  };
  return evaluateTaskPriority(dummyTask).priorityScore;
}

// ==========================================
// 3. DETERMINISTIC RECOVERY PLANNER
// ==========================================
export function generateRecoveryPlan(
  tasks: Task[],
  availableHours: number = 6,
  startTime: Date = new Date()
): RecoveryPlan {
  const activeTasks = [...tasks].filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  );

  // Rank active tasks by calculated priority score
  const ranked = activeTasks.map((t) => ({
    task: t,
    assessment: evaluateTaskPriority(t, tasks, availableHours, startTime)
  }));
  ranked.sort((a, b) => b.assessment.priorityScore - a.assessment.priorityScore);

  const timeBlocks: TimeBlock[] = [];
  const deferredTasks: { id: string; title: string; reason: string }[] = [];
  const compressedTasks: { id: string; title: string; originalMinutes: number; compressedMinutes: number }[] = [];
  const tradeOffs: string[] = [];
  const simplifiedScope: string[] = [];
  const completionSequence: string[] = [];

  let currentSlot = new Date(startTime);
  const totalAvailableMinutes = availableHours * 60;
  let allocatedMinutes = 0;
  let totalFocusMinutes = 0;
  let totalBreakMinutes = 0;

  const formatSlotTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  ranked.forEach(({ task, assessment }, index) => {
    const rawMinutes = Math.max(20, Math.round((task.estimated_minutes || 60) * (1 - (task.progress || 0) / 100)));
    
    // If we have capacity for this task
    if (allocatedMinutes + rawMinutes <= totalAvailableMinutes) {
      // Normal allocation
      const blockStart = new Date(currentSlot);
      currentSlot = new Date(currentSlot.getTime() + rawMinutes * 60000);
      const blockEnd = new Date(currentSlot);

      timeBlocks.push({
        id: `tb-${task.id}-${index}`,
        taskId: task.id,
        taskTitle: task.title,
        startTime: formatSlotTime(blockStart),
        endTime: formatSlotTime(blockEnd),
        durationMinutes: rawMinutes,
        type: "task",
        focus: `Execute core deliverable: ${task.title}`
      });

      allocatedMinutes += rawMinutes;
      totalFocusMinutes += rawMinutes;
      simplifiedScope.push(`${task.title} (Full Focus - ${rawMinutes}m)`);
      completionSequence.push(`${completionSequence.length + 1}. ${task.title}`);

      // Add small 10m break after task if time permits
      if (allocatedMinutes + 10 <= totalAvailableMinutes) {
        const breakStart = new Date(currentSlot);
        currentSlot = new Date(currentSlot.getTime() + 10 * 60000);
        const breakEnd = new Date(currentSlot);
        timeBlocks.push({
          id: `break-${index}`,
          taskTitle: "Cognitive Recovery Break",
          startTime: formatSlotTime(breakStart),
          endTime: formatSlotTime(breakEnd),
          durationMinutes: 10,
          type: "break",
          focus: "Step away from screen, hydrate, mental recharge"
        });
        allocatedMinutes += 10;
        totalBreakMinutes += 10;
      }
    } else if (assessment.priorityLevel === "critical" || assessment.priorityLevel === "high") {
      // Capacity constraint on important task -> COMPRESS flexible parts if remaining window is at least 20m
      const remainingWindow = totalAvailableMinutes - allocatedMinutes;
      if (remainingWindow >= 20) {
        const compressedDuration = remainingWindow;

        compressedTasks.push({
          id: task.id,
          title: task.title,
          originalMinutes: rawMinutes,
          compressedMinutes: compressedDuration
        });

        tradeOffs.push(
          `Compressed "${task.title}" from ${rawMinutes}m to ${compressedDuration}m by focusing exclusively on minimum viable deliverables.`
        );

        const blockStart = new Date(currentSlot);
        currentSlot = new Date(currentSlot.getTime() + compressedDuration * 60000);
        const blockEnd = new Date(currentSlot);

        timeBlocks.push({
          id: `tb-${task.id}-${index}-comp`,
          taskId: task.id,
          taskTitle: task.title,
          startTime: formatSlotTime(blockStart),
          endTime: formatSlotTime(blockEnd),
          durationMinutes: compressedDuration,
          type: "task",
          focus: `Hyper-Focus Sprint: ${task.title} (Scope Compressed)`,
          isCompressed: true
        });

        allocatedMinutes += compressedDuration;
        totalFocusMinutes += compressedDuration;
        simplifiedScope.push(`${task.title} (Compressed MVP - ${compressedDuration}m)`);
        completionSequence.push(`${completionSequence.length + 1}. ${task.title} [COMPRESSED]`);
      } else {
        deferredTasks.push({
          id: task.id,
          title: task.title,
          reason: `Deferred to protect critical upcoming deadline "${ranked[0]?.task.title || "Urgent Target"}".`
        });
        tradeOffs.push(`Deferred task "${task.title}" to tomorrow due to zero remaining focus capacity.`);
      }
    } else {
      // Cannot fit and low/medium priority -> DEFER
      deferredTasks.push({
        id: task.id,
        title: task.title,
        reason: `Deferred to protect critical upcoming deadline "${ranked[0]?.task.title || "Urgent Target"}".`
      });
      tradeOffs.push(`Deferred low-urgency task "${task.title}" to tomorrow.`);
    }
  });

  const criticalPath = ranked.length > 0
    ? `Bottleneck: Complete ${ranked[0].task.title} within the first ${timeBlocks[0]?.durationMinutes || 60} minutes to ensure downstream schedule feasibility.`
    : "No critical bottlenecks detected.";

  return {
    id: `plan-v1-${Date.now()}`,
    createdAt: new Date().toISOString(),
    version: 1,
    status: "active",
    simplifiedScope: simplifiedScope.length > 0 ? simplifiedScope : ["No active tasks to plan."],
    timeBlocks,
    completionSequence,
    criticalPath,
    deferredTasks,
    compressedTasks,
    tradeOffs,
    totalFocusMinutes,
    totalBreakMinutes
  };
}

// ==========================================
// 4. DETERMINISTIC PROGRESS & FAILURE MONITOR
// ==========================================
export function detectPlanFailure(
  currentPlan: RecoveryPlan,
  currentTasks: Task[],
  elapsedMinutesSincePlan: number = 60
): FailureAssessment {
  if (!currentPlan || currentPlan.timeBlocks.length === 0) {
    return {
      isPlanFailed: false,
      deviationPercentage: 0,
      affectedTasks: [],
      newRiskScore: 10,
      recommendedReplan: false
    };
  }

  // Calculate expected progress based on elapsed time vs total plan duration
  const totalPlannedMinutes = currentPlan.totalFocusMinutes + currentPlan.totalBreakMinutes;
  const expectedProgressFraction = Math.min(1, elapsedMinutesSincePlan / Math.max(1, totalPlannedMinutes));

  // Calculate actual progress across tasks in the plan
  const plannedTaskIds = currentPlan.timeBlocks.filter((b) => b.taskId).map((b) => b.taskId as string);
  const relevantTasks = currentTasks.filter((t) => plannedTaskIds.includes(t.id));

  let actualProgressSum = 0;
  const affectedTasks: string[] = [];

  relevantTasks.forEach((t) => {
    actualProgressSum += t.progress || 0;
  });

  const averageActualProgressFraction = relevantTasks.length > 0
    ? actualProgressSum / (relevantTasks.length * 100)
    : 0;

  // Deviation = expected vs actual
  const deviation = expectedProgressFraction - averageActualProgressFraction;
  const deviationPercentage = Math.round(deviation * 100);

  // Failure threshold: if user fell behind by >= 25% or an active critical task has 0% progress halfway through
  const isPlanFailed = deviationPercentage >= 25 || (expectedProgressFraction >= 0.5 && averageActualProgressFraction < 0.15);

  let failureReason = "";
  if (isPlanFailed) {
    failureReason = `Progress deviation detected: Expected ${Math.round(expectedProgressFraction * 100)}% completion at this milestone, but actual progress is only ${Math.round(averageActualProgressFraction * 100)}% (+${deviationPercentage}% schedule slip).`;
    relevantTasks.forEach((t) => {
      if ((t.progress || 0) < expectedProgressFraction * 100) {
        affectedTasks.push(t.title);
      }
    });
  }

  const updatedRisk = evaluateFailureRisk(currentTasks);

  return {
    isPlanFailed,
    failureReason: isPlanFailed ? failureReason : undefined,
    deviationPercentage: Math.max(0, deviationPercentage),
    affectedTasks,
    newRiskScore: updatedRisk.riskScore,
    recommendedReplan: isPlanFailed
  };
}

// ==========================================
// 5. DETERMINISTIC AUTO-REPLANNING ENGINE (Plan 1 -> Plan 2)
// ==========================================
export function executeAutoReplan(
  previousPlan: RecoveryPlan,
  tasks: Task[],
  delayMinutes: number = 40,
  availableRemainingHours: number = 4,
  currentTime: Date = new Date()
): ReplanningResult {
  // Mark previous plan as failed
  const failedPlan: RecoveryPlan = {
    ...previousPlan,
    status: "failed"
  };

  // Recalculate deterministic priorities and risks given new delayed reality
  const riskAssessment = evaluateFailureRisk(tasks, availableRemainingHours, currentTime);
  
  // Sort tasks, strictly protecting highest critical items
  const activeTasks = [...tasks].filter((t) => t.status === "todo" || t.status === "in_progress");
  const ranked = activeTasks.map((t) => ({
    task: t,
    assessment: evaluateTaskPriority(t, tasks, availableRemainingHours, currentTime)
  }));
  ranked.sort((a, b) => b.assessment.priorityScore - a.assessment.priorityScore);

  const timeBlocks: TimeBlock[] = [];
  const deferredTasks: { id: string; title: string; reason: string }[] = [];
  const compressedTasks: { id: string; title: string; originalMinutes: number; compressedMinutes: number }[] = [];
  const tradeOffs: string[] = [];
  const simplifiedScope: string[] = [];
  const completionSequence: string[] = [];
  const movedTasks: string[] = [];

  let currentSlot = new Date(currentTime);
  const totalAvailableMinutes = availableRemainingHours * 60;
  let allocatedMinutes = 0;
  let totalFocusMinutes = 0;
  let totalBreakMinutes = 0;

  const formatSlotTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  tradeOffs.push(`+${delayMinutes}m delay absorbed by rescheduling lower-priority focus segments.`);

  ranked.forEach(({ task, assessment }, index) => {
    const rawMinutes = Math.max(20, Math.round((task.estimated_minutes || 60) * (1 - (task.progress || 0) / 100)));

    if (index === 0) {
      // Top critical task MUST BE PROTECTED at all costs
      const duration = Math.min(rawMinutes, totalAvailableMinutes - allocatedMinutes);
      const blockStart = new Date(currentSlot);
      currentSlot = new Date(currentSlot.getTime() + duration * 60000);
      const blockEnd = new Date(currentSlot);

      timeBlocks.push({
        id: `tb-p2-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        startTime: formatSlotTime(blockStart),
        endTime: formatSlotTime(blockEnd),
        durationMinutes: duration,
        type: "task",
        focus: `[PRIORITY LOCK] Complete remaining deliverables: ${task.title}`
      });

      allocatedMinutes += duration;
      totalFocusMinutes += duration;
      simplifiedScope.push(`PROTECTED: ${task.title} (${duration}m focus)`);
      completionSequence.push(`1. [PROTECTED] ${task.title}`);
      movedTasks.push(task.title);
    } else if (allocatedMinutes + rawMinutes <= totalAvailableMinutes && assessment.priorityLevel !== "low") {
      // Subsequent high task can fit
      const blockStart = new Date(currentSlot);
      currentSlot = new Date(currentSlot.getTime() + rawMinutes * 60000);
      const blockEnd = new Date(currentSlot);

      timeBlocks.push({
        id: `tb-p2-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        startTime: formatSlotTime(blockStart),
        endTime: formatSlotTime(blockEnd),
        durationMinutes: rawMinutes,
        type: "task",
        focus: `Shifted execution slot: ${task.title}`
      });

      allocatedMinutes += rawMinutes;
      totalFocusMinutes += rawMinutes;
      simplifiedScope.push(`${task.title} (Shifted - ${rawMinutes}m)`);
      completionSequence.push(`${completionSequence.length + 1}. ${task.title}`);
      movedTasks.push(task.title);
    } else if (assessment.priorityLevel === "high" || assessment.priorityLevel === "critical") {
      // Must compress to fit if capacity remains
      const remainingCapacity = totalAvailableMinutes - allocatedMinutes;
      const compressedDuration = Math.max(20, Math.floor(remainingCapacity * 0.9));
      if (compressedDuration >= 20 && remainingCapacity >= 20) {
        compressedTasks.push({
          id: task.id,
          title: task.title,
          originalMinutes: rawMinutes,
          compressedMinutes: compressedDuration
        });
        tradeOffs.push(`Compressed secondary task "${task.title}" to ${compressedDuration}m to guarantee top priority finish.`);

        const blockStart = new Date(currentSlot);
        currentSlot = new Date(currentSlot.getTime() + compressedDuration * 60000);
        const blockEnd = new Date(currentSlot);

        timeBlocks.push({
          id: `tb-p2-${task.id}-comp`,
          taskId: task.id,
          taskTitle: task.title,
          startTime: formatSlotTime(blockStart),
          endTime: formatSlotTime(blockEnd),
          durationMinutes: compressedDuration,
          type: "task",
          focus: `Rapid Review: ${task.title}`,
          isCompressed: true
        });

        allocatedMinutes += compressedDuration;
        totalFocusMinutes += compressedDuration;
        simplifiedScope.push(`${task.title} (Compressed - ${compressedDuration}m)`);
        completionSequence.push(`${completionSequence.length + 1}. ${task.title} [COMPRESSED]`);
        movedTasks.push(task.title);
      } else {
        deferredTasks.push({
          id: task.id,
          title: task.title,
          reason: `Deferred due to +${delayMinutes}m delay on primary task.`
        });
        tradeOffs.push(`Deferred "${task.title}" to tomorrow due to zero focus buffer.`);
      }
    } else {
      // Defer low-value tasks
      deferredTasks.push({
        id: task.id,
        title: task.title,
        reason: `Deferred low-value items to absorb +${delayMinutes}m schedule deviation.`
      });
      tradeOffs.push(`Deferred "${task.title}" to next recovery cycle.`);
    }
  });

  const updatedPlan: RecoveryPlan = {
    id: `plan-v2-${Date.now()}`,
    createdAt: new Date().toISOString(),
    version: 2,
    status: "active",
    simplifiedScope,
    timeBlocks,
    completionSequence,
    criticalPath: `Plan 2 Execution Path: Complete ${ranked[0]?.task.title || "urgent goal"} first without further interruption.`,
    deferredTasks,
    compressedTasks,
    tradeOffs,
    totalFocusMinutes,
    totalBreakMinutes
  };

  return {
    previousPlan: failedPlan,
    updatedPlan,
    changesSummary: {
      delayMinutesDetected: delayMinutes,
      movedTasks,
      deferredTasks: deferredTasks.map((d) => d.title),
      compressedTasks: compressedTasks.map((c) => c.title),
      rationale: `Plan 2 successfully constructed: absorbed ${delayMinutes}m delay, protected top critical task, and deferred ${deferredTasks.length} non-essential items.`
    },
    newRiskScore: riskAssessment.riskScore,
    newRiskLevel: riskAssessment.riskLevel
  };
}

// ==========================================
// 6. DETERMINISTIC LIFESCORE ENGINE
// ==========================================
export function calculateLifeScore(
  tasks: Task[],
  completedHistoryCount: number = 0,
  overdueHistoryCount: number = 0,
  historicalEntries: { val: number; reason: string; timestamp: string }[] = []
): LifeScoreBreakdown {
  const totalTasks = tasks.length + completedHistoryCount;
  const completedTasks = tasks.filter((t) => t.status === "completed").length + completedHistoryCount;
  const overdueTasks = tasks.filter((t) => {
    const d = new Date(t.deadline).getTime();
    return !isNaN(d) && d < Date.now() && t.status !== "completed";
  }).length + overdueHistoryCount;

  // Completion rate (0-100)
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 80;

  // Deadline adherence rate
  const deadlineAdherenceRate = totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 85;

  // Risk score of current active tasks
  const riskAssessment = evaluateFailureRisk(tasks);
  const riskMitigationScore = Math.max(10, 100 - riskAssessment.riskScore);

  // Focus consistency rate (based on average task progress)
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const avgProgress = activeTasks.length > 0
    ? activeTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / activeTasks.length
    : 100;
  const focusConsistencyRate = Math.round(avgProgress);

  // Overdue penalty
  const overduePenalty = overdueTasks * 12;

  // Weighted LifeScore calculation:
  // Base 30% Completion + 30% Adherence + 25% Risk Mitigation + 15% Focus - Overdue Penalty
  const rawScore =
    taskCompletionRate * 0.3 +
    deadlineAdherenceRate * 0.3 +
    riskMitigationScore * 0.25 +
    focusConsistencyRate * 0.15 -
    overduePenalty;

  const currentScore = Math.min(100, Math.max(15, Math.round(rawScore)));
  const previousScore = historicalEntries.length > 1
    ? historicalEntries[historicalEntries.length - 2].val
    : currentScore;
  const scoreDelta = currentScore - previousScore;

  // Confidence is calculated from sample size of tasks (more data points = higher confidence)
  const confidenceScore = Math.min(98, Math.max(60, 60 + totalTasks * 5));

  const contributingFactors: string[] = [
    `Task Completion Adherence: ${taskCompletionRate}% (+${(taskCompletionRate * 0.3).toFixed(1)} pts)`,
    `Deadline Punctuality: ${deadlineAdherenceRate}% (+${(deadlineAdherenceRate * 0.3).toFixed(1)} pts)`,
    `Active Schedule Risk Mitigation: ${riskMitigationScore}% (+${(riskMitigationScore * 0.25).toFixed(1)} pts)`,
    `Focus Progress Velocity: ${focusConsistencyRate}% (+${(focusConsistencyRate * 0.15).toFixed(1)} pts)`
  ];
  if (overduePenalty > 0) {
    contributingFactors.push(`Overdue Deadlines Penalty: -${overduePenalty} pts`);
  }

  const explanation = currentScore >= 80
    ? "Outstanding productivity velocity. Workload capacity is balanced and deadline adherence is excellent."
    : currentScore >= 60
    ? "Stable execution rhythm. Focus on closing active milestones to prevent deadline bottleneck risk."
    : "Productivity alert. High risk of missed deadlines. Execute recommended recovery plans to restore balance.";

  return {
    currentScore,
    previousScore,
    scoreDelta,
    confidenceScore,
    metrics: {
      taskCompletionRate,
      deadlineAdherenceRate,
      focusConsistencyRate,
      riskMitigationScore,
      overduePenalty
    },
    explanation,
    contributingFactors,
    historicalChanges: historicalEntries
  };
}

// ==========================================
// 7. DETERMINISTIC DAILY BRIEFING GENERATOR
// ==========================================
export function generateDailyBriefing(
  tasks: Task[],
  mode: "morning" | "evening" = "morning",
  userName: string = "Hemanth"
): DailyBriefingData {
  const activeTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  const completedToday = tasks.filter((t) => t.status === "completed");
  const risk = evaluateFailureRisk(tasks);

  let greeting = "";
  let summary = "";
  const priorities: string[] = [];
  const risks: string[] = [...risk.riskReasons];
  const actions: string[] = [];

  const totalFocusMinutesToday = activeTasks.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);

  if (mode === "morning") {
    greeting = `Good Morning, ${userName}`;
    if (activeTasks.length === 0) {
      summary = "Your schedule is clear today. No urgent crises or pending bottlenecks detected.";
      priorities.push("Review long-term projects", "Set up study or focus targets");
      actions.push("Log your first objective for the week");
    } else {
      summary = `You have ${activeTasks.length} pending objective(s) requiring ~${(totalFocusMinutesToday / 60).toFixed(1)} focus hours today. System Risk Level: ${risk.riskLevel.toUpperCase()} (${risk.riskScore}%).`;
      activeTasks.slice(0, 3).forEach((t) => {
        priorities.push(`${t.title} (Priority: ${t.priority.toUpperCase()})`);
      });
      actions.push(risk.recommendedAction);
    }
  } else {
    greeting = `Good Evening, ${userName}`;
    summary = `Day Review: ${completedToday.length} task(s) completed today with ${activeTasks.length} remaining in backlog.`;
    if (completedToday.length > 0) {
      priorities.push(`Completed: ${completedToday.map((t) => t.title).join(", ")}`);
    } else {
      priorities.push("No tasks marked completed today. Rebalance schedule for tomorrow.");
    }
    if (activeTasks.length > 0) {
      actions.push(`Tomorrow's primary target: ${activeTasks[0].title}`);
    } else {
      actions.push("Great work today. Relax and recharge.");
    }
  }

  return {
    mode,
    greeting,
    summary,
    priorities,
    risks: risks.length > 0 ? risks : ["No schedule risks detected."],
    actions,
    completedTasksCount: completedToday.length,
    pendingTasksCount: activeTasks.length,
    totalFocusMinutesToday,
    currentRiskScore: risk.riskScore,
    scoreDeltaToday: completedToday.length * 4 - (risk.riskScore > 75 ? 6 : 0)
  };
}

// ==========================================
// 8. DETERMINISTIC TASK DECOMPOSITION
// ==========================================
export function decomposeTaskLocal(
  title: string,
  hoursLeft: number = 24
): { title: string; dueDate: string }[] {
  const now = new Date();
  const stepHours = Math.max(2, Math.floor(hoursLeft / 3));

  const getIso = (h: number) => {
    const d = new Date(now.getTime() + h * 60 * 60 * 1000);
    return d.toISOString();
  };

  const lower = title.toLowerCase();
  if (lower.includes("code") || lower.includes("project") || lower.includes("software") || lower.includes("app")) {
    return [
      { title: "Define Database Schemas & Router Controllers", dueDate: getIso(stepHours) },
      { title: "Implement Core Logic Gates & Layout Components", dueDate: getIso(stepHours * 2) },
      { title: "End-to-End Validation, Test Run & Final Deployment", dueDate: getIso(hoursLeft) }
    ];
  } else if (lower.includes("interview") || lower.includes("prep") || lower.includes("dsa")) {
    return [
      { title: "Core Technical Concepts & Behavioral Story Review", dueDate: getIso(stepHours) },
      { title: "Mock Algorithm Problem Solving & Live Practice", dueDate: getIso(stepHours * 2) },
      { title: "Final Review of System Architecture & Questions", dueDate: getIso(hoursLeft) }
    ];
  } else if (lower.includes("deck") || lower.includes("pitch") || lower.includes("slides") || lower.includes("report")) {
    return [
      { title: "Outline Executive Summary & Key Metric Points", dueDate: getIso(stepHours) },
      { title: "Draft Slide Layouts & Verification Tables", dueDate: getIso(stepHours * 2) },
      { title: "Final Polish, Proofread & Export PDF", dueDate: getIso(hoursLeft) }
    ];
  }

  return [
    { title: `Phase 1: Research & Scope Definition for ${title}`, dueDate: getIso(stepHours) },
    { title: `Phase 2: Core Execution & Implementation`, dueDate: getIso(stepHours * 2) },
    { title: `Phase 3: Final Quality Check & Delivery`, dueDate: getIso(hoursLeft) }
  ];
}
