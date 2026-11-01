import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { MockTest, MistakeLog, Subject } from '../types';
import {
  Target,
  Plus,
  CheckCircle,
  Search,
  Award,
} from 'lucide-react';

export const MocksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mocks' | 'vault'>('mocks');
  const [loading, setLoading] = useState(true);
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedMock, setSelectedMock] = useState<any | null>(null);

  // New Mock Modal State
  const [isAddMockOpen, setIsAddMockOpen] = useState(false);
  const [mockTitle, setMockTitle] = useState('');
  const [mockProvider, setMockProvider] = useState('Made Easy / ACE');
  const [mockType] = useState('Full-Length Mock');
  const [mockDate] = useState(new Date().toISOString().split('T')[0]);
  const [mockDuration] = useState(180);

  // Question Inputs
  const [questions, setQuestions] = useState<Array<{
    subject_id: number;
    question_type: string;
    user_status: string;
    question_text?: string;
    error_category?: string;
    your_answer?: string;
    correct_answer?: string;
    solution_notes?: string;
  }>>([]);

  // Mistake filter
  const [searchVault, setSearchVault] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mockList, mistakeList, subList] = await Promise.all([
        api.getMockTests(),
        api.getMistakes(),
        api.getSubjects(),
      ]);
      setMocks(mockList);
      setMistakes(mistakeList);
      setSubjects(subList);

      // Default question setup if empty
      if (questions.length === 0 && subList.length > 0) {
        setQuestions([
          { subject_id: subList[0].id, question_type: '1-mark MCQ', user_status: 'correct' },
          { subject_id: subList[0].id, question_type: '2-mark MCQ', user_status: 'incorrect', error_category: 'Conceptual Gap' },
          { subject_id: subList[1]?.id || subList[0].id, question_type: '2-mark MSQ', user_status: 'correct' },
          { subject_id: subList[2]?.id || subList[0].id, question_type: '1-mark NAT', user_status: 'correct' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddQuestionRow = () => {
    setQuestions([
      ...questions,
      {
        subject_id: subjects[0]?.id || 1,
        question_type: '2-mark MCQ',
        user_status: 'correct',
      },
    ]);
  };

  const handleRemoveQuestionRow = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionRow = (idx: number, field: string, val: any) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = val;
    setQuestions(updated);
  };

  const handleSubmitMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTitle) return;

    try {
      await api.createMockTest({
        title: mockTitle,
        provider: mockProvider,
        test_type: mockType,
        test_date: mockDate,
        time_taken_minutes: mockDuration,
        questions,
      });
      setIsAddMockOpen(false);
      setMockTitle('');
      await loadData();
    } catch (e) {
      console.error('Failed to submit mock', e);
    }
  };

  const handleToggleResolveMistake = async (id: string, current: boolean) => {
    try {
      await api.resolveMistake(id, !current);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const viewMockDetail = async (id: string) => {
    try {
      const detail = await api.getMockTestDetail(id);
      setSelectedMock(detail);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered mistakes
  const filteredMistakes = mistakes.filter((m) => {
    if (showOnlyUnresolved && m.is_resolved) return false;
    if (selectedCategory !== 'all' && m.error_category !== selectedCategory) return false;
    if (searchVault && !m.question_text.toLowerCase().includes(searchVault.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <span>Mock Examination & Mistake Vault</span>
          </h1>
          <p className="text-xs text-muted-light">
            GATE Negative Marking Accuracy (MCQ -1/3 & -2/3, MSQ/NAT 0) • 5-Category Mistake Repository
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-card p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('mocks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'mocks' ? 'bg-primary text-white shadow-sm' : 'text-muted-light hover:text-white'
              }`}
            >
              Mock Tests ({mocks.length})
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vault' ? 'bg-primary text-white shadow-sm' : 'text-muted-light hover:text-white'
              }`}
            >
              Mistake Vault ({mistakes.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddMockOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-glow-primary transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Test</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted animate-pulse">Loading mock records...</div>
      ) : activeTab === 'mocks' ? (
        /* MOCK TESTS LIST */
        <div className="space-y-4">
          {mocks.length === 0 ? (
            <div className="glass-panel p-12 rounded-xl text-center space-y-3">
              <Award className="w-8 h-8 text-muted mx-auto" />
              <h3 className="font-semibold text-sm text-white">No Mock Tests Logged Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Record your full-length or subject test results with question-level negative marking calculations.
              </p>
              <button
                onClick={() => setIsAddMockOpen(true)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary"
              >
                Log First Mock Test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mocks.map((mock) => (
                <div
                  key={mock.id}
                  onClick={() => viewMockDetail(mock.id)}
                  className="glass-panel-interactive p-5 rounded-xl space-y-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-muted">
                        {mock.provider} • {mock.test_date}
                      </span>
                      <h3 className="font-bold text-sm text-white truncate max-w-xs">{mock.title}</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-primary-light font-medium">
                      {mock.test_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-surface-subtle/50 rounded-lg border border-border/50">
                    <div>
                      <span className="text-[10px] text-muted block">Net Score</span>
                      <span className="font-mono font-bold text-base text-secondary">
                        {mock.marks_obtained}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Gross</span>
                      <span className="font-mono font-bold text-base text-success">
                        +{mock.gross_positive_marks}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Negative</span>
                      <span className="font-mono font-bold text-base text-error">
                        -{mock.negative_marks_lost}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted font-mono">
                    <span>Accuracy: {mock.accuracy_pct}%</span>
                    <span>Attempt Rate: {mock.attempt_rate_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MISTAKE VAULT VIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchVault}
                onChange={(e) => setSearchVault(e.target.value)}
                placeholder="Search mistakes by question text, concepts, formulas..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-xs text-white placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none"
              >
                <option value="all">All Error Categories</option>
                <option value="Conceptual Gap">Conceptual Gap</option>
                <option value="Formula or Theorem Forgetting">Formula or Theorem Forgetting</option>
                <option value="Calculation or Algebra Error">Calculation or Algebra Error</option>
                <option value="Question Misinterpretation">Question Misinterpretation</option>
                <option value="Time Pressure or Guessing">Time Pressure or Guessing</option>
              </select>

              <button
                onClick={() => setShowOnlyUnresolved(!showOnlyUnresolved)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  showOnlyUnresolved
                    ? 'bg-warning/20 border-warning text-warning'
                    : 'bg-surface-card border-border text-muted-light'
                }`}
              >
                {showOnlyUnresolved ? 'Active Gaps Only' : 'Show All'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMistakes.length === 0 ? (
              <div className="glass-panel p-12 rounded-xl text-center text-xs text-muted">
                No mistakes match your filter.
              </div>
            ) : (
              filteredMistakes.map((m) => (
                <div
                  key={m.id}
                  className={`glass-panel p-4 rounded-xl space-y-3 border ${
                    m.is_resolved ? 'opacity-50 border-border' : 'border-error/40 bg-error/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-white">{m.question_text}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-light">
                          {m.question_type} ({m.marks}m)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-error/20 text-error font-semibold">
                          {m.error_category}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        Subject: <span className="text-slate-300">{m.subject_name || 'DA'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleResolveMistake(m.id, m.is_resolved)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        m.is_resolved
                          ? 'bg-surface-card hover:bg-surface-hover border border-border text-muted'
                          : 'bg-success/20 hover:bg-success/30 text-success border border-success/40'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{m.is_resolved ? 'Reopen' : 'Mark Resolved'}</span>
                    </button>
                  </div>

                  {(m.solution_notes || m.correct_answer) && (
                    <div className="p-3 rounded-lg bg-surface border border-border/80 text-xs space-y-1">
                      {m.correct_answer && (
                        <div className="text-success font-medium">
                          Correct Answer / Key: {m.correct_answer}
                        </div>
                      )}
                      {m.solution_notes && (
                        <div className="text-slate-300 leading-relaxed font-mono text-[11px]">
                          {m.solution_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RECORD MOCK MODAL (WITH QUESTION-LEVEL NEGATIVE MARKING) */}
      {isAddMockOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="font-semibold text-sm text-white">
              Log GATE Mock Test with Accurate Negative Marking
            </h3>

            <form onSubmit={handleSubmitMock} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1">Test Title</label>
                  <input
                    type="text"
                    required
                    value={mockTitle}
                    onChange={(e) => setMockTitle(e.target.value)}
                    placeholder="e.g. Full Length Mock 01 (IIT Roorkee Pattern)"
                    className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Provider</label>
                  <input
                    type="text"
                    value={mockProvider}
                    onChange={(e) => setMockProvider(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-card border border-border text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Question list inputs */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Question Breakdown ({questions.length} questions)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestionRow}
                    className="text-primary-light hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question Row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-card border border-border grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3">
                        <select
                          value={q.subject_id}
                          onChange={(e) =>
                            handleUpdateQuestionRow(idx, 'subject_id', Number(e.target.value))
                          }
                          className="w-full p-1.5 rounded bg-surface border border-border text-white text-[11px]"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <select
                          value={q.question_type}
                          onChange={(e) =>
                            handleUpdateQuestionRow(idx, 'question_type', e.target.value)
                          }
                          className="w-full p-1.5 rounded bg-surface border border-border text-white text-[11px]"
                        >
                          <option value="1-mark MCQ">1-mark MCQ (-1/3)</option>
                          <option value="2-mark MCQ">2-mark MCQ (-2/3)</option>
                          <option value="1-mark MSQ">1-mark MSQ (0 neg)</option>
                          <option value="2-mark MSQ">2-mark MSQ (0 neg)</option>
                          <option value="1-mark NAT">1-mark NAT (0 neg)</option>
                          <option value="2-mark NAT">2-mark NAT (0 neg)</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <select
                          value={q.user_status}
                          onChange={(e) =>
                            handleUpdateQuestionRow(idx, 'user_status', e.target.value)
                          }
                          className="w-full p-1.5 rounded bg-surface border border-border text-white text-[11px]"
                        >
                          <option value="correct">Correct</option>
                          <option value="incorrect">Incorrect</option>
                          <option value="unattempted">Unattempted</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        {q.user_status === 'incorrect' && (
                          <select
                            value={q.error_category || 'Conceptual Gap'}
                            onChange={(e) =>
                              handleUpdateQuestionRow(idx, 'error_category', e.target.value)
                            }
                            className="w-full p-1.5 rounded bg-surface border border-border text-white text-[10px]"
                          >
                            <option value="Conceptual Gap">Concept Gap</option>
                            <option value="Formula or Theorem Forgetting">Formula</option>
                            <option value="Calculation or Algebra Error">Algebra</option>
                            <option value="Question Misinterpretation">Misread</option>
                            <option value="Time Pressure or Guessing">Guess</option>
                          </select>
                        )}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionRow(idx)}
                          className="text-muted hover:text-error text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddMockOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-card hover:bg-surface-hover text-muted-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-glow-primary"
                >
                  Score and Save Mock Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOCK TEST DETAIL MODAL */}
      {selectedMock && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedMock.mock_test.title}</h3>
                <span className="text-xs text-muted">{selectedMock.mock_test.test_date}</span>
              </div>
              <button
                onClick={() => setSelectedMock(null)}
                className="p-1 rounded text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Net Marks</span>
                <span className="font-bold font-mono text-base text-secondary">
                  {selectedMock.mock_test.marks_obtained}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Negative Penalty</span>
                <span className="font-bold font-mono text-error">
                  -{selectedMock.mock_test.negative_marks_lost}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-muted block text-[10px]">Accuracy</span>
                <span className="font-bold font-mono text-success">
                  {selectedMock.mock_test.accuracy_pct}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-200">Subject Breakdown</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedMock.subject_breakdown.map((sb: any) => (
                  <div
                    key={sb.id}
                    className="p-2.5 rounded-lg bg-surface-card border border-border text-xs flex justify-between items-center"
                  >
                    <span className="font-medium text-white">{sb.subject_name}</span>
                    <span className="font-mono text-slate-300">
                      {sb.correct} correct, {sb.incorrect} wrong • {sb.marks_obtained} marks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
