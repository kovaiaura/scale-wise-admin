// Desktop Bill Service - Tauri Commands
// Replaces HTTP API calls with SQLite database operations via Tauri

import { invoke } from '@tauri-apps/api/tauri';
import { Bill, BillStatus } from '@/types/weighment';

// Verify Tauri is available before any operation
function checkTauriAvailable(): void {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    const error = '❌ Tauri API not available! This app only works as a compiled desktop application.';
    console.error(error);
    throw new Error(error);
  }
}

/**
 * Get all bills from SQLite database
 */
export const getBills = async (): Promise<Bill[]> => {
  checkTauriAvailable();
  
  try {
    console.log('📊 [Desktop BillService] Fetching bills from SQLite...');
    
    const bills = await invoke<Bill[]>('execute_query', {
      query: `SELECT 
        id, bill_no as billNo, ticket_no as ticketNo,
        vehicle_no as vehicleNo, party_name as partyName,
        product_name as productName, gross_weight as grossWeight,
        tare_weight as tareWeight, net_weight as netWeight,
        charges, front_camera_image as frontImage,
        back_camera_image as rearImage, status,
        created_at as createdAt, updated_at as updatedAt,
        first_weight_type as firstWeightType,
        first_vehicle_status as firstVehicleStatus,
        second_vehicle_status as secondVehicleStatus,
        second_weight_timestamp as secondWeightTimestamp,
        closed_at as closedAt, printed_at as printedAt
      FROM weighments ORDER BY created_at DESC`,
      params: []
    });
    
    console.log(`✅ [Desktop BillService] Retrieved ${bills.length} bills`);
    
    return bills.map(bill => ({
      ...bill,
      capturedImage: null, // Deprecated field
    }));
  } catch (error) {
    console.error('❌ [Desktop BillService] Failed to get bills:', error);
    throw error;
  }
};

/**
 * Save a new bill to SQLite database
 */
