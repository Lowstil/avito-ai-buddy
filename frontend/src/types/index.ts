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
