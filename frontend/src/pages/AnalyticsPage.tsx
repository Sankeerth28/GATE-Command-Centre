import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import type { ComprehensiveAnalytics, DashboardKPIs } from '../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [anRes, dashRes] = await Promise.all([
          api.getComprehensiveAnalytics(),
          api.getDashboardAnalytics(),
        ]);
        setAnalytics(anRes);
        setDashboardKpis(dashRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-muted animate-pulse">
        Compiling academic performance intelligence...
      </div>
    );
  }

  const kpis = dashboardKpis?.kpis;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span>Preparation Analytics & Intelligence</span>
        </h1>
        <p className="text-xs text-muted-light">
          Real records only • Subject ROI • GATE negative penalty analysis • Consistency run-rate
        </p>
      </div>

      {/* Deficit / Pace Warning if falling behind */}
      {kpis?.deficit_warning && (
        <div className="p-4 rounded-xl bg-error/15 border border-error/40 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-white block">Pace Alert — January 15 Deadline Intelligence</span>
            <p className="text-error-light leading-relaxed">{kpis.deficit_warning}</p>
          </div>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase font-mono">Weighted Coverage</span>
          <div className="text-2xl font-bold font-mono text-white">
            {kpis?.weighted_syllabus_completion_pct || 0}%
          </div>
          <span className="text-[11px] text-muted-light">
            Remaining: {kpis?.remaining_estimated_hours ?? 299}h to study
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase font-mono">Weekly Target Run-rate</span>
          <div className="text-2xl font-bold font-mono text-secondary">
            {kpis?.weekly_actual_hours || 0}h
            <span className="text-xs text-muted font-normal ml-1">/ {kpis?.weekly_target_hours || 39}h</span>
          </div>
          <span className="text-[11px] text-muted-light">
            7d average: {kpis?.seven_day_avg_daily_hours || 0}h/day
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase font-mono">Required Pace</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {kpis?.required_weekly_runrate_hours || 0}h/wk
          </div>
          <span className="text-[11px] text-muted-light">
            {kpis?.required_daily_runrate_hours || 0}h/day to finish by Jan 15
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase font-mono">Mistakes in Vault</span>
          <div className="text-2xl font-bold font-mono text-error">
            {analytics.unresolved_mistakes}
          </div>
          <span className="text-[11px] text-muted-light">
            {kpis?.pending_pyqs_count ?? 1020} pending PYQs target
          </span>
        </div>
      </div>

      {/* Study Consistency Heatmap / 14-Day Bar Chart */}
      <div className="glass-panel p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-white">
              Daily Study Hours (Last 14 Days)
            </h3>
          </div>
          <span className="text-xs text-muted font-mono">
            Target: {kpis?.target_daily_hours || 4}h / day
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.daily_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748B" fontSize={10} unit="h" />
              <Tooltip
                contentStyle={{ backgroundColor: '#12141C', borderColor: '#232736', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val} hours`, 'Study Duration']}
              />
              <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject-Wise Progress & ROI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" />
            <span>Official Subject Syllabus Progress</span>
          </h3>

          <div className="space-y-3">
            {analytics.subject_analytics.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="font-mono text-muted">
                    {s.completed_topics}/{s.total_topics} topics ({s.progress_pct}%)
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.progress_pct}%`,
                      backgroundColor: s.color || '#6366F1',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted">
                  <span>Weightage: {s.exam_weightage} marks</span>
                  <span>Actual Logged: {s.actual_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject ROI Analysis */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>Subject ROI (Study Investment vs Mock Score)</span>
          </h3>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {analytics.subject_analytics.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-surface-card border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="text-[10px] text-muted">
                    Logged: <span className="font-mono text-secondary">{s.actual_hours}h</span>
                  </div>
                </div>

                <div className="text-right">
                  {s.has_sufficient_mock_data ? (
                    <div>
                      <span className="text-[10px] text-muted block">Mock Score</span>
                      <span className="font-bold font-mono text-success">
                        {s.mock_marks_obtained} marks
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted px-2 py-1 rounded bg-surface border border-border">
                      Insufficient mock data (needs 2+ tests)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mistake Categories & Mock Score Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Categories Breakdown */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span>Mistake Vault Error Distribution</span>
          </h3>

          {analytics.total_mistakes === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              Zero mistakes recorded. Log mock tests or add question gaps to see your error distribution.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {analytics.mistake_distribution.map((m) => (
                <div key={m.category} className="flex justify-between items-center text-xs p-2 rounded bg-surface-card border border-border">
                  <span className="text-slate-300">{m.category}</span>
                  <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-surface">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Recommendations from PRD Section 19 */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Preparation Intelligence Insights</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-200">
            {dashboardKpis?.observations && dashboardKpis.observations.length > 0 ? (
              dashboardKpis.observations.map((obs, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-surface-card border border-border flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{obs}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">
                Your preparation trajectory is on target. Keep your daily focus blocks consistent.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
