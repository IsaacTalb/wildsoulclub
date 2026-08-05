CREATE TABLE IF NOT EXISTS public.delivery_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  township text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.delivery_addresses(user_id);

CREATE OR REPLACE FUNCTION public.admin_people_report()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH order_totals AS (
    SELECT o.user_id,
      count(*)::bigint AS order_count,
      count(*) FILTER (WHERE o.payment_status = 'approved' AND o.status <> 'cancelled')::bigint AS paid_order_count,
      COALESCE(sum(o.total) FILTER (WHERE o.payment_status = 'approved' AND o.status <> 'cancelled'), 0) AS paid_total,
      max(o.created_at) AS last_order_at
    FROM orders o
    WHERE o.user_id IS NOT NULL
    GROUP BY o.user_id
  ), address_details AS (
    SELECT da.user_id,
      count(*)::bigint AS address_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', da.id, 'full_name', da.full_name, 'phone', da.phone,
            'address', da.address, 'township', da.township, 'city', da.city,
            'state', da.state, 'zip', da.zip, 'is_default', da.is_default
          ) ORDER BY da.is_default DESC, da.created_at DESC
        ),
        '[]'::jsonb
      ) AS addresses
    FROM delivery_addresses da
    GROUP BY da.user_id
  ), people AS (
    SELECT u.id, u.full_name, u.email, u.phone, u.created_at,
      COALESCE(ot.order_count, 0) AS order_count,
      COALESCE(ot.paid_order_count, 0) AS paid_order_count,
      COALESCE(ot.paid_total, 0) AS paid_total,
      ot.last_order_at,
      COALESCE(ad.address_count, 0) AS address_count,
      COALESCE(ad.addresses, '[]'::jsonb) AS addresses
    FROM users u
    LEFT JOIN order_totals ot ON ot.user_id = u.id
    LEFT JOIN address_details ad ON ad.user_id = u.id
  )
  SELECT jsonb_build_object(
    'users', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM people p), '[]'::jsonb),
    'customers', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.last_order_at DESC NULLS LAST, p.created_at DESC) FROM people p WHERE p.order_count > 0 OR p.address_count > 0), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_people_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_people_report() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_people_report() TO service_role;
