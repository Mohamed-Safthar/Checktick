import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Textarea } from "../components/ui/textarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle,
  Plus,
  Search,
  Filter,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Settings,
  GripVertical,
  Calendar as CalendarIcon,
  Trash2,
  Edit,
  Play,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { format } from "date-fns";
import PomodoroModal from "../components/PomodoroModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

// Sortable Task Item
const SortableTaskItem = ({ task, onToggle, onEdit, onDelete, onStartPomodoro }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.task_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [expanded, setExpanded] = useState(false);

  const priorityStyles = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };

  const categoryLabels = {
    work: 'Work',
    personal: 'Personal',
    study: 'Study',
    health: 'Health'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-lg mb-2 ${priorityStyles[task.priority]} card-hover animate-slide-in`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            data-testid={`drag-handle-${task.task_id}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task)}
            data-testid={`task-checkbox-${task.task_id}`}
          />

          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${task.completed ? 'task-completed' : ''}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{categoryLabels[task.category] || task.category}</span>
              {task.due_date && (
                <>
                  <span>•</span>
                  <span>{format(new Date(task.due_date), 'MMM d')}</span>
                </>
              )}
              {task.subtasks?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartPomodoro(task)}
              data-testid={`pomodoro-btn-${task.task_id}`}
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              data-testid={`edit-btn-${task.task_id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.task_id)}
              data-testid={`delete-btn-${task.task_id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {(task.description || task.subtasks?.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 pl-10 space-y-3 animate-fade-in">
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            {task.subtasks?.length > 0 && (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      disabled
                      className="w-3 h-3"
                    />
                    <span className={`text-sm ${subtask.completed ? 'task-completed' : ''}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Task Edit Modal
const TaskModal = ({ task, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    due_date: null,
    subtasks: [],
    recurring: null
  });
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || 'personal',
        due_date: task.due_date ? new Date(task.due_date) : null,
        subtasks: task.subtasks || [],
        recurring: task.recurring || null
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'personal',
        due_date: null,
        subtasks: [],
        recurring: null
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSave({
      ...formData,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null
    });
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]
      });
      setNewSubtask('');
    }
  };

  const removeSubtask = (id) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter(s => s.id !== id)
    });
  };

  const toggleSubtask = (id) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(s =>
        s.id === id ? { ...s, completed: !s.completed } : s
      )
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-['Outfit']">
            {task ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              data-testid="task-title-input"
              className="text-lg font-medium"
            />
          </div>

          <div>
            <Textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              data-testid="task-description-input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger data-testid="priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="due-date-btn"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({ ...formData, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Recurring
              </label>
              <Select
                value={formData.recurring || 'none'}
                onValueChange={(value) => setFormData({ ...formData, recurring: value === 'none' ? null : value })}
              >
                <SelectTrigger data-testid="recurring-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
              Subtasks
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                data-testid="subtask-input"
              />
              <Button type="button" variant="outline" onClick={addSubtask}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtask(subtask.id)}
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'task-completed' : ''}`}>
                    {subtask.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" data-testid="save-task-btn">
              {task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Tasks Page
const Tasks = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [quickAdd, setQuickAdd] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, { withCredentials: true });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAdd.trim()) return;

    try {
      const response = await axios.post(
        `${API}/tasks`,
        { title: quickAdd.trim() },
        { withCredentials: true }
      );
      setTasks([...tasks, response.data]);
      setQuickAdd('');
      toast.success("Task added");
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        const response = await axios.put(
          `${API}/tasks/${editingTask.task_id}`,
          taskData,
          { withCredentials: true }
        );
        setTasks(tasks.map(t => t.task_id === editingTask.task_id ? response.data : t));
        toast.success("Task updated");
      } else {
        const response = await axios.post(
          `${API}/tasks`,
          taskData,
          { withCredentials: true }
        );
        setTasks([...tasks, response.data]);
        toast.success("Task created");
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error("Failed to save task");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const response = await axios.put(
        `${API}/tasks/${task.task_id}`,
        { completed: !task.completed },
        { withCredentials: true }
      );
      setTasks(tasks.map(t => t.task_id === task.task_id ? response.data : t));
      toast.success(task.completed ? "Task uncompleted" : "Task completed!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { withCredentials: true });
      setTasks(tasks.filter(t => t.task_id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(t => t.task_id === active.id);
      const newIndex = tasks.findIndex(t => t.task_id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      try {
        const taskOrders = newTasks.map((t, i) => ({ task_id: t.task_id, order: i }));
        await axios.put(`${API}/tasks/reorder`, taskOrders, { withCredentials: true });
      } catch (error) {
        console.error("Failed to save order:", error);
      }
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory !== 'all' && task.category !== filterCategory) {
      return false;
    }
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    if (filterStatus === 'completed' && !task.completed) {
      return false;
    }
    if (filterStatus === 'pending' && task.completed) {
      return false;
    }
    return true;
  });

  // If not logged in, ProtectedRoute handles redirect
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="tasks-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-lg tracking-tight font-['Outfit']">Checktick</span>
            </div>

            <div className="flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" data-testid="nav-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="sm" data-testid="nav-settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-tight font-light font-['Outfit']">
              Your <span className="font-semibold">Tasks</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter(t => !t.completed).length} pending • {tasks.filter(t => t.completed).length} completed
            </p>
          </div>
          <Button
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            data-testid="add-task-btn"
            className="btn-press"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Quick add task..."
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              data-testid="quick-add-input"
              className="flex-1"
            />
            <Button type="submit" variant="outline" data-testid="quick-add-btn">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
              className="pl-10"
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]" data-testid="filter-category">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="study">Study</SelectItem>
              <SelectItem value="health">Health</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]" data-testid="filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <img
              src="https://images.unsplash.com/photo-1580315362297-5be36f0de025?crop=entropy&cs=srgb&fm=jpg&q=85&w=300"
              alt="Empty desk"
              className="w-48 h-48 object-cover rounded-lg mb-6 opacity-50"
            />
            <h3 className="text-xl font-medium mb-2 font-['Outfit']">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">Create your first task to get started</p>
            <Button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} data-testid="empty-add-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.task_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <SortableTaskItem
                    key={task.task_id}
                    task={task}
                    onToggle={handleToggleTask}
                    onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                    onDelete={handleDeleteTask}
                    onStartPomodoro={setPomodoroTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
      />

      {/* Pomodoro Modal */}
      {pomodoroTask && (
        <PomodoroModal
          task={pomodoroTask}
          onClose={() => setPomodoroTask(null)}
        />
      )}
    </div>
  );
};

export default Tasks;