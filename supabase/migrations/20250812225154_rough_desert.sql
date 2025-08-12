/*
  # Intent Pipeline Schema

  1. New Tables
    - `intents`
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key to organizations)
      - `relationship_id` (uuid, foreign key to relationships)
      - `title` (text, intent name/description)
      - `description` (text, optional detailed description)
      - `value` (decimal, monetary value)
      - `currency` (text, currency code)
      - `stage` (enum, pipeline stage)
      - `priority` (enum, urgency level)
      - `expected_close_date` (date, optional)
      - `probability` (decimal, 0-1 conversion likelihood)
      - `ai_insights` (jsonb, AI-generated insights array)
      - `next_best_actions` (jsonb, AI-suggested actions)
      - `metadata` (jsonb, flexible additional data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `intents` table
    - Add policies for org-scoped access
    - Audit trail integration

  3. Performance
    - Indexes for common queries
    - Search optimization
    - Pipeline analytics support
*/

-- Intent stages enum
CREATE TYPE intent_stage AS ENUM (
  'discovery',
  'qualification', 
  'proposal',
  'negotiation',
  'closed-won',
  'closed-lost'
);

-- Intent priority enum
CREATE TYPE intent_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Intents table
CREATE TABLE IF NOT EXISTS intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
  description TEXT,
  value DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  stage intent_stage NOT NULL DEFAULT 'discovery',
  priority intent_priority NOT NULL DEFAULT 'medium',
  expected_close_date DATE,
  probability DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (probability >= 0 AND probability <= 1),
  ai_insights JSONB DEFAULT '[]'::jsonb,
  next_best_actions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(title, '') || ' ' || 
      COALESCE(description, '')
    )
  ) STORED
);

-- Enable RLS
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intents_org_id ON intents(org_id);
CREATE INDEX IF NOT EXISTS idx_intents_relationship_id ON intents(relationship_id);
CREATE INDEX IF NOT EXISTS idx_intents_stage ON intents(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_intents_priority ON intents(org_id, priority);
CREATE INDEX IF NOT EXISTS idx_intents_expected_close ON intents(org_id, expected_close_date) WHERE expected_close_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intents_value ON intents(org_id, value DESC);
CREATE INDEX IF NOT EXISTS idx_intents_probability ON intents(org_id, probability DESC);
CREATE INDEX IF NOT EXISTS idx_intents_search ON intents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_intents_updated ON intents(org_id, updated_at DESC);

-- RLS Policies
CREATE POLICY "Intents are isolated by org_id" ON intents
  FOR ALL USING (org_id = current_setting('app.current_org_id')::UUID);

-- Updated_at trigger
CREATE TRIGGER update_intents_updated_at BEFORE UPDATE ON intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Intent stage transition validation function
CREATE OR REPLACE FUNCTION validate_intent_stage_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any transition for now, but log it
  INSERT INTO event_log (org_id, entity_type, entity_id, event_type, data)
  VALUES (
    NEW.org_id,
    'intent',
    NEW.id,
    'stage_transition',
    jsonb_build_object(
      'from_stage', OLD.stage,
      'to_stage', NEW.stage,
      'probability_change', NEW.probability - OLD.probability
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stage transition trigger
CREATE TRIGGER intent_stage_transition_trigger
  AFTER UPDATE OF stage ON intents
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION validate_intent_stage_transition();