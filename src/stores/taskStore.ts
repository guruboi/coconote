import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, CalendarEvent } from '@/types/calendar.types';

interface TaskState {
  tasks: Task[];
  events: CalendarEvent[];

  // Task operations
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  // Event operations
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Getters
  getTasksByFarm: (farmId: string) => Task[];
  getTasksByDate: (date: Date) => Task[];
  getTasksByMonth: (year: number, month: number) => Task[];
  getPendingTasks: () => Task[];
  getOverdueTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      events: [],

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: 'completed' as const,
                  completedDate: new Date(),
                  updatedAt: new Date(),
                }
              : task
          ),
        })),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),

      getTasksByFarm: (farmId) => {
        return get().tasks.filter((task) => task.farmId === farmId);
      },

      getTasksByDate: (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return get().tasks.filter((task) => {
          const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
          return taskDateStr === dateStr;
        });
      },

      getTasksByMonth: (year, month) => {
        return get().tasks.filter((task) => {
          const taskDate = new Date(task.dueDate);
          return taskDate.getFullYear() === year && taskDate.getMonth() === month;
        });
      },

      getPendingTasks: () => {
        return get().tasks.filter(
          (task) => task.status === 'pending' || task.status === 'in-progress'
        );
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(
          (task) =>
            (task.status === 'pending' || task.status === 'in-progress') &&
            new Date(task.dueDate) < now
        );
      },
    }),
    {
      name: 'task-storage',
    }
  )
);
