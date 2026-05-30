Applying the template-metadata migration

This project stores saved resume JSON in the `user_resumes` table. To make template metadata (selected template id, name, accent color, friendly color name) queryable, run the migration in `supabase/migrations/001_add_template_metadata.sql`.

Options:

1) Supabase SQL Editor (recommended)
- Open your Supabase project dashboard
- Go to SQL → New query
- Paste the contents of `supabase/migrations/001_add_template_metadata.sql` and run

2) Using `psql` (local/CI)
- Ensure your `DATABASE_URL` or connection string is available

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_add_template_metadata.sql
```

3) Using the Supabase CLI
- If you use the Supabase CLI and have migrations configured, copy the file into your migrations folder and run your usual migration command (e.g. `supabase db push` or `supabase migration run` depending on your workflow).

Notes:
- The migration is additive and guarded with `IF NOT EXISTS`, so it is safe to re-run.
- We changed content hash computation on the server to ignore `resume_data.template` so that switching templates doesn't create duplicate entries.
- After running the migration, saved resumes will start populating the new `template_*` columns when users save resumes via the UI.
