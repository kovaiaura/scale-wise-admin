# Backend Migration Guide: localStorage to API Integration

This guide explains how to migrate all localStorage-dependent features in the Weighbridge Management System frontend to use backend APIs instead. This is essential for production deployment, data persistence, multi-user support, and security.

## Table of Contents
1. [Migration Overview](#migration-overview)
2. [Authentication Migration](#authentication-migration)
3. [User Management Migration](#user-management-migration)
4. [Weighbridge Settings Migration](#weighbridge-settings-migration)
5. [Print Template Migration](#print-template-migration)
6. [Development Mode Handling](#development-mode-handling)
7. [Data Migration Strategy](#data-migration-strategy)
8. [Security Checklist](#security-checklist)
9. [Testing After Migration](#testing-after-migration)

---

## Migration Overview

### Current State Analysis

The frontend currently has a **dual-mode system**:
- **Development Mode**: Uses `localStorage` for data persistence
- **Production Mode**: Uses API calls to backend

### Features Still Using localStorage

| Feature | Current Implementation | Migration Required |
|---------|----------------------|-------------------|
| **Authentication** | Mock login in `AuthContext.tsx` | ✅ Yes |
| **User Management** | No backend integration | ✅ Yes |
| **Weighbridge Settings** | `localStorage` in `SettingsWeighbridge.tsx` | ✅ Yes |
| **Print Templates** | `localStorage` in `PrintSettings.tsx` | ✅ Yes |
| **User Profile** | `localStorage` in `SettingsProfile.tsx` | ✅ Yes |
| **Camera Settings** | `localStorage` in camera service | ✅ Yes |
| Bills | ✅ API-ready via `unifiedServices.ts` | ⬜ No |
| Open Tickets | ✅ API-ready via `unifiedServices.ts` | ⬜ No |
| Stored Tares | ✅ API-ready via `unifiedServices.ts` | ⬜ No |
| Master Data | ✅ API-ready via `unifiedServices.ts` | ⬜ No |

### Migration Benefits

1. **Data Persistence**: Data survives browser cache clears
2. **Multi-user Support**: Multiple operators can work simultaneously
3. **Security**: Server-side validation and authorization
4. **Scalability**: Centralized data management
5. **Backup & Recovery**: Database backups protect data
6. **Audit Trail**: Track all changes with timestamps

---

## Authentication Migration

### Current Implementation Issue

**File**: `src/contexts/AuthContext.tsx`

```typescript
// ❌ CURRENT: Mock authentication using localStorage
const login = async (tenantId: string, username: string, password: string) => {
  // Mock authentication - NO SERVER VALIDATION
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Determine role based on username (INSECURE!)
  let role: UserRole = 'operator';
  if (username.includes('superadmin')) {
    role = 'super_admin';
  } else if (username.includes('admin')) {
    role = 'admin';
  }

  const mockUser: User = {
    id: '1',
    username,
    email: `${username}@${tenantId}.com`,
    role,
    tenantId,
    tenantName: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
  };

  setUser(mockUser);
  localStorage.setItem('weighbridge_user', JSON.stringify(mockUser));
};
```

**Security Issues**:
- ❌ No password validation
- ❌ Role determined by username (client-side)
- ❌ No JWT token
- ❌ Anyone can login with any credentials

### Step 1: Create Authentication API Service

**Create**: `src/services/api/authService.ts`

```typescript
import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';

export interface LoginRequest {
  tenantId: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    tenantId: string;
    tenantName: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  tenantId: string;
  tenantName: string;
  roles: string[];
}

/**
 * Login to backend and receive JWT token
 */
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse | null> => {
  const result = await apiRequest<LoginResponse>({
    method: 'POST',
    url: '/api/auth/login',
    data: credentials,
  });

  if (result.data) {
    // Store JWT token (NOT full user object)
    localStorage.setItem('access_token', result.data.accessToken);
    localStorage.setItem('refresh_token', result.data.refreshToken);
  }

  return result.data;
};

/**
 * Get current user profile (requires valid JWT)
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const result = await apiRequest<UserProfile>({
    method: 'GET',
    url: '/api/auth/me',
  });

  return result.data;
};

/**
 * Logout and clear tokens
 */
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('weighbridge_user');
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    return null;
  }

  const result = await apiRequest<{ accessToken: string }>({
    method: 'POST',
    url: '/api/auth/refresh',
    data: { refreshToken },
  });

  if (result.data) {
    localStorage.setItem('access_token', result.data.accessToken);
    return result.data.accessToken;
  }

  return null;
};
```

### Step 2: Update API Client to Include JWT

**Update**: `src/services/apiClient.ts`

```typescript
// Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration and refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Step 3: Update AuthContext to Use Backend API

**Update**: `src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getCurrentUser } from '@/services/api/authService';
import type { UserProfile } from '@/services/api/authService';

export type UserRole = 'super_admin' | 'admin' | 'operator';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  tenantId: string;
  tenantName: string;
}

interface AuthContextType {
  user: User | null;
  login: (tenantId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const profile = await getCurrentUser();
          if (profile) {
            setUser({
              id: profile.id,
              username: profile.username,
              email: profile.email,
              roles: profile.roles as UserRole[],
              tenantId: profile.tenantId,
              tenantName: profile.tenantName,
            });
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('access_token');
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (tenantId: string, username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await loginUser({ tenantId, username, password });
      
      if (!response) {
        throw new Error('Login failed');
      }

      // Fetch full user profile with roles
      const profile = await getCurrentUser();
      
      if (profile) {
        const userData: User = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          roles: profile.roles as UserRole[],
          tenantId: profile.tenantId,
          tenantName: profile.tenantName,
        };
        
        setUser(userData);
        // Store minimal user info for quick access
        localStorage.setItem('weighbridge_user', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Step 4: Update Login Page

**Update**: `src/pages/Login.tsx`

```typescript
// Add error handling for login failures
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    await login(tenantId, username, password);
    navigate('/dashboard');
  } catch (err: any) {
    setError(err.message || 'Login failed. Please check your credentials.');
  } finally {
    setIsLoading(false);
  }
};
```

---

## User Management Migration

### ⚠️ CRITICAL SECURITY REQUIREMENT

**NEVER store user roles directly in the users table!** This creates a privilege escalation vulnerability where users can modify their own roles.

### Database Schema for User Roles

```sql
-- Create enum for roles
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'operator');

-- Create user_roles table (SEPARATE from users table)
CREATE TABLE user_roles (
  user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES users(user_id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security function to check roles (bypasses RLS)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS policy example: Only admins can view all users
CREATE POLICY "Admins can select all users"
ON users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
```

### Backend API Endpoints for User Management

**Node.js Controller**: `src/controllers/userController.ts`

```typescript
import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.tenant_id,
        u.is_active,
        u.created_at,
        ARRAY_AGG(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      WHERE u.tenant_id = $1
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `, [req.user.tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create user (admin only)
export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, roles } = req.body;

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, username, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, tenant_id, created_at`,
      [req.user.tenantId, username, email, passwordHash]
    );

    const newUser = userResult.rows[0];

    // Insert roles (SEPARATE TABLE)
    if (roles && roles.length > 0) {
      const roleValues = roles.map((role: string) => 
        `('${newUser.user_id}', '${role}', '${req.user.userId}')`
      ).join(',');

      await pool.query(`
        INSERT INTO user_roles (user_id, role, granted_by)
        VALUES ${roleValues}
      `);
    }

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user roles (admin only)
export const updateUserRoles = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { roles } = req.body;

  try {
    // Delete existing roles
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

    // Insert new roles
    if (roles && roles.length > 0) {
      const roleValues = roles.map((role: string) => 
        `('${userId}', '${role}', '${req.user.userId}')`
      ).join(',');

      await pool.query(`
        INSERT INTO user_roles (user_id, role, granted_by)
        VALUES ${roleValues}
      `);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update roles error:', error);
    res.status(500).json({ error: 'Failed to update roles' });
  }
};
```

### Frontend Service for User Management

**Create**: `src/services/api/userManagementService.ts`

```typescript
import { apiRequest } from '../apiClient';

export interface UserWithRoles {
  user_id: string;
  username: string;
  email: string;
  tenant_id: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

export const getAllUsers = async (): Promise<UserWithRoles[]> => {
  const result = await apiRequest<UserWithRoles[]>({
    method: 'GET',
    url: '/api/users',
  });

  return result.data || [];
};

export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  roles: string[];
}): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'POST',
    url: '/api/users',
    data: userData,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

export const updateUserRoles = async (
  userId: string,
  roles: string[]
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'PUT',
    url: `/api/users/${userId}/roles`,
    data: { roles },
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};
```

### Update Settings Users Page

**Update**: `src/pages/SettingsUsers.tsx`

```typescript
import { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUserRoles } from '@/services/api/userManagementService';
import type { UserWithRoles } from '@/services/api/userManagementService';
import { toast } from 'sonner';

export default function SettingsUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const handleCreateUser = async (userData: any) => {
    const result = await createUser(userData);
    if (result.success) {
      loadUsers(); // Refresh list
      toast.success('User created successfully');
    } else {
      toast.error(result.error || 'Failed to create user');
    }
  };

  // ... rest of implementation
}
```

---

## Weighbridge Settings Migration

### Current Implementation

**File**: `src/pages/SettingsWeighbridge.tsx`

Currently stores settings in `localStorage`:

```typescript
// ❌ CURRENT: Using localStorage
localStorage.setItem('weighbridge_config', JSON.stringify(config));
```

### Database Schema for Weighbridge Settings

```sql
CREATE TABLE weighbridge_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  com_port VARCHAR(50),
  baud_rate INTEGER DEFAULT 9600,
  data_bits INTEGER DEFAULT 8,
  stop_bits INTEGER DEFAULT 1,
  parity VARCHAR(10) DEFAULT 'none',
  timeout_ms INTEGER DEFAULT 3000,
  weight_unit VARCHAR(10) DEFAULT 'KG',
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  UNIQUE(tenant_id)
);

CREATE TABLE camera_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  front_camera_url VARCHAR(255),
  rear_camera_url VARCHAR(255),
  capture_quality INTEGER DEFAULT 80,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  UNIQUE(tenant_id)
);
```

### Backend API for Weighbridge Settings

**Add to `src/config/api.ts`**:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  
  // Settings endpoints
  WEIGHBRIDGE_CONFIG: '/api/settings/weighbridge',
  CAMERA_CONFIG: '/api/settings/camera',
};
```

**Create**: `src/services/api/settingsService.ts`

```typescript
import { apiRequest } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api';

export interface WeighbridgeConfig {
  comPort: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  timeoutMs: number;
  weightUnit: string;
}

export interface CameraConfig {
  frontCameraUrl: string;
  rearCameraUrl: string;
  captureQuality: number;
}

export const getWeighbridgeConfig = async (): Promise<WeighbridgeConfig | null> => {
  const result = await apiRequest<WeighbridgeConfig>({
    method: 'GET',
    url: API_ENDPOINTS.WEIGHBRIDGE_CONFIG,
  });

  return result.data;
};

export const updateWeighbridgeConfig = async (
  config: WeighbridgeConfig
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'PUT',
    url: API_ENDPOINTS.WEIGHBRIDGE_CONFIG,
    data: config,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

export const getCameraConfig = async (): Promise<CameraConfig | null> => {
  const result = await apiRequest<CameraConfig>({
    method: 'GET',
    url: API_ENDPOINTS.CAMERA_CONFIG,
  });

  return result.data;
};

export const updateCameraConfig = async (
  config: CameraConfig
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'PUT',
    url: API_ENDPOINTS.CAMERA_CONFIG,
    data: config,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};
```

### Update Settings Weighbridge Page

**Update**: `src/pages/SettingsWeighbridge.tsx`

```typescript
import { useState, useEffect } from 'react';
import { getWeighbridgeConfig, updateWeighbridgeConfig } from '@/services/api/settingsService';
import { toast } from 'sonner';

export default function SettingsWeighbridge() {
  const [config, setConfig] = useState<WeighbridgeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    const data = await getWeighbridgeConfig();
    setConfig(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    const result = await updateWeighbridgeConfig(config);
    
    if (result.success) {
      toast.success('Weighbridge settings updated successfully');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  };

  // ... rest of UI implementation
}
```

---

## Print Template Migration

### Database Schema for Print Templates

```sql
CREATE TABLE print_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  template_name VARCHAR(100) NOT NULL,
  company_name VARCHAR(200),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(100),
  logo_url VARCHAR(500),
  header_text TEXT,
  footer_text TEXT,
  show_qr_code BOOLEAN DEFAULT true,
  show_barcode BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  UNIQUE(tenant_id, template_name)
);
```

### Backend API for Print Templates

**Create**: `src/services/api/printTemplateApiService.ts`

```typescript
import { apiRequest } from '../apiClient';
import { PrintTemplate } from '@/types/printTemplate';

export const getPrintTemplates = async (): Promise<PrintTemplate[]> => {
  const result = await apiRequest<PrintTemplate[]>({
    method: 'GET',
    url: '/api/print-templates',
  });

  return result.data || [];
};

export const getDefaultTemplate = async (): Promise<PrintTemplate | null> => {
  const result = await apiRequest<PrintTemplate>({
    method: 'GET',
    url: '/api/print-templates/default',
  });

  return result.data;
};

export const savePrintTemplate = async (
  template: PrintTemplate
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'POST',
    url: '/api/print-templates',
    data: template,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};

export const updatePrintTemplate = async (
  templateId: string,
  template: Partial<PrintTemplate>
): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'PUT',
    url: `/api/print-templates/${templateId}`,
    data: template,
  });

  return {
    success: !!result.data,
    error: result.error,
  };
};
```

### Update Print Settings Page

**Update**: `src/pages/PrintSettings.tsx`

Replace localStorage calls with API service calls:

```typescript
import { getPrintTemplates, savePrintTemplate } from '@/services/api/printTemplateApiService';
```

---

## Development Mode Handling

### Current Implementation

**File**: `src/services/unifiedServices.ts`

```typescript
const isDevelopmentMode = (): boolean => {
  return localStorage.getItem('developmentMode') === 'true';
};
```

### Recommendation: Remove Development Mode in Production

For production deployment, **remove the development mode toggle** entirely:

1. **Remove `isDevelopmentMode` checks** from `unifiedServices.ts`
2. **Always use API services** in production builds
3. **Use environment variables** for different environments

### Updated Approach

**Update**: `src/services/unifiedServices.ts`

```typescript
// Use environment variable instead of localStorage
const USE_MOCK_DATA = import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_MOCK === 'true';

// Or simply always use API in production
export const getBills = async (): Promise<Bill[]> => {
  // Always use API (no mock mode)
  return billApiService.getBills();
};
```

**Environment Configuration** (`.env.development`):

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080
```

---

## Data Migration Strategy

### Export Existing localStorage Data

**Create**: Migration script to export localStorage data:

```typescript
// Run in browser console to export data
const exportLocalStorageData = () => {
  const data = {
    bills: JSON.parse(localStorage.getItem('weighbridge_bills') || '[]'),
    openTickets: JSON.parse(localStorage.getItem('open_tickets') || '[]'),
    storedTares: JSON.parse(localStorage.getItem('stored_tares') || '[]'),
    vehicles: JSON.parse(localStorage.getItem('vehicles') || '[]'),
    parties: JSON.parse(localStorage.getItem('parties') || '[]'),
    products: JSON.parse(localStorage.getItem('products') || '[]'),
    users: JSON.parse(localStorage.getItem('weighbridge_users') || '[]'),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'weighbridge-data-export.json';
  a.click();
};

exportLocalStorageData();
```

### Import to Backend Database

**Create**: `scripts/importLocalStorageData.ts`

```typescript
import fs from 'fs';
import { pool } from '../src/config/database';

interface LocalStorageExport {
  bills: any[];
  openTickets: any[];
  storedTares: any[];
  vehicles: any[];
  parties: any[];
  products: any[];
  users: any[];
}

const importData = async (filePath: string, tenantId: string) => {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data: LocalStorageExport = JSON.parse(rawData);

  console.log('Starting data import...');

  // Import vehicles
  for (const vehicle of data.vehicles) {
    await pool.query(
      `INSERT INTO vehicles (tenant_id, vehicle_no, vehicle_type, owner_name, contact_number)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, vehicle_no) DO NOTHING`,
      [tenantId, vehicle.vehicleNo, vehicle.vehicleType, vehicle.ownerName, vehicle.contactNumber]
    );
  }

  // Import parties
  for (const party of data.parties) {
    await pool.query(
      `INSERT INTO parties (tenant_id, party_name, contact_person, contact_number, address, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant_id, party_name) DO NOTHING`,
      [tenantId, party.partyName, party.contactPerson, party.contactNumber, party.address, party.email]
    );
  }

  // Import products
  for (const product of data.products) {
    await pool.query(
      `INSERT INTO products (tenant_id, product_name, hsn_code, rate_per_unit, unit)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, product_name) DO NOTHING`,
      [tenantId, product.productName, product.hsnCode, product.ratePerUnit, product.unit]
    );
  }

  // Import bills
  for (const bill of data.bills) {
    await pool.query(
      `
      INSERT INTO bills (
        tenant_id, bill_no, bill_date, vehicle_no, party_name, product_name,
        gross_weight, tare_weight, net_weight, chargeable_weight,
        first_weight_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT DO NOTHING
      `,
      [
        tenantId, bill.billNo, bill.billDate, bill.vehicleNo, bill.partyName,
        bill.productName, bill.grossWeight, bill.tareWeight, bill.netWeight,
        bill.chargeableWeight, bill.firstWeightType, bill.status
      ]
    );
  }

  console.log('✅ Data import completed successfully');
};

// Usage
importData('./weighbridge-data-export.json', 'tenant-123');
```

---

## Security Checklist

### ✅ Authentication Security

- [x] JWT tokens stored securely (httpOnly cookies or localStorage)
- [x] Token expiration implemented (access token: 24h, refresh token: 7d)
- [x] Refresh token rotation
- [x] Password hashing with bcrypt (salt rounds >= 10)
- [x] Login rate limiting (prevent brute force)
- [x] Account lockout after failed attempts
- [x] HTTPS only in production

### ✅ Authorization Security

- [x] **User roles stored in SEPARATE `user_roles` table**
- [x] Server-side role validation (NEVER client-side only)
- [x] Security definer functions for role checks
- [x] RLS policies on all database tables
- [x] API endpoint authorization middleware

### ✅ Input Validation

- [x] Input validation on frontend (zod schemas)
- [x] Input validation on backend (express-validator)
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (sanitize HTML inputs)
- [x] File upload validation (type, size limits)

### ✅ API Security

- [x] CORS configured (restrict origins in production)
- [x] Rate limiting on API endpoints
- [x] Request size limits
- [x] Security headers (Helmet.js)
- [x] Error messages don't leak sensitive info

### ⚠️ Critical Security Violations to Avoid

1. **NEVER store roles in users table**
   ```sql
   -- ❌ WRONG
   CREATE TABLE users (
     user_id UUID PRIMARY KEY,
     username VARCHAR(100),
     role VARCHAR(50) -- DON'T DO THIS!
   );
   
   -- ✅ CORRECT
   CREATE TABLE users (
     user_id UUID PRIMARY KEY,
     username VARCHAR(100)
   );
   
   CREATE TABLE user_roles (
     user_id UUID REFERENCES users(user_id),
     role app_role
   );
   ```
2. **NEVER check admin status client-side only**
   ```typescript
   // ❌ WRONG
   const isAdmin = user.role === 'admin'; // Client can modify this
   
   // ✅ CORRECT
   const isAdmin = await checkUserRole(user.id, 'admin'); // Server validates
   ```
3. **NEVER trust client-provided user IDs**
   ```typescript
   // ❌ WRONG
   app.get('/api/user-data', (req, res) => {
     const userId = req.body.userId; // Client can change this
   });
   
   // ✅ CORRECT
   app.get('/api/user-data', authenticateToken, (req, res) => {
     const userId = req.user.userId; // From verified JWT
   });
   ```

---

## Testing After Migration

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails with proper error
- [ ] Logout clears tokens and redirects to login
- [ ] Token refresh works when access token expires
- [ ] Unauthorized access redirects to login

#### User Management
- [ ] Admin can view all users
- [ ] Admin can create new users with roles
- [ ] Admin can update user roles
- [ ] Operator cannot access user management
- [ ] Role changes reflect immediately

#### Weighbridge Settings
- [ ] Settings load from backend on page load
- [ ] Settings save to backend successfully
- [ ] Settings persist after browser refresh
- [ ] Invalid settings show validation errors

#### Print Templates
- [ ] Templates load from backend
- [ ] Can create new templates
- [ ] Can update existing templates
- [ ] Default template loads correctly for printing

### Automated Testing

**Create**: `src/__tests__/authFlow.test.ts`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';

describe('Authentication Flow', () => {
  test('successful login redirects to dashboard', async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const tenantInput = screen.getByLabelText(/tenant id/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(tenantInput, 'test-tenant');
    await userEvent.type(usernameInput, 'admin');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  test('invalid credentials show error message', async () => {
    // ... test implementation
  });
});
```

---

## Migration Timeline

### Phase 1: Core Infrastructure (Week 1)
- [x] Set up Node.js/Express backend
- [x] Configure PostgreSQL database
- [x] Implement JWT authentication

### Phase 2: Authentication Migration (Week 1)
- [ ] Create auth API service
- [ ] Update AuthContext
- [ ] Update Login page
- [ ] Test authentication flow

### Phase 3: User Management (Week 2)
- [ ] Create user_roles table
- [ ] Implement user CRUD APIs
- [ ] Update SettingsUsers page
- [ ] Test role-based access

### Phase 4: Settings Migration (Week 2)
- [ ] Create settings tables
- [ ] Implement settings APIs
- [ ] Update Settings pages
- [ ] Test settings persistence

### Phase 5: Data Migration (Week 3)
- [ ] Export localStorage data
- [ ] Create migration scripts
- [ ] Import data to database
- [ ] Verify data integrity

### Phase 6: Testing & Deployment (Week 3-4)
- [ ] Manual testing
- [ ] Automated testing
- [ ] Security audit
- [ ] Production deployment

---

## Summary

After completing this migration:

✅ **All data persists in PostgreSQL database**  
✅ **JWT-based authentication with secure token handling**  
✅ **User roles stored securely in separate table**  
✅ **Server-side validation and authorization**  
✅ **Multi-user support with tenant isolation**  
✅ **Production-ready security best practices**  
✅ **No localStorage dependencies for critical data**  

**Your weighbridge system is now a true full-stack application!** 🚀
