import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  ArrowLeft,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { relationshipAPI } from '../../lib/api/relationship.api';
import { PerformanceMonitor } from '../../lib/observability/telemetry';
import type { RelationshipResponse } from '../../lib/validation/schemas';

interface RelationshipDetailProps {
  relationshipId: string;
  onBack: () => void;
}

export const RelationshipDetail: React.FC<RelationshipDetailProps> = ({ 
  relationshipId, 
  onBack 
}) => {
  const [relationship, setRelationship] = useState<RelationshipResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<{
    duration: number;
    p95: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchRelationship = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startTime = performance.now();
        const response = await relationshipAPI.getRelationship(relationshipId);
        const duration = performance.now() - startTime;
        
        setRelationship(response.data);
        
        // Get performance stats
        const p95 = PerformanceMonitor.getP95('relationship.get');
        setPerformanceStats({ duration, p95 });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load relationship');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationship();
  }, [relationshipId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
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
          <span>Back to Relationships</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Relationship</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!relationship) {
    return (
      <div className="p-6">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Relationships</span>
        </button>
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Relationship not found</h3>
          <p className="text-gray-600">The relationship you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getPropensityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
          <span>Back to Relationships</span>
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
              performanceStats.duration < 100 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {performanceStats.duration < 100 ? '✓ Under 100ms' : '⚠ Over 100ms'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              {relationship.avatar_url ? (
                <img 
                  src={relationship.avatar_url} 
                  alt="" 
                  className="w-16 h-16 rounded-full object-cover" 
                />
              ) : (
                <span className="text-xl font-semibold text-gray-600">
                  {relationship.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{relationship.name}</h1>
                <div className={`px-3 py-1 rounded-md border text-sm font-medium ${getPropensityColor(relationship.propensity_score)}`}>
                  {Math.round(relationship.propensity_score * 100)}% likely to convert
                </div>
              </div>
              
              {relationship.title && relationship.company && (
                <p className="text-lg text-gray-600 mb-3">
                  {relationship.title} at {relationship.company}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {relationship.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {relationship.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{relationship.email}</p>
                </div>
              </div>
            )}
            
            {relationship.phone && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{relationship.phone}</p>
                </div>
              </div>
            )}
            
            {relationship.company && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{relationship.company}</p>
                </div>
              </div>
            )}
            
            {relationship.last_interaction_at && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Contact</p>
                  <p className="font-medium text-gray-900">
                    {new Date(relationship.last_interaction_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {relationship.metadata.interaction_count || 0}
              </div>
              <div className="text-sm text-blue-700">Interactions</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {relationship.metadata.signal_count || 0}
              </div>
              <div className="text-sm text-purple-700">Signals</div>
            </div>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-6">
          {/* Propensity Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Propensity Score</h3>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(relationship.propensity_score * 100)}%
              </div>
              <p className="text-sm text-gray-600 mb-4">Likelihood to convert</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${relationship.propensity_score * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Insights</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  High engagement with recent email campaigns
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  Strong buying signals detected this week
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">
                  Optimal time for follow-up: Tuesday 2-4 PM
                </p>
              </div>
            </div>
          </div>

          {/* Next Best Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Best Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                <div className="font-medium text-green-800">Schedule Call</div>
                <div className="text-sm text-green-600">High propensity score detected</div>
              </button>
              
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                <div className="font-medium text-blue-800">Send Proposal</div>
                <div className="text-sm text-blue-600">Budget discussion completed</div>
              </button>
              
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                <div className="font-medium text-purple-800">Follow Up Email</div>
                <div className="text-sm text-purple-600">Last contact was 5 days ago</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};