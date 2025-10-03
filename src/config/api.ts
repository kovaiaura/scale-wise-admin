// API Configuration
// Manages base URL, endpoints, and API utilities

/**
 * Get API base URL from localStorage or use default
 * This allows users to configure their Spring Boot backend URL via Settings
 */
export const getApiBaseUrl = (): string => {
  return localStorage.getItem('api_base_url') || 'http://localhost:8080';
};

/**
 * Set API base URL in localStorage
 */
export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('api_base_url', url);
};

/**
 * API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  // Camera endpoints
  CAMERA_SNAPSHOT: '/api/camera/snapshot',
  CAMERA_CAPTURE_BOTH: '/api/camera/capture-both',
  CAMERA_CONFIG: '/api/camera/config',
  
  // Bill endpoints
  BILLS: '/api/bills',
  BILLS_SEARCH: '/api/bills/search',
  BILL_BY_ID: (id: string) => `/api/bills/${id}`,
  
  // Open Ticket endpoints
  TICKETS: '/api/tickets',
  TICKETS_OPEN: '/api/tickets/open',
  TICKET_BY_ID: (id: string) => `/api/tickets/${id}`,
  TICKET_CLOSE: (id: string) => `/api/tickets/${id}/close`,
  
  // Stored Tare endpoints
  TARES: '/api/tares',
  TARE_BY_VEHICLE: (vehicleNo: string) => `/api/tares/vehicle/${vehicleNo}`,
  TARE_EXPIRY: (vehicleNo: string) => `/api/tares/${vehicleNo}/expiry`,
  
  // Master Data endpoints
  VEHICLES: '/api/vehicles',
  PARTIES: '/api/parties',
  PRODUCTS: '/api/products',
  
  // Serial Number endpoint
  SERIAL_NUMBER_NEXT: '/api/serial-number/next',
  
  // Health check
  HEALTH: '/api/health',
} as const;

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};
