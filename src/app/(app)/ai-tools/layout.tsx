import { Header } from '@/components/header';

export default function AIToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="AI Tools" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
