// localStorage Adapter - Mocks SQLite for browser development
// This allows development in browser preview without Tauri

const STORAGE_PREFIX = 'truckore_';

interface StorageTable {
  [key: string]: any[];
}

// Initialize mock database structure with force re-initialization for superadmin
async function initStorage() {
  const bcrypt = await import('bcryptjs');
  const superAdminPasswordHash = await bcrypt.hash('Passwordkore123@', 12);
  const adminPasswordHash = await bcrypt.hash('Admin123@', 12);
  const operatorPasswordHash = await bcrypt.hash('Operator123@', 12);
  
  const defaultSuperAdmin = {
    id: 'dev-super-admin',
    username: 'superadmin',
    email: null,
    password_hash: superAdminPasswordHash,
    role: 'super_admin',
    is_active: 1,
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const defaultAdmin = {
    id: 'dev-admin',
    username: 'admin',
    email: null,
    password_hash: adminPasswordHash,
    role: 'admin',
    is_active: 1,
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const defaultOperator = {
    id: 'dev-operator',
    username: 'operator',
    email: null,
    password_hash: operatorPasswordHash,
    role: 'operator',
    is_active: 1,
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const tables = {
    users: [defaultSuperAdmin, defaultAdmin, defaultOperator],
    security_logs: [],
    app_config: [
      { key: 'setup_completed', value: 'true', updated_at: new Date().toISOString() }
    ],
    weighments: [],
    parties: [],
    products: [],
    vehicles: [],
    open_tickets: [],
  };

  // Initialize tables if they don't exist
  Object.keys(tables).forEach(tableName => {
    const key = `${STORAGE_PREFIX}${tableName}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(tables[tableName]));
    }
  });

  // Force re-initialize all default users to ensure they're always active with correct credentials
  const usersKey = `${STORAGE_PREFIX}users`;
  const existingUsers = JSON.parse(localStorage.getItem(usersKey) || '[]');
  
  // Update or add superadmin
  const superAdminIndex = existingUsers.findIndex((u: any) => u.username === 'superadmin');
  if (superAdminIndex >= 0) {
    existingUsers[superAdminIndex] = {
      ...existingUsers[superAdminIndex],
      password_hash: superAdminPasswordHash,
      is_active: 1,
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString()
    };
  } else {
    existingUsers.push(defaultSuperAdmin);
  }

  // Update or add admin
  const adminIndex = existingUsers.findIndex((u: any) => u.username === 'admin');
  if (adminIndex >= 0) {
    existingUsers[adminIndex] = {
      ...existingUsers[adminIndex],
      is_active: 1,
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString()
    };
  } else {
    existingUsers.push(defaultAdmin);
  }

  // Update or add operator
  const operatorIndex = existingUsers.findIndex((u: any) => u.username === 'operator');
  if (operatorIndex >= 0) {
    existingUsers[operatorIndex] = {
      ...existingUsers[operatorIndex],
      is_active: 1,
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString()
    };
  } else {
    existingUsers.push(defaultOperator);
  }
  
  localStorage.setItem(usersKey, JSON.stringify(existingUsers));
  
  // Ensure setup_completed is true
  const configKey = `${STORAGE_PREFIX}app_config`;
  const existingConfig = JSON.parse(localStorage.getItem(configKey) || '[]');
  const setupCompletedIndex = existingConfig.findIndex((c: any) => c.key === 'setup_completed');
  
  if (setupCompletedIndex >= 0) {
    existingConfig[setupCompletedIndex].value = 'true';
  } else {
    existingConfig.push({ key: 'setup_completed', value: 'true', updated_at: new Date().toISOString() });
  }
  
  localStorage.setItem(configKey, JSON.stringify(existingConfig));
}

function getTable(tableName: string): any[] {
  const key = `${STORAGE_PREFIX}${tableName}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setTable(tableName: string, data: any[]) {
  const key = `${STORAGE_PREFIX}${tableName}`;
  localStorage.setItem(key, JSON.stringify(data));
}

// Simple SQL parser for basic operations
function parseQuery(query: string, params: any[]): { operation: string; table: string; data?: any } {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (normalizedQuery.startsWith('SELECT')) {
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    return { operation: 'SELECT', table: tableMatch?.[1] || '' };
  }
  
  if (normalizedQuery.startsWith('INSERT')) {
    const tableMatch = query.match(/INTO\s+(\w+)/i);
    return { operation: 'INSERT', table: tableMatch?.[1] || '' };
  }
  
  if (normalizedQuery.startsWith('UPDATE')) {
    const tableMatch = query.match(/UPDATE\s+(\w+)/i);
    return { operation: 'UPDATE', table: tableMatch?.[1] || '' };
  }
  
  if (normalizedQuery.startsWith('DELETE')) {
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    return { operation: 'DELETE', table: tableMatch?.[1] || '' };
  }
  
  return { operation: 'UNKNOWN', table: '' };
}

export async function localStorageExecuteQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const { operation, table } = parseQuery(query, params);
  
  if (operation === 'SELECT') {
    const data = getTable(table);
    
    // Handle WHERE clauses (basic implementation)
    if (query.includes('WHERE')) {
      const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (whereMatch && params.length > 0) {
        const field = whereMatch[1];
        const value = params[0];
        return data.filter(row => row[field] === value) as T[];
      }
    }
    
    return data as T[];
  }
  
  return [] as T[];
}

export async function localStorageExecuteNonQuery(
  query: string,
  params: any[] = []
): Promise<void> {
  const { operation, table } = parseQuery(query, params);
  const data = getTable(table);
  
  if (operation === 'INSERT') {
    // Extract column names and values
    const columnsMatch = query.match(/\(([^)]+)\)/);
    const columns = columnsMatch?.[1].split(',').map(c => c.trim()) || [];
    
    const newRow: any = {};
    columns.forEach((col, index) => {
      newRow[col] = params[index];
    });
    
    // Auto-generate ID if not provided
    if (!newRow.id) {
      newRow.id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add timestamp if column exists
    if (columns.includes('created_at') && !newRow.created_at) {
      newRow.created_at = new Date().toISOString();
    }
    
    // Ensure users table defaults
    if (table === 'users') {
      if (!newRow.is_active && newRow.is_active !== 0) {
        newRow.is_active = 1;
      }
      if (!newRow.failed_login_attempts) {
        newRow.failed_login_attempts = 0;
      }
      if (!newRow.locked_until) {
        newRow.locked_until = null;
      }
      if (!newRow.last_login_at) {
        newRow.last_login_at = null;
      }
    }
    
    data.push(newRow);
    setTable(table, data);
    return;
  }
  
  if (operation === 'UPDATE') {
    // Handle UPDATE queries
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (whereMatch) {
      const field = whereMatch[1];
      // Last param is typically the WHERE value
      const whereValue = params[params.length - 1];
      
      // Extract SET clause fields
      const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
      if (setMatch) {
        const setClause = setMatch[1];
        const setFields = setClause.split(',').map(s => s.trim());
        
        const updatedData = data.map(row => {
          if (row[field] === whereValue) {
            const updatedRow = { ...row };
            setFields.forEach((field, index) => {
              const fieldName = field.split('=')[0].trim();
              updatedRow[fieldName] = params[index];
            });
            if ('updated_at' in updatedRow) {
              updatedRow.updated_at = new Date().toISOString();
            }
            return updatedRow;
          }
          return row;
        });
        
        setTable(table, updatedData);
      }
    }
    return;
  }
  
  if (operation === 'DELETE') {
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const field = whereMatch[1];
      const value = params[0];
      const filteredData = data.filter(row => row[field] !== value);
      setTable(table, filteredData);
    }
    return;
  }
}

export async function localStorageInitDatabase(): Promise<void> {
  console.log('🔧 Development Mode: Using localStorage as database');
  await initStorage();
}

export function isDevelopmentMode(): boolean {
  return typeof window !== 'undefined' && !('__TAURI__' in window);
}
