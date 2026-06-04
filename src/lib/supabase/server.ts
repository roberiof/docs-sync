import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too.
 * The `setAll` call can throw when invoked from a Server Component (cookies
 * are read-only during render); that's expected and safe to ignore because
 * session refresh is handled by `proxy.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore; proxy refreshes the session.
          }
        },
      },
    },
  );
}
