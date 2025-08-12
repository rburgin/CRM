/*
  # Create set_config function for RLS context

  1. New Functions
    - `set_config` - PostgreSQL function to set session variables for RLS
      - Used to set organization context for multi-tenant isolation
      - Supports both local (transaction-scoped) and global session variables

  2. Security
    - Function is accessible to authenticated users
    - Required for proper Row Level Security enforcement
*/

CREATE OR REPLACE FUNCTION public.set_config(
    setting_name text,
    setting_value text,
    is_local boolean DEFAULT true
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate setting name to prevent SQL injection
    IF setting_name !~ '^[a-zA-Z][a-zA-Z0-9_\.]*$' THEN
        RAISE EXCEPTION 'Invalid setting name: %', setting_name;
    END IF;
    
    -- Set the configuration variable
    IF is_local THEN
        EXECUTE format('SET LOCAL %I = %L', setting_name, setting_value);
    ELSE
        EXECUTE format('SET %I = %L', setting_name, setting_value);
    END IF;
    
    RETURN setting_value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO anon;