// Master Data Service Layer
// This service provides access to master data (vehicles, parties, products)
// Currently reads from mockData.ts
// FUTURE: Will be replaced with database queries (e.g., Supabase)

import { mockVehicles, mockParties, mockProducts, Vehicle, Party, Product } from '@/utils/mockData';

/**
 * Get all vehicles from master data
 * NOW: Returns mock data
 * FUTURE: Will query database - supabase.from('vehicles').select()
 */
export const getVehicles = (): Vehicle[] => {
  return mockVehicles;
};

/**
 * Get all parties from master data
 * NOW: Returns mock data
 * FUTURE: Will query database - supabase.from('parties').select()
 */
export const getParties = (): Party[] => {
  return mockParties;
};

/**
 * Get all products from master data
 * NOW: Returns mock data
 * FUTURE: Will query database - supabase.from('products').select()
 */
export const getProducts = (): Product[] => {
  return mockProducts;
};

/**
 * Get vehicle by vehicle number
 * NOW: Filters mock data
 * FUTURE: Will query database - supabase.from('vehicles').select().eq('vehicle_no', vehicleNo).single()
 */
export const getVehicleByNumber = (vehicleNo: string): Vehicle | undefined => {
  return mockVehicles.find(v => v.vehicleNo === vehicleNo);
};

/**
 * Get party by party name
 * NOW: Filters mock data
 * FUTURE: Will query database - supabase.from('parties').select().eq('party_name', partyName).single()
 */
export const getPartyByName = (partyName: string): Party | undefined => {
  return mockParties.find(p => p.partyName === partyName);
};

/**
 * Get product by product name
 * NOW: Filters mock data
 * FUTURE: Will query database - supabase.from('products').select().eq('product_name', productName).single()
 */
export const getProductByName = (productName: string): Product | undefined => {
  return mockProducts.find(p => p.productName === productName);
};
