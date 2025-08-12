import { type FC } from 'react';
import {
  Home,
  Users,
  Target,
  MessageCircle,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'intents', label: 'Intents', icon: Target },
  { id: 'interactions', label: 'Interactions', icon: MessageCircle },
  { id: 'signals', label: 'Signals', icon: Zap },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

export const Sidebar: FC<SidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 px-4 py-6">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Suggestions Panel */}
      <div className="mt-8 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">AI Insights</h3>
        </div>
        <div className="space-y-2 text-xs text-purple-700">
          <p>• 3 high-propensity contacts ready for outreach</p>
          <p>• Deal value increased 23% this quarter</p>
          <p>• 5 intents need follow-up this week</p>
        </div>
        <button className="mt-3 text-xs text-purple-600 hover:text-purple-800 font-medium">
          View all suggestions →
        </button>
      </div>
    </aside>
  );
};
