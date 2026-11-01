import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import type { TimerMode } from '../context/TimerContext';
import { Play, Pause, Square, Trash2, Clock } from 'lucide-react';

interface Props {
  onOpenCompletionPrompt?: (meta: { sessionId: string; workItemId?: string; topicId?: number; durationSeconds: number }) => void;
}

export const GlobalTimerBar: React.FC<Props> = ({ onOpenCompletionPrompt }) => {
  const {
    mode,
    state,
    elapsedSeconds,
    remainingSeconds,
    activeTask,
    setMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSave,
    discardTimer,
    formatTime,
  } = useTimer();

  const [saving, setSaving] = useState(false);

  const handleStopAndSave = async () => {
    try {
      setSaving(true);
      const meta = await stopAndSave();
      if (onOpenCompletionPrompt && (meta.workItemId || meta.topicId)) {
        onOpenCompletionPrompt(meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const displayTime =
    mode === 'Open Stopwatch' ? formatTime(elapsedSeconds) : formatTime(remainingSeconds);

  return (
    <div className="bg-surface-card border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm">
      {/* Left: Mode switcher & Active Task */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border">
          {(['Pomodoro', 'Deep Work', 'Open Stopwatch'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={state !== 'idle'}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-light hover:text-white disabled:opacity-50'
              }`}
            >
              {m === 'Pomodoro' ? '25m Pomo' : m === 'Deep Work' ? '50m Deep' : 'Stopwatch'}
            </button>
          ))}
        </div>

        {activeTask ? (
          <div className="flex items-center gap-2 pl-2 border-l border-border max-w-xs truncate">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeTask.subjectColor || '#6366F1' }}
            />
            <span className="font-medium text-slate-200 truncate">{activeTask.title}</span>
          </div>
        ) : (
          <span className="text-xs text-muted pl-2 border-l border-border hidden sm:inline">
            No topic linked (Open focus)
          </span>
        )}
      </div>

      {/* Center: Monospace Timer */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono text-lg font-bold tracking-wider ${
            state === 'running'
              ? 'bg-primary/10 border-primary text-primary-light animate-pulse-subtle'
              : state === 'paused'
              ? 'bg-warning/10 border-warning text-warning'
              : 'bg-surface border-border text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{displayTime}</span>
          {mode !== 'Open Stopwatch' && state !== 'idle' && (
            <span className="text-xs text-muted font-sans font-normal">
              ({formatTime(elapsedSeconds)} studied)
            </span>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {state === 'idle' && (
          <button
            onClick={() => startTimer()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-glow-primary transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus</span>
          </button>
        )}

        {state === 'running' && (
          <button
            onClick={pauseTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-warning/20 border border-warning/50 text-warning hover:bg-warning/30 font-medium text-xs transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        )}

        {state === 'paused' && (
          <button
            onClick={resumeTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </button>
        )}

        {state !== 'idle' && (
          <>
            <button
              onClick={handleStopAndSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success hover:bg-success-hover text-white font-medium text-xs shadow-sm transition-colors"
              title="Stop and save session duration to database"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{saving ? 'Saving...' : 'Stop & Save'}</span>
            </button>
            <button
              onClick={discardTimer}
              className="p-1.5 rounded-md hover:bg-error/20 text-muted hover:text-error transition-colors"
              title="Discard current session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
