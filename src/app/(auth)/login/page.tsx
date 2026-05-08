import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | MV Esports",
  description: "Sign in to your MV Esports account.",
};

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthPageLayout>
  );
}
