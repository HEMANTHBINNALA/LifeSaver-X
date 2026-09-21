"use server";

import { askGemini } from "@/lib/gemini";
import {
  evaluateFailureRisk,
  evaluateTaskPriority,
  generateRecoveryPlan,
  decomposeTaskLocal,
  executeAutoReplan
} from "@/lib/agents/orchestrator";
import { Task } from "@/lib/agents/types";

// 1. Analyze Deadline Risk
export async function analyzeDeadlineRiskAction(
  title: string,
  deadline: string,
  estimatedEffort: number,
  userBehavior: string,
  calendarAvailability: string
) {
  const dummyTask: Task = {
    id: "temp-task",
    title,
    deadline,
    estimated_minutes: estimatedEffort * 60,
    priority: "critical",
    status: "todo",
    category: "general",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dependencies: [],
    progress: 0,
    source: "user"
  };

  const localEval = evaluateFailureRisk([dummyTask]);
  
  const prompt = `
    Task Title: ${title}
    Deadline: ${deadline}
    Estimated Effort: ${estimatedEffort} hours
    User Behavior: ${userBehavior}
    Calendar Availability: ${calendarAvailability}

    Analyze the deadline risk. Predict the likelihood of missing this deadline.
    Provide:
    1. A risk percentage score (0-100).
    2. A risk level: "green", "yellow", "orange", or "red".
    3. A brief explanation/reason for this risk.
    4. A recovery recommendation action.
  `;

  const fallback = {
    riskScore: localEval.riskScore,
    riskLevel: localEval.riskLevel,
    riskReason: localEval.riskReasons[0] || "High workload ratio detected before deadline.",
    recommendedAction: localEval.recommendedAction
  };

  return askGemini(prompt, fallback);
}

// 2. Generate Recovery Plan
export async function generateRecoveryPlanAction(
  title: string,
  deadline: string,
  estimatedEffort: number
) {
  const dummyTask: Task = {
    id: "task-recovery",
    title,
    deadline,
    estimated_minutes: estimatedEffort * 60,
    priority: "critical",
    status: "todo",
    category: "general",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dependencies: [],
    progress: 0,
    source: "user"
  };

  const localPlan = generateRecoveryPlan([dummyTask], Math.max(3, estimatedEffort * 0.8));

  const prompt = `
    Create an Emergency Recovery Plan for a task: "${title}"
    Due on: ${deadline}
    Effort needed: ${estimatedEffort} hours.

    Provide a JSON object containing:
    1. "simplifiedScope": Array of 3 key subtasks to complete (removing all low-value items).
    2. "timeBlocks": Array of time intervals and what to focus on during each block.
    3. "completionSequence": Array of execution order.
    4. "criticalPath": A single string identifying the absolute bottleneck.
  `;

  const fallback = {
    simplifiedScope: localPlan.simplifiedScope,
    timeBlocks: localPlan.timeBlocks.map((b) => ({ time: `${b.startTime} - ${b.endTime}`, focus: b.focus })),
    completionSequence: localPlan.completionSequence,
    criticalPath: localPlan.criticalPath
  };

  return askGemini(prompt, fallback);
}

// 3. Interview Roadmap & Quizzes
export async function generateInterviewRoadmapAction(jobRole: string) {
  const prompt = `
    Generate an Interview Preparation roadmap for a candidate interview with topic: "${jobRole}".
    
    Provide:
    1. "skills": Array of 4-5 key skills extracted for the role.
    2. "roadmap": Array of objects containing "title" and "desc" for study blocks.
    3. "quizzes": Array of 3 multiple choice questions. Each question has "question", "options" (array of 4 choices), "answer" (string matching correct option), and "explanation".
    4. "readinessScore": Simulated readiness percentage (e.g. 45-75%).
  `;

  const fallback = {
    skills: ["React 19 Concurrent Features", "Next.js App Router & Server Actions", "TypeScript Strict Modes", "Core Web Vitals Optimization", "Tailwind CSS Layouts"],
    roadmap: [
      { title: "Block 1: App Router & Layouts", desc: "Understand nested templates, layout preservation, dynamic routes, and Server vs Client component boundaries." },
      { title: "Block 2: Server Actions & Cache", desc: "Practice async data mutations, optimistic updates, route validation revalidation, and next/cache tags." },
      { title: "Block 3: Web Performance", desc: "Deep dive into Image component, streaming SSR, Suspense loading boundaries, and Cumulative Layout Shift optimization." }
    ],
    quizzes: [
      {
        question: "Which of the following is true regarding React Server Components (RSC) and Client Components?",
        options: [
          "RSCs render only on the client, while Client Components render on the server and client.",
          "RSCs render on the server and have zero client bundle cost, whereas Client Components can use React hooks like useState.",
          "Client Components cannot import server actions.",
          "RSCs require the 'use server' directive at the top of the file."
        ],
        answer: "RSCs render on the server and have zero client bundle cost, whereas Client Components can use React hooks like useState.",
        explanation: "React Server Components are executed only on the server, meaning their dependencies are not included in the client JavaScript bundle. Client Components, marked with 'use client', are hydrated on the client and can use state and interactive hooks."
      },
      {
        question: "How do you revalidate a specific cache tag in Next.js Server Actions?",
        options: [
          "revalidateTag('tag-name')",
          "cache.invalidate('tag-name')",
          "refreshTag('tag-name')",
          "Router.revalidate('tag-name')"
        ],
        answer: "revalidateTag('tag-name')",
        explanation: "Next.js provides the 'revalidateTag' function inside Server Actions to purge the cached entries tagged with a specific string, causing them to fetch fresh data on the subsequent request."
      },
      {
        question: "What does cumulative layout shift (CLS) measure?",
        options: [
          "The speed at which primary text content is loaded.",
          "The duration between user click and response handling.",
          "The visual stability of the page layout by measuring unexpected shifts of visible elements.",
          "The network latency of static file bundles."
        ],
        answer: "The visual stability of the page layout by measuring unexpected shifts of visible elements.",
        explanation: "CLS measures the visual stability of a webpage. Elements that move around during rendering create a jarring user experience, and CLS scores quantify these shifts."
      }
    ],
    readinessScore: 62
  };

  return askGemini(prompt, fallback);
}

