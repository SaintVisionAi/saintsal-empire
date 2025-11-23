'use client';
import { Clock, Shield, AlertTriangle } from 'lucide-react';
import { useAuthMonitor } from '@/hooks/useAuthMonitor';

export default function AuthStatusBar() {
  const { authStatus, refreshToken } = useAuthMonitor();

  if (!authStatus.isAuthenticated) return null;

  const timeUntilExpiry = authStatus.tokenExpiry
    ? Math.max(0, authStatus.tokenExpiry.getTime() - Date.now())
    : 0;
  const minutesLeft = Math.floor(timeUntilExpiry / 60000);
  const isExpiringSoon = minutesLeft < 5;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-2 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className={`w-4 h-4 ${isExpiringSoon ? 'text-yellow-400' : 'text-green-400'}`} />
            <span className="text-sm text-gray-300">
              {authStatus.name || authStatus.email} ({authStatus.role?.toUpperCase()})
            </span>
          </div>
          {authStatus.tokenExpiry && (
            <div className={`flex items-center space-x-2 ${isExpiringSoon ? 'text-yellow-400' : 'text-gray-400'}`}>
              <Clock className="w-4 h-4" />
              <span className="text-xs">
                {minutesLeft > 0
                  ? `Session: ${minutesLeft}m left`
                  : 'Session expired'}
              </span>
            </div>
          )}
        </div>
        {isExpiringSoon && (
          <button
            onClick={refreshToken}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Refresh Session</span>
          </button>
        )}
      </div>
    </div>
  );
}

