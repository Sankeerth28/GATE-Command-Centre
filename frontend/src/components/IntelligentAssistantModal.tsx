import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  CheckCircle,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string; // 'morning_checkin' | 'evening_review' | 'task_completion' | 'custom'
  taskCompletionMeta?: {
    sessionId?: string;
    workItemId?: string;
    topicId?: number;
    durationSeconds?: number;
  };
  onSuccessRefresh?: () => void;
}

export const IntelligentAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = 'morning_checkin',
  taskCompletionMeta,
  onSuccessRefresh,
}) => {
  const [mode, setMode] = useState<string>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>('');

  const loadContext = async (currentMode: string) => {
    setLoading(true);
    try {
      if (currentMode === 'morning_checkin') {
        const res = await api.getMorningCheckin();
        setData(res);
      } else if (currentMode === 'evening_review') {
        const res = await api.getEveningReview();
        setData(res);
      } else if (currentMode === 'task_completion') {
        setData({
          workItemId: taskCompletionMeta?.workItemId,
          topicId: taskCompletionMeta?.topicId,
          durationSeconds: taskCompletionMeta?.durationSeconds || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(1);
      setAnswers({});
      setSubmitted(false);
      setResultMessage('');
      loadContext(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSelectOption = (questionKey: string, value: any, nextStep?: number) => {
    const updated = { ...answers, [questionKey]: value };
    setAnswers(updated);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const submitMorningCheckin = async () => {
    setLoading(true);
    try {
      const today = data?.interaction_date || new Date().toISOString().split('T')[0];
      const res = await api.submitMorningCheckin(today, answers);
      setSubmitted(true);
      setResultMessage(res.message || 'Morning check-in saved!');
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (e: any) {
      setResultMessage(e.message || 'Error submitting morning check-in');
    } finally {
      setLoading(false);
    }
  };

  const submitEveningReview = async () => {
    setLoading(true);
    try {
      const today = data?.interaction_date || new Date().toISOString().split('T')[0];
      const res = await api.submitEveningReview(today, answers);
      setSubmitted(true);
      setResultMessage(res.message || 'Evening review saved!');
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (e: any) {
      setResultMessage(e.message || 'Error submitting evening review');
    } finally {
      setLoading(false);
    }
  };

  const submitTaskCompletion = async (confidence: string, practiced: boolean, count: number = 0) => {
    setLoading(true);
    try {
      const res = await api.submitTaskCompletion({
        work_item_id: taskCompletionMeta?.workItemId || '',
        confidence_rating: confidence,
        practiced_questions: practiced,
        questions_count: count,
        session_id: taskCompletionMeta?.sessionId,
      });
      setSubmitted(true);
      setResultMessage(res.message || 'Session completed and revision scheduled!');
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (e: any) {
      setResultMessage(e.message || 'Error recording session feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
              {mode === 'morning_checkin' ? (
                <Sun className="w-4 h-4 text-warning" />
              ) : mode === 'evening_review' ? (
                <Moon className="w-4 h-4 text-secondary" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">
                {mode === 'morning_checkin'
                  ? 'Morning Preparation Check-in'
                  : mode === 'evening_review'
                  ? 'Evening Accountability Review'
                  : mode === 'task_completion'
                  ? 'Session Completion Feedback'
                  : 'Intelligent Interaction Assistant'}
              </h3>
              <p className="text-[11px] text-muted">
                Zero typing required • Context-aware intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(mode === 'morning_checkin' || mode === 'evening_review') && (
              <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('morning_checkin');
                    setStep(1);
                    setAnswers({});
                    setSubmitted(false);
                    setResultMessage('');
                    loadContext('morning_checkin');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === 'morning_checkin'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Morning
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('evening_review');
                    setStep(1);
                    setAnswers({});
                    setSubmitted(false);
                    setResultMessage('');
                    loadContext('evening_review');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === 'evening_review'
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Evening
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted hover:text-white hover:bg-surface-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted animate-pulse">
              Retrieving preparation context...
            </div>
          ) : submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/20 border border-success/40 text-success mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-white text-base">Check-in Complete</h4>
                <p className="text-xs text-muted-light max-w-xs mx-auto">{resultMessage}</p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* MORNING CHECKIN FLOW */}
              {mode === 'morning_checkin' && (
                <div className="space-y-5">
                  {data?.already_completed ? (
                    <div className="py-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-base">Morning Check-in Already Completed</h4>
                        <p className="text-xs text-slate-300 max-w-xs mx-auto">
                          Today&apos;s schedule is active. You can update your answers or proceed to your Evening Review.
                        </p>
                      </div>

                      <div className="bg-surface-card p-3 rounded-lg border border-border text-xs space-y-1.5 text-left max-w-xs mx-auto">
                        <div className="flex justify-between text-muted">
                          <span>Today Planned Tasks:</span>
                          <span className="text-secondary font-medium">
                            {data?.today_planned_count ?? data?.today_items?.length ?? 0} activities
                          </span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Estimated Hours:</span>
                          <span className="text-white font-medium">
                            {data?.today_estimated_hours ?? 0}h
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setData((prev: any) => ({ ...prev, already_completed: false }));
                            setStep(1);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs font-medium text-slate-200 transition-all"
                        >
                          Redo / Update Check-in
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('evening_review');
                            setStep(1);
                            setAnswers({});
                            setSubmitted(false);
                            setResultMessage('');
                            loadContext('evening_review');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-white text-xs font-semibold shadow-glow-secondary transition-all"
                        >
                          Open Evening Review
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs text-muted hover:text-white transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Context summary chip */}
                      <div className="bg-surface-card p-3 rounded-lg border border-border text-xs space-y-1.5">
                        <div className="flex justify-between text-muted">
                          <span>Yesterday Planned:</span>
                          <span className="text-white font-medium">
                            {data?.yesterday_planned_count || 0} activities ({data?.yesterday_logged_hours || 0}h logged)
                          </span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Today Workload:</span>
                          <span className="text-secondary font-medium">
                            {data?.today_planned_count || 0} activities ({data?.today_estimated_hours || 0}h est.)
                          </span>
                        </div>
                        {data?.overdue_count > 0 && (
                          <div className="flex justify-between text-warning">
                            <span>Overdue Backlog:</span>
                            <span className="font-semibold">{data.overdue_count} tasks</span>
                          </div>
                        )}
                      </div>

                      {/* Step 1: Yesterday's Completion */}
                      {step === 1 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            Question 1: Did you complete yesterday&apos;s planned study work?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Completed everything', val: 'all' },
                              { label: 'Partially completed', val: 'partial' },
                              { label: 'Could not complete it', val: 'none' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q1_yesterday_completion', opt.val, 2)}
                                className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                                  answers.q1_yesterday_completion === opt.val
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-surface-card hover:bg-surface-hover border-border text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Today's Availability */}
                      {step === 2 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            Question 2: Are you available to follow today&apos;s schedule?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Full availability (4+ hours target)', val: 'full' },
                              { label: 'Limited availability (2 hours)', val: 'limited' },
                              { label: 'Not available today (Emergency/Rest)', val: 'none' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q2_today_availability', opt.val, 3)}
                                className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                                  answers.q2_today_availability === opt.val
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-surface-card hover:bg-surface-hover border-border text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Readiness / Workload Preference */}
                      {step === 3 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            Question 3: How would you like today&apos;s workload?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Normal schedule (Recommended)', val: 'normal' },
                              { label: 'Lighter schedule (Focus on core concept only)', val: 'lighter' },
                              { label: 'More challenging practice (Intense PYQs)', val: 'challenging' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q3_readiness', opt.val)}
                                className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                                  answers.q3_readiness === opt.val
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-surface-card hover:bg-surface-hover border-border text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <div className="pt-3">
                            <button
                              disabled={!answers.q3_readiness}
                              onClick={submitMorningCheckin}
                              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-2"
                            >
                              <span>Apply & Launch Today&apos;s Execution</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* EVENING REVIEW FLOW */}
              {mode === 'evening_review' && (
                <div className="space-y-4">
                  {data?.already_completed ? (
                    <div className="py-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-base">Evening Review Recorded</h4>
                        <p className="text-xs text-slate-300 max-w-xs mx-auto">
                          Great consistency! Today&apos;s accountability reflections and progress have been saved.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setData((prev: any) => ({ ...prev, already_completed: false }));
                            setStep(1);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs font-medium text-slate-200 transition-all"
                        >
                          Update Reflections
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('morning_checkin');
                            setStep(1);
                            setAnswers({});
                            setSubmitted(false);
                            setResultMessage('');
                            loadContext('morning_checkin');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all"
                        >
                          View Morning Check-in
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs text-muted hover:text-white transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-surface-card p-3 rounded-lg border border-border text-xs flex justify-between">
                        <span className="text-muted">Today Logged:</span>
                        <span className="text-secondary font-semibold">
                          {data?.today_logged_hours || 0} study hours
                        </span>
                      </div>

                      {step === 1 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            Did you complete today&apos;s scheduled work?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Completed all planned work', val: 'all' },
                              { label: 'Mostly completed', val: 'mostly' },
                              { label: 'Pending tasks remain', val: 'partial' },
                              { label: 'Could not study today', val: 'none' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q1_today_status', opt.val, 2)}
                                className="w-full text-left p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium text-slate-300"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            How would you rate today&apos;s preparation quality?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'High Focus & Deep Flow', val: 'high' },
                              { label: 'Good Progress', val: 'good' },
                              { label: 'Average / Some Distraction', val: 'average' },
                              { label: 'Low Energy', val: 'low' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q2_rating', opt.val, 3)}
                                className="w-full text-left p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium text-slate-300"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-200 block">
                            Are you comfortable with tomorrow&apos;s workload?
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Ready for tomorrow schedule', val: 'ready' },
                              { label: 'Need a lighter day', val: 'lighter' },
                              { label: 'Schedule extra practice', val: 'challenging' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => handleSelectOption('q3_comfort', opt.val)}
                                className={`w-full text-left p-3 rounded-lg border text-xs font-medium ${
                                  answers.q3_comfort === opt.val
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'border-border bg-surface-card hover:bg-surface-hover text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <button
                            disabled={!answers.q3_comfort}
                            onClick={submitEveningReview}
                            className="w-full py-2.5 mt-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs shadow-glow-primary"
                          >
                            Finalize Daily Review
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TASK COMPLETION PROMPT */}
              {mode === 'task_completion' && (
                <div className="space-y-5">
                  <div className="text-xs text-muted-light">
                    Session recorded: {Math.floor((data?.durationSeconds || 0) / 60)} minutes.
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200 block">
                      How well did you understand this topic?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Weak (Revise in 1d)', val: 'Weak', col: 'text-error' },
                        { label: 'Average (Revise in 3d)', val: 'Average', col: 'text-warning' },
                        { label: 'Good (Spaced ladder)', val: 'Good', col: 'text-secondary' },
                        { label: 'Strong (Long retention)', val: 'Strong', col: 'text-success' },
                      ].map((c) => (
                        <button
                          key={c.val}
                          onClick={() => setAnswers({ ...answers, confidence: c.val })}
                          className={`p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                            answers.confidence === c.val
                              ? 'bg-primary/20 border-primary text-white'
                              : 'bg-surface-card hover:bg-surface-hover border-border text-slate-300'
                          }`}
                        >
                          <div className={`font-semibold ${c.col}`}>{c.val}</div>
                          <div className="text-[10px] text-muted">{c.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Did you practise questions?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '10+ PYQs', val: 10, practiced: true },
                        { label: '5-10 Questions', val: 5, practiced: true },
                        { label: 'No practice', val: 0, practiced: false },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() =>
                            setAnswers({
                              ...answers,
                              practiced: p.practiced,
                              count: p.val,
                            })
                          }
                          className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                            answers.count === p.val
                              ? 'bg-primary/20 border-primary text-white'
                              : 'bg-surface-card hover:bg-surface-hover border-border text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={!answers.confidence}
                    onClick={() =>
                      submitTaskCompletion(
                        answers.confidence,
                        answers.practiced ?? false,
                        answers.count ?? 0
                      )
                    }
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs shadow-glow-primary transition-all"
                  >
                    Confirm & Update Revision Matrix
                  </button>
                </div>
              )}

              {/* CUSTOM ASSISTANT PROMPT */}
              {mode === 'custom' && (
                <div className="space-y-4">
                  <div className="text-xs text-muted-light">
                    Select a high-priority action or query for immediate assistance:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setMode('morning_checkin');
                        loadContext('morning_checkin');
                      }}
                      className="p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-left text-xs text-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-warning" />
                        <span>Run Morning Preparation Check-in</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted" />
                    </button>

                    <button
                      onClick={() => {
                        setMode('evening_review');
                        loadContext('evening_review');
                      }}
                      className="p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-left text-xs text-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-secondary" />
                        <span>Run Evening Accountability Review</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
