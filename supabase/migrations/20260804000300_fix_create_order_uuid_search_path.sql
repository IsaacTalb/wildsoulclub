-- uuid-ossp is installed in Supabase's extensions schema. The create_order
-- security-definer function previously restricted its search path to public, so its
-- unqualified uuid_generate_v4() call failed in production with PostgreSQL 42883.
ALTER FUNCTION create_order(UUID, JSONB, JSONB)
  SET search_path = public, extensions;
