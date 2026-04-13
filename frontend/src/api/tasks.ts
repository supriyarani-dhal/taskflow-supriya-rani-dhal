import client from "./client";
import type { Task } from "../types";

export const getTasksAPI = (projectId: string, filters?: { status?: string; assignee?: string }) =>
  client.get(`/projects/${projectId}/tasks`, { params: filters });

export const createTaskAPI = (projectId: string, data: Partial<Task>) =>
  client.post(`/projects/${projectId}/tasks`, data);

export const updateTaskAPI = (taskId: string, data: Partial<Task>) =>
  client.patch(`/tasks/${taskId}`, data);

export const deleteTaskAPI = (taskId: string) =>
  client.delete(`/tasks/${taskId}`);