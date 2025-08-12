-- Vara CRM Database Schema
-- Following AI-First Architecture patterns

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Organizations (tenant boundary)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Relationships (core entity)
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  propensity_score DECIMAL(3,2) DEFAULT 0.0 CHECK (propensity_score >= 0 AND propensity_score <= 1),
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(name, '') || ' ' || 
      COALESCE(email, '') || ' ' || 
      COALESCE(company, '') || ' ' ||
      COALESCE(title, '')
    )
  ) STORED
);

-- Enable RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Interactions (activity tracking)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'task')),
  subject TEXT NOT NULL,
  content TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Signals (behavioral data)
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  strength TEXT NOT NULL CHECK (strength IN ('weak', 'medium', 'strong')),
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Event log (audit trail)
CREATE TABLE IF NOT EXISTS event_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_org_id ON relationships(org_id);
CREATE INDEX IF NOT EXISTS idx_relationships_search ON relationships USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_relationships_propensity ON relationships(org_id, propensity_score DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_updated ON relationships(org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_relationship ON interactions(relationship_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_relationship ON signals(relationship_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_entity ON event_log(org_id, entity_type, entity_id, timestamp DESC);

-- RLS Policies
CREATE POLICY "Organizations are isolated by org_id" ON organizations
  FOR ALL USING (id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Relationships are isolated by org_id" ON relationships
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Interactions are isolated by org_id" ON interactions
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Signals are isolated by org_id" ON signals
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Event log is isolated by org_id" ON event_log
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();