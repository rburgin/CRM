import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IntentDetail } from './IntentDetail';
import { 
  Target, 
  Plus, 
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Intent } from '../../types';

interface IntentCardProps {
  intent: Intent;
  onSelect: (intent: Intent) => void;
}

const IntentCard: React.FC<IntentCardProps> = ({ intent, onSelect }) => {
  const getStageColor = (stage: string) => {
    const colors = {
      'discovery': 'bg-blue-100 text-blue-800 border-blue-200',
      'qualification': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'proposal': 'bg-purple-100 text-purple-800 border-purple-200',
      'negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
      'closed-won': 'bg-green-100 text-green-800 border-green-200',
      'closed-lost': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'urgent': 'text-red-600',
      'high': 'text-orange-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onSelect(intent)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{intent.title}</h3>
            <div className={`px-2 py-1 rounded-md border text-xs font-medium ${getStageColor(intent.stage)}`}>
              {intent.stage.replace('-', ' ').toUpperCase()}
            </div>
          </div>
          {intent.description && (
            <p className="text-sm text-gray-600 mb-3">{intent.description}</p>
          )}
        </div>
        <div className={`ml-4 ${getPriorityColor(intent.priority)}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {intent.currency} {intent.value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{intent.probability}% probability</span>
        </div>
        {intent.expectedCloseDate && (
          <>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Close: {new Date(intent.expectedCloseDate).toLocaleDateString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* AI Insights */}
      {intent.aiInsights.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">AI Insights</span>
          </div>
          <ul className="text-xs text-blue-700 space-y-1">
            {intent.aiInsights.slice(0, 2).map((insight, index) => (
              <li key={index}>• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Best Actions */}
      {intent.nextBestActions.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Next Best Actions</h4>
          <div className="space-y-2">
            {intent.nextBestActions.slice(0, 2).map((action, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{action.title}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Intents: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);

  // If an intent is selected, show detail view
  if (selectedIntentId) {
    return (
      <IntentDetail 
        intentId={selectedIntentId}
        onBack={() => setSelectedIntentId(null)}
      />
    );
  }

  // Mock data
  const intents: Intent[] = [
    {
      id: uuidv4(),
      orgId: uuidv4(),
      relationshipId: uuidv4(),
      title: 'TechCorp Enterprise Platform',
      description: 'Custom CRM solution for 500+ user organization',
      value: 150000,
      currency: '$',
      stage: 'proposal',
      priority: 'high',
      expectedCloseDate: '2024-02-15',
      probability: 75,
      aiInsights: [
        'Budget approved and decision committee formed',
        'Strong technical alignment with requirements',
        'Competitive eval scheduled for next week'
      ],
      nextBestActions: [
        {
          id: uuidv4(),
          type: 'proposal',
          title: 'Send technical proposal',
          description: 'Detailed architecture and implementation plan',
          priority: 1,
          reasoning: 'Decision committee needs technical details for final review',
          estimatedImpact: 'high'
        }
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: uuidv4(),
      orgId: uuidv4(),
      relationshipId: uuidv4(),
      title: 'StartupXYZ Growth Package',
      description: 'Scaling solution for rapid growth startup',
      value: 45000,
      currency: '$',
      stage: 'qualification',
      priority: 'medium',
      expectedCloseDate: '2024-01-30',
      probability: 60,
      aiInsights: [
        'Recently raised Series A funding',
        'Looking for Q1 implementation',
        'Previous CRM causing productivity issues'
      ],
      nextBestActions: [
        {
          id: uuidv4(),
          type: 'call',
          title: 'Schedule discovery call',
          description: 'Deep dive into their current workflow',
          priority: 1,
          reasoning: 'Need to understand technical requirements better',
          estimatedImpact: 'medium'
        }
      ],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-14'
    }
  ];

  const stages = [
    { value: 'all', label: 'All Stages' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed Won' },
    { value: 'closed-lost', label: 'Closed Lost' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const filteredIntents = intents.filter(intent => {
    const matchesStage = selectedStage === 'all' || intent.stage === selectedStage;
    const matchesPriority = selectedPriority === 'all' || intent.priority === selectedPriority;
    return matchesStage && matchesPriority;
  });

  const totalValue = filteredIntents.reduce((sum, intent) => sum + intent.value, 0);
  const avgProbability = filteredIntents.length > 0 ? 
    Math.round(filteredIntents.reduce((sum, intent) => sum + intent.probability, 0) / filteredIntents.length) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Intents</h2>
          <p className="text-gray-600">Track and manage all potential opportunities</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Intent</span>
        </button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{filteredIntents.length}</div>
          <div className="text-sm text-gray-600">Active Intents</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Pipeline Value</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{avgProbability}%</div>
          <div className="text-sm text-gray-600">Avg Probability</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <select 
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {stages.map(stage => (
            <option key={stage.value} value={stage.value}>{stage.label}</option>
          ))}
        </select>
        
        <select 
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {priorities.map(priority => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>
        
        <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">More Filters</span>
        </button>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Pipeline AI Insights</h3>
        </div>
        <div className="text-sm text-green-800">
          Your pipeline has increased 23% this month. TechCorp Enterprise Platform shows strongest conversion signals with 75% probability.
        </div>
      </div>

      {/* Intents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredIntents.map(intent => (
          <IntentCard 
            key={intent.id} 
            intent={intent}
            onSelect={(intent) => setSelectedIntentId(intent.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredIntents.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No intents found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or create your first intent</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Your First Intent
          </button>
        </div>
      )}
    </div>
  );
};