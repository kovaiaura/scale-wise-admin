// Bill Service - API Integration
// Replaces localStorage-based bill management with Spring Boot API calls

import { apiClient, apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { Bill, BillStatus } from '@/types/weighment';

/**
 * Get all bills
 */
export const getBills = async (): Promise<Bill[]> => {
  const result = await apiRequest<Bill[]>({
    method: 'GET',
    url: API_ENDPOINTS.BILLS,
  });

  return result.data || [];
};

/**
 * Save a new bill
 */
export const saveBill = async (bill: Bill): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<Bill>({
    method: 'POST',
    url: API_ENDPOINTS.BILLS,
    data: bill,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

/**
 * Update bill status
 */
export const updateBillStatus = async (
  billId: string,
  status: BillStatus
): Promise<Bill | null> => {
  const result = await apiRequest<Bill>({
    method: 'PATCH',
    url: API_ENDPOINTS.BILL_BY_ID(billId),
    data: { status },
  });

  return result.data;
};

/**
 * Get bill by ID
 */
export const getBillById = async (billId: string): Promise<Bill | null> => {
  const result = await apiRequest<Bill>({
    method: 'GET',
    url: API_ENDPOINTS.BILL_BY_ID(billId),
  });

  return result.data;
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
 * Search bills by query (vehicle, party, product, billNo)
 */
export const searchBills = async (query: string): Promise<Bill[]> => {
  const result = await apiRequest<Bill[]>({
    method: 'GET',
    url: API_ENDPOINTS.BILLS_SEARCH,
    params: { q: query },
  });

  return result.data || [];
};

/**
 * Filter bills by date range
 */
export const filterBillsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Bill[]> => {
  const result = await apiRequest<Bill[]>({
    method: 'GET',
    url: API_ENDPOINTS.BILLS,
    params: { startDate, endDate },
  });

  return result.data || [];
};
