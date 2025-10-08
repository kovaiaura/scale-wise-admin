# Integration Guide: Frontend to Full-Stack Weighbridge System

## Table of Contents
1. [Current State Assessment](#current-state-assessment)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Database Setup](#database-setup)
5. [Spring Boot Backend Setup](#spring-boot-backend-setup)
6. [Core Backend Components](#core-backend-components)
7. [Authentication Implementation](#authentication-implementation)
8. [API Endpoints Implementation](#api-endpoints-implementation)
9. [Frontend Integration](#frontend-integration)
10. [Local Development Workflow](#local-development-workflow)
11. [Docker Deployment](#docker-deployment)
12. [Testing Strategy](#testing-strategy)
13. [Common Issues & Solutions](#common-issues-solutions)
14. [Production Deployment](#production-deployment)
15. [Quick Reference](#quick-reference)

---

## Current State Assessment

### What You Have
✅ **Frontend Application (React + TypeScript + Vite)**
- Complete UI with all weighbridge features
- Mock data stored in localStorage
- API service layer ready (`src/services/api/`)
- Authentication UI (no real auth yet)
- Full operator console with weighment workflows

### What You Need
❌ **Spring Boot Backend** - Not created yet
❌ **PostgreSQL Database** - Not created yet
❌ **Real Authentication** - Using mock credentials
❌ **Data Persistence** - Currently using localStorage

### Integration Points Already Prepared
The frontend is **integration-ready** with:
- `src/config/api.ts` - API endpoint configuration
- `src/services/apiClient.ts` - Axios-based HTTP client with JWT support
- `src/services/api/` - Service modules for each domain
  - `billService.ts` - Bills management
  - `openTicketService.ts` - Open tickets
  - `storedTareService.ts` - Stored tares
  - `masterDataService.ts` - Vehicles, parties, products
  - `serialNumberService.ts` - Serial number generation

---

## Prerequisites

### Required Software

#### 1. Java Development Kit (JDK 17+)
```bash
# Check if installed
java -version

# Download from:
# https://adoptium.net/ (recommended)
# or https://www.oracle.com/java/technologies/downloads/
```

#### 2. Maven (Build Tool)
```bash
# Check if installed
mvn -version

# Download from:
# https://maven.apache.org/download.cgi

# Or use wrapper (recommended - included in Spring Boot projects)
./mvnw --version
```

#### 3. PostgreSQL (Database)
```bash
# Check if installed
psql --version

# Download from:
# https://www.postgresql.org/download/

# Or use Docker:
docker run --name weighbridge-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

#### 4. Node.js (Already installed for frontend)
```bash
# Verify
node --version  # Should be 18+
npm --version
```

### Development Tools (Recommended)

- **IDE**: IntelliJ IDEA Community Edition or VS Code with Java extensions
- **Database Tool**: pgAdmin, DBeaver, or TablePlus
- **API Testing**: Postman or Bruno
- **Git**: For version control

### Environment Verification Checklist

```bash
# Run these commands to verify your setup
java -version          # Should show Java 17+
mvn -version          # Should show Maven 3.6+
psql --version        # Should show PostgreSQL 12+
node --version        # Should show Node 18+
docker --version      # Optional but recommended
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   React Frontend (Port 5173)                        │   │
│  │   - Vite Dev Server                                 │   │
│  │   - React Router                                    │   │
│  │   - Tailwind CSS                                    │   │
│  │   - API Services (Axios)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Spring Boot Backend (Port 8080)                   │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │  Controllers (REST API)                     │   │   │
│  │   │  - BillController                           │   │   │
│  │   │  - TicketController                         │   │   │
│  │   │  - VehicleController                        │   │   │
│  │   │  - AuthController                           │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │  Services (Business Logic)                  │   │   │
│  │   │  - BillService                              │   │   │
│  │   │  - TicketService                            │   │   │
│  │   │  - SerialNumberService                      │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │  Security                                   │   │   │
│  │   │  - JWT Authentication                       │   │   │
│  │   │  - Spring Security Config                   │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ JDBC/JPA
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   PostgreSQL Database (Port 5432)                   │   │
│  │   - users (authentication)                          │   │
│  │   - user_roles (authorization)                      │   │
│  │   - bills (weighment records)                       │   │
│  │   - open_tickets (incomplete weighments)           │   │
│  │   - stored_tares (vehicle tare weights)            │   │
│  │   - vehicles, parties, products (master data)      │   │
│  │   - serial_number_config (bill numbering)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Creating a Bill

```
1. User fills form in React OperatorConsole
         ↓
2. Frontend calls billService.saveBill()
         ↓
3. API Client sends POST /api/bills with JWT token
         ↓
4. Spring Security validates JWT
         ↓
5. BillController receives request
         ↓
6. BillService processes business logic
         ↓
7. BillRepository saves to PostgreSQL
         ↓
8. Response flows back through layers
         ↓
9. Frontend updates UI with new bill
```

---

## Database Setup

### Step 1: Create PostgreSQL Database

#### Option A: Using psql Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE weighbridge_db;

# Create user (optional but recommended)
CREATE USER weighbridge_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE weighbridge_db TO weighbridge_user;

# Connect to the new database
\c weighbridge_db

# Exit
\q
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `weighbridge_db`
4. Owner: postgres (or create new user)
5. Click "Save"

#### Option C: Using Docker
```bash
# Create and start PostgreSQL container
docker run --name weighbridge-postgres \
  -e POSTGRES_DB=weighbridge_db \
  -e POSTGRES_USER=weighbridge_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v weighbridge_data:/var/lib/postgresql/data \
  -d postgres:15

# Verify it's running
docker ps

# Connect to it
docker exec -it weighbridge-postgres psql -U weighbridge_user -d weighbridge_db
```

### Step 2: Run Database Schema

The complete schema is in `DATABASE_DOCUMENTATION.md`. Here's how to execute it:

#### Method 1: Using psql
```bash
# Save the schema to a file first (copy from DATABASE_DOCUMENTATION.md)
# Then run:
psql -U weighbridge_user -d weighbridge_db -f schema.sql
```

#### Method 2: Using Database Tool
1. Open pgAdmin/DBeaver
2. Connect to `weighbridge_db`
3. Open Query Tool
4. Copy entire schema from `DATABASE_DOCUMENTATION.md`
5. Execute

### Step 3: Verify Schema Creation

```sql
-- List all tables
\dt

-- Should see:
-- users
-- user_roles
-- tenants
-- vehicles
-- parties
-- products
-- bills
-- open_tickets
-- stored_tares
-- serial_number_config
-- weighment_transactions

-- Check table structure
\d users
\d bills
```

### Step 4: Insert Seed Data

```sql
-- Create admin user (password: admin123)
-- Password hash is BCrypt encoded
INSERT INTO users (id, username, email, password_hash, tenant_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@weighbridge.com',
  '$2a$10$qbVX8LkFvXjKtJpKXNpkLeLXXU3Z5J5PQXJ7Xh8qXKZVF8E5K5L8S', -- admin123
  (SELECT id FROM tenants LIMIT 1),
  NOW(),
  NOW()
);

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM users WHERE username = 'admin';

-- Insert sample vehicles
INSERT INTO vehicles (vehicle_no, vehicle_type, owner_name, created_at, updated_at)
VALUES
  ('MH12AB1234', 'Truck', 'ABC Transport', NOW(), NOW()),
  ('MH14CD5678', 'Trailer', 'XYZ Logistics', NOW(), NOW()),
  ('GJ01EF9012', 'Truck', 'PQR Carriers', NOW(), NOW());

-- Insert sample parties
INSERT INTO parties (party_name, contact_person, phone, email, address, created_at, updated_at)
VALUES
  ('Steel Industries Ltd', 'John Doe', '9876543210', 'john@steel.com', '123 Industrial Area', NOW(), NOW()),
  ('Cement Corp', 'Jane Smith', '9876543211', 'jane@cement.com', '456 Factory Road', NOW(), NOW()),
  ('Coal Traders', 'Bob Johnson', '9876543212', 'bob@coal.com', '789 Mining Zone', NOW(), NOW());

-- Insert sample products
INSERT INTO products (product_name, product_category, unit_of_measurement, created_at, updated_at)
VALUES
  ('Steel Bars', 'Metal', 'MT', NOW(), NOW()),
  ('Cement Bags', 'Construction', 'MT', NOW(), NOW()),
  ('Coal', 'Fuel', 'MT', NOW(), NOW()),
  ('Iron Ore', 'Metal', 'MT', NOW(), NOW());

-- Initialize serial number configuration
INSERT INTO serial_number_config (
  prefix, separator, include_year, include_month, year_format,
  counter_start, counter_padding, current_counter, reset_frequency,
  last_reset_date, created_at, updated_at
)
VALUES (
  'WB', '-', true, true, 'YY',
  1, 5, 1, 'monthly',
  CURRENT_DATE, NOW(), NOW()
);
```

### Step 5: Verify Data

```sql
-- Check users
SELECT username, email FROM users;

-- Check roles
SELECT u.username, ur.role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id;

-- Check master data
SELECT COUNT(*) as vehicle_count FROM vehicles;
SELECT COUNT(*) as party_count FROM parties;
SELECT COUNT(*) as product_count FROM products;

-- Check serial number config
SELECT * FROM serial_number_config;
```

---

## Spring Boot Backend Setup

### Step 1: Create Spring Boot Project

#### Using Spring Initializr (Web Interface)

1. Go to [https://start.spring.io/](https://start.spring.io/)
2. Configure project:
   - **Project**: Maven
   - **Language**: Java
   - **Spring Boot**: 3.2.0 (or latest stable)
   - **Group**: com.weighbridge
   - **Artifact**: backend
   - **Name**: weighbridge-backend
   - **Package name**: com.weighbridge.backend
   - **Packaging**: Jar
   - **Java**: 17

3. Add Dependencies:
   - Spring Web
   - Spring Data JPA
   - PostgreSQL Driver
   - Spring Security
   - Validation
   - Lombok (optional but recommended)

4. Click "Generate" to download zip
5. Extract to your workspace

#### Using Spring Initializr (Command Line)

```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=weighbridge-backend \
  -d groupId=com.weighbridge \
  -d artifactId=backend \
  -d name=weighbridge-backend \
  -d packageName=com.weighbridge.backend \
  -d packaging=jar \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,postgresql,security,validation,lombok \
  -o weighbridge-backend.zip

unzip weighbridge-backend.zip
cd weighbridge-backend
```

### Step 2: Update pom.xml

Add additional dependencies:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.weighbridge</groupId>
    <artifactId>backend</artifactId>
    <version>1.0.0</version>
    <name>weighbridge-backend</name>
    <description>Weighbridge Management System Backend</description>
    
    <properties>
        <java.version>17</java.version>
        <jjwt.version>0.12.3</jjwt.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Dev Tools -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Step 3: Project Structure

Create this folder structure:

```
weighbridge-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── weighbridge/
│   │   │           └── backend/
│   │   │               ├── WeighbridgeBackendApplication.java
│   │   │               ├── config/
│   │   │               │   ├── CorsConfig.java
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   └── JwtConfig.java
│   │   │               ├── controller/
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── BillController.java
│   │   │               │   ├── TicketController.java
│   │   │               │   ├── VehicleController.java
│   │   │               │   ├── PartyController.java
│   │   │               │   ├── ProductController.java
│   │   │               │   ├── StoredTareController.java
│   │   │               │   └── SerialNumberController.java
│   │   │               ├── dto/
│   │   │               │   ├── LoginRequest.java
│   │   │               │   ├── LoginResponse.java
│   │   │               │   ├── BillDTO.java
│   │   │               │   ├── TicketDTO.java
│   │   │               │   └── ErrorResponse.java
│   │   │               ├── entity/
│   │   │               │   ├── User.java
│   │   │               │   ├── UserRole.java
│   │   │               │   ├── Bill.java
│   │   │               │   ├── OpenTicket.java
│   │   │               │   ├── StoredTare.java
│   │   │               │   ├── Vehicle.java
│   │   │               │   ├── Party.java
│   │   │               │   ├── Product.java
│   │   │               │   └── SerialNumberConfig.java
│   │   │               ├── repository/
│   │   │               │   ├── UserRepository.java
│   │   │               │   ├── UserRoleRepository.java
│   │   │               │   ├── BillRepository.java
│   │   │               │   ├── OpenTicketRepository.java
│   │   │               │   ├── StoredTareRepository.java
│   │   │               │   ├── VehicleRepository.java
│   │   │               │   ├── PartyRepository.java
│   │   │               │   ├── ProductRepository.java
│   │   │               │   └── SerialNumberConfigRepository.java
│   │   │               ├── service/
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── BillService.java
│   │   │               │   ├── TicketService.java
│   │   │               │   ├── VehicleService.java
│   │   │               │   ├── PartyService.java
│   │   │               │   ├── ProductService.java
│   │   │               │   ├── StoredTareService.java
│   │   │               │   ├── SerialNumberService.java
│   │   │               │   └── JwtService.java
│   │   │               ├── security/
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   └── UserDetailsServiceImpl.java
│   │   │               └── exception/
│   │   │                   ├── GlobalExceptionHandler.java
│   │   │                   ├── ResourceNotFoundException.java
│   │   │                   └── UnauthorizedException.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-dev.yml
│   └── test/
│       └── java/
│           └── com/
│               └── weighbridge/
│                   └── backend/
│                       └── WeighbridgeBackendApplicationTests.java
├── pom.xml
├── .gitignore
└── README.md
```

### Step 4: Configure application.yml

Create `src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: weighbridge-backend
  
  profiles:
    active: dev
  
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_db
    username: weighbridge_user
    password: your_secure_password
    driver-class-name: org.postgresql.Driver
    
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 1200000
  
  jpa:
    hibernate:
      ddl-auto: validate  # Use 'validate' in production, 'update' for dev
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        use_sql_comments: true
    open-in-view: false
  
  jackson:
    serialization:
      write-dates-as-timestamps: false
    time-zone: UTC
    default-property-inclusion: non_null

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always
    include-stacktrace: on_param
    include-exception: false

logging:
  level:
    root: INFO
    com.weighbridge.backend: DEBUG
    org.springframework.web: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

jwt:
  secret: your-256-bit-secret-key-change-this-in-production-minimum-32-characters
  expiration: 86400000  # 24 hours in milliseconds

cors:
  allowed-origins: http://localhost:5173
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
  allowed-headers: "*"
  allow-credentials: true
```

Create `src/main/resources/application-dev.yml` for development:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  
  devtools:
    livereload:
      enabled: true

logging:
  level:
    com.weighbridge.backend: DEBUG
```

### Step 5: Build and Verify

```bash
# Navigate to backend directory
cd weighbridge-backend

# Build the project
./mvnw clean install

# Should see "BUILD SUCCESS"

# Run the application
./mvnw spring-boot:run

# You should see:
# - Application started on port 8080
# - Database connection successful
# - No errors in console
```

---

## Core Backend Components

### 1. Entity Classes

#### User Entity
`src/main/java/com/weighbridge/backend/entity/User.java`

```java
package com.weighbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<UserRole> roles = new HashSet<>();
}
```

#### UserRole Entity
`src/main/java/com/weighbridge/backend/entity/UserRole.java`

```java
package com.weighbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "user_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "app_role")
    private AppRole role;
    
    public enum AppRole {
        SUPER_ADMIN,
        ADMIN,
        OPERATOR
    }
}
```

#### Bill Entity
`src/main/java/com/weighbridge/backend/entity/Bill.java`

```java
package com.weighbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "bill_no", nullable = false, unique = true, length = 50)
    private String billNo;
    
    @Column(name = "ticket_no", nullable = false, length = 50)
    private String ticketNo;
    
    @Column(name = "vehicle_no", nullable = false, length = 20)
    private String vehicleNo;
    
    @Column(name = "party_name", nullable = false, length = 200)
    private String partyName;
    
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;
    
    @Column(name = "gross_weight", precision = 10, scale = 2)
    private BigDecimal grossWeight;
    
    @Column(name = "tare_weight", precision = 10, scale = 2)
    private BigDecimal tareWeight;
    
    @Column(name = "net_weight", precision = 10, scale = 2)
    private BigDecimal netWeight;
    
    @Column(name = "charges", precision = 10, scale = 2, nullable = false)
    private BigDecimal charges;
    
    @Column(name = "front_image", columnDefinition = "TEXT")
    private String frontImage;
    
    @Column(name = "rear_image", columnDefinition = "TEXT")
    private String rearImage;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "bill_status")
    private BillStatus status;
    
    @Column(name = "first_weight_type", nullable = false, length = 20)
    private String firstWeightType;
    
    @Column(name = "first_vehicle_status", length = 20)
    private String firstVehicleStatus;
    
    @Column(name = "second_vehicle_status", length = 20)
    private String secondVehicleStatus;
    
    @Column(name = "second_weight_timestamp")
    private LocalDateTime secondWeightTimestamp;
    
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    
    @Column(name = "printed_at")
    private LocalDateTime printedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum BillStatus {
        OPEN,
        CLOSED,
        PRINTED
    }
}
```

#### Vehicle, Party, Product Entities

```java
// Vehicle.java
package com.weighbridge.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "vehicle_no", nullable = false, unique = true, length = 20)
    private String vehicleNo;
    
    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;
    
    @Column(name = "owner_name", length = 200)
    private String ownerName;
    
    @Column(name = "owner_phone", length = 15)
    private String ownerPhone;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

// Party.java
@Entity
@Table(name = "parties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Party {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "party_name", nullable = false, unique = true, length = 200)
    private String partyName;
    
    @Column(name = "contact_person", length = 100)
    private String contactPerson;
    
    @Column(length = 15)
    private String phone;
    
    @Column(length = 100)
    private String email;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

// Product.java
@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "product_name", nullable = false, unique = true, length = 200)
    private String productName;
    
    @Column(name = "product_category", length = 100)
    private String productCategory;
    
    @Column(name = "unit_of_measurement", length = 20)
    private String unitOfMeasurement;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

### 2. Repository Interfaces

```java
// UserRepository.java
package com.weighbridge.backend.repository;

import com.weighbridge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
}

// BillRepository.java
@Repository
public interface BillRepository extends JpaRepository<Bill, UUID> {
    Optional<Bill> findByBillNo(String billNo);
    List<Bill> findByStatus(Bill.BillStatus status);
    List<Bill> findByVehicleNoContainingIgnoreCase(String vehicleNo);
    List<Bill> findByPartyNameContainingIgnoreCase(String partyName);
    List<Bill> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

// VehicleRepository.java
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    Optional<Vehicle> findByVehicleNo(String vehicleNo);
    List<Vehicle> findByVehicleNoContainingIgnoreCase(String vehicleNo);
}

// PartyRepository.java
@Repository
public interface PartyRepository extends JpaRepository<Party, UUID> {
    Optional<Party> findByPartyName(String partyName);
    List<Party> findByPartyNameContainingIgnoreCase(String partyName);
}

// ProductRepository.java
@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findByProductName(String productName);
    List<Product> findByProductNameContainingIgnoreCase(String productName);
}
```

### 3. Service Layer

#### BillService.java

```java
package com.weighbridge.backend.service;

import com.weighbridge.backend.entity.Bill;
import com.weighbridge.backend.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillService {
    
    private final BillRepository billRepository;
    
    @Transactional(readOnly = true)
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Bill getBillById(UUID id) {
        return billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
    }
    
    @Transactional
    public Bill createBill(Bill bill) {
        // Calculate net weight if both gross and tare are present
        if (bill.getGrossWeight() != null && bill.getTareWeight() != null) {
            BigDecimal netWeight = bill.getGrossWeight().subtract(bill.getTareWeight());
            bill.setNetWeight(netWeight);
        }
        
        // Set default status
        if (bill.getStatus() == null) {
            bill.setStatus(Bill.BillStatus.OPEN);
        }
        
        return billRepository.save(bill);
    }
    
    @Transactional
    public Bill updateBill(UUID id, Bill billDetails) {
        Bill bill = getBillById(id);
        
        // Update fields
        if (billDetails.getVehicleNo() != null) {
            bill.setVehicleNo(billDetails.getVehicleNo());
        }
        if (billDetails.getPartyName() != null) {
            bill.setPartyName(billDetails.getPartyName());
        }
        if (billDetails.getProductName() != null) {
            bill.setProductName(billDetails.getProductName());
        }
        if (billDetails.getGrossWeight() != null) {
            bill.setGrossWeight(billDetails.getGrossWeight());
        }
        if (billDetails.getTareWeight() != null) {
            bill.setTareWeight(billDetails.getTareWeight());
        }
        
        // Recalculate net weight
        if (bill.getGrossWeight() != null && bill.getTareWeight() != null) {
            bill.setNetWeight(bill.getGrossWeight().subtract(bill.getTareWeight()));
        }
        
        return billRepository.save(bill);
    }
    
    @Transactional
    public Bill updateBillStatus(UUID id, Bill.BillStatus status) {
        Bill bill = getBillById(id);
        bill.setStatus(status);
        
        if (status == Bill.BillStatus.CLOSED) {
            bill.setClosedAt(LocalDateTime.now());
        } else if (status == Bill.BillStatus.PRINTED) {
            bill.setPrintedAt(LocalDateTime.now());
        }
        
        return billRepository.save(bill);
    }
    
    @Transactional(readOnly = true)
    public List<Bill> searchBills(String query) {
        // Search by vehicle number or party name
        List<Bill> byVehicle = billRepository.findByVehicleNoContainingIgnoreCase(query);
        List<Bill> byParty = billRepository.findByPartyNameContainingIgnoreCase(query);
        
        // Combine and remove duplicates
        byVehicle.addAll(byParty);
        return byVehicle.stream().distinct().toList();
    }
    
    @Transactional(readOnly = true)
    public List<Bill> getBillsByDateRange(LocalDateTime start, LocalDateTime end) {
        return billRepository.findByCreatedAtBetween(start, end);
    }
}
```

---

## Authentication Implementation

### 1. JWT Service

`src/main/java/com/weighbridge/backend/service/JwtService.java`

```java
package com.weighbridge.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }
    
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }
    
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
    
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    private Key getSignInKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

### 2. Security Configuration

`src/main/java/com/weighbridge/backend/config/SecurityConfig.java`

```java
package com.weighbridge.backend.config;

import com.weighbridge.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 3. Authentication Controller

`src/main/java/com/weighbridge/backend/controller/AuthController.java`

```java
package com.weighbridge.backend.controller;

import com.weighbridge.backend.dto.LoginRequest;
import com.weighbridge.backend.dto.LoginResponse;
import com.weighbridge.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // In JWT, logout is typically handled client-side by removing the token
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDetails> getCurrentUser() {
        // Return current user details based on JWT
        return ResponseEntity.ok(authService.getCurrentUser());
    }
}
```

---

## API Endpoints Implementation

### BillController

`src/main/java/com/weighbridge/backend/controller/BillController.java`

```java
package com.weighbridge.backend.controller;

import com.weighbridge.backend.entity.Bill;
import com.weighbridge.backend.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {
    
    private final BillService billService;
    
    @GetMapping
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable UUID id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }
    
    @PostMapping
    public ResponseEntity<Bill> createBill(@Valid @RequestBody Bill bill) {
        Bill created = billService.createBill(bill);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Bill> updateBill(
            @PathVariable UUID id,
            @Valid @RequestBody Bill bill
    ) {
        return ResponseEntity.ok(billService.updateBill(id, bill));
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<Bill> updateBillStatus(
            @PathVariable UUID id,
            @RequestParam Bill.BillStatus status
    ) {
        return ResponseEntity.ok(billService.updateBillStatus(id, status));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Bill>> searchBills(@RequestParam String query) {
        return ResponseEntity.ok(billService.searchBills(query));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Bill>> getBillsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return ResponseEntity.ok(billService.getBillsByDateRange(start, end));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable UUID id) {
        billService.deleteBill(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Complete API Endpoints Summary

All controllers follow similar patterns. See `BACKEND_DOCUMENTATION.md` for complete details on:

- **TicketController** (`/api/tickets`) - Open ticket management
- **VehicleController** (`/api/vehicles`) - Vehicle master data
- **PartyController** (`/api/parties`) - Party master data
- **ProductController** (`/api/products`) - Product master data
- **StoredTareController** (`/api/tares`) - Stored tare management
- **SerialNumberController** (`/api/serial-number`) - Serial number generation

---

## Frontend Integration

### Step 1: Update API Base URL

The frontend already has `src/config/api.ts` configured. You just need to ensure the backend is running on `http://localhost:8080`.

If you need to change the URL:

```typescript
// Option 1: Set programmatically
import { setApiBaseUrl } from '@/config/api';
setApiBaseUrl('http://localhost:8080');

// Option 2: Let users configure via UI
// Already implemented in Settings page
```

### Step 2: Test Connection

```bash
# Start backend
cd weighbridge-backend
./mvnw spring-boot:run

# In another terminal, start frontend
cd weighbridge-frontend
npm run dev

# Test health endpoint
curl http://localhost:8080/api/health
```

### Step 3: Login Flow

1. Open frontend at `http://localhost:5173`
2. Navigate to Login page
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
   - Tenant ID: `default`
4. Click Login
5. JWT token is stored in localStorage
6. All API calls now include `Authorization: Bearer <token>`

### Step 4: Testing Each Feature

#### Test Bills API

```typescript
// Frontend automatically calls this when you:
// 1. Navigate to Operator Console
// 2. Fill weighment form
// 3. Submit

// You can test manually:
import { saveBill } from '@/services/api/billService';

const testBill = {
  id: crypto.randomUUID(),
  billNo: 'WB-25-01-00001',
  ticketNo: 'TKT-001',
  vehicleNo: 'MH12AB1234',
  partyName: 'Steel Industries Ltd',
  productName: 'Steel Bars',
  grossWeight: 25000,
  tareWeight: 5000,
  netWeight: 20000,
  charges: 500,
  status: 'OPEN',
  firstWeightType: 'gross',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await saveBill(testBill);
```

#### Test Master Data

```typescript
// Navigate to Masters pages
// - Masters > Vehicles
// - Masters > Parties
// - Masters > Products

// Data is loaded from backend automatically
```

### Step 5: Verify Data Persistence

1. Create a bill in Operator Console
2. Refresh the page
3. Check if bill appears in Recent Weighments
4. Check database:
   ```sql
   SELECT * FROM bills ORDER BY created_at DESC LIMIT 5;
   ```

---

## Local Development Workflow

### Daily Development Steps

```bash
# 1. Start PostgreSQL (if not running)
# If using system install:
sudo service postgresql start

# If using Docker:
docker start weighbridge-postgres

# 2. Start Backend (Terminal 1)
cd weighbridge-backend
./mvnw spring-boot:run

# Wait for: "Started WeighbridgeBackendApplication in X seconds"

# 3. Start Frontend (Terminal 2)
cd weighbridge-frontend
npm run dev

# Open: http://localhost:5173

# 4. Make changes and test
# - Backend: Changes auto-reload with Spring DevTools
# - Frontend: Hot Module Replacement (HMR) active
```

### Development Tips

#### Backend Hot Reload
Add to `pom.xml` (already included):
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

#### Frontend Proxy (Optional)
If you want to avoid CORS, add to `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
```

Then update `src/config/api.ts`:
```typescript
export const getApiBaseUrl = (): string => {
  return ''; // Empty for proxy
};
```

### Debugging

#### Backend Debugging
```bash
# Run with debug enabled
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# Connect IntelliJ IDEA debugger to port 5005
```

#### Frontend Debugging
- Use browser DevTools
- Check Console for errors
- Check Network tab for API calls
- Use React DevTools extension

#### Database Debugging
```sql
-- Check recent bills
SELECT * FROM bills ORDER BY created_at DESC LIMIT 10;

-- Check open tickets
SELECT * FROM open_tickets;

-- Check user authentication
SELECT u.username, ur.role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id;
```

---

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: weighbridge-db
    environment:
      POSTGRES_DB: weighbridge_db
      POSTGRES_USER: weighbridge_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-your_secure_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    networks:
      - weighbridge-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U weighbridge_user -d weighbridge_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Spring Boot Backend
  backend:
    build:
      context: ./weighbridge-backend
      dockerfile: Dockerfile
    container_name: weighbridge-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/weighbridge_db
      SPRING_DATASOURCE_USERNAME: weighbridge_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-your_secure_password}
      JWT_SECRET: ${JWT_SECRET:-your-256-bit-secret-key-change-this}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - weighbridge-network
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./weighbridge-frontend
      dockerfile: Dockerfile
    container_name: weighbridge-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - weighbridge-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  weighbridge-network:
    driver: bridge
```

### Backend Dockerfile

Create `weighbridge-backend/Dockerfile`:

```dockerfile
# Multi-stage build for Spring Boot

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile

Create `weighbridge-frontend/Dockerfile`:

```dockerfile
# Multi-stage build for React

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built app from build stage
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `weighbridge-frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Stop and remove volumes (deletes data)
docker-compose down -v
```

---

## Testing Strategy

### Backend Testing

#### Unit Tests
```java
@SpringBootTest
class BillServiceTest {
    
    @Autowired
    private BillService billService;
    
    @MockBean
    private BillRepository billRepository;
    
    @Test
    void testCreateBill() {
        // Arrange
        Bill bill = new Bill();
        bill.setBillNo("TEST-001");
        bill.setVehicleNo("MH12AB1234");
        
        when(billRepository.save(any())).thenReturn(bill);
        
        // Act
        Bill created = billService.createBill(bill);
        
        // Assert
        assertNotNull(created);
        assertEquals("TEST-001", created.getBillNo());
    }
}
```

#### Integration Tests
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase
class BillControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testGetAllBills() {
        ResponseEntity<List> response = restTemplate
            .withBasicAuth("admin", "admin123")
            .getForEntity("/api/bills", List.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

### API Testing with Postman

#### Create Postman Collection

```json
{
  "info": {
    "name": "Weighbridge API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\",\n  \"tenantId\": \"default\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:8080/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Bills",
      "item": [
        {
          "name": "Get All Bills",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/api/bills",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["api", "bills"]
            }
          }
        }
      ]
    }
  ]
}
```

### Frontend Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue 1: Connection Refused

**Symptom**: Frontend shows "Connection refused" or "Network Error"

**Solution**:
```bash
# Check if backend is running
curl http://localhost:8080/api/health

# Check if PostgreSQL is running
psql -U weighbridge_user -d weighbridge_db -c "SELECT 1"

# Verify ports
netstat -an | grep 8080
netstat -an | grep 5432
```

### Issue 2: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:
```java
// Verify CorsConfig.java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:5173")
                    .allowedMethods("*")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

### Issue 3: JWT Token Validation Fails

**Symptom**: 401 Unauthorized even after login

**Solution**:
```typescript
// Check if token is stored
console.log(localStorage.getItem('jwt_token'));

// Check Authorization header
// In apiClient.ts
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Issue 4: Database Connection Failed

**Symptom**: Backend fails to start with database errors

**Solution**:
```bash
# Verify database exists
psql -U postgres -c "\l" | grep weighbridge

# Check credentials in application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_db
    username: weighbridge_user
    password: your_secure_password

# Test connection
psql -U weighbridge_user -d weighbridge_db
```

### Issue 5: Port Already in Use

**Symptom**: "Port 8080 is already in use"

**Solution**:
```bash
# Find process using port 8080
lsof -i :8080
# or
netstat -ano | findstr :8080

# Kill the process
kill -9 <PID>

# Or change port in application.yml
server:
  port: 8081
```

### Issue 6: Migration/Schema Errors

**Symptom**: "Table already exists" or "Column not found"

**Solution**:
```bash
# Reset database (DEV ONLY!)
psql -U postgres
DROP DATABASE weighbridge_db;
CREATE DATABASE weighbridge_db;
\q

# Re-run schema
psql -U weighbridge_user -d weighbridge_db -f schema.sql

# Or use Flyway for migrations
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Set up logging and monitoring
- [ ] Remove DevTools dependencies
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate`
- [ ] Enable rate limiting
- [ ] Configure CORS for production domain
- [ ] Set up CI/CD pipeline
- [ ] Load test application
- [ ] Prepare rollback plan

### Environment Variables

Create `.env` file (never commit this):

```bash
# Database
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=weighbridge_db
DB_USER=weighbridge_user
DB_PASSWORD=super-secure-password-123

# JWT
JWT_SECRET=production-secret-key-minimum-32-characters-long-and-random

# Application
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Production application.yml

```yaml
spring:
  profiles:
    active: prod
  
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: false

server:
  port: ${SERVER_PORT}
  error:
    include-message: never
    include-binding-errors: never
    include-stacktrace: never
    include-exception: false

logging:
  level:
    root: WARN
    com.weighbridge.backend: INFO
  file:
    name: /var/log/weighbridge/application.log
    max-size: 10MB
    max-history: 30

jwt:
  secret: ${JWT_SECRET}
  expiration: 3600000  # 1 hour

cors:
  allowed-origins: https://yourdomain.com
  allowed-methods: GET,POST,PUT,DELETE
  allowed-headers: "*"
  allow-credentials: true
```

### Database Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/weighbridge"
DB_NAME="weighbridge_db"
DB_USER="weighbridge_user"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump"

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump"
```

### Monitoring

#### Health Check Endpoint

Already implemented: `GET /api/health`

#### Application Metrics

Add Spring Boot Actuator:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

---

## Quick Reference

### Important Commands

```bash
# Database
psql -U weighbridge_user -d weighbridge_db
pg_dump -U weighbridge_user weighbridge_db > backup.sql
psql -U weighbridge_user weighbridge_db < backup.sql

# Backend
./mvnw clean install
./mvnw spring-boot:run
./mvnw test

# Frontend
npm install
npm run dev
npm run build
npm test

# Docker
docker-compose up -d
docker-compose logs -f backend
docker-compose down
docker-compose restart backend
```

### API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/bills` | GET | Get all bills |
| `/api/bills` | POST | Create bill |
| `/api/bills/{id}` | GET | Get bill by ID |
| `/api/bills/{id}` | PUT | Update bill |
| `/api/bills/{id}/status` | PATCH | Update status |
| `/api/tickets` | GET | Get all tickets |
| `/api/tickets/open` | GET | Get open tickets |
| `/api/tickets/{id}/close` | POST | Close ticket |
| `/api/vehicles` | GET | Get all vehicles |
| `/api/parties` | GET | Get all parties |
| `/api/products` | GET | Get all products |
| `/api/tares` | GET | Get all stored tares |
| `/api/tares/vehicle/{no}` | GET | Get tare by vehicle |
| `/api/serial-number/next` | GET | Get next serial number |
| `/api/serial-number/config` | GET | Get config |
| `/api/serial-number/config` | PUT | Update config |

### Troubleshooting Flowchart

```
Issue Occurred
     ↓
Is Backend Running? ─NO→ Start Backend (mvnw spring-boot:run)
     ↓ YES
Is Database Running? ─NO→ Start PostgreSQL
     ↓ YES
Can You Access /api/health? ─NO→ Check Firewall/Port
     ↓ YES
Is Frontend Running? ─NO→ Start Frontend (npm run dev)
     ↓ YES
Can You Login? ─NO→ Check Credentials/JWT Config
     ↓ YES
Check Browser Console for Errors
     ↓
Check Network Tab for Failed Requests
     ↓
Check Backend Logs
     ↓
Still Stuck? Check Common Issues Section
```

### Useful Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI

---

## Next Steps

1. ✅ Complete this integration guide
2. ⬜ Set up development environment
3. ⬜ Create Spring Boot project
4. ⬜ Set up PostgreSQL database
5. ⬜ Implement authentication
6. ⬜ Implement API endpoints
7. ⬜ Connect frontend to backend
8. ⬜ Test all features
9. ⬜ Deploy with Docker
10. ⬜ Go to production

---

**Need Help?**

- Review `BACKEND_DOCUMENTATION.md` for detailed API specifications
- Review `DATABASE_DOCUMENTATION.md` for complete schema
- Check the Common Issues section above
- Test each component individually before integration
- Use logging and debugging tools extensively

Good luck with your integration! 🚀