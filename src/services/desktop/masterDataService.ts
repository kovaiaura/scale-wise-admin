// Desktop Master Data Service - Uses Tauri SQLite Database
import { invoke } from '@tauri-apps/api/tauri';
import { Vehicle, Party, Product } from '@/utils/mockData';
import * as serialNumberService from './serialNumberService';

/**
 * Get all vehicles from SQLite database
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM vehicles ORDER BY vehicle_no',
      params: []
    });
    
    return results.map(row => ({
      id: row.id,
      vehicleNo: row.vehicle_no,
      vehicleType: row.vehicle_type || '',
      capacity: row.capacity || 0,
      ownerName: row.owner_name || '',
      contactNo: row.contact_no || '',
      tareWeight: row.tare_weight,
    }));
  } catch (error) {
    console.error('Error fetching vehicles from SQLite:', error);
    return [];
  }
};

/**
 * Get all parties from SQLite database
 */
export const getParties = async (): Promise<Party[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM parties ORDER BY party_name',
      params: []
    });
    
    return results.map(row => ({
      id: row.id,
      partyName: row.party_name,
      contactPerson: row.contact_person || '',
      contactNo: row.contact_no || '',
      email: row.email || '',
      address: row.address || '',
    }));
  } catch (error) {
    console.error('Error fetching parties from SQLite:', error);
    return [];
  }
};

/**
 * Get all products from SQLite database
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM products ORDER BY product_name',
      params: []
    });
    
    return results.map(row => ({
      id: row.id,
      productName: row.product_name,
      category: row.category || '',
      unit: row.unit || 'KG',
    }));
  } catch (error) {
    console.error('Error fetching products from SQLite:', error);
    return [];
  }
};

/**
 * Get vehicle by vehicle number from SQLite database
 */
export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM vehicles WHERE vehicle_no = ?',
      params: [vehicleNo]
    });
    
    if (results.length === 0) return undefined;
    
    const row = results[0];
    return {
      id: row.id,
      vehicleNo: row.vehicle_no,
      vehicleType: row.vehicle_type || '',
      capacity: row.capacity || 0,
      ownerName: row.owner_name || '',
      contactNo: row.contact_no || '',
      tareWeight: row.tare_weight,
    };
  } catch (error) {
    console.error('Error fetching vehicle by number from SQLite:', error);
    return undefined;
  }
};

/**
 * Get party by party name from SQLite database
 */
export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM parties WHERE party_name = ?',
      params: [partyName]
    });
    
    if (results.length === 0) return undefined;
    
    const row = results[0];
    return {
      id: row.id,
      partyName: row.party_name,
      contactPerson: row.contact_person || '',
      contactNo: row.contact_no || '',
      email: row.email || '',
      address: row.address || '',
    };
  } catch (error) {
    console.error('Error fetching party by name from SQLite:', error);
    return undefined;
  }
};

/**
 * Get product by product name from SQLite database
 */
export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM products WHERE product_name = ?',
      params: [productName]
    });
    
    if (results.length === 0) return undefined;
    
    const row = results[0];
    return {
      id: row.id,
      productName: row.product_name,
      category: row.category || '',
      unit: row.unit || 'KG',
    };
  } catch (error) {
    console.error('Error fetching product by name from SQLite:', error);
    return undefined;
  }
};

/**
 * Get unique vehicles from bills (for autocomplete)
 */
export const getUniqueVehiclesFromBills = async (): Promise<string[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT DISTINCT vehicle_no FROM bills WHERE vehicle_no IS NOT NULL ORDER BY vehicle_no',
      params: []
    });
    
    return results.map(row => row.vehicle_no);
  } catch (error) {
    console.error('Error fetching unique vehicles from bills:', error);
    return [];
  }
};

/**
 * Get unique parties from bills (for autocomplete)
 */
export const getUniquePartiesFromBills = async (): Promise<string[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT DISTINCT party_name FROM bills WHERE party_name IS NOT NULL ORDER BY party_name',
      params: []
    });
    
    return results.map(row => row.party_name);
  } catch (error) {
    console.error('Error fetching unique parties from bills:', error);
    return [];
  }
};

/**
 * Get unique products from bills (for autocomplete)
 */
export const getUniqueProductsFromBills = async (): Promise<string[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT DISTINCT product_name FROM bills WHERE product_name IS NOT NULL ORDER BY product_name',
      params: []
    });
    
    return results.map(row => row.product_name);
  } catch (error) {
    console.error('Error fetching unique products from bills:', error);
    return [];
  }
};

/**
 * Get next serial number (delegates to serial number service)
 */
export const getNextSerialNo = async (): Promise<string> => {
  return serialNumberService.getNextSerialNumber();
};
