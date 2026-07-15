-- ==========================================
-- Wild Soul Club - First Admin Seed
-- ==========================================
-- 1. Create or invite the user in Supabase Auth first.
--    Supabase Auth owns passwords, so do not store admin passwords here.
-- 2. Replace the email below with the account that should access /admin.
-- 3. Run this in the Supabase SQL editor after the auth user exists.

INSERT INTO admins (user_id, role, permissions)
SELECT users.id, 'super_admin', '["*"]'::jsonb
FROM users
WHERE users.email = 'skeltonmarnez@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;
