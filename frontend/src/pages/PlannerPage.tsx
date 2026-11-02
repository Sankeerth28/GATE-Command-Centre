import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTimer } from '../context/TimerContext';
import type { WorkItem, Subject } from '../types';
import {
  CalendarDays,
  Play,
  CheckCircle2,
  RotateCcw,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

export const PlannerPage: React.FC = () => {
  const { startTimer } = useTimer();
  const [view, setView] = useState<'daily' | 'weekly' | 'backlog'>('daily');
  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [generating, setGenerating] = useState(false);
  const [reflowing, setReflowing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSessionType, setNewTaskSessionType] = useState('Concept Learning');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState<number | undefined>();
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [reflowMessage, setReflowMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, items] = await Promise.all([
        api.getSubjects(),
        api.getWorkItems(),
      ]);
      setSubjects(subs);
      setWorkItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('gate-refresh', handleRefresh);
    return () => window.removeEventListener('gate-refresh', handleRefresh);
  }, []);

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      const res = await api.generatePlan('2026-11-02', '2027-01-15');
      setReflowMessage(res.message);
      setTimeout(() => setReflowMessage(null), 5000);
      await loadData();
    } catch (e) {
      console.error('Failed to generate plan', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleReflowBacklog = async () => {
    try {
      setReflowing(true);
      const res = await api.reflowBacklog();
      if ((res as any).deficit_warning) {
        setReflowMessage((res as any).deficit_warning);
      } else {
        setReflowMessage(res.message);
      }
      setTimeout(() => setReflowMessage(null), 7000);
      await loadData();
    } catch (e) {
      console.error('Failed to reflow backlog', e);
    } finally {
      setReflowing(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    try {
      await api.createWorkItem({
        title: newTaskTitle,
        session_type: newTaskSessionType as any,
        subject_id: newTaskSubjectId,
        scheduled_date: selectedDate,
        estimated_duration_minutes: newTaskDuration,
        priority: 'Medium',
      });
      setIsAddModalOpen(false);
      setNewTaskTitle('');
      await loadData();
    } catch (e) {
      console.error('Failed to create work item', e);
    }
  };

  const handleStartTask = (item: WorkItem) => {
    startTimer({
      workItemId: item.id,
      topicId: item.topic_id || undefined,
      subjectId: item.subject_id || undefined,
      title: item.title,
      sessionType: item.session_type,
      subjectName: item.subject_name || undefined,
      subjectColor: item.subject_color || undefined,
    });
  };

  const handleCompleteTask = async (item: WorkItem) => {
    try {
      await api.updateWorkItem(item.id, { status: 'Completed' });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeferTask = async (item: WorkItem) => {
    try {
      await api.deferWorkItem(item.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter items based on current view
  const todayStr = new Date().toISOString().split('T')[0];

  const dailyItems = workItems.filter((i) => i.scheduled_date === selectedDate);
  const backlogItems = workItems.filter(
    (i) =>
      (i.scheduled_date < todayStr || i.status === 'Deferred') &&
      i.status !== 'Completed'
  );

  // Group weekly items
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay() + idx + 1); // Monday to Sunday
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Execution Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            <span>Unified Planner & Task Engine</span>
          </h1>
          <p className="text-xs text-muted-light">
            Automated study schedule from today until 15 Jan 2027 • Unified WorkItems model
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs shadow-glow-primary transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'Scheduling...' : 'Generate / Refresh Roadmap'}</span>
          </button>

          <button
            onClick={handleReflowBacklog}
            disabled={reflowing}
            className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-border text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-warning" />
            <span>{reflowing ? 'Reflowing...' : 'Reflow Backlog'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-border text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Notification / Reflow Alert */}
      {reflowMessage && (
        <div className="p-3.5 rounded-xl bg-primary/15 border border-primary/40 text-primary-light text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{reflowMessage}</span>
        </div>
      )}

      {/* 39h Strategy & Subject Allocation Strip */}
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Weekly 39h Allocation:</span>
            <span className="text-[11px] text-muted-light">(Mon–Sat: 6h/day • Sun: 3h revision)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Phase 1: Foundation Rebuilding Active
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">Prob & Stat: <strong>6h</strong></span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">Linear Algebra: <strong>6h</strong> (Foundational)</span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">Calculus: <strong>4.5h</strong></span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">Prog & DSA: <strong>6h</strong></span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">DBMS: <strong>5h</strong></span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">ML & AI: <strong>7h</strong></span>
          <span className="px-2 py-1 rounded-md bg-surface-card border border-border text-white">Aptitude: <strong>4.5h</strong></span>
        </div>
      </div>

      {/* View Switcher & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-2 rounded-xl border border-border">
        <div className="flex items-center gap-1">
          {(['daily', 'weekly', 'backlog'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-light hover:text-white'
              }`}
            >
              {v === 'daily' ? 'Daily Timeline' : v === 'weekly' ? 'Weekly Planner' : `Backlog (${backlogItems.length})`}
            </button>
          ))}
        </div>

        {view !== 'backlog' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - (view === 'weekly' ? 7 : 1));
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 rounded bg-surface border border-border text-muted hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-white px-2">{selectedDate}</span>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + (view === 'weekly' ? 7 : 1));
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 rounded bg-surface border border-border text-muted hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 rounded bg-surface border border-border text-[11px] text-muted-light hover:text-white"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-16 text-center text-muted animate-pulse">Loading planner schedule...</div>
      ) : view === 'daily' ? (
        /* DAILY TIMELINE VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Scheduled Activities for {selectedDate}</span>
            <span>Total: {dailyItems.length} work items</span>
          </div>

          {dailyItems.length === 0 ? (
            <div className="glass-panel p-12 rounded-xl text-center space-y-3">
              <Calendar className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs text-muted">No activities scheduled for this day.</p>
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary"
              >
                Auto-Schedule Workload
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyItems.map((item) => {
                const isCompleted = item.status === 'Completed';

                return (
                  <div
                    key={item.id}
                    className={`glass-panel-interactive p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted ? 'opacity-60 bg-surface-subtle' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1"
                        style={{ backgroundColor: item.subject_color || '#6366F1' }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface border border-border text-muted-light">
                            {item.session_type}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                            {item.priority}
                          </span>
                          {item.defer_count > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                              Deferred {item.defer_count}x
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>{item.subject_name || 'General Focus'}</span>
                          <span>•</span>
                          <span>{item.estimated_duration_minutes}m est.</span>
                          {item.actual_duration_minutes > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-secondary font-mono font-medium">
                                {item.actual_duration_minutes}m studied
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
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
                            onClick={() => handleCompleteTask(item)}
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
          )}
        </div>
      ) : view === 'weekly' ? (
        /* WEEKLY PLANNER VIEW */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayStr) => {
            const dayItems = workItems.filter((i) => i.scheduled_date === dayStr);
            const isToday = dayStr === todayStr;
            const dateObj = new Date(dayStr);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div
                key={dayStr}
                className={`glass-panel p-3 rounded-xl space-y-2 flex flex-col justify-between min-h-[260px] ${
                  isToday ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                    <span className="font-bold text-xs text-white">{dayName}</span>
                    <span className="text-[10px] font-mono text-muted">{dayStr.slice(5)}</span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {dayItems.length === 0 ? (
                      <span className="text-[10px] text-muted block pt-4 text-center">
                        Rest / Free
                      </span>
                    ) : (
                      dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-surface border border-border/80 text-[11px] space-y-1"
                        >
                          <div className="font-semibold text-white truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-[9px] text-muted flex justify-between">
                            <span>{item.session_type.split(' ')[0]}</span>
                            <span>{item.estimated_duration_minutes}m</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDate(dayStr);
                    setView('daily');
                  }}
                  className="w-full py-1 rounded bg-surface-subtle hover:bg-surface-hover text-[10px] text-muted-light font-medium transition-colors"
                >
                  View Day
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* BACKLOG VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Overdue or Deferred Tasks Requiring Attention</span>
            <button
              onClick={handleReflowBacklog}
              disabled={reflowing}
              className="px-3 py-1.5 rounded-lg bg-warning hover:bg-warning-hover text-black font-semibold text-xs transition-colors"
            >
              {reflowing ? 'Reflowing...' : 'Auto-Reflow Backlog'}
            </button>
          </div>

          {backlogItems.length === 0 ? (
            <div className="glass-panel p-12 rounded-xl text-center text-xs text-muted">
              Zero backlog items! All historical tasks are reconciled.
            </div>
          ) : (
            <div className="space-y-2.5">
              {backlogItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-3.5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{item.title}</div>
                    <div className="text-[10px] text-muted">
                      Original: {item.scheduled_date} • Deferred {item.defer_count} times
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartTask(item)}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium"
                    >
                      Study Now
                    </button>
                    <button
                      onClick={() => handleCompleteTask(item)}
                      className="p-1.5 rounded-lg border border-border hover:bg-success/20 text-muted hover:text-success"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE WORK ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-sm text-white">Create Study Work Item</h3>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Title / Activity Name</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. SVD Low-Rank Approximation PYQ Drill"
                  className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-muted block mb-1">Subject</label>
                <select
                  value={newTaskSubjectId || ''}
                  onChange={(e) => setNewTaskSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Select subject (optional)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1">Session Type</label>
                <select
                  value={newTaskSessionType}
                  onChange={(e) => setNewTaskSessionType(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                >
                  <option value="Concept Learning">Concept Learning</option>
                  <option value="Mathematical Derivation">Mathematical Derivation</option>
                  <option value="Solved Examples">Solved Examples</option>
                  <option value="PYQ Practice">PYQ Practice</option>
                  <option value="Spaced Revision">Spaced Revision</option>
                  <option value="Sectional Test">Sectional Test</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Mock Analysis">Mock Analysis</option>
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1">Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-card hover:bg-surface-hover text-muted-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-glow-primary"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
