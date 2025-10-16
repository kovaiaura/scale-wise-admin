// Desktop Serial Number Service - Uses Tauri SQLite Database and App Config
import { invoke } from '@tauri-apps/api/tauri';

export interface SerialNumberConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  yearFormat: 'YY' | 'YYYY';
  counterStart: number;
  counterPadding: number;
  currentCounter: number;
  resetFrequency: 'never' | 'monthly' | 'yearly';
  lastResetDate?: string;
}

const DEFAULT_CONFIG: SerialNumberConfig = {
  prefix: 'WB',
  separator: '-',
  includeYear: true,
  includeMonth: true,
  yearFormat: 'YY',
  counterStart: 1,
  counterPadding: 3,
  currentCounter: 1,
  resetFrequency: 'monthly',
  lastResetDate: new Date().toISOString(),
};

/**
 * Generate serial number string based on configuration
 */
export const generateSerialNumber = (config: SerialNumberConfig): string => {
  const now = new Date();
  let serialNo = config.prefix;

  if (config.includeYear) {
    const year = config.yearFormat === 'YY' 
      ? String(now.getFullYear()).slice(-2) 
      : String(now.getFullYear());
    serialNo += config.separator + year;
  }

  if (config.includeMonth) {
    const month = String(now.getMonth() + 1).padStart(2, '0');
    serialNo += config.separator + month;
  }

  const counter = String(config.currentCounter).padStart(config.counterPadding, '0');
  serialNo += config.separator + counter;

  return serialNo;
};

/**
 * Get serial number configuration from app config
 */
export const getSerialNumberConfig = async (): Promise<SerialNumberConfig> => {
  try {
    console.log('[SerialNumber] Fetching serial number config from database...');
    
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT value FROM app_config WHERE key = ?',
      params: ['serial_number_config']
    });

    console.log('[SerialNumber] Query results:', results);

    // Check if we got results
    if (Array.isArray(results) && results.length > 0 && results[0].value) {
      const configJson = results[0].value;
      console.log('[SerialNumber] Found config JSON:', configJson);
      
      const config = JSON.parse(configJson);
      console.log('[SerialNumber] Parsed config:', config);
      return config;
    }
    
    // Initialize with default config if not found
    console.log('[SerialNumber] No config found, initializing with defaults...');
    await initializeSerialNumberConfig();
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('[SerialNumber] Error fetching serial number config:', error);
    // Try to initialize if error occurred
    try {
      await initializeSerialNumberConfig();
    } catch (initError) {
      console.error('[SerialNumber] Failed to initialize config:', initError);
    }
    return DEFAULT_CONFIG;
  }
};

/**
 * Initialize serial number config in database
 */
const initializeSerialNumberConfig = async (): Promise<void> => {
  console.log('[SerialNumber] Initializing config in database...');
  await invoke('execute_non_query', {
    query: `
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `,
    params: ['serial_number_config', JSON.stringify(DEFAULT_CONFIG)]
  });
  console.log('[SerialNumber] Config initialized successfully');
};

/**
 * Update serial number configuration in app config
 */
export const updateSerialNumberConfig = async (
  config: SerialNumberConfig & { resetCounterNow?: boolean }
): Promise<SerialNumberConfig> => {
  try {
    console.log('[SerialNumber] Updating config...', config);
    
    // Handle counter reset
    if (config.resetCounterNow) {
      config.currentCounter = config.counterStart;
      config.lastResetDate = new Date().toISOString();
      console.log('[SerialNumber] Counter reset to:', config.currentCounter);
    }

    const configToSave = { ...config };
    delete (configToSave as any).resetCounterNow;

    console.log('[SerialNumber] Saving config to database:', configToSave);

    // Upsert configuration
    await invoke('execute_non_query', {
      query: `
        INSERT OR REPLACE INTO app_config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      params: ['serial_number_config', JSON.stringify(configToSave)]
    });

    console.log('[SerialNumber] Config saved successfully');
    return configToSave;
  } catch (error) {
    console.error('[SerialNumber] Error updating serial number config:', error);
    throw error;
  }
};

/**
 * Check if counter should be auto-reset based on frequency
 */
const checkAndPerformAutoReset = (config: SerialNumberConfig): SerialNumberConfig => {
  if (config.resetFrequency === 'never' || !config.lastResetDate) return config;

  const now = new Date();
  const lastReset = new Date(config.lastResetDate);
  let shouldReset = false;

  if (config.resetFrequency === 'yearly') {
    shouldReset = now.getFullYear() > lastReset.getFullYear();
  } else if (config.resetFrequency === 'monthly') {
    shouldReset = 
      now.getFullYear() > lastReset.getFullYear() ||
      (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
  }

  if (shouldReset) {
    return {
      ...config,
      currentCounter: config.counterStart,
      lastResetDate: now.toISOString(),
    };
  }

  return config;
};

/**
 * Get next serial number and increment counter
 */
export const getNextSerialNumber = async (): Promise<string> => {
  try {
    console.log('[SerialNumber] Getting next serial number...');
    
    let config = await getSerialNumberConfig();
    console.log('[SerialNumber] Current config:', config);
    
    // Check for auto-reset
    const originalCounter = config.currentCounter;
    config = checkAndPerformAutoReset(config);
    if (config.currentCounter !== originalCounter) {
      console.log('[SerialNumber] Counter auto-reset from', originalCounter, 'to', config.currentCounter);
    }
    
    // Generate serial number with current counter
    const serialNo = generateSerialNumber(config);
    console.log('[SerialNumber] Generated serial number:', serialNo);
    
    // Increment counter for next use
    config.currentCounter += 1;
    console.log('[SerialNumber] Incrementing counter to:', config.currentCounter);
    
    // Save updated configuration
    await updateSerialNumberConfig(config);
    console.log('[SerialNumber] Serial number generated successfully:', serialNo);
    
    return serialNo;
  } catch (error) {
    console.error('[SerialNumber] Error generating next serial number:', error);
    throw error;
  }
};

/**
 * Preview serial number format without incrementing counter
 */
export const previewSerialNumber = (config: Partial<SerialNumberConfig>): string => {
  const fullConfig: SerialNumberConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  return generateSerialNumber(fullConfig);
};
