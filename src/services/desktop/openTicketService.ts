// Desktop Open Ticket Service - Uses Tauri SQLite Database
import { invoke } from '@tauri-apps/api/core';
import { OpenTicket } from '@/types/weighment';

/**
 * Get all open tickets from SQLite database
 */
export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM open_tickets ORDER BY created_at DESC',
      params: []
    });
    
    return results.map(row => ({
      id: row.id,
      ticketNo: row.ticket_no,
      vehicleNo: row.vehicle_no,
      partyName: row.party_name,
      productName: row.product_name,
      vehicleStatus: row.vehicle_status as 'load' | 'empty',
      grossWeight: row.gross_weight,
      tareWeight: row.tare_weight,
      firstWeightType: row.first_weight_type as 'gross' | 'tare',
      date: row.date,
      charges: row.charges || 0,
      capturedImage: row.captured_image,
      frontImage: row.front_image,
      rearImage: row.rear_image,
    }));
  } catch (error) {
    console.error('Error fetching open tickets from SQLite:', error);
    return [];
  }
};

/**
 * Save a new open ticket to SQLite database
 */
export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: `
        INSERT INTO open_tickets (
          id, ticket_no, vehicle_no, party_name, product_name, vehicle_status,
          gross_weight, tare_weight, first_weight_type, date, charges,
          captured_image, front_image, rear_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        ticket.id,
        ticket.ticketNo,
        ticket.vehicleNo,
        ticket.partyName,
        ticket.productName,
        ticket.vehicleStatus,
        ticket.grossWeight,
        ticket.tareWeight,
        ticket.firstWeightType,
        ticket.date,
        ticket.charges,
        ticket.capturedImage,
        ticket.frontImage,
        ticket.rearImage,
      ]
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving open ticket to SQLite:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Remove an open ticket from SQLite database
 */
export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: 'DELETE FROM open_tickets WHERE id = ?',
      params: [ticketId]
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing open ticket from SQLite:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Get a specific open ticket by ID from SQLite database
 */
export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  try {
    const results = await invoke<any[]>('execute_query', {
      query: 'SELECT * FROM open_tickets WHERE id = ?',
      params: [ticketId]
    });
    
    if (results.length === 0) return null;
    
    const row = results[0];
    return {
      id: row.id,
      ticketNo: row.ticket_no,
      vehicleNo: row.vehicle_no,
      partyName: row.party_name,
      productName: row.product_name,
      vehicleStatus: row.vehicle_status as 'load' | 'empty',
      grossWeight: row.gross_weight,
      tareWeight: row.tare_weight,
      firstWeightType: row.first_weight_type as 'gross' | 'tare',
      date: row.date,
      charges: row.charges || 0,
      capturedImage: row.captured_image,
      frontImage: row.front_image,
      rearImage: row.rear_image,
    };
  } catch (error) {
    console.error('Error fetching open ticket by ID from SQLite:', error);
    return null;
  }
};
