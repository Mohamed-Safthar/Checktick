import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  CheckCircle,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  ListTodo,
  Download,
  Upload,
  User,
  Lock
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [exporting, setExporting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      await axios.post(
        `${API}/auth/change-password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        },
        { withCredentials: true }
      );
      toast.success("Password updated successfully");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/tasks`, { withCredentials: true });
      const data = JSON.stringify(response.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checktick-tasks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Tasks exported successfully");
    } catch (error) {
      toast.error("Failed to export tasks");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const tasks = JSON.parse(text);

      if (!Array.isArray(tasks)) {
        toast.error("Invalid file format");
        return;
      }

      let imported = 0;
      for (const task of tasks) {
        await axios.post(
          `${API}/tasks`,
          {
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            due_date: task.due_date,
            subtasks: task.subtasks || []
          },
          { withCredentials: true }
        );
        imported++;
      }

      toast.success(`Imported ${imported} tasks`);
      // Optional: refresh tasks list if needed
    } catch (error) {
      toast.error("Failed to import tasks");
    }

    e.target.value = '';
  };

  // If not logged in, ProtectedRoute handles redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-lg tracking-tight font-['Outfit']">Checktick</span>
            </div>

            <div className="flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" data-testid="nav-dashboard">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" data-testid="nav-tasks">
                  <ListTodo className="w-4 h-4" />
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl tracking-tight font-light font-['Outfit']">
            <span className="font-semibold">Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Outfit']">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Outfit']">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                Appearance
              </CardTitle>
              <CardDescription>Customize how Checktick looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  data-testid="dark-mode-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Outfit']">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your secret password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <input
                    id="current_password"
                    type="password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={changingPassword} className="w-full">
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Outfit']">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export or import your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Tasks</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your tasks as JSON
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting}
                  data-testid="export-btn"
                  className="btn-press"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import Tasks</p>
                  <p className="text-sm text-muted-foreground">
                    Import tasks from a JSON file
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                    data-testid="import-input"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('import-file')?.click()}
                    data-testid="import-btn"
                    className="btn-press"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="animate-slide-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  data-testid="signout-btn"
                  className="btn-press"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;