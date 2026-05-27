# Supabase Setup

1. Create a project on Supabase.
2. In SQL Editor, run [`supabase/schema.sql`](/f:/LEARNING%20SPACE/Projects/AI%20Resume%20Builder/supabase/schema.sql).
3. Add these vars to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ADMIN_EMAIL=admin@example.com
SUPABASE_ADMIN_PASSWORD=choose_a_strong_password
```

4. In Supabase Auth settings:
- Enable Email auth
- Add your local/dev site URL to redirect URLs if you later add social or magic-link login

5. Seed the first admin user:
- Run `npm run seed:admin`
- Then log in at `/login` with the admin email and password

After that:
- users can log in from `/login` or header `Login`
- analysis history can save/load from cloud
- resumes can be saved to cloud from Resume Builder
