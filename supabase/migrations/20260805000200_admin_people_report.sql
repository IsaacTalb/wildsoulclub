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
  ), people AS (
    SELECT u.id, u.full_name, u.email, u.phone, u.created_at,
      COALESCE(ot.order_count, 0) AS order_count,
      COALESCE(ot.paid_order_count, 0) AS paid_order_count,
      COALESCE(ot.paid_total, 0) AS paid_total,
      ot.last_order_at
    FROM users u
    LEFT JOIN order_totals ot ON ot.user_id = u.id
  )
  SELECT jsonb_build_object(
    'users', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM people p), '[]'::jsonb),
    'customers', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.last_order_at DESC) FROM people p WHERE p.order_count > 0), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_people_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_people_report() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_people_report() TO service_role;

-- Count revenue on the local calendar day the payment was approved. Order
-- creation time is intentionally not used because approval can happen later.
CREATE OR REPLACE FUNCTION public.admin_today_paid_sales(
  p_timezone text DEFAULT 'Asia/Yangon'
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today_start timestamptz;
  v_tomorrow_start timestamptz;
  v_total numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    RAISE EXCEPTION 'Unknown reporting timezone: %', p_timezone;
  END IF;
  v_today_start := date_trunc('day', now() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  v_tomorrow_start := v_today_start + interval '1 day';

  SELECT COALESCE(sum(o.total), 0) INTO v_total
  FROM orders o
  WHERE o.payment_status = 'approved'
    AND o.status <> 'cancelled'
    AND EXISTS (
      SELECT 1 FROM payments p
      WHERE p.order_id = o.id
        AND p.status = 'approved'
        AND p.updated_at >= v_today_start
        AND p.updated_at < v_tomorrow_start
    );
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_today_paid_sales(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_today_paid_sales(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_today_paid_sales(text) TO service_role;
