// Master Data Service - API Integration
// Replaces mock data with Spring Boot API calls for vehicles, parties, products

import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { Vehicle, Party, Product } from '@/utils/mockData';

/**
 * Get all vehicles from backend
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  const result = await apiRequest<Vehicle[]>({
    method: 'GET',
    url: API_ENDPOINTS.VEHICLES,
  });

  return result.data || [];
};

/**
 * Get all parties from backend
 */
export const getParties = async (): Promise<Party[]> => {
  const result = await apiRequest<Party[]>({
    method: 'GET',
    url: API_ENDPOINTS.PARTIES,
  });

  return result.data || [];
};

/**
 * Get all products from backend
 */
export const getProducts = async (): Promise<Product[]> => {
  const result = await apiRequest<Product[]>({
    method: 'GET',
    url: API_ENDPOINTS.PRODUCTS,
  });

  return result.data || [];
};

/**
 * Get vehicle by vehicle number
 */
export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  const vehicles = await getVehicles();
  return vehicles.find(v => v.vehicleNo === vehicleNo);
};

/**
 * Get party by party name
 */
export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  const parties = await getParties();
  return parties.find(p => p.partyName === partyName);
};

/**
 * Get product by product name
 */
export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  const products = await getProducts();
  return products.find(p => p.productName === productName);
};

/**
 * Get next serial number from backend
 */
export const getNextSerialNo = async (): Promise<string> => {
  const result = await apiRequest<{ serialNo: string }>({
    method: 'GET',
    url: API_ENDPOINTS.SERIAL_NUMBER_NEXT,
  });

  return result.data?.serialNo || '00001';
};