// 4. Parse Assignment Document
export async function parseAssignmentDocumentAction(textInput: string) {
  const prompt = `
    Analyze this assignment instruction text: "${textInput}".
    Extract:
    1. Key tasks (list).
    2. Primary requirements (list).
    3. A predicted deadline date or duration.
    4. Suggested milestones (array with "title" and "dueDate" strings).
    5. An estimated total effort hours to complete.
  `;

  const fallback = {
    tasks: [
      "Implement Secure JWT Login & Password Hashing",
      "Design Relational DB schema for workspace boards",
      "Deploy application to AWS Elastic Beanstalk",
      "Write End-to-End Cypress tests"
    ],
    requirements: [
      "Use PostgreSQL database for core models",
      "JWT tokens must expire in 15 minutes",
      "Test coverage must exceed 80%",
      "Deploy with SSL enabled"
    ],
    deadline: "Due in 3 days",
    milestones: [
      { title: "Establish Database Schemas", dueDate: "Day 1" },
      { title: "Secure Authentication Setup", dueDate: "Day 2" },
      { title: "Testing, CI/CD, and AWS Deploy", dueDate: "Day 3" }
    ],
    completionTimeEstimate: 18
  };

  return askGemini(prompt, fallback);
}

// 5. Voice Command Action
export async function voiceCommandAction(command: string, currentContext: any) {
  const lowerCmd = command.toLowerCase().trim();

  // 1. Task creation intent via voice e.g. "I have an assignment due tomorrow at 10 PM"
  if (lowerCmd.includes("assignment") || lowerCmd.includes("due") || lowerCmd.includes("task") || lowerCmd.includes("add")) {
    const isTomorrow = lowerCmd.includes("tomorrow");
    const d = new Date();
    if (isTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(22, 0, 0, 0); // 10 PM default

    let taskTitle = "Assignment Goal";
    if (lowerCmd.includes("assignment")) taskTitle = "Assignment Submission";
    if (lowerCmd.includes("interview")) taskTitle = "Interview Preparation";
    if (lowerCmd.includes("project")) taskTitle = "Project Deliverable";

    return {
      response: `Understood. I have created a new task "${taskTitle}" scheduled for ${isTomorrow ? "tomorrow at 10:00 PM" : "tonight"} with estimated effort logged. Risk engine updated.`,
      action: "create_task",
      taskData: {
        title: taskTitle,
        deadline: d.toISOString(),
        estimated_minutes: 180,
        priority: "critical",
        status: "todo",
        category: "student",
        source: "voice"
      }
    };
  }

  // 2. Progress update intent e.g. "I finished 40 percent of my assignment"
  const progressMatch = lowerCmd.match(/(\d+)\s*(?:percent|%)/);
  if (progressMatch && (lowerCmd.includes("finish") || lowerCmd.includes("complete") || lowerCmd.includes("done") || lowerCmd.includes("progress"))) {
    const pct = parseInt(progressMatch[1], 10);
    return {
      response: `Progress updated: logged ${pct}% completion. Monitoring engine checking for schedule deviations.`,
      action: "update_progress",
      progress: Math.min(100, Math.max(0, pct))
    };
  }

  // 3. Replanning intent e.g. "Replan my schedule"
  if (lowerCmd.includes("replan") || lowerCmd.includes("reschedule") || lowerCmd.includes("delay") || lowerCmd.includes("behind")) {
    return {
      response: "Triggering autonomous replanner. Analyzing delayed milestones, deferring low-priority items, and generating Plan 2.",
      action: "trigger_replan"
    };
  }

  // 4. Demo Profiles
  if (lowerCmd.includes("student") || lowerCmd.includes("taiari")) {
    return {
      response: "Initializing student crisis scenario. Alert: Final project code is due in 18 hours. Decomposing milestones and launching recovery plan.",
      action: "trigger_student_demo"
    };
  } else if (lowerCmd.includes("professional") || lowerCmd.includes("office") || lowerCmd.includes("naukri")) {
    return {
      response: "Activating professional crisis scenario. Client review slides are at risk (91%). Setting up presentation scope reduction roadmap.",
      action: "trigger_professional_demo"
    };
  } else if (lowerCmd.includes("entrepreneur") || lowerCmd.includes("pitch") || lowerCmd.includes("start")) {
    return {
      response: "Launching entrepreneur emergency scenario. Cap table pitch and landing page checkout launch are conflict-locked. Reallocating focus slots.",
      action: "trigger_entrepreneur_demo"
    };
  } else if (lowerCmd.includes("pomodoro") || lowerCmd.includes("focus")) {
    return {
      response: "Pomodoro focus sprint timer initiated. Muting non-urgent notifications.",
      action: "start_pomodoro"
    };
  } else if (lowerCmd.includes("emergency") || lowerCmd.includes("rescue")) {
    return {
      response: "Emergency recovery sequence initiated. Switching system theme to warning state. Deploying recovery checklists.",
      action: "activate_emergency"
    };
  } else if (lowerCmd.includes("dashboard") || lowerCmd.includes("home")) {
    return {
      response: "Navigating to Mission Control command center.",
      action: "open_dashboard"
    };
  }

  return {
    response: `I heard: "${command}". I am monitoring your workload and active deadlines. Say "Add task" or "Replan schedule" for direct action.`,
    action: "none"
  };
}

// 6. Deconstruct Task Goal
export async function decomposeTaskAction(title: string, deadline: string) {
  const prompt = `
    Deconstruct this goal/project: "${title}" into structured subtasks.
    Deadline: ${deadline}

    Return a JSON object containing:
    1. "milestones": Array of sub-tasks containing:
       - "title": String.
       - "dueDate": ISO String relative to the timeline.
       - "effort": Estimated effort hours.
       - "riskScore": Failure risk probability (0-100).
  `;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursLeft = Math.max(12, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  const localSteps = decomposeTaskLocal(title, hoursLeft) || [];
  const milestones = localSteps.map((m, idx) => ({
    title: m.title,
    dueDate: m.dueDate,
    effort: Math.round((hoursLeft / Math.max(1, localSteps.length)) * 0.4),
    riskScore: Math.round(30 + (idx * 10))
  }));

  const fallback = {
    milestones: milestones
  };

  return askGemini(prompt, fallback);
}

// 7. Optimize My Week (Reschedule Calendar)
export async function optimizeWeekAction(events: any[], tasks: any[]) {
  const now = new Date();
  const fallback = {
    optimizedEvents: events.map((ev) => {
      if (ev.isConflict) {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        start.setHours(start.getHours() + 4.5);
        end.setHours(end.getHours() + 4.5);
        return {
          ...ev,
          start: start.toISOString(),
          end: end.toISOString(),
          isConflict: false
        };
      }
      return ev;
    }),
    updatedTasks: tasks.map((t: any) => {
      if (t.riskLevel === "red" || t.riskLevel === "orange") {
        return {
          ...t,
          riskScore: Math.max(25, (t.riskScore || 80) - 20),
          riskLevel: "yellow",
          riskReason: "Calendar optimized: non-essential conflict shifted."
        };
      }
      return t;
    }),
    focusBlocksAdded: [
      "Deep Work Focus Sprint (4:00 PM - 7:00 PM Today)",
      "High-Priority Buffer Slot (8:30 PM - 10:00 PM Today)"
    ]
  };

  return fallback;
}

// 8. Meeting Recorder simulation
export async function recordMeetingAction(audioSeconds: number) {
  const prompt = `
    Simulate a meeting recording that lasted ${audioSeconds} seconds.
    Generate a dynamic transcript, notes summary, and action items.
  `;

  const fallback = {
    transcript: [
      "[00:12] User: We have a major presentation tomorrow. We need to compile the performance index.",
      "[00:25] AI Coach: I recommend cloning the Q2 slide template and loading direct SLA tables.",
      "[00:45] User: Okay, I will start that block. Can you mute Slack alerts automatically?",
      "[01:10] AI Coach: Done. Deep Work mode activated. Focus hours locked."
    ],
    summary: "Crisis briefing review regarding final slides preparation. AI Coach recommended templating and initiated silent notifications status.",
    actionItems: [
      "Complete SLA metrics compiling by 5:00 PM",
      "Deploy Option pool option audits spreadsheet model",
      "Re-run validation checks on Next.js page routing structures"
    ]
  };

  return askGemini(prompt, fallback);
}

// 9. Semantic Memory Search
export async function searchMemoryAction(query: string, logs: any[]) {
  const lowerQuery = query.toLowerCase();
  const matched = logs.filter((log: any) => {
    return (
      (log.title && log.title.toLowerCase().includes(lowerQuery)) ||
      (log.content && log.content.toLowerCase().includes(lowerQuery)) ||
      (log.category && log.category.toLowerCase().includes(lowerQuery))
    );
  });

  return {
    results: matched.length > 0 ? matched : logs.slice(0, 3)
  };
}
