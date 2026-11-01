import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Target,
  FileText,
  BarChart3,
  Settings,
  Play,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenAssistant: (mode: string) => void;
  onStartTimer: () => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAssistant,
  onStartTimer,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'nav-dash',
      label: 'Go to Dashboard (Command Centre)',
      category: 'Navigation',
      icon: LayoutDashboard,
      perform: () => {
        onNavigate('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-syl',
      label: 'Go to Syllabus & Spaced Repetition Matrix',
      category: 'Navigation',
      icon: BookOpen,
      perform: () => {
        onNavigate('syllabus');
        onClose();
      },
    },
    {
      id: 'nav-plan',
      label: 'Go to Planner & Tasks',
      category: 'Navigation',
      icon: CalendarDays,
      perform: () => {
        onNavigate('planner');
        onClose();
      },
    },
    {
      id: 'nav-mock',
      label: 'Go to Mock Tests & Mistake Vault',
      category: 'Navigation',
      icon: Target,
      perform: () => {
        onNavigate('mocks');
        onClose();
      },
    },
    {
      id: 'nav-jour',
      label: 'Go to Study & Formula Journal',
      category: 'Navigation',
      icon: FileText,
      perform: () => {
        onNavigate('journal');
        onClose();
      },
    },
    {
      id: 'nav-anal',
      label: 'Go to Analytics & Intelligence',
      category: 'Navigation',
      icon: BarChart3,
      perform: () => {
        onNavigate('analytics');
        onClose();
      },
    },
    {
      id: 'nav-sett',
      label: 'Go to Settings & Data Management',
      category: 'Navigation',
      icon: Settings,
      perform: () => {
        onNavigate('settings');
        onClose();
      },
    },
    {
      id: 'act-timer',
      label: 'Start Study Timer Focus Session',
      category: 'Execution',
      icon: Play,
      perform: () => {
        onStartTimer();
        onClose();
      },
    },
    {
      id: 'act-morning',
      label: 'Trigger Morning Check-in',
      category: 'Assistant',
      icon: Sun,
      perform: () => {
        onOpenAssistant('morning_checkin');
        onClose();
      },
    },
    {
      id: 'act-evening',
      label: 'Trigger Evening Accountability Review',
      category: 'Assistant',
      icon: Moon,
      perform: () => {
        onOpenAssistant('evening_review');
        onClose();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-3 border-b border-border flex items-center gap-3">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search modules..."
            autoFocus
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-muted"
          />
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted">No commands found</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.perform}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs hover:bg-surface-hover text-slate-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-2 border-t border-border bg-surface-subtle/50 text-[11px] text-muted flex justify-between px-3">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
