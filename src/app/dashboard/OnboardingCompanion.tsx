"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Play,
  X,
  Volume2,
  VolumeX,
  Search,
  BookOpen,
  Award,
  Video,
  Languages,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ChevronLeft,
  Info,
  Keyboard,
  Minimize2,
  Printer,
  Compass,
  Zap,
  PlayCircle,
  FileText,
  UserCheck,
  Calendar as CalendarIcon,
  Activity,
  User,
  Heart,
  FileCode,
  Shield,
  Layers,
  Inbox,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { AppState, Task, CalendarEvent } from "@/lib/state/store";

interface OnboardingCompanionProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isVoiceOpen: boolean;
  setIsVoiceOpen: (open: boolean) => void;
  handleOptimizeMyWeek: () => Promise<void>;
  handleStartReplay: () => void;
  handleLoadDemo: (profile: "student" | "professional" | "entrepreneur") => void;
  explainTopic?: string | null;
  setExplainTopic?: (topic: string | null) => void;
  triggerJudgeTour?: boolean;
  setTriggerJudgeTour?: (trigger: boolean) => void;
}

// Language Translations for AI dialogue
type LangCode = "en" | "hi" | "te";

interface DialogueTranslation {
  welcome: string;
  welcomeSub: string;
  tourStep1: string;
  tourStep2: string;
  tourStep3: string;
  tourStep4: string;
  demoStart: string;
  demoDoc: string;
  demoRisk: string;
  demoRecovery: string;
  demoCalConflict: string;
  demoCalResolve: string;
  demoVoiceAlert: string;
  demoReplay: string;
  demoEnd: string;
}

const TRANSLATIONS: Record<LangCode, DialogueTranslation> = {
  en: {
    welcome: "Welcome to LifeSaver X. I am Nova, your AI Chief of Staff.",
    welcomeSub: "My purpose is simple: prevent missed opportunities, protect your time, and rescue your goals.",
    tourStep1: "This is Mission Control. It monitors your workload, predicts deadline risks, and coordinates every AI agent.",
    tourStep2: "Here is your Smart Calendar. It highlights conflict zones. You can click 'Optimize My Week' to auto-reschedule.",
    tourStep3: "This is your Voice Orb Assistant. Click it to speak commands like 'Start Pomodoro' or ask queries in English, Hindi, and Telugu.",
    tourStep4: "Here is the Copilot Hub. Specialized agents (Student, Professional, Entrepreneur) coordinate workflows tailored to you.",
    demoStart: "Initializing autonomous Hackathon presentation. Nova is taking the wheel!",
    demoDoc: "An assignment syllabus PDF arrives. Smart Document Copilot automatically extracts deadlines and generates flashcards.",
    demoRisk: "Oh no! A critical project is due in 18 hours requiring 16 effort hours. Risk Predictor flags Failure Risk at 84%!",
    demoRecovery: "Recovery Agent immediately activates, generating an emergency plan, pruning scopes, and scheduling focus slots.",
    demoCalConflict: "Scheduler Agent alerts a calendar conflict overlap between the project workslot and a mandatory advisory sync.",
    demoCalResolve: "Conflict resolved! Rescheduling optimizer moves non-essential blocks. Uptime risk drops and focus time is secured.",
    demoVoiceAlert: "Voice Copilot speaks instructions: 'Warning resolved. Focus block booked for 4:00 PM. LifeScore restored.'",
    demoReplay: "Let's run Cinematic Replay to review the complete autonomous optimization sequence completed today.",
    demoEnd: "Presentation complete! Stress reduced by 40%, LifeScore boosted to 95. You are ready to explore yourself!"
  },
  hi: {
    welcome: "LifeSaver X में आपका स्वागत है। मैं नोवा हूँ, आपकी AI चीफ ऑफ स्टाफ।",
    welcomeSub: "मेरा उद्देश्य सरल है: छूटे हुए अवसरों को रोकना, आपके समय की रक्षा करना और आपके लक्ष्यों को बचाना।",
    tourStep1: "यह मिशन कंट्रोल है। यह आपके कार्यभार की निगरानी करता है, समय सीमा के जोखिमों की भविष्यवाणी करता है, और हर AI एजेंट का समन्वय करता है।",
    tourStep2: "यहाँ आपका स्मार्ट कैलेंडर है। यह संघर्ष क्षेत्रों (conflicts) को रेखांकित करता है। आप ऑटो-रीशेड्यूल करने के लिए 'Optimize My Week' पर क्लिक कर सकते हैं।",
    tourStep3: "यह आपका वॉयस असिस्टेंट है। 'Start Pomodoro' जैसे आदेश बोलने के लिए या हिंदी, अंग्रेजी और तेलुगु में सवाल पूछने के लिए इस पर क्लिक करें।",
    tourStep4: "यहाँ को-पायलट हब है। विशिष्ट को-पायलट एजेंट आपके अनुसार वर्कफ़्लो का समन्वय करते हैं।",
    demoStart: "स्वायत्त हैकथॉन प्रस्तुति शुरू की जा रही है। नोवा कमान संभाल रही है!",
    demoDoc: "एक असाइनमेंट सिलेबस PDF प्राप्त होता है। स्मार्ट डॉक्यूमेंट को-पायलट स्वचालित रूप से समय सीमा निकालता है और फ्लैशकार्ड बनाता है।",
    demoRisk: "अरे नहीं! एक महत्वपूर्ण प्रोजेक्ट 18 घंटों में पूरा होना है। रिस्क प्रेडिक्टर विफलता जोखिम को 84% पर फ्लैग करता है!",
    demoRecovery: "रिकवरी एजेंट तुरंत सक्रिय होता है, एक आपातकालीन योजना बनाता है, दायरा छोटा करता है, और फोकस स्लॉट निर्धारित करता है।",
    demoCalConflict: "शेड्यूलर एजेंट प्रोजेक्ट वर्कस्लॉट और एक अनिवार्य बैठक के बीच कैलेंडर संघर्ष का अलर्ट देता है।",
    demoCalResolve: "संघर्ष हल हो गया! रीशेड्यूलिंग ऑप्टिमाइज़र गैर-जरूरी बैठकों को आगे बढ़ाता है। विफलता का जोखिम कम होता है और समय सुरक्षित होता है।",
    demoVoiceAlert: "वॉयस को-पायलट निर्देश बोलता है: 'चेतावनी का समाधान हो गया है। शाम 4:00 बजे फोकस ब्लॉक बुक किया गया है।'",
    demoReplay: "आइए आज पूरी की गई स्वायत्त अनुकूलन श्रृंखला की समीक्षा करने के लिए सिनेमाई रीप्ले चलाएं।",
    demoEnd: "प्रस्तुति समाप्त! तनाव 40% कम हुआ, लाइफस्कोर बढ़कर 95 हो गया। अब आप खुद एक्सप्लोर करने के लिए तैयार हैं!"
  },
  te: {
    welcome: "LifeSaver X కి స్వాగతం. నేను నోవా, మీ AI చీఫ్ ఆఫ్ స్టాఫ్.",
    welcomeSub: "నా ఉద్దేశ్యం చాలా సులభం: అవకాశాలను కోల్పోకుండా ఆపడం, మీ సమయాన్ని రక్షించడం మరియు మీ లక్ష్యాలను కాపాడటం.",
    tourStep1: "ఇది మిషన్ కంట్రోల్. ఇది మీ పనిభారాన్ని పర్యవేక్షిస్తుంది, గడువు ప్రమాదాలను అంచనా వేస్తుంది మరియు ప్రతి AI ఏజెంట్‌ను సమన్వయం చేస్తుంది.",
    tourStep2: "ఇది మీ స్మార్ట్ క్యాలెండర్. ఇది వివాదాలను గుర్తిస్తుంది. వివాదాలను స్వయంచాలకంగా మార్చడానికి మీరు 'Optimize My Week' పై క్లిక్ చేయవచ్చు.",
    tourStep3: "ఇది మీ వాయిస్ ఆర్బ్ అసిస్టెంట్. 'Start Pomodoro' వంటి కమాండ్‌లు ఇవ్వడానికి లేదా తెలుగు, హిందీ, ఇంగ్లీషులలో ప్రశ్నలు అడగడానికి దీనిని క్లిక్ చేయండి.",
    tourStep4: "ఇది కో-పైలట్ హబ్. మీ పని విధానాలకు అనుగుణంగా ప్రత్యేకంగా రూపొందించబడిన స్టూడెంట్, ప్రొఫెషనల్, ఎంటర్‌ప్రెన్యూర్ ఏజెంట్లు ఇక్కడ ఉంటారు.",
    demoStart: "స్వయంప్రతిపత్తి హ్యాకథాన్ ప్రెజెంటేషన్ ప్రారంభించబడుతోంది. నోవా కంట్రోల్ తీసుకుంటోంది!",
    demoDoc: "అసైన్‌మెంట్ సిలబస్ PDF అప్‌లోడ్ చేయబడింది. స్మార్ట్ డాక్యుమెంట్ కో-పైలట్ స్వయంచాలకంగా గడువులను గుర్తిస్తుంది.",
    demoRisk: "అయ్యో! 18 గంటల్లో ప్రాజెక్ట్ గడువు ఉంది, కానీ 16 గంటల పని మిగిలి ఉంది. రిస్క్ ప్రిడిక్టర్ ఫెయిల్యూర్ రిస్క్‌ను 84% గా చూపిస్తోంది!",
    demoRecovery: "రికవరీ ఏజెంట్ వెంటనే యాక్టివేట్ అవుతుంది, అత్యవసర ప్రణాళికను తయారు చేస్తుంది, పరిధిని తగ్గిస్తుంది మరియు ఫోకస్ స్లాట్‌లను బుక్ చేస్తుంది.",
    demoCalConflict: "షెడ్యూలర్ ఏజెంట్ ప్రాజెక్ట్ సమయానికి మరియు సలహాదారు సింక్‌కు మధ్య క్యాలెండర్ వివాదాన్ని గుర్తిస్తుంది.",
    demoCalResolve: "క్యాలెండర్ వివాదం పరిష్కరించబడింది! ఆప్టిమైజర్ అనవసరమైన మీటిНГలను ముందుకు జరుపుతుంది.",
    demoVoiceAlert: "వాయిస్ కో-పైలట్ ఇలా చెబుతుంది: 'హెచ్చరిక పరిష్కరించబడింది. సాయంత్రం 4:00 గంటలకు ఫోకస్ బ్లాక్ బుక్ చేయబడింది.'",
    demoReplay: "ఈరోజు పూర్తి చేసిన స్వయంప్రతిపత్తి ఆప్టిమైజేషన్ ప్రక్రియను సమీక్షించడానికి సినిమాటిక్ రీప్లే రన్ చేద్దాం.",
    demoEnd: "ప్రెజెంటేషన్ పూర్తయింది! ఒత్తిడి 40% తగ్గింది, లైఫ్‌స్కోర్ 95 కి పెరిగింది. ఇప్పుడు మీరు సొంతంగా అన్వేషించడానికి సిద్ధంగా ఉన్నారు!"
  }
};

// Help Center search registry
interface HelpItem {
  title: string;
  category: "Tutorial" | "Doc" | "Video";
  summary: string;
  actions: string[];
  features: string[];
  tabTarget: string;
}

const HELP_REGISTRY: HelpItem[] = [
  {
    title: "How to use the Assignment Copilot",
    category: "Tutorial",
    summary: "Navigate to the Documents tab or Copilot Hub. Upload a syllabus PDF, text or image file. The AI analyzes requirements, suggests study milestones, and creates active backlog goals.",
    actions: ["Upload PDF", "Start DSA study roadmap"],
    features: ["Milestone Generator", "Flashcards Creator", "Study Quizzes"],
    tabTarget: "documents"
  },
  {
    title: "Mastering Mission Control",
    category: "Doc",
    summary: "Mission Control is the primary operations panel of LifeSaver X. It shows Live CPU brain thoughts, Failure Risk gauge charts, Daily briefings, and a permanent AI Operations streaming logger.",
    actions: ["Toggle Theme", "Select Crisis Demo"],
    features: ["Failure Risk Predictor", "Priority Engine Score", "Live Ops Logger"],
    tabTarget: "mission-control"
  },
  {
    title: "Understanding LifeScore & Digital Twin",
    category: "Doc",
    summary: "LifeScore (0-100) measures scheduling health, focus sessions, sleep cycles, and task buffers. The Behavioral Twin studies delay habits, typing speed, and focus intervals to forecast potential burnout.",
    actions: ["Open Twin Profile", "View stress charts"],
    features: ["Burnout forecast", "Stress area chart", "Behavioral Insights"],
    tabTarget: "twin"
  },
  {
    title: "Vocal Command Operations (Voice Assistant)",
    category: "Video",
    summary: "Click the floating purple Microphone Orb at the bottom right. Issue natural commands like: 'Start Pomodoro', 'Schedule my week', 'Load Student Crisis', or ask questions.",
    actions: ["Open Voice Orb", "Play Audio Briefing"],
    features: ["Natural language commands", "Multi-lingual translation feedback", "Briefing audio tracks"],
    tabTarget: "mission-control"
  },
  {
    title: "Triggering Emergency Recovery Mode",
    category: "Tutorial",
    summary: "When a deadline risk climbs above 70%, the Recovery Agent triggers. It prunes secondary objectives, outlines critical paths, blocks calendar hours, and locks down the interface for deep work focus.",
    actions: ["Compress timeline", "Start Pomodoro clock"],
    features: ["Emergency checklist", "Focus workslots blocker", "Critical path indicator"],
    tabTarget: "recovery"
  },
  {
    title: "Preparing for Technical Interviews",
    category: "Video",
    summary: "Launch the Copilots Hub and select Career / Professional Advisor. Key in the job description to generate study roadmaps, React 19/Next.js quizzes, and record mock sync transcripts.",
    actions: ["Start Mock prepare", "Solve DSA problem"],
    features: ["Interview roadmaps", "Interactive quizzes", "Meeting transcript extractor"],
    tabTarget: "copilots"
  }
];

// Video Tutorial Chapter Definition (Academy chapters matching the 13 lessons)
interface TutorialChapter {
  id: string;
  title: string;
  duration: string;
  desc: string;
  videoFrames: string[];
}

const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: "getting-started",
    title: "1. Getting Started with Nova OS",
    duration: "2 min",
    desc: "A high-level welcome to your AI Chief of Staff designed to prevent failure.",
    videoFrames: [
      "Welcome to LifeSaver X - Powered by Nova AI.",
      "This is a proactive operating system designed to shield your schedule.",
      "The system monitors deadlines, schedules, and stress indicators to keep you ahead.",
      "Let's learn how to leverage multi-agent intelligence to secure your targets."
    ]
  },
  {
    id: "mission-control",
    title: "2. Mission Control Cockpit",
    duration: "3 min",
    desc: "Monitoring CPU neural streams, logs, and success probabilities.",
    videoFrames: [
      "Mission Control gathers and monitors scheduling telemetry.",
      "Watch the Live CPU thoughts to see active context evaluations.",
      "The Daily Briefing provides a consolidated task breakdown every morning.",
      "Review the Operations Console stream to track task priority scoring."
    ]
  },
  {
    id: "digital-twin",
    title: "3. Digital Twin Behavioral modeling",
    duration: "4 min",
    desc: "Understanding stress thresholds, focus decay, and attention profiles.",
    videoFrames: [
      "The Digital Twin builds an attention profile of your work habits.",
      "If cognitive limits decay, stress indexes are updated instantly.",
      "The twin forecasts burnout risks to request automatic rest buffers.",
      "Keep logs of habits like hydration or sleep cycles to adjust stats."
    ]
  },
  {
    id: "voice-ai",
    title: "4. Vocal Core Orb & Voice AI",
    duration: "3 min",
    desc: "Commanding Nova using voice synth in English, Hindi, and Telugu.",
    videoFrames: [
      "The glowing orb at the bottom right is your voice microphone center.",
      "Issue voice controls like 'Load Startup Pitch Scenario' or 'Deconflict my week'.",
      "Narration subtitles and multi-lingual voice readouts keep commands transparent.",
      "Hear executive voice summaries of your schedule by clicking Play Audio."
    ]
  },
  {
    id: "recovery-agent",
    title: "5. Recovery Agent Autopilot",
    duration: "4 min",
    desc: "Emergency action lists, Pomodoro focus shields, and path calculations.",
    videoFrames: [
      "When deadline risk breaches 70%, the Recovery Agent gains controls.",
      "Non-essential items are pruned from the immediate checklists.",
      "A clear step-by-step critical path list guides your priority actions.",
      "The Pomodoro Focus Shield blocks out messaging pings for deep study."
    ]
  },
  {
    id: "assignment-copilot",
    title: "6. Assignment Syllabi Parsing",
    duration: "3 min",
    desc: "Scanning instructions, due dates, and generating test flashcards.",
    videoFrames: [
      "Drag and drop syllabi PDFs in the Document Center.",
      "The Copilot extracts due dates, milestones, and task checklists.",
      "Tailored active milestones are inserted into your backlog automatically.",
      "Study custom flashcards generated directly from your lecture notes."
    ]
  },
  {
    id: "interview-copilot",
    title: "7. Professional Interview Trainer",
    duration: "4 min",
    desc: "Creating job role roadmaps and mock preparation quizzes.",
    videoFrames: [
      "Configure Career preparations inside the Copilot registry tab.",
      "The system maps full study timelines tailored to tech role listings.",
      "Practice mock interview questions with live correct/incorrect evaluations.",
      "Transcripts of recorded mock calls are summarized into study cards."
    ]
  },
  {
    id: "calendar-intel",
    title: "8. Smart Calendar Optimizer",
    duration: "3 min",
    desc: "Resolving event overlaps and shifting focus blocks autonomously.",
    videoFrames: [
      "Calendar conflict overlays display scheduling risks in neon amber.",
      "Click the Calendar Optimizer to run the scheduling deconfliction algorithm.",
      "Secondary meetings are shifted to secure dedicated focus work blocks.",
      "Stress levels drop and calendar health reports stable."
    ]
  },
  {
    id: "replay",
    title: "9. Cinematic Replay review",
    duration: "2 min",
    desc: "Watching Nova's historical optimization timeline in motion.",
    videoFrames: [
      "Open Life Timeline and click Replay to trigger the cinematic screen.",
      "The timeline visually narrates how Nova intercepted stress spikes.",
      "Watch steps showing document arrivals, risk alerts, and rescheduling.",
      "Replays demonstrate the AI Operating System efficiency to judges."
    ]
  },
  {
    id: "emergency-mode",
    title: "10. Emergency Overrides UI",
    duration: "3 min",
    desc: "Red dashboard alert states, locked focus screens, and rest reminders.",
    videoFrames: [
      "Emergency mode locks the interface into high-visibility red layouts.",
      "Task managers are restricted to primary recovery checklist tasks.",
      "Visual scanlines and warning prompts minimize multitasking.",
      "Complete the priority task checklist to safely restore dashboard grids."
    ]
  },
  {
    id: "memory",
    title: "11. Shared Memory Vault",
    duration: "3 min",
    desc: "Searching logs and retrieving contextual details from past syncs.",
    videoFrames: [
      "The Memory Vault stores all agent communications and operations logs.",
      "Type search terms into the Memory box to scan historical logs.",
      "Nova retrieves past transcripts, flashcards, and syllabus milestones.",
      "Shared logs keep all underlying autonomous agents in context."
    ]
  },
  {
    id: "lifescore",
    title: "12. LifeScore Telemetry",
    duration: "2 min",
    desc: "Managing health gauges, task buffers, and stress penalties.",
    videoFrames: [
      "LifeScore represents your overall time scheduling buffer rating.",
      "Completing checklists and focus pomodoros boosts your LifeScore index.",
      "Ignoring conflicts or sleep deprivation triggers LifeScore drops.",
      "Maintain a green LifeScore to secure maximum productivity rewards."
    ]
  },
  {
    id: "analytics",
    title: "13. Analytics Telemetry Dashboard",
    duration: "3 min",
    desc: "Reviewing weekly focus charts, streaks, and academy badges.",
    videoFrames: [
      "The Analytics Hub displays stress charts and task completion areas.",
      "Monitor focus hours and daily streaks to track performance health.",
      "Earn badges such as Recovery Expert and Calendar Ninja as you learn.",
      "Access the graduation portal after completing all active missions."
    ]
  }
];

// Sandbox 10 Scenarios definitions
interface SandboxTask {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  effort: number;
  completed: boolean;
  riskScore: number;
  riskLevel: "green" | "orange" | "red";
  category: string;
}

interface SandboxEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isConflict: boolean;
  description: string;
}

interface SandboxProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  stress: number;
  lifeScore: number;
  tasks: SandboxTask[];
  events: SandboxEvent[];
}