export const saveBill = async (bill: Bill): Promise<{ success: boolean; error: string | null }> => {
  checkTauriAvailable();
  
  try {
    console.log('💾 [Desktop BillService] Saving bill:', bill.billNo);
    
    await invoke('execute_non_query', {
      query: `INSERT INTO weighments (
        id, bill_no, ticket_no, vehicle_no, party_name, product_name,
        gross_weight, tare_weight, net_weight, charges,
        front_camera_image, back_camera_image, status,
        first_weight_type, first_vehicle_status, second_vehicle_status,
        second_weight_timestamp, created_at, updated_at, closed_at, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        bill.id,
        bill.billNo,
        bill.ticketNo,
        bill.vehicleNo,
        bill.partyName,
        bill.productName,
        bill.grossWeight,
        bill.tareWeight,
        bill.netWeight,
        bill.charges,
        bill.frontImage,
        bill.rearImage,
        bill.status,
        bill.firstWeightType,
        bill.firstVehicleStatus || null,
        bill.secondVehicleStatus || null,
        bill.secondWeightTimestamp || null,
        bill.createdAt,
        bill.updatedAt,
        bill.closedAt || null,
        bill.remarks || null
      ]
    });
    
    console.log('✅ [Desktop BillService] Bill saved successfully:', bill.billNo);
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ [Desktop BillService] Failed to save bill:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Update bill status
 */
export const updateBillStatus = async (
  billId: string,
  status: BillStatus
): Promise<Bill | null> => {
  try {
    const now = new Date().toISOString();
    
    await invoke('execute_non_query', {
      query: `UPDATE weighments 
              SET status = ?, updated_at = ?,
                  ${status === 'CLOSED' ? 'closed_at = ?' : ''}
                  ${status === 'PRINTED' ? 'printed_at = ?' : ''}
              WHERE id = ?`,
      params: status === 'CLOSED' 
        ? [status, now, now, billId]
        : status === 'PRINTED'
        ? [status, now, now, billId]
        : [status, now, billId]
    });
    
    return await getBillById(billId);
  } catch (error) {
    console.error('Failed to update bill status:', error);
    return null;
  }
};

/**
 * Get bill by ID
 */
export const getBillById = async (billId: string): Promise<Bill | null> => {
  try {
    const bills = await invoke<Bill[]>('execute_query', {
      query: `SELECT 
        id, bill_no as billNo, ticket_no as ticketNo,
        vehicle_no as vehicleNo, party_name as partyName,
        product_name as productName, gross_weight as grossWeight,
        tare_weight as tareWeight, net_weight as netWeight,
        charges, front_camera_image as frontImage,
        back_camera_image as rearImage, status,
        created_at as createdAt, updated_at as updatedAt,
        first_weight_type as firstWeightType,
        first_vehicle_status as firstVehicleStatus,
        second_vehicle_status as secondVehicleStatus,
        second_weight_timestamp as secondWeightTimestamp,
        closed_at as closedAt, printed_at as printedAt
      FROM weighments WHERE id = ? LIMIT 1`,
      params: [billId]
    });
    
    if (bills.length === 0) return null;
    
    return {
      ...bills[0],
      capturedImage: null, // Deprecated field
    };
  } catch (error) {
    console.error('Failed to get bill by ID:', error);
    return null;
  }
};

/**
 * Get open bills (status = OPEN)
 */
export const getOpenBills = async (): Promise<Bill[]> => {
  const bills = await getBills();
  return bills.filter(bill => bill.status === 'OPEN');
};

/**
 * Get closed bills (status = CLOSED or PRINTED)
 */
export const getClosedBills = async (): Promise<Bill[]> => {
  const bills = await getBills();
  return bills.filter(bill => bill.status === 'CLOSED' || bill.status === 'PRINTED');
};

/**
 * Search bills by query
 */
export const searchBills = async (query: string): Promise<Bill[]> => {
  try {
    const searchTerm = `%${query}%`;
    const bills = await invoke<Bill[]>('execute_query', {
      query: `SELECT 
        id, bill_no as billNo, ticket_no as ticketNo,
        vehicle_no as vehicleNo, party_name as partyName,
        product_name as productName, gross_weight as grossWeight,
        tare_weight as tareWeight, net_weight as netWeight,
        charges, front_camera_image as frontImage,
        back_camera_image as rearImage, status,
        created_at as createdAt, updated_at as updatedAt,
        first_weight_type as firstWeightType,
        first_vehicle_status as firstVehicleStatus,
        second_vehicle_status as secondVehicleStatus,
        second_weight_timestamp as secondWeightTimestamp,
        closed_at as closedAt, printed_at as printedAt
      FROM weighments 
      WHERE vehicle_no LIKE ? OR party_name LIKE ? 
         OR product_name LIKE ? OR bill_no LIKE ?
      ORDER BY created_at DESC`,
      params: [searchTerm, searchTerm, searchTerm, searchTerm]
    });
    
    return bills.map(bill => ({
      ...bill,
      capturedImage: null,
    }));
  } catch (error) {
    console.error('Failed to search bills:', error);
    return [];
  }
};

/**
 * Filter bills by date range
 */
export const filterBillsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Bill[]> => {
  try {
    const bills = await invoke<Bill[]>('execute_query', {
      query: `SELECT 
        id, bill_no as billNo, ticket_no as ticketNo,
        vehicle_no as vehicleNo, party_name as partyName,
        product_name as productName, gross_weight as grossWeight,
        tare_weight as tareWeight, net_weight as netWeight,
        charges, front_camera_image as frontImage,
        back_camera_image as rearImage, status,
        created_at as createdAt, updated_at as updatedAt,
        first_weight_type as firstWeightType,
        first_vehicle_status as firstVehicleStatus,
        second_vehicle_status as secondVehicleStatus,
        second_weight_timestamp as secondWeightTimestamp,
        closed_at as closedAt, printed_at as printedAt
      FROM weighments 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC`,
      params: [startDate, endDate]
    });
    
    return bills.map(bill => ({
      ...bill,
      capturedImage: null,
    }));
  } catch (error) {
    console.error('Failed to filter bills by date range:', error);
    return [];
  }
};
