import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account | MV Esports",
  description: "Create an MV Esports account to host or register for tournaments.",
};

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
      <RegisterForm />
    </AuthPageLayout>
  );
}
