# Complete Frontend API to Tauri Commands Migration Guide

## 📋 Document Purpose
This is a **self-contained, step-by-step guide** to migrate all HTTP API calls (`fetch`, `axios`) in the Truckore Pro frontend to Tauri `invoke()` commands that directly query SQLite database. This enables the desktop app to work offline without a backend server.

---

## 🎯 Migration Overview

### What Needs to Change
- **FROM**: HTTP calls to `/api/*` endpoints (expects backend server)
- **TO**: Tauri `invoke()` commands (Rust backend queries SQLite directly)

### Files to Create
1. `src/services/desktop/openTicketService.ts` - Open tickets operations
2. `src/services/desktop/storedTareService.ts` - Stored tare operations
3. `src/services/desktop/masterDataService.ts` - Master data operations
4. `src/services/desktop/serialNumberService.ts` - Serial number operations
5. `TAURI_MIGRATION_GUIDE.md` - This documentation file

### Files to Modify
1. `src/services/unifiedServices.ts` - Update routing logic for all operations

---

## 📚 Complete API Call Reference

### 1. BILLS OPERATIONS ✅ (Already Migrated)
**Status**: ✅ Complete (migrated in `src/services/desktop/billService.ts`)

---

### 2. OPEN TICKETS OPERATIONS

#### 2.1 Get All Open Tickets
```typescript
// OLD (API-based): src/services/api/openTicketService.ts
export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  const result = await apiRequest<OpenTicket[]>({
    method: 'GET',
    url: '/api/tickets/open',
  });
  return result.data || [];
};

// NEW (Tauri-based): src/services/desktop/openTicketService.ts
import { invoke } from '@tauri-apps/api/core';
import { OpenTicket } from '@/types/weighment';

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM open_tickets ORDER BY created_at DESC',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    ticketNo: row.ticket_no,
    vehicleNo: row.vehicle_no,
    partyName: row.party_name,
    productName: row.product_name,
    vehicleStatus: 'load', // Default from DB
    grossWeight: row.first_weight,
    tareWeight: null,
    firstWeightType: 'gross',
    date: row.first_weight_time,
    charges: 0,
    capturedImage: row.camera_image,
    frontImage: row.camera_image,
    rearImage: null,
  }));
};
```

**Database Table**: `open_tickets`
```sql
CREATE TABLE open_tickets (
    id TEXT PRIMARY KEY,
    ticket_no TEXT UNIQUE NOT NULL,
    vehicle_no TEXT NOT NULL,
    party_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    first_weight REAL NOT NULL,
    first_weight_time DATETIME NOT NULL,
    camera_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 2.2 Save Open Ticket
```typescript
// OLD (API-based)
export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<OpenTicket>({
    method: 'POST',
    url: '/api/tickets',
    data: ticket,
  });
  return { success: !!result.data, error: result.error };
};

// NEW (Tauri-based)
export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: `INSERT INTO open_tickets (
        id, ticket_no, vehicle_no, party_name, product_name,
        first_weight, first_weight_time, camera_image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      params: [
        ticket.id,
        ticket.ticketNo,
        ticket.vehicleNo,
        ticket.partyName,
        ticket.productName,
        ticket.grossWeight,
        ticket.date,
        ticket.frontImage || ticket.capturedImage,
      ]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
```

---

#### 2.3 Remove Open Ticket
```typescript
// OLD (API-based)
export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'DELETE',
    url: `/api/tickets/${ticketId}`,
  });
  return { success: !result.error, error: result.error };
};

// NEW (Tauri-based)
export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: 'DELETE FROM open_tickets WHERE id = ?',
      params: [ticketId]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
```

---

