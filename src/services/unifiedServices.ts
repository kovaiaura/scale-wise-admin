// Unified Services - Routes between API and localStorage based on development mode
// Checks localStorage 'developmentMode' flag to determine which service to use

import { Bill, OpenTicket, StoredTare, BillStatus } from '@/types/weighment';
import { Vehicle, Party, Product } from '@/utils/mockData';

// localStorage-based services (development mode)
import * as localBillService from './billService';
import * as localMasterService from './masterDataService';

// Desktop mode services (Tauri SQLite)
import * as desktopBillService from './desktop/billService';
import * as desktopOpenTicketService from './desktop/openTicketService';
import * as desktopStoredTareService from './desktop/storedTareService';
import * as desktopMasterDataService from './desktop/masterDataService';
import * as desktopSerialNumberService from './desktop/serialNumberService';

// API-based services (production mode)
import * as apiBillService from './api/billService';
import * as apiMasterService from './api/masterDataService';
import * as apiOpenTicketService from './api/openTicketService';
import * as apiStoredTareService from './api/storedTareService';
import * as apiSerialNumberService from './api/serialNumberService';


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
    return desktopBillService.getBills();
  }
  return apiBillService.getBills();
};

export const saveBill = async (bill: Bill): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopBillService.saveBill(bill);
  }
  return apiBillService.saveBill(bill);
};

export const updateBillStatus = async (billId: string, status: BillStatus): Promise<Bill | null> => {
  if (isOfflineMode()) {
    return desktopBillService.updateBillStatus(billId, status);
  }
  return apiBillService.updateBillStatus(billId, status);
};

export const getBillById = async (billId: string): Promise<Bill | null> => {
  if (isOfflineMode()) {
    return desktopBillService.getBillById(billId);
  }
  return apiBillService.getBillById(billId);
};

export const getOpenBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return desktopBillService.getOpenBills();
  }
  return apiBillService.getOpenBills();
};

export const getClosedBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return desktopBillService.getClosedBills();
  }
  return apiBillService.getClosedBills();
};

export const searchBills = async (query: string): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return desktopBillService.searchBills(query);
  }
  return apiBillService.searchBills(query);
};

export const filterBillsByDateRange = async (startDate: string, endDate: string): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return desktopBillService.filterBillsByDateRange(startDate, endDate);
  }
  return apiBillService.filterBillsByDateRange(startDate, endDate);
};

// ==================== OPEN TICKET SERVICES ====================

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.getOpenTickets();
  }
  return apiOpenTicketService.getOpenTickets();
};

export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.saveOpenTicket(ticket);
  }
  return apiOpenTicketService.saveOpenTicket(ticket);
};

export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.removeOpenTicket(ticketId);
  }
  return apiOpenTicketService.removeOpenTicket(ticketId);
};

export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.getOpenTicketById(ticketId);
  }
  return apiOpenTicketService.getOpenTicketById(ticketId);
};

// ==================== STORED TARE SERVICES ====================

export const getStoredTares = async (): Promise<StoredTare[]> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getStoredTares();
  }
  return apiStoredTareService.getStoredTares();
};

export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getStoredTareByVehicle(vehicleNo);
  }
  return apiStoredTareService.getStoredTareByVehicle(vehicleNo);
};

export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.saveStoredTare(tare);
  }
  return apiStoredTareService.saveStoredTare(tare);
};

export const isTareExpired = (tare: StoredTare): boolean => {
  return desktopStoredTareService.isTareExpired(tare);
};

export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getValidStoredTare(vehicleNo);
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
    const tare = await desktopStoredTareService.getStoredTareByVehicle(vehicleNo);
    if (!tare) return null;
    return desktopStoredTareService.getTareExpiryInfo(tare);
  }
  return apiStoredTareService.getTareExpiryInfo(vehicleNo);
};

// ==================== MASTER DATA SERVICES ====================

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getVehicles();
  }
  return apiMasterService.getVehicles();
};

export const getParties = async (): Promise<Party[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getParties();
  }
  return apiMasterService.getParties();
};

export const getProducts = async (): Promise<Product[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getProducts();
  }
  return apiMasterService.getProducts();
};

export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getVehicleByNumber(vehicleNo);
  }
  return apiMasterService.getVehicleByNumber(vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getPartyByName(partyName);
  }
  return apiMasterService.getPartyByName(partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getProductByName(productName);
  }
  return apiMasterService.getProductByName(productName);
};

export const getNextSerialNo = async (): Promise<string> => {
  if (isOfflineMode()) {
    return desktopSerialNumberService.getNextSerialNumber();
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

// ==================== SERIAL NUMBER SERVICES ====================

export const SerialNumberService = {
  getConfig: async () => {
    if (isOfflineMode()) {
      const config = await desktopSerialNumberService.getSerialNumberConfig();
      return { data: config, error: null };
    } else {
      return await apiSerialNumberService.getSerialNumberConfig();
    }
  },

  updateConfig: async (config: desktopSerialNumberService.SerialNumberConfig & { resetCounterNow?: boolean }) => {
    if (isOfflineMode()) {
      const updatedConfig = await desktopSerialNumberService.updateSerialNumberConfig(config);
      return { data: updatedConfig, error: null };
    } else {
      return await apiSerialNumberService.updateSerialNumberConfig(config);
    }
  },

  getNext: async () => {
    if (isOfflineMode()) {
      const serialNo = await desktopSerialNumberService.getNextSerialNumber();
      return { data: { serialNo }, error: null };
    } else {
      return await apiSerialNumberService.getNextSerialNumber();
    }
  },

  previewFormat: async (config: Partial<desktopSerialNumberService.SerialNumberConfig>) => {
    if (isOfflineMode()) {
      const preview = desktopSerialNumberService.previewSerialNumber(config);
      return { data: { preview }, error: null };
    } else {
      return await apiSerialNumberService.previewSerialNumber(config);
    }
  }
};
