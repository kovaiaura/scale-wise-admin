# PostgreSQL Database Documentation
## WeighBridge Pro - Complete Database Guide

> **Version:** 1.0  
> **Last Updated:** 2025-10-08  
> **Database:** PostgreSQL 15+

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [PostgreSQL Installation](#2-postgresql-installation)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Database Schema Design](#4-database-schema-design)
5. [Database Migration Strategy](#5-database-migration-strategy)
6. [Spring Boot Configuration](#6-spring-boot-configuration)
7. [Data Seeding](#7-data-seeding)
8. [Production Deployment](#8-production-deployment)
9. [Database Operations](#9-database-operations)
10. [Frontend Integration](#10-frontend-integration)
11. [Performance Optimization](#11-performance-optimization)
12. [Backup & Recovery](#12-backup--recovery)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Introduction

### 1.1 Overview
This document provides complete guidance for setting up, configuring, and managing the PostgreSQL database for the WeighBridge Pro application. It covers development, staging, and production environments.

### 1.2 Database Requirements
- **PostgreSQL Version:** 15.x or higher (recommended: 16.x)
- **Minimum Hardware:**
  - **Development:** 4GB RAM, 20GB Storage
  - **Production:** 8GB RAM, 100GB Storage (SSD recommended)
- **Supported Operating Systems:** Linux (Ubuntu 22.04+, CentOS 8+), Windows Server 2019+, macOS

### 1.3 Key Features
- Multi-tenant support (future-ready)
- Role-based access control (RBAC)
- Transaction management for weighment operations
- Automatic serial number generation
- Image storage support (Base64 or file paths)
- Configurable data retention policies

---

## 2. PostgreSQL Installation

### 2.1 Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

### 2.2 macOS

```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Verify installation
psql --version
```

### 2.3 Windows

1. Download installer from: https://www.postgresql.org/download/windows/
2. Run the installer (postgresql-15.x-windows-x64.exe)
3. Follow the setup wizard:
   - Select installation directory
   - Choose components (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - Set password for `postgres` superuser
   - Set port (default: 5432)
   - Select locale

4. Verify installation:
```cmd
psql --version
```

### 2.4 Docker Installation (Recommended for Development)

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name weighbridge-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=weighbridge \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15

# Verify container is running
docker ps
```

---

## 3. Development Environment Setup

### 3.1 Initial Database Setup

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or connect directly
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE weighbridge_dev;

-- Create application user
CREATE USER weighbridge_user WITH PASSWORD 'dev_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE weighbridge_dev TO weighbridge_user;

-- Connect to the database
\c weighbridge_dev

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO weighbridge_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO weighbridge_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO weighbridge_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO weighbridge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO weighbridge_user;
```

### 3.2 Enable Required Extensions

```sql
-- Connect to weighbridge_dev database
\c weighbridge_dev

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable btree_gin for composite indexes
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Verify extensions
\dx
```

### 3.3 PostgreSQL Configuration for Development

Edit `postgresql.conf` (location varies by OS):
- **Linux:** `/etc/postgresql/15/main/postgresql.conf`
- **macOS (Homebrew):** `/opt/homebrew/var/postgresql@15/postgresql.conf`
- **Windows:** `C:\Program Files\PostgreSQL\15\data\postgresql.conf`

```conf
# Connection Settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory Settings (Development)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# WAL Settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Logging (Verbose for development)
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_duration = on
log_min_duration_statement = 100ms

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# Locale
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
```

**Restart PostgreSQL after configuration changes:**
```bash
# Linux
sudo systemctl restart postgresql

# macOS
brew services restart postgresql@15

# Windows (as Administrator)
net stop postgresql-x64-15
net start postgresql-x64-15
```

### 3.4 pgAdmin 4 Setup (GUI Tool)

1. **Install pgAdmin:** https://www.pgadmin.org/download/
2. **Launch pgAdmin** and create a new server connection:
   - **Name:** WeighBridge Dev
   - **Host:** localhost
   - **Port:** 5432
   - **Database:** weighbridge_dev
   - **Username:** weighbridge_user
   - **Password:** dev_password_123

3. **Save** the connection.

---

## 4. Database Schema Design

### 4.1 Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   TENANTS   │       │    USERS     │       │ USER_ROLES  │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │───────│ tenant_id(FK)│───────│ user_id (FK)│
│ name        │       │ id (PK)      │       │ role        │
│ subdomain   │       │ username     │       └─────────────┘
│ created_at  │       │ password_hash│
└─────────────┘       │ full_name    │
                      │ is_active    │
                      └──────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐     ┌──────────────┐    ┌─────────────┐
│   BILLS     │     │OPEN_TICKETS  │    │STORED_TARES │
├─────────────┤     ├──────────────┤    ├─────────────┤
│ id (PK)     │     │ id (PK)      │    │ vehicle_no  │
│ bill_no     │     │ ticket_no    │    │ tare_weight │
│ vehicle_no  │─┐   │ vehicle_no   │─┐  │ stored_at   │
│ party_name  │─┤   │ party_name   │─┤  │ updated_at  │
│ product_name│─┤   │ product_name │─┤  └─────────────┘
│ gross_weight│ │   │ first_weight │ │
│ tare_weight │ │   │ vehicle_status│ │
│ net_weight  │ │   │ charges      │ │
│ status      │ │   │ created_at   │ │
│ created_at  │ │   └──────────────┘ │
└─────────────┘ │                    │
                │                    │
        ┌───────┴────────┬───────────┴───────┬────────────┐
        ▼                ▼                   ▼            ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
│  VEHICLES   │  │   PARTIES    │  │  PRODUCTS   │  │SERIAL_CONFIG│
├─────────────┤  ├──────────────┤  ├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)      │  │ id (PK)     │  │ id (PK)     │
│ vehicle_no  │  │ party_name   │  │ product_name│  │ prefix      │
│ vehicle_type│  │ contact_person│ │ category    │  │ separator   │
│ capacity    │  │ phone        │  │ unit        │  │ include_year│
│ owner_name  │  │ email        │  │ created_at  │  │ year_format │
│ created_at  │  │ address      │  └─────────────┘  │ counter_start│
└─────────────┘  │ created_at   │                   │ current_count│
                 └──────────────┘                   │ reset_freq   │
                                                    └─────────────┘
```

### 4.2 Complete SQL Schema

```sql
-- ============================================
-- WEIGHBRIDGE PRO - DATABASE SCHEMA
-- PostgreSQL 15+
-- ============================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================
-- 1. TENANTS TABLE (Multi-tenant support)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subdomain VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_username_tenant UNIQUE (username, tenant_id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================
-- 3. USER_ROLES TABLE
-- ============================================
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================
-- 4. VEHICLES TABLE (Master Data)
-- ============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_no VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(100),
    capacity DECIMAL(10,2),
    owner_name VARCHAR(255),
    contact_number VARCHAR(20),
    stored_tare DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vehicle_no_tenant UNIQUE (vehicle_no, tenant_id)
);

CREATE INDEX idx_vehicles_no ON vehicles(vehicle_no);
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
CREATE INDEX idx_vehicles_search ON vehicles USING gin(vehicle_no gin_trgm_ops);

-- ============================================
-- 5. PARTIES TABLE (Master Data)
-- ============================================
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    party_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gstin VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_party_name_tenant UNIQUE (party_name, tenant_id)
);

CREATE INDEX idx_parties_name ON parties(party_name);
CREATE INDEX idx_parties_tenant ON parties(tenant_id);
CREATE INDEX idx_parties_active ON parties(is_active);
CREATE INDEX idx_parties_search ON parties USING gin(party_name gin_trgm_ops);

-- ============================================
-- 6. PRODUCTS TABLE (Master Data)
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'KG',
    hsn_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_name_tenant UNIQUE (product_name, tenant_id)
);

CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);

-- ============================================
-- 7. BILLS TABLE (Main Transaction)
-- ============================================
CREATE TYPE bill_status_enum AS ENUM ('OPEN', 'CLOSED', 'PRINTED');
CREATE TYPE weight_type_enum AS ENUM ('gross', 'tare', 'one-time');
CREATE TYPE vehicle_status_enum AS ENUM ('load', 'empty');

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bill_no VARCHAR(100) NOT NULL,
    ticket_no VARCHAR(100) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    gross_weight DECIMAL(10,2),
    tare_weight DECIMAL(10,2),
    net_weight DECIMAL(10,2),
    charges DECIMAL(10,2) DEFAULT 0,
    captured_image TEXT,  -- Deprecated, kept for backward compatibility
    front_image TEXT,
    rear_image TEXT,
    status bill_status_enum DEFAULT 'OPEN',
    first_weight_type weight_type_enum NOT NULL,
    first_vehicle_status vehicle_status_enum,
    second_vehicle_status vehicle_status_enum,
    second_weight_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    printed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    CONSTRAINT unique_bill_no_tenant UNIQUE (bill_no, tenant_id),
    CONSTRAINT unique_ticket_no_tenant UNIQUE (ticket_no, tenant_id)
);

CREATE INDEX idx_bills_tenant ON bills(tenant_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_vehicle ON bills(vehicle_no);
CREATE INDEX idx_bills_party ON bills(party_name);
CREATE INDEX idx_bills_product ON bills(product_name);
CREATE INDEX idx_bills_created_at ON bills(created_at DESC);
CREATE INDEX idx_bills_bill_no ON bills(bill_no);
CREATE INDEX idx_bills_ticket_no ON bills(ticket_no);
CREATE INDEX idx_bills_search ON bills USING gin(
    vehicle_no gin_trgm_ops, 
    party_name gin_trgm_ops, 
    product_name gin_trgm_ops
);

-- ============================================
-- 8. OPEN_TICKETS TABLE
-- ============================================
CREATE TABLE open_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_no VARCHAR(100) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    vehicle_status vehicle_status_enum NOT NULL,
    first_weight DECIMAL(10,2) NOT NULL,
    first_weight_type weight_type_enum NOT NULL,
    charges DECIMAL(10,2) DEFAULT 0,
    captured_image TEXT,  -- Deprecated
    front_image TEXT,
    rear_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    CONSTRAINT unique_ticket_no_open_tenant UNIQUE (ticket_no, tenant_id)
);

CREATE INDEX idx_open_tickets_tenant ON open_tickets(tenant_id);
CREATE INDEX idx_open_tickets_vehicle ON open_tickets(vehicle_no);
CREATE INDEX idx_open_tickets_ticket_no ON open_tickets(ticket_no);
CREATE INDEX idx_open_tickets_created_at ON open_tickets(created_at DESC);

-- ============================================
-- 9. STORED_TARES TABLE
-- ============================================
CREATE TABLE stored_tares (
    vehicle_no VARCHAR(50) PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tare_weight DECIMAL(10,2) NOT NULL,
    stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    CONSTRAINT unique_tare_vehicle_tenant UNIQUE (vehicle_no, tenant_id)
);

CREATE INDEX idx_stored_tares_tenant ON stored_tares(tenant_id);
CREATE INDEX idx_stored_tares_stored_at ON stored_tares(stored_at);

-- ============================================
-- 10. SERIAL_NUMBER_CONFIG TABLE
-- ============================================
CREATE TYPE year_format_enum AS ENUM ('YYYY', 'YY');
CREATE TYPE reset_frequency_enum AS ENUM ('yearly', 'monthly', 'never');

CREATE TABLE serial_number_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    prefix VARCHAR(20) DEFAULT 'WB',
    separator VARCHAR(5) DEFAULT '-',
    include_year BOOLEAN DEFAULT TRUE,
    include_month BOOLEAN DEFAULT FALSE,
    year_format year_format_enum DEFAULT 'YYYY',
    counter_start INTEGER DEFAULT 1,
    counter_padding INTEGER DEFAULT 5,
    current_counter INTEGER DEFAULT 1,
    reset_frequency reset_frequency_enum DEFAULT 'yearly',
    last_reset_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_serial_config_tenant ON serial_number_config(tenant_id);

-- ============================================
-- 11. CAMERA_CONFIG TABLE
-- ============================================
CREATE TABLE camera_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    front_camera_ip VARCHAR(100),
    rear_camera_ip VARCHAR(100),
    front_camera_port INTEGER DEFAULT 80,
    rear_camera_port INTEGER DEFAULT 80,
    front_camera_username VARCHAR(100),
    front_camera_password VARCHAR(255),
    rear_camera_username VARCHAR(100),
    rear_camera_password VARCHAR(255),
    camera_brand VARCHAR(50),
    capture_timeout INTEGER DEFAULT 5000,
    image_quality INTEGER DEFAULT 80,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_camera_config_tenant ON camera_config(tenant_id);

-- ============================================
-- 12. WEIGHBRIDGE_CONFIG TABLE
-- ============================================
CREATE TYPE connection_type_enum AS ENUM ('SERIAL', 'NETWORK');

CREATE TABLE weighbridge_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    connection_type connection_type_enum DEFAULT 'SERIAL',
    serial_port VARCHAR(50),
    baud_rate INTEGER DEFAULT 9600,
    data_bits INTEGER DEFAULT 8,
    stop_bits INTEGER DEFAULT 1,
    parity VARCHAR(10) DEFAULT 'NONE',
    network_ip VARCHAR(100),
    network_port INTEGER,
    read_timeout INTEGER DEFAULT 3000,
    weight_unit VARCHAR(10) DEFAULT 'KG',
    decimal_places INTEGER DEFAULT 2,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weighbridge_config_tenant ON weighbridge_config(tenant_id);

-- ============================================
-- 13. PRINT_TEMPLATES TABLE
-- ============================================
CREATE TABLE print_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    template_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_template_name_tenant UNIQUE (name, tenant_id)
);

CREATE INDEX idx_print_templates_tenant ON print_templates(tenant_id);
CREATE INDEX idx_print_templates_default ON print_templates(is_default);

-- ============================================
-- 14. AUDIT_LOGS TABLE (Optional but Recommended)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- TRIGGERS FOR updated_at TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stored_tares_updated_at BEFORE UPDATE ON stored_tares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_serial_config_updated_at BEFORE UPDATE ON serial_number_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_camera_config_updated_at BEFORE UPDATE ON camera_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weighbridge_config_updated_at BEFORE UPDATE ON weighbridge_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_templates_updated_at BEFORE UPDATE ON print_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 Database Constraints Summary

| Constraint Type | Purpose | Examples |
|----------------|---------|----------|
| **PRIMARY KEY** | Unique identifier for each row | All tables use UUID |
| **FOREIGN KEY** | Maintains referential integrity | `tenant_id`, `user_id`, etc. |
| **UNIQUE** | Prevents duplicate entries | `username`, `vehicle_no`, `bill_no` |
| **NOT NULL** | Ensures required fields are filled | `username`, `password_hash`, `vehicle_no` |
| **CHECK** | Validates data ranges | Weight > 0, charges >= 0 |
| **DEFAULT** | Sets default values | `created_at`, `is_active` |

---

## 5. Database Migration Strategy

### 5.1 Why Use Migrations?

- **Version Control:** Track all database changes in code
- **Consistency:** Same schema across all environments
- **Rollback:** Ability to undo changes if needed
- **Team Collaboration:** Share schema changes via Git
- **Deployment Automation:** Apply changes automatically during deployment

### 5.2 Flyway Setup (Recommended)

#### 5.2.1 Add Flyway to Spring Boot

**Maven (pom.xml):**
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Gradle (build.gradle):**
```gradle
implementation 'org.flywaydb:flyway-core'
implementation 'org.flywaydb:flyway-database-postgresql'
```

#### 5.2.2 Configure Flyway in application.yml

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    schemas: public
    table: flyway_schema_history
    validate-on-migrate: true
    out-of-order: false
```

#### 5.2.3 Migration File Naming Convention

```
src/main/resources/db/migration/
├── V1__Initial_schema.sql
├── V2__Add_audit_logs.sql
├── V3__Add_camera_config_fields.sql
├── V4__Update_bill_constraints.sql
└── R__Insert_default_data.sql  (Repeatable)
```

**Naming Rules:**
- **Versioned Migrations:** `V{version}__{description}.sql`
  - Example: `V1__Initial_schema.sql`, `V2__Add_users_table.sql`
- **Repeatable Migrations:** `R__{description}.sql`
  - Example: `R__Insert_seed_data.sql`

#### 5.2.4 Example Migration Files

**V1__Initial_schema.sql:**
```sql
-- Initial database schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subdomain VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... (rest of schema from section 4.2)
```

**V2__Add_audit_logs.sql:**
```sql
-- Add audit logging table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**R__Insert_seed_data.sql (Repeatable):**
```sql
-- Insert default tenant (idempotent)
INSERT INTO tenants (id, name, subdomain, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Default Tenant',
    'default',
    true
)
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
-- Password: admin123 (hashed with BCrypt)
INSERT INTO users (id, tenant_id, username, password_hash, full_name, is_active)
VALUES (
    'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System Administrator',
    true
)
ON CONFLICT (username) DO NOTHING;

-- Assign SUPER_ADMIN role
INSERT INTO user_roles (user_id, role)
VALUES (
    'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'SUPER_ADMIN'
)
ON CONFLICT (user_id, role) DO NOTHING;
```

#### 5.2.5 Run Migrations

**Automatically on Spring Boot Startup:**
Migrations run automatically when the application starts if `spring.flyway.enabled=true`.

**Manually via Maven:**
```bash
mvn flyway:migrate
mvn flyway:info      # View migration status
mvn flyway:validate  # Validate migrations
mvn flyway:repair    # Fix migration history
```

**Manually via Gradle:**
```bash
./gradlew flywayMigrate
./gradlew flywayInfo
./gradlew flywayValidate
```

### 5.3 Liquibase Alternative (Optional)

If you prefer Liquibase over Flyway:

**Maven Dependency:**
```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

**application.yml:**
```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/db.changelog-master.xml
```

**db/changelog/db.changelog-master.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.9.xsd">

    <include file="db/changelog/v1-initial-schema.xml"/>
    <include file="db/changelog/v2-add-audit-logs.xml"/>
</databaseChangeLog>
```

---

## 6. Spring Boot Configuration

### 6.1 Application Configuration Files

#### 6.1.1 application.yml (Main Configuration)

```yaml
# Application Configuration
spring:
  application:
    name: weighbridge-backend

  # Database Configuration
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_dev
    username: weighbridge_user
    password: dev_password_123
    driver-class-name: org.postgresql.Driver
    
    # HikariCP Connection Pool Settings
    hikari:
      connection-timeout: 30000         # 30 seconds
      maximum-pool-size: 10             # Max connections
      minimum-idle: 5                   # Min idle connections
      idle-timeout: 600000              # 10 minutes
      max-lifetime: 1800000             # 30 minutes
      pool-name: WeighBridgeHikariPool
      leak-detection-threshold: 60000   # 1 minute
      
  # JPA/Hibernate Configuration
  jpa:
    hibernate:
      ddl-auto: validate                # Use 'validate' with Flyway
    show-sql: true                      # Show SQL in logs (dev only)
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true                # Format SQL logs
        use_sql_comments: true          # Add comments to SQL
        jdbc:
          batch_size: 20                # Batch insert/update
          fetch_size: 50                # Fetch size
        order_inserts: true             # Order inserts for batching
        order_updates: true             # Order updates for batching
        generate_statistics: false      # Disable in production
        
  # Flyway Migration
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    
  # Server Configuration
  server:
    port: 8080
    servlet:
      context-path: /api
      
  # Logging Configuration
  logging:
    level:
      root: INFO
      com.weighbridge: DEBUG
      org.hibernate.SQL: DEBUG
      org.hibernate.type.descriptor.sql.BasicBinder: TRACE
      org.springframework.jdbc.core: DEBUG

# JWT Configuration
jwt:
  secret: your-256-bit-secret-key-change-this-in-production
  expiration: 86400000  # 24 hours in milliseconds
  refresh-expiration: 604800000  # 7 days

# Application-Specific Configuration
app:
  cors:
    allowed-origins: http://localhost:5173,http://localhost:3000
  file:
    upload-dir: ./uploads
    max-size: 10MB
```

#### 6.1.2 application-dev.yml (Development Profile)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_dev
    username: weighbridge_user
    password: dev_password_123
    hikari:
      maximum-pool-size: 5
      
  jpa:
    show-sql: true
    properties:
      hibernate:
        generate_statistics: true
        
logging:
  level:
    root: DEBUG
    com.weighbridge: DEBUG
```

#### 6.1.3 application-prod.yml (Production Profile)

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/weighbridge_prod}
    username: ${DB_USERNAME:weighbridge_prod}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      
  jpa:
    show-sql: false
    properties:
      hibernate:
        generate_statistics: false
        
logging:
  level:
    root: WARN
    com.weighbridge: INFO

jwt:
  secret: ${JWT_SECRET}
  
server:
  port: ${SERVER_PORT:8080}
```

### 6.2 JPA Entity Configuration

#### 6.2.1 Base Entity (Auditing)

```java
package com.weighbridge.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

#### 6.2.2 Bill Entity Example

```java
package com.weighbridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bills", indexes = {
    @Index(name = "idx_bills_status", columnList = "status"),
    @Index(name = "idx_bills_vehicle", columnList = "vehicle_no"),
    @Index(name = "idx_bills_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
    
    @Column(name = "bill_no", nullable = false, unique = true)
    private String billNo;
    
    @Column(name = "ticket_no", nullable = false, unique = true)
    private String ticketNo;
    
    @Column(name = "vehicle_no", nullable = false, length = 50)
    private String vehicleNo;
    
    @Column(name = "party_name", nullable = false)
    private String partyName;
    
    @Column(name = "product_name", nullable = false)
    private String productName;
    
    @Column(name = "gross_weight", precision = 10, scale = 2)
    private BigDecimal grossWeight;
    
    @Column(name = "tare_weight", precision = 10, scale = 2)
    private BigDecimal tareWeight;
    
    @Column(name = "net_weight", precision = 10, scale = 2)
    private BigDecimal netWeight;
    
    @Column(name = "charges", precision = 10, scale = 2)
    private BigDecimal charges;
    
    @Column(name = "front_image", columnDefinition = "TEXT")
    private String frontImage;
    
    @Column(name = "rear_image", columnDefinition = "TEXT")
    private String rearImage;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BillStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "first_weight_type", nullable = false)
    private WeightType firstWeightType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "first_vehicle_status")
    private VehicleStatus firstVehicleStatus;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "second_vehicle_status")
    private VehicleStatus secondVehicleStatus;
    
    @Column(name = "second_weight_timestamp")
    private LocalDateTime secondWeightTimestamp;
    
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    
    @Column(name = "printed_at")
    private LocalDateTime printedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
```

### 6.3 Connection Pool Tuning

#### 6.3.1 HikariCP Optimization

```yaml
# For Development (5-10 concurrent users)
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      
# For Production (50-100 concurrent users)
spring:
  datasource:
    hikari:
      maximum-pool-size: 30
      minimum-idle: 15
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

#### 6.3.2 Formula for Pool Size

```
connections = ((core_count * 2) + effective_spindle_count)
```

For example:
- **4 CPU cores + 1 SSD = (4 * 2) + 1 = 9 connections**
- **8 CPU cores + 1 SSD = (8 * 2) + 1 = 17 connections**

### 6.4 Enable JPA Auditing

```java
package com.weighbridge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // Enables @CreatedDate, @LastModifiedDate, @CreatedBy, @LastModifiedBy
}
```

---

## 7. Data Seeding

### 7.1 SQL Seed Script

**src/main/resources/db/migration/R__Insert_seed_data.sql:**

```sql
-- ============================================
-- SEED DATA FOR WEIGHBRIDGE PRO
-- ============================================

-- 1. Default Tenant
INSERT INTO tenants (id, name, subdomain, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'WeighBridge Pro',
    'default',
    true
)
ON CONFLICT (name) DO NOTHING;

-- 2. Default Users
-- Password for all: admin123 (BCrypt hash)
INSERT INTO users (id, tenant_id, username, password_hash, full_name, email, is_active)
VALUES 
    (
        'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'System Administrator',
        'admin@weighbridge.com',
        true
    ),
    (
        'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'operator',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'Operator User',
        'operator@weighbridge.com',
        true
    )
ON CONFLICT (username) DO NOTHING;

-- 3. User Roles
INSERT INTO user_roles (user_id, role)
VALUES 
    ('b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SUPER_ADMIN'),
    ('c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'OPERATOR')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Sample Vehicles
INSERT INTO vehicles (tenant_id, vehicle_no, vehicle_type, capacity, owner_name, contact_number)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MH12AB1234', 'Truck', 10.00, 'Rajesh Kumar', '9876543210'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GJ01CD5678', 'Trailer', 20.00, 'Amit Patel', '9123456789'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DL09EF9012', 'Mini Truck', 5.00, 'Suresh Gupta', '9988776655'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'KA03GH3456', 'Heavy Truck', 25.00, 'Venkatesh Rao', '8877665544')
ON CONFLICT (vehicle_no, tenant_id) DO NOTHING;

-- 5. Sample Parties
INSERT INTO parties (tenant_id, party_name, contact_person, phone, email, address)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ABC Industries', 'Ramesh Sharma', '9876543211', 'ramesh@abc.com', '123 Industrial Area, Mumbai'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'XYZ Traders', 'Priya Singh', '9123456780', 'priya@xyz.com', '456 Market Street, Delhi'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PQR Exports', 'Anil Kumar', '9988776656', 'anil@pqr.com', '789 Export Zone, Bangalore'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'LMN Logistics', 'Sunita Verma', '8877665545', 'sunita@lmn.com', '321 Logistics Hub, Pune')
ON CONFLICT (party_name, tenant_id) DO NOTHING;

-- 6. Sample Products
INSERT INTO products (tenant_id, product_name, category, unit)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cement', 'Construction', 'KG'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Steel', 'Metals', 'KG'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Wheat', 'Agricultural', 'KG'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rice', 'Agricultural', 'KG'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coal', 'Mining', 'KG')
ON CONFLICT (product_name, tenant_id) DO NOTHING;

-- 7. Serial Number Config
INSERT INTO serial_number_config (tenant_id, prefix, separator, include_year, include_month, year_format, counter_start, counter_padding, current_counter, reset_frequency)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'WB',
    '-',
    true,
    false,
    'YYYY',
    1,
    5,
    1,
    'yearly'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- 8. Camera Config (Default)
INSERT INTO camera_config (tenant_id, front_camera_ip, rear_camera_ip, is_enabled)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '192.168.1.100',
    '192.168.1.101',
    false
)
ON CONFLICT (tenant_id) DO NOTHING;

-- 9. Weighbridge Config (Default)
INSERT INTO weighbridge_config (tenant_id, connection_type, serial_port, baud_rate, weight_unit, is_enabled)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'SERIAL',
    'COM1',
    9600,
    'KG',
    false
)
ON CONFLICT (tenant_id) DO NOTHING;
```

### 7.2 Spring Boot Data Loader

```java
package com.weighbridge.config;

import com.weighbridge.entity.*;
import com.weighbridge.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataLoader {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("dev") // Only run in dev profile
    public CommandLineRunner loadData() {
        return args -> {
            log.info("Loading initial data...");

            // Check if tenant already exists
            if (tenantRepository.count() == 0) {
                // Create default tenant
                Tenant tenant = Tenant.builder()
                    .id(UUID.fromString("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"))
                    .name("WeighBridge Pro")
                    .subdomain("default")
                    .isActive(true)
                    .build();
                tenantRepository.save(tenant);
                log.info("Created default tenant: {}", tenant.getName());

                // Create admin user
                User admin = User.builder()
                    .id(UUID.fromString("b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22"))
                    .tenant(tenant)
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .email("admin@weighbridge.com")
                    .isActive(true)
                    .build();
                userRepository.save(admin);
                log.info("Created admin user: {}", admin.getUsername());

                // Assign SUPER_ADMIN role
                UserRole adminRole = UserRole.builder()
                    .user(admin)
                    .role(AppRole.SUPER_ADMIN)
                    .build();
                userRoleRepository.save(adminRole);
                log.info("Assigned SUPER_ADMIN role to admin");
            } else {
                log.info("Data already loaded, skipping...");
            }
        };
    }
}
```

---

## 8. Production Deployment

### 8.1 Production Database Setup

#### 8.1.1 PostgreSQL Installation on Production Server (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Enable and start service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Check status
sudo systemctl status postgresql
```

#### 8.1.2 Secure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Change postgres password
ALTER USER postgres WITH PASSWORD 'very_strong_password_here';

# Exit
\q
```

#### 8.1.3 Create Production Database

```sql
-- Connect as postgres
sudo -u postgres psql

-- Create production user
CREATE USER weighbridge_prod WITH PASSWORD 'strong_production_password';

-- Create production database
CREATE DATABASE weighbridge_prod OWNER weighbridge_prod;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE weighbridge_prod TO weighbridge_prod;

-- Connect to production database
\c weighbridge_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO weighbridge_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO weighbridge_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO weighbridge_prod;
```

#### 8.1.4 Configure PostgreSQL for Production

**Edit `/etc/postgresql/15/main/postgresql.conf`:**

```conf
# Connection Settings
listen_addresses = 'localhost'  # Or specific IP for remote access
max_connections = 200

# Memory Settings (for 8GB RAM server)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 32MB
maintenance_work_mem = 512MB

# WAL Settings
wal_level = replica
max_wal_size = 2GB
min_wal_size = 512MB
checkpoint_completion_target = 0.9

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000ms  # Log slow queries
log_line_prefix = '%m [%p] %u@%d '
log_timezone = 'Asia/Kolkata'

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

**Edit `/etc/postgresql/15/main/pg_hba.conf`:**

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    weighbridge_prod weighbridge_prod 10.0.0.0/24          md5  # Internal network
host    all             all             ::1/128                 md5
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

### 8.2 SSL/TLS Configuration

#### 8.2.1 Generate Self-Signed Certificate (for testing)

```bash
# Navigate to PostgreSQL data directory
cd /var/lib/postgresql/15/main

# Generate private key and certificate
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt \
  -keyout server.key \
  -subj "/CN=weighbridge.example.com"

# Set permissions
sudo chmod 600 /var/lib/postgresql/15/main/server.key
sudo chown postgres:postgres /var/lib/postgresql/15/main/server.key
```

#### 8.2.2 Enable SSL in postgresql.conf

```conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

#### 8.2.3 Update Spring Boot Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_prod?ssl=true&sslmode=require
```

### 8.3 Firewall Configuration

```bash
# Allow PostgreSQL (only from application server)
sudo ufw allow from 10.0.0.10 to any port 5432

# Or allow from entire subnet
sudo ufw allow from 10.0.0.0/24 to any port 5432

# Enable firewall
sudo ufw enable
```

### 8.4 Environment Variables for Production

**Create `.env` file:**
```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/weighbridge_prod
DB_USERNAME=weighbridge_prod
DB_PASSWORD=strong_production_password

# JWT
JWT_SECRET=your-very-strong-256-bit-secret-change-this

# Server
SERVER_PORT=8080
```

**Load in Spring Boot:**
```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
```

### 8.5 Docker Deployment

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: weighbridge-postgres
    environment:
      POSTGRES_DB: weighbridge_prod
      POSTGRES_USER: weighbridge_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - weighbridge-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U weighbridge_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: weighbridge-backend
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/weighbridge_prod
      DB_USERNAME: weighbridge_prod
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - weighbridge-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  weighbridge-network:
    driver: bridge
```

**Run with Docker Compose:**
```bash
# Set environment variables
export DB_PASSWORD=strong_password
export JWT_SECRET=your_secret_key

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 9. Database Operations

### 9.1 Common Queries for Frontend

#### 9.1.1 Get All Open Bills

```sql
SELECT 
    id,
    bill_no,
    ticket_no,
    vehicle_no,
    party_name,
    product_name,
    gross_weight,
    tare_weight,
    status,
    created_at
FROM bills
WHERE status = 'OPEN'
AND tenant_id = ?
ORDER BY created_at DESC;
```

#### 9.1.2 Search Bills

```sql
SELECT *
FROM bills
WHERE tenant_id = ?
AND (
    vehicle_no ILIKE '%' || ? || '%'
    OR party_name ILIKE '%' || ? || '%'
    OR bill_no ILIKE '%' || ? || '%'
)
ORDER BY created_at DESC
LIMIT 50;
```

#### 9.1.3 Get Bills by Date Range

```sql
SELECT *
FROM bills
WHERE tenant_id = ?
AND created_at BETWEEN ? AND ?
ORDER BY created_at DESC;
```

#### 9.1.4 Dashboard Statistics

```sql
-- Today's weighments
SELECT COUNT(*) as today_count,
       SUM(charges) as today_revenue
FROM bills
WHERE DATE(created_at) = CURRENT_DATE
AND tenant_id = ?;

-- This month's weighments
SELECT COUNT(*) as month_count,
       SUM(charges) as month_revenue
FROM bills
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
AND tenant_id = ?;

-- Open tickets count
SELECT COUNT(*) as open_tickets
FROM open_tickets
WHERE tenant_id = ?;
```

### 9.2 Stored Procedures

#### 9.2.1 Generate Next Serial Number

```sql
CREATE OR REPLACE FUNCTION generate_next_serial_number(p_tenant_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_config RECORD;
    v_year VARCHAR(4);
    v_month VARCHAR(2);
    v_counter VARCHAR(10);
    v_serial VARCHAR(100);
    v_should_reset BOOLEAN := false;
BEGIN
    -- Get configuration
    SELECT * INTO v_config
    FROM serial_number_config
    WHERE tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serial number configuration not found for tenant';
    END IF;

    -- Check if reset is needed
    IF v_config.reset_frequency = 'yearly' THEN
        IF EXTRACT(YEAR FROM v_config.last_reset_date) < EXTRACT(YEAR FROM CURRENT_DATE) THEN
            v_should_reset := true;
        END IF;
    ELSIF v_config.reset_frequency = 'monthly' THEN
        IF DATE_TRUNC('month', v_config.last_reset_date) < DATE_TRUNC('month', CURRENT_DATE) THEN
            v_should_reset := true;
        END IF;
    END IF;

    -- Reset counter if needed
    IF v_should_reset THEN
        UPDATE serial_number_config
        SET current_counter = counter_start,
            last_reset_date = CURRENT_DATE
        WHERE tenant_id = p_tenant_id;
        
        v_config.current_counter := v_config.counter_start;
    END IF;

    -- Build serial number components
    IF v_config.include_year THEN
        IF v_config.year_format = 'YYYY' THEN
            v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
        ELSE
            v_year := TO_CHAR(CURRENT_DATE, 'YY');
        END IF;
    END IF;

    IF v_config.include_month THEN
        v_month := TO_CHAR(CURRENT_DATE, 'MM');
    END IF;

    -- Format counter with padding
    v_counter := LPAD(v_config.current_counter::TEXT, v_config.counter_padding, '0');

    -- Build serial number
    v_serial := v_config.prefix;
    IF v_year IS NOT NULL THEN
        v_serial := v_serial || v_config.separator || v_year;
    END IF;
    IF v_month IS NOT NULL THEN
        v_serial := v_serial || v_config.separator || v_month;
    END IF;
    v_serial := v_serial || v_config.separator || v_counter;

    -- Increment counter
    UPDATE serial_number_config
    SET current_counter = current_counter + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = p_tenant_id;

    RETURN v_serial;
END;
$$;
```

**Usage:**
```sql
SELECT generate_next_serial_number('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
-- Returns: WB-2025-00001
```

#### 9.2.2 Close Bill and Calculate Net Weight

```sql
CREATE OR REPLACE FUNCTION close_bill(
    p_bill_id UUID,
    p_second_weight DECIMAL(10,2),
    p_second_weight_type VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_bill RECORD;
    v_net_weight DECIMAL(10,2);
BEGIN
    -- Get bill details
    SELECT * INTO v_bill
    FROM bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;

    IF v_bill.status != 'OPEN' THEN
        RAISE EXCEPTION 'Bill is not open';
    END IF;

    -- Calculate net weight
    IF p_second_weight_type = 'gross' THEN
        UPDATE bills
        SET gross_weight = p_second_weight,
            net_weight = p_second_weight - v_bill.tare_weight,
            status = 'CLOSED',
            closed_at = CURRENT_TIMESTAMP,
            second_weight_timestamp = CURRENT_TIMESTAMP
        WHERE id = p_bill_id;
    ELSE
        UPDATE bills
        SET tare_weight = p_second_weight,
            net_weight = v_bill.gross_weight - p_second_weight,
            status = 'CLOSED',
            closed_at = CURRENT_TIMESTAMP,
            second_weight_timestamp = CURRENT_TIMESTAMP
        WHERE id = p_bill_id;
    END IF;
END;
$$;
```

### 9.3 Triggers

#### 9.3.1 Auto-calculate Net Weight

```sql
CREATE OR REPLACE FUNCTION calculate_net_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.gross_weight IS NOT NULL AND NEW.tare_weight IS NOT NULL THEN
        NEW.net_weight := NEW.gross_weight - NEW.tare_weight;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_net_weight
BEFORE INSERT OR UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION calculate_net_weight();
```

#### 9.3.2 Audit Log Trigger

```sql
CREATE OR REPLACE FUNCTION log_bill_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            tenant_id,
            user_id,
            action,
            entity_type,
            entity_id,
            old_value,
            new_value
        ) VALUES (
            NEW.tenant_id,
            NEW.created_by,
            'UPDATE',
            'Bill',
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_bill_changes
AFTER UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION log_bill_changes();
```

### 9.4 Full-Text Search

#### 9.4.1 Create Text Search Index

```sql
-- Add tsvector column
ALTER TABLE bills
ADD COLUMN search_vector tsvector;

-- Update search vector
UPDATE bills
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(vehicle_no, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(party_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(product_name, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(bill_no, '')), 'A');

-- Create index
CREATE INDEX idx_bills_search_vector ON bills USING GIN(search_vector);

-- Create trigger to auto-update search vector
CREATE OR REPLACE FUNCTION update_bills_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.vehicle_no, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.party_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.product_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.bill_no, '')), 'A');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_bills_search_vector
BEFORE INSERT OR UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION update_bills_search_vector();
```

#### 9.4.2 Search Query

```sql
SELECT *
FROM bills
WHERE search_vector @@ plainto_tsquery('english', 'MH12AB')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'MH12AB')) DESC
LIMIT 20;
```

---

## 10. Frontend Integration

### 10.1 API Endpoint Mapping

| Frontend Service | API Endpoint | HTTP Method | Description |
|------------------|--------------|-------------|-------------|
| `getBills()` | `/api/bills` | GET | Get all bills |
| `saveBill()` | `/api/bills` | POST | Create new bill |
| `getBillById()` | `/api/bills/{id}` | GET | Get bill by ID |
| `updateBillStatus()` | `/api/bills/{id}/status` | PUT | Update bill status |
| `searchBills()` | `/api/bills/search?q=` | GET | Search bills |
| `getOpenTickets()` | `/api/tickets/open` | GET | Get open tickets |
| `saveOpenTicket()` | `/api/tickets` | POST | Create open ticket |
| `closeOpenTicket()` | `/api/tickets/{id}/close` | POST | Close open ticket |
| `getStoredTares()` | `/api/tares` | GET | Get all stored tares |
| `getStoredTareByVehicle()` | `/api/tares/vehicle/{vehicleNo}` | GET | Get tare by vehicle |
| `getVehicles()` | `/api/vehicles` | GET | Get all vehicles |
| `getParties()` | `/api/parties` | GET | Get all parties |
| `getProducts()` | `/api/products` | GET | Get all products |
| `getNextSerialNo()` | `/api/serial-number/next` | GET | Get next serial number |

### 10.2 Data Transformation (Entity ↔ DTO)

#### 10.2.1 Bill DTO

```java
package com.weighbridge.dto;

import com.weighbridge.entity.BillStatus;
import com.weighbridge.entity.WeightType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BillDTO {
    private String id;
    private String billNo;
    private String ticketNo;
    private String vehicleNo;
    private String partyName;
    private String productName;
    private BigDecimal grossWeight;
    private BigDecimal tareWeight;
    private BigDecimal netWeight;
    private BigDecimal charges;
    private String frontImage;
    private String rearImage;
    private BillStatus status;
    private WeightType firstWeightType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private LocalDateTime printedAt;
}
```

#### 10.2.2 Mapper

```java
package com.weighbridge.mapper;

import com.weighbridge.dto.BillDTO;
import com.weighbridge.entity.Bill;
import org.springframework.stereotype.Component;

@Component
public class BillMapper {
    
    public BillDTO toDTO(Bill entity) {
        if (entity == null) return null;
        
        BillDTO dto = new BillDTO();
        dto.setId(entity.getId().toString());
        dto.setBillNo(entity.getBillNo());
        dto.setTicketNo(entity.getTicketNo());
        dto.setVehicleNo(entity.getVehicleNo());
        dto.setPartyName(entity.getPartyName());
        dto.setProductName(entity.getProductName());
        dto.setGrossWeight(entity.getGrossWeight());
        dto.setTareWeight(entity.getTareWeight());
        dto.setNetWeight(entity.getNetWeight());
        dto.setCharges(entity.getCharges());
        dto.setFrontImage(entity.getFrontImage());
        dto.setRearImage(entity.getRearImage());
        dto.setStatus(entity.getStatus());
        dto.setFirstWeightType(entity.getFirstWeightType());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setClosedAt(entity.getClosedAt());
        dto.setPrintedAt(entity.getPrintedAt());
        return dto;
    }
    
    public Bill toEntity(BillDTO dto) {
        // Implementation for creating entity from DTO
    }
}
```

### 10.3 Pagination and Filtering

```java
@RestController
@RequestMapping("/api/bills")
public class BillController {
    
    @GetMapping
    public Page<BillDTO> getBills(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String vehicleNo,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        // Build specification based on filters
        Specification<Bill> spec = Specification.where(null);
        
        if (status != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), BillStatus.valueOf(status)));
        }
        
        if (vehicleNo != null) {
            spec = spec.and((root, query, cb) -> 
                cb.like(root.get("vehicleNo"), "%" + vehicleNo + "%"));
        }
        
        if (startDate != null && endDate != null) {
            spec = spec.and((root, query, cb) -> 
                cb.between(root.get("createdAt"), 
                    startDate.atStartOfDay(), 
                    endDate.atTime(23, 59, 59)));
        }
        
        Page<Bill> billPage = billRepository.findAll(spec, pageable);
        return billPage.map(billMapper::toDTO);
    }
}
```

### 10.4 Transaction Management

```java
@Service
@Transactional
public class BillService {
    
