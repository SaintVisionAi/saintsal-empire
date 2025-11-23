'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthEvent } from '@/lib/auth-monitor';

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: number;
  role?: string;
  email?: string;
  name?: string;
  tokenExpiry?: Date;
  alerts: AuthEvent[];
}

export function useAuthMonitor() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    alerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status
  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus({
        isAuthenticated: false,
        alerts: [],
      });
      setIsLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const isExpired = exp < now;

      if (isExpired) {
        localStorage.removeItem('token');
        setAuthStatus({
          isAuthenticated: false,
          alerts: [{
            type: 'session_expired',
            message: 'Your session has expired. Please log in again.',
            severity: 'warning',
            timestamp: new Date(),
          }],
        });
        router.push('/auth/login');
        setIsLoading(false);
        return;
      }

      const timeUntilExpiry = exp - now;
      const fiveMinutes = 5 * 60 * 1000;
      const alerts: AuthEvent[] = [];

      if (timeUntilExpiry < fiveMinutes) {
        alerts.push({
          type: 'session_expired',
          userId: payload.userId,
          message: `Session expiring in ${Math.floor(timeUntilExpiry / 60000)} minutes`,
          severity: 'warning',
          timestamp: new Date(),
        });
      }

      setAuthStatus({
        isAuthenticated: true,
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        name: payload.name,
        tokenExpiry: new Date(exp),
        alerts,
      });
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setAuthStatus({
        isAuthenticated: false,
        alerts: [{
          type: 'token_invalid',
          message: 'Invalid token. Please log in again.',
          severity: 'error',
          timestamp: new Date(),
        }],
      });
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initialize WebSocket connection for real-time alerts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:${window.location.port || 3000}/ws`;
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log('[Auth Monitor] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_alert' && data.userId === userId) {
            const alert: AuthEvent = {
              type: data.type,
              userId: data.userId,
              message: data.message,
              severity: data.severity,
              timestamp: new Date(data.timestamp),
              ip: data.ip,
              metadata: data.metadata,
            };

            setAuthStatus((prev) => ({
              ...prev,
              alerts: [alert, ...prev.alerts].slice(0, 10), // Keep last 10 alerts
            }));

            // Handle critical alerts
            if (alert.severity === 'critical' || alert.type === 'session_expired') {
              if (alert.type === 'session_expired' || alert.type === 'token_invalid') {
                localStorage.removeItem('token');
                router.push('/auth/login');
              }
            }
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Auth Monitor] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[Auth Monitor] WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (localStorage.getItem('token')) {
            // Reconnect logic would go here
          }
        }, 5000);
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }, []);

  // Continuous auth checking
  useEffect(() => {
    checkAuth();

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      checkAuth();
    }, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [checkAuth]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          checkAuth();
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }, [checkAuth]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAuthStatus((prev) => ({
      ...prev,
      alerts: [],
    }));
  }, []);

  return {
    authStatus,
    isLoading,
    checkAuth,
    refreshToken,
    clearAlerts,
  };
}

