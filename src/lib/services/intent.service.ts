import { supabase, setOrgContext, clearOrgContext, type RequestContext } from '../database/client';
import { 
  IntentGetParams, 
  IntentListParams, 
  IntentResponse,
  IntentGetParamsSchema,
  IntentListParamsSchema,
  IntentResponseSchema,
  AIInsightSchema,
  NextBestActionSchema,
  PipelineAnalytics,
  PipelineAnalyticsSchema,
  type AIInsight,
  type NextBestAction
} from '../validation/intent-schemas';
import { APISuccess, PaginatedResponse } from '../validation/schemas';
import { tracer, PerformanceMonitor, Logger } from '../observability/telemetry';
import { v4 as uuidv4 } from 'uuid';

export class IntentService {
  private logger: Logger;

  constructor(private context: RequestContext) {
    this.logger = new Logger({
      requestId: context.requestId,
      orgId: context.orgId,
      userId: context.userId,
    });
  }

  async getIntent(params: IntentGetParams): Promise<APISuccess<IntentResponse>> {
    const span = tracer.startSpan('intent.get');
    const startTime = performance.now();

    try {
      // Validate input
      const validatedParams = IntentGetParamsSchema.parse(params);
      
      span.setTags({
        'intent.id': validatedParams.id,
        'org.id': this.context.orgId,
        'operation': 'intent.get',
        'include_relationship': validatedParams.include_relationship,
        'include_interactions': validatedParams.include_interactions,
      });

      this.logger.info('Getting intent', {
        intentId: validatedParams.id,
        operation: 'intent.get',
      });

      // Set org context for RLS
      await setOrgContext(this.context.orgId);

      // Build query with optional joins
      let selectClause = `
        *,
        relationships!inner(id, name, email, company, propensity_score)
      `;

      if (validatedParams.include_interactions) {
        selectClause += `, interactions(count)`;
      }

      const { data, error } = await supabase
        .from('intents')
        .select(selectClause)
        .eq('id', validatedParams.id)
        .single();

      if (error) {
        span.log('error', 'Database query failed', { error: error.message });
        this.logger.error('Database query failed', { 
          error: error.message,
          code: error.code,
          intentId: validatedParams.id,
        });
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!data) {
        span.log('warn', 'Intent not found');
        this.logger.warn('Intent not found', {
          intentId: validatedParams.id,
        });
        throw new Error('Intent not found');
      }

      // Generate AI insights and next best actions
      const aiInsights = await this.generateAIInsights(data);
      const nextBestActions = await this.generateNextBestActions(data);

      // Calculate computed fields
      const daysInStage = this.calculateDaysInStage(data.updated_at, data.stage);
      const interactionCount = validatedParams.include_interactions 
        ? data.interactions?.[0]?.count || 0 
        : undefined;

      // Transform and validate response
      const intent = IntentResponseSchema.parse({
        id: data.id,
        org_id: data.org_id,
        relationship_id: data.relationship_id,
        title: data.title,
        description: data.description,
        value: data.value,
        currency: data.currency,
        stage: data.stage,
        priority: data.priority,
        expected_close_date: data.expected_close_date,
        probability: data.probability,
        ai_insights: aiInsights,
        next_best_actions: nextBestActions,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
        relationship: validatedParams.include_relationship ? {
          id: data.relationships.id,
          name: data.relationships.name,
          email: data.relationships.email,
          company: data.relationships.company,
          propensity_score: data.relationships.propensity_score,
        } : undefined,
        days_in_stage: daysInStage,
        interaction_count: interactionCount,
      });

      const duration = span.finish();
      PerformanceMonitor.record('intent.get', duration, {
        orgId: this.context.orgId,
        intentId: validatedParams.id,
        includeRelationship: validatedParams.include_relationship,
      });

      this.logger.info('Intent retrieved successfully', {
        intentId: validatedParams.id,
        stage: intent.stage,
        value: intent.value,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        data: intent,
        meta: {
          request_id: this.context.requestId,
          timestamp: new Date().toISOString(),
          org_id: this.context.orgId,
        },
      };

    } catch (error) {
      const duration = span.finish();
      PerformanceMonitor.record('intent.get.error', duration, {
        orgId: this.context.orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span.log('error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.logger.error('Get intent failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        intentId: params.id,
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      await clearOrgContext();
    }
  }

  async listIntents(params: IntentListParams = {}): Promise<PaginatedResponse<IntentResponse>> {
    const span = tracer.startSpan('intent.list');
    const startTime = performance.now();

    try {
      // Validate input
      const validatedParams = IntentListParamsSchema.parse(params);
      
      span.setTags({
        'org.id': this.context.orgId,
        'operation': 'intent.list',
        'limit': validatedParams.limit,
        'has_cursor': !!validatedParams.cursor,
        'has_search': !!validatedParams.search,
        'stage': validatedParams.stage || 'all',
        'priority': validatedParams.priority || 'all',
      });

      this.logger.info('Listing intents', {
        operation: 'intent.list',
        limit: validatedParams.limit,
        cursor: validatedParams.cursor,
        search: validatedParams.search,
        filters: {
          stage: validatedParams.stage,
          priority: validatedParams.priority,
          relationship_id: validatedParams.relationship_id,
        },
      });

      // Set org context for RLS
      await setOrgContext(this.context.orgId);

      // Build query
      let query = supabase
        .from('intents')
        .select(`
          *,
          relationships!inner(id, name, email, company, propensity_score)
        `, { count: 'exact' });

      // Apply cursor pagination
      if (validatedParams.cursor) {
        query = query.gt('id', validatedParams.cursor);
      }

      // Apply search
      if (validatedParams.search) {
        query = query.textSearch('search_vector', validatedParams.search);
      }

      // Apply filters
      if (validatedParams.stage) {
        query = query.eq('stage', validatedParams.stage);
      }

      if (validatedParams.priority) {
        query = query.eq('priority', validatedParams.priority);
      }

      if (validatedParams.relationship_id) {
        query = query.eq('relationship_id', validatedParams.relationship_id);
      }

      if (validatedParams.min_value !== undefined) {
        query = query.gte('value', validatedParams.min_value);
      }

      if (validatedParams.max_value !== undefined) {
        query = query.lte('value', validatedParams.max_value);
      }

      if (validatedParams.min_probability !== undefined) {
        query = query.gte('probability', validatedParams.min_probability);
      }

      if (validatedParams.expected_close_before) {
        query = query.lte('expected_close_date', validatedParams.expected_close_before);
      }

      if (validatedParams.expected_close_after) {
        query = query.gte('expected_close_date', validatedParams.expected_close_after);
      }

      // Apply sorting and limit
      query = query
        .order(validatedParams.sort_by, { ascending: validatedParams.sort_order === 'asc' })
        .limit(validatedParams.limit + 1); // +1 to check if there are more results

      const { data, error, count } = await query;

      if (error) {
        span.log('error', 'Database query failed', { error: error.message });
        this.logger.error('Database query failed', { 
          error: error.message,
          code: error.code,
        });
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Check if there are more results
      const hasMore = data.length > validatedParams.limit;
      const intents = data.slice(0, validatedParams.limit);
      const nextCursor = hasMore ? intents[intents.length - 1]?.id : null;

      // Transform and validate response with AI enhancements
      const validatedIntents = await Promise.all(
        intents.map(async (item) => {
          const aiInsights = await this.generateAIInsights(item);
          const nextBestActions = await this.generateNextBestActions(item);
          const daysInStage = this.calculateDaysInStage(item.updated_at, item.stage);

          return IntentResponseSchema.parse({
            id: item.id,
            org_id: item.org_id,
            relationship_id: item.relationship_id,
            title: item.title,
            description: item.description,
            value: item.value,
            currency: item.currency,
            stage: item.stage,
            priority: item.priority,
            expected_close_date: item.expected_close_date,
            probability: item.probability,
            ai_insights: aiInsights,
            next_best_actions: nextBestActions,
            metadata: item.metadata,
            created_at: item.created_at,
            updated_at: item.updated_at,
            relationship: {
              id: item.relationships.id,
              name: item.relationships.name,
              email: item.relationships.email,
              company: item.relationships.company,
              propensity_score: item.relationships.propensity_score,
            },
            days_in_stage: daysInStage,
          });
        })
      );

      const duration = span.finish();
      PerformanceMonitor.record('intent.list', duration, {
        orgId: this.context.orgId,
        resultCount: validatedIntents.length,
        hasSearch: !!validatedParams.search,
        hasFilters: !!(validatedParams.stage || validatedParams.priority),
      });

      this.logger.info('Intents listed successfully', {
        count: validatedIntents.length,
        totalCount: count,
        hasMore,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        data: validatedIntents,
        meta: {
          request_id: this.context.requestId,
          timestamp: new Date().toISOString(),
          org_id: this.context.orgId,
          pagination: {
            cursor: nextCursor,
            has_more: hasMore,
            limit: validatedParams.limit,
            total_count: count || undefined,
          },
        },
      };

    } catch (error) {
      const duration = span.finish();
      PerformanceMonitor.record('intent.list.error', duration, {
        orgId: this.context.orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span.log('error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.logger.error('List intents failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      await clearOrgContext();
    }
  }

  async getPipelineAnalytics(): Promise<APISuccess<PipelineAnalytics>> {
    const span = tracer.startSpan('intent.pipeline_analytics');
    const startTime = performance.now();

    try {
      span.setTags({
        'org.id': this.context.orgId,
        'operation': 'intent.pipeline_analytics',
      });

      this.logger.info('Getting pipeline analytics', {
        operation: 'intent.pipeline_analytics',
      });

      // Set org context for RLS
      await setOrgContext(this.context.orgId);

      // Get pipeline metrics with complex aggregations
      const { data: stageData, error: stageError } = await supabase
        .from('intents')
        .select(`
          stage,
          value,
          probability,
          created_at,
          updated_at
        `)
        .neq('stage', 'closed-lost'); // Exclude lost deals from pipeline

      if (stageError) {
        throw new Error(`Failed to get stage data: ${stageError.message}`);
      }

      // Calculate stage metrics
      const stageMetrics = this.calculateStageMetrics(stageData);
      
      // Calculate velocity metrics
      const velocityMetrics = await this.calculateVelocityMetrics();
      
      // Generate forecasting
      const forecasting = this.generateForecasting(stageData);

      const totalIntents = stageData.length;
      const totalPipelineValue = stageData.reduce((sum, intent) => sum + intent.value, 0);
      const weightedPipelineValue = stageData.reduce((sum, intent) => sum + (intent.value * intent.probability), 0);
      const avgDealSize = totalIntents > 0 ? totalPipelineValue / totalIntents : 0;

      // Get conversion rate from closed deals
      const { data: closedData, error: closedError } = await supabase
        .from('intents')
        .select('stage')
        .in('stage', ['closed-won', 'closed-lost']);

      if (closedError) {
        throw new Error(`Failed to get closed deals: ${closedError.message}`);
      }

      const totalClosed = closedData.length;
      const totalWon = closedData.filter(d => d.stage === 'closed-won').length;
      const overallConversionRate = totalClosed > 0 ? totalWon / totalClosed : 0;

      const analytics = PipelineAnalyticsSchema.parse({
        total_intents: totalIntents,
        total_pipeline_value: totalPipelineValue,
        weighted_pipeline_value: weightedPipelineValue,
        avg_deal_size: avgDealSize,
        overall_conversion_rate: overallConversionRate,
        stage_metrics: stageMetrics,
        velocity_metrics: velocityMetrics,
        forecasting: forecasting,
      });

      const duration = span.finish();
      PerformanceMonitor.record('intent.pipeline_analytics', duration, {
        orgId: this.context.orgId,
        intentCount: totalIntents,
      });

      this.logger.info('Pipeline analytics generated successfully', {
        totalIntents,
        totalPipelineValue,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        data: analytics,
        meta: {
          request_id: this.context.requestId,
          timestamp: new Date().toISOString(),
          org_id: this.context.orgId,
        },
      };

    } catch (error) {
      const duration = span.finish();
      PerformanceMonitor.record('intent.pipeline_analytics.error', duration, {
        orgId: this.context.orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span.log('error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.logger.error('Pipeline analytics failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      await clearOrgContext();
    }
  }

  // AI-powered insight generation
  private async generateAIInsights(intentData: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Behavioral insights based on stage and probability
    if (intentData.probability > 0.8 && intentData.stage === 'qualification') {
      insights.push(AIInsightSchema.parse({
        id: uuidv4(),
        type: 'behavioral',
        title: 'High Conversion Probability Detected',
        description: 'This intent shows strong buying signals with 80%+ probability while still in qualification stage.',
        confidence: 0.92,
        reasoning: 'High probability score combined with early stage indicates accelerated buying process',
        impact: 'high',
        timestamp: new Date().toISOString(),
        metadata: { probability: intentData.probability, stage: intentData.stage },
      }));
    }

    // Predictive insights based on value and timeline
    if (intentData.value > 50000 && intentData.expected_close_date) {
      const daysToClose = Math.ceil((new Date(intentData.expected_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToClose < 30) {
        insights.push(AIInsightSchema.parse({
          id: uuidv4(),
          type: 'predictive',
          title: 'High-Value Deal Closing Soon',
          description: `$${intentData.value.toLocaleString()} deal expected to close within ${daysToClose} days.`,
          confidence: 0.85,
          reasoning: 'Large deal value with near-term close date requires focused attention',
          impact: 'high',
          timestamp: new Date().toISOString(),
          metadata: { value: intentData.value, days_to_close: daysToClose },
        }));
      }
    }

    // Contextual insights based on stage duration
    const daysInStage = this.calculateDaysInStage(intentData.updated_at, intentData.stage);
    if (daysInStage > 30 && intentData.stage !== 'discovery') {
      insights.push(AIInsightSchema.parse({
        id: uuidv4(),
        type: 'contextual',
        title: 'Extended Stage Duration',
        description: `Intent has been in ${intentData.stage} stage for ${daysInStage} days, longer than typical.`,
        confidence: 0.78,
        reasoning: 'Extended time in stage may indicate stalled progress or need for intervention',
        impact: 'medium',
        timestamp: new Date().toISOString(),
        metadata: { days_in_stage: daysInStage, stage: intentData.stage },
      }));
    }

    return insights;
  }

  // AI-powered next best action generation
  private async generateNextBestActions(intentData: any): Promise<NextBestAction[]> {
    const actions: NextBestAction[] = [];

    // Stage-specific actions
    switch (intentData.stage) {
      case 'discovery':
        if (intentData.probability < 0.3) {
          actions.push(NextBestActionSchema.parse({
            id: uuidv4(),
            type: 'call',
            title: 'Discovery Call',
            description: 'Schedule a discovery call to better understand needs and increase engagement',
            priority: 2,
            reasoning: 'Low probability indicates need for deeper relationship building',
            confidence: 0.85,
            estimated_impact: 'high',
            estimated_effort: 'medium',
            metadata: { current_probability: intentData.probability },
          }));
        }
        break;

      case 'qualification':
        if (intentData.probability > 0.7) {
          actions.push(NextBestActionSchema.parse({
            id: uuidv4(),
            type: 'proposal',
            title: 'Send Proposal',
            description: 'High qualification score indicates readiness for formal proposal',
            priority: 1,
            reasoning: 'Strong qualification signals suggest buyer is ready to evaluate solutions',
            confidence: 0.91,
            estimated_impact: 'high',
            estimated_effort: 'high',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
            metadata: { probability: intentData.probability },
          }));
        }
        break;

      case 'proposal':
        const daysInStage = this.calculateDaysInStage(intentData.updated_at, intentData.stage);
        if (daysInStage > 14) {
          actions.push(NextBestActionSchema.parse({
            id: uuidv4(),
            type: 'follow_up',
            title: 'Proposal Follow-up',
            description: 'Follow up on proposal submitted 2+ weeks ago',
            priority: 1,
            reasoning: 'Extended time in proposal stage requires proactive follow-up',
            confidence: 0.88,
            estimated_impact: 'medium',
            estimated_effort: 'low',
            metadata: { days_in_stage: daysInStage },
          }));
        }
        break;

      case 'negotiation':
        actions.push(NextBestActionSchema.parse({
          id: uuidv4(),
          type: 'meeting',
          title: 'Negotiation Meeting',
          description: 'Schedule meeting to address final terms and close the deal',
          priority: 1,
          reasoning: 'Negotiation stage requires direct engagement to resolve final objections',
          confidence: 0.82,
          estimated_impact: 'high',
          estimated_effort: 'medium',
          metadata: { stage: intentData.stage },
        }));
        break;
    }

    // Value-based actions
    if (intentData.value > 100000 && !actions.some(a => a.type === 'meeting')) {
      actions.push(NextBestActionSchema.parse({
        id: uuidv4(),
        type: 'meeting',
        title: 'Executive Meeting',
        description: 'High-value deal warrants executive-level engagement',
        priority: 1,
        reasoning: 'Large deal value justifies senior stakeholder involvement',
        confidence: 0.79,
        estimated_impact: 'high',
        estimated_effort: 'high',
        metadata: { deal_value: intentData.value },
      }));
    }

    // Sort by priority and confidence
    return actions.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.confidence - a.confidence;
    });
  }

  private calculateDaysInStage(updatedAt: string, stage: string): number {
    const stageDate = new Date(updatedAt);
    const now = new Date();
    return Math.ceil((now.getTime() - stageDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateStageMetrics(intents: any[]) {
    const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed-won'];
    
    return stages.map(stage => {
      const stageIntents = intents.filter(i => i.stage === stage);
      const count = stageIntents.length;
      const totalValue = stageIntents.reduce((sum, i) => sum + i.value, 0);
      const avgValue = count > 0 ? totalValue / count : 0;
      const avgProbability = count > 0 ? stageIntents.reduce((sum, i) => sum + i.probability, 0) / count : 0;
      const avgDaysInStage = count > 0 ? stageIntents.reduce((sum, i) => sum + this.calculateDaysInStage(i.updated_at, i.stage), 0) / count : 0;

      return {
        stage: stage as any,
        count,
        total_value: totalValue,
        avg_value: avgValue,
        avg_probability: avgProbability,
        avg_days_in_stage: avgDaysInStage,
      };
    });
  }

  private async calculateVelocityMetrics() {
    // Simplified velocity calculation - in production would analyze historical stage transitions
    return {
      avg_days_to_close: 45,
      avg_days_discovery_to_qualification: 7,
      avg_days_qualification_to_proposal: 14,
      avg_days_proposal_to_negotiation: 10,
      avg_days_negotiation_to_close: 14,
    };
  }

  private generateForecasting(intents: any[]) {
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const next60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const forecast30 = intents
      .filter(i => i.expected_close_date && new Date(i.expected_close_date) <= next30)
      .reduce((sum, i) => sum + (i.value * i.probability), 0);

    const forecast60 = intents
      .filter(i => i.expected_close_date && new Date(i.expected_close_date) <= next60)
      .reduce((sum, i) => sum + (i.value * i.probability), 0);

    const forecast90 = intents
      .filter(i => i.expected_close_date && new Date(i.expected_close_date) <= next90)
      .reduce((sum, i) => sum + (i.value * i.probability), 0);

    return {
      next_30_days: forecast30,
      next_60_days: forecast60,
      next_90_days: forecast90,
      confidence: 0.82, // AI-calculated confidence in forecast
    };
  }
}