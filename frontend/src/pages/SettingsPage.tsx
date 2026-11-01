import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UserSettings } from '../types';
import {
  Settings,
  Database,
  Download,
  Upload,
  Save,
  CheckCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('gate_backend_url') || '' : ''
  );
  const [subjectAllocs, setSubjectAllocs] = useState<Record<string, number>>({
    PROB_STAT: 6.0,
    LIN_ALG: 6.0,
    CALC_OPT: 4.5,
    PROG_DSA: 6.0,
    DBMS_DWH: 5.0,
    ML_AI: 7.0,
    GEN_APT: 4.5,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
        if (data.subject_allocations_json) {
          try {
            setSubjectAllocs(JSON.parse(data.subject_allocations_json));
          } catch {}
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      if (backendUrl.trim()) {
        localStorage.setItem('gate_backend_url', backendUrl.trim());
      } else {
        localStorage.removeItem('gate_backend_url');
      }
      const totalWeekly = Object.values(subjectAllocs).reduce((a, b) => a + b, 0);
      const payload: UserSettings = {
        ...settings,
        weekly_target_hours: totalWeekly,
        subject_allocations_json: JSON.stringify(subjectAllocs),
      };
      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setMessage('Settings and weekly allocations saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const data = await api.exportFullDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gate_command_centre_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export data', e);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.importFullDatabase(json);
        setMessage('Backup successfully imported! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        alert('Invalid backup JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetProgress = async () => {
    try {
      await api.resetPreparation();
      setResetConfirmOpen(false);
      setMessage('Preparation progress reset. Official syllabus preserved.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-muted animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span>Settings & Data Management</span>
        </h1>
        <p className="text-xs text-muted-light">
          Examination target parameters, timer durations, full JSON backup/restore & local SQLite data ownership
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-success/20 border border-success/40 text-success text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Target Parameters Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Target Examination & Schedule Parameters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-muted block mb-1">Preparation Start Date</label>
              <input
                type="date"
                value={settings.prep_start_date || '2026-11-02'}
                onChange={(e) => setSettings({ ...settings, prep_start_date: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Target Syllabus Completion Date</label>
              <input
                type="date"
                value={settings.syllabus_target_date}
                onChange={(e) => setSettings({ ...settings, syllabus_target_date: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Target Examination Date & Time (IST)</label>
              <input
                type="text"
                value={settings.exam_date}
                onChange={(e) => setSettings({ ...settings, exam_date: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-muted block mb-1">Daily Focus Study Capacity (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                value={settings.daily_target_hours}
                onChange={(e) => setSettings({ ...settings, daily_target_hours: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
              <span className="text-[10px] text-muted-light block mt-0.5">Mon–Sat: 6h • Sun: 3h default</span>
            </div>

            <div>
              <label className="text-muted block mb-1">Maximum Daily Capacity Limit (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="2"
                max="18"
                value={settings.max_daily_capacity_hours}
                onChange={(e) => setSettings({ ...settings, max_daily_capacity_hours: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
              <span className="text-[10px] text-muted-light block mt-0.5">Scheduler hard ceiling</span>
            </div>

            <div>
              <label className="text-muted block mb-1">Full-Length Mock Target Count</label>
              <input
                type="number"
                min="5"
                max="30"
                value={settings.mock_target_count || 10}
                onChange={(e) => setSettings({ ...settings, mock_target_count: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-primary font-mono"
              />
              <span className="text-[10px] text-muted-light block mt-0.5">Min: 10 • Stretch: 15</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Weekly Allocation (39 Focused Hours) */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              <span>Subject-Wise Weekly Allocation (Target: 39 Hours)</span>
            </h3>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                Object.values(subjectAllocs).reduce((a, b) => a + b, 0) === 39
                  ? 'bg-success/20 text-success border-success/40'
                  : 'bg-warning/20 text-warning border-warning/40'
              }`}
            >
              Total: {Object.values(subjectAllocs).reduce((a, b) => a + b, 0)} / 39.0 Hours
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-muted block mb-1">Probability & Statistics</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.PROB_STAT || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, PROB_STAT: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Linear Algebra (Revision)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.LIN_ALG || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, LIN_ALG: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Calculus & Optimization</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.CALC_OPT || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, CALC_OPT: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Programming & DSA</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.PROG_DSA || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, PROG_DSA: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Database Management</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.DBMS_DWH || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, DBMS_DWH: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Machine Learning & AI</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.ML_AI || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, ML_AI: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">General Aptitude</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={subjectAllocs.GEN_APT || 0}
                onChange={(e) => setSubjectAllocs({ ...subjectAllocs, GEN_APT: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* 5-Phase Preparation Timeline Overview */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Preparation Phases (Nov 2, 2026 – Feb 6, 2027)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-surface-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Phase 1: Foundation Rebuilding</strong>
                <span className="text-[10px] font-mono text-primary">Nov 2 – Nov 15</span>
              </div>
              <p className="text-[11px] text-muted-light">Linear Algebra foundation sequence, Prob axioms, Limits, Python OOP.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Phase 2: Core Subject Coverage</strong>
                <span className="text-[10px] font-mono text-primary">Nov 16 – Dec 13</span>
              </div>
              <p className="text-[11px] text-muted-light">Remaining LinAlg, Prob distributions, Multivariable Calc, Trees/Graphs, SQL/ACID, ML.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Phase 3: Remaining Syllabus Completion</strong>
                <span className="text-[10px] font-mono text-primary">Dec 14 – Dec 27</span>
              </div>
              <p className="text-[11px] text-muted-light">Deep Learning, PCA, Clustering, Search Heuristics. 100% syllabus first-pass complete.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Phase 4: Consolidation & Backlog Closure</strong>
                <span className="text-[10px] font-mono text-primary">Dec 28 – Jan 15</span>
              </div>
              <p className="text-[11px] text-muted-light">Backlog closure, pending PYQs, mathematical derivations, Mistake Vault wipeout.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-card border border-border space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <strong className="text-white">Final Exam Prep: Full Mock Simulations</strong>
                <span className="text-[10px] font-mono text-secondary">Jan 16 – Feb 5</span>
              </div>
              <p className="text-[11px] text-muted-light">10 to 15 Full-Length 180-min mocks, 3h deep analysis, speed recall. Exam on Feb 6, 2027.</p>
            </div>
          </div>
        </div>

        {/* Focus Timer Preferences */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span>Persistent Study Timer Durations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-muted block mb-1">Pomodoro Focus (Minutes)</label>
              <input
                type="number"
                value={settings.pomodoro_focus_minutes}
                onChange={(e) => setSettings({ ...settings, pomodoro_focus_minutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Pomodoro Short Break (Minutes)</label>
              <input
                type="number"
                value={settings.pomodoro_short_break}
                onChange={(e) => setSettings({ ...settings, pomodoro_short_break: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
            <div>
              <label className="text-muted block mb-1">Deep Work Focus Block (Minutes)</label>
              <input
                type="number"
                value={settings.deepwork_focus_minutes}
                onChange={(e) => setSettings({ ...settings, deepwork_focus_minutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Parameters'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Data Management & Full Backup */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-success" />
            <span>Local Data Ownership & Database Management</span>
          </h3>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              api.isOfflineMode()
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-primary/20 text-primary-light border-primary/30'
            }`}
          >
            {api.isOfflineMode() ? '● Browser Local Storage (GitHub Pages)' : '● Live SQLite Backend'}
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          {api.isOfflineMode()
            ? 'Running in standalone client mode. All study logs, syllabus progress, timer sessions, and mock exams persist locally in your browser. Use the JSON backup to easily move your data between devices.'
            : 'Your preparation data is stored locally in SQLite with WAL mode. You have full user ownership of your database.'}
        </p>

        {/* Backend API Configuration (Optional) */}
        <div className="p-3 rounded-lg bg-surface-card border border-border space-y-2">
          <label className="text-xs font-semibold text-white block">
            Remote Backend API URL (Optional)
          </label>
          <p className="text-[11px] text-muted">
            Leave blank to use built-in browser storage on GitHub Pages, or connect to your self-hosted FastAPI server.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="e.g. https://my-gate-api.onrender.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-surface border border-border text-white text-xs font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={handleExportJson}
            className="p-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-2.5"
          >
            <Download className="w-4 h-4 text-primary" />
            <div className="text-left">
              <div className="font-semibold">Export JSON Backup</div>
              <div className="text-[10px] text-muted">Complete 13-table snapshot</div>
            </div>
          </button>

          <label className="p-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-2.5 cursor-pointer">
            <Upload className="w-4 h-4 text-secondary" />
            <div className="text-left">
              <div className="font-semibold">Restore JSON Backup</div>
              <div className="text-[10px] text-muted">Import validated snapshot</div>
            </div>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          {api.isOfflineMode() ? (
            <button
              onClick={handleExportJson}
              className="p-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-2.5"
            >
              <Database className="w-4 h-4 text-success" />
              <div className="text-left">
                <div className="font-semibold">Export Storage Snapshot</div>
                <div className="text-[10px] text-muted">Browser JSON format</div>
              </div>
            </button>
          ) : (
            <a
              href="/api/data/download-db"
              download
              className="p-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-2.5"
            >
              <Database className="w-4 h-4 text-success" />
              <div className="text-left">
                <div className="font-semibold">Download SQLite File</div>
                <div className="text-[10px] text-muted">gate_command_centre.db</div>
              </div>
            </a>
          )}
        </div>

        {/* Destructive Safe Reset */}
        <div className="pt-4 border-t border-border/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-error">Safe Preparation Reset</div>
            <div className="text-[11px] text-muted">
              Wipes recorded sessions, mock tests and tasks while preserving official syllabus
            </div>
          </div>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-error/20 hover:bg-error/30 text-error border border-error/40 text-xs font-semibold transition-colors"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-error">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Confirm Preparation Reset</h3>
            </div>
            <p className="text-xs text-muted-light leading-relaxed">
              Are you sure you want to reset your preparation progress? This will reset all study logs, mock results, and task completions to 0. The 7 official GATE DA subjects and 51 topics will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover text-muted-light text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                className="px-4 py-1.5 rounded-lg bg-error hover:bg-error-hover text-white text-xs font-semibold"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
