'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, X, RefreshCw, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useAuthMonitor } from '@/hooks/useAuthMonitor';
import type { AuthEvent } from '@/lib/auth-monitor';

export default function AuthAlerts() {
  const { authStatus, refreshToken, clearAlerts } = useAuthMonitor();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const getAlertIcon = (severity: AuthEvent['severity']) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: AuthEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 border-red-700 text-red-100';
      case 'error':
        return 'bg-red-800 border-red-600 text-red-100';
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-100';
      default:
        return 'bg-blue-900 border-blue-700 text-blue-100';
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  const handleRefresh = async () => {
    const success = await refreshToken();
    if (success) {
      clearAlerts();
    }
  };

  // Auto-dismiss info alerts after 5 seconds
  useEffect(() => {
    authStatus.alerts.forEach((alert) => {
      if (alert.severity === 'info' && !dismissedAlerts.has(alert.timestamp.toISOString())) {
        setTimeout(() => {
          dismissAlert(alert.timestamp.toISOString());
        }, 5000);
      }
    });
  }, [authStatus.alerts, dismissedAlerts]);

  const visibleAlerts = authStatus.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.timestamp.toISOString())
  );

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {visibleAlerts.map((alert) => {
        const alertId = alert.timestamp.toISOString();
        const isExpiring = alert.type === 'session_expired' && alert.severity === 'warning';

        return (
          <div
            key={alertId}
            className={`${getAlertColor(alert.severity)} border rounded-lg p-4 shadow-lg flex items-start space-x-3 animate-slide-in`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{alert.message}</p>
                  {alert.metadata && (
                    <p className="text-xs opacity-80">
                      {alert.metadata.expiresIn
                        ? `Expires in ${Math.floor(alert.metadata.expiresIn / 60)} minutes`
                        : ''}
                    </p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alertId)}
                  className="ml-2 flex-shrink-0 text-current opacity-70 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isExpiring && (
                <button
                  onClick={handleRefresh}
                  className="mt-3 flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded text-sm font-medium transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Session</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