#### 2.4 Get Open Ticket By ID
```typescript
// OLD (API-based)
export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  const result = await apiRequest<OpenTicket>({
    method: 'GET',
    url: `/api/tickets/${ticketId}`,
  });
  return result.data;
};

// NEW (Tauri-based)
export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM open_tickets WHERE id = ? LIMIT 1',
    params: [ticketId]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    vehicleNo: row.vehicle_no,
    partyName: row.party_name,
    productName: row.product_name,
    vehicleStatus: 'load',
    grossWeight: row.first_weight,
    tareWeight: null,
    firstWeightType: 'gross',
    date: row.first_weight_time,
    charges: 0,
    capturedImage: row.camera_image,
    frontImage: row.camera_image,
    rearImage: null,
  };
};
```

---

### 3. STORED TARE OPERATIONS

#### 3.1 Get All Stored Tares
```typescript
// OLD (API-based): src/services/api/storedTareService.ts
export const getStoredTares = async (): Promise<StoredTare[]> => {
  const result = await apiRequest<StoredTare[]>({
    method: 'GET',
    url: '/api/tares',
  });
  return result.data || [];
};

// NEW (Tauri-based): src/services/desktop/storedTareService.ts
import { invoke } from '@tauri-apps/api/core';
import { StoredTare } from '@/types/weighment';

export const getStoredTares = async (): Promise<StoredTare[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares ORDER BY created_at DESC',
    params: []
  });

  return rows.map(row => ({
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  }));
};
```

**Database Table**: `stored_tares`
```sql
CREATE TABLE stored_tares (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT UNIQUE NOT NULL,
    tare_weight REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);
```

---

#### 3.2 Get Stored Tare By Vehicle
```typescript
// OLD (API-based)
export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  const result = await apiRequest<StoredTare>({
    method: 'GET',
    url: `/api/tares/vehicle/${vehicleNo}`,
  });
  return result.data;
};

// NEW (Tauri-based)
export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares WHERE vehicle_no = ? LIMIT 1',
    params: [vehicleNo]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  };
};
```

---

#### 3.3 Save Stored Tare
```typescript
// OLD (API-based)
export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest<StoredTare>({
    method: 'POST',
    url: '/api/tares',
    data: tare,
  });
  return { success: !!result.data, error: result.error };
};

// NEW (Tauri-based)
export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 2 days validity

    await invoke('execute_non_query', {
      query: `INSERT OR REPLACE INTO stored_tares (
        id, vehicle_no, tare_weight, created_at, expires_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      params: [
        `tare_${tare.vehicleNo}_${Date.now()}`,
        tare.vehicleNo,
        tare.tareWeight,
        expiresAt.toISOString(),
      ]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
```

---

#### 3.4 Get Valid Stored Tare (Non-Expired)
```typescript
// NEW (Tauri-based)
export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares WHERE vehicle_no = ? AND expires_at > datetime("now") LIMIT 1',
    params: [vehicleNo]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  };
};
```

---

#### 3.5 Check Tare Expiry (Frontend Logic)
```typescript
// This stays the same - pure frontend logic
export const isTareExpired = (tare: StoredTare): boolean => {
  const tareDate = new Date(tare.storedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - tareDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 2;
};

// Get expiry info
export const getTareExpiryInfo = async (vehicleNo: string): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  const tare = await getStoredTareByVehicle(vehicleNo);
  if (!tare) return null;

  const tareDate = new Date(tare.storedAt);
  const expiryDate = new Date(tareDate);
  expiryDate.setDate(expiryDate.getDate() + 2);

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    isExpired: diffTime <= 0,
    daysRemaining,
    expiryDate: expiryDate.toISOString(),
    hoursRemaining,
  };
};
```

---

### 4. MASTER DATA OPERATIONS

#### 4.1 Get All Vehicles
```typescript
// OLD (API-based): src/services/api/masterDataService.ts
export const getVehicles = async (): Promise<Vehicle[]> => {
  const result = await apiRequest<Vehicle[]>({
    method: 'GET',
    url: '/api/vehicles',
  });
  return result.data || [];
};

// NEW (Tauri-based): src/services/desktop/masterDataService.ts
import { invoke } from '@tauri-apps/api/core';
import { Vehicle, Party, Product } from '@/utils/mockData';

export const getVehicles = async (): Promise<Vehicle[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM vehicles ORDER BY vehicle_no',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    vehicleNo: row.vehicle_no,
    vehicleType: 'Truck', // Default
    capacity: 0,
    ownerName: '',
    contactNo: '',
  }));
};
```

**Database Tables**:
```sql
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parties (
    id TEXT PRIMARY KEY,
    party_name TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    product_name TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 4.2 Get All Parties
```typescript
// NEW (Tauri-based)
export const getParties = async (): Promise<Party[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM parties ORDER BY party_name',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    partyName: row.party_name,
    contactPerson: '',
    contactNo: '',
    email: '',
    address: '',
  }));
};
```

---

#### 4.3 Get All Products
```typescript
// NEW (Tauri-based)
export const getProducts = async (): Promise<Product[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM products ORDER BY product_name',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    productName: row.product_name,
    category: 'General',
    unit: 'KG',
  }));
};
```

---

#### 4.4 Get Dynamic Vehicles from Bills (Autocomplete)
```typescript
// NEW (Tauri-based) - Extract unique vehicles from weighments
export const getUniqueVehiclesFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ vehicle_no: string }[]>('execute_query', {
    query: 'SELECT DISTINCT vehicle_no FROM weighments ORDER BY vehicle_no',
    params: []
  });

  return rows.map(row => row.vehicle_no);
};
```

---

#### 4.5 Get Dynamic Parties from Bills
```typescript
// NEW (Tauri-based)
export const getUniquePartiesFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ party_name: string }[]>('execute_query', {
    query: 'SELECT DISTINCT party_name FROM weighments ORDER BY party_name',
    params: []
  });

  return rows.map(row => row.party_name);
};
```

---

#### 4.6 Get Dynamic Products from Bills
```typescript
// NEW (Tauri-based)
export const getUniqueProductsFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ product_name: string }[]>('execute_query', {
    query: 'SELECT DISTINCT product_name FROM weighments ORDER BY product_name',
    params: []
  });

  return rows.map(row => row.product_name);
};
```

---

#### 4.7 Get By Specific Value (Helpers)
```typescript
// NEW (Tauri-based)
export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  const vehicles = await getVehicles();
  return vehicles.find(v => v.vehicleNo === vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  const parties = await getParties();
  return parties.find(p => p.partyName === partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  const products = await getProducts();
  return products.find(p => p.productName === productName);
};
```

---

### 5. SERIAL NUMBER OPERATIONS

#### 5.1 Get Serial Number Config
```typescript
// OLD (API-based): src/services/api/serialNumberService.ts
export const getSerialNumberConfig = async (): Promise<{ data: SerialNumberConfig | null; error: string | null }> => {
  return await apiRequest<SerialNumberConfig>({
    method: 'GET',
    url: '/api/serial-number/config',
  });
};

// NEW (Tauri-based): src/services/desktop/serialNumberService.ts
import { invoke } from '@tauri-apps/api/core';

export interface SerialNumberConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  yearFormat: 'YYYY' | 'YY';
  counterStart: number;
  counterPadding: number;
  currentCounter: number;
  resetFrequency: 'yearly' | 'monthly' | 'never';
  lastResetDate?: string;
}

export const getSerialNumberConfig = async (): Promise<SerialNumberConfig> => {
  const rows = await invoke<{ value: string }[]>('execute_query', {
    query: 'SELECT value FROM app_config WHERE key = ?',
    params: ['serial_number_config']
  });

  if (rows.length === 0) {
    // Return default config
    return {
      prefix: 'WB',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      yearFormat: 'YYYY',
      counterStart: 1,
      counterPadding: 3,
      currentCounter: 1,
      resetFrequency: 'yearly',
    };
  }

  return JSON.parse(rows[0].value);
};
```

**Database Storage**:
```sql
-- Stored in app_config table as JSON
INSERT INTO app_config (key, value) VALUES (
  'serial_number_config',
  '{"prefix":"WB","separator":"-","includeYear":true,"includeMonth":false,"yearFormat":"YYYY","counterStart":1,"counterPadding":3,"currentCounter":1,"resetFrequency":"yearly"}'
);
```

---

#### 5.2 Update Serial Number Config
```typescript
// OLD (API-based)
export const updateSerialNumberConfig = async (config: SerialNumberConfig): Promise<{ data: SerialNumberConfig | null; error: string | null }> => {
  return await apiRequest<SerialNumberConfig>({
    method: 'PUT',
    url: '/api/serial-number/config',
    data: config,
  });
};

// NEW (Tauri-based)
export const updateSerialNumberConfig = async (config: SerialNumberConfig): Promise<SerialNumberConfig> => {
  await invoke('execute_non_query', {
    query: 'UPDATE app_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
    params: [JSON.stringify(config), 'serial_number_config']
  });

  return config;
};
```

---

#### 5.3 Get Next Serial Number
```typescript
// OLD (API-based)
export const getNextSerialNumber = async (): Promise<{ data: { serialNo: string } | null; error: string | null }> => {
  return await apiRequest<{ serialNo: string }>({
    method: 'GET',
    url: '/api/serial-number/next',
  });
};

// NEW (Tauri-based)
const generateSerialNumber = (config: SerialNumberConfig): string => {
  const now = new Date();
  let serial = config.prefix;

  if (config.includeYear) {
    const year = config.yearFormat === 'YY' 
      ? String(now.getFullYear()).slice(-2) 
      : String(now.getFullYear());
    serial += config.separator + year;
  }

  if (config.includeMonth) {
    const month = String(now.getMonth() + 1).padStart(2, '0');
    serial += config.separator + month;
  }

  const counter = String(config.currentCounter).padStart(config.counterPadding, '0');
  serial += config.separator + counter;

  return serial;
};

export const getNextSerialNumber = async (): Promise<string> => {
  // Get current config
  const config = await getSerialNumberConfig();

  // Generate serial number
  const serialNo = generateSerialNumber(config);

  // Increment counter
  config.currentCounter++;
  await updateSerialNumberConfig(config);

  return serialNo;
};
```

---

#### 5.4 Preview Serial Number Format
```typescript
// OLD (API-based)
export const previewSerialNumber = async (config: Partial<SerialNumberConfig>): Promise<{ data: { preview: string } | null; error: string | null }> => {
  return await apiRequest<{ preview: string }>({
    method: 'POST',
    url: '/api/serial-number/preview',
    data: config,
  });
};

// NEW (Tauri-based) - Pure frontend logic, no DB call needed
export const previewSerialNumber = (config: Partial<SerialNumberConfig>): string => {
  const fullConfig: SerialNumberConfig = {
    prefix: config.prefix || 'WB',
    separator: config.separator || '-',
    includeYear: config.includeYear ?? true,
    includeMonth: config.includeMonth ?? false,
    yearFormat: config.yearFormat || 'YYYY',
    counterStart: config.counterStart || 1,
    counterPadding: config.counterPadding || 3,
    currentCounter: config.currentCounter || 1,
    resetFrequency: config.resetFrequency || 'yearly',
  };

  return generateSerialNumber(fullConfig);
};
```

---

### 6. CAMERA OPERATIONS

**Note**: Camera operations currently return placeholder images in desktop mode. To implement real camera access, you would need to add a Tauri plugin for camera/webcam access.

```typescript
// src/services/desktop/cameraService.ts (optional - already handled in unifiedServices)
import { invoke } from '@tauri-apps/api/core';

export const captureBothCameras = async (): Promise<{
  frontImage: string | null;
  rearImage: string | null;
  error: string | null;
}> => {
  // Return placeholder images for desktop mode
  // TODO: Implement actual camera capture via Tauri plugin
  return {
    frontImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    rearImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    error: null,
  };
};
```

---

## 🔧 Step-by-Step Implementation

### Step 1: Create Desktop Service Files

Create these 4 new files:

#### File 1: `src/services/desktop/openTicketService.ts`
```typescript
import { invoke } from '@tauri-apps/api/core';
import { OpenTicket } from '@/types/weighment';

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM open_tickets ORDER BY created_at DESC',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    ticketNo: row.ticket_no,
    vehicleNo: row.vehicle_no,
    partyName: row.party_name,
    productName: row.product_name,
    vehicleStatus: 'load',
    grossWeight: row.first_weight,
    tareWeight: null,
    firstWeightType: 'gross' as const,
    date: row.first_weight_time,
    charges: 0,
    capturedImage: row.camera_image,
    frontImage: row.camera_image,
    rearImage: null,
  }));
};

export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: `INSERT INTO open_tickets (
        id, ticket_no, vehicle_no, party_name, product_name,
        first_weight, first_weight_time, camera_image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      params: [
        ticket.id,
        ticket.ticketNo,
        ticket.vehicleNo,
        ticket.partyName,
        ticket.productName,
        ticket.grossWeight,
        ticket.date,
        ticket.frontImage || ticket.capturedImage,
      ]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    await invoke('execute_non_query', {
      query: 'DELETE FROM open_tickets WHERE id = ?',
      params: [ticketId]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM open_tickets WHERE id = ? LIMIT 1',
    params: [ticketId]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    vehicleNo: row.vehicle_no,
    partyName: row.party_name,
    productName: row.product_name,
    vehicleStatus: 'load',
    grossWeight: row.first_weight,
    tareWeight: null,
    firstWeightType: 'gross',
    date: row.first_weight_time,
    charges: 0,
    capturedImage: row.camera_image,
    frontImage: row.camera_image,
    rearImage: null,
  };
};
```

---

#### File 2: `src/services/desktop/storedTareService.ts`
```typescript
import { invoke } from '@tauri-apps/api/core';
import { StoredTare } from '@/types/weighment';

export const getStoredTares = async (): Promise<StoredTare[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares ORDER BY created_at DESC',
    params: []
  });

  return rows.map(row => ({
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  }));
};

