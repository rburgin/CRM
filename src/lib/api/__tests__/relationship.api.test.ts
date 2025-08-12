import { describe, it, expect, beforeEach, vi } from 'vitest';
import { relationshipAPI } from '../relationship.api';

// Mock the service
vi.mock('../relationship.service', () => ({
  RelationshipService: vi.fn().mockImplementation(() => ({
    getRelationship: vi.fn(),
    listRelationships: vi.fn(),
  })),
}));

describe('RelationshipAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRelationship', () => {
    it('should call service with correct parameters', async () => {
      const { RelationshipService } = await import('../relationship.service');
      const mockService = {
        getRelationship: vi.fn().mockResolvedValue({
          data: {
            id: 'test-id',
            name: 'Test User',
          },
          meta: {
            request_id: 'test-request',
            timestamp: '2024-01-01T00:00:00Z',
            org_id: 'org-1',
          },
        }),
      };
      (RelationshipService as any).mockImplementation(() => mockService);

      const result = await relationshipAPI.getRelationship('test-id');

      expect(mockService.getRelationship).toHaveBeenCalledWith({ id: 'test-id' });
      expect(result.data.id).toBe('test-id');
    });
  });

  describe('listRelationships', () => {
    it('should call service with correct parameters', async () => {
      const { RelationshipService } = await import('../relationship.service');
      const mockService = {
        listRelationships: vi.fn().mockResolvedValue({
          data: [],
          meta: {
            request_id: 'test-request',
            timestamp: '2024-01-01T00:00:00Z',
            org_id: 'org-1',
            pagination: {
              cursor: null,
              has_more: false,
              limit: 20,
            },
          },
        }),
      };
      (RelationshipService as any).mockImplementation(() => mockService);

      const params = { limit: 10, search: 'test' };
      const result = await relationshipAPI.listRelationships(params);

      expect(mockService.listRelationships).toHaveBeenCalledWith(params);
      expect(result.data).toEqual([]);
    });
  });
});