    @Transactional(rollbackFor = Exception.class)
    public BillDTO createBill(BillDTO billDTO) {
        // Validate
        // Generate serial number
        // Save bill
        // Save to open tickets if applicable
        // Return DTO
    }
    
    @Transactional(rollbackFor = Exception.class)
    public BillDTO closeBill(UUID billId, CloseBillRequest request) {
        // Get bill
        // Validate status
        // Calculate net weight
        // Remove from open tickets
        // Update bill status
        // Return DTO
    }
}
```

---

## 11. Performance Optimization

### 11.1 Indexing Strategy

```sql
-- Essential indexes (already in schema)
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_created_at ON bills(created_at DESC);
CREATE INDEX idx_bills_vehicle ON bills(vehicle_no);

-- Composite indexes for common queries
CREATE INDEX idx_bills_status_created ON bills(status, created_at DESC);
CREATE INDEX idx_bills_tenant_status ON bills(tenant_id, status);
CREATE INDEX idx_bills_vehicle_created ON bills(vehicle_no, created_at DESC);

-- Partial indexes (for specific query patterns)
CREATE INDEX idx_bills_open ON bills(created_at DESC) WHERE status = 'OPEN';
CREATE INDEX idx_bills_closed_today ON bills(created_at DESC) 
    WHERE status = 'CLOSED' AND DATE(created_at) = CURRENT_DATE;
```

### 11.2 Query Optimization

#### 11.2.1 Use EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM bills
WHERE status = 'OPEN'
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

#### 11.2.2 Avoid N+1 Queries (Use JPA Fetch Joins)

```java
@Query("SELECT b FROM Bill b " +
       "LEFT JOIN FETCH b.tenant " +
       "LEFT JOIN FETCH b.createdBy " +
       "WHERE b.status = :status")
List<Bill> findByStatusWithRelations(@Param("status") BillStatus status);
```

### 11.3 Caching Strategy

#### 11.3.1 Spring Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
            new ConcurrentMapCache("vehicles"),
            new ConcurrentMapCache("parties"),
            new ConcurrentMapCache("products")
        ));
        return cacheManager;
    }
}
```

#### 11.3.2 Cache Usage

```java
@Service
public class VehicleService {
    
    @Cacheable("vehicles")
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }
    
    @CacheEvict(value = "vehicles", allEntries = true)
    public Vehicle createVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }
}
```

### 11.4 Database Vacuuming

```sql
-- Manual vacuum
VACUUM ANALYZE bills;

-- Auto-vacuum settings in postgresql.conf
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
```

---

## 12. Backup & Recovery

### 12.1 Backup Strategy

#### 12.1.1 Daily Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/postgres"
DB_NAME="weighbridge_prod"
DB_USER="weighbridge_prod"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Dump database and compress
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Make executable and schedule:**
```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

#### 12.1.2 Restore from Backup

```bash
# Extract and restore
gunzip < /var/backups/postgres/weighbridge_prod_20250108_020000.sql.gz | \
psql -U weighbridge_prod -d weighbridge_prod
```

### 12.2 Point-in-Time Recovery (PITR)

#### 12.2.1 Enable WAL Archiving

**postgresql.conf:**
```conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
```

#### 12.2.2 Base Backup

```bash
# Create base backup
pg_basebackup -U postgres -D /var/backups/postgres/base_backup -Ft -z -P
```

#### 12.2.3 Restore to Specific Time

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Clear data directory
rm -rf /var/lib/postgresql/15/main/*

# Restore base backup
tar -xzf /var/backups/postgres/base_backup/base.tar.gz -C /var/lib/postgresql/15/main/

# Create recovery.conf
cat > /var/lib/postgresql/15/main/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '2025-10-08 14:30:00'
EOF

# Start PostgreSQL
sudo systemctl start postgresql
```

### 12.3 Replication Setup (Optional)

#### 12.3.1 Primary Server Configuration

**postgresql.conf:**
```conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64
```

**pg_hba.conf:**
```conf
host replication replicator 10.0.0.20/32 md5
```

#### 12.3.2 Standby Server Setup

```bash
# On standby server, create base backup from primary
pg_basebackup -h 10.0.0.10 -D /var/lib/postgresql/15/main -U replicator -P -v -R

# Start standby
sudo systemctl start postgresql
```

---

## 13. Troubleshooting

### 13.1 Common Connection Issues

#### 13.1.1 "Connection Refused"

**Cause:** PostgreSQL not listening on the correct address.

**Solution:**
```conf
# postgresql.conf
listen_addresses = '*'  # or specific IP

# pg_hba.conf
host all all 0.0.0.0/0 md5
```

#### 13.1.2 "Password Authentication Failed"

**Solution:**
```sql
-- Reset password
ALTER USER weighbridge_user WITH PASSWORD 'new_password';

-- Check pg_hba.conf method
host weighbridge_dev weighbridge_user localhost md5
```

#### 13.1.3 "Too Many Connections"

**Solution:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Increase max_connections
ALTER SYSTEM SET max_connections = 200;
-- Restart PostgreSQL
```

### 13.2 Performance Issues

#### 13.2.1 Slow Queries

**Diagnosis:**
```sql
-- Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solution:** Add indexes, optimize queries, increase `work_mem`.

