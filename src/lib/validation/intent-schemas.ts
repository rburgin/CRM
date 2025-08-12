import { z } from 'zod';
import { UUIDSchema } from './schemas';

// Intent-specific schemas
export const IntentStageSchema = z.enum([
  'discovery',
  'qualification', 
  'proposal',
  'negotiation',
  'closed-won',
  'closed-lost'
]);

export const IntentPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'urgent'
]);

export const CurrencySchema = z.string().length(3).default('USD');

// Next Best Action schema
export const NextBestActionSchema = z.object({
  id: UUIDSchema,
  type: z.enum(['call', 'email', 'meeting', 'follow_up', 'proposal', 'demo']),
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  priority: z.number().min(1).max(10),
  reasoning: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  estimated_impact: z.enum(['low', 'medium', 'high']),
  estimated_effort: z.enum(['low', 'medium', 'high']),
  due_date: z.string().datetime().optional(),
  metadata: z.record(z.any()).default({}),
});

// AI Insight schema
export const AIInsightSchema = z.object({
  id: UUIDSchema,
  type: z.enum(['behavioral', 'predictive', 'contextual', 'competitive']),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(500),
  impact: z.enum(['low', 'medium', 'high']),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).default({}),
});

// Intent CRUD schemas
export const IntentCreateSchema = z.object({
  relationship_id: UUIDSchema,
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  value: z.number().min(0).default(0),
  currency: CurrencySchema,
  stage: IntentStageSchema.default('discovery'),
  priority: IntentPrioritySchema.default('medium'),
  expected_close_date: z.string().date().optional(),
  probability: z.number().min(0).max(1).default(0.5),
  metadata: z.record(z.any()).default({}),
});

export const IntentUpdateSchema = IntentCreateSchema.partial().omit({
  relationship_id: true, // Cannot change relationship after creation
});

export const IntentResponseSchema = z.object({
  id: UUIDSchema,
  org_id: UUIDSchema,
  relationship_id: UUIDSchema,
  title: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  currency: z.string(),
  stage: IntentStageSchema,
  priority: IntentPrioritySchema,
  expected_close_date: z.string().nullable(),
  probability: z.number(),
  ai_insights: z.array(AIInsightSchema),
  next_best_actions: z.array(NextBestActionSchema),
  metadata: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  // Computed fields
  relationship: z.object({
    id: UUIDSchema,
    name: z.string(),
    email: z.string().nullable(),
    company: z.string().nullable(),
    propensity_score: z.number(),
  }).optional(),
  days_in_stage: z.number().optional(),
  interaction_count: z.number().optional(),
  last_interaction_at: z.string().nullable().optional(),
});

// Query parameter schemas
export const IntentGetParamsSchema = z.object({
  id: UUIDSchema,
  include_relationship: z.boolean().default(false),
  include_interactions: z.boolean().default(false),
});

export const IntentListParamsSchema = z.object({
  cursor: UUIDSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  stage: IntentStageSchema.optional(),
  priority: IntentPrioritySchema.optional(),
  relationship_id: UUIDSchema.optional(),
  min_value: z.number().min(0).optional(),
  max_value: z.number().min(0).optional(),
  min_probability: z.number().min(0).max(1).optional(),
  expected_close_before: z.string().date().optional(),
  expected_close_after: z.string().date().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'value', 'probability', 'expected_close_date']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Pipeline analytics schemas
export const PipelineStageMetricsSchema = z.object({
  stage: IntentStageSchema,
  count: z.number(),
  total_value: z.number(),
  avg_value: z.number(),
  avg_probability: z.number(),
  avg_days_in_stage: z.number(),
  conversion_rate: z.number().optional(),
});

export const PipelineAnalyticsSchema = z.object({
  total_intents: z.number(),
  total_pipeline_value: z.number(),
  weighted_pipeline_value: z.number(),
  avg_deal_size: z.number(),
  overall_conversion_rate: z.number(),
  stage_metrics: z.array(PipelineStageMetricsSchema),
  velocity_metrics: z.object({
    avg_days_to_close: z.number(),
    avg_days_discovery_to_qualification: z.number(),
    avg_days_qualification_to_proposal: z.number(),
    avg_days_proposal_to_negotiation: z.number(),
    avg_days_negotiation_to_close: z.number(),
  }),
  forecasting: z.object({
    next_30_days: z.number(),
    next_60_days: z.number(),
    next_90_days: z.number(),
    confidence: z.number(),
  }),
});

// Type exports
export type IntentStage = z.infer<typeof IntentStageSchema>;
export type IntentPriority = z.infer<typeof IntentPrioritySchema>;
export type NextBestAction = z.infer<typeof NextBestActionSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;
export type IntentCreate = z.infer<typeof IntentCreateSchema>;
export type IntentUpdate = z.infer<typeof IntentUpdateSchema>;
export type IntentResponse = z.infer<typeof IntentResponseSchema>;
export type IntentGetParams = z.infer<typeof IntentGetParamsSchema>;
export type IntentListParams = z.infer<typeof IntentListParamsSchema>;
export type PipelineStageMetrics = z.infer<typeof PipelineStageMetricsSchema>;
export type PipelineAnalytics = z.infer<typeof PipelineAnalyticsSchema>;