import React, { useState } from 'react';
import { RelationshipDetail } from './RelationshipDetail';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building,
  TrendingUp,
  Star,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { Relationship } from '../../types';

interface RelationshipCardProps {
  relationship: Relationship;
  onSelect: (relationship: Relationship) => void;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({ relationship, onSelect }) => {
  const getPropensityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onSelect(relationship)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {relationship.avatar ? (
              <img src={relationship.avatar} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <span className="text-sm font-semibold text-gray-600">
                {relationship.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{relationship.name}</h3>
            {relationship.title && relationship.company && (
              <p className="text-sm text-gray-600">{relationship.title} at {relationship.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-md border text-xs font-medium ${getPropensityColor(relationship.propensityScore)}`}>
            {Math.round(relationship.propensityScore * 100)}% likely
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        {relationship.email && (
          <div className="flex items-center space-x-1">
            <Mail className="w-4 h-4" />
            <span>{relationship.email}</span>
          </div>
        )}
        {relationship.phone && (
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4" />
            <span>{relationship.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {relationship.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {relationship.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{relationship.tags.length - 3}
            </span>
          )}
        </div>
        {relationship.lastInteraction && (
          <span className="text-xs text-gray-500">
            Last contact: {new Date(relationship.lastInteraction).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export const Relationships: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  // If a relationship is selected, show detail view
  if (selectedRelationshipId) {
    return (
      <RelationshipDetail 
        relationshipId={selectedRelationshipId}
        onBack={() => setSelectedRelationshipId(null)}
      />
    );
  }

  // Mock data
  const relationships: Relationship[] = [
    {
      id: '1',
      orgId: 'org-1',
      type: 'individual',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Solutions',
      title: 'VP of Engineering',
      tags: ['enterprise', 'decision-maker', 'hot-lead'],
      lastInteraction: '2024-01-15',
      propensityScore: 0.89,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      orgId: 'org-1',
      type: 'individual',
      name: 'Michael Rodriguez',
      email: 'mike@startupxyz.com',
      company: 'StartupXYZ',
      title: 'CEO',
      tags: ['startup', 'referral', 'demo-scheduled'],
      lastInteraction: '2024-01-14',
      propensityScore: 0.76,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-14'
    },
    {
      id: '3',
      orgId: 'org-1',
      type: 'individual',
      name: 'Emily Watson',
      email: 'emily.watson@bigco.com',
      phone: '+1 (555) 987-6543',
      company: 'BigCo Industries',
      title: 'Director of Operations',
      tags: ['enterprise', 'evaluation', 'budget-approved'],
      lastInteraction: '2024-01-12',
      propensityScore: 0.65,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12'
    }
  ];

  const filteredRelationships = relationships.filter(rel => {
    const matchesSearch = rel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rel.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rel.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'high-propensity' && rel.propensityScore >= 0.8) ||
                         (selectedFilter === 'recent' && rel.lastInteraction);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relationships</h2>
          <p className="text-gray-600">Manage and track all your business relationships</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Relationship</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select 
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Relationships</option>
          <option value="high-propensity">High Propensity</option>
          <option value="recent">Recent Activity</option>
        </select>
        
        <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">More Filters</span>
        </button>
      </div>

      {/* AI Insights Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">AI Insights</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-purple-800">
            3 relationships show strong buying signals this week. Sarah Chen has 89% propensity to convert.
          </p>
          <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            View Details →
          </button>
        </div>
      </div>

      {/* Relationships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRelationships.map(relationship => (
          <RelationshipCard 
            key={relationship.id} 
            relationship={relationship}
            onSelect={(rel) => setSelectedRelationshipId(rel.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRelationships.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Your First Relationship
          </button>
        </div>
      )}
    </div>
  );
};