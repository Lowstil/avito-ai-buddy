export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: 'intern' | 'mentor' | 'lead' | 'hr_bp';
  track: string;
  team: string;
  mentor_id?: string;
  mentor_name?: string;
  avatar_url?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  period: string;
  period_title: string;
  category: string;
  status: 'todo' | 'in_progress' | 'completed';
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  resource_link?: string;
  notes?: string;
}

export interface ChecklistSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  progress_percentage: number;
  current_period: string;
  next_recommended_task?: ChecklistTask;
}

export interface AbsenceRequest {
  id: string;
  user_id: string;
  user_name: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface AccessItem {
  id: string;
  user_id: string;
  system_key: string;
  system_name: string;
  description: string;
  status: 'active' | 'requested' | 'not_requested';
  requested_at?: string;
  granted_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action_type?: string;
  action_payload?: any;
  suggested_chips?: string[];
  sources?: string[];
}

// Feature 1: Pre-flight Code Review
export interface CodeReviewIssue {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: 'blocker' | 'warning' | 'info';
  line_number?: number;
  snippet?: string;
  message: string;
  impact?: string;
  recommendation: string;
  suggested_diff?: string;
  full_explanation?: string;
}

export interface CodeReviewResponse {
  score: number;
  status: 'passed' | 'changes_requested' | 'blocked';
  summary: string;
  issues: CodeReviewIssue[];
  checked_rules_count: number;
  zbp_compliant: boolean;
  mentor_notes: string;
  full_refactored_code?: string;
  ai_executive_summary?: string;
}

// Feature 12: Avito Jargon Buster
export interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  definition: string;
  internal_context: string;
  example_phrase: string;
  tags: string[];
}

// Feature: Gamification & Badges
export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xp: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

export interface UserGamificationProfile {
  user_id: string;
  level: number;
  level_name: string;
  current_xp: number;
  next_level_xp: number;
  total_badges_count: number;
  unlocked_badges_count: number;
  badges: AchievementBadge[];
}

export type ThemeMode = 'dark' | 'light';
