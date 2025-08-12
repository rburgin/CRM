import React, { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Views/Dashboard';
import { Relationships } from './components/Views/Relationships';
import { Intents } from './components/Views/Intents';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'relationships':
        return <Relationships />;
      case 'intents':
        return <Intents />;
      case 'interactions':
        return <div className="p-6"><h2 className="text-2xl font-bold">Interactions</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case 'signals':
        return <div className="p-6"><h2 className="text-2xl font-bold">Signals</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case 'calendar':
        return <div className="p-6"><h2 className="text-2xl font-bold">Calendar</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case 'analytics':
        return <div className="p-6"><h2 className="text-2xl font-bold">Analytics</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearchFocus={() => console.log('Search focused')} />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;