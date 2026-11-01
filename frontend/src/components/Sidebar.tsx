import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Target,
  FileText,
  BarChart3,
  Settings,
  Database,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'syllabus'
  | 'planner'
  | 'mocks'
  | 'journal'
  | 'analytics'
  | 'settings';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unfinishedCount?: number;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab, unfinishedCount = 0 }) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      subtitle: 'Command Centre',
      icon: LayoutDashboard,
      badge: unfinishedCount > 0 ? unfinishedCount : null,
      badgeColor: 'bg-warning text-black',
    },
    {
      id: 'syllabus' as NavTab,
      label: 'Syllabus & SRS',
      subtitle: 'Revision Matrix',
      icon: BookOpen,
    },
    {
      id: 'planner' as NavTab,
      label: 'Planner & Tasks',
      subtitle: 'Day-wise Execution',
      icon: CalendarDays,
    },
    {
      id: 'mocks' as NavTab,
      label: 'Mocks & Mistakes',
      subtitle: 'GATE Scoring Vault',
      icon: Target,
    },
    {
      id: 'journal' as NavTab,
      label: 'Study & Formulas',
      subtitle: 'Markdown & KaTeX',
      icon: FileText,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      subtitle: 'Performance Intel',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings & Data',
      subtitle: 'JSON & SQLite',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between h-[calc(100vh-49px)] select-none">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
          Primary Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-primary/15 text-primary-light border border-primary/30 shadow-sm'
                  : 'text-slate-300 hover:bg-surface-hover hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-light group-hover:text-secondary'
                  }`}
                />
                <div>
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-muted">{item.subtitle}</div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-border bg-surface-subtle/50 text-[11px] text-muted space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Database className="w-3.5 h-3.5 text-secondary" />
            <span>SQLite WAL</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Local-First
          </span>
        </div>
        <div className="text-[10px] text-muted">
          IIT / IISc Standard DA Coverage
        </div>
      </div>
    </aside>
  );
};