#### 13.2.2 High CPU Usage

**Diagnosis:**
```sql
SELECT pid, usename, query, state
FROM pg_stat_activity
WHERE state = 'active';
```

**Solution:** Kill long-running queries, add indexes, tune `shared_buffers`.

### 13.3 Data Integrity Issues

#### 13.3.1 Constraint Violations

```sql
-- Find duplicate bill numbers
SELECT bill_no, COUNT(*)
FROM bills
GROUP BY bill_no
HAVING COUNT(*) > 1;

-- Remove duplicates (keep oldest)
DELETE FROM bills
WHERE id NOT IN (
    SELECT MIN(id)
    FROM bills
    GROUP BY bill_no
);
```

#### 13.3.2 Orphaned Records

```sql
-- Find bills without valid tenant
SELECT b.id, b.bill_no
FROM bills b
LEFT JOIN tenants t ON b.tenant_id = t.id
WHERE t.id IS NULL;
```

### 13.4 Migration Errors

#### 13.4.1 Flyway Checksum Mismatch

**Solution:**
```bash
# Repair Flyway
mvn flyway:repair

# Or manually fix
DELETE FROM flyway_schema_history WHERE version = '2';
```

#### 13.4.2 Schema Out of Sync

**Solution:**
```sql
-- Drop all tables (CAUTION: Development only!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-run migrations
mvn flyway:migrate
```

### 13.5 Debugging Spring Boot + PostgreSQL

#### 13.5.1 Enable SQL Logging

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

#### 13.5.2 Connection Pool Issues

```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 60000  # Detect leaks
      
logging:
  level:
    com.zaxxer.hikari: DEBUG
```

---

## 14. Useful Commands Reference

### 14.1 psql Commands

```bash
# Connect to database
psql -U weighbridge_user -d weighbridge_dev

# List databases
\l

# Connect to database
\c weighbridge_dev

# List tables
\dt

# Describe table
\d bills

# List indexes
\di

# List functions
\df

# Quit
\q
```

### 14.2 SQL Commands

```sql
-- Show table size
SELECT pg_size_pretty(pg_total_relation_size('bills'));

-- Show database size
SELECT pg_size_pretty(pg_database_size('weighbridge_dev'));

-- Show running queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle';

-- Kill query
SELECT pg_terminate_backend(pid);

-- Show table stats
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables;

-- Reindex table
REINDEX TABLE bills;
```

---

## 15. Resources

### 15.1 Official Documentation

- **PostgreSQL:** https://www.postgresql.org/docs/
- **Spring Data JPA:** https://docs.spring.io/spring-data/jpa/docs/current/reference/html/
- **Flyway:** https://flywaydb.org/documentation/
- **HikariCP:** https://github.com/brettwooldridge/HikariCP

### 15.2 Tools

- **pgAdmin:** https://www.pgadmin.org/
- **DBeaver:** https://dbeaver.io/
- **DataGrip:** https://www.jetbrains.com/datagrip/

### 15.3 Monitoring

- **pg_stat_statements:** Built-in query statistics
- **pgBadger:** Log analyzer
- **Prometheus + Grafana:** Metrics and dashboards

---

## Appendix A: Quick Start Checklist

- [ ] Install PostgreSQL 15+
- [ ] Create database and user
- [ ] Enable required extensions (uuid-ossp, pg_trgm)
- [ ] Configure Spring Boot application.yml
- [ ] Add Flyway dependency
- [ ] Create migration files (V1__Initial_schema.sql)
- [ ] Run Spring Boot application (migrations auto-run)
- [ ] Verify schema created successfully
- [ ] Insert seed data
- [ ] Test API endpoints
- [ ] Configure production database
- [ ] Set up backups
- [ ] Monitor performance

---

**End of Database Documentation**
