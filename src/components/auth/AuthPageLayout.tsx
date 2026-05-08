type AuthPageLayoutProps = {
  children: React.ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
