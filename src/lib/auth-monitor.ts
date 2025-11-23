import { verifyToken } from './auth';
import { db } from './db';
import { logs } from '@/db/schema';
import { sendToUser } from './websocket';

export interface AuthEvent {
  type: 'login' | 'logout' | 'session_expired' | 'session_refreshed' | 'security_alert' | 'token_invalid' | 'unauthorized_access';
  userId?: number;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  ip?: string;
  metadata?: Record<string, any>;
}

class AuthMonitor {
  private sessionChecks: Map<number, NodeJS.Timeout> = new Map();
  private alertSubscribers: Map<number, (event: AuthEvent) => void> = new Map();
  private checkInterval = 30000; // Check every 30 seconds

  /**
   * Start monitoring a user's session
   */
  startMonitoring(userId: number, token: string, ip?: string) {
    // Clear existing monitoring if any
    this.stopMonitoring(userId);

    // Immediate check
    this.checkSession(userId, token, ip);

    // Set up continuous monitoring
    const interval = setInterval(() => {
      this.checkSession(userId, token, ip);
    }, this.checkInterval);

    this.sessionChecks.set(userId, interval);

    // Log monitoring start
    this.logEvent({
      type: 'login',
      userId,
      message: 'Session monitoring started',
      severity: 'info',
      timestamp: new Date(),
      ip,
    });
  }

  /**
   * Stop monitoring a user's session
   */
  stopMonitoring(userId: number) {
    const interval = this.sessionChecks.get(userId);
    if (interval) {
      clearInterval(interval);
      this.sessionChecks.delete(userId);
    }
  }

  /**
   * Check session validity and expiration
   */
  private async checkSession(userId: number, token: string, ip?: string) {
    try {
      const verified = verifyToken(token);

      if (!verified || verified.userId !== userId) {
        this.triggerAlert({
          type: 'token_invalid',
          userId,
          message: 'Invalid or expired token detected',
          severity: 'warning',
          timestamp: new Date(),
          ip,
        });
        this.stopMonitoring(userId);
        return false;
      }

      // Check token expiration (warn if expiring soon)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        this.triggerAlert({
          type: 'session_expired',
          userId,
          message: 'Session expiring soon - refresh recommended',
          severity: 'warning',
          timestamp: new Date(),
          ip,
          metadata: { expiresIn: Math.floor(timeUntilExpiry / 1000) },
        });
      }

      return true;
    } catch (error) {
      this.triggerAlert({
        type: 'security_alert',
        userId,
        message: 'Session validation error',
        severity: 'error',
        timestamp: new Date(),
        ip,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      return false;
    }
  }

  /**
   * Trigger an authentication alert
   */
  async triggerAlert(event: AuthEvent) {
    // Send via WebSocket if user is connected
    if (event.userId) {
      try {
        sendToUser(event.userId, {
          type: 'auth_alert',
          ...event,
        });
      } catch (error) {
        // WebSocket might not be available, continue with other notifications
        console.error('Failed to send WebSocket alert:', error);
      }
    }

    // Notify subscribers
    if (event.userId) {
      const subscriber = this.alertSubscribers.get(event.userId);
      if (subscriber) {
        subscriber(event);
      }
    }

    // Log to database
    try {
      await db.insert(logs).values({
        userId: event.userId || null,
        action: event.type,
        ip: event.ip,
        hacpCompliant: event.severity !== 'critical' && event.severity !== 'error',
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Alert]', event);
    }
  }

  /**
   * Subscribe to auth alerts for a user
   */
  subscribe(userId: number, callback: (event: AuthEvent) => void) {
    this.alertSubscribers.set(userId, callback);
  }

  /**
   * Unsubscribe from auth alerts
   */
  unsubscribe(userId: number) {
    this.alertSubscribers.delete(userId);
  }

  /**
   * Refresh session token
   */
  async refreshSession(userId: number, oldToken: string, ip?: string): Promise<string | null> {
    try {
      const verified = verifyToken(oldToken);
      if (!verified || verified.userId !== userId) {
        this.triggerAlert({
          type: 'unauthorized_access',
          userId,
          message: 'Unauthorized session refresh attempt',
          severity: 'error',
          timestamp: new Date(),
          ip,
        });
        return null;
      }

      // Generate new token (in a real app, you'd get this from the auth service)
      // For now, we'll just validate and return success
      this.triggerAlert({
        type: 'session_refreshed',
        userId,
        message: 'Session refreshed successfully',
        severity: 'info',
        timestamp: new Date(),
        ip,
      });

      return oldToken; // In production, return new token
    } catch (error) {
      this.triggerAlert({
        type: 'security_alert',
        userId,
        message: 'Session refresh failed',
        severity: 'error',
        timestamp: new Date(),
        ip,
      });
      return null;
    }
  }

  /**
   * Log logout event
   */
  async logLogout(userId: number, ip?: string) {
    this.stopMonitoring(userId);
    await this.triggerAlert({
      type: 'logout',
      userId,
      message: 'User logged out',
      severity: 'info',
      timestamp: new Date(),
      ip,
    });
  }
}

// Singleton instance
export const authMonitor = new AuthMonitor();

