
-- 1. Profiles: restrict full row to owner + admin; expose public view with safe fields only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe projection (no phone)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow anyone to read the safe columns directly too (for joins) by adding a permissive
-- SELECT policy limited via a column-aware approach: simplest is to keep the strict policies
-- above and use the view for public reads.

-- 2. Shops: contact details for signed-in users only; keep public listing visible
DROP POLICY IF EXISTS "Anyone can view approved shops" ON public.shops;

CREATE POLICY "Authenticated view approved shops"
ON public.shops FOR SELECT
TO authenticated
USING (status = 'approved');

-- Public (anon) sees approved shops via a safe view without contact info
CREATE OR REPLACE VIEW public.public_shops
WITH (security_invoker = true) AS
SELECT id, slug, name, category, description, city, district,
       logo_hue, rating, reviews_count, seller_type, status, created_at
FROM public.shops
WHERE status = 'approved';

GRANT SELECT ON public.public_shops TO anon, authenticated;

-- 3. Lock down SECURITY DEFINER functions: revoke from PUBLIC roles.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- RLS policies referencing has_role() still work (executed as table owner context).
