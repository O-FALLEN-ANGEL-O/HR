import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export const Header = React.memo(function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-auto min-h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
});
