// Desktop Serial Number Service - Uses Tauri SQLite Database and App Config
import { invoke } from '@tauri-apps/api/core';

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
    const configJson = await invoke<string | null>('execute_query', {
      query: 'SELECT value FROM app_config WHERE key = ?',
      params: ['serial_number_config']
    }).then(results => {
      if (Array.isArray(results) && results.length > 0) {
        return results[0].value;
      }
      return null;
    });

    if (configJson) {
      return JSON.parse(configJson);
    }
    
    // Initialize with default config if not found
    await updateSerialNumberConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error fetching serial number config:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Update serial number configuration in app config
 */
export const updateSerialNumberConfig = async (
  config: SerialNumberConfig & { resetCounterNow?: boolean }
): Promise<SerialNumberConfig> => {
  try {
    // Handle counter reset
    if (config.resetCounterNow) {
      config.currentCounter = config.counterStart;
      config.lastResetDate = new Date().toISOString();
    }

    const configToSave = { ...config };
    delete (configToSave as any).resetCounterNow;

    // Upsert configuration
    await invoke('execute_non_query', {
      query: `
        INSERT OR REPLACE INTO app_config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      params: ['serial_number_config', JSON.stringify(configToSave)]
    });

    return configToSave;
  } catch (error) {
    console.error('Error updating serial number config:', error);
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
    let config = await getSerialNumberConfig();
    
    // Check for auto-reset
    config = checkAndPerformAutoReset(config);
    
    // Generate serial number with current counter
    const serialNo = generateSerialNumber(config);
    
    // Increment counter for next use
    config.currentCounter += 1;
    
    // Save updated configuration
    await updateSerialNumberConfig(config);
    
    return serialNo;
  } catch (error) {
    console.error('Error generating next serial number:', error);
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
