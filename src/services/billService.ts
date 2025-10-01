import { Bill, OpenTicket, StoredTare, BillStatus } from '@/types/weighment';

const BILLS_KEY = 'weighment_bills';
const OPEN_TICKETS_KEY = 'open_tickets';
const STORED_TARES_KEY = 'stored_tares';
const SERIAL_NO_KEY = 'lastSerialNo';

// Bill Management
export const getBills = (): Bill[] => {
  const data = localStorage.getItem(BILLS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBill = (bill: Bill): void => {
  const bills = getBills();
  bills.push(bill);
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
};

export const updateBillStatus = (billId: string, status: BillStatus): Bill | null => {
  const bills = getBills();
  const billIndex = bills.findIndex(b => b.id === billId);
  
  if (billIndex === -1) return null;
  
  bills[billIndex].status = status;
  bills[billIndex].updatedAt = new Date().toISOString();
  
  if (status === 'CLOSED') {
    bills[billIndex].closedAt = new Date().toISOString();
  } else if (status === 'PRINTED') {
    bills[billIndex].printedAt = new Date().toISOString();
  }
  
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  return bills[billIndex];
};

export const getBillById = (billId: string): Bill | null => {
  const bills = getBills();
  return bills.find(b => b.id === billId) || null;
};

export const getOpenBills = (): Bill[] => {
  return getBills().filter(b => b.status === 'OPEN');
};

export const getClosedBills = (): Bill[] => {
  return getBills().filter(b => b.status === 'CLOSED' || b.status === 'PRINTED');
};

// Open Tickets Management
export const getOpenTickets = (): OpenTicket[] => {
  const data = localStorage.getItem(OPEN_TICKETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOpenTicket = (ticket: OpenTicket): void => {
  const tickets = getOpenTickets();
  tickets.push(ticket);
  localStorage.setItem(OPEN_TICKETS_KEY, JSON.stringify(tickets));
};

export const removeOpenTicket = (ticketId: string): void => {
  const tickets = getOpenTickets();
  const filtered = tickets.filter(t => t.id !== ticketId);
  localStorage.setItem(OPEN_TICKETS_KEY, JSON.stringify(filtered));
};

export const getOpenTicketById = (ticketId: string): OpenTicket | null => {
  const tickets = getOpenTickets();
  return tickets.find(t => t.id === ticketId) || null;
};

// Stored Tare Management
export const getStoredTares = (): StoredTare[] => {
  const data = localStorage.getItem(STORED_TARES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getStoredTareByVehicle = (vehicleNo: string): StoredTare | null => {
  const tares = getStoredTares();
  return tares.find(t => t.vehicleNo === vehicleNo) || null;
};

export const saveStoredTare = (tare: StoredTare): void => {
  const tares = getStoredTares();
  const existingIndex = tares.findIndex(t => t.vehicleNo === tare.vehicleNo);
  
  if (existingIndex >= 0) {
    tares[existingIndex] = tare;
  } else {
    tares.push(tare);
  }
  
  localStorage.setItem(STORED_TARES_KEY, JSON.stringify(tares));
};

// Serial Number Management
export const getNextSerialNo = (): string => {
  const lastSerialNo = localStorage.getItem(SERIAL_NO_KEY);
  const year = new Date().getFullYear().toString();
  
  if (lastSerialNo) {
    const parts = lastSerialNo.split('-');
    const lastYear = parts[1];
    
    if (lastYear === year) {
      const lastNumber = parseInt(parts[2]);
      return `WB-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    }
  }
  
  return `WB-${year}-001`;
};

export const updateSerialNo = (serialNo: string): void => {
  localStorage.setItem(SERIAL_NO_KEY, serialNo);
};

// Search and Filter
export const searchBills = (query: string): Bill[] => {
  const bills = getBills();
  const lowerQuery = query.toLowerCase();
  
  return bills.filter(bill => 
    bill.billNo.toLowerCase().includes(lowerQuery) ||
    bill.vehicleNo.toLowerCase().includes(lowerQuery) ||
    bill.partyName.toLowerCase().includes(lowerQuery) ||
    bill.productName.toLowerCase().includes(lowerQuery)
  );
};

export const filterBillsByDateRange = (startDate: string, endDate: string): Bill[] => {
  const bills = getBills();
  return bills.filter(bill => {
    const billDate = new Date(bill.createdAt);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return billDate >= start && billDate <= end;
  });
};
