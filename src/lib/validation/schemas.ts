import { z } from 'zod';

// Base schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email().optional();
export const PhoneSchema = z.string().min(1).optional();
export const URLSchema = z.string().url().optional();

// Relationship schemas
export const RelationshipTypeSchema = z.enum(['individual', 'company']);

export const RelationshipCreateSchema = z.object({
  type: RelationshipTypeSchema,
  name: z.string().min(1).max(255),
  email: EmailSchema,
  phone: PhoneSchema,
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  avatar_url: URLSchema,
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.any()).default({}),
});

export const RelationshipUpdateSchema = RelationshipCreateSchema.partial();

export const RelationshipResponseSchema = z.object({
  id: UUIDSchema,
  org_id: UUIDSchema,
  type: RelationshipTypeSchema,
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  title: z.string().nullable(),
  avatar_url: z.string().nullable(),
  tags: z.array(z.string()),
  metadata: z.record(z.any()),
  propensity_score: z.number().min(0).max(1),
  last_interaction_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Query parameter schemas
export const RelationshipGetParamsSchema = z.object({
  id: UUIDSchema,
});

export const RelationshipListParamsSchema = z.object({
  cursor: UUIDSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  type: RelationshipTypeSchema.optional(),
  min_propensity: z.number().min(0).max(1).optional(),
});

// API Response schemas
export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const APISuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      request_id: z.string(),
      timestamp: z.string(),
      org_id: UUIDSchema,
    }),
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      request_id: z.string(),
      timestamp: z.string(),
      org_id: UUIDSchema,
      pagination: z.object({
        cursor: UUIDSchema.nullable(),
        has_more: z.boolean(),
        limit: z.number(),
        total_count: z.number().optional(),
      }),
    }),
  });

// Type exports
export type RelationshipCreate = z.infer<typeof RelationshipCreateSchema>;
export type RelationshipUpdate = z.infer<typeof RelationshipUpdateSchema>;
export type RelationshipResponse = z.infer<typeof RelationshipResponseSchema>;
export type RelationshipGetParams = z.infer<typeof RelationshipGetParamsSchema>;
export type RelationshipListParams = z.infer<typeof RelationshipListParamsSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type APISuccess<T> = {
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
    org_id: string;
  };
};
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    request_id: string;
    timestamp: string;
    org_id: string;
    pagination: {
      cursor: string | null;
      has_more: boolean;
      limit: number;
      total_count?: number;
    };
  };
};