// localStorage Adapter - Mocks SQLite for browser development
// This allows development in browser preview without Tauri

const STORAGE_PREFIX = 'truckore_';

interface StorageTable {
  [key: string]: any[];
}

// Initialize mock database structure
function initStorage() {
  const tables = {
    users: [],
    security_logs: [],
    app_config: [
      { key: 'setup_completed', value: 'false', updated_at: new Date().toISOString() }
    ],
    weighments: [],
    parties: [],
    products: [],
    vehicles: [],
    open_tickets: [],
  };

  Object.keys(tables).forEach(tableName => {
    const key = `${STORAGE_PREFIX}${tableName}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(tables[tableName]));
    }
  });
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

export function localStorageInitDatabase(): void {
  console.log('🔧 Development Mode: Using localStorage as database');
  initStorage();
}

export function isDevelopmentMode(): boolean {
  return typeof window !== 'undefined' && !('__TAURI__' in window);
}
