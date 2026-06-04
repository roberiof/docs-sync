import { PenLine } from "lucide-react";

import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <main className="bg-canvas flex flex-col items-center justify-center px-5 py-12 sm:px-8">
        {/* Wordmark for mobile, where the brand panel is hidden. */}
        <div className="text-foreground mb-10 flex items-center gap-2.5 lg:hidden">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <PenLine className="size-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-serif text-2xl tracking-tight">DocSync</span>
        </div>
        <div className="auth-rise w-full max-w-100 [animation-delay:120ms]">{children}</div>
      </main>
    </div>
  );
}
