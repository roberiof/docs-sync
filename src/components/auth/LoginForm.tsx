"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass = "h-11 rounded-xl border-input bg-white text-[15px] shadow-sm";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <div>
      <header className="mb-8">
        <p className="text-primary text-sm font-medium">Welcome back</p>
        <h1 className="text-foreground mt-1 font-serif text-[2rem] leading-tight tracking-tight">
          Sign in to DocSync
        </h1>
        <p className="text-muted-foreground mt-2 text-[15px]">
          Access your collaborative documents.
        </p>
      </header>

      <form action={action} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            className={fieldClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className={fieldClass}
          />
        </div>

        {state?.error && (
          <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-sm transition-transform active:scale-[0.99]"
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-semibold underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
