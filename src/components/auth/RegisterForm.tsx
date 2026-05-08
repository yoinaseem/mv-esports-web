"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";

const inputClass =
  "mt-2 block w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-invalid:border-red-500";

// The hard-13 age gate is enforced server-side; this `max` is a UX hint that
// keeps the date picker from offering visibly-too-young dates. The backend
// remains the source of truth.
const MAX_DOB = new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

export function RegisterForm() {
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
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

    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setSubmitting(true);

    try {
      await register({
        display_name: displayName || undefined,
        email,
        password,
        password_confirmation: passwordConfirmation,
        date_of_birth: dateOfBirth,
      });

      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const validationErrors = getValidationErrors(error);
        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
          setFormError("Please review your details and try again.");
        }

        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to create your account right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="register-display-name" className="block text-sm font-medium">
            Display name
          </label>
          <input
            id="register-display-name"
            name="display_name"
            type="text"
            autoComplete="nickname"
            placeholder="How you'll appear publicly"
            aria-invalid={fieldErrors.display_name?.length ? true : undefined}
            className={inputClass}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          {fieldErrors.display_name?.map((error) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-dob" className="block text-sm font-medium">
            Date of birth
          </label>
          <input
            id="register-dob"
            name="date_of_birth"
            type="date"
            autoComplete="bday"
            required
            max={MAX_DOB}
            aria-invalid={fieldErrors.date_of_birth?.length ? true : undefined}
            className={inputClass}
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
          {fieldErrors.date_of_birth?.map((error) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
          <p className="mt-1 text-xs text-zinc-500">You must be at least 13 to register.</p>
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
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
          <p className="mt-1 text-xs text-zinc-500">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="register-password-confirm" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="register-password-confirm"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={fieldErrors.password_confirmation?.length ? true : undefined}
            className={inputClass}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
          {fieldErrors.password_confirmation?.map((error) => (
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
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
