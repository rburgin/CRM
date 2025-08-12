import { IntentService } from '../services/intent.service';
import { 
  IntentGetParams, 
  IntentListParams,
  IntentResponse,
  PipelineAnalytics,
  APISuccess,
  PaginatedResponse
} from '../validation/intent-schemas';
import { v4 as uuidv4 } from 'uuid';
import type { RequestContext } from '../database/client';

// Mock org context for demo - in production this would come from auth
const DEMO_ORG_ID = 'org-1';

export class IntentAPI {
  private createContext(): RequestContext {
    return {
      orgId: DEMO_ORG_ID,
      userId: 'user-1', // Would come from auth
      requestId: uuidv4(),
      userAgent: navigator.userAgent,
    };
  }

  async getIntent(id: string, options: Omit<IntentGetParams, 'id'> = {}): Promise<APISuccess<IntentResponse>> {
    const context = this.createContext();
    const service = new IntentService(context);
    
    return service.getIntent({ id, ...options });
  }

  async listIntents(params: IntentListParams = {}): Promise<PaginatedResponse<IntentResponse>> {
    const context = this.createContext();
    const service = new IntentService(context);
    
    return service.listIntents(params);
  }

  async getPipelineAnalytics(): Promise<APISuccess<PipelineAnalytics>> {
    const context = this.createContext();
    const service = new IntentService(context);
    
    return service.getPipelineAnalytics();
  }
}

// Export singleton instance
export const intentAPI = new IntentAPI();