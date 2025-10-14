// Database Connection Service for Truckore Pro
// Handles SQLite connection via Tauri backend (or localStorage fallback in browser)

import {
  localStorageExecuteQuery,
  localStorageExecuteNonQuery,
  localStorageInitDatabase,
  isDevelopmentMode
} from './localStorageAdapter';

// Check if running in Tauri environment (dynamic check)
function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && 
         '__TAURI__' in window && 
         window.__TAURI__ !== undefined;
}

// Type-safe invoke wrapper
async function invoke<T = any>(cmd: string, args?: any): Promise<T> {
  if (isTauriAvailable()) {
    try {
      return await (window as any).__TAURI__.invoke(cmd, args);
    } catch (error) {
      console.error('Tauri invoke error:', error);
      throw error;
    }
  }
  // In browser mode, we'll use localStorage adapter instead of throwing
  throw new Error('Tauri not available - should use localStorage adapter');
}

/**
 * Initialize the database
 * Creates the database file and tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  // Always check if in development mode first
  if (isDevelopmentMode() || !isTauriAvailable()) {
    await localStorageInitDatabase();
    console.log('✅ Database initialized (Development Mode - localStorage)');
    return;
  }

  try {
    await invoke('init_database');
    console.log('✅ Database initialized (Desktop Mode - SQLite)');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Fallback to localStorage if Tauri fails
    console.warn('Falling back to localStorage mode');
    await localStorageInitDatabase();
  }
}

/**
 * Execute a SQL query
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Query results
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  if (isDevelopmentMode() || !isTauriAvailable()) {
    return localStorageExecuteQuery<T>(query, params);
  }

  try {
    const result = await invoke('execute_query', { query, params });
    return result as T[];
  } catch (error) {
    console.error('Query execution failed, falling back to localStorage:', error);
    return localStorageExecuteQuery<T>(query, params);
  }
}

/**
 * Execute a SQL query that doesn't return results (INSERT, UPDATE, DELETE)
 * @param query - SQL query string
 * @param params - Query parameters
 */
export async function executeNonQuery(
  query: string,
  params: any[] = []
): Promise<void> {
  if (isDevelopmentMode() || !isTauriAvailable()) {
    return localStorageExecuteNonQuery(query, params);
  }

  try {
    await invoke('execute_non_query', { query, params });
  } catch (error) {
    console.error('Non-query execution failed, falling back to localStorage:', error);
    return localStorageExecuteNonQuery(query, params);
  }
}

/**
 * Check if the database setup is completed
 */
export async function checkSetupStatus(): Promise<boolean> {
  try {
    const result = await executeQuery<{ value: string }>(
      'SELECT value FROM app_config WHERE key = ?',
      ['setup_completed']
    );
    return result.length > 0 && result[0].value === 'true';
  } catch (error) {
    console.error('Failed to check setup status:', error);
    return false;
  }
}

/**
 * Mark setup as completed
 */
export async function markSetupCompleted(): Promise<void> {
  try {
    await executeNonQuery(
      'UPDATE app_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
      ['true', 'setup_completed']
    );
  } catch (error) {
    console.error('Failed to mark setup as completed:', error);
    throw error;
  }
}

/**
 * Get app configuration value
 */
export async function getConfig(key: string): Promise<string | null> {
  try {
    const result = await executeQuery<{ value: string }>(
      'SELECT value FROM app_config WHERE key = ?',
      [key]
    );
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error('Failed to get config:', error);
    return null;
  }
}

/**
 * Set app configuration value
 */
export async function setConfig(key: string, value: string): Promise<void> {
  try {
    await executeNonQuery(
      `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, value, value]
    );
  } catch (error) {
    console.error('Failed to set config:', error);
    throw error;
  }
}
