"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || submitting) return;
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, submitting, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSubmitting(true);

    try {
      await login({ email, password });
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const validationErrors = getValidationErrors(error);
        setFieldErrors(validationErrors);

        if (!validationErrors.email?.length && !validationErrors.password?.length) {
          setFormError("Please review the highlighted fields and try again.");
        }

        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email?.length ? true : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email?.map((error) => (
            <p className="text-sm text-destructive" key={error}>
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={fieldErrors.password?.length ? true : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password?.map((error) => (
            <p className="text-sm text-destructive" key={error}>
              {error}
            </p>
          ))}
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
