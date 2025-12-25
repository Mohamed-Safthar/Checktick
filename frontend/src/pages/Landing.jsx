import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { CheckCircle, ArrowRight, Zap, Target, Clock } from "lucide-react";

// Simple fake user for testing
const fakeUser = {
  user_id: "user_test_123",
  name: "Test User",
  email: "test@example.com",
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Auto redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleTestLogin = () => {
    // Save fake user to localStorage
    localStorage.setItem("user", JSON.stringify(fakeUser));
    // Redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" strokeWidth={1.5} />
            <span className="font-semibold text-xl tracking-tight font-['Outfit']">
              Checktick
            </span>
          </div>

          {/* Test Login Button */}
          <Button
            onClick={handleTestLogin}
            variant="outline"
            className="btn-press"
            data-testid="test-login-btn"
          >
            Test Login (No Auth)
          </Button>
        </nav>

        {/* Hero */}
        <div className="pt-20 pb-32 lg:pt-32 lg:pb-48">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Productivity Reimagined
              </p>
              <h1 className="text-5xl md:text-7xl tracking-tighter font-light leading-[0.95] mb-6 font-['Outfit']">
                Focus on<br />
                <span className="font-semibold">what matters.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
                A minimal to-do list designed for clarity. No distractions,
                no clutter — just you and your tasks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleTestLogin}
                  size="lg"
                  className="btn-press group"
                  data-testid="get-started-btn"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Extra test button for convenience */}
                <Button
                  onClick={handleTestLogin}
                  variant="outline"
                  size="lg"
                  className="btn-press"
                >
                  Quick Test Login
                </Button>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative animate-slide-in hidden lg:block">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1590779071846-09495095d9ad?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Minimalist Workspace"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-lg p-4 shadow-sm animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-background" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Task completed</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-24 border-t border-border">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight font-light font-['Outfit']">
              Everything you need.<br />
              <span className="font-semibold">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Priority Focus",
                description: "Visual indicators help you identify what needs attention first."
              },
              {
                icon: Clock,
                title: "Pomodoro Timer",
                description: "Built-in focus mode to help you work in productive sprints."
              },
              {
                icon: Zap,
                title: "Quick Add",
                description: "Add tasks instantly with our streamlined input system."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`p-8 border border-border rounded-lg card-hover animate-slide-in stagger-${index + 1}`}
              >
                <feature.icon className="w-6 h-6 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-medium mb-2 font-['Outfit']">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="py-24 border-t border-border">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl tracking-tight font-light mb-6 font-['Outfit']">
              Ready to get <span className="font-semibold">focused?</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join thousands of people who use Checktick to stay organized and productive.
            </p>
            <Button
              onClick={handleTestLogin}
              size="lg"
              className="btn-press"
            >
              Start Testing Now
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
              <span>Checktick</span>
            </div>
            <p>Built with simplicity in mind.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;