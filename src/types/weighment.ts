// Complete data models for weighment system

export type BillStatus = 'OPEN' | 'CLOSED' | 'PRINTED';
export type WeightType = 'gross' | 'tare' | 'one-time';
export type VehicleStatus = 'load' | 'empty';
export type OperationType = 'new' | 'update' | 'stored-tare';

export interface Bill {
  id: string;
  billNo: string;
  ticketNo: string;
  vehicleNo: string;
  partyName: string;
  productName: string;
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  charges: number;
  capturedImage: string | null; // Deprecated - kept for backward compatibility
  frontImage: string | null;
  rearImage: string | null;
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
  firstWeightType: WeightType;
  firstVehicleStatus?: VehicleStatus;
  secondVehicleStatus?: VehicleStatus;
  secondWeightTimestamp?: string;
  closedAt?: string;
  printedAt?: string;
  remarks?: string;
}

export interface OpenTicket {
  id: string;
  ticketNo: string;
  vehicleNo: string;
  partyName: string;
  productName: string;
  vehicleStatus: VehicleStatus;
  grossWeight: number | null;
  tareWeight: number | null;
  firstWeightType: 'gross' | 'tare';
  date: string;
  charges: number;
  capturedImage: string | null; // Deprecated - kept for backward compatibility
  frontImage: string | null;
  rearImage: string | null;
}

export interface StoredTare {
  vehicleNo: string;
  tareWeight: number;
  storedAt: string;
  updatedAt: string;
}

export interface WeighmentTransaction {
  id: string;
  serialNo: string;
  operationType: OperationType;
  vehicleNo: string;
  partyName: string;
  productName: string;
  weight: number;
  weightType: WeightType;
  timestamp: string;
  billId?: string;
  ticketId?: string;
}
