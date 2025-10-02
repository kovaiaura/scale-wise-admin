// Dynamic Data Service Layer
// This service extracts unique values from bills (walk-in entries)
// Currently reads from localStorage via billService
// FUTURE: Will use SQL queries for unique values from database

import { getBills } from './billService';

export interface DynamicVehicle {
  id: string;
  vehicleNo: string;
  source: 'walk-in';
}

export interface DynamicParty {
  id: string;
  partyName: string;
  source: 'walk-in';
}

export interface DynamicProduct {
  id: string;
  productName: string;
  source: 'walk-in';
}

/**
 * Get unique vehicle numbers from all bills
 * NOW: Extracts from localStorage bills
 * FUTURE: Will use SQL - SELECT DISTINCT vehicle_no FROM bills
 */
export const getUniqueVehiclesFromBills = (): DynamicVehicle[] => {
  const bills = getBills();
  const uniqueVehicleNos = [...new Set(bills.map(b => b.vehicleNo))];
  
  return uniqueVehicleNos.map(vehicleNo => ({
    id: `bill-vehicle-${vehicleNo}`,
    vehicleNo,
    source: 'walk-in' as const,
  }));
};

/**
 * Get unique party names from all bills
 * NOW: Extracts from localStorage bills
 * FUTURE: Will use SQL - SELECT DISTINCT party_name FROM bills
 */
export const getUniquePartiesFromBills = (): DynamicParty[] => {
  const bills = getBills();
  const uniquePartyNames = [...new Set(bills.map(b => b.partyName))];
  
  return uniquePartyNames.map(partyName => ({
    id: `bill-party-${partyName}`,
    partyName,
    source: 'walk-in' as const,
  }));
};

/**
 * Get unique product names from all bills
 * NOW: Extracts from localStorage bills
 * FUTURE: Will use SQL - SELECT DISTINCT product_name FROM bills
 */
export const getUniqueProductsFromBills = (): DynamicProduct[] => {
  const bills = getBills();
  const uniqueProductNames = [...new Set(bills.map(b => b.productName))];
  
  return uniqueProductNames.map(productName => ({
    id: `bill-product-${productName}`,
    productName,
    source: 'walk-in' as const,
  }));
};
