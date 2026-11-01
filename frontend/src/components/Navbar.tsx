import React, { useState, useEffect } from 'react';
import { Sparkles, Sun, Moon, Search, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onOpenAssistant: (initialMode?: string) => void;
  onOpenCommandPalette: () => void;
}

const EXAM_TIMESTAMP = new Date('2027-02-06T09:30:00+05:30').getTime();

export const Navbar: React.FC<Props> = ({ onOpenAssistant, onOpenCommandPalette }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, EXAM_TIMESTAMP - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Brand & Target Exam */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white text-sm shadow-glow-primary">
            DA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">GATE Command Centre</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-light border border-primary/30">
                v3.0
              </span>
              {api.isOfflineMode() && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1"
                  title="Operating in standalone browser mode with persistent LocalStorage"
                >
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Browser Storage</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted hidden sm:block">
              GATE 2027 DA • Data Science & Artificial Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Center: Dynamic IST Countdown */}
      <div className="flex items-center gap-2 bg-surface-card px-3 py-1.5 rounded-lg border border-border shadow-inner">
        <span className="text-xs text-muted font-medium hidden md:inline">Target Exam IST:</span>
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-secondary">
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-white">
            {timeLeft.days}d
          </span>
          <span className="text-muted">:</span>
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-white">
            {timeLeft.hours.toString().padStart(2, '0')}h
          </span>
          <span className="text-muted">:</span>
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-white">
            {timeLeft.minutes.toString().padStart(2, '0')}m
          </span>
          <span className="text-muted hidden sm:inline">:</span>
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-secondary hidden sm:inline">
            {timeLeft.seconds.toString().padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* Right: Quick Check-in & Search & Assistant */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover text-muted-light text-xs border border-border transition-colors"
          title="Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick actions...</span>
          <kbd className="px-1 py-0.5 rounded bg-surface text-[10px] font-mono border border-border text-muted">
            Ctrl+K
          </kbd>
        </button>

        <button
          onClick={() => onOpenAssistant('morning_checkin')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover border border-border text-xs font-medium text-slate-200 transition-colors"
          title="Morning Check-in"
        >
          <Sun className="w-3.5 h-3.5 text-warning" />
          <span className="hidden lg:inline">Morning Check-in</span>
        </button>

        <button
          onClick={() => onOpenAssistant('evening_review')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover border border-border text-xs font-medium text-slate-200 transition-colors"
          title="Evening Review"
        >
          <Moon className="w-3.5 h-3.5 text-secondary" />
          <span className="hidden lg:inline">Evening Review</span>
        </button>

        <button
          onClick={() => onOpenAssistant('custom')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-medium shadow-glow-primary transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Assistant</span>
        </button>
      </div>
    </header>
  );
};
