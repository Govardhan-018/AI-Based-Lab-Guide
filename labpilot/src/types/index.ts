export type Role = "student" | "instructor" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  experimentCount: number;
  studentCount: number;
  instructorName: string;
}

export interface Experiment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  stepsCount: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  apparatus: string[];
  safetyRules: string[];
  theory: string;
  learningObjectives: string[];
}

export interface ExperimentStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  whyItWorks: string;
  expectedObservation: string;
  safetyNotes: string[];
  verificationType: "camera" | "voice" | "manual" | "auto";
}

export interface LabSession {
  id: string;
  subjectId: string;
  experimentId: string;
  experimentTitle: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  studentCount: number;
  createdBy: string;
}

export interface StudentSession {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  labSessionId: string;
  currentStepIndex: number;
  totalSteps: number;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  understandingScore: number;
  engagementScore: number;
  safetyScore: number;
  overallScore: number;
  startedAt?: string;
  flags: string[];
}

export interface SafetyAlert {
  id: string;
  studentId: string;
  studentName: string;
  severity: "info" | "warning" | "critical" | "emergency";
  message: string;
  requiresAction: boolean;
  createdAt: string;
  resolved: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalXp: number;
  level: number;
  streakDays: number;
  experimentsCompleted: number;
  avgUnderstanding: number;
  avgSafety: number;
  avgEngagement: number;
  badges: Badge[];
  recentSessions: SessionSummary[];
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export interface SessionSummary {
  id: string;
  experimentTitle: string;
  subjectName: string;
  completedAt: string;
  overallScore: number;
  understandingScore: number;
  safetyScore: number;
  engagementScore: number;
}

export interface AnalyticsData {
  classPerformance: { month: string; understanding: number; safety: number; engagement: number }[];
  experimentCompletion: { name: string; completed: number; total: number }[];
  safetyIncidents: { month: string; critical: number; warning: number; info: number }[];
  topStudents: { name: string; xp: number; level: number }[];
}
