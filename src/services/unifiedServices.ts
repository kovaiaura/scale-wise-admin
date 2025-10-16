// Desktop-Only Services - Direct SQLite via Tauri
// No API calls, no localStorage fallback, no mode switching

import { Bill, OpenTicket, StoredTare, BillStatus } from '@/types/weighment';
import { Vehicle, Party, Product } from '@/utils/mockData';

// Desktop services (Tauri SQLite only)
import * as desktopBillService from './desktop/billService';
import * as desktopOpenTicketService from './desktop/openTicketService';
import * as desktopStoredTareService from './desktop/storedTareService';
import * as desktopMasterDataService from './desktop/masterDataService';
import * as desktopSerialNumberService from './desktop/serialNumberService';

// ==================== BILL SERVICES ====================

export const getBills = async (): Promise<Bill[]> => {
  return desktopBillService.getBills();
};

export const saveBill = async (bill: Bill): Promise<{ success: boolean; error: string | null }> => {
  return desktopBillService.saveBill(bill);
};

export const updateBillStatus = async (billId: string, status: BillStatus): Promise<Bill | null> => {
  return desktopBillService.updateBillStatus(billId, status);
};

export const getBillById = async (billId: string): Promise<Bill | null> => {
  return desktopBillService.getBillById(billId);
};

export const getOpenBills = async (): Promise<Bill[]> => {
  return desktopBillService.getOpenBills();
};

export const getClosedBills = async (): Promise<Bill[]> => {
  return desktopBillService.getClosedBills();
};

export const searchBills = async (query: string): Promise<Bill[]> => {
  return desktopBillService.searchBills(query);
};

export const filterBillsByDateRange = async (startDate: string, endDate: string): Promise<Bill[]> => {
  return desktopBillService.filterBillsByDateRange(startDate, endDate);
};

// ==================== OPEN TICKET SERVICES ====================

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  return desktopOpenTicketService.getOpenTickets();
};

export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  return desktopOpenTicketService.saveOpenTicket(ticket);
};

export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  return desktopOpenTicketService.removeOpenTicket(ticketId);
};

export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  return desktopOpenTicketService.getOpenTicketById(ticketId);
};

// ==================== STORED TARE SERVICES ====================

export const getStoredTares = async (): Promise<StoredTare[]> => {
  return desktopStoredTareService.getStoredTares();
};

export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  return desktopStoredTareService.getStoredTareByVehicle(vehicleNo);
};

export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  return desktopStoredTareService.saveStoredTare(tare);
};

export const isTareExpired = (tare: StoredTare): boolean => {
  return desktopStoredTareService.isTareExpired(tare);
};

export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  return desktopStoredTareService.getValidStoredTare(vehicleNo);
};

export const getTareExpiryInfo = async (
  vehicleNo: string
): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  const tare = await desktopStoredTareService.getStoredTareByVehicle(vehicleNo);
  if (!tare) return null;
  return desktopStoredTareService.getTareExpiryInfo(tare);
};

// ==================== MASTER DATA SERVICES ====================

export const getVehicles = async (): Promise<Vehicle[]> => {
  return desktopMasterDataService.getVehicles();
};

export const getParties = async (): Promise<Party[]> => {
  return desktopMasterDataService.getParties();
};

export const getProducts = async (): Promise<Product[]> => {
  return desktopMasterDataService.getProducts();
};

export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  return desktopMasterDataService.getVehicleByNumber(vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  return desktopMasterDataService.getPartyByName(partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  return desktopMasterDataService.getProductByName(productName);
};

export const getNextSerialNo = async (): Promise<string> => {
  return desktopSerialNumberService.getNextSerialNumber();
};

// ==================== CAMERA SERVICES ====================

export const captureBothCameras = async (): Promise<{
  frontImage: string | null;
  rearImage: string | null;
  error: string | null;
}> => {
  // Desktop mode: return placeholder images
  return Promise.resolve({
    frontImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    rearImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    error: null,
  });
};

// ==================== SERIAL NUMBER SERVICES ====================

export const SerialNumberService = {
  getConfig: async () => {
    const config = await desktopSerialNumberService.getSerialNumberConfig();
    return { data: config, error: null };
  },

  updateConfig: async (config: desktopSerialNumberService.SerialNumberConfig & { resetCounterNow?: boolean }) => {
    const updatedConfig = await desktopSerialNumberService.updateSerialNumberConfig(config);
    return { data: updatedConfig, error: null };
  },

  getNext: async () => {
    const serialNo = await desktopSerialNumberService.getNextSerialNumber();
    return { data: { serialNo }, error: null };
  },

  previewFormat: async (config: Partial<desktopSerialNumberService.SerialNumberConfig>) => {
    const preview = desktopSerialNumberService.previewSerialNumber(config);
    return { data: { preview }, error: null };
  }
};
