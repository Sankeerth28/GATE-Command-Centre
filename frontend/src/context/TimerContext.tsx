import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type TimerMode = 'Pomodoro' | 'Deep Work' | 'Open Stopwatch';
export type TimerState = 'idle' | 'running' | 'paused';

interface ActiveTaskInfo {
  workItemId?: string;
  topicId?: number;
  subjectId?: number;
  title: string;
  subjectName?: string;
  subjectColor?: string;
}

interface TimerContextType {
  mode: TimerMode;
  state: TimerState;
  elapsedSeconds: number;
  remainingSeconds: number; // for countdown modes
  activeTask: ActiveTaskInfo | null;
  setMode: (mode: TimerMode) => void;
  startTimer: (task?: ActiveTaskInfo) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSave: () => Promise<{ sessionId: string; workItemId?: string; topicId?: number; durationSeconds: number }>;
  discardTimer: () => void;
  formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | null>(null);

const STORAGE_KEY = 'gate_cc_timer_state_v3';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<TimerMode>('Pomodoro');
  const [state, setState] = useState<TimerState>('idle');
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [lastStartTimestamp, setLastStartTimestamp] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTaskInfo | null>(null);
  const [sessionUUID, setSessionUUID] = useState<string>('');
  const [startTimestampIso, setStartTimestampIso] = useState<string>('');

  // Target duration based on mode
  const getTargetDurationSeconds = (m: TimerMode): number => {
    switch (m) {
      case 'Pomodoro':
        return 25 * 60;
      case 'Deep Work':
        return 50 * 60;
      case 'Open Stopwatch':
      default:
        return 0;
    }
  };

  // Restore timer state from localStorage on initial mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setModeState(parsed.mode || 'Pomodoro');
        setActiveTask(parsed.activeTask || null);
        setSessionUUID(parsed.sessionUUID || '');
        setStartTimestampIso(parsed.startTimestampIso || '');

        let restoredAccumulated = parsed.accumulatedSeconds || 0;
        if (parsed.state === 'running' && parsed.lastStartTimestamp) {
          // Delta calculation across tab sleeps or browser close
          const delta = Math.floor((Date.now() - parsed.lastStartTimestamp) / 1000);
          restoredAccumulated += Math.max(0, delta);
          setAccumulatedSeconds(restoredAccumulated);
          setLastStartTimestamp(Date.now());
          setState('running');
        } else {
          setAccumulatedSeconds(restoredAccumulated);
          setLastStartTimestamp(null);
          setState(parsed.state || 'idle');
        }
      } catch (e) {
        console.error('Error loading saved timer state', e);
      }
    }
  }, []);

  // Persist timer state to localStorage whenever critical values change
  useEffect(() => {
    if (state !== 'idle') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          state,
          accumulatedSeconds,
          lastStartTimestamp,
          activeTask,
          sessionUUID,
          startTimestampIso,
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mode, state, accumulatedSeconds, lastStartTimestamp, activeTask, sessionUUID, startTimestampIso]);

  // Dynamic tick based on wall-clock timestamp delta
  const [currentElapsed, setCurrentElapsed] = useState<number>(0);

  useEffect(() => {
    const updateElapsed = () => {
      if (state === 'running' && lastStartTimestamp) {
        const delta = Math.floor((Date.now() - lastStartTimestamp) / 1000);
        setCurrentElapsed(accumulatedSeconds + delta);
      } else {
        setCurrentElapsed(accumulatedSeconds);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 500);
    return () => clearInterval(interval);
  }, [state, lastStartTimestamp, accumulatedSeconds]);

  const setMode = (newMode: TimerMode) => {
    if (state === 'idle') {
      setModeState(newMode);
    }
  };

  const startTimer = (task?: ActiveTaskInfo) => {
    const now = Date.now();
    const uuid = crypto.randomUUID();
    const iso = new Date().toISOString();

    setSessionUUID(uuid);
    setStartTimestampIso(iso);
    setAccumulatedSeconds(0);
    setLastStartTimestamp(now);
    setState('running');
    if (task) {
      setActiveTask(task);
    }
  };

  const pauseTimer = () => {
    if (state === 'running' && lastStartTimestamp) {
      const delta = Math.floor((Date.now() - lastStartTimestamp) / 1000);
      const total = accumulatedSeconds + delta;
      setAccumulatedSeconds(total);
      setLastStartTimestamp(null);
      setState('paused');
    }
  };

  const resumeTimer = () => {
    if (state === 'paused') {
      setLastStartTimestamp(Date.now());
      setState('running');
    }
  };

  const stopAndSave = async () => {
    let finalSeconds = accumulatedSeconds;
    if (state === 'running' && lastStartTimestamp) {
      finalSeconds += Math.floor((Date.now() - lastStartTimestamp) / 1000);
    }

    const payload = {
      id: sessionUUID || crypto.randomUUID(),
      work_item_id: activeTask?.workItemId || null,
      topic_id: activeTask?.topicId || null,
      subject_id: activeTask?.subjectId || null,
      session_type: 'Concept Learning',
      start_timestamp: startTimestampIso || new Date().toISOString(),
      end_timestamp: new Date().toISOString(),
      duration_seconds: finalSeconds,
      mode,
      questions_practiced: 0,
    };

    if (finalSeconds > 30) {
      await api.createStudySession(payload);
    }

    const returnMeta = {
      sessionId: payload.id,
      workItemId: activeTask?.workItemId,
      topicId: activeTask?.topicId,
      durationSeconds: finalSeconds,
    };

    // Reset timer
    setState('idle');
    setAccumulatedSeconds(0);
    setLastStartTimestamp(null);
    setActiveTask(null);
    localStorage.removeItem(STORAGE_KEY);

    return returnMeta;
  };

  const discardTimer = () => {
    setState('idle');
    setAccumulatedSeconds(0);
    setLastStartTimestamp(null);
    setActiveTask(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (totalSec: number): string => {
    const sec = Math.max(0, totalSec);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetSec = getTargetDurationSeconds(mode);
  const remainingSeconds = mode === 'Open Stopwatch' ? 0 : Math.max(0, targetSec - currentElapsed);

  return (
    <TimerContext.Provider
      value={{
        mode,
        state,
        elapsedSeconds: currentElapsed,
        remainingSeconds,
        activeTask,
        setMode,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndSave,
        discardTimer,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
