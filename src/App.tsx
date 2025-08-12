import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Views/Dashboard';
import { Relationships } from './components/Views/Relationships';
import { Intents } from './components/Views/Intents';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const views: Record<string, ReactNode> = useMemo(
    () => ({
      dashboard: <Dashboard />,
      relationships: <Relationships />,
      intents: <Intents />,
      interactions: (
        <div className="p-6">
          <h2 className="text-2xl font-bold">Interactions</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      ),
      signals: (
        <div className="p-6">
          <h2 className="text-2xl font-bold">Signals</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      ),
      calendar: (
        <div className="p-6">
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      ),
      analytics: (
        <div className="p-6">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      ),
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearchFocus={() => console.log('Search focused')} />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          {views[activeView] ?? views.dashboard}
        </main>
      </div>
    </div>
  );
}

export default App;
