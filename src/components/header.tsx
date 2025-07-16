'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export const Header = React.memo(function Header({ title, children }: HeaderProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex h-auto min-h-14 items-center gap-2 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
});
