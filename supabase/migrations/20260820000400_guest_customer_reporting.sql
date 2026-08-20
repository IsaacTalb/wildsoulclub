-- Include guest purchasers in admin customer reporting without creating account records.
-- Guest identities use the checkout email and phone after store-appropriate normalization.
CREATE OR REPLACE FUNCTION public.admin_people_report()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH registered_order_totals AS (
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
  ), registered_people AS (
    SELECT u.id, u.full_name, u.email, u.phone, u.created_at,
      COALESCE(ot.order_count, 0) AS order_count,
      COALESCE(ot.paid_order_count, 0) AS paid_order_count,
      COALESCE(ot.paid_total, 0) AS paid_total,
      ot.last_order_at,
      COALESCE(ad.address_count, 0) AS address_count,
      COALESCE(ad.addresses, '[]'::jsonb) AS addresses,
      false AS is_guest
    FROM users u
    LEFT JOIN registered_order_totals ot ON ot.user_id = u.id
    LEFT JOIN address_details ad ON ad.user_id = u.id
  ), normalized_guest_orders AS (
    SELECT o.*,
      lower(btrim(COALESCE(o.email, ''))) AS normalized_email,
      regexp_replace(COALESCE(o.phone, ''), '[^0-9]+', '', 'g') AS normalized_phone
    FROM orders o
    WHERE o.user_id IS NULL
  ), guest_people AS (
    SELECT
      md5('guest:' || normalized_email || E'\n' || normalized_phone)::uuid AS id,
      (array_agg(NULLIF(btrim(full_name), '') ORDER BY created_at DESC, id DESC))[1] AS full_name,
      (array_agg(NULLIF(btrim(email), '') ORDER BY created_at DESC, id DESC))[1] AS email,
      (array_agg(NULLIF(btrim(phone), '') ORDER BY created_at DESC, id DESC))[1] AS phone,
      min(created_at) AS created_at,
      count(*)::bigint AS order_count,
      count(*) FILTER (WHERE payment_status = 'approved' AND status <> 'cancelled')::bigint AS paid_order_count,
      COALESCE(sum(total) FILTER (WHERE payment_status = 'approved' AND status <> 'cancelled'), 0) AS paid_total,
      max(created_at) AS last_order_at,
      0::bigint AS address_count,
      '[]'::jsonb AS addresses,
      true AS is_guest
    FROM normalized_guest_orders
    GROUP BY normalized_email, normalized_phone
  ), customers AS (
    SELECT * FROM registered_people WHERE order_count > 0 OR address_count > 0
    UNION ALL
    SELECT * FROM guest_people
  )
  SELECT jsonb_build_object(
    'users', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM registered_people p), '[]'::jsonb),
    'customers', COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.last_order_at DESC NULLS LAST, c.created_at DESC) FROM customers c), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_people_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_people_report() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_people_report() TO service_role;

COMMENT ON FUNCTION public.admin_people_report() IS
  'Admin-only account and customer report. Customers include registered users with orders or saved addresses and guest orders grouped by normalized email and phone.';
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
      (SELECT count(*) FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id) OR EXISTS (SELECT 1 FROM delivery_addresses da WHERE da.user_id = u.id))
        + (SELECT count(*) FROM (SELECT lower(btrim(COALESCE(o.email, ''))), regexp_replace(COALESCE(o.phone, ''), '[^0-9]+', '', 'g') FROM orders o WHERE o.user_id IS NULL GROUP BY 1, 2) guests) AS customers,
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
