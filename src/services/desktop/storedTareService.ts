// Desktop Stored Tare Service - Uses Tauri SQLite Database
import { invoke } from '@tauri-apps/api/tauri';
import { StoredTare } from '@/types/weighment';

/**
 * Get all stored tares from SQLite database
 */
export const getStoredTares = async (): Promise<StoredTare[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM stored_tares ORDER BY created_at DESC',
      params: []
    });
    
    return results.map(row => ({
      vehicleNo: row.vehicle_no,
      tareWeight: row.tare_weight,
      storedAt: row.stored_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching stored tares from SQLite:', error);
    return [];
  }
};

/**
 * Get stored tare for a specific vehicle from SQLite database
 */
export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM stored_tares WHERE vehicle_no = ? ORDER BY created_at DESC LIMIT 1',
      params: [vehicleNo]
    });
    
    if (results.length === 0) return null;
    
    const row = results[0];
    return {
      vehicleNo: row.vehicle_no,
      tareWeight: row.tare_weight,
      storedAt: row.stored_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Error fetching stored tare by vehicle from SQLite:', error);
    return null;
  }
};

/**
 * Save a stored tare to SQLite database
 */
export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  try {
    // First, check if a tare already exists for this vehicle
    const existing = await getStoredTareByVehicle(tare.vehicleNo);
    
    if (existing) {
      // Update existing tare
      await invoke('execute_non_query', {
        query: `
          UPDATE stored_tares 
          SET tare_weight = ?, stored_at = ?, updated_at = ?
          WHERE vehicle_no = ?
        `,
        params: [
          tare.tareWeight,
          tare.storedAt,
          new Date().toISOString(),
          tare.vehicleNo,
        ]
      });
    } else {
      // Insert new tare
      await invoke('execute_non_query', {
        query: `
          INSERT INTO stored_tares (
            vehicle_no, tare_weight, stored_at, updated_at
          ) VALUES (?, ?, ?, ?)
        `,
        params: [
          tare.vehicleNo,
          tare.tareWeight,
          tare.storedAt,
          tare.updatedAt || new Date().toISOString(),
        ]
      });
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving stored tare to SQLite:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Get valid (non-expired) stored tare for a vehicle
 */
export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  const tare = await getStoredTareByVehicle(vehicleNo);
  if (!tare) return null;
  
  if (isTareExpired(tare)) return null;
  
  return tare;
};

/**
 * Check if a stored tare is expired (30 days expiry period)
 */
export const isTareExpired = (tare: StoredTare): boolean => {
  const storedDate = new Date(tare.storedAt);
  const now = new Date();
  const diffMs = now.getTime() - storedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 30; // 30 days expiry
};

/**
 * Get tare expiry information
 */
export const getTareExpiryInfo = (tare: StoredTare): {
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} => {
  const storedDate = new Date(tare.storedAt);
  const expiryDate = new Date(storedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  return {
    isExpired: diffMs < 0,
    daysRemaining: Math.max(0, diffDays),
    hoursRemaining: Math.max(0, diffHours),
    expiryDate: expiryDate.toISOString(),
  };
};
