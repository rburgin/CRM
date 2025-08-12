import { type FC, useEffect, useState } from 'react';
import { 
  Target, 
  ArrowLeft,
  Edit,
  MoreHorizontal,
  DollarSign,
  Calendar,
  TrendingUp,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { intentAPI } from '../../lib/api/intent.api';
import { PerformanceMonitor } from '../../lib/observability/telemetry';
import type { IntentResponse } from '../../lib/validation/intent-schemas';

interface IntentDetailProps {
  intentId: string;
  onBack: () => void;
}

export const IntentDetail: FC<IntentDetailProps> = ({
  intentId, 
  onBack 
}) => {
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<{
    duration: number;
    p95: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startTime = performance.now();
        const response = await intentAPI.getIntent(intentId, { 
          include_relationship: true,
          include_interactions: true 
        });
        const duration = performance.now() - startTime;
        
        setIntent(response.data);
        
        // Get performance stats
        const p95 = PerformanceMonitor.getP95('intent.get');
        setPerformanceStats({ duration, p95 });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intent');
      } finally {
        setLoading(false);
      }
    };

    fetchIntent();
  }, [intentId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intents</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Intent</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="p-6">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intents</span>
        </button>
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Intent not found</h3>
          <p className="text-gray-600">The intent you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

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

  const getActionTypeIcon = (type: string) => {
    const icons = {
      'call': Phone,
      'email': Mail,
      'meeting': MessageCircle,
      'follow_up': ArrowRight,
      'proposal': Target,
      'demo': Target,
    };
    return icons[type as keyof typeof icons] || Target;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intents</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Performance Stats (Development Only) */}
      {performanceStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-blue-800">Performance:</span>
            <span className="text-blue-700">
              Load Time: {performanceStats.duration.toFixed(2)}ms
            </span>
            {performanceStats.p95 && (
              <span className="text-blue-700">
                P95: {performanceStats.p95.toFixed(2)}ms
              </span>
            )}
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              performanceStats.duration < 150 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {performanceStats.duration < 150 ? '✓ Under 150ms' : '⚠ Over 150ms'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intent Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intent Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{intent.title}</h1>
                  <div className={`px-3 py-1 rounded-md border text-sm font-medium ${getStageColor(intent.stage)}`}>
                    {intent.stage.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                {intent.description && (
                  <p className="text-gray-600 mb-4">{intent.description}</p>
                )}
              </div>
              <div className={`ml-4 ${getPriorityColor(intent.priority)}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {intent.currency} {intent.value.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Deal Value</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {Math.round(intent.probability * 100)}%
                </div>
                <div className="text-sm text-blue-700">Probability</div>
              </div>
              
              {intent.days_in_stage && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-900">
                    {intent.days_in_stage}
                  </div>
                  <div className="text-sm text-yellow-700">Days in Stage</div>
                </div>
              )}
              
              {intent.expected_close_date && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-bold text-purple-900">
                    {new Date(intent.expected_close_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-purple-700">Expected Close</div>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Info */}
          {intent.relationship && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Contact</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {intent.relationship.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{intent.relationship.name}</h4>
                  {intent.relationship.company && (
                    <p className="text-gray-600">{intent.relationship.company}</p>
                  )}
                  {intent.relationship.email && (
                    <p className="text-sm text-gray-500">{intent.relationship.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Propensity Score</div>
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(intent.relationship.propensity_score * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {intent.ai_insights.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
              </div>
              <div className="space-y-4">
                {intent.ai_insights.map((insight) => (
                  <div key={insight.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-purple-900">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="text-xs text-purple-600 font-medium">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-purple-800 mb-2">{insight.description}</p>
                    <div className="text-xs text-purple-600 bg-white bg-opacity-50 rounded p-2">
                      <strong>AI Reasoning:</strong> {insight.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Best Actions */}
          {intent.next_best_actions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Best Actions</h3>
              <div className="space-y-3">
                {intent.next_best_actions.map((action) => {
                  const ActionIcon = getActionTypeIcon(action.type);
                  return (
                    <button 
                      key={action.id}
                      className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg border border-green-200 transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <ActionIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-green-900">{action.title}</h4>
                            <div className="flex items-center space-x-1">
                              <span className={`w-2 h-2 rounded-full ${
                                action.priority === 1 ? 'bg-red-500' :
                                action.priority === 2 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></span>
                              <span className="text-xs text-green-600 font-medium">
                                P{action.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-green-700 mb-2">{action.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">
                              {Math.round(action.confidence * 100)}% confidence
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              action.estimated_impact === 'high' ? 'bg-red-100 text-red-700' :
                              action.estimated_impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {action.estimated_impact} impact
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-green-600 bg-white bg-opacity-50 rounded p-2">
                            <strong>Why:</strong> {action.reasoning}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Progress</h3>
            <div className="space-y-3">
              {['discovery', 'qualification', 'proposal', 'negotiation', 'closed-won'].map((stage, index) => {
                const isPassed = ['discovery', 'qualification', 'proposal', 'negotiation'].indexOf(intent.stage) > index;
                const isCurrent = intent.stage === stage;
                
                return (
                  <div key={stage} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPassed ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isPassed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isCurrent ? 'text-blue-900' :
                        isPassed ? 'text-green-900' :
                        'text-gray-500'
                      }`}>
                        {stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {isCurrent && intent.days_in_stage && (
                        <div className="text-xs text-blue-600">
                          {intent.days_in_stage} days in stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(intent.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(intent.updated_at).toLocaleDateString()}
                </span>
              </div>
              {intent.interaction_count !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interactions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {intent.interaction_count}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Priority</span>
                <span className={`text-sm font-medium capitalize ${getPriorityColor(intent.priority)}`}>
                  {intent.priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
