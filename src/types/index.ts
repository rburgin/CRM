// Core CRM Types following Vara Architecture

export interface Organization {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  orgId: string;
  type: 'individual' | 'company';
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  avatar?: string;
  tags: string[];
  lastInteraction?: string;
  propensityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Intent {
  id: string;
  orgId: string;
  relationshipId: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedCloseDate?: string;
  probability: number;
  aiInsights: string[];
  nextBestActions: NextBestAction[];
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  orgId: string;
  relationshipId: string;
  intentId?: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  content?: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Signal {
  id: string;
  orgId: string;
  relationshipId?: string;
  intentId?: string;
  type: 'website_visit' | 'email_open' | 'email_click' | 'social_engagement' | 'pricing_page_view';
  strength: 'weak' | 'medium' | 'strong';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NextBestAction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'proposal';
  title: string;
  description: string;
  priority: number;
  reasoning: string;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface AIGeneratedSuggestion {
  id: string;
  type: 'relationship' | 'intent' | 'next_action';
  title: string;
  content: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  totalIntents: number;
  pipelineValue: number;
  conversionRate: number;
  avgDealSize: number;
  topPerformingStages: string[];
  recentSignals: Signal[];
  urgentActions: NextBestAction[];
}