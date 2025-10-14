// Security Logger for Truckore Pro
// Logs all security-critical actions for audit trail

import { v4 as uuidv4 } from 'uuid';
import { executeNonQuery, executeQuery } from './connection';

export type SecurityAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'LOGOUT'
  | 'SETUP_COMPLETED';

export interface SecurityLog {
  id: string;
  userId: string | null;
  action: SecurityAction;
  details: string | null;
  timestamp: string;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  action: SecurityAction,
  userId?: string,
  details?: string
): Promise<void> {
  const id = uuidv4();
  
  try {
    await executeNonQuery(
      `INSERT INTO security_logs (id, user_id, action, details, timestamp)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, userId || null, action, details || null]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failure shouldn't break the app
  }
}

/**
 * Get security logs (for Super Admin only)
 */
export async function getSecurityLogs(
  limit: number = 100,
  userId?: string
): Promise<SecurityLog[]> {
  let query = 'SELECT * FROM security_logs';
  const params: any[] = [];

  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = await executeQuery<SecurityLog>(query, params);
  return rows;
}

/**
 * Get security logs for a specific time period
 */
export async function getSecurityLogsByDate(
  startDate: string,
  endDate: string
): Promise<SecurityLog[]> {
  const rows = await executeQuery<SecurityLog>(
    `SELECT * FROM security_logs 
     WHERE timestamp >= ? AND timestamp <= ?
     ORDER BY timestamp DESC`,
    [startDate, endDate]
  );
  return rows;
}

/**
 * Clear old security logs (keep last 90 days)
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  await executeNonQuery(
    'DELETE FROM security_logs WHERE timestamp < ?',
    [cutoffDate.toISOString()]
  );
}
