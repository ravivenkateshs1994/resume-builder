import fs from "fs";
import path from "path";

function parseDotEnv(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const out = {};
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    let v = t.slice(idx + 1);
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

async function main() {
  const root = path.resolve(".");
  const envFile = path.join(root, ".env.local");
  if (!fs.existsSync(envFile)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const env = parseDotEnv(envFile);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = env.SUPABASE_ADMIN_EMAIL;
  const password = env.SUPABASE_ADMIN_PASSWORD;
  if (!supabaseUrl || !anonKey || !email || !password) {
    console.error('Missing required env values in .env.local');
    process.exit(1);
  }

  // Sign in to Supabase to get an access token
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Failed to sign in:', tokenRes.status, tokenJson);
    process.exit(1);
  }
  const accessToken = tokenJson.access_token;
  console.log('Got access token:', !!accessToken);

  // Fetch resumes from local dev server
  const base = 'http://localhost:3000';
  const getRes = await fetch(`${base}/api/cloud/resumes`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const getJson = await getRes.json();
  console.log('GET /api/cloud/resumes status', getRes.status);
  console.log('Response:', JSON.stringify(getJson, null, 2));

  const id = Array.isArray(getJson.resumes) && getJson.resumes.length ? getJson.resumes[0].id : null;
  if (!id) {
    console.log('No resumes to delete.');
    process.exit(0);
  }
  console.log('Deleting resume id', id);

  const delRes = await fetch(`${base}/api/cloud/resumes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const delJson = await delRes.json().catch(() => null);
  console.log('DELETE status', delRes.status, 'body', delJson);

  const after = await fetch(`${base}/api/cloud/resumes`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const afterJson = await after.json();
  console.log('After GET status', after.status);
  console.log('After list:', JSON.stringify(afterJson, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
