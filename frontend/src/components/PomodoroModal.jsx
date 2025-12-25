import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Play, Pause, RotateCcw, X, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PomodoroModal = ({ task, onClose }) => {
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = async () => {
    if (!sessionId) {
      try {
        const response = await axios.post(
          `${API}/pomodoro/start`,
          { task_id: task?.task_id, duration },
          { withCredentials: true }
        );
        setSessionId(response.data.session_id);
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setSessionId(null);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    if (sessionId) {
      try {
        await axios.post(
          `${API}/pomodoro/${sessionId}/complete`,
          {},
          { withCredentials: true }
        );
        toast.success("Focus session completed!");
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] focus-overlay" data-testid="pomodoro-modal">
        <DialogHeader>
          <DialogTitle className="text-center font-['Outfit'] text-2xl">
            Focus Mode
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8">
          {/* Task Info */}
          {task && (
            <div className="mb-6 text-center">
              <p className="text-muted-foreground text-sm uppercase tracking-widest mb-1">
                Working on
              </p>
              <p className="font-medium text-lg">{task.title}</p>
            </div>
          )}

          {/* Timer Circle */}
          <div className="relative w-52 h-52 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="hsl(var(--foreground))"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 1s linear'
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-light font-['Outfit'] tracking-tight">
                {formatTime(timeLeft)}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                {isRunning ? 'focusing' : 'paused'}
              </p>
            </div>
          </div>

          {/* Duration Buttons */}
          {!isRunning && timeLeft === duration * 60 && (
            <div className="flex gap-2 mb-6">
              {[15, 25, 45, 60].map((mins) => (
                <Button
                  key={mins}
                  variant={duration === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setDuration(mins); setTimeLeft(mins * 60); }}
                  data-testid={`duration-${mins}`}
                >
                  {mins}m
                </Button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              data-testid="reset-btn"
              className="btn-press"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              onClick={isRunning ? handlePause : handleStart}
              data-testid={isRunning ? "pause-btn" : "start-btn"}
              className="w-20 h-20 rounded-full btn-press"
            >
              {isRunning ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              data-testid="close-pomodoro-btn"
              className="btn-press"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Complete Early */}
          {isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="mt-6"
              data-testid="complete-early-btn"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Early
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroModal;
