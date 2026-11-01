import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTimer } from '../context/TimerContext';
import type { DashboardKPIs, WorkItem } from '../types';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Flame,
  BookOpen,
  Calendar,
  ListTodo,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface Props {
  onOpenAssistant: (mode?: string) => void;
  onNavigateToSyllabus: (topicId?: number) => void;
  onNavigateToPlanner: () => void;
}

export const DashboardPage: React.FC<Props> = ({
  onOpenAssistant,
  onNavigateToSyllabus,
  onNavigateToPlanner,
}) => {
  const { startTimer } = useTimer();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [todayQueue, setTodayQueue] = useState<{
    items: WorkItem[];
    next_activity?: WorkItem | null;
    overdue_count: number;
    overdue_items: WorkItem[];
  } | null>(null);
  const [reflowing, setReflowing] = useState<boolean>(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, queueRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getTodayQueue(),
      ]);
      setData(dashRes);
      setTodayQueue(queueRes);
    } catch (e) {
      console.error('Error loading dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStartTask = (item: WorkItem) => {
    startTimer({
      workItemId: item.id,
      topicId: item.topic_id || undefined,
      subjectId: item.subject_id || undefined,
      title: item.title,
      subjectName: item.subject_name || undefined,
      subjectColor: item.subject_color || undefined,
    });
  };

  const handleCompleteTask = async () => {
    onOpenAssistant('task_completion');
  };

  const handleDeferTask = async (item: WorkItem) => {
    try {
      await api.deferWorkItem(item.id);
      loadDashboard();
    } catch (e) {
      console.error('Failed to defer task', e);
    }
  };

  const handleReflowBacklog = async () => {
    try {
      setReflowing(true);
      await api.reflowBacklog();
      await loadDashboard();
    } catch (e) {
      console.error('Failed to reflow backlog', e);
    } finally {
      setReflowing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-muted animate-pulse">
        Initializing Command Centre...
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 8.4 Unfinished Work Banner (if backlog exists) */}
      {todayQueue && todayQueue.overdue_count > 0 && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20 text-warning">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">
                You have {todayQueue.overdue_count} unfinished activities from past days
              </div>
              <p className="text-xs text-muted-light">
                Adapt your preparation schedule without overloading tomorrow or losing study history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReflowBacklog}
              disabled={reflowing}
              className="px-3.5 py-1.5 rounded-lg bg-warning hover:bg-warning-hover text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{reflowing ? 'Reflowing...' : 'Auto-Reflow'}</span>
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors"
            >
              View Backlog
            </button>
          </div>
        </div>
      )}

      {/* Hero: Target Exam Banner & Countdown Overview */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-light text-xs font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Target: 6 Feb 2027 • 09:30 AM IST</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              GATE 2027 DA Command Centre
            </h1>
            <p className="text-xs sm:text-sm text-muted-light max-w-xl">
              Intelligent academic execution system. Manage day-wise syllabus milestones, persistent focus timer, spaced repetition and GATE negative-marking mock analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAssistant('morning_checkin')}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Daily Check-in</span>
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-border text-xs font-medium text-slate-200 transition-all"
            >
              Open Planner
            </button>
          </div>
        </div>
      </div>

      {/* 8.2 Preparation KPIs (Strictly Real Records - Zero Fake Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Weighted Completion */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            Weighted Syllabus
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {kpis?.weighted_syllabus_completion_pct || 0}%
          </div>
          <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis?.weighted_syllabus_completion_pct || 0)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Completed / Mastered Topics */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            Mastered Topics
          </div>
          <div className="text-2xl font-bold font-mono text-success">
            {kpis?.mastered_topics || 0}
            <span className="text-xs text-muted font-sans font-normal ml-1">
              / {kpis?.total_topics || 51}
            </span>
          </div>
          <p className="text-[10px] text-muted-light">
            {kpis?.completed_topics || 0} completed
          </p>
        </div>

        {/* KPI 3: Revisions Required */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            Needs Revision
          </div>
          <div className="text-2xl font-bold font-mono text-warning">
            {kpis?.needs_revision_topics || 0}
          </div>
          <p className="text-[10px] text-muted-light">SRS confidence queue</p>
        </div>

        {/* KPI 4: Actual Study Hours */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            Actual Study Hours
          </div>
          <div className="text-2xl font-bold font-mono text-secondary">
            {kpis?.total_actual_study_hours || 0}h
          </div>
          <p className="text-[10px] text-muted-light">
            Target: {kpis?.target_daily_hours || 4}h/day
          </p>
        </div>

        {/* KPI 5: 7-Day Rolling Avg */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            7-Day Avg Daily
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {kpis?.seven_day_avg_daily_hours || 0}h
          </div>
          <p className="text-[10px] text-muted-light">
            Need {kpis?.required_daily_runrate_hours || 0}h run-rate
          </p>
        </div>

        {/* KPI 6: Study Streak */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
            Execution Streak
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-current" />
            <span>{kpis?.current_streak_days || 0}d</span>
          </div>
          <p className="text-[10px] text-muted-light">Daily study consistency</p>
        </div>
      </div>

      {/* Main Grid: Today's Execution Queue & Actionable Preparation Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 8.3 Today's Execution Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm text-white">
                Today&apos;s Execution Queue
              </h2>
            </div>
            <span className="text-xs text-muted font-mono">
              {todayQueue?.items?.length || 0} activities scheduled
            </span>
          </div>

          {todayQueue?.items && todayQueue.items.length > 0 ? (
            <div className="space-y-3">
              {todayQueue.items.map((item) => {
                const isNext = todayQueue.next_activity?.id === item.id;
                const isCompleted = item.status === 'Completed';

                return (
                  <div
                    key={item.id}
                    className={`glass-panel-interactive p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isNext
                        ? 'border-primary/50 shadow-glow-primary bg-primary/5'
                        : isCompleted
                        ? 'opacity-60 bg-surface-subtle'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: item.subject_color || '#6366F1' }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">
                            {item.title}
                          </span>
                          {isNext && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-white font-bold">
                              UP NEXT
                            </span>
                          )}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface border border-border text-muted-light">
                            {item.session_type}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              item.priority === 'High'
                                ? 'bg-error/20 text-error'
                                : 'bg-surface border border-border text-muted'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>{item.subject_name || 'General Study'}</span>
                          <span>•</span>
                          <span>{item.estimated_duration_minutes} mins est.</span>
                          {item.actual_duration_minutes > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-secondary font-medium font-mono">
                                {item.actual_duration_minutes}m logged
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      {!isCompleted ? (
                        <>
                          <button
                            onClick={() => handleStartTask(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Focus</span>
                          </button>
                          <button
                            onClick={() => handleCompleteTask()}
                            className="p-1.5 rounded-lg border border-border hover:bg-success/20 hover:text-success text-muted transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeferTask(item)}
                            className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-muted hover:text-white transition-colors"
                            title="Defer to tomorrow"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-success font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center text-primary mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">
                  No activities scheduled for today
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Generate your automatic day-wise study plan or add a custom focus block to kickstart preparation.
                </p>
              </div>
              <button
                onClick={onNavigateToPlanner}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all inline-flex items-center gap-2"
              >
                <span>Generate Plan in Planner</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Preparation Intelligence & Next Revisions */}
        <div className="space-y-6">
          {/* Actionable Intelligence Observations */}
          <div className="glass-panel p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h3 className="font-semibold text-sm text-white">Preparation Intelligence</h3>
            </div>
            {data?.observations && data.observations.length > 0 ? (
              <div className="space-y-2">
                {data.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-card border border-border text-xs text-slate-200 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                No alerts. Your preparation is progressing in line with targets.
              </p>
            )}
          </div>

          {/* Quick Syllabus Navigation Card */}
          <div className="glass-panel p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-white">Syllabus Overview</h3>
              </div>
              <button
                onClick={() => onNavigateToSyllabus()}
                className="text-xs text-primary-light hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted">
              Explore 7 official GATE DA subjects, 51 topics, and confidence-driven Spaced Repetition Matrix.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Prob & Statistics</span>
                <span className="font-semibold text-white">16 Marks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Machine Learning</span>
                <span className="font-semibold text-white">16 Marks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Linear Algebra</span>
                <span className="font-semibold text-white">14 Marks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Programming & DSA</span>
                <span className="font-semibold text-white">16 Marks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
