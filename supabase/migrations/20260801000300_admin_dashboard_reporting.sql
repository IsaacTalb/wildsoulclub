-- Dashboard reporting uses Myanmar Time for calendar-day and calendar-month boundaries.
-- Revenue/sales include approved payments whose orders have not been cancelled.
-- Units sold use the same rule, so rejected, expired, pending, and cancelled orders do not count.

-- The trigger mirrors future auth changes. Backfill first so auth users created before the
-- trigger was installed are also represented in public.users.
INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.email, au.id::text || '@missing-email.invalid'),
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(au.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(au.email, ''), '@', 1),
    'User'
  ),
  au.raw_user_meta_data->>'avatar_url',
  au.created_at,
  now()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.admin_dashboard_report(
  p_timezone text DEFAULT 'Asia/Yangon'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := now();
  v_today_start timestamptz;
  v_tomorrow_start timestamptz;
  v_month_start timestamptz;
  v_months_start timestamptz;
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    RAISE EXCEPTION 'Unknown reporting timezone: %', p_timezone;
  END IF;

  v_today_start := date_trunc('day', v_now AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  v_tomorrow_start := v_today_start + interval '1 day';
  v_month_start := date_trunc('month', v_now AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  v_months_start := (date_trunc('month', v_now AT TIME ZONE p_timezone) - interval '5 months') AT TIME ZONE p_timezone;

  WITH
  counting_orders AS (
    SELECT * FROM orders
    WHERE payment_status = 'approved' AND status <> 'cancelled'
  ),
  stats AS (
    SELECT
      COALESCE((SELECT sum(total) FROM counting_orders), 0) AS revenue,
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM products WHERE deleted_at IS NULL) AS products,
      (SELECT count(*) FROM users) AS customers,
      (SELECT count(*) FROM payments WHERE status = 'pending') AS pending_payments,
      COALESCE((SELECT sum(total) FROM counting_orders WHERE created_at >= v_today_start AND created_at < v_tomorrow_start), 0) AS today_sales
  ),
  month_series AS (
    SELECT generate_series(v_months_start, v_month_start, interval '1 month') AS month_start
  ),
  monthly AS (
    SELECT
      ms.month_start,
      COALESCE(sum(o.total), 0) AS revenue,
      count(o.id) AS orders
    FROM month_series ms
    LEFT JOIN counting_orders o
      ON o.created_at >= ms.month_start AND o.created_at < ms.month_start + interval '1 month'
    GROUP BY ms.month_start
    ORDER BY ms.month_start
  ),
  recent AS (
    SELECT
      o.id, o.order_number, o.total, o.status, o.payment_status, o.created_at,
      COALESCE(u.full_name, o.full_name) AS customer_name,
      COALESCE(u.email, o.email) AS customer_email,
      (u.id IS NULL) AS is_guest,
      COALESCE(sum(oi.quantity), 0) AS item_count
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id, u.id, u.full_name, u.email
    ORDER BY o.created_at DESC
    LIMIT 8
  ),
  sold AS (
    SELECT oi.product_id, oi.variant_id, sum(oi.quantity)::bigint AS units_sold
    FROM order_items oi
    JOIN counting_orders o ON o.id = oi.order_id
    GROUP BY oi.product_id, oi.variant_id
  ),
  top_product_totals AS (
    SELECT product_id, sum(units_sold)::bigint AS units_sold
    FROM sold WHERE product_id IS NOT NULL
    GROUP BY product_id
    ORDER BY units_sold DESC
    LIMIT 8
  ),
  top_products AS (
    SELECT
      p.id, p.name, p.sku, t.units_sold, p.stock AS stock_remaining,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', pv.id, 'sku', pv.sku, 'size', pv.size, 'color', pv.color,
          'unitsSold', COALESCE(s.units_sold, 0), 'stockRemaining', pv.stock
        ) ORDER BY COALESCE(s.units_sold, 0) DESC, pv.id)
        FROM product_variants pv
        LEFT JOIN sold s ON s.variant_id = pv.id
        WHERE pv.product_id = p.id
      ), '[]'::jsonb) AS variants
    FROM top_product_totals t
    JOIN products p ON p.id = t.product_id
    ORDER BY t.units_sold DESC, p.name
  )
  SELECT jsonb_build_object(
    'timezone', p_timezone,
    'generatedAt', v_now,
    'boundaries', jsonb_build_object(
      'todayStart', v_today_start, 'todayEndExclusive', v_tomorrow_start,
      'monthlyStart', v_months_start, 'monthlyEndExclusive', v_month_start + interval '1 month'
    ),
    'stats', (SELECT to_jsonb(stats) FROM stats),
    'monthlySales', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'month', to_char(month_start AT TIME ZONE p_timezone, 'YYYY-MM'),
      'revenue', revenue, 'orders', orders
    ) ORDER BY month_start) FROM monthly), '[]'::jsonb),
    'recentOrders', COALESCE((SELECT jsonb_agg(to_jsonb(recent) ORDER BY created_at DESC) FROM recent), '[]'::jsonb),
    'topProducts', COALESCE((SELECT jsonb_agg(to_jsonb(top_products) ORDER BY units_sold DESC, name) FROM top_products), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_report(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_dashboard_report(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_report(text) TO service_role;

COMMENT ON FUNCTION public.admin_dashboard_report(text) IS
  'Admin-only dashboard report. Paid sales are approved-payment, non-cancelled orders; calendar boundaries use the requested IANA timezone.';

-- After applying this migration, this verification query must return zero rows:
-- SELECT au.id, au.email FROM auth.users au LEFT JOIN public.users u ON u.id = au.id WHERE u.id IS NULL;
