// User Repository for Truckore Pro
// Manages user CRUD operations and password handling

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { executeQuery, executeNonQuery } from './connection';

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'super_admin' | 'admin' | 'operator';
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'operator';
  is_active: number;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

const BCRYPT_ROUNDS = 12;
const LOCK_DURATION_MINUTES = 30;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Convert database row to User object
 */
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: row.is_active === 1,
    failedLoginAttempts: row.failed_login_attempts,
    lockedUntil: row.locked_until,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new user
 */
export async function createUser(
  username: string,
  password: string,
  role: 'super_admin' | 'admin' | 'operator',
  email?: string
): Promise<User> {
  const id = uuidv4();
  const passwordHash = await hashPassword(password);
  
  await executeNonQuery(
    `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, username, email || null, passwordHash, role]
  );

  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    throw new Error('Failed to create user');
  }

  return rowToUser(rows[0]);
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  return rows.length > 0 ? rowToUser(rows[0]) : null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  return rows.length > 0 ? rowToUser(rows[0]) : null;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const rows = await executeQuery<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(rowToUser);
}

/**
 * Verify user credentials and return user if valid
 */
export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    return { user: null, error: 'Invalid username or password' };
  }

  const userRow = rows[0];
  const user = rowToUser(userRow);

  // Check if account is locked
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil);
    if (lockTime > new Date()) {
      const minutesRemaining = Math.ceil((lockTime.getTime() - Date.now()) / 60000);
      return { 
        user: null, 
        error: `Account locked. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.` 
      };
    } else {
      // Lock expired, reset failed attempts
      await resetFailedAttempts(user.id);
    }
  }

  // Check if account is active
  if (!user.isActive) {
    return { user: null, error: 'Account is disabled. Contact Super Admin.' };
  }

  // Verify password
  const isValid = await verifyPassword(password, userRow.password_hash);

  if (!isValid) {
    await incrementFailedAttempts(user.id);
    return { user: null, error: 'Invalid username or password' };
  }

  // Success - reset failed attempts and update last login
  await resetFailedAttempts(user.id);
  await executeNonQuery(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
    [user.id]
  );

  return { user };
}

/**
 * Increment failed login attempts and lock account if needed
 */
async function incrementFailedAttempts(userId: string): Promise<void> {
  const rows = await executeQuery<{ failed_login_attempts: number }>(
    'SELECT failed_login_attempts FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) return;

  const newCount = rows[0].failed_login_attempts + 1;

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000).toISOString();
    await executeNonQuery(
      'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
      [newCount, lockUntil, userId]
    );
  } else {
    await executeNonQuery(
      'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
      [newCount, userId]
    );
  }
}

/**
 * Reset failed login attempts
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await executeNonQuery(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
    [userId]
  );
}

/**
 * Update user details
 */
export async function updateUser(
  userId: string,
  updates: {
    username?: string;
    email?: string;
    role?: 'super_admin' | 'admin' | 'operator';
    isActive?: boolean;
  }
): Promise<User | null> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.username !== undefined) {
    setParts.push('username = ?');
    params.push(updates.username);
  }
  if (updates.email !== undefined) {
    setParts.push('email = ?');
    params.push(updates.email);
  }
  if (updates.role !== undefined) {
    setParts.push('role = ?');
    params.push(updates.role);
  }
  if (updates.isActive !== undefined) {
    setParts.push('is_active = ?');
    params.push(updates.isActive ? 1 : 0);
  }

  if (setParts.length === 0) {
    return getUserById(userId);
  }

  setParts.push('updated_at = CURRENT_TIMESTAMP');
  params.push(userId);

  await executeNonQuery(
    `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );

  return getUserById(userId);
}

/**
 * Reset user password (Super Admin only)
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  
  await executeNonQuery(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, userId]
  );
}

/**
 * Change user's own password
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const rows = await executeQuery<UserRow>(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'User not found' };
  }

  const isValid = await verifyPassword(oldPassword, rows[0].password_hash);

  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  await resetUserPassword(userId, newPassword);
  return { success: true };
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  // Don't allow deleting super admin
  const user = await getUserById(userId);
  if (user?.role === 'super_admin') {
    throw new Error('Cannot delete Super Admin account');
  }

  await executeNonQuery('DELETE FROM users WHERE id = ?', [userId]);
}

/**
 * Check if any users exist
 */
export async function hasAnyUsers(): Promise<boolean> {
  const rows = await executeQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  return rows.length > 0 && rows[0].count > 0;
}
