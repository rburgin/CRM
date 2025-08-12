import { supabase, setOrgContext, clearOrgContext, type RequestContext } from '../database/client';
import { 
  RelationshipGetParams, 
  RelationshipListParams, 
  RelationshipResponse,
  RelationshipGetParamsSchema,
  RelationshipListParamsSchema,
  RelationshipResponseSchema,
  APISuccess,
  PaginatedResponse
} from '../validation/schemas';
import { tracer, PerformanceMonitor, Logger } from '../observability/telemetry';
import { v4 as uuidv4 } from 'uuid';

export class RelationshipService {
  private logger: Logger;

  constructor(private context: RequestContext) {
    this.logger = new Logger({
      requestId: context.requestId,
      orgId: context.orgId,
      userId: context.userId,
    });
  }

  async getRelationship(params: RelationshipGetParams): Promise<APISuccess<RelationshipResponse>> {
    const span = tracer.startSpan('relationship.get');
    const startTime = performance.now();

    try {
      // Validate input
      const validatedParams = RelationshipGetParamsSchema.parse(params);
      
      span.setTags({
        'relationship.id': validatedParams.id,
        'org.id': this.context.orgId,
        'operation': 'relationship.get',
      });

      this.logger.info('Getting relationship', {
        relationshipId: validatedParams.id,
        operation: 'relationship.get',
      });

      // Set org context for RLS
      await setOrgContext(this.context.orgId);

      // Query with joins for related data
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          *,
          interactions:interactions(count),
          signals:signals(count)
        `)
        .eq('id', validatedParams.id)
        .single();

      if (error) {
        span.log('error', 'Database query failed', { error: error.message });
        this.logger.error('Database query failed', { 
          error: error.message,
          code: error.code,
          relationshipId: validatedParams.id,
        });
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!data) {
        span.log('warn', 'Relationship not found');
        this.logger.warn('Relationship not found', {
          relationshipId: validatedParams.id,
        });
        throw new Error('Relationship not found');
      }

      // Transform and validate response
      const relationship = RelationshipResponseSchema.parse({
        id: data.id,
        org_id: data.org_id,
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        title: data.title,
        avatar_url: data.avatar_url,
        tags: data.tags,
        metadata: {
          ...data.metadata,
          interaction_count: data.interactions?.[0]?.count || 0,
          signal_count: data.signals?.[0]?.count || 0,
        },
        propensity_score: data.propensity_score,
        last_interaction_at: data.last_interaction_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      const duration = span.finish();
      PerformanceMonitor.record('relationship.get', duration, {
        orgId: this.context.orgId,
        relationshipId: validatedParams.id,
      });

      this.logger.info('Relationship retrieved successfully', {
        relationshipId: validatedParams.id,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        data: relationship,
        meta: {
          request_id: this.context.requestId,
          timestamp: new Date().toISOString(),
          org_id: this.context.orgId,
        },
      };

    } catch (error) {
      const duration = span.finish();
      PerformanceMonitor.record('relationship.get.error', duration, {
        orgId: this.context.orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span.log('error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.logger.error('Get relationship failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        relationshipId: params.id,
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      await clearOrgContext();
    }
  }

  async listRelationships(params: RelationshipListParams = {}): Promise<PaginatedResponse<RelationshipResponse>> {
    const span = tracer.startSpan('relationship.list');
    const startTime = performance.now();

    try {
      // Validate input
      const validatedParams = RelationshipListParamsSchema.parse(params);
      
      span.setTags({
        'org.id': this.context.orgId,
        'operation': 'relationship.list',
        'limit': validatedParams.limit,
        'has_cursor': !!validatedParams.cursor,
        'has_search': !!validatedParams.search,
      });

      this.logger.info('Listing relationships', {
        operation: 'relationship.list',
        limit: validatedParams.limit,
        cursor: validatedParams.cursor,
        search: validatedParams.search,
      });

      // Set org context for RLS
      await setOrgContext(this.context.orgId);

      // Build query
      let query = supabase
        .from('relationships')
        .select(`
          *,
          interactions:interactions(count),
          signals:signals(count)
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
      if (validatedParams.type) {
        query = query.eq('type', validatedParams.type);
      }

      if (validatedParams.tags && validatedParams.tags.length > 0) {
        query = query.overlaps('tags', validatedParams.tags);
      }

      if (validatedParams.min_propensity !== undefined) {
        query = query.gte('propensity_score', validatedParams.min_propensity);
      }

      // Apply ordering and limit
      query = query
        .order('updated_at', { ascending: false })
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
      const relationships = data.slice(0, validatedParams.limit);
      const nextCursor = hasMore ? relationships[relationships.length - 1]?.id : null;

      // Transform and validate response
      const validatedRelationships = relationships.map(item => 
        RelationshipResponseSchema.parse({
          id: item.id,
          org_id: item.org_id,
          type: item.type,
          name: item.name,
          email: item.email,
          phone: item.phone,
          company: item.company,
          title: item.title,
          avatar_url: item.avatar_url,
          tags: item.tags,
          metadata: {
            ...item.metadata,
            interaction_count: item.interactions?.[0]?.count || 0,
            signal_count: item.signals?.[0]?.count || 0,
          },
          propensity_score: item.propensity_score,
          last_interaction_at: item.last_interaction_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
        })
      );

      const duration = span.finish();
      PerformanceMonitor.record('relationship.list', duration, {
        orgId: this.context.orgId,
        resultCount: validatedRelationships.length,
        hasSearch: !!validatedParams.search,
      });

      this.logger.info('Relationships listed successfully', {
        count: validatedRelationships.length,
        totalCount: count,
        hasMore,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        data: validatedRelationships,
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
      PerformanceMonitor.record('relationship.list.error', duration, {
        orgId: this.context.orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span.log('error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.logger.error('List relationships failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      await clearOrgContext();
    }
  }
}