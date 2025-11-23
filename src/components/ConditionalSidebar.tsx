'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';

export default function ConditionalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    // Show sidebar for authenticated routes
    const authRoutes = ['/dashboard', '/playground', '/walkie-talkie', '/code-agent', '/integrations', '/admin', '/warroom'];
    const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route));
    
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    setShowSidebar(isAuthRoute && !!token);
  }, [pathname]);

  if (showSidebar) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return <main className="min-h-screen">{children}</main>;
}

