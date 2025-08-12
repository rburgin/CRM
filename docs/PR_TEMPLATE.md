### What & Why
Implementing relationship.get vertical slice as the foundational pattern for all future endpoints. This establishes our data model, org scoping, performance budget, and observability patterns.

### Read-back (bullets)
- Purpose/vision: Build the Google of CRMs—fast, useful, one-view with AI-first guidance
- Objects touched: Relationship (core entity), Organization (tenant boundary), Interaction/Signal (activity context)
- Boundaries & data: orgId scoping enforced via RLS, Event log for audit trail, Zod validation at API boundary
- Perf budget: p95 < 100ms for single relationship fetch, cursor pagination for lists, Redis caching layer
- AI surface: Propensity scoring, relationship insights, next best actions with explanations
- Risks/unknowns: Database performance under load, AI model latency, cache invalidation strategy

### Architecture Adherence Note
- Sections touched: [x] Relationship Canvas [x] Data model [x] API [x] AI [x] Security [x] Observability
- Contracts: [x] Zod [x] Types OK [x] OpenAPI (if public)
- Multitenancy/RLS: [x] Covered + tests
- Perf budget: p95 target = 100ms, measured by OpenTelemetry spans
- Observability: [x] spans [x] logs (requestId, orgId)
- Security/PII: [x] masked [x] none
- Migration & rollback: Schema versioning with backward compatibility
- Tests: [x] unit [x] integration (DB) [x] contract [x] e2e (if critical)

### Screenshots/Logs
Performance metrics and test coverage screenshots included below.

### Rollout plan / Flags
Feature flag: `relationship_api_v2` for gradual rollout