// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task status
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// Task categories related to farm activities
export type TaskCategory =
  | 'planting'
  | 'watering'
  | 'fertilizing'
  | 'weeding'
  | 'harvesting'
  | 'pest-control'
  | 'maintenance'
  | 'livestock-care'
  | 'market'
  | 'general';

// Task interface
export interface Task {
  id: string;
  farmId?: string; // Optional - can be general task not tied to farm
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedDate?: Date;
  assignedTo?: string; // User ID
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  cost?: number;
  notes?: string;
  recurring?: RecurringPattern;
  createdAt: Date;
  updatedAt: Date;
}

// Recurring task pattern
export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
}

// Calendar event (for broader events, not just tasks)
export interface CalendarEvent {
  id: string;
  farmId?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  type: 'task' | 'event' | 'reminder';
  taskId?: string; // Reference to task if event is based on task
  color?: string;
  createdAt: Date;
}
