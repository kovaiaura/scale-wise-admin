import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';

interface SerialNumberConfig {
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

interface SerialNumberConfigDTO extends SerialNumberConfig {
  resetCounterNow?: boolean;
}

/**
 * Get the next serial number
 */
export const getNextSerialNumber = async (): Promise<{ data: { serialNo: string } | null; error: string | null }> => {
  return await apiRequest<{ serialNo: string }>({
    method: 'GET',
    url: API_ENDPOINTS.SERIAL_NUMBER_NEXT,
  });
};

/**
 * Get current serial number configuration
 */
export const getSerialNumberConfig = async (): Promise<{ data: SerialNumberConfig | null; error: string | null }> => {
  return await apiRequest<SerialNumberConfig>({
    method: 'GET',
    url: API_ENDPOINTS.SERIAL_NUMBER_CONFIG,
  });
};

/**
 * Update serial number configuration
 */
export const updateSerialNumberConfig = async (
  config: SerialNumberConfigDTO
): Promise<{ data: SerialNumberConfig | null; error: string | null }> => {
  return await apiRequest<SerialNumberConfig>({
    method: 'PUT',
    url: API_ENDPOINTS.SERIAL_NUMBER_CONFIG,
    data: config,
  });
};

/**
 * Preview serial number format
 */
export const previewSerialNumber = async (
  config: Partial<SerialNumberConfig>
): Promise<{ data: { preview: string } | null; error: string | null }> => {
  return await apiRequest<{ preview: string }>({
    method: 'POST',
    url: API_ENDPOINTS.SERIAL_NUMBER_PREVIEW,
    data: config,
  });
};
