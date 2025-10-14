// Database Schema Definition for Truckore Pro
// This defines the SQLite database structure for offline desktop mode

export const DATABASE_SCHEMA = `
-- Users table with password hashing
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('super_admin', 'admin', 'operator')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    last_login_at DATETIME
);

-- Security logs for audit trail
CREATE TABLE IF NOT EXISTS security_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- App configuration
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weighments table (migrated from localStorage)
CREATE TABLE IF NOT EXISTS weighments (
    id TEXT PRIMARY KEY,
    bill_no TEXT UNIQUE NOT NULL,
    vehicle_no TEXT NOT NULL,
    party_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    gross_weight REAL NOT NULL,
    tare_weight REAL NOT NULL,
    net_weight REAL NOT NULL,
    weighment_type TEXT CHECK(weighment_type IN ('REGULAR', 'QUICK', 'SHUTTLE', 'MANUAL')) NOT NULL,
    status TEXT CHECK(status IN ('OPEN', 'CLOSED', 'PRINTED')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    printed_at DATETIME,
    first_weight REAL,
    first_weight_time DATETIME,
    second_weight REAL,
    second_weight_time DATETIME,
    front_camera_image TEXT,
    back_camera_image TEXT,
    remarks TEXT
);

-- Open tickets table
CREATE TABLE IF NOT EXISTS open_tickets (
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

-- Stored tares table
CREATE TABLE IF NOT EXISTS stored_tares (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT UNIQUE NOT NULL,
    tare_weight REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- Master data tables
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    party_name TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    product_name TEXT UNIQUE NOT NULL,
    source TEXT CHECK(source IN ('master', 'walk-in')) DEFAULT 'master',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial setup flag
INSERT OR IGNORE INTO app_config (key, value) VALUES ('setup_completed', 'false');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('serial_number', '0');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('auto_backup_enabled', 'true');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('auto_backup_time', '02:00');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('backup_retention_days', '30');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('serial_number_config', '{"prefix":"WB","separator":"-","includeYear":true,"includeMonth":false,"yearFormat":"YYYY","counterStart":1,"counterPadding":3,"currentCounter":1,"resetFrequency":"yearly"}');
`;

export const DATABASE_VERSION = 1;