const SANDBOX_PROFILES: SandboxProfile[] = [
  {
    id: "student",
    name: "Rahul (Engineering Student)",
    role: "Undergrad CS, 3rd Year",
    description: "Compiler lab assignment due in 18 hours. Internship mock interview scheduled. Stressed, massive task overlap.",
    stress: 92,
    lifeScore: 58,
    tasks: [
      { id: "sb-1", title: "Compile Lab 4: Abstract Syntax Tree Parser", priority: "critical", effort: 12, completed: false, riskScore: 92, riskLevel: "red", category: "Academic" },
      { id: "sb-2", title: "Next.js Frontend Tech Mock Interview Prep", priority: "high", effort: 4, completed: false, riskScore: 60, riskLevel: "orange", category: "Career" }
    ],
    events: [
      { id: "se-1", title: "Compiler Parser Lab Code Due", start: "14:00", end: "17:00", isConflict: true, description: "Requires focus blocks." },
      { id: "se-2", title: "CS Peer Mentorship Advisory Review", start: "14:30", end: "15:30", isConflict: true, description: "Direct time overlap." }
    ]
  },
  {
    id: "founder",
    name: "Sarah (Startup Founder)",
    role: "CEO, Tech Biotech SaaS",
    description: "VC pitch deck review tomorrow. Stripe checkout integration failing. Conflicting board check-in slots.",
    stress: 88,
    lifeScore: 62,
    tasks: [
      { id: "sb-3", title: "Finalize Pitch Deck Financial Projections", priority: "critical", effort: 8, completed: false, riskScore: 85, riskLevel: "red", category: "Finance" },
      { id: "sb-4", title: "Fix Stripe Checkout Webhook Failures", priority: "high", effort: 5, completed: false, riskScore: 70, riskLevel: "orange", category: "Technical" }
    ],
    events: [
      { id: "se-3", title: "VC Pre-Seed Investor Review Pitch", start: "10:00", end: "11:30", isConflict: true, description: "Critical pitch hour." },
      { id: "se-4", title: "Product Dev Sprint Planning Session", start: "10:30", end: "12:00", isConflict: true, description: "Overlaps with investor pitch." }
    ]
  },
  {
    id: "medical",
    name: "Arjun (Medical Student)",
    role: "Pediatric Resident, 2nd Year",
    description: "Anatomy boards review due Friday. Clinical rotation conflict with surgery schedule.",
    stress: 91,
    lifeScore: 54,
    tasks: [
      { id: "sb-5", title: "Anatomy Board Mock Exam & Quizzes", priority: "critical", effort: 14, completed: false, riskScore: 89, riskLevel: "red", category: "Boards" },
      { id: "sb-6", title: "Draft Patient Case Log Submissions", priority: "medium", effort: 3, completed: false, riskScore: 30, riskLevel: "green", category: "Clinical" }
    ],
    events: [
      { id: "se-5", title: "Clinical Ward Pediatric Rotation", start: "08:00", end: "12:00", isConflict: true, description: "In-patient checkups." },
      { id: "se-6", title: "Specialized Cardiology Surgery Assist", start: "10:00", end: "13:00", isConflict: true, description: "Critical rotation conflict." }
    ]
  },
  {
    id: "software_engineer",
    name: "David (Senior Software Engineer)",
    role: "Backend Architect, FinTech",
    description: "Production database migrations due tonight. AWS cloud cluster alerts. Conflict with client syncs.",
    stress: 95,
    lifeScore: 50,
    tasks: [
      { id: "sb-7", title: "Execute PostgreSQL Database Migration", priority: "critical", effort: 10, completed: false, riskScore: 94, riskLevel: "red", category: "Infrastructure" },
      { id: "sb-8", title: "Resolve EKS Cluster Memory Leak Warnings", priority: "high", effort: 6, completed: false, riskScore: 78, riskLevel: "orange", category: "Operations" }
    ],
    events: [
      { id: "se-7", title: "PostgreSQL Migration Dry Run Slot", start: "15:00", end: "17:00", isConflict: true, description: "Requires core attention." },
      { id: "se-8", title: "Executive Stakeholder Status Call", start: "16:00", end: "17:00", isConflict: true, description: "Direct calendar overlap." }
    ]
  },
  {
    id: "mba_student",
    name: "Meera (MBA Candidate)",
    role: "Finance Concentrator",
    description: "Business case analysis presentation. Recruitment mock interview overlap.",
    stress: 76,
    lifeScore: 68,
    tasks: [
      { id: "sb-9", title: "Submit Business Strategy Case Deck", priority: "critical", effort: 7, completed: false, riskScore: 75, riskLevel: "orange", category: "Academic" },
      { id: "sb-10", title: "LBO Modeling Practice Sheet", priority: "medium", effort: 4, completed: false, riskScore: 35, riskLevel: "green", category: "Prep" }
    ],
    events: [
      { id: "se-9", title: "Case Presentation Final Rehearsal", start: "11:00", end: "12:30", isConflict: true, description: "Team slide review." },
      { id: "se-10", title: "McKinsey Recruiter Mock Assessment", start: "12:00", end: "13:00", isConflict: true, description: "Recruitment scheduling clash." }
    ]
  },
  {
    id: "job_seeker",
    name: "Priya (Job Seeker)",
    role: "Frontend Engineer, React 19",
    description: "Stripe front-end coding test tomorrow morning. HR prep review overlap.",
    stress: 82,
    lifeScore: 64,
    tasks: [
      { id: "sb-11", title: "Frontend Mock Code Assessment", priority: "critical", effort: 8, completed: false, riskScore: 80, riskLevel: "red", category: "Career" },
      { id: "sb-12", title: "Review React 19 Server Components Docs", priority: "high", effort: 3, completed: false, riskScore: 45, riskLevel: "green", category: "Study" }
    ],
    events: [
      { id: "se-11", title: "Coding Test Assessment Window", start: "09:00", end: "11:00", isConflict: true, description: "Strict external evaluation." },
      { id: "se-12", title: "HR Recruiter Calibration Review", start: "10:00", end: "10:30", isConflict: true, description: "Immediate time clash." }
    ]
  },
  {
    id: "upsc_aspirant",
    name: "Anil (UPSC Aspirant)",
    role: "Civil Services Candidate",
    description: "General Studies Mains Mock Test due in 12 hours. Essay review overlap.",
    stress: 93,
    lifeScore: 48,
    tasks: [
      { id: "sb-13", title: "Write GS Paper III Answer Mock Test", priority: "critical", effort: 12, completed: false, riskScore: 91, riskLevel: "red", category: "Aspirations" },
      { id: "sb-14", title: "Read Monthly Current Affairs Magazine", priority: "high", effort: 5, completed: false, riskScore: 62, riskLevel: "orange", category: "Aspirations" }
    ],
    events: [
      { id: "se-13", title: "GS Mains Paper Mock Writing Session", start: "13:00", end: "16:00", isConflict: true, description: "Time-bound paper writing." },
      { id: "se-14", title: "Mentorship Answer Sheets Evaluation Review", start: "14:00", end: "15:30", isConflict: true, description: "Mentoring calendar conflict." }
    ]
  },
  {
    id: "corporate_manager",
    name: "Vikram (Corporate Manager)",
    role: "Senior Product Director",
    description: "Product roadmap launch sync. Executive OKR status review clash.",
    stress: 80,
    lifeScore: 70,
    tasks: [
      { id: "sb-15", title: "Finalize H2 Product Development Roadmap", priority: "critical", effort: 9, completed: false, riskScore: 78, riskLevel: "orange", category: "Product" },
      { id: "sb-16", title: "Compile H1 Budget Spending telemetry", priority: "medium", effort: 4, completed: false, riskScore: 40, riskLevel: "green", category: "Finance" }
    ],
    events: [
      { id: "se-15", title: "H2 Product Launch Final Board Sync", start: "14:00", end: "15:30", isConflict: true, description: "Stakeholder approval hour." },
      { id: "se-16", title: "Executive Strategy Alignment Checkin", start: "14:30", end: "15:30", isConflict: true, description: "Direct time overlap conflict." }
    ]
  },
  {
    id: "professional",
    name: "Alex (Corporate Professional)",
    role: "Senior Consultant, Deloitte",
    description: "Deloitte client review deck slides due tomorrow morning. Overlapped meetings.",
    stress: 78,
    lifeScore: 66,
    tasks: [
      { id: "sb-17", title: "Compile Client Strategy Review Slides", priority: "critical", effort: 7, completed: false, riskScore: 74, riskLevel: "orange", category: "Deliverables" },
      { id: "sb-18", title: "Verify Project Spend Invoices Tracker", priority: "medium", effort: 3, completed: false, riskScore: 32, riskLevel: "green", category: "Admin" }
    ],
    events: [
      { id: "se-17", title: "Client Deliverables Final Dry Run", start: "13:00", end: "14:30", isConflict: true, description: "Deloitte internally alignment." },
      { id: "se-18", title: "Internal Team Resourcing Sync Call", start: "13:30", end: "14:00", isConflict: true, description: "Conflicting Deloitte sync." }
    ]
  },
  {
    id: "entrepreneur",
    name: "Sophia (Indie Maker)",
    role: "Solopreneur, SaaS Platform",
    description: "Product Hunt launch preparation checklist due tomorrow. Overlapped marketing calls.",
    stress: 86,
    lifeScore: 60,
    tasks: [
      { id: "sb-19", title: "Finalize Product Hunt Launch Marketing Deck", priority: "critical", effort: 9, completed: false, riskScore: 84, riskLevel: "red", category: "Marketing" },
      { id: "sb-20", title: "Test React 19 Frontend Payment Links", priority: "high", effort: 4, completed: false, riskScore: 65, riskLevel: "orange", category: "Technical" }
    ],
    events: [
      { id: "se-19", title: "Solopreneur Product Hunt Launch Hour", start: "11:00", end: "13:00", isConflict: true, description: "Active promotion hour." },
      { id: "se-20", title: "Creator Interview Podcast Live Stream", start: "12:00", end: "13:00", isConflict: true, description: "Overlap scheduling conflict." }
    ]
  }
];

