import { Suspense } from "react";

import { TopBar } from "@/components/TopBar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";

/** Reads the session (request data) — must live under <Suspense> with Cache Components. */
async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <TopBar
      name={profile?.full_name ?? null}
      email={profile?.email ?? user?.email ?? null}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}

function HeaderFallback() {
  return <div className="border-border bg-background/80 h-14 border-b backdrop-blur" />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas min-h-svh">
      <Suspense fallback={<HeaderFallback />}>
        <AppHeader />
      </Suspense>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
