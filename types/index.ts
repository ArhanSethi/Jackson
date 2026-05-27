export type Grade = 4 | 5 | 6 | 7 | 8;

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  parent_email: string;
  created_at: string;
  current_topic_id: string | null;
}

export interface Topic {
  id: string;
  grade: Grade;
  order: number;
  title: string;
  description: string;
  prerequisites: string[];
  commonCoreStandard: string;
}

export type ProgressStatus = 'locked' | 'unlocked' | 'in_progress' | 'mastered';

export interface Progress {
  id: string;
  student_id: string;
  topic_id: string;
  status: ProgressStatus;
  mastery_score: number;
  last_practiced_at: string | null;
  updated_at: string;
}

export type BehaviorState = 'confident' | 'hesitant' | 'idle';

export interface StrokePoint {
  x: number;
  y: number;
  t: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  startTime: number;
  endTime: number;
}

export interface StrokeMetrics {
  avgVelocity: number;
  lastPauseMs: number;
  hesitationCount: number;
  state: BehaviorState;
}

export type SessionEventType =
  | 'session_start'
  | 'session_end'
  | 'stroke'
  | 'state_change'
  | 'inactivity_warning'
  | 'inactivity_pause'
  | 'voice_message'
  | 'note';

export interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface SessionMetrics {
  duration_seconds: number;
  stroke_count: number;
  confident_seconds: number;
  hesitant_seconds: number;
  idle_seconds: number;
  engagement_score: number;
  inactivity_warnings: number;
  inactivity_pauses: number;
}

export interface Session {
  id: string;
  student_id: string;
  topic_id: string;
  started_at: string;
  ended_at: string | null;
  engagement_score: number;
  stroke_count: number;
  confident_seconds: number;
  hesitant_seconds: number;
  idle_seconds: number;
  duration_seconds: number;
  events: SessionEvent[];
  notes: string | null;
  parent_report: string | null;
}
