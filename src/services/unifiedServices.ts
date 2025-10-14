// Unified Services - Routes between API and localStorage based on development mode
// Checks localStorage 'developmentMode' flag to determine which service to use

import { Bill, OpenTicket, StoredTare, BillStatus } from '@/types/weighment';
import { Vehicle, Party, Product } from '@/utils/mockData';

// localStorage-based services (development mode)
import * as localBillService from './billService';
import * as localMasterService from './masterDataService';

// API-based services (production mode)
import * as apiBillService from './api/billService';
import * as apiMasterService from './api/masterDataService';
import * as apiOpenTicketService from './api/openTicketService';
import * as apiStoredTareService from './api/storedTareService';

/**
 * Check if offline mode is enabled (Desktop mode or localStorage fallback)
 */
const isOfflineMode = (): boolean => {
  // Check build mode first (highest priority)
  if (import.meta.env.VITE_APP_MODE === 'desktop') {
    return true;
  }
  if (import.meta.env.VITE_APP_MODE === 'online') {
    return false;
  }
  // Fallback to localStorage for development testing
  const saved = localStorage.getItem('developmentMode');
  return saved ? JSON.parse(saved) : false;
};

// ==================== BILL SERVICES ====================

export const getBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getBills());
  }
  return apiBillService.getBills();
};

export const saveBill = async (bill: Bill): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    localBillService.saveBill(bill);
    return Promise.resolve({ success: true, error: null });
  }
  return apiBillService.saveBill(bill);
};

export const updateBillStatus = async (billId: string, status: BillStatus): Promise<Bill | null> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.updateBillStatus(billId, status));
  }
  return apiBillService.updateBillStatus(billId, status);
};

export const getBillById = async (billId: string): Promise<Bill | null> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getBillById(billId));
  }
  return apiBillService.getBillById(billId);
};

export const getOpenBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getOpenBills());
  }
  return apiBillService.getOpenBills();
};

export const getClosedBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getClosedBills());
  }
  return apiBillService.getClosedBills();
};

export const searchBills = async (query: string): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.searchBills(query));
  }
  return apiBillService.searchBills(query);
};

export const filterBillsByDateRange = async (startDate: string, endDate: string): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.filterBillsByDateRange(startDate, endDate));
  }
  return apiBillService.filterBillsByDateRange(startDate, endDate);
};

// ==================== OPEN TICKET SERVICES ====================

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getOpenTickets());
  }
  return apiOpenTicketService.getOpenTickets();
};

export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    localBillService.saveOpenTicket(ticket);
    return Promise.resolve({ success: true, error: null });
  }
  return apiOpenTicketService.saveOpenTicket(ticket);
};

export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    localBillService.removeOpenTicket(ticketId);
    return Promise.resolve({ success: true, error: null });
  }
  return apiOpenTicketService.removeOpenTicket(ticketId);
};

export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getOpenTicketById(ticketId));
  }
  return apiOpenTicketService.getOpenTicketById(ticketId);
};

// ==================== STORED TARE SERVICES ====================

export const getStoredTares = async (): Promise<StoredTare[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getStoredTares());
  }
  return apiStoredTareService.getStoredTares();
};

export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getStoredTareByVehicle(vehicleNo));
  }
  return apiStoredTareService.getStoredTareByVehicle(vehicleNo);
};

export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    localBillService.saveStoredTare(tare);
    return Promise.resolve({ success: true, error: null });
  }
  return apiStoredTareService.saveStoredTare(tare);
};

export const isTareExpired = (tare: StoredTare): boolean => {
  if (isOfflineMode()) {
    return localBillService.isTareExpired(tare);
  }
  return apiStoredTareService.isTareExpired(tare);
};

export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getValidStoredTare(vehicleNo));
  }
  return apiStoredTareService.getValidStoredTare(vehicleNo);
};

export const getTareExpiryInfo = async (
  vehicleNo: string
): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  if (isOfflineMode()) {
    const tare = localBillService.getStoredTareByVehicle(vehicleNo);
    if (!tare) return null;
    return Promise.resolve(localBillService.getTareExpiryInfo(tare));
  }
  return apiStoredTareService.getTareExpiryInfo(vehicleNo);
};

// ==================== MASTER DATA SERVICES ====================

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getVehicles());
  }
  return apiMasterService.getVehicles();
};

export const getParties = async (): Promise<Party[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getParties());
  }
  return apiMasterService.getParties();
};

export const getProducts = async (): Promise<Product[]> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getProducts());
  }
  return apiMasterService.getProducts();
};

export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getVehicleByNumber(vehicleNo));
  }
  return apiMasterService.getVehicleByNumber(vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getPartyByName(partyName));
  }
  return apiMasterService.getPartyByName(partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  if (isOfflineMode()) {
    return Promise.resolve(localMasterService.getProductByName(productName));
  }
  return apiMasterService.getProductByName(productName);
};

export const getNextSerialNo = async (): Promise<string> => {
  if (isOfflineMode()) {
    return Promise.resolve(localBillService.getNextSerialNo());
  }
  return apiMasterService.getNextSerialNo();
};

// ==================== CAMERA SERVICES ====================

export const captureBothCameras = async (): Promise<{
  frontImage: string | null;
  rearImage: string | null;
  error: string | null;
}> => {
  if (isOfflineMode()) {
    // In offline mode, return placeholder images
    return Promise.resolve({
      frontImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      rearImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      error: null,
    });
  }
  
  // In production mode, use actual camera service
  const { captureBothCameras: apiCapture } = await import('./cameraService');
  return apiCapture();
};