export default function OnboardingCompanion({
  activeTab,
  setActiveTab,
  state,
  setState,
  isVoiceOpen,
  setIsVoiceOpen,
  handleOptimizeMyWeek,
  handleStartReplay,
  handleLoadDemo,
  explainTopic,
  setExplainTopic,
  triggerJudgeTour,
  setTriggerJudgeTour
}: OnboardingCompanionProps) {
  // First Boot States
  const [bootStep, setBootStep] = useState<number>(0); // 0: black screen, 1: particles/glowing, 2: scanlines fade, 3: welcome sequence, 4: complete dashboard
  const [bootText, setBootText] = useState<string>("INITIALIZING NOVA OS CORE...");
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [learningPath, setLearningPath] = useState<"student" | "professional" | "entrepreneur" | null>(null);
  const [tourStep, setTourStep] = useState<number>(-1); // -1 = not started
  const [explainTarget, setExplainTarget] = useState<string | null>(null);
  
  // Floating Guide character state
  const [guideMinimized, setGuideMinimized] = useState<boolean>(false);
  const [guideExpression, setGuideExpression] = useState<"happy" | "point-left" | "point-right" | "thinking" | "celebrate" | "speak">("happy");
  const [guideText, setGuideText] = useState<string>("");
  const [speechMuted, setSpeechMuted] = useState<boolean>(false);

  // Searchable Help center states
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [helpSearch, setHelpSearch] = useState<string>("");
  const [helpResults, setHelpResults] = useState<HelpItem[]>([]);

  // Contextual Help states
  const [contextTabHistory, setContextTabHistory] = useState<Record<string, boolean>>({});
  const [showContextPrompt, setShowContextPrompt] = useState<boolean>(false);

  // Video center states
  const [videoOpen, setVideoOpen] = useState<boolean>(false);
  const [currentChapterIdx, setCurrentChapterIdx] = useState<number>(0);
  const [videoPlayIdx, setVideoPlayIdx] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [chapterProgress, setChapterProgress] = useState<Record<string, number>>({});

  // Accessibility States
  const [appLang, setAppLang] = useState<LangCode>("en");
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);

  // 8 sequential active missions checklist
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({
    meetNova: false,
    createTask: false,
    uploadPDF: false,
    useVoice: false,
    optimizeWeek: false,
    viewReplay: false,
    completeAcademy: false
  });

  // Certificate states
  const [certificateOpen, setCertificateOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [isCertificateReady, setIsCertificateReady] = useState<boolean>(false);

  // Story Mode states
  const [storyOpen, setStoryOpen] = useState<boolean>(false);
  const [storySlideIdx, setStorySlideIdx] = useState<number>(0);

  // Judge Presentation Mode states (3 min automated tour)
  const [judgeModeActive, setJudgeModeActive] = useState<boolean>(false);
  const [judgeStepIndex, setJudgeStepIndex] = useState<number>(0);
  const judgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sandbox states
  const [sandboxOpen, setSandboxOpen] = useState<boolean>(false);

  // Demo Simulation state variables
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoSecIndex, setDemoSecIndex] = useState<number>(0);
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ask the AI Guide state
  const [aiQuestionOpen, setAiQuestionOpen] = useState<boolean>(false);
  const [aiQuestionText, setAiQuestionText] = useState<string>("");
  const [aiAnswersList, setAiAnswersList] = useState<Array<{ q: string; a: string }>>([]);

  // Voice Speech Synth reference
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasSpokenWelcomeRef = useRef(false);

  // Confetti Canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticlesRef = useRef<any[]>([]);
  const confettiAnimationRef = useRef<number | null>(null);

  // Initial OS first-boot sequencer effect
  useEffect(() => {
    // Check if first boot already occurred
    const firstBootDone = localStorage.getItem("nova_os_booted");
    if (firstBootDone === "true") {
      setBootStep(4);
      setShowWelcome(false);
      return;
    }

    // Run custom OS first-boot simulation step-by-step
    const steps = [
      { time: 1500, text: "LOADING PROACTIVE ATTENTION COEFFICIENTS...", step: 1 },
      { time: 3000, text: "AUDITING SCHEDULING CALENDAR OVERLAPS...", step: 2 },
      { time: 4200, text: "POWERING ON MISSION CONTROL OPERATIONS...", step: 3 },
      { time: 5500, text: "NOVA CORE ONLINE.", step: 4 }
    ];

    steps.forEach((s) => {
      setTimeout(() => {
        setBootText(s.text);
        if (s.step === 4) {
          setBootStep(4);
          localStorage.setItem("nova_os_booted", "true");
          // Play simulated boot-up tone using audio synth API
          playBootUpTone();
        } else {
          setBootStep(s.step);
        }
      }, s.time);
    });
  }, []);

  const playBootUpTone = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // Evolve premium chime chord (C5 -> E5 -> G5)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.6);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio Chime blocked by browser interaction restrictions.");
    }
  };

  // Read AI guide dialogues out loud using Web Speech Synthesis API
  const speakDialogue = (text: string) => {
    if (typeof window === "undefined" || speechMuted) return;
    
    // Stop any running speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      if (appLang === "hi") {
        utterance.lang = "hi-IN";
      } else if (appLang === "te") {
        utterance.lang = "te-IN";
      } else {
        utterance.lang = "en-US";
      }
      
      utterance.rate = 1.05;
      utterance.pitch = 1.05; // Calm, professional voice
      
      utterance.onstart = () => {
        setGuideExpression("speak");
      };
      
      utterance.onend = () => {
        setGuideExpression("happy");
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error: ", e);
    }
  };

  // Synchronize guide text when welcome sequence loads or transitions
  useEffect(() => {
    if (showWelcome && bootStep === 4) {
      setGuideText(`${TRANSLATIONS[appLang].welcome} ${TRANSLATIONS[appLang].welcomeSub}`);
      setGuideExpression("happy");
    }
  }, [showWelcome, appLang, bootStep]);

  // Read dialogue when welcome sequence loads or transitions
  useEffect(() => {
    if (showWelcome && guideText && !speechMuted && bootStep === 4 && !hasSpokenWelcomeRef.current) {
      hasSpokenWelcomeRef.current = true;
      const timer = setTimeout(() => {
        speakDialogue(guideText);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, guideText, speechMuted, bootStep]);

  // Trigger explain mode when explainTopic changes
  useEffect(() => {
    if (explainTopic) {
      handleExplainItem(explainTopic);
      if (setExplainTopic) {
        setExplainTopic(null); // Reset
      }
    }
  }, [explainTopic]);

  // Contextual explanation prompts on first visits to tabs
  useEffect(() => {
    if (showWelcome || tourStep !== -1 || demoActive || judgeModeActive) return;

    if (!contextTabHistory[activeTab]) {
      const localSkip = localStorage.getItem(`skip_context_${activeTab}`);
      if (localSkip === "true") return;

      setShowContextPrompt(true);
      setContextTabHistory(prev => ({ ...prev, [activeTab]: true }));
      setGuideExpression("happy");
      setGuideText(`I am Nova, your AI planner. Would you like a 30-second explanation of the ${activeTab.toUpperCase()} dashboard?`);
      speakDialogue(`I am Nova, your AI planner. Would you like a 30-second explanation of the ${activeTab.toUpperCase()} dashboard?`);
    }
  }, [activeTab, showWelcome, tourStep, demoActive, judgeModeActive]);

  // Watch for tour step changes to guide user interactively
  useEffect(() => {
    if (tourStep === -1) return;

    if (tourStep === 0) {
      setActiveTab("mission-control");
      setGuideExpression("point-left");
      setGuideText(TRANSLATIONS[appLang].tourStep1);
      speakDialogue(TRANSLATIONS[appLang].tourStep1);
    } else if (tourStep === 1) {
      setActiveTab("calendar");
      setGuideExpression("point-left");
      setGuideText(TRANSLATIONS[appLang].tourStep2);
      speakDialogue(TRANSLATIONS[appLang].tourStep2);
    } else if (tourStep === 2) {
      setIsVoiceOpen(true);
      setGuideExpression("point-right");
      setGuideText(TRANSLATIONS[appLang].tourStep3);
      speakDialogue(TRANSLATIONS[appLang].tourStep3);
    } else if (tourStep === 3) {
      setActiveTab("copilots");
      setGuideExpression("point-left");
      setGuideText(TRANSLATIONS[appLang].tourStep4);
      speakDialogue(TRANSLATIONS[appLang].tourStep4);
    }
  }, [tourStep, appLang]);

  // Monitor user actions during interactive tour steps to advance them
  useEffect(() => {
    if (tourStep === -1) return;
    
    if (tourStep === 0 && activeTab === "mission-control") {
      // User is on Mission Control, waits for calendar click or Next
    } else if (tourStep === 1 && activeTab === "calendar") {
      setTourStep(2);
    } else if (tourStep === 2 && isVoiceOpen) {
      setTourStep(3);
    } else if (tourStep === 3 && activeTab === "copilots") {
      const timer = setTimeout(() => {
        setGuideExpression("celebrate");
        setGuideText("Sensational! You have completed Nova's interactive spotlight tour! I am monitoring your workspace.");
        speakDialogue("Sensational! You have completed Nova's interactive spotlight tour! I am monitoring your workspace.");
        setTourStep(-1);
        triggerActionCompletion("meetNova");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isVoiceOpen, tourStep]);

  // Video Tutorial frame ticking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoPlaying) {
      interval = setInterval(() => {
        setVideoPlayIdx((prev) => {
          const next = prev + 1;
          const currentChapter = TUTORIAL_CHAPTERS[currentChapterIdx];
          if (next >= currentChapter.videoFrames.length) {
            setIsVideoPlaying(false);
            setChapterProgress(prevProg => ({
              ...prevProg,
              [currentChapter.id]: 100
            }));
            setGuideExpression("celebrate");
            return 0;
          }
          const percent = Math.round((next / currentChapter.videoFrames.length) * 100);
          setChapterProgress(prevProg => ({
            ...prevProg,
            [currentChapter.id]: Math.max(prevProg[currentChapter.id] || 0, percent)
          }));
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, currentChapterIdx]);

  // Watch active appState to detect completed checklist items for 8 sequential missions
  useEffect(() => {
    // 1. meetNova completes when showWelcome goes false and interactive tour finishes or welcome closed
    if (!showWelcome && !completedActions.meetNova) {
      triggerActionCompletion("meetNova");
    }
    // 2. createTask checks
    if (state.tasks.length > 0 && !completedActions.createTask) {
      triggerActionCompletion("createTask");
    }
    // 3. uploadPDF checks
    if (state.documents.length > 0 && !completedActions.uploadPDF) {
      triggerActionCompletion("uploadPDF");
    }
    // 4. useVoice checks
    if (isVoiceOpen && !completedActions.useVoice) {
      triggerActionCompletion("useVoice");
    }
    // 5. optimizeWeek checks
    const hasNoConflicts = state.events.length > 0 && !state.events.some(e => e.isConflict);
    const scoreHistoryOptimized = state.scoreHistory.some(sh => sh.reason.toLowerCase().includes("optimize") || sh.reason.toLowerCase().includes("conflict"));
    if (scoreHistoryOptimized && hasNoConflicts && !completedActions.optimizeWeek) {
      triggerActionCompletion("optimizeWeek");
    }
    // 6. viewReplay checks
    const replayOpen = document.body.innerHTML.includes("Cinematic Activity Replay") || activeTab === "timeline";
    if (replayOpen && !completedActions.viewReplay) {
      triggerActionCompletion("viewReplay");
    }
  }, [state, isVoiceOpen, showWelcome, activeTab]);

  // Trigger certificate unlock check
  useEffect(() => {
    const completedCount = Object.values(completedActions).filter(Boolean).length;
    // If first 6 missions are complete, automatically complete Mission 7 (Complete Academy)
    if (completedCount >= 6 && !completedActions.completeAcademy) {
      triggerActionCompletion("completeAcademy");
      setIsCertificateReady(true);
      // Run custom canvas confetti celebrating graduation!
      setTimeout(() => {
        triggerCanvasConfetti();
      }, 500);
    }
  }, [completedActions]);

  const triggerActionCompletion = (actionKey: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [actionKey]: true
    }));
    setGuideExpression("celebrate");
    
    // Add custom onboarding notification log
    setState((prev) => ({
      ...prev,
      logs: [
        {
          id: `nova-m-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          agentName: "Nova AI CoS",
          action: `Mastered Mission: ${actionKey.toUpperCase()}! Telemetry updated.`,
          timestamp: new Date().toISOString(),
          status: "completed"
        },
        ...prev.logs
      ]
    }));
  };

  // HTML Canvas Confetti Particle System
  const triggerCanvasConfetti = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#22d3ee", "#a78bfa", "#10b981", "#fbbf24", "#f43f5e"];
    const particles: any[] = [];

    for (let i = 0; i < 150; i++) {
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

    confettiParticlesRef.current = particles;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 15;

        if (p.y < canvas.height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        confettiAnimationRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    draw();
  };

  useEffect(() => {
    return () => {
      if (confettiAnimationRef.current) cancelAnimationFrame(confettiAnimationRef.current);
    };
  }, []);

  // Sandbox loading utility
  const loadSandboxProfile = (profileId: string) => {
    const profile = SANDBOX_PROFILES.find(p => p.id === profileId);
    if (!profile) return;

    const mappedTasks: Task[] = profile.tasks.map((t) => {
      let cat: "student" | "professional" | "entrepreneur" | "general" = "general";
      if (profileId === "student" || profileId === "medical") cat = "student";
      else if (profileId === "founder") cat = "entrepreneur";
      else if (profileId === "corporate" || profileId === "writer" || profileId === "jobseeker" || profileId === "designer" || profileId === "developer" || profileId === "consultant") cat = "professional";

      return {
        id: t.id,
        title: t.title,
        deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        estimatedEffort: t.effort,
        status: t.completed ? "completed" : "todo",
        priority: t.priority,
        priorityScore: t.riskScore,
        riskScore: t.riskScore,
        riskLevel: t.riskLevel,
        riskReason: "Insufficient schedule buffer detected before deadline.",
        category: cat,
        explainability: {
          why: `Task requires ${t.effort} hours within sandbox window.`,
          evidence: `Risk score evaluated at ${t.riskScore}% by Priority Engine.`,
          confidence: 92,
          alternatives: "Rearrange other sync meetings or adjust task estimates.",
          outcome: "Auto-assigned focus blocks scheduled by Recovery Agent."
        }
      };
    });

    const mappedEvents: CalendarEvent[] = profile.events.map((e) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const startIso = `${todayStr}T${e.start}:00.000Z`;
      const endIso = `${todayStr}T${e.end}:00.000Z`;

      return {
        id: e.id,
        title: e.title,
        start: startIso,
        end: endIso,
        isConflict: e.isConflict,
        type: e.isConflict ? "meeting" : "focus"
      };
    });

    setState((prev) => ({
      ...prev,
      tasks: mappedTasks,
      events: mappedEvents,
      lifeScore: profile.lifeScore,
      twin: {
        ...prev.twin,
        stress: profile.stress
      },
      logs: [
        {
          id: `sb-l-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          agentName: "Nova CoS",
          action: `Activated Sandbox Scenario: ${profile.name}. System variables override engaged.`,
          timestamp: new Date().toISOString(),
          status: "completed"
        },
        ...prev.logs
      ]
    }));

    setGuideExpression("happy");
    const introMsg = `Loaded Sandbox for ${profile.name}. Notice the Failure Risk Predictor update and overlapping calendar blocks. Run optimizer to resolve.`;
    setGuideText(introMsg);
    speakDialogue(introMsg);
    setSandboxOpen(false);
  };

  // Rahul Story Mode visual stepper
  const nextStorySlide = () => {
    const totalSlides = 6;
    if (storySlideIdx < totalSlides - 1) {
      setStorySlideIdx(prev => prev + 1);
      playStoryTickingEffect(storySlideIdx + 1);
    } else {
      setStoryOpen(false);
      setStorySlideIdx(0);
      // Celebrate
      triggerCanvasConfetti();
      setGuideExpression("celebrate");
      setGuideText("Rahul's week is rescued! Now, it's your turn to prevent failure.");
      speakDialogue("Rahul's week is rescued! Now, it's your turn to prevent failure.");
    }
  };

  const playStoryTickingEffect = (slideIdx: number) => {
    // Narrate each slide step
    let narrative = "";
    if (slideIdx === 0) {
      narrative = "Meet Rahul, CS Undergrad. Tomorrow: Compiler Project due. Friday: Next.js Mock Interview. Stress: 92%.";
    } else if (slideIdx === 1) {
      narrative = "Nova, AI Chief of Staff, takes action. Initializing emergency checks.";
    } else if (slideIdx === 2) {
      narrative = "Smart Document Copilot extracts milestones from his syllabus PDF.";
    } else if (slideIdx === 3) {
      narrative = "Recovery Agent blocks out priority study slots, shielding him from distraction.";
    } else if (slideIdx === 4) {
      narrative = "Calendar Optimizer shifts peer syncs. Failure risk drops to 12%.";
    } else if (slideIdx === 5) {
      narrative = "Mission accomplished! Stress mitigated, LifeScore boosted to 95.";
    }
    speakDialogue(narrative);

    // Sync dashboard mockup data in background to reflect story steps
    if (slideIdx === 1) {
      // Inject Rahul's starting crisis tasks
      loadSandboxProfile("student");
    } else if (slideIdx === 4) {
      // Simulate calendar deconfliction
      handleOptimizeMyWeek();
    }
  };

  // Autonomous 3-Minute Hackathon Judge Presentation Tour
  const runJudgePresentation = () => {
    setShowWelcome(false);
    setJudgeModeActive(true);
    setJudgeStepIndex(0);
    
    if (judgeTimerRef.current) clearInterval(judgeTimerRef.current);

    const judgeSteps = [
      {
        sec: 0,
        action: () => {
          setActiveTab("mission-control");
          setGuideText("Hello Judges, I am Nova, the AI Chief of Staff. Welcome to LifeSaver X. Let me demonstrate how the operating system prevents human failure.");
          speakDialogue("Hello Judges, I am Nova, the AI Chief of Staff. Welcome to LifeSaver X. Let me demonstrate how the operating system prevents human failure.");
          setGuideExpression("happy");
          loadSandboxProfile("student"); // Load Rahul student crisis state
        }
      },
      {
        sec: 15,
        action: () => {
          setActiveTab("documents");
          setGuideText("First: A CS syllabus instruction document is uploaded. Smart Document Copilot parses deadlines and inserts milestones into the active backlog.");
          speakDialogue("First: A CS syllabus instruction document is uploaded. Smart Document Copilot parses deadlines and inserts milestones into the active backlog.");
          setGuideExpression("point-left");
        }
      },
      {
        sec: 32,
        action: () => {
          setActiveTab("mission-control");
          setGuideText("Back in Mission Control, the Priority Engine flags a critical overlap. Rahul has 16 effort hours required in the next 18 hours. Failure Risk spikes to 92%!");
          speakDialogue("Back in Mission Control, the Priority Engine flags a critical overlap. Rahul has 16 effort hours required in the next 18 hours. Failure Risk spikes to 92%!");
          setGuideExpression("thinking");
        }
      },
      {
        sec: 50,
        action: () => {
          setActiveTab("recovery");
          setGuideText("Emergency active warning mode triggers! Nova prunes secondary assignments, blocks focus slots, and activates Focus Shield.");
          speakDialogue("Emergency active warning mode triggers! Nova prunes secondary assignments, blocks focus slots, and activates Focus Shield.");
          setGuideExpression("point-left");
        }
      },
      {
        sec: 68,
        action: () => {
          setActiveTab("calendar");
          setGuideText("Oh no, a calendar conflict! A peer mentorship meeting overlaps with Rahul's compiler project study block.");
          speakDialogue("Oh no, a calendar conflict! A peer mentorship meeting overlaps with Rahul's compiler project study block.");
          setGuideExpression("point-left");
        }
      },
      {
        sec: 84,
        action: async () => {
          setGuideText("De-confliction in action! The scheduling optimizer is triggered, moving non-essential events. Failure risk drops, focus block secured.");
          speakDialogue("De-confliction in action! The scheduling optimizer is triggered, moving non-essential events. Failure risk drops, focus block secured.");
          setGuideExpression("speak");
          await handleOptimizeMyWeek();
        }
      },
      {
        sec: 102,
        action: () => {
          setIsVoiceOpen(true);
          setGuideText("Voice verification: 'Warning resolved. Focus block booked for 4:00 PM. LifeScore restored.'");
          speakDialogue("Voice verification: 'Warning resolved. Focus block booked for 4:00 PM. LifeScore restored.'");
          setGuideExpression("happy");
        }
      },
      {
        sec: 118,
        action: () => {
          setIsVoiceOpen(false);
          setActiveTab("timeline");
          setGuideText("Let's review the Cinematic Timeline Replay. It highlights every AI agent coordination path completed today.");
          speakDialogue("Let's review the Cinematic Timeline Replay. It highlights every AI agent coordination path completed today.");
          setGuideExpression("point-right");
          handleStartReplay();
        }
      },
      {
        sec: 135,
        action: () => {
          // Close replay modal
          const closeBtn = document.querySelector(".glass-panel button svg");
          if (closeBtn) (closeBtn.parentElement as any).click();
          
          setGuideText("Mission completed! Rahul's stress is reduced by 40%, LifeScore boosted to 95. Nova prevented missed opportunities. Ready to explore.");
          speakDialogue("Mission completed! Rahul's stress is reduced by 40%, LifeScore boosted to 95. Nova prevented missed opportunities. Ready to explore.");
          setGuideExpression("celebrate");
          
          // Trigger confetti celebrate
          triggerCanvasConfetti();
          setJudgeModeActive(false);
          if (judgeTimerRef.current) clearInterval(judgeTimerRef.current);
        }
      }
    ];

    let secCount = 0;
    judgeTimerRef.current = setInterval(() => {
      secCount += 1;
      setJudgeStepIndex(secCount);
      
      const step = judgeSteps.find(s => s.sec === secCount);
      if (step) {
        step.action();
      }

      if (secCount >= 135) {
        if (judgeTimerRef.current) clearInterval(judgeTimerRef.current);
      }
    }, 1000);
  };

  const stopJudgePresentation = () => {
    if (judgeTimerRef.current) clearInterval(judgeTimerRef.current);
    setJudgeModeActive(false);
    setJudgeStepIndex(0);
    setGuideExpression("happy");
    setGuideText("Presentation paused. Feel free to explore LifeSaver X!");
    speakDialogue("Presentation paused.");
  };

  // Custom Explain mode explanations mapping
  const handleExplainItem = (topic: string) => {
    setExplainTarget(topic);
    let dialogueText = "";
    if (topic === "mission-control") {
      dialogueText = TRANSLATIONS[appLang].tourStep1 + " Live Tip: Keep an eye on the fail risk gauge; if it hits orange, immediately start Pomodoro or prune schedules.";
    } else if (topic === "calendar") {
      dialogueText = TRANSLATIONS[appLang].tourStep2 + " Best practice: Run optimization early in the day when the Digital Twin registers your highest mental focus indexes.";
    } else if (topic === "voice") {
      dialogueText = TRANSLATIONS[appLang].tourStep3 + " Real-world example: Issue speech prompt 'Load Student Crisis' to instantly configure demo dashboards.";
    } else if (topic === "copilots") {
      dialogueText = TRANSLATIONS[appLang].tourStep4 + " Tips: You can install new custom copilot systems like Fitness or Travel auditors directly from the copilot registry marketplace.";
    } else if (topic === "recovery") {
      dialogueText = "This is the emergency command cockpit. When you are severely overloaded, the AI acts as your shield: muting Slack chat popups, simplifying deliverables, and showing critical bottlenecks.";
    } else if (topic === "twin") {
      dialogueText = "The Digital Twin monitors biometric productivity. It learns your typing WPM, attention limits, and procrastination spikes. It tells other agents when you need rest blocks.";
    } else if (topic === "lifescore") {
      dialogueText = "LifeScore is your scheduling health metric. Higher focus session ticks and resolved conflicts keep it green (80-100%). It represents your safety buffer.";
    }
    
    setGuideText(dialogueText);
    speakDialogue(dialogueText);
  };

  // Help search query filter
  const handleHelpSearchChange = (query: string) => {
    setHelpSearch(query);
    if (!query.trim()) {
      setHelpResults([]);
      return;
    }
    const filtered = HELP_REGISTRY.filter((h) => 
      h.title.toLowerCase().includes(query.toLowerCase()) ||
      h.summary.toLowerCase().includes(query.toLowerCase()) ||
      h.features.some(f => f.toLowerCase().includes(query.toLowerCase()))
    );
    setHelpResults(filtered);
  };

  // Ask context-aware questions to AI Guide (with UI highlighting)
  const handleAskAIGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestionText.trim()) return;

    setGuideExpression("thinking");
    
    let answer = "";
    const lowerQ = aiQuestionText.toLowerCase();
    
    if (lowerQ.includes("mission") || lowerQ.includes("control")) {
      answer = "Mission Control represents the executive command center. It calculates your active task workloads, runs risk models, and coordinates underlying agents.";
      setActiveTab("mission-control");
      setTourStep(0); // Highlight it
    } else if (lowerQ.includes("score") || lowerQ.includes("life")) {
      answer = "Your LifeScore measures calendar health and task buffer margins. Completing deep-work sessions boosts it, while overlaps pull it down.";
      setActiveTab("mission-control");
      handleExplainItem("lifescore");
    } else if (lowerQ.includes("upload") || lowerQ.includes("pdf") || lowerQ.includes("syllabus")) {
      answer = "Go to the Documents tab. Drag in or select a PDF guidelines manual. The Assignment Copilot will scan it, extract key tasks, and generate flashcard study sets.";
      setActiveTab("documents");
    } else if (lowerQ.includes("interview") || lowerQ.includes("job") || lowerQ.includes("career")) {
      answer = "Navigate to the Copilots tab, click Student/Professional Copilot, and type in the job title (e.g. Next.js Developer) to map a tailored roadmap and practice mockup quizzes.";
      setActiveTab("copilots");
    } else if (lowerQ.includes("reschedule") || lowerQ.includes("optimize") || lowerQ.includes("calendar")) {
      answer = "Smart Calendar displays active overlaps. Click the 'De-conflict and Optimize Calendar' button. The optimizer shifts non-essential meetings to free study hours.";
      setActiveTab("calendar");
      setTourStep(1); // Highlight calendar
    } else {
      answer = `Based on your current view of the ${activeTab.toUpperCase()} panel, I recommend checking the continuous AI brain log entries below to check what variables are being scanned by the Orchestrator.`;
    }

    setTimeout(() => {
      setAiAnswersList((prev) => [...prev, { q: aiQuestionText, a: answer }]);
      setGuideText(answer);
      speakDialogue(answer);
      setGuideExpression("happy");
      setAiQuestionText("");
    }, 1000);
  };

  // Keyboard shortcut listener for Accessibility
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setHelpOpen(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTourStep(0);
      }
      if (e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setVideoOpen(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setSpeechMuted(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  // Compute overall onboarding percentage
  const totalChecklistItems = 7;
  const completedChecklistCount = Object.values(completedActions).filter(Boolean).length;
  const completedLessons = Object.values(chapterProgress).filter(p => p === 100).length;
  const totalLessons = TUTORIAL_CHAPTERS.length;
  const progressPercent = Math.round(
    ((completedChecklistCount + completedLessons) / (totalChecklistItems + totalLessons)) * 100
  );

  // Print/Download certificate handler
  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className={highContrast ? "high-contrast-mode" : ""}>
      {/* Global High-Contrast Confetti Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* OS FIRST BOOT BLACK SCREEN COVER */}
      {bootStep < 4 && (
        <div className="fixed inset-0 z-[999] bg-[#000000] flex flex-col items-center justify-center font-mono text-cyan-400 p-6 select-none">
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            {/* Glowing orbital lines */}
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-4 border-2 border-dashed border-cyan-400/40 rounded-full animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute inset-8 border border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
            
            {/* Pulsing center AI logo */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-950 to-purple-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-xl font-extrabold tracking-wider text-white">N</span>
            </div>
            
            {/* Particle orbits */}
            {bootStep >= 1 && (
              <div className="absolute inset-2 border-2 border-cyan-400 rounded-full animate-ping opacity-40" />
            )}
          </div>

          <div className="space-y-3 text-center max-w-md">
            <h4 className="text-sm font-extrabold tracking-[0.25em] text-white">NOVA OS CORE CHIEF OF STAFF</h4>
            <div className="h-1 w-48 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000" 
                style={{ width: `${(bootStep / 4) * 100}%` }}
              />
            </div>
            <p className="text-[10px] tracking-widest text-cyan-400/70 animate-pulse uppercase">
              {bootText}
            </p>
          </div>
        </div>
      )}

      {/* 1. FIRST LAUNCH WELCOME DIALOG */}
      <AnimatePresence>
        {showWelcome && bootStep === 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-left"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-2xl rounded-3xl border-white/10 bg-black/95 overflow-hidden shadow-2xl p-8 space-y-6 relative border-t-2 border-t-cyan-500"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-scan" />
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Large Interactive AI Guide Character */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-600/30 flex items-center justify-center border border-cyan-400/40 relative shrink-0 animate-bounce">
                  <AIGuideAvatar expression={guideExpression} isSpeaking={guideExpression === "speak"} size="lg" />
                  <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-ping" />
                </div>

                <div className="space-y-3 flex-1 text-center md:text-left">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                      NOVA CHIEF OF STAFF
                    </span>
                    
                    {/* Accessibility Language selector */}
                    <div className="flex items-center gap-1.5 text-xs text-white">
                      <Languages className="w-3.5 h-3.5 text-white/40" />
                      <select
                        value={appLang}
                        onChange={(e) => setAppLang(e.target.value as LangCode)}
                        className="bg-white/5 border border-white/10 text-white rounded px-2 py-0.5 text-xs focus:outline-none"
                      >
                        <option value="en" className="bg-slate-950">English</option>
                        <option value="hi" className="bg-slate-950">हिंदी (Hindi)</option>
                        <option value="te" className="bg-slate-950">తెలుగు (Telugu)</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="text-2xl font-extrabold text-white">
                    {TRANSLATIONS[appLang].welcome}
                  </h3>
                  <p className="text-sm opacity-80 leading-relaxed text-white">
                    {TRANSLATIONS[appLang].welcomeSub}
                  </p>
                </div>
              </div>

              {/* Action Routes */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="text-[10px] font-mono text-white/40 block uppercase tracking-widest text-center md:text-left">SELECT YOUR INITIAL LAUNCH COMMAND</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setShowWelcome(false);
                      setTourStep(0);
                    }}
                    className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-500 text-white font-bold text-xs text-center hover:shadow-cyan-500/20 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border border-cyan-400/20"
                  >
                    <Compass className="w-5 h-5 text-white" />
                    Start Interactive Tour
                  </button>

                  <button
                    onClick={runJudgePresentation}
                    className="p-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-xs text-center hover:shadow-purple-500/20 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border border-purple-400/20"
                  >
                    <Zap className="w-5 h-5 text-white animate-pulse" />
                    Experience LifeSaver X
                  </button>

                  <button
                    onClick={() => {
                      setShowWelcome(false);
                      setSandboxOpen(true);
                    }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 text-white/70" />
                    Load Practice Sandbox
                  </button>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono opacity-50 pt-2 text-white">
                  <button onClick={() => setShowWelcome(false)} className="hover:underline cursor-pointer">Skip welcome sequence</button>
                  <span>Nova OS Version 1.0 (PRO)</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CONTEXTUAL HELP EXPLANATION PROMPT */}
      <AnimatePresence>
        {showContextPrompt && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-sm text-left">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="glass-panel p-4 rounded-2xl border-white/10 bg-black/95 shadow-2xl border-l-2 border-l-cyan-400 flex gap-3.5 text-white"
            >
              {/* Mini character icon */}
              <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <AIGuideAvatar expression={guideExpression} isSpeaking={guideExpression === "speak"} size="sm" />
              </div>

              <div className="space-y-2 flex-1">
                <span className="text-[9px] font-mono text-cyan-400 font-bold block">CONTEXTUAL TELEMETRY</span>
                <p className="text-xs leading-normal">{guideText}</p>
                
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => {
                      localStorage.setItem(`skip_context_${activeTab}`, "true");
                      setShowContextPrompt(false);
                    }}
                    className="px-2.5 py-1 text-[10px] font-semibold text-white/50 hover:text-white cursor-pointer"
                  >
                    Don't ask again
                  </button>
                  <button
                    onClick={() => {
                      setShowContextPrompt(false);
                      setContextTabHistory(prev => ({ ...prev, [activeTab]: true }));
                    }}
                    className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] hover:bg-white/10 cursor-pointer"
                  >
                    No, thanks
                  </button>
                  <button
                    onClick={() => {
                      setShowContextPrompt(false);
                      setContextTabHistory(prev => ({ ...prev, [activeTab]: true }));
                      handleExplainItem(activeTab);
                    }}
                    className="px-3.5 py-1 rounded bg-cyan-500 text-black text-[10px] font-bold hover:bg-cyan-400 cursor-pointer"
                  >
                    Yes, explain
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. INTERACTIVE SPOTLIGHT TOUR OVERLAY */}
      {tourStep !== -1 && (
        <TourSpotlight step={tourStep} onClose={() => setTourStep(-1)} setTourStep={setTourStep} />
      )}

      {/* 4. SMART HELP CENTER DRAWER (Shift+H) */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end text-left"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full max-w-md bg-[#090a0f] border-l border-white/10 h-full p-6 shadow-2xl flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-white">
                    <Search className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span className="font-extrabold text-sm font-mono tracking-widest uppercase">Global Search Center</span>
                  </div>
                  <button
                    onClick={() => setHelpOpen(false)}
                    className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search bar inputs */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 opacity-40 text-white" />
                  <input
                    type="text"
                    placeholder="Type search: e.g. 'Interview', 'Voice', 'LifeScore'..."
                    value={helpSearch}
                    onChange={(e) => handleHelpSearchChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    autoFocus
                  />
                </div>

                {/* Search results lists */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {helpSearch.trim() === "" ? (
                    <div className="space-y-3 text-white">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-40 block">Suggested Lookups</span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Interview Mockup", "Assignment Upload", "Optimize Rescheduling", "Burnout insights"].map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleHelpSearchChange(s)}
                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 text-left text-xs text-white/80 transition-all font-sans cursor-pointer"
                          >
                            "{s}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {helpResults.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 text-white">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-cyan-300">{item.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/5 border border-white/5 text-white/50">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-75 leading-relaxed">{item.summary}</p>
                          
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                            {item.features.map((f, fIdx) => (
                              <span key={fIdx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {f}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                            {item.actions.map((act, actIdx) => (
                              <button
                                key={actIdx}
                                onClick={() => {
                                  setHelpOpen(false);
                                  setActiveTab(item.tabTarget);
                                  if (act.toLowerCase().includes("voice")) {
                                    setIsVoiceOpen(true);
                                  }
                                }}
                                className="px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 cursor-pointer"
                              >
                                {act}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {helpResults.length === 0 && (
                        <div className="text-center py-6 text-xs opacity-50 text-white">No documentation files found matching your search.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. ASK THE AI GUIDE CHAT MODAL */}
      <AnimatePresence>
        {aiQuestionOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 text-left"
            onClick={() => setAiQuestionOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-lg rounded-2xl border-white/10 bg-black/95 overflow-hidden p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-xs font-mono uppercase tracking-wider">Ask Nova Assistant</span>
                </div>
                <button
                  onClick={() => setAiQuestionOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Context label */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-mono text-cyan-400">
                🌐 CURRENT CONTEXT DETECTED: Page view is active on <strong>{activeTab.toUpperCase()}</strong> tab.
              </div>

              {/* Chat dialogue list */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {aiAnswersList.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="self-end bg-cyan-600 text-white p-2.5 rounded-xl text-xs max-w-[85%] ml-auto text-right">
                      {item.q}
                    </div>
                    <div className="self-start bg-white/5 border border-white/5 text-cyan-300 p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed">
                      {item.a}
                    </div>
                  </div>
                ))}
                {aiAnswersList.length === 0 && (
                  <div className="text-center py-10 text-xs opacity-50 text-white">Ask me anything: e.g. "What is LifeScore?", "How does Mission Control work?"...</div>
                )}
              </div>

              {/* Ask Question Form */}
              <form onSubmit={handleAskAIGuide} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={aiQuestionText}
                  onChange={(e) => setAiQuestionText(e.target.value)}
                  className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Send
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. LIFESAVER ACADEMY / VIDEO TUTORIAL CENTER MODAL */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-left"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-5xl rounded-3xl border-white/10 bg-black/95 overflow-hidden shadow-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Chapters selection */}
              <div className="lg:col-span-4 space-y-4 text-left flex flex-col h-[480px]">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-purple-400 font-bold block uppercase">LIFESAVER ACADEMY PLATFORM</span>
                  <h4 className="font-bold text-sm text-white">Interactive Curriculum</h4>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {TUTORIAL_CHAPTERS.map((ch, idx) => {
                    const progress = chapterProgress[ch.id] || 0;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setCurrentChapterIdx(idx);
                          setVideoPlayIdx(0);
                          setIsVideoPlaying(false);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${currentChapterIdx === idx ? "bg-white/5 border-purple-500/50" : "bg-black/25 border-white/5 hover:border-white/10"}`}
                      >
                        <div className="flex justify-between items-start mb-1 text-white">
                          <span className="font-bold text-xs truncate max-w-[200px]">{ch.title}</span>
                          <span className="text-[9px] font-mono opacity-50">{ch.duration}</span>
                        </div>
                        <p className="text-[10px] opacity-60 line-clamp-1 leading-relaxed text-gray-400">{ch.desc}</p>
                        
                        <div className="flex items-center gap-2 pt-2 text-[8px] font-mono opacity-40">
                          <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-400 h-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span>{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Animated Simulator Player screen */}
              <div className="lg:col-span-8 space-y-4 flex flex-col justify-between h-[480px]">
                <div className="flex-1 bg-[#090b10] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between p-6">
                  {isVideoPlaying && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-35 animate-scan" />
                  )}

                  <div className="flex justify-between items-center text-[10px] font-mono opacity-50 text-white">
                    <span>🎬 PLAYING CHAPTER: {TUTORIAL_CHAPTERS[currentChapterIdx].title.toUpperCase()}</span>
                    <span>1080P NOVA AI GRAPHICS</span>
                  </div>

                  {/* Dynamic simulated graphic inside video player */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300">
                        {currentChapterIdx === 0 ? "⚡" : currentChapterIdx === 1 ? "🧠" : currentChapterIdx === 2 ? "🧬" : "🎙"}
                      </div>
                      {isVideoPlaying && (
                        <div className="absolute inset-0 border-2 border-purple-400/30 rounded-full animate-ping" />
                      )}
                    </div>
                    
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 max-w-md min-h-[50px] flex items-center justify-center">
                      <p className="text-xs font-bold leading-normal text-white italic">
                        "{TUTORIAL_CHAPTERS[currentChapterIdx].videoFrames[videoPlayIdx]}"
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-purple-300 bg-purple-950/20 p-2 rounded-lg border border-purple-500/20">
                    <span>📢 AUDIO SPEECH SYNTHESIS NARRATING</span>
                    <span>Frame {videoPlayIdx + 1} / {TUTORIAL_CHAPTERS[currentChapterIdx].videoFrames.length}</span>
                  </div>
                </div>

                {/* Player controls */}
                <div className="flex justify-between items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${isVideoPlaying ? "bg-red-600" : "bg-purple-600 hover:shadow-lg"}`}
                    >
                      {isVideoPlaying ? "Pause Lesson" : "Play Lesson"}
                    </button>
                    <button
                      onClick={() => {
                        setVideoPlayIdx(0);
                        setIsVideoPlaying(false);
                      }}
                      className="px-3 py-2 text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                    >
                      Restart
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white">
                    <button
                      onClick={() => {
                        setVideoPlayIdx(prev => Math.max(0, prev - 1));
                        setIsVideoPlaying(false);
                      }}
                      disabled={videoPlayIdx === 0}
                      className="p-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const currentChapter = TUTORIAL_CHAPTERS[currentChapterIdx];
                        setVideoPlayIdx(prev => Math.min(currentChapter.videoFrames.length - 1, prev + 1));
                        setIsVideoPlaying(false);
                      }}
                      disabled={videoPlayIdx === TUTORIAL_CHAPTERS[currentChapterIdx].videoFrames.length - 1}
                      className="p-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. HACKATHON EXPERIENCE MODE AUTOPILOT BANNER */}
      {judgeModeActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#160408] border border-red-500/50 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <div className="text-left font-mono">
              <span className="text-[10px] text-red-400 font-bold block uppercase text-left">EXPERIENCE LIFESAVER X MODE ON</span>
              <span className="text-xs text-white">Elapsed: {judgeStepIndex}s / 135s • Steering dashboard timelines...</span>
            </div>
          </div>
          <button
            onClick={stopJudgePresentation}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold font-mono text-[10px] cursor-pointer"
          >
            EXIT EXPERIENCE
          </button>
        </div>
      )}

      {/* 8. AI SANDBOX SELECTION MODAL */}
      <AnimatePresence>
        {sandboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-left"
            onClick={() => setSandboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-4xl rounded-3xl border-white/10 bg-black/95 overflow-hidden shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="font-extrabold text-xs font-mono uppercase tracking-wider">AI Practice Sandbox (10 Scenarios)</span>
                </div>
                <button
                  onClick={() => setSandboxOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {SANDBOX_PROFILES.map((profile) => (
                  <div 
                    key={profile.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between h-[150px] text-white"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-extrabold text-cyan-300 block">{profile.name}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/5 border border-white/5 text-white/50">
                          {profile.role}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-75 mt-2 leading-relaxed text-gray-400">{profile.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <span className="text-[10px] font-mono text-red-400">STRESS: {profile.stress}%</span>
                      <button
                        onClick={() => loadSandboxProfile(profile.id)}
                        className="px-3 py-1.5 rounded bg-cyan-500 text-black font-extrabold text-[10px] hover:bg-cyan-400 transition-all cursor-pointer"
                      >
                        Load Scenario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. RAHUL STORY MODE MODAL */}
      <AnimatePresence>
        {storyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-left"
            onClick={() => setStoryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-xl rounded-3xl border-white/10 bg-black/95 overflow-hidden shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <Play className="w-4 h-4 text-pink-400" />
                  <span className="font-extrabold text-xs font-mono uppercase tracking-wider">Story Mode: Rescue Mission</span>
                </div>
                <button
                  onClick={() => setStoryOpen(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comic slide panel */}
              <div className="bg-[#090b10] border border-white/5 p-6 rounded-2xl min-h-[220px] flex flex-col justify-between text-white text-center">
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-4">SCENARIO STORYBOARD</span>
                
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/30 flex items-center justify-center text-xl">
                    {storySlideIdx === 0 && "🎓"}
                    {storySlideIdx === 1 && "🤖"}
                    {storySlideIdx === 2 && "📄"}
                    {storySlideIdx === 3 && "🛡️"}
                    {storySlideIdx === 4 && "⚡"}
                    {storySlideIdx === 5 && "🎉"}
                  </div>

                  <div className="max-w-md">
                    <h5 className="font-bold text-sm text-cyan-300">
                      {storySlideIdx === 0 && "Meet Rahul - Stressed CS Student"}
                      {storySlideIdx === 1 && "Nova AI Intercepts Warning"}
                      {storySlideIdx === 2 && "Syllabus deadline extracted"}
                      {storySlideIdx === 3 && "Emergency Focus Shield active"}
                      {storySlideIdx === 4 && "Calendar scheduler de-conflicts"}
                      {storySlideIdx === 5 && "Mission Accomplished!"}
                    </h5>
                    <p className="text-xs opacity-75 mt-2 leading-relaxed">
                      {storySlideIdx === 0 && "Compiler parser project due tomorrow. Next.js mock interview Friday. Attention limits dropping, stress spikes to 92%."}
                      {storySlideIdx === 1 && "Nova takes full chief of staff operations controls, shielding the workflow from secondary inputs."}
                      {storySlideIdx === 2 && "Rahul clicks syllabus instructions. Document Copilot automatically extracts deadlines, generating study flashcards."}
                      {storySlideIdx === 3 && "Recovery agent blocks focus workslots, muting social notification pings for deep work."}
                      {storySlideIdx === 4 && "Scheduling optimizer shifts advisory meetings. Failure risk drops, focus block secured."}
                      {storySlideIdx === 5 && "Rahul's stress drops, LifeScore reaches 95. He cleared both milestones!"}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-mono opacity-50 mt-4 text-gray-400">
                  Step {storySlideIdx + 1} of 6
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    // Automatically load Rahul sandbox state in dashboard
                    loadSandboxProfile("student");
                    alert("Rahul's starting crisis state has been injected to the Dashboard. Run optimizer to resolve!");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] transition-all cursor-pointer"
                >
                  Inject Rahul State to Dashboard
                </button>
                <button
                  onClick={nextStorySlide}
                  className="px-4 py-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-bold text-xs hover:shadow-cyan-500/20 cursor-pointer"
                >
                  {storySlideIdx === 5 ? "Finish & Celebrate" : "Next Step"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. LIFESAVER ACADEMY GRADUATION CERTIFICATE MODAL */}
      <AnimatePresence>
        {certificateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-left"
            onClick={() => setCertificateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-2xl rounded-3xl border-white/10 bg-black/95 overflow-hidden shadow-2xl p-8 space-y-6 relative border-t-2 border-t-amber-500 text-center text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Outer neon border container */}
              <div className="border-2 border-amber-500/40 p-8 rounded-2xl relative bg-gradient-to-tr from-black to-slate-950/40 space-y-6">
                <div className="absolute top-4 right-4 text-2xl">🏆</div>
                <span className="text-[11px] font-mono text-amber-400 tracking-[0.3em] font-bold block uppercase">LIFESAVER ACADEMY GRADUATION</span>
                
                <h3 className="text-3xl font-serif font-extrabold text-white">Certificate of AI Mastery</h3>
                
                <p className="text-xs opacity-75 max-w-md mx-auto leading-relaxed">
                  This certifies that the graduate has successfully mastered the multi-agent AI operating system and completed all Nova Chief of Staff missions.
                </p>

                <div className="py-4 space-y-2">
                  <span className="text-[10px] font-mono opacity-50 block uppercase">ENTER GRADUATE NAME</span>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-transparent border-b border-white/20 text-center font-bold text-lg text-white focus:outline-none focus:border-amber-400 py-1 max-w-xs"
                  />
                </div>

                <div className="flex justify-between items-end pt-8 max-w-md mx-auto text-left text-[10px] font-mono">
                  <div>
                    <span className="opacity-50 block uppercase">DATE GRANTED</span>
                    <span className="text-white font-bold">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="text-center font-mono italic text-xs text-amber-300">
                    <span className="w-16 h-[1px] bg-white/20 block mx-auto mb-1" />
                    Nova, Chief of Staff
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCertificateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Certificate
                </button>
                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Certificate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. NOVA OPERATIONAL WIDGET PANEL (LIVES ON THE BOTTOM OF DASHBOARD) */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 text-left space-y-6">
        
        {/* Onboarding header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase flex items-center gap-1.5">
              NOVA OS CHIEF OF STAFF
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </span>
            <h4 className="font-extrabold text-base text-white flex items-center gap-2">
              Master Academy & Simulation Scenarios
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h4>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion metrics */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center relative border border-white/5 text-white">
                <span className="font-bold text-cyan-400">{progressPercent}%</span>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(6,182,212,0.3)"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (175.9 * progressPercent) / 100}
                    className="transition-all duration-700"
                  />
                </svg>
              </div>
              <div className="text-left leading-normal text-white">
                <span className="opacity-55 block uppercase text-[8px]">ACADEMY TELEMETRY</span>
                <span className="text-white font-extrabold text-sm">{completedChecklistCount}/{totalChecklistItems} Missions</span>
              </div>
            </div>

            {/* Print certificate quick action */}
            {isCertificateReady && (
              <button
                onClick={() => setCertificateOpen(true)}
                className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 animate-pulse hover:shadow-amber-500/20 hover:shadow-lg cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Claim Certificate
              </button>
            )}

            <button
              onClick={() => setTourStep(0)}
              className="px-3.5 py-2.5 bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 hover:shadow-cyan-500/20 hover:shadow-lg cursor-pointer"
            >
              Start Spotlight Tour
            </button>
          </div>
        </div>

        {/* 8 sequential active missions checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-white/40 block uppercase tracking-widest">
              LIFESAVER ACADEMY SEQUENTIAL MISSIONS
            </span>

            <div className="space-y-2.5">
              {[
                { key: "meetNova", label: "Mission One: Meet Nova", desc: "Interact with Nova and select layout path.", icon: "🤖" },
                { key: "createTask", label: "Mission Two: Create first custom task", desc: "Go to Mission Control & submit custom goals.", icon: "➕" },
                { key: "uploadPDF", label: "Mission Three: Upload Syllabi or Guidelines", desc: "Select or upload instructions in Documents Center.", icon: "📄" },
                { key: "useVoice", label: "Mission Four: Talk with Nova core", desc: "Click the bottom purple microphone orb.", icon: "🎙" },
                { key: "optimizeWeek", label: "Mission Five: Deconflict & Optimize Calendar", desc: "Reschedule overlaps with 'Optimize My Week'.", icon: "📅" },
                { key: "viewReplay", label: "Mission Six: Play Cinematic Replay", desc: "Open Life Timeline and view cinematic optimizations.", icon: "🎬" },
                { key: "completeAcademy", label: "Mission Seven: Complete Academy", desc: "Watch all tutorial videos or complete practice tasks.", icon: "🏆" }
              ].map((item) => {
                const done = completedActions[item.key];
                return (
                  <div
                    key={item.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs leading-normal transition-all ${done ? "bg-green-950/10 border-green-500/25 opacity-70" : "bg-black/25 border-white/5 hover:border-white/10"}`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="text-base mt-0.5">{item.icon}</span>
                      <div className="text-left">
                        <span className={`font-bold block ${done ? "text-green-400 line-through" : "text-white"}`}>
                          {item.label}
                        </span>
                        <span className="opacity-60 text-[10px] block leading-snug text-gray-400">{item.desc}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <button
                          onClick={() => {
                            if (item.key === "meetNova") {
                              setGuideExpression("happy");
                              setGuideText("I am Nova, your AI Chief of Staff. Welcome to LifeSaver X!");
                              speakDialogue("I am Nova, your AI Chief of Staff.");
                              triggerActionCompletion("meetNova");
                            } else if (item.key === "createTask") {
                              setActiveTab("mission-control");
                            } else if (item.key === "uploadPDF") {
                              setActiveTab("documents");
                            } else if (item.key === "useVoice") {
                              setIsVoiceOpen(true);
                            } else if (item.key === "optimizeWeek") {
                              setActiveTab("calendar");
                            } else if (item.key === "viewReplay") {
                              setActiveTab("timeline");
                              handleStartReplay();
                            } else if (item.key === "completeAcademy") {
                              setVideoOpen(true);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-[9px] border border-white/5 cursor-pointer"
                        >
                          Launch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick reference guide info card */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-white/40 block uppercase tracking-widest">
                LAUNCH SIMULATIONS & STORY TELLING
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStoryOpen(true)}
                  className="p-4 rounded-2xl bg-gradient-to-tr from-pink-600/10 to-purple-600/10 border border-pink-500/25 hover:border-pink-500/50 text-white transition-all text-left flex flex-col justify-between h-[120px] cursor-pointer"
                >
                  <Play className="w-5 h-5 text-pink-400" />
                  <div>
                    <span className="font-extrabold text-xs block text-white">Cinematic Story Mode</span>
                    <span className="text-[10px] opacity-60 block text-gray-400">Review Rahul's cs stress story.</span>
                  </div>
                </button>

                <button
                  onClick={() => setSandboxOpen(true)}
                  className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-600/10 to-blue-600/10 border border-cyan-500/25 hover:border-cyan-500/50 text-white transition-all text-left flex flex-col justify-between h-[120px] cursor-pointer"
                >
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="font-extrabold text-xs block text-white">AI Sandbox Practice</span>
                    <span className="text-[10px] opacity-60 block text-gray-400">Load 10 custom profiles.</span>
                  </div>
                </button>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs space-y-3 leading-relaxed text-white">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Explain Icons:</strong> Click help circles beside card titles to hear Nova break down schedules, priorities, and LifeScores.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Keyboard className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Ask Nova Global:</strong> Ask Nova questions by opening the widget, she highlights the correct tab automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Accessibility options list */}
            <div className="p-3 bg-[#0d0e12]/60 rounded-xl border border-white/5 text-[10px] space-y-2 font-mono">
              <div className="flex justify-between items-center text-white">
                <span>ACCESSIBILITY SYSTEMS</span>
                <button
                  onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                  className="text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  {showKeyboardShortcuts ? "Hide Keys" : "Keyboard Shortcuts"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-2.5 py-1.5 rounded border text-[9px] font-bold transition-all cursor-pointer ${highContrast ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/5 hover:text-white"}`}
                >
                  {highContrast ? "Contrast: High" : "Contrast: Normal"}
                </button>
                <button
                  onClick={() => setSpeechMuted(!speechMuted)}
                  className={`px-2.5 py-1.5 rounded border text-[9px] font-bold transition-all cursor-pointer ${speechMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/10 text-green-400 border-green-500/20"}`}
                >
                  {speechMuted ? "Muted Subtitles" : "Voice Narrate On"}
                </button>
              </div>

              {showKeyboardShortcuts && (
                <div className="p-2.5 bg-black/40 rounded border border-white/5 text-left text-[9px] leading-normal opacity-80 text-white space-y-1">
                  <div><kbd>Shift+H</kbd>: Toggle Searchable Help Center</div>
                  <div><kbd>Shift+V</kbd>: Toggle Video Tutorial Center</div>
                  <div><kbd>Shift+T</kbd>: Start Step-by-Step Interactive Tour</div>
                  <div><kbd>Shift+M</kbd>: Mute/Unmute Guide Narrations</div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

// Avatar Face Renderer utilizing SVG
interface AIGuideAvatarProps {
  expression: "happy" | "point-left" | "point-right" | "thinking" | "celebrate" | "speak" | "welcome" | "listening" | "concerned" | "mission-complete" | "emergency" | "sleeping";
  isSpeaking: boolean;
  size?: "sm" | "lg";
}

function AIGuideAvatar({ expression, isSpeaking, size = "sm" }: AIGuideAvatarProps) {
  const isLarge = size === "lg";
  const wh = isLarge ? "w-16 h-16" : "w-8 h-8";

  // Change eyes SVG path coordinates based on dynamic state
  let eyesColor = "#22d3ee";
  let pulseClass = isSpeaking ? "animate-pulse" : "";
  
  let eyesPath = (
    <>
      <circle cx="28" cy="28" r="3.5" fill={eyesColor} className={pulseClass} />
      <circle cx="52" cy="28" r="3.5" fill={eyesColor} className={pulseClass} />
    </>
  );

  if (expression === "point-left") {
    eyesPath = (
      <>
        <ellipse cx="25" cy="28" rx="4" ry="2" fill={eyesColor} />
        <ellipse cx="49" cy="28" rx="4" ry="2" fill={eyesColor} />
      </>
    );
  } else if (expression === "point-right") {
    eyesPath = (
      <>
        <ellipse cx="31" cy="28" rx="4" ry="2" fill={eyesColor} />
        <ellipse cx="55" cy="28" rx="4" ry="2" fill={eyesColor} />
      </>
    );
  } else if (expression === "thinking") {
    eyesPath = (
      <>
        <circle cx="28" cy="28" r="4.5" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3" className="animate-spin" style={{ transformOrigin: "28px 28px" }} />
        <circle cx="52" cy="28" r="4.5" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3" className="animate-spin" style={{ transformOrigin: "52px 52px" }} />
      </>
    );
  } else if (expression === "celebrate" || expression === "mission-complete") {
    eyesColor = "#10b981";
    eyesPath = (
      <>
        <path d="M 24 30 L 28 26 L 32 30" stroke={eyesColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 48 30 L 52 26 L 56 30" stroke={eyesColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    );
  } else if (expression === "concerned") {
    eyesColor = "#f97316";
    eyesPath = (
      <>
        <path d="M 23 25 L 31 29" stroke={eyesColor} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 57 25 L 49 29" stroke={eyesColor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="30" r="3" fill={eyesColor} />
        <circle cx="52" cy="30" r="3" fill={eyesColor} />
      </>
    );
  } else if (expression === "emergency") {
    eyesColor = "#ef4444";
    eyesPath = (
      <>
        <circle cx="28" cy="28" r="4" fill={eyesColor} className="animate-ping" style={{ transformOrigin: "28px 28px" }} />
        <circle cx="52" cy="28" r="4" fill={eyesColor} className="animate-ping" style={{ transformOrigin: "52px 52px" }} />
        <circle cx="28" cy="28" r="3.5" fill={eyesColor} />
        <circle cx="52" cy="28" r="3.5" fill={eyesColor} />
      </>
    );
  } else if (expression === "sleeping") {
    eyesColor = "#8b5cf6";
    eyesPath = (
      <>
        <path d="M 24 28 Q 28 32 32 28" stroke={eyesColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 48 28 Q 52 32 56 28" stroke={eyesColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  } else if (expression === "listening") {
    eyesColor = "#22d3ee";
    eyesPath = (
      <>
        <circle cx="28" cy="28" r="4" fill="none" stroke={eyesColor} strokeWidth="1.5" className="animate-pulse" style={{ transformOrigin: "28px 28px" }} />
        <circle cx="52" cy="28" r="4" fill="none" stroke={eyesColor} strokeWidth="1.5" className="animate-pulse" style={{ transformOrigin: "52px 52px" }} />
        <circle cx="28" cy="28" r="2.5" fill={eyesColor} />
        <circle cx="52" cy="28" r="2.5" fill={eyesColor} />
      </>
    );
  }

  // Mouth rendering
  let mouthPath = <path d="M 34 44 Q 40 48 46 44" stroke={eyesColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (isSpeaking) {
    mouthPath = <ellipse cx="40" cy="45" rx="4.5" ry="3.5" fill={eyesColor} className="animate-pulse" />;
  } else if (expression === "celebrate" || expression === "mission-complete") {
    mouthPath = <path d="M 32 42 Q 40 52 48 42" stroke={eyesColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
  } else if (expression === "concerned" || expression === "emergency") {
    mouthPath = <path d="M 34 47 L 46 47" stroke={eyesColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
  } else if (expression === "sleeping") {
    mouthPath = <circle cx="40" cy="46" r="2" fill={eyesColor} opacity="0.6" />;
  }

  let strokeColor = "#22d3ee";
  if (expression === "emergency") strokeColor = "#ef4444";
  else if (expression === "concerned") strokeColor = "#f97316";
  else if (expression === "celebrate" || expression === "mission-complete") strokeColor = "#10b981";
  else if (expression === "sleeping") strokeColor = "#8b5cf6";

  return (
    <svg className={wh} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="#0d0e12" stroke={strokeColor} strokeWidth="3.5" className="animate-pulse" />
      <rect x="12" y="16" width="56" height="40" rx="8" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
      <circle cx="40" cy="4" r="3.5" fill="#f43f5e" className="animate-ping" />
      <circle cx="40" cy="4" r="3" fill="#f43f5e" />
      {eyesPath}
      {mouthPath}
    </svg>
  );
}

// Spotlight overlay coordinates calculator
interface TourSpotlightProps {
  step: number;
  onClose: () => void;
  setTourStep: (step: number) => void;
}

function TourSpotlight({ step, onClose, setTourStep }: TourSpotlightProps) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const targets = ["mission-control-tab", "calendar-tab", "voice-orb-btn", "copilots-tab"];
    const activeTargetId = targets[step];

    const locate = () => {
      const el = document.getElementById(activeTargetId);
      if (el && el.getBoundingClientRect().width > 0) {
        const rect = el.getBoundingClientRect();
        setBox({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          w: rect.width,
          h: rect.height
        });
      } else {
        // Fallback: screen center coordinates
        setBox({
          x: window.innerWidth / 2 - 100,
          y: window.innerHeight / 2 - 50,
          w: 200,
          h: 100
        });
      }
    };

    locate();
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate);
    return () => {
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate);
    };
  }, [step]);

  if (!box) return null;

  // Reposition card popup dynamically if it goes below bounds
  const popupY = box.y + box.h + 16 > window.innerHeight - 180 ? box.y - 190 : box.y + box.h + 16;
  const popupX = Math.max(16, Math.min(box.x, window.innerWidth - 320));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden">
      <div
        className="absolute transition-all duration-300 border-[3.5px] border-dashed border-cyan-400 rounded-xl"
        style={{
          left: `${box.x - 6}px`,
          top: `${box.y - 6}px`,
          width: `${box.w + 12}px`,
          height: `${box.h + 12}px`,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 16px rgba(34,211,238,0.8)"
        }}
      />
      
      <div
        className="absolute bg-[#0d0e12] border border-cyan-400/40 p-4 rounded-xl text-left pointer-events-auto max-w-xs shadow-2xl transition-all duration-300 z-50 text-white animate-float"
        style={{
          left: `${popupX}px`,
          top: `${popupY}px`
        }}
      >
        <span className="text-[9px] font-mono text-cyan-400 font-bold block mb-1">SPOTLIGHT ACTION TARGET</span>
        <h5 className="font-extrabold text-xs mb-1.5 leading-snug">
          {step === 0 && "Look at: Mission Control Dashboard Tab"}
          {step === 1 && "Click: Navigate to Calendar Tab"}
          {step === 2 && "Click: Expand floating Voice Orb Assistant"}
          {step === 3 && "Click: Open AI Copilot Registry tab"}
        </h5>
        <p className="text-[10px] opacity-70 leading-normal mb-3">
          {step === 0 && "First check the priority score calculations and failure alerts stream."}
          {step === 1 && "Wait for page render. This will display scheduling time overlaps."}
          {step === 2 && "Expand the chat dialogues and click suggested vocal guidelines."}
          {step === 3 && "Access tailored Student, Pro, or Founder workspace copilots."}
        </p>
        <div className="flex justify-between items-center text-[9px] font-mono mt-3 border-t border-white/5 pt-2">
          <button onClick={onClose} className="hover:underline hover:text-red-400 cursor-pointer">Skip Tour</button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button 
                onClick={() => setTourStep(step - 1)}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer"
              >
                Back
              </button>
            )}
            <button 
              onClick={() => {
                if (step < 3) {
                  setTourStep(step + 1);
                } else {
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold cursor-pointer animate-pulse"
            >
              {step === 3 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
