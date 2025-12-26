import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Sun,
  Moon,
  LogOut,
  ListTodo,
  Settings,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [weekView, setWeekView] = useState('this_week'); // 'this_week' or 'last_week'

  useEffect(() => {
    // Fetch data only if user is logged in
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/stats`, { withCredentials: true }),
        axios.get(`${API}/tasks`, { withCredentials: true })
      ]);

      setStats(statsRes.data);

      const today = format(new Date(), 'yyyy-MM-dd');
      const todayList = tasksRes.data.filter(t => t.due_date === today && !t.completed);
      const upcoming = tasksRes.data
        .filter(t => t.due_date && t.due_date > today && !t.completed)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5);

      setTodayTasks(todayList);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-lg tracking-tight font-['Outfit']">Checktick</span>
            </div>

            <div className="flex items-center gap-1">
              <Link to="/tasks">
                <Button variant="ghost" size="sm" data-testid="nav-tasks">
                  <ListTodo className="w-4 h-4 mr-2" />
                  Tasks
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-3xl md:text-4xl tracking-tight font-light font-['Outfit']">
            Welcome back, <span className="font-semibold">{user.name.split(' ')[0]}</span>
          </h1>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Today's Focus - Large */}
          <Card className="bento-item-large card-hover animate-slide-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-5xl font-light font-['Outfit']">
                    {stats?.today_completed || 0}
                    <span className="text-2xl text-muted-foreground">/{stats?.today_tasks || 0}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">tasks completed</p>
                </div>

                <Progress
                  value={stats?.today_tasks ? (stats.today_completed / stats.today_tasks) * 100 : 0}
                  className="h-1"
                />

                <div className="space-y-2 mt-6">
                  {todayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks for today</p>
                  ) : (
                    todayTasks.slice(0, 3).map((task, i) => (
                      <div
                        key={task.task_id}
                        className={`p-3 rounded-md border border-border priority-${task.priority} animate-slide-in stagger-${i + 1}`}
                      >
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{task.priority} priority</p>
                      </div>
                    ))
                  )}
                </div>

                <Link to="/tasks">
                  <Button variant="outline" className="w-full mt-4 btn-press" data-testid="view-all-tasks">
                    <Plus className="w-4 h-4 mr-2" />
                    {todayTasks.length > 0 ? 'View All Tasks' : 'Add Task'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card className="card-hover animate-slide-in stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Tasks</p>
                  <p className="text-3xl font-light font-['Outfit']">{stats?.total || 0}</p>
                </div>
                <ListTodo className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-in stagger-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-light font-['Outfit']">{stats?.completed || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-in stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Streak</p>
                  <p className="text-3xl font-light font-['Outfit']">{stats?.streak || 0}</p>
                </div>
                <Flame className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-in stagger-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Completion</p>
                  <p className="text-3xl font-light font-['Outfit']">{stats?.completion_rate || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Chart - Wide */}
          <Card className="bento-item-wide card-hover animate-slide-in stagger-5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Weekly Progress
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setWeekView(weekView === 'this_week' ? 'last_week' : 'this_week')}
                    disabled={weekView === 'last_week'}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium min-w-[70px] text-center">
                    {weekView === 'this_week' ? 'This Week' : 'Last Week'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setWeekView(weekView === 'last_week' ? 'this_week' : 'last_week')}
                    disabled={weekView === 'this_week'}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekView === 'this_week' ? (stats?.this_week_data || []) : (stats?.last_week_data || [])}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="hsl(var(--foreground))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming - Tall */}
          <Card className="bento-item-tall card-hover animate-slide-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                ) : (
                  upcomingTasks.map((task, i) => (
                    <div
                      key={task.task_id}
                      className={`p-3 rounded-md border border-border animate-slide-in stagger-${i + 1}`}
                    >
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), 'MMM d')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Sessions */}
          <Card className="card-hover animate-slide-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Focus Sessions</p>
                  <p className="text-3xl font-light font-['Outfit']">{stats?.pomodoro_sessions || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;