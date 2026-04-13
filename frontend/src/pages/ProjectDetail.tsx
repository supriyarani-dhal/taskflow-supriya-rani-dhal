import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectAPI } from "../api/projects";
import { createTaskAPI, updateTaskAPI, deleteTaskAPI } from "../api/tasks";
import type { Task } from "../types";
import Navbar from "../components/Navbar";
import TaskModal from "../components/TaskModal";

const STATUS_COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "bg-gray-100" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { key: "done", label: "Done", color: "bg-green-50" },
];

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectAPI(id!).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (taskData: Partial<Task>) => createTaskAPI(id!, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
      const { created_at, ...safeData } = data;
      return updateTaskAPI(taskId, safeData);
    },
    // Optimistic update — change instantly, revert on error
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["project", id] });
      const previous = queryClient.getQueryData(["project", id]);
      queryClient.setQueryData(["project", id], (old: { tasks: Task[] }) => ({
        ...old,
        tasks: old.tasks.map((t: Task) => t.id === taskId ? { ...t, ...data } : t),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["project", id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setEditingTask(null);
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskAPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", id] }),
  });

  const tasks: Task[] = data?.tasks || [];
  const filteredTasks = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading project...</div>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-red-400">Project not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-indigo-500 hover:underline mb-1 block"
            >
              ← Back to Projects
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{data?.name}</h2>
            {data?.description && (
              <p className="text-gray-500 text-sm mt-1">{data.description}</p>
            )}
          </div>
          <button
            onClick={() => { setEditingTask(null); setShowModal(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 mb-6">
          {["", "todo", "in_progress", "done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                statusFilter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {s === "" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className={`${col.color} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {colTasks.length}
                  </span>
                </div>

                {/* Empty column state */}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No tasks here</p>
                )}

                {/* Task Cards */}
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-indigo-200 transition cursor-pointer"
                      onClick={() => { setEditingTask(task); setShowModal(true); }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(task.id); }}
                          className="text-gray-300 hover:text-red-400 transition text-base leading-none flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-400">
                            📅 {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Quick status change buttons */}
                      <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                        {STATUS_COLUMNS.filter((s) => s.key !== task.status).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => updateMutation.mutate({ taskId: task.id, data: { status: s.key } })}
                            className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                          >
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask ? { ...editingTask, created_at: new Date(editingTask.created_at), updated_at: new Date(editingTask.updated_at) } : null}
          projectId={id!}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSave={(formData) => {
            if (editingTask) {
              updateMutation.mutate({ taskId: editingTask.id, data: formData });
            } else {
              createMutation.mutate(formData);
            }
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}