export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  project_id: string;
  assignee_id?: string;
  assigned_user_name?: string; // For convenience when displaying task with assignee info
  due_date?: string;
  created_at: Date;
  updated_at: Date;
}