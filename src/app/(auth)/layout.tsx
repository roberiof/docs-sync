import { BrandMark } from "@/components/BrandMark";
import { AuthBrandPanel } from "@/modules/auth/components/AuthBrandPanel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <main className="bg-canvas flex flex-col items-center justify-center px-5 py-12 sm:px-8">
        <div className="auth-rise w-full max-w-100 [animation-delay:120ms]">{children}</div>
      </main>
    </div>
  );
}
