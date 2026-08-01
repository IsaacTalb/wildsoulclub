# Admin dashboard reporting

The dashboard is served by `GET /api/admin/dashboard`. The route verifies the bearer token and the matching `admins` row before its service-role client invokes `admin_dashboard_report`; the database function is not executable by anonymous or ordinary authenticated roles.

## Sales rules and calendar boundaries

- **Revenue, today's paid sales, monthly sales, and units sold** count an order only when `payment_status = 'approved'` and the fulfillment `status` is not `cancelled`.
- **Pending payments** counts `payments` rows whose status is `pending`.
- **Total orders** counts every persisted order, while **registered customers** counts rows in `public.users`.
- Reporting uses `Asia/Yangon`. “Today” is the half-open interval from local midnight through (but not including) the following local midnight. The monthly trend contains the current local calendar month and the preceding five months; each month also uses a half-open interval.
- Recent order units are the sum of `order_items.quantity`, not the number of line items. Registered-customer names and emails come from `public.users`; guest checkouts are explicitly marked and use the immutable customer snapshot on the order.
- Top products use the same paid-order rule and sum `order_items.quantity`. Current aggregate product stock and each current variant's stock are returned alongside units sold.

## Auth user mirror and backfill

`public.users.id` references `auth.users.id`. The `on_auth_user_created` trigger mirrors new and updated authentication users into the public table. Migration `20260801000300_admin_dashboard_reporting.sql` also backfills authentication users that existed before the trigger was installed.

After applying migrations, verify that the mirror is complete in the Supabase SQL editor:

```sql
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;
```

The query must return zero rows. Do not query `auth.users` from dashboard UI code or expose the service-role key to the browser.
