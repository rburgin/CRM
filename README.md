# Vara CRM - AI-First Customer Relationship Management

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **The Google of CRMs** - Fast, useful, one-view with AI-first guidance enabling frictionless transactions and prospecting experiences.

## 🚀 Vision

Vara CRM reimagines customer relationship management with AI-first architecture, delivering sub-second response times and explainable insights that enhance human decision-making rather than replacing it.

### Key Principles
- **Performance First**: p95 < 100ms for core operations
- **AI-Powered**: Every interaction includes confidence-scored insights
- **Multi-tenant**: Enterprise-grade org isolation via RLS
- **Observable**: Comprehensive telemetry and structured logging
- **Production-Ready**: 85%+ test coverage with performance validation

## ✨ Features

### 🎯 Relationship Management
- **Propensity Scoring**: AI-driven conversion likelihood with explanations
- **Interaction Tracking**: Complete communication history and context
- **Smart Insights**: Behavioral analysis and next best actions

### 📊 Intent Pipeline
- **Stage Management**: Discovery → Qualification → Proposal → Negotiation → Closed
- **AI Recommendations**: Contextual next best actions with reasoning
- **Pipeline Analytics**: Forecasting, velocity metrics, and conversion tracking
- **Real-time Updates**: Live pipeline changes with performance monitoring

### 🔍 AI-First Features
- **Explainable AI**: All insights include confidence scores and reasoning
- **Next Best Actions**: Prioritized recommendations with impact estimation
- **Predictive Analytics**: Pipeline forecasting and deal velocity tracking
- **Contextual Insights**: Stage-specific guidance and optimization

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod schemas at all boundaries
- **Testing**: Vitest with comprehensive coverage
- **Observability**: Custom telemetry with performance monitoring

### Performance Targets
- **relationship.get**: p95 < 100ms
- **relationship.list**: p95 < 200ms
- **intent.get**: p95 < 150ms (includes AI processing)
- **intent.list**: p95 < 250ms (with AI enhancements)
- **pipeline.analytics**: p95 < 300ms (complex aggregations)

### Security & Compliance
- **Multi-tenancy**: Row Level Security (RLS) enforcement
- **PII Protection**: Automatic masking in logs and telemetry
- **Audit Trail**: Complete event log for all operations
- **Input Validation**: Zod schemas prevent injection attacks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Modern browser with ES2020 support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vara-crm.git
cd vara-crm
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Database setup**
```bash
# Run migrations (if using Supabase CLI)
supabase db push

# Or manually run SQL files in supabase/migrations/
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🧪 Testing

### Run Tests
```bash
# Unit and integration tests
npm test

# With coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

### Performance Monitoring
```bash
# Check performance targets
npm run perf:monitor
```

### Test Coverage Targets
- **Overall**: 85%+ coverage
- **Services**: 90%+ coverage (business logic)
- **API Layer**: 80%+ coverage
- **Components**: 70%+ coverage

## 📊 Performance Monitoring

The application includes comprehensive performance monitoring:

- **Real-time Metrics**: P95 response times tracked per operation
- **Telemetry**: OpenTelemetry-style spans with detailed timing
- **Error Tracking**: Structured logging with request correlation
- **Performance Budget**: Automated alerts when targets are exceeded

### Monitoring Dashboard
```bash
# View performance stats
npm run perf:monitor

# Example output:
✅ relationship.get
   P95: 67ms (target: 100ms)
   Count: 1,247 | Avg: 45ms | Min: 12ms | Max: 156ms

✅ intent.list
   P95: 189ms (target: 250ms)
   Count: 892 | Avg: 134ms | Min: 67ms | Max: 298ms
```

## 🏢 Multi-tenancy

Vara CRM is built for enterprise multi-tenancy from day one:

- **Organization Isolation**: Complete data separation via RLS
- **Performance**: Sub-second queries even with millions of records
- **Security**: Zero-trust architecture with org-scoped access
- **Scalability**: Horizontal scaling with tenant sharding support

## 🤖 AI Integration

### AI Insights Engine
- **Behavioral Analysis**: User interaction patterns and engagement scoring
- **Predictive Modeling**: Deal closure probability and timeline forecasting
- **Contextual Recommendations**: Stage-specific next best actions
- **Confidence Scoring**: All AI outputs include explainability metrics

### Example AI Output
```typescript
{
  "ai_insights": [
    {
      "type": "behavioral",
      "title": "High Conversion Probability Detected",
      "confidence": 0.92,
      "reasoning": "High probability score combined with early stage indicates accelerated buying process",
      "impact": "high"
    }
  ],
  "next_best_actions": [
    {
      "type": "proposal",
      "title": "Send Proposal",
      "priority": 1,
      "confidence": 0.91,
      "reasoning": "Strong qualification signals suggest buyer is ready to evaluate solutions"
    }
  ]
}
```

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Relationship management with AI insights
- [x] Intent pipeline with stage tracking
- [x] Performance monitoring and observability
- [x] Multi-tenant architecture with RLS

### Phase 2: Intelligence 🚧
- [ ] Advanced AI recommendations
- [ ] Automated workflow triggers
- [ ] Predictive pipeline analytics
- [ ] Integration marketplace

### Phase 3: Scale 📋
- [ ] Mobile applications
- [ ] Advanced reporting and dashboards
- [ ] Enterprise SSO and compliance
- [ ] API ecosystem and webhooks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow our coding standards and architecture patterns
4. Ensure tests pass and coverage targets are met
5. Submit a pull request with detailed description

### Code Standards
- **TypeScript**: Strict mode enabled
- **Testing**: 85%+ coverage required
- **Performance**: Meet p95 targets for all endpoints
- **Architecture**: Follow established patterns from relationship.get slice

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com/) for backend infrastructure
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons provided by [Lucide React](https://lucide.dev/)
- Performance monitoring inspired by OpenTelemetry standards

---

**Built with ❤️ for the future of AI-first CRM**

For questions, support, or feature requests, please [open an issue](https://github.com/yourusername/vara-crm/issues) or contact our team.