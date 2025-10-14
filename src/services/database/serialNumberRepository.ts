import { getConfig, setConfig } from './connection';

export interface SerialNumberConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  yearFormat: 'YYYY' | 'YY';
  counterStart: number;
  counterPadding: number;
  currentCounter: number;
  resetFrequency: 'yearly' | 'monthly' | 'never';
  lastResetDate?: string;
}

const DEFAULT_CONFIG: SerialNumberConfig = {
  prefix: 'WB',
  separator: '-',
  includeYear: true,
  includeMonth: false,
  yearFormat: 'YYYY',
  counterStart: 1,
  counterPadding: 3,
  currentCounter: 1,
  resetFrequency: 'yearly',
  lastResetDate: undefined,
};

/**
 * Get serial number configuration from database
 */
export const getSerialNumberConfig = async (): Promise<SerialNumberConfig> => {
  const configJson = await getConfig('serial_number_config');
  if (configJson) {
    return JSON.parse(configJson);
  }
  return DEFAULT_CONFIG;
};

/**
 * Update serial number configuration
 */
export const updateSerialNumberConfig = async (
  config: SerialNumberConfig & { resetCounterNow?: boolean }
): Promise<SerialNumberConfig> => {
  const { resetCounterNow, ...configToSave } = config;
  
  // If reset requested, set counter to start value
  if (resetCounterNow) {
    configToSave.currentCounter = configToSave.counterStart;
    configToSave.lastResetDate = new Date().toISOString();
  }
  
  await setConfig('serial_number_config', JSON.stringify(configToSave));
  return configToSave;
};

/**
 * Check if auto-reset is needed based on date and frequency
 */
const checkAndPerformAutoReset = async (config: SerialNumberConfig): Promise<SerialNumberConfig> => {
  if (config.resetFrequency === 'never' || !config.lastResetDate) {
    return config;
  }

  const now = new Date();
  const lastReset = new Date(config.lastResetDate);
  let shouldReset = false;

  if (config.resetFrequency === 'yearly') {
    // Reset if year has changed
    shouldReset = now.getFullYear() > lastReset.getFullYear();
  } else if (config.resetFrequency === 'monthly') {
    // Reset if month or year has changed
    shouldReset = 
      now.getFullYear() > lastReset.getFullYear() ||
      (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
  }

  if (shouldReset) {
    config.currentCounter = config.counterStart;
    config.lastResetDate = now.toISOString();
    await setConfig('serial_number_config', JSON.stringify(config));
  }

  return config;
};

/**
 * Generate serial number string based on configuration
 */
const generateSerialNumber = (config: SerialNumberConfig): string => {
  const now = new Date();
  const year = config.yearFormat === 'YY' 
    ? String(now.getFullYear()).slice(-2) 
    : String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const counter = String(config.currentCounter).padStart(config.counterPadding, '0');

  let serialNumber = config.prefix;
  
  if (config.includeYear) {
    serialNumber += config.separator + year;
  }
  
  if (config.includeMonth) {
    serialNumber += config.separator + month;
  }
  
  serialNumber += config.separator + counter;

  return serialNumber;
};

/**
 * Get the next serial number (generates and increments counter)
 */
export const getNextSerialNumber = async (): Promise<string> => {
  let config = await getSerialNumberConfig();
  
  // Check if auto-reset is needed
  config = await checkAndPerformAutoReset(config);
  
  // Generate the serial number
  const serialNumber = generateSerialNumber(config);
  
  // Increment counter and save
  config.currentCounter += 1;
  if (!config.lastResetDate) {
    config.lastResetDate = new Date().toISOString();
  }
  await setConfig('serial_number_config', JSON.stringify(config));
  
  return serialNumber;
};

/**
 * Reset counter to starting value
 */
export const resetSerialNumberCounter = async (): Promise<SerialNumberConfig> => {
  const config = await getSerialNumberConfig();
  config.currentCounter = config.counterStart;
  config.lastResetDate = new Date().toISOString();
  await setConfig('serial_number_config', JSON.stringify(config));
  return config;
};
