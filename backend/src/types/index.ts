export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
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
  due_date?: string;
  created_at: Date;
  updated_at: Date;
}

// Extend Express Request to include the auth user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}