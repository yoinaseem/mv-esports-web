import { Card } from "@/components/ui/card";

type AuthPageLayoutProps = {
  children: React.ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md p-8">{children}</Card>
    </main>
  );
}
