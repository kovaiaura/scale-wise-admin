// Database Connection Service for Truckore Pro
// Handles SQLite connection via Tauri backend

import { invoke } from '@tauri-apps/api/tauri';

/**
 * Initialize the database
 * Creates the database file and tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  try {
    await invoke('init_database');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Database initialization failed');
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
  try {
    const result = await invoke<T[]>('execute_query', { query, params });
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
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
  try {
    await invoke('execute_non_query', { query, params });
  } catch (error) {
    console.error('Non-query execution failed:', error);
    throw error;
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
