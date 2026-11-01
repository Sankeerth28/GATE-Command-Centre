import { useState, useEffect } from 'react';
import { TimerProvider } from './context/TimerContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { GlobalTimerBar } from './components/GlobalTimerBar';
import { IntelligentAssistantModal } from './components/IntelligentAssistantModal';
import { CommandPalette } from './components/CommandPalette';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { PlannerPage } from './pages/PlannerPage';
import { MocksPage } from './pages/MocksPage';
import { JournalPage } from './pages/JournalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState('morning_checkin');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [completionMeta, setCompletionMeta] = useState<any>(null);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '1') {
        setCurrentTab('dashboard');
      } else if (e.key === '2') {
        setCurrentTab('syllabus');
      } else if (e.key === '3') {
        setCurrentTab('planner');
      } else if (e.key === '4') {
        setCurrentTab('mocks');
      } else if (e.key === '5') {
        setCurrentTab('journal');
      } else if (e.key === '6') {
        setCurrentTab('analytics');
      } else if (e.key === '7') {
        setCurrentTab('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openAssistant = (mode: string = 'morning_checkin') => {
    setAssistantMode(mode);
    setAssistantOpen(true);
  };

  const handleTimerCompletionPrompt = (meta: any) => {
    setCompletionMeta(meta);
    setAssistantMode('task_completion');
    setAssistantOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col antialiased selection:bg-primary selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenAssistant={openAssistant}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* 2. Global Persistent Study Timer Bar */}
      <GlobalTimerBar onOpenCompletionPrompt={handleTimerCompletionPrompt} />

      {/* 3. Main Body: Sidebar + Active Page */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-90px)] bg-gradient-to-b from-background to-[#0B0D14]">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenAssistant={openAssistant}
              onNavigateToSyllabus={() => setCurrentTab('syllabus')}
              onNavigateToPlanner={() => setCurrentTab('planner')}
            />
          )}

          {currentTab === 'syllabus' && <SyllabusPage />}

          {currentTab === 'planner' && <PlannerPage />}

          {currentTab === 'mocks' && <MocksPage />}

          {currentTab === 'journal' && <JournalPage />}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* 4. Intelligent Interaction Engine Modal */}
      <IntelligentAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        initialMode={assistantMode}
        taskCompletionMeta={completionMeta}
        onSuccessRefresh={() => {
          // Trigger refresh if needed
        }}
      />

      {/* 5. Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenAssistant={openAssistant}
        onStartTimer={() => {
          // start timer trigger
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TimerProvider>
      <AppContent />
    </TimerProvider>
  );
}
