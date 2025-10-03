// Open Ticket Service - API Integration
// Replaces localStorage-based ticket management with Spring Boot API calls

import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { OpenTicket } from '@/types/weighment';

/**
 * Get all open tickets
 */
export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  const result = await apiRequest<OpenTicket[]>({
    method: 'GET',
    url: API_ENDPOINTS.TICKETS_OPEN,
  });

  return result.data || [];
};

/**
 * Save a new open ticket
 */
export const saveOpenTicket = async (
  ticket: OpenTicket
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<OpenTicket>({
    method: 'POST',
    url: API_ENDPOINTS.TICKETS,
    data: ticket,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

/**
 * Remove (close) an open ticket
 */
export const removeOpenTicket = async (
  ticketId: string
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'DELETE',
    url: API_ENDPOINTS.TICKET_BY_ID(ticketId),
  });

  return {
    success: !result.error,
    error: result.error,
  };
};

/**
 * Get open ticket by ID
 */
export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  const result = await apiRequest<OpenTicket>({
    method: 'GET',
    url: API_ENDPOINTS.TICKET_BY_ID(ticketId),
  });

  return result.data;
};

/**
 * Close an open ticket with closure data
 */
export const closeOpenTicket = async (
  ticketId: string,
  closureData: {
    secondWeight: number;
    secondWeightType: 'Gross' | 'Tare';
    secondWeightDate: string;
    frontImage?: string | null;
    rearImage?: string | null;
  }
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'POST',
    url: API_ENDPOINTS.TICKET_CLOSE(ticketId),
    data: closureData,
  });

  return {
    success: !result.error,
    error: result.error,
  };
};
