// Stored Tare Service - API Integration
// Replaces localStorage-based tare management with Spring Boot API calls

import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { StoredTare } from '@/types/weighment';

/**
 * Get all stored tares
 */
export const getStoredTares = async (): Promise<StoredTare[]> => {
  const result = await apiRequest<StoredTare[]>({
    method: 'GET',
    url: API_ENDPOINTS.TARES,
  });

  return result.data || [];
};

/**
 * Get stored tare by vehicle number
 */
export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  const result = await apiRequest<StoredTare>({
    method: 'GET',
    url: API_ENDPOINTS.TARE_BY_VEHICLE(vehicleNo),
  });

  return result.data;
};

/**
 * Save or update stored tare
 */
export const saveStoredTare = async (
  tare: StoredTare
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<StoredTare>({
    method: 'POST',
    url: API_ENDPOINTS.TARES,
    data: tare,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

/**
 * Check if tare is expired (validity: 2 days)
 */
export const isTareExpired = (tare: StoredTare): boolean => {
  const tareDate = new Date(tare.storedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - tareDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 2;
};

/**
 * Get valid (non-expired) stored tare
 */
export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  const tare = await getStoredTareByVehicle(vehicleNo);
  if (!tare) return null;
  if (isTareExpired(tare)) return null;
  return tare;
};

/**
 * Get tare expiry information from backend
 */
export const getTareExpiryInfo = async (
  vehicleNo: string
): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  const result = await apiRequest<{
    isExpired: boolean;
    daysRemaining: number;
    expiryDate: string;
    hoursRemaining: number;
  }>({
    method: 'GET',
    url: API_ENDPOINTS.TARE_EXPIRY(vehicleNo),
  });

  return result.data;
};

/**
 * Update stored tare
 */
export const updateStoredTare = async (
  vehicleNo: string,
  tareData: Partial<StoredTare>
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<StoredTare>({
    method: 'PUT',
    url: API_ENDPOINTS.TARE_BY_VEHICLE(vehicleNo),
    data: tareData,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};