export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares WHERE vehicle_no = ? LIMIT 1',
    params: [vehicleNo]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  };
};

export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 2 days validity

    await invoke('execute_non_query', {
      query: `INSERT OR REPLACE INTO stored_tares (
        id, vehicle_no, tare_weight, created_at, expires_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      params: [
        `tare_${tare.vehicleNo}_${Date.now()}`,
        tare.vehicleNo,
        tare.tareWeight,
        expiresAt.toISOString(),
      ]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM stored_tares WHERE vehicle_no = ? AND expires_at > datetime("now") LIMIT 1',
    params: [vehicleNo]
  });

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    vehicleNo: row.vehicle_no,
    tareWeight: row.tare_weight,
    storedAt: row.created_at,
    updatedAt: row.created_at,
  };
};

export const isTareExpired = (tare: StoredTare): boolean => {
  const tareDate = new Date(tare.storedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - tareDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 2;
};

export const getTareExpiryInfo = async (vehicleNo: string): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  const tare = await getStoredTareByVehicle(vehicleNo);
  if (!tare) return null;

  const tareDate = new Date(tare.storedAt);
  const expiryDate = new Date(tareDate);
  expiryDate.setDate(expiryDate.getDate() + 2);

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    isExpired: diffTime <= 0,
    daysRemaining,
    expiryDate: expiryDate.toISOString(),
    hoursRemaining,
  };
};
```

---

#### File 3: `src/services/desktop/masterDataService.ts`
```typescript
import { invoke } from '@tauri-apps/api/core';
import { Vehicle, Party, Product } from '@/utils/mockData';

export const getVehicles = async (): Promise<Vehicle[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM vehicles ORDER BY vehicle_no',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    vehicleNo: row.vehicle_no,
    vehicleType: 'Truck',
    capacity: 0,
    ownerName: '',
    contactNo: '',
  }));
};

export const getParties = async (): Promise<Party[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM parties ORDER BY party_name',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    partyName: row.party_name,
    contactPerson: '',
    contactNo: '',
    email: '',
    address: '',
  }));
};

export const getProducts = async (): Promise<Product[]> => {
  const rows = await invoke<any[]>('execute_query', {
    query: 'SELECT * FROM products ORDER BY product_name',
    params: []
  });

  return rows.map(row => ({
    id: row.id,
    productName: row.product_name,
    category: 'General',
    unit: 'KG',
  }));
};

export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  const vehicles = await getVehicles();
  return vehicles.find(v => v.vehicleNo === vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  const parties = await getParties();
  return parties.find(p => p.partyName === partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  const products = await getProducts();
  return products.find(p => p.productName === productName);
};

export const getUniqueVehiclesFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ vehicle_no: string }[]>('execute_query', {
    query: 'SELECT DISTINCT vehicle_no FROM weighments ORDER BY vehicle_no',
    params: []
  });
  return rows.map(row => row.vehicle_no);
};

export const getUniquePartiesFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ party_name: string }[]>('execute_query', {
    query: 'SELECT DISTINCT party_name FROM weighments ORDER BY party_name',
    params: []
  });
  return rows.map(row => row.party_name);
};

export const getUniqueProductsFromBills = async (): Promise<string[]> => {
  const rows = await invoke<{ product_name: string }[]>('execute_query', {
    query: 'SELECT DISTINCT product_name FROM weighments ORDER BY product_name',
    params: []
  });
  return rows.map(row => row.product_name);
};

export const getNextSerialNo = async (): Promise<string> => {
  // This will be handled by serialNumberService
  const { getNextSerialNumber } = await import('./serialNumberService');
  return getNextSerialNumber();
};
```

---

#### File 4: `src/services/desktop/serialNumberService.ts`
```typescript
import { invoke } from '@tauri-apps/api/core';

export interface SerialNumberConfig {
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  yearFormat: 'YYYY' | 'YY';
  counterStart: number;
  counterPadding: number;
  currentCounter: number;
  resetFrequency: 'yearly' | 'monthly' | 'never';
  lastResetDate?: string;
}

const generateSerialNumber = (config: SerialNumberConfig): string => {
  const now = new Date();
  let serial = config.prefix;

  if (config.includeYear) {
    const year = config.yearFormat === 'YY' 
      ? String(now.getFullYear()).slice(-2) 
      : String(now.getFullYear());
    serial += config.separator + year;
  }

  if (config.includeMonth) {
    const month = String(now.getMonth() + 1).padStart(2, '0');
    serial += config.separator + month;
  }

  const counter = String(config.currentCounter).padStart(config.counterPadding, '0');
  serial += config.separator + counter;

  return serial;
};

export const getSerialNumberConfig = async (): Promise<SerialNumberConfig> => {
  const rows = await invoke<{ value: string }[]>('execute_query', {
    query: 'SELECT value FROM app_config WHERE key = ?',
    params: ['serial_number_config']
  });

  if (rows.length === 0) {
    return {
      prefix: 'WB',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      yearFormat: 'YYYY',
      counterStart: 1,
      counterPadding: 3,
      currentCounter: 1,
      resetFrequency: 'yearly',
    };
  }

  return JSON.parse(rows[0].value);
};

export const updateSerialNumberConfig = async (config: SerialNumberConfig): Promise<SerialNumberConfig> => {
  await invoke('execute_non_query', {
    query: 'UPDATE app_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
    params: [JSON.stringify(config), 'serial_number_config']
  });

  return config;
};

export const getNextSerialNumber = async (): Promise<string> => {
  const config = await getSerialNumberConfig();
  const serialNo = generateSerialNumber(config);

  // Increment counter
  config.currentCounter++;
  await updateSerialNumberConfig(config);

  return serialNo;
};

export const previewSerialNumber = (config: Partial<SerialNumberConfig>): string => {
  const fullConfig: SerialNumberConfig = {
    prefix: config.prefix || 'WB',
    separator: config.separator || '-',
    includeYear: config.includeYear ?? true,
    includeMonth: config.includeMonth ?? false,
    yearFormat: config.yearFormat || 'YYYY',
    counterStart: config.counterStart || 1,
    counterPadding: config.counterPadding || 3,
    currentCounter: config.currentCounter || 1,
    resetFrequency: config.resetFrequency || 'yearly',
  };

  return generateSerialNumber(fullConfig);
};
```

---

### Step 2: Update `src/services/unifiedServices.ts`

Update the routing logic to use the new desktop services:

```typescript
// Add imports for new desktop services
import * as desktopOpenTicketService from './desktop/openTicketService';
import * as desktopStoredTareService from './desktop/storedTareService';
import * as desktopMasterDataService from './desktop/masterDataService';
import * as desktopSerialNumberService from './desktop/serialNumberService';

// ==================== OPEN TICKET SERVICES ====================

export const getOpenTickets = async (): Promise<OpenTicket[]> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.getOpenTickets(); // Changed from localBillService
  }
  return apiOpenTicketService.getOpenTickets();
};

export const saveOpenTicket = async (ticket: OpenTicket): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.saveOpenTicket(ticket); // Changed
  }
  return apiOpenTicketService.saveOpenTicket(ticket);
};

export const removeOpenTicket = async (ticketId: string): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.removeOpenTicket(ticketId); // Changed
  }
  return apiOpenTicketService.removeOpenTicket(ticketId);
};

export const getOpenTicketById = async (ticketId: string): Promise<OpenTicket | null> => {
  if (isOfflineMode()) {
    return desktopOpenTicketService.getOpenTicketById(ticketId); // Changed
  }
  return apiOpenTicketService.getOpenTicketById(ticketId);
};

// ==================== STORED TARE SERVICES ====================

export const getStoredTares = async (): Promise<StoredTare[]> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getStoredTares(); // Changed
  }
  return apiStoredTareService.getStoredTares();
};

export const getStoredTareByVehicle = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getStoredTareByVehicle(vehicleNo); // Changed
  }
  return apiStoredTareService.getStoredTareByVehicle(vehicleNo);
};

export const saveStoredTare = async (tare: StoredTare): Promise<{ success: boolean; error: string | null }> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.saveStoredTare(tare); // Changed
  }
  return apiStoredTareService.saveStoredTare(tare);
};

export const isTareExpired = (tare: StoredTare): boolean => {
  if (isOfflineMode()) {
    return desktopStoredTareService.isTareExpired(tare); // Changed
  }
  return apiStoredTareService.isTareExpired(tare);
};

export const getValidStoredTare = async (vehicleNo: string): Promise<StoredTare | null> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getValidStoredTare(vehicleNo); // Changed
  }
  return apiStoredTareService.getValidStoredTare(vehicleNo);
};

export const getTareExpiryInfo = async (vehicleNo: string): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  expiryDate: string;
  hoursRemaining: number;
} | null> => {
  if (isOfflineMode()) {
    return desktopStoredTareService.getTareExpiryInfo(vehicleNo); // Changed
  }
  return apiStoredTareService.getTareExpiryInfo(vehicleNo);
};

// ==================== MASTER DATA SERVICES ====================

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getVehicles(); // Changed
  }
  return apiMasterService.getVehicles();
};

export const getParties = async (): Promise<Party[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getParties(); // Changed
  }
  return apiMasterService.getParties();
};

export const getProducts = async (): Promise<Product[]> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getProducts(); // Changed
  }
  return apiMasterService.getProducts();
};

export const getVehicleByNumber = async (vehicleNo: string): Promise<Vehicle | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getVehicleByNumber(vehicleNo); // Changed
  }
  return apiMasterService.getVehicleByNumber(vehicleNo);
};

export const getPartyByName = async (partyName: string): Promise<Party | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getPartyByName(partyName); // Changed
  }
  return apiMasterService.getPartyByName(partyName);
};

export const getProductByName = async (productName: string): Promise<Product | undefined> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getProductByName(productName); // Changed
  }
  return apiMasterService.getProductByName(productName);
};

export const getNextSerialNo = async (): Promise<string> => {
  if (isOfflineMode()) {
    return desktopMasterDataService.getNextSerialNo(); // Changed
  }
  return apiMasterService.getNextSerialNo();
};

// ==================== SERIAL NUMBER SERVICES ====================

export const SerialNumberService = {
  getConfig: async () => {
    if (isOfflineMode()) {
      const config = await desktopSerialNumberService.getSerialNumberConfig(); // Changed
      return { data: config, error: null };
    } else {
      return await apiSerialNumberService.getSerialNumberConfig();
    }
  },

  updateConfig: async (config: desktopSerialNumberService.SerialNumberConfig & { resetCounterNow?: boolean }) => {
    if (isOfflineMode()) {
      const updatedConfig = await desktopSerialNumberService.updateSerialNumberConfig(config); // Changed
      return { data: updatedConfig, error: null };
    } else {
      return await apiSerialNumberService.updateSerialNumberConfig(config);
    }
  },

  getNext: async () => {
    if (isOfflineMode()) {
      const serialNo = await desktopSerialNumberService.getNextSerialNumber(); // Changed
      return { data: { serialNo }, error: null };
    } else {
      return await apiSerialNumberService.getNextSerialNumber();
    }
  },

  previewFormat: async (config: Partial<desktopSerialNumberService.SerialNumberConfig>) => {
    if (isOfflineMode()) {
      const preview = desktopSerialNumberService.previewSerialNumber(config); // Changed - synchronous
      return { data: { preview }, error: null };
    } else {
      return await apiSerialNumberService.previewSerialNumber(config);
    }
  }
};
```

---

### Step 3: Test Each Operation Category

After implementing, test in this order:

1. **Bills** ✅ (Already working)
   - Save new bill
   - View bills list
   - Search bills

2. **Open Tickets**
   - Create first weighment (saves open ticket)
   - View open tickets table
   - Complete second weighment (removes open ticket)

3. **Stored Tares**
   - Save vehicle tare weight
   - Auto-load tare for known vehicle
   - Check tare expiry

4. **Master Data**
   - View vehicles/parties/products in dropdowns
   - Add walk-in entries

5. **Serial Numbers**
   - View current format
   - Change format settings
   - Verify new bills use updated format

---

## ✅ Verification Checklist

After migration, verify:

- [ ] No more 404 errors in console
- [ ] Bills save successfully
- [ ] Open tickets appear in table
- [ ] Autocomplete shows master data
- [ ] Serial numbers increment properly
- [ ] Tare weights save and load
- [ ] Date filtering works
- [ ] Search functionality works
- [ ] All CRUD operations succeed

---

## 🔍 Debugging Tips

If you encounter errors:

1. **Check Tauri console** (not browser console):
   ```bash
   npm run tauri:dev
   # Look for Rust errors in terminal
   ```

2. **Verify database schema**:
   - Database file: `AppData\truckore-pro\data\truckore_data.db`
   - Use DB Browser for SQLite to inspect

3. **Test individual queries**:
   ```typescript
   const test = await invoke('execute_query', {
     query: 'SELECT * FROM weighments LIMIT 1',
     params: []
   });
   console.log('Test result:', test);
   ```

4. **Column name mismatch**: SQL uses `snake_case`, TypeScript uses `camelCase`
   - SQL: `vehicle_no` → TypeScript: `vehicleNo`

---

## 📦 Summary

This migration replaces **27 HTTP API endpoints** with **25 Tauri `invoke()` commands** across:
- ✅ Bills (7 operations) - DONE
- 🔄 Open Tickets (4 operations) - TODO
- 🔄 Stored Tares (5 operations) - TODO
- 🔄 Master Data (7 operations) - TODO
- 🔄 Serial Numbers (4 operations) - TODO

**Total files to create**: 4
**Total files to modify**: 1 (`unifiedServices.ts`)

After completing all steps, your desktop app will work fully offline! 🎉
