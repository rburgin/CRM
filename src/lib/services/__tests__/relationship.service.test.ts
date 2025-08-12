import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RelationshipService } from '../relationship.service';
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
              overlaps: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
  setOrgContext: vi.fn(),
  clearOrgContext: vi.fn(),
}));

describe('RelationshipService', () => {
  let service: RelationshipService;
  let mockContext: RequestContext;

  beforeEach(() => {
    mockContext = {
      orgId: 'test-org-id',
      userId: 'test-user-id',
      requestId: 'test-request-id',
    };
    service = new RelationshipService(mockContext);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRelationship', () => {
    it('should validate input parameters', async () => {
      const invalidParams = { id: 'invalid-uuid' };
      
      await expect(service.getRelationship(invalidParams as any))
        .rejects.toThrow();
    });

    it('should return relationship data with proper structure', async () => {
      const mockRelationship = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        type: 'individual',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Test Corp',
        title: 'CEO',
        avatar_url: null,
        tags: ['vip', 'enterprise'],
        metadata: {},
        propensity_score: 0.85,
        last_interaction_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        interactions: [{ count: 5 }],
        signals: [{ count: 3 }],
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockRelationship, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      const result = await service.getRelationship({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.data).toMatchObject({
        id: mockRelationship.id,
        name: mockRelationship.name,
        email: mockRelationship.email,
        propensity_score: mockRelationship.propensity_score,
      });
      expect(result.meta.request_id).toBe(mockContext.requestId);
      expect(result.meta.org_id).toBe(mockContext.orgId);
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed', code: 'DB_ERROR' } 
        }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      await expect(service.getRelationship({
        id: '123e4567-e89b-12d3-a456-426614174000',
      })).rejects.toThrow('Database query failed');
    });

    it('should record performance metrics', async () => {
      const recordSpy = vi.spyOn(PerformanceMonitor, 'record');
      
      const mockRelationship = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 'test-org-id',
        type: 'individual',
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        company: null,
        title: null,
        avatar_url: null,
        tags: [],
        metadata: {},
        propensity_score: 0.5,
        last_interaction_at: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        interactions: [{ count: 0 }],
        signals: [{ count: 0 }],
      };

      const { supabase } = await import('../../database/client');
      const mockQuery = {
        single: vi.fn().mockResolvedValue({ data: mockRelationship, error: null }),
      };
      const mockSelect = {
        eq: vi.fn().mockReturnValue(mockQuery),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelect),
      });

      await service.getRelationship({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(recordSpy).toHaveBeenCalledWith(
        'relationship.get',
        expect.any(Number),
        expect.objectContaining({
          orgId: mockContext.orgId,
          relationshipId: '123e4567-e89b-12d3-a456-426614174000',
        })
      );
    });
  });

  describe('listRelationships', () => {
    it('should return paginated results with proper structure', async () => {
      const mockRelationships = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          org_id: 'test-org-id',
          type: 'individual',
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          company: null,
          title: null,
          avatar_url: null,
          tags: [],
          metadata: {},
          propensity_score: 0.5,
          last_interaction_at: null,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          interactions: [{ count: 0 }],
          signals: [{ count: 0 }],
        },
      ];

      const { supabase } = await import('../../database/client');
      const mockLimit = vi.fn().mockResolvedValue({ 
        data: mockRelationships, 
        error: null, 
        count: 1 
      });
      const mockOrder = {
        limit: mockLimit,
      };
      const mockGte = {
        order: vi.fn().mockReturnValue(mockOrder),
      };
      const mockOverlaps = {
        gte: vi.fn().mockReturnValue(mockGte),
      };
      const mockEq = {
        overlaps: vi.fn().mockReturnValue(mockOverlaps),
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

      const result = await service.listRelationships({ limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockRelationships[0].id,
        name: mockRelationships[0].name,
      });
      expect(result.meta.pagination).toMatchObject({
        cursor: null,
        has_more: false,
        limit: 20,
        total_count: 1,
      });
    });

    it('should handle search parameters', async () => {
      const { supabase } = await import('../../database/client');
      const mockLimit = vi.fn().mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });
      const mockOrder = {
        limit: mockLimit,
      };
      const mockGte = {
        order: vi.fn().mockReturnValue(mockOrder),
      };
      const mockOverlaps = {
        gte: vi.fn().mockReturnValue(mockGte),
      };
      const mockEq = {
        overlaps: vi.fn().mockReturnValue(mockOverlaps),
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

      await service.listRelationships({ 
        search: 'john doe',
        type: 'individual',
        tags: ['vip'],
        min_propensity: 0.8,
      });

      expect(mockTextSearch.eq).toHaveBeenCalledWith('type', 'individual');
      expect(mockOverlaps.gte).toHaveBeenCalledWith('propensity_score', 0.8);
    });
  });
});