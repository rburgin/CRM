import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IntentService } from '../intent.service';
import { PerformanceMonitor } from '../../observability/telemetry';
import type { RequestContext } from '../../database/client';

// Mock Supabase
vi.mock('../../database/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        gt: vi.fn(() => ({
          textSearch: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(),
                  })),
                })),
              })),
            })),
          })),
        })),
        neq: vi.fn(() => ({
          select: vi.fn(),
        })),
        in: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
  setOrgContext: vi.fn(),
  clearOrgContext: vi.fn(),
}));

describe('IntentService', () => {
  let service: IntentService;
  let mockContext: RequestContext;

  beforeEach(() => {
    mockContext = {
      orgId: 'test-org-id',
      userId: 'test-user-id',
      requestId: 'test-request-id',
    };
    service = new IntentService(mockContext);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getIntent', () => {
    it('should validate input parameters', async () => {
      const invalidParams = { id: 'invalid-uuid' };
      
      await expect(service.getIntent(invalidParams as any))
        .rejects.toThrow();
    });

    it('should return intent data with AI insights and next best actions', async () => {
      const mockIntent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        relationship_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Enterprise CRM Implementation',
        description: 'Full CRM rollout for 500+ users',
        value: 150000,
        currency: 'USD',
        stage: 'qualification',
        priority: 'high',
        expected_close_date: '2024-03-15',
        probability: 0.75,
        ai_insights: [],
        next_best_actions: [],
        metadata: {},
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        relationships: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Corp',
          propensity_score: 0.85,
        },
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockIntent, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await service.getIntent({
        id: '123e4567-e89b-12d3-a456-426614174000',
        include_relationship: true,
      });

      expect(result.data).toMatchObject({
        id: mockIntent.id,
        title: mockIntent.title,
        value: mockIntent.value,
        stage: mockIntent.stage,
        probability: mockIntent.probability,
      });
      expect(result.data.ai_insights).toBeDefined();
      expect(result.data.next_best_actions).toBeDefined();
      expect(result.data.relationship).toBeDefined();
      expect(result.meta.request_id).toBe(mockContext.requestId);
      expect(result.meta.org_id).toBe(mockContext.orgId);
    });

    it('should generate appropriate AI insights based on intent data', async () => {
      const mockIntent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        relationship_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'High Probability Deal',
        description: 'Deal with strong buying signals',
        value: 75000,
        currency: 'USD',
        stage: 'qualification',
        priority: 'high',
        expected_close_date: '2024-02-01',
        probability: 0.85, // High probability should trigger insights
        ai_insights: [],
        next_best_actions: [],
        metadata: {},
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        relationships: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'High Value Corp',
          propensity_score: 0.90,
        },
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockIntent, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await service.getIntent({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Should generate AI insight for high probability in qualification stage
      expect(result.data.ai_insights.length).toBeGreaterThan(0);
      const highProbabilityInsight = result.data.ai_insights.find(
        insight => insight.title.includes('High Conversion Probability')
      );
      expect(highProbabilityInsight).toBeDefined();
      expect(highProbabilityInsight?.confidence).toBeGreaterThan(0.8);
    });

    it('should generate stage-appropriate next best actions', async () => {
      const mockIntent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        relationship_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Qualified Opportunity',
        description: 'Ready for proposal',
        value: 50000,
        currency: 'USD',
        stage: 'qualification',
        priority: 'medium',
        expected_close_date: '2024-03-01',
        probability: 0.75, // High enough to suggest proposal
        ai_insights: [],
        next_best_actions: [],
        metadata: {},
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        relationships: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          company: 'Ready Corp',
          propensity_score: 0.80,
        },
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockIntent, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await service.getIntent({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Should suggest sending proposal for qualified high-probability intent
      expect(result.data.next_best_actions.length).toBeGreaterThan(0);
      const proposalAction = result.data.next_best_actions.find(
        action => action.type === 'proposal'
      );
      expect(proposalAction).toBeDefined();
      expect(proposalAction?.priority).toBe(1); // High priority
      expect(proposalAction?.confidence).toBeGreaterThan(0.8);
    });

    it('should record performance metrics', async () => {
      const recordSpy = vi.spyOn(PerformanceMonitor, 'record');
      
      const mockIntent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        relationship_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Intent',
        description: null,
        value: 25000,
        currency: 'USD',
        stage: 'discovery',
        priority: 'low',
        expected_close_date: null,
        probability: 0.3,
        ai_insights: [],
        next_best_actions: [],
        metadata: {},
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        relationships: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Test User',
          email: 'test@example.com',
          company: 'Test Corp',
          propensity_score: 0.5,
        },
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockIntent, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      await service.getIntent({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(recordSpy).toHaveBeenCalledWith(
        'intent.get',
        expect.any(Number),
        expect.objectContaining({
          orgId: mockContext.orgId,
          intentId: '123e4567-e89b-12d3-a456-426614174000',
        })
      );
    });
  });

  describe('listIntents', () => {
    it('should return paginated results with AI enhancements', async () => {
      const mockIntents = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          org_id: 'test-org-id',
          relationship_id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Test Intent 1',
          description: 'First test intent',
          value: 50000,
          currency: 'USD',
          stage: 'qualification',
          priority: 'high',
          expected_close_date: '2024-03-01',
          probability: 0.8,
          ai_insights: [],
          next_best_actions: [],
          metadata: {},
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          relationships: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'John Doe',
            email: 'john@example.com',
            company: 'Test Corp',
            propensity_score: 0.85,
          },
        },
      ];

      const { supabase } = await import('../../database/client');
      const mockLimit = vi.fn().mockResolvedValue({ 
        data: mockIntents, 
        error: null, 
        count: 1 
      });
      const mockOrder = {
        limit: mockLimit,
      };
      const mockLte = {
        order: vi.fn().mockReturnValue(mockOrder),
      };
      const mockGte = {
        lte: vi.fn().mockReturnValue(mockLte),
      };
      const mockEq = {
        gte: vi.fn().mockReturnValue(mockGte),
      };
      const mockTextSearch = {
        eq: vi.fn().mockReturnValue(mockEq),
      };
      const mockGt = {
        textSearch: vi.fn().mockReturnValue(mockTextSearch),
      };
      const mockSelect = {
        gt: vi.fn().mockReturnValue(mockGt),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await service.listIntents({ limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockIntents[0].id,
        title: mockIntents[0].title,
        stage: mockIntents[0].stage,
        value: mockIntents[0].value,
      });
      expect(result.data[0].ai_insights).toBeDefined();
      expect(result.data[0].next_best_actions).toBeDefined();
      expect(result.data[0].relationship).toBeDefined();
      expect(result.meta.pagination).toMatchObject({
        cursor: null,
        has_more: false,
        limit: 20,
        total_count: 1,
      });
    });

    it('should handle complex filtering', async () => {
      const { supabase } = await import('../../database/client');
      const mockLimit = vi.fn().mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });
      const mockOrder = {
        limit: mockLimit,
      };
      const mockLte = {
        order: vi.fn().mockReturnValue(mockOrder),
      };
      const mockGte = {
        lte: vi.fn().mockReturnValue(mockLte),
      };
      const mockEq = {
        gte: vi.fn().mockReturnValue(mockGte),
      };
      const mockTextSearch = {
        eq: vi.fn().mockReturnValue(mockEq),
      };
      const mockGt = {
        textSearch: vi.fn().mockReturnValue(mockTextSearch),
      };
      const mockSelect = {
        gt: vi.fn().mockReturnValue(mockGt),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      await service.listIntents({ 
        search: 'enterprise',
        stage: 'qualification',
        priority: 'high',
        min_value: 10000,
        max_value: 100000,
        min_probability: 0.7,
        expected_close_before: '2024-06-01',
        sort_by: 'value',
        sort_order: 'desc',
      });

      expect(mockTextSearch.eq).toHaveBeenCalledWith('stage', 'qualification');
      expect(mockEq.gte).toHaveBeenCalledWith('value', 10000);
      expect(mockGte.lte).toHaveBeenCalledWith('value', 100000);
      expect(mockLte.order).toHaveBeenCalledWith('value', { ascending: false });
    });
  });

  describe('getPipelineAnalytics', () => {
    it('should return comprehensive pipeline analytics', async () => {
      const mockPipelineData = [
        {
          stage: 'qualification',
          value: 50000,
          probability: 0.8,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          expected_close_date: '2024-03-01',
        },
        {
          stage: 'proposal',
          value: 75000,
          probability: 0.6,
          created_at: '2024-01-05T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
          expected_close_date: '2024-02-15',
        },
      ];

      const mockClosedData = [
        { stage: 'closed-won' },
        { stage: 'closed-won' },
        { stage: 'closed-lost' },
      ];

      const { supabase } = await import('../../database/client');
      
      // Mock the pipeline data query
      const mockNeqSelect = vi.fn().mockResolvedValue({ 
        data: mockPipelineData, 
        error: null 
      });
      const mockNeq = {
        select: mockNeqSelect,
      };
      
      // Mock the closed deals query
      const mockInSelect = vi.fn().mockResolvedValue({ 
        data: mockClosedData, 
        error: null 
      });
      const mockIn = {
        select: mockInSelect,
      };

      (supabase.from as any)
        .mockReturnValueOnce({ neq: vi.fn().mockReturnValue(mockNeq) })
        .mockReturnValueOnce({ in: vi.fn().mockReturnValue(mockIn) });

      const result = await service.getPipelineAnalytics();

      expect(result.data).toMatchObject({
        total_intents: 2,
        total_pipeline_value: 125000,
        weighted_pipeline_value: expect.any(Number),
        avg_deal_size: 62500,
        overall_conversion_rate: expect.any(Number),
      });
      expect(result.data.stage_metrics).toBeDefined();
      expect(result.data.velocity_metrics).toBeDefined();
      expect(result.data.forecasting).toBeDefined();
      expect(result.meta.request_id).toBe(mockContext.requestId);
    });
  });
});