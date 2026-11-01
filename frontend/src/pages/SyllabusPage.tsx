import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SubjectTreeItem, Topic, RevisionMatrixResponse, SubtopicItem } from '../types';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';

export const SyllabusPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'matrix'>('syllabus');
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<SubjectTreeItem[]>([]);
  const [matrix, setMatrix] = useState<RevisionMatrixResponse | null>(null);
  const [search, setSearch] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<number, boolean>>({ 1: true });
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [matrixFilter, setMatrixFilter] = useState<'due_today' | 'overdue' | 'upcoming' | 'weak_topics' | 'recently_revised'>('due_today');
  const [revisingTopicId, setRevisingTopicId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [treeRes, matrixRes] = await Promise.all([
        api.getSyllabusTree(),
        api.getRevisionMatrix(),
      ]);
      setTree(treeRes);
      setMatrix(matrixRes);
    } catch (e) {
      console.error('Failed to load syllabus', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSubject = (id: number) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openTopicDetail = async (topicId: number) => {
    try {
      const detail = await api.getTopicDetail(topicId);
      setSelectedTopic(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubtopicToggle = async (topic: Topic, subtopicId: string) => {
    let subtopics: SubtopicItem[] = [];
    try {
      subtopics = JSON.parse(topic.subtopics_json);
    } catch {
      return;
    }

    const updated = subtopics.map((st) =>
      st.id === subtopicId ? { ...st, completed: !st.completed } : st
    );

    try {
      await api.updateTopic(topic.id, { subtopics: updated });
      await loadData();
      if (selectedTopic && selectedTopic.topic.id === topic.id) {
        openTopicDetail(topic.id);
      }
    } catch (e) {
      console.error('Failed to toggle subtopic', e);
    }
  };

  const handleReviseTopic = async (topicId: number, confidence: string) => {
    try {
      await api.reviseTopic(topicId, confidence);
      setRevisingTopicId(null);
      await loadData();
      if (selectedTopic) openTopicDetail(topicId);
    } catch (e) {
      console.error('Failed to revise topic', e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Syllabus & Spaced Repetition Matrix</span>
          </h1>
          <p className="text-xs text-muted-light">
            Comprehensive GATE 2027 DA syllabus breakdown • Spaced repetition intervals
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-card p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'syllabus'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-light hover:text-white'
            }`}
          >
            Hierarchical Syllabus (7 Subjects)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-light hover:text-white'
            }`}
          >
            Spaced Repetition Matrix
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted animate-pulse">Loading syllabus...</div>
      ) : activeTab === 'syllabus' ? (
        /* HIERARCHICAL SYLLABUS VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics, concepts, theorems across all subjects..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-xs text-white placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-4">
            {tree.map((subject) => {
              const isExpanded = expandedSubjects[subject.id] ?? false;

              // Filter chapters/topics by search if any
              const filteredChapters = subject.chapters
                .map((ch) => ({
                  ...ch,
                  topics: ch.topics.filter(
                    (t) =>
                      t.title.toLowerCase().includes(search.toLowerCase()) ||
                      t.subtopics_json.toLowerCase().includes(search.toLowerCase())
                  ),
                }))
                .filter((ch) => ch.topics.length > 0);

              if (search && filteredChapters.length === 0) return null;

              return (
                <div
                  key={subject.id}
                  className="glass-panel rounded-xl overflow-hidden border border-border transition-all"
                >
                  {/* Subject Accordion Header */}
                  <div
                    onClick={() => toggleSubject(subject.id)}
                    className="p-4 bg-surface-card hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors border-b border-border/50 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-sm text-white">{subject.name}</h2>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-light">
                            {subject.exam_weightage} Marks
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          Baseline: {subject.baseline_level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Chapters and Topics */}
                  {isExpanded && (
                    <div className="p-4 space-y-5 bg-surface-subtle/30">
                      {(search ? filteredChapters : subject.chapters).map((chap) => (
                        <div key={chap.id} className="space-y-2">
                          <div className="text-xs font-semibold text-slate-300 px-1 border-l-2 border-primary pl-2">
                            {chap.title}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {chap.topics.map((topic) => {
                              let subtopics: SubtopicItem[] = [];
                              try {
                                subtopics = JSON.parse(topic.subtopics_json);
                              } catch {
                                subtopics = [];
                              }

                              return (
                                <div
                                  key={topic.id}
                                  className="p-3.5 rounded-xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <h3
                                        onClick={() => openTopicDetail(topic.id)}
                                        className="font-semibold text-xs text-white hover:text-primary-light cursor-pointer"
                                      >
                                        {topic.title}
                                      </h3>
                                      <span
                                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0 ${
                                          topic.status === 'Mastered'
                                            ? 'bg-success/20 text-success'
                                            : topic.status === 'Completed'
                                            ? 'bg-primary/20 text-primary-light'
                                            : topic.status === 'Needs Revision'
                                            ? 'bg-warning/20 text-warning'
                                            : topic.status === 'In Progress'
                                            ? 'bg-secondary/20 text-secondary'
                                            : 'bg-surface-subtle text-muted'
                                        }`}
                                      >
                                        {topic.status}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-muted font-mono">
                                      <span>Est: {topic.estimated_hours}h</span>
                                      <span>•</span>
                                      <span>Logged: {topic.actual_hours}h</span>
                                      <span>•</span>
                                      <span>PYQs: {topic.pyqs_solved}</span>
                                    </div>

                                    {/* Subtopics Checklist Preview */}
                                    <div className="space-y-1 pt-1.5">
                                      {subtopics.slice(0, 3).map((st) => (
                                        <div
                                          key={st.id}
                                          onClick={() => handleSubtopicToggle(topic, st.id)}
                                          className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-white cursor-pointer select-none"
                                        >
                                          {st.completed ? (
                                            <CheckSquare className="w-3.5 h-3.5 text-success flex-shrink-0" />
                                          ) : (
                                            <Square className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                                          )}
                                          <span
                                            className={
                                              st.completed ? 'line-through text-muted' : ''
                                            }
                                          >
                                            {st.title}
                                          </span>
                                        </div>
                                      ))}
                                      {subtopics.length > 3 && (
                                        <button
                                          onClick={() => openTopicDetail(topic.id)}
                                          className="text-[10px] text-primary-light hover:underline pt-0.5 block"
                                        >
                                          +{subtopics.length - 3} more subtopics...
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom actions */}
                                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                      {topic.confidence && (
                                        <span className="text-[10px] text-muted font-medium">
                                          SRS: <span className="text-secondary font-semibold">{topic.confidence}</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => openTopicDetail(topic.id)}
                                        className="px-2 py-1 rounded bg-surface-card hover:bg-surface-hover text-slate-200 text-[10px]"
                                      >
                                        Details
                                      </button>
                                      <button
                                        onClick={() => setRevisingTopicId(topic.id)}
                                        className="px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary-light text-[10px] font-medium"
                                      >
                                        Log Revision
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SPACED REPETITION MATRIX VIEW */
        <div className="space-y-5">
          {/* Matrix Sub-tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'due_today', label: 'Due Today', count: matrix?.due_today.length || 0, color: 'text-error' },
              { id: 'overdue', label: 'Overdue Revisions', count: matrix?.overdue.length || 0, color: 'text-warning' },
              { id: 'upcoming', label: 'Upcoming Schedule', count: matrix?.upcoming.length || 0, color: 'text-secondary' },
              { id: 'weak_topics', label: 'Weak Topics', count: matrix?.weak_topics.length || 0, color: 'text-rose-400' },
              { id: 'recently_revised', label: 'Recently Revised', count: matrix?.recently_revised.length || 0, color: 'text-success' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMatrixFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                  matrixFilter === tab.id
                    ? 'bg-surface-card border-primary text-white shadow-sm'
                    : 'bg-surface border-border text-muted-light hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface-subtle ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Matrix Table */}
          <div className="glass-panel rounded-xl overflow-hidden border border-border">
            <div className="p-4 border-b border-border bg-surface-card flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Spaced Repetition Queue ({matrixFilter.replace('_', ' ').toUpperCase()})
              </span>
              <span className="text-[11px] text-muted">
                Confidence intervals: Weak (1d), Avg (3d), Good (1,3,7,14,30d), Strong (21d+)
              </span>
            </div>

            <div className="divide-y divide-border">
              {(!matrix || (matrix as any)[matrixFilter]?.length === 0) ? (
                <div className="p-8 text-center text-xs text-muted">
                  No topics in this revision bucket. As you complete study sessions, topics will enter the spaced repetition cycle.
                </div>
              ) : (
                (matrix as any)[matrixFilter].map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-surface-hover/50 flex flex-wrap items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.subject_color }}
                      />
                      <div>
                        <div className="font-semibold text-xs text-white hover:text-primary cursor-pointer" onClick={() => openTopicDetail(item.id)}>
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted">
                          {item.subject_name} • Revisions completed: {item.revision_count}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-muted block">Next Scheduled:</span>
                        <span className="text-secondary font-medium">
                          {item.next_revision_date || 'Unscheduled'}
                        </span>
                      </div>

                      <button
                        onClick={() => setRevisingTopicId(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
                      >
                        Log Revision
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK LOG REVISION MODAL */}
      {revisingTopicId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-semibold text-sm text-white">Log Topic Revision</h3>
            <p className="text-xs text-muted">
              Select your current confidence level to automatically compute the next retention interval:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Weak (1 Day)', val: 'Weak', col: 'text-error' },
                { label: 'Average (3 Days)', val: 'Average', col: 'text-warning' },
                { label: 'Good (Spaced ladder)', val: 'Good', col: 'text-secondary' },
                { label: 'Strong (21+ Days)', val: 'Strong', col: 'text-success' },
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => handleReviseTopic(revisingTopicId, c.val)}
                  className="p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-semibold text-left transition-all"
                >
                  <div className={c.col}>{c.val}</div>
                  <div className="text-[10px] text-muted font-normal">{c.label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setRevisingTopicId(null)}
              className="w-full py-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-muted-light"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOPIC DETAIL DRAWER */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-surface border-l border-border h-full p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted">
                  {selectedTopic.subject?.name}
                </span>
                <h3 className="font-bold text-base text-white">
                  {selectedTopic.topic?.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-1 rounded text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-[10px] text-muted block">Estimated Hours</span>
                <span className="font-bold font-mono text-white">
                  {selectedTopic.topic?.estimated_hours}h
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-[10px] text-muted block">Actual Logged</span>
                <span className="font-bold font-mono text-secondary">
                  {selectedTopic.topic?.actual_hours}h
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-[10px] text-muted block">PYQs Solved</span>
                <span className="font-bold font-mono text-white">
                  {selectedTopic.topic?.pyqs_solved} / {selectedTopic.topic?.pyqs_target}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-card border border-border">
                <span className="text-[10px] text-muted block">Confidence Rating</span>
                <span className="font-bold text-success">
                  {selectedTopic.topic?.confidence || 'Not rated'}
                </span>
              </div>
            </div>

            {/* Subtopics Checklist */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-slate-200">Official Subtopics</h4>
              <div className="space-y-1.5 p-3 rounded-xl bg-surface-card border border-border">
                {(() => {
                  try {
                    const st = JSON.parse(selectedTopic.topic?.subtopics_json || '[]');
                    return st.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => handleSubtopicToggle(selectedTopic.topic, item.id)}
                        className="flex items-center gap-2 text-xs text-slate-200 hover:text-white cursor-pointer select-none"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-muted flex-shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through text-muted' : ''}>
                          {item.title}
                        </span>
                      </div>
                    ));
                  } catch {
                    return <span className="text-xs text-muted">No subtopics defined</span>;
                  }
                })()}
              </div>
            </div>

            {/* Linked Mistakes */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-slate-200">
                Linked Mistakes in Vault ({selectedTopic.mistakes?.length || 0})
              </h4>
              {selectedTopic.mistakes && selectedTopic.mistakes.length > 0 ? (
                <div className="space-y-2">
                  {selectedTopic.mistakes.map((m: any) => (
                    <div key={m.id} className="p-3 rounded-lg bg-error/10 border border-error/30 text-xs">
                      <div className="font-medium text-white">{m.question_text}</div>
                      <div className="text-[10px] text-muted-light mt-1">
                        Category: {m.error_category} • {m.is_resolved ? 'Resolved' : 'Active Gap'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No mistakes recorded under this topic.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
