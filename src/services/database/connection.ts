// Database Connection Service for Truckore Pro
// Handles SQLite connection via Tauri backend (or localStorage fallback in browser)

import {
  localStorageExecuteQuery,
  localStorageExecuteNonQuery,
  localStorageInitDatabase,
  isDevelopmentMode
} from './localStorageAdapter';

// Import Tauri API - this ensures proper initialization
let tauriInvoke: ((cmd: string, args?: any) => Promise<any>) | null = null;

// Dynamically import Tauri API (only in desktop environment)
async function initTauriAPI() {
  if (tauriInvoke) return; // Already initialized
  
  try {
    // Check if Tauri is actually available before attempting import
    if (!isTauriAvailable()) {
      console.log('ℹ️ Tauri API not available (browser mode)');
      return;
    }
    
    // @ts-ignore - Dynamic import for Tauri API (only available in desktop mode)
    const tauriApi = await import('@tauri-apps/api/tauri');
    tauriInvoke = tauriApi.invoke;
    console.log('✅ Tauri API initialized successfully');
  } catch (error) {
    // Silently fail in browser mode - this is expected
    console.log('ℹ️ Tauri API import failed (running in browser mode)');
  }
}

// Check if running in Tauri environment (dynamic check)
function isTauriAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 
           '__TAURI__' in window && 
           window.__TAURI__ !== undefined;
  } catch {
    return false;
  }
}

// Type-safe invoke wrapper
async function invoke<T = any>(cmd: string, args?: any): Promise<T> {
  // Initialize Tauri API if not already done
  if (!tauriInvoke && isTauriAvailable()) {
    await initTauriAPI();
  }
  
  if (tauriInvoke) {
    try {
      console.log(`[Tauri] Invoking command: ${cmd}`);
      const result = await tauriInvoke(cmd, args);
      console.log(`[Tauri] Command ${cmd} succeeded`);
      return result as T;
    } catch (error) {
      console.error(`[Tauri] Command ${cmd} failed:`, error);
      throw error;
    }
  }
  
  throw new Error('Tauri not available - should use localStorage adapter');
}

/**
 * Initialize the database
 * Creates the database file and tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  const inTauriMode = isTauriAvailable();
  console.log(`[DB Init] Tauri available: ${inTauriMode}`);
  
  // Always check if in development mode first
  if (isDevelopmentMode() || !inTauriMode) {
    await localStorageInitDatabase();
    console.log('✅ Database initialized (Browser Mode - localStorage)');
    return;
  }

  try {
    console.log('[DB Init] Initializing Tauri SQLite database...');
    await invoke('init_database');
    console.log('✅ Database initialized (Desktop Mode - SQLite)');
  } catch (error) {
    console.error('❌ Failed to initialize Tauri database:', error);
    // Fallback to localStorage if Tauri fails
    console.warn('⚠️ Falling back to localStorage mode');
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
  const inDesktopMode = isTauriAvailable();
  
  if (isDevelopmentMode() || !inDesktopMode) {
    console.log('[DB Query] Using localStorage adapter');
    return localStorageExecuteQuery<T>(query, params);
  }

  try {
    console.log('[DB Query] Using Tauri SQLite backend');
    const result = await invoke('execute_query', { query, params });
    return result as T[];
  } catch (error) {
    console.error('❌ [DB Query] Tauri backend failed:', error);
    console.warn('⚠️ [DB Query] Attempting localStorage fallback...');
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
  const inDesktopMode = isTauriAvailable();
  
  console.log(`[DB NonQuery] Desktop mode: ${inDesktopMode}`);
  
  if (isDevelopmentMode() || !inDesktopMode) {
    console.log('[DB NonQuery] Using localStorage adapter');
    return localStorageExecuteNonQuery(query, params);
  }

  try {
    console.log('[DB NonQuery] Using Tauri SQLite backend');
    await invoke('execute_non_query', { query, params });
    console.log('[DB NonQuery] ✅ Success');
  } catch (error) {
    console.error('❌ [DB NonQuery] Tauri backend failed:', error);
    console.warn('⚠️ [DB NonQuery] Attempting localStorage fallback...');
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
