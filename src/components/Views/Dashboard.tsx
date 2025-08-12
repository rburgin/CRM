import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  ArrowUpRight,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon }) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <ArrowUpRight className={`w-4 h-4 ${changeColor[changeType]}`} />
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-xs font-medium ${changeColor[changeType]}`}>{change}</p>
      </div>
    </div>
  );
};

interface UrgentActionProps {
  action: {
    type: string;
    title: string;
    description: string;
    priority: number;
    reasoning: string;
  };
}

const UrgentActionCard: React.FC<UrgentActionProps> = ({ action }) => {
  const getActionColor = (type: string) => {
    const colors = {
      call: 'bg-green-50 text-green-700 border-green-200',
      email: 'bg-blue-50 text-blue-700 border-blue-200',
      meeting: 'bg-purple-50 text-purple-700 border-purple-200',
      follow_up: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      proposal: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getActionColor(action.type)}`}>
          {action.type.replace('_', ' ').toUpperCase()}
        </div>
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-orange-600 font-medium">Priority {action.priority}</span>
        </div>
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
      <div className="p-2 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-700">
          <span className="font-medium">AI Reasoning:</span> {action.reasoning}
        </p>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const metrics: DashboardMetrics = {
    totalIntents: 87,
    pipelineValue: 1250000,
    conversionRate: 23.4,
    avgDealSize: 14375,
    topPerformingStages: ['qualification', 'proposal'],
    recentSignals: [],
    urgentActions: [
      {
        id: '1',
        type: 'call',
        title: 'Follow up with Sarah Chen',
        description: 'High propensity score (0.89) - visited pricing page 3x',
        priority: 1,
        reasoning: 'Strong buying signals detected with repeated pricing page visits and demo request',
        estimatedImpact: 'high' as const
      },
      {
        id: '2',
        type: 'email',
        title: 'Send proposal to TechCorp',
        description: 'Decision maker confirmed budget allocation',
        priority: 2,
        reasoning: 'Budget approved and timeline confirmed for Q1 implementation',
        estimatedImpact: 'high' as const
      },
      {
        id: '3',
        type: 'meeting',
        title: 'Schedule demo with StartupXYZ',
        description: 'Referred by existing customer, hot lead',
        priority: 3,
        reasoning: 'Warm referral from satisfied customer with similar use case',
        estimatedImpact: 'medium' as const
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Your CRM overview and AI-powered insights</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Updated 2 minutes ago</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Intents"
          value={metrics.totalIntents.toString()}
          change="+12% this month"
          changeType="positive"
          icon={Target}
        />
        <MetricCard
          title="Pipeline Value"
          value={`$${(metrics.pipelineValue / 1000000).toFixed(1)}M`}
          change="+23% this quarter"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change="+2.1% this month"
          changeType="positive"
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Deal Size"
          value={`$${metrics.avgDealSize.toLocaleString()}`}
          change="+8% this quarter"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI-Powered Urgent Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Next Actions</h3>
            <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              HIGH PRIORITY
            </div>
          </div>
          <div className="space-y-4">
            {metrics.urgentActions.map((action) => (
              <UrgentActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">Hot Leads</span>
              <span className="text-xl font-bold text-green-600">12</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">This Week's Calls</span>
              <span className="text-xl font-bold text-blue-600">24</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">Proposals Due</span>
              <span className="text-xl font-bold text-orange-600">7</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">AI Confidence</span>
              <span className="text-xl font-bold text-purple-600">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};