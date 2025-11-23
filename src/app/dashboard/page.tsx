'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StreamingChat from '@/components/StreamingChat';
import { useAuthMonitor } from '@/hooks/useAuthMonitor';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { authStatus } = useAuthMonitor();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      
      // Start auth monitoring on client side
      if (typeof window !== 'undefined' && authStatus.isAuthenticated) {
        // Monitoring is handled by useAuthMonitor hook
      }
    } catch (error) {
      console.error('Token decode error:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router, authStatus.isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="border-b border-gray-700 p-4 bg-gray-900">
        <h1 className="text-3xl font-bold mb-2 text-gold">SaintSal™ Dashboard</h1>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-300">Welcome, <span className="font-bold">{user.name || user.email}</span></p>
            <p className="text-xs text-gray-400">
              Role: <span className="text-gold">{user.role?.toUpperCase() || 'FREE'}</span>
            </p>
          </div>
          <div className="text-xs text-gray-400">
            <p>HACP™ Protected | Patent 10,290,222</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <StreamingChat userId={user.userId} className="h-full" />
      </div>
    </div>
  );
}
