export interface WeighmentTicket {
  id: string;
  ticketNo: string;
  vehicleNo: string;
  partyName: string;
  productName: string;
  containerType: 'Load' | 'Empty';
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'in-progress';
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  vehicleType: string;
  capacity: number;
  ownerName: string;
  contactNo: string;
  tareWeight?: number; // Optional: Default tare weight for regular vehicles
}

export interface Party {
  id: string;
  partyName: string;
  contactPerson: string;
  contactNo: string;
  email: string;
  address: string;
}

export interface Product {
  id: string;
  productName: string;
  category: string;
  unit: string;
}

export const mockTickets: WeighmentTicket[] = [
  {
    id: '1',
    ticketNo: 'TKT-2025-001',
    vehicleNo: 'MH-12-AB-1234',
    partyName: 'ABC Industries',
    productName: 'Steel Rods',
    containerType: 'Load',
    grossWeight: 15000,
    tareWeight: 5000,
    netWeight: 10000,
    date: '2025-01-15',
    time: '09:30',
    status: 'completed',
  },
  {
    id: '2',
    ticketNo: 'TKT-2025-002',
    vehicleNo: 'MH-14-CD-5678',
    partyName: 'XYZ Corp',
    productName: 'Cement Bags',
    containerType: 'Load',
    grossWeight: 12000,
    tareWeight: 4500,
    netWeight: 7500,
    date: '2025-01-15',
    time: '10:15',
    status: 'completed',
  },
  {
    id: '3',
    ticketNo: 'TKT-2025-003',
    vehicleNo: 'GJ-01-XY-9012',
    partyName: 'Metro Logistics',
    productName: 'Sand',
    containerType: 'Load',
    grossWeight: 18000,
    tareWeight: 6000,
    netWeight: 12000,
    date: '2025-01-15',
    time: '11:45',
    status: 'in-progress',
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    vehicleNo: 'MH-12-AB-1234',
    vehicleType: 'Truck',
    capacity: 15000,
    ownerName: 'Rajesh Kumar',
    contactNo: '+91-9876543210',
    tareWeight: 5000, // Pre-configured tare
  },
  {
    id: '2',
    vehicleNo: 'MH-14-CD-5678',
    vehicleType: 'Truck',
    capacity: 12000,
    ownerName: 'Amit Sharma',
    contactNo: '+91-9876543211',
    tareWeight: 4500, // Pre-configured tare
  },
  {
    id: '3',
    vehicleNo: 'GJ-01-XY-9012',
    vehicleType: 'Trailer',
    capacity: 20000,
    ownerName: 'Priya Patel',
    contactNo: '+91-9876543212',
    tareWeight: 6000, // Pre-configured tare
  },
];

export const mockParties: Party[] = [
  {
    id: '1',
    partyName: 'ABC Industries',
    contactPerson: 'John Doe',
    contactNo: '+91-9988776655',
    email: 'contact@abcindustries.com',
    address: 'Mumbai, Maharashtra',
  },
  {
    id: '2',
    partyName: 'XYZ Corp',
    contactPerson: 'Jane Smith',
    contactNo: '+91-9988776656',
    email: 'info@xyzcorp.com',
    address: 'Pune, Maharashtra',
  },
  {
    id: '3',
    partyName: 'Metro Logistics',
    contactPerson: 'Mike Johnson',
    contactNo: '+91-9988776657',
    email: 'support@metrologistics.com',
    address: 'Ahmedabad, Gujarat',
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    productName: 'Steel Rods',
    category: 'Construction',
    unit: 'KG',
  },
  {
    id: '2',
    productName: 'Cement Bags',
    category: 'Construction',
    unit: 'KG',
  },
  {
    id: '3',
    productName: 'Sand',
    category: 'Raw Material',
    unit: 'KG',
  },
  {
    id: '4',
    productName: 'Others',
    category: 'Miscellaneous',
    unit: 'KG',
  },
];

export const mockDashboardStats = {
  todayWeighments: 12,
  totalAmount: 15420,
  activeVehicles: 3,
  pendingTickets: 2,
};
