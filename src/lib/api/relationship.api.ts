import { RelationshipService } from '../services/relationship.service';
import { 
  RelationshipGetParams, 
  RelationshipListParams,
  RelationshipResponse,
  APISuccess,
  PaginatedResponse
} from '../validation/schemas';
import { v4 as uuidv4 } from 'uuid';
import type { RequestContext } from '../database/client';

// Mock org context for demo - in production this would come from auth
const DEMO_ORG_ID = 'org-1';

export class RelationshipAPI {
  private createContext(): RequestContext {
    return {
      orgId: DEMO_ORG_ID,
      userId: 'user-1', // Would come from auth
      requestId: uuidv4(),
      userAgent: navigator.userAgent,
    };
  }

  async getRelationship(id: string): Promise<APISuccess<RelationshipResponse>> {
    const context = this.createContext();
    const service = new RelationshipService(context);
    
    return service.getRelationship({ id });
  }

  async listRelationships(params: RelationshipListParams = {}): Promise<PaginatedResponse<RelationshipResponse>> {
    const context = this.createContext();
    const service = new RelationshipService(context);
    
    return service.listRelationships(params);
  }
}

// Export singleton instance
export const relationshipAPI = new RelationshipAPI();