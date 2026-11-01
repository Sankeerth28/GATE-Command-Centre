import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { api } from '../services/api';
import type { JournalEntry } from '../types';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Calendar,
  Check,
  Code2,
  Eye,
  Edit3,
} from 'lucide-react';

const DAILY_REFLECTION_TEMPLATE = `### Daily Reflection — ${new Date().toISOString().split('T')[0]}

#### 1. What I Studied Today
- Core concepts covered: 

#### 2. Key Formulas & Theorems
$$ \\text{Var}(X) = E[X^2] - (E[X])^2 $$

#### 3. Conceptual Difficulties Encountered
- Challenges faced:

#### 4. Tomorrow's Priorities
- Focus topics:
`;

const FORMULA_SHEET_TEMPLATE = `### Formula Sheet: Linear Algebra & Probability

#### Singular Value Decomposition (SVD)
For any real matrix $A \\in \\mathbb{R}^{m \\times n}$:
$$ A = U \\Sigma V^T $$
Where:
- $U \\in \\mathbb{R}^{m \\times m}$ is orthogonal (left singular vectors of $A$, eigenvectors of $A A^T$)
- $\\Sigma \\in \\mathbb{R}^{m \\times n}$ contains singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge 0$
- $V \\in \\mathbb{R}^{n \\times n}$ is orthogonal (right singular vectors of $A$, eigenvectors of $A^T A$)

#### Bayes' Theorem
$$ P(A|B) = \\frac{P(B|A) P(A)}{P(B)} = \\frac{P(B|A) P(A)}{\\sum_{i} P(B|A_i) P(A_i)} $$
`;

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'edit'>('split');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Debounced autosave ref
  const debounceTimerRef = useRef<any>(null);

  const loadEntries = async () => {
    try {
      const entryList = await api.getJournalEntries();
      setEntries(entryList);
      if (entryList.length > 0 && !activeEntry) {
        setActiveEntry(entryList[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleCreateNew = async (type: 'Daily Reflection' | 'Formula Sheet' | 'Concept Note') => {
    const templateContent =
      type === 'Daily Reflection'
        ? DAILY_REFLECTION_TEMPLATE
        : type === 'Formula Sheet'
        ? FORMULA_SHEET_TEMPLATE
        : '### New Concept Note\n\nWrite formula notes and math proofs here...';

    const newEntry = await api.createJournalEntry({
      title: type === 'Daily Reflection' ? `Daily Reflection (${new Date().toLocaleDateString()})` : `New ${type}`,
      entry_type: type,
      content: templateContent,
      tags: [type.toLowerCase().replace(' ', '-')],
    });

    await loadEntries();
    setActiveEntry(newEntry);
  };

  const handleContentChange = (newContent: string) => {
    if (!activeEntry) return;

    setActiveEntry({ ...activeEntry, content: newContent });
    setSaveStatus('unsaved');

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await api.updateJournalEntry(activeEntry.id, {
          title: activeEntry.title,
          content: newContent,
          is_pinned: activeEntry.is_pinned,
        });
        setSaveStatus('saved');
      } catch (e) {
        console.error(e);
        setSaveStatus('unsaved');
      }
    }, 1000);
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!activeEntry) return;
    setActiveEntry({ ...activeEntry, title: newTitle });
    await api.updateJournalEntry(activeEntry.id, { title: newTitle });
    loadEntries();
  };

  const handleTogglePin = async (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    await api.updateJournalEntry(entry.id, { is_pinned: !entry.is_pinned });
    await loadEntries();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.deleteJournalEntry(id);
    if (activeEntry?.id === id) setActiveEntry(null);
    await loadEntries();
  };

  const filteredEntries = entries.filter((e) => {
    if (selectedType !== 'all' && e.entry_type !== selectedType) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <span>Study & Formula Journal</span>
          </h1>
          <p className="text-xs text-muted-light">
            Distraction-free Markdown & KaTeX LaTeX academic notebook • Autosaved
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCreateNew('Daily Reflection')}
            className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-warning" />
            <span>+ Reflection</span>
          </button>
          <button
            onClick={() => handleCreateNew('Formula Sheet')}
            className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-border text-xs text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-secondary" />
            <span>+ Formula Sheet</span>
          </button>
          <button
            onClick={() => handleCreateNew('Concept Note')}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Sidebar + Editor) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left: Entries Navigation */}
        <div className="md:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes & formulas..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-white placeholder:text-muted focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              {(['all', 'Daily Reflection', 'Formula Sheet', 'Concept Note'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                    selectedType === t
                      ? 'bg-primary/20 text-primary-light font-medium'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : t.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/50 p-2 space-y-1">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">No notes found.</div>
            ) : (
              filteredEntries.map((entry) => {
                const isActive = activeEntry?.id === entry.id;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setActiveEntry(entry)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isActive
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-surface-hover/70'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        {entry.is_pinned && <Pin className="w-3 h-3 text-warning fill-current" />}
                        <span className="font-semibold text-xs text-white truncate block">
                          {entry.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted block">
                        {entry.entry_type} • {entry.updated_at_utc.slice(0, 10)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => handleTogglePin(e, entry)}
                        className={`p-1 rounded text-muted hover:text-warning ${
                          entry.is_pinned ? 'text-warning' : ''
                        }`}
                        title="Pin Note"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        className="p-1 rounded text-muted hover:text-error"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Markdown & KaTeX Dual Workspace */}
        <div className="md:col-span-8 glass-panel rounded-xl flex flex-col overflow-hidden min-h-0">
          {activeEntry ? (
            <>
              {/* Note Header & View Controls */}
              <div className="p-3 border-b border-border flex items-center justify-between gap-3 bg-surface-card">
                <input
                  type="text"
                  value={activeEntry.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="font-bold text-sm bg-transparent text-white focus:outline-none flex-1 truncate"
                />

                <div className="flex items-center gap-3">
                  {/* Autosave status indicator */}
                  <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                    {saveStatus === 'saving' ? (
                      <span className="text-secondary">Autosaving...</span>
                    ) : saveStatus === 'saved' ? (
                      <span className="text-success flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    ) : (
                      <span className="text-warning">Unsaved</span>
                    )}
                  </span>

                  {/* Split / Edit / Preview Toggle */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                    <button
                      onClick={() => setPreviewMode('edit')}
                      className={`p-1 rounded ${
                        previewMode === 'edit' ? 'bg-primary text-white' : 'text-muted'
                      }`}
                      title="Editor only"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('split')}
                      className={`p-1 rounded ${
                        previewMode === 'split' ? 'bg-primary text-white' : 'text-muted'
                      }`}
                      title="Split View"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('preview')}
                      className={`p-1 rounded ${
                        previewMode === 'preview' ? 'bg-primary text-white' : 'text-muted'
                      }`}
                      title="Rendered Math Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-border min-h-0">
                {/* Editor textarea */}
                {(previewMode === 'edit' || previewMode === 'split') && (
                  <div className={`${previewMode === 'edit' ? 'col-span-2' : ''} h-full p-4 overflow-y-auto min-h-0`}>
                    <textarea
                      value={activeEntry.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Type markdown, LaTeX equations like $$\int f(x)dx$$ or inline $x^2$..."
                      className="w-full h-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                    />
                  </div>
                )}

                {/* Rendered Preview with KaTeX */}
                {(previewMode === 'preview' || previewMode === 'split') && (
                  <div
                    className={`${
                      previewMode === 'preview' ? 'col-span-2' : ''
                    } h-full p-5 overflow-y-auto prose prose-invert prose-sm max-w-none text-slate-200 min-h-0 text-xs leading-relaxed`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {activeEntry.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted">
              Select or create an academic note to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
