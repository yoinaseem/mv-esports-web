"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";

const inputClass =
  "mt-2 block w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-invalid:border-red-500";

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
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email?.length ? true : undefined}
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email?.map((error) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={fieldErrors.password?.length ? true : undefined}
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password?.map((error) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>

        {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

        <button
          type="submit"
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
