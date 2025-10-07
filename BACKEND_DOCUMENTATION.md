# WeighBridge Pro - Backend Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [Data Models & Entities](#data-models--entities)
5. [REST API Endpoints](#rest-api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Business Logic Requirements](#business-logic-requirements)
8. [External Integrations](#external-integrations)
9. [Project Structure](#project-structure)
10. [Development Setup](#development-setup)
11. [Docker Deployment](#docker-deployment)
12. [Testing Strategy](#testing-strategy)
13. [Appendix](#appendix)

---

## System Overview

**WeighBridge Pro** is a comprehensive weighbridge management system that handles:
- Vehicle weighment operations (Two-Trip, One-Time, Stored Tare)
- Bill generation and management
- Master data management (Vehicles, Parties, Products)
- User authentication and role-based access control
- Real-time camera feed integration
- Serial number configuration
- Print template management
- Reports and analytics

### Key Business Flows

#### Two-Trip Weighment (Regular)
1. Vehicle arrives → Create open ticket with first weight (Tare/Gross)
2. Vehicle departs/returns → Complete weighment with second weight
3. System calculates net weight → Generate bill

#### One-Time Weighment (Quick)
1. Weigh vehicle once
2. Enter stored tare or estimate
3. Generate bill immediately

#### Stored Tare Weighment (Shuttle)
1. Pre-register vehicle with tare weight
2. Future weighments auto-use stored tare
3. Handles expiry and reset frequency

---

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2+ (Java 17+)
- **Database**: PostgreSQL 15+
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security + JWT
- **API Documentation**: Swagger/OpenAPI 3
- **Build Tool**: Maven or Gradle
- **Containerization**: Docker + Docker Compose

### Key Dependencies
```xml
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
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Swagger/OpenAPI -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.2.0</version>
    </dependency>

    <!-- Lombok (optional but recommended) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Database Design

### Conceptual ERD

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Tenants   │────────▶│    Users     │────────▶│  User_Roles │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────┐         ┌──────────────┐     ┌─────────────┐
│    Bills    │         │ Open_Tickets │     │Stored_Tares │
└─────────────┘         └──────────────┘     └─────────────┘
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌─────────────┐ ┌──────────┐ ┌──────────┐
        │  Vehicles   │ │ Parties  │ │ Products │
        └─────────────┘ └──────────┘ └──────────┘

┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│Serial_Number_     │  │  Camera_Config   │  │Weighbridge_      │
│Config             │  │                  │  │Config            │
└───────────────────┘  └──────────────────┘  └──────────────────┘

┌───────────────────┐
│Print_Templates    │
└───────────────────┘
```

### Database Schema (PostgreSQL)

```sql
-- Tenants Table
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Table
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, ADMIN, OPERATOR
    UNIQUE(user_id, role)
);

-- Bills Table
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    bill_no VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    first_weight DECIMAL(10,2),
    second_weight DECIMAL(10,2),
    net_weight DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- COMPLETED, PENDING, CANCELLED
    weight_type VARCHAR(20) NOT NULL, -- TWO_TRIP, ONE_TIME, STORED_TARE
    tare_weight DECIMAL(10,2),
    gross_weight DECIMAL(10,2),
    charges DECIMAL(10,2),
    notes TEXT,
    operator_name VARCHAR(255),
    camera1_image_path VARCHAR(500),
    camera2_image_path VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Open Tickets Table
CREATE TABLE open_tickets (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    ticket_no VARCHAR(50) UNIQUE NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    first_weight DECIMAL(10,2) NOT NULL,
    weight_type VARCHAR(20) NOT NULL, -- TARE_FIRST, GROSS_FIRST
    operator_name VARCHAR(255),
    camera1_image_path VARCHAR(500),
    camera2_image_path VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Stored Tares Table
CREATE TABLE stored_tares (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    vehicle_no VARCHAR(50) NOT NULL,
    tare_weight DECIMAL(10,2) NOT NULL,
    party_name VARCHAR(255),
    product_name VARCHAR(255),
    reset_frequency VARCHAR(20), -- DAILY, WEEKLY, MONTHLY, NONE
    last_used_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, vehicle_no)
);

-- Vehicles Table
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    vehicle_no VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(100),
    owner_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BLACKLISTED
    tare_weight DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, vehicle_no)
);

-- Parties Table
CREATE TABLE parties (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    party_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gstin VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, party_name)
);

-- Products Table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(50),
    category VARCHAR(100),
    unit VARCHAR(20), -- KG, TON, QUINTAL
    rate_per_unit DECIMAL(10,2),
    hsn_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_name)
);

-- Serial Number Configuration Table
CREATE TABLE serial_number_config (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) UNIQUE,
    prefix VARCHAR(20),
    suffix VARCHAR(20),
    separator VARCHAR(5) DEFAULT '-',
    start_from INTEGER DEFAULT 1,
    current_number INTEGER DEFAULT 1,
    padding INTEGER DEFAULT 4,
    include_year BOOLEAN DEFAULT FALSE,
    year_format VARCHAR(10), -- YY, YYYY
    include_month BOOLEAN DEFAULT FALSE,
    month_format VARCHAR(10), -- MM, MMM, MMMM
    reset_frequency VARCHAR(20), -- NONE, DAILY, MONTHLY, YEARLY
    last_reset_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Camera Configuration Table
CREATE TABLE camera_config (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) UNIQUE,
    camera1_enabled BOOLEAN DEFAULT FALSE,
    camera1_ip VARCHAR(50),
    camera1_port INTEGER,
    camera1_username VARCHAR(100),
    camera1_password VARCHAR(255),
    camera2_enabled BOOLEAN DEFAULT FALSE,
    camera2_ip VARCHAR(50),
    camera2_port INTEGER,
    camera2_username VARCHAR(100),
    camera2_password VARCHAR(255),
    storage_path VARCHAR(500) DEFAULT '/var/weighbridge/images',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weighbridge Configuration Table
CREATE TABLE weighbridge_config (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) UNIQUE,
    connection_type VARCHAR(20), -- SERIAL, NETWORK
    serial_port VARCHAR(50),
    baud_rate INTEGER DEFAULT 9600,
    network_ip VARCHAR(50),
    network_port INTEGER,
    unit VARCHAR(10) DEFAULT 'KG', -- KG, TON
    tolerance DECIMAL(10,2) DEFAULT 5.0,
    auto_capture BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Templates Table
CREATE TABLE print_templates (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    template_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    paper_size VARCHAR(20) DEFAULT 'A4',
    orientation VARCHAR(20) DEFAULT 'portrait',
    show_logo BOOLEAN DEFAULT TRUE,
    show_qr_code BOOLEAN DEFAULT TRUE,
    show_barcode BOOLEAN DEFAULT FALSE,
    header_text TEXT,
    footer_text TEXT,
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_bills_tenant_date ON bills(tenant_id, date DESC);
CREATE INDEX idx_bills_vehicle ON bills(vehicle_no);
CREATE INDEX idx_bills_party ON bills(party_name);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_open_tickets_tenant ON open_tickets(tenant_id);
CREATE INDEX idx_open_tickets_vehicle ON open_tickets(vehicle_no);
CREATE INDEX idx_stored_tares_tenant_vehicle ON stored_tares(tenant_id, vehicle_no);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_username ON users(username);
```

---

## Data Models & Entities

### Enums

```java
// AppRole.java
public enum AppRole {
    SUPER_ADMIN,
    ADMIN,
    OPERATOR
}

// BillStatus.java
public enum BillStatus {
    COMPLETED,
    PENDING,
    CANCELLED
}

// WeightType.java
public enum WeightType {
    TWO_TRIP,
    ONE_TIME,
    STORED_TARE
}

// VehicleStatus.java
public enum VehicleStatus {
    ACTIVE,
    INACTIVE,
    BLACKLISTED
}

// ResetFrequency.java
public enum ResetFrequency {
    NONE,
    DAILY,
    WEEKLY,
    MONTHLY,
    YEARLY
}

// YearFormat.java
public enum YearFormat {
    YY,
    YYYY
}

// MonthFormat.java
public enum MonthFormat {
    MM,
    MMM,
    MMMM
}

// ConnectionType.java
public enum ConnectionType {
    SERIAL,
    NETWORK
}
```

### Entity Classes

```java
// Tenant.java
@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "subscription_plan")
    private String subscriptionPlan;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<User> users;
}

// User.java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name")
    private String fullName;

    private String email;

    private String phone;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Set<UserRole> roles = new HashSet<>();
}

// UserRole.java
@Entity
@Table(name = "user_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role;
}

// Bill.java
@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "bill_no", unique = true, nullable = false)
    private String billNo;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    @Column(name = "vehicle_no", nullable = false)
    private String vehicleNo;

    @Column(name = "party_name", nullable = false)
    private String partyName;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "first_weight")
    private BigDecimal firstWeight;

    @Column(name = "second_weight")
    private BigDecimal secondWeight;

    @Column(name = "net_weight", nullable = false)
    private BigDecimal netWeight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "weight_type", nullable = false)
    private WeightType weightType;

    @Column(name = "tare_weight")
    private BigDecimal tareWeight;

    @Column(name = "gross_weight")
    private BigDecimal grossWeight;

    private BigDecimal charges;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "operator_name")
    private String operatorName;

    @Column(name = "camera1_image_path")
    private String camera1ImagePath;

    @Column(name = "camera2_image_path")
    private String camera2ImagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// OpenTicket.java
@Entity
@Table(name = "open_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "ticket_no", unique = true, nullable = false)
    private String ticketNo;

    @Column(name = "vehicle_no", nullable = false)
    private String vehicleNo;

    @Column(name = "party_name", nullable = false)
    private String partyName;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "first_weight", nullable = false)
    private BigDecimal firstWeight;

    @Enumerated(EnumType.STRING)
    @Column(name = "weight_type", nullable = false)
    private WeightType weightType;

    @Column(name = "operator_name")
    private String operatorName;

    @Column(name = "camera1_image_path")
    private String camera1ImagePath;

    @Column(name = "camera2_image_path")
    private String camera2ImagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}

// StoredTare.java
@Entity
@Table(name = "stored_tares")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoredTare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "vehicle_no", nullable = false)
    private String vehicleNo;

    @Column(name = "tare_weight", nullable = false)
    private BigDecimal tareWeight;

    @Column(name = "party_name")
    private String partyName;

    @Column(name = "product_name")
    private String productName;

    @Enumerated(EnumType.STRING)
    @Column(name = "reset_frequency")
    private ResetFrequency resetFrequency;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// Vehicle.java
@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "vehicle_no", nullable = false)
    private String vehicleNo;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "owner_name")
    private String ownerName;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status = VehicleStatus.ACTIVE;

    @Column(name = "tare_weight")
    private BigDecimal tareWeight;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "party_name", nullable = false)
    private String partyName;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String gstin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_code")
    private String productCode;

    private String category;

    private String unit; // KG, TON, QUINTAL

    @Column(name = "rate_per_unit")
    private BigDecimal ratePerUnit;

    @Column(name = "hsn_code")
    private String hsnCode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// SerialNumberConfig.java
@Entity
@Table(name = "serial_number_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SerialNumberConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", unique = true)
    private Tenant tenant;

    private String prefix;

    private String suffix;

    private String separator = "-";

    @Column(name = "start_from")
    private Integer startFrom = 1;

    @Column(name = "current_number")
    private Integer currentNumber = 1;

    private Integer padding = 4;

    @Column(name = "include_year")
    private Boolean includeYear = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "year_format")
    private YearFormat yearFormat;

    @Column(name = "include_month")
    private Boolean includeMonth = false;

    @Column(name = "month_format")
    private String monthFormat;

    @Enumerated(EnumType.STRING)
    @Column(name = "reset_frequency")
    private ResetFrequency resetFrequency = ResetFrequency.NONE;

    @Column(name = "last_reset_at")
    private LocalDateTime lastResetAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// CameraConfig.java
@Entity
@Table(name = "camera_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CameraConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", unique = true)
    private Tenant tenant;

    @Column(name = "camera1_enabled")
    private Boolean camera1Enabled = false;

    @Column(name = "camera1_ip")
    private String camera1Ip;

    @Column(name = "camera1_port")
    private Integer camera1Port;

    @Column(name = "camera1_username")
    private String camera1Username;

    @Column(name = "camera1_password")
    private String camera1Password;

    @Column(name = "camera2_enabled")
    private Boolean camera2Enabled = false;

    @Column(name = "camera2_ip")
    private String camera2Ip;

    @Column(name = "camera2_port")
    private Integer camera2Port;

    @Column(name = "camera2_username")
    private String camera2Username;

    @Column(name = "camera2_password")
    private String camera2Password;

    @Column(name = "storage_path")
    private String storagePath = "/var/weighbridge/images";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// WeighbridgeConfig.java
@Entity
@Table(name = "weighbridge_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeighbridgeConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", unique = true)
    private Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_type")
    private ConnectionType connectionType;

    @Column(name = "serial_port")
    private String serialPort;

    @Column(name = "baud_rate")
    private Integer baudRate = 9600;

    @Column(name = "network_ip")
    private String networkIp;

    @Column(name = "network_port")
    private Integer networkPort;

    private String unit = "KG";

    private BigDecimal tolerance = new BigDecimal("5.0");

    @Column(name = "auto_capture")
    private Boolean autoCapture = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// PrintTemplate.java
@Entity
@Table(name = "print_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrintTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "paper_size")
    private String paperSize = "A4";

    private String orientation = "portrait";

    @Column(name = "show_logo")
    private Boolean showLogo = true;

    @Column(name = "show_qr_code")
    private Boolean showQrCode = true;

    @Column(name = "show_barcode")
    private Boolean showBarcode = false;

    @Column(name = "header_text", columnDefinition = "TEXT")
    private String headerText;

    @Column(name = "footer_text", columnDefinition = "TEXT")
    private String footerText;

    @Column(name = "custom_fields", columnDefinition = "jsonb")
    private String customFields;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

## REST API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response 200 OK:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "string",
  "user": {
    "id": 1,
    "username": "operator1",
    "fullName": "John Doe",
    "email": "john@example.com",
    "roles": ["OPERATOR"],
    "tenantId": 1
  }
}

Response 401 Unauthorized:
{
  "error": "Invalid credentials"
}
```

#### 2. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}

Response 200 OK:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "string"
}
```

### Bill Management Endpoints

#### 1. Get All Bills (with pagination and filters)
```http
GET /api/bills?page=0&size=20&sort=date,desc&status=COMPLETED&vehicleNo=MH12AB1234&fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer {token}

Response 200 OK:
{
  "content": [
    {
      "id": 1,
      "billNo": "WB-2025-0001",
      "date": "2025-01-15",
      "time": "14:30:00",
      "vehicleNo": "MH12AB1234",
      "partyName": "ABC Traders",
      "productName": "Wheat",
      "firstWeight": 15000.00,
      "secondWeight": 5000.00,
      "netWeight": 10000.00,
      "tareWeight": 5000.00,
      "grossWeight": 15000.00,
      "status": "COMPLETED",
      "weightType": "TWO_TRIP",
      "charges": 500.00,
      "operatorName": "John Doe",
      "camera1ImagePath": "/images/2025/01/15/cam1_123456.jpg",
      "camera2ImagePath": "/images/2025/01/15/cam2_123456.jpg",
      "notes": "Premium quality",
      "createdAt": "2025-01-15T14:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 150,
  "totalPages": 8,
  "last": false
}
```

#### 2. Get Bill by ID
```http
GET /api/bills/{id}
Authorization: Bearer {token}

Response 200 OK:
{
  "id": 1,
  "billNo": "WB-2025-0001",
  ...
}

Response 404 Not Found:
{
  "error": "Bill not found"
}
```

#### 3. Create New Bill (Quick Weighment)
```http
POST /api/bills
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleNo": "MH12AB1234",
  "partyName": "ABC Traders",
  "productName": "Wheat",
  "grossWeight": 15000.00,
  "tareWeight": 5000.00,
  "charges": 500.00,
  "notes": "Premium quality",
  "weightType": "ONE_TIME"
}

Response 201 Created:
{
  "id": 1,
  "billNo": "WB-2025-0001",
  "date": "2025-01-15",
  "time": "14:30:00",
  "vehicleNo": "MH12AB1234",
  "netWeight": 10000.00,
  "status": "COMPLETED",
  ...
}
```

#### 4. Update Bill
```http
PUT /api/bills/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "charges": 600.00,
  "notes": "Updated notes"
}

Response 200 OK:
{
  "id": 1,
  "billNo": "WB-2025-0001",
  ...
}
```

#### 5. Delete Bill
```http
DELETE /api/bills/{id}
Authorization: Bearer {token}

Response 204 No Content
```

#### 6. Search Bills
```http
GET /api/bills/search?q=ABC&searchBy=party
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": 1,
    "billNo": "WB-2025-0001",
    "partyName": "ABC Traders",
    ...
  }
]
```

### Open Tickets Endpoints

#### 1. Get All Open Tickets
```http
GET /api/tickets/open
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": 1,
    "ticketNo": "TKT-2025-0001",
    "vehicleNo": "MH12AB1234",
    "partyName": "ABC Traders",
    "productName": "Wheat",
    "firstWeight": 15000.00,
    "weightType": "GROSS_FIRST",
    "operatorName": "John Doe",
    "createdAt": "2025-01-15T10:00:00",
    "expiresAt": "2025-01-16T10:00:00"
  }
]
```

#### 2. Create Open Ticket (First Weighment)
```http
POST /api/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleNo": "MH12AB1234",
  "partyName": "ABC Traders",
  "productName": "Wheat",
  "firstWeight": 15000.00,
  "weightType": "GROSS_FIRST"
}

Response 201 Created:
{
  "id": 1,
  "ticketNo": "TKT-2025-0001",
  "vehicleNo": "MH12AB1234",
  "firstWeight": 15000.00,
  ...
}
```

#### 3. Complete Open Ticket (Second Weighment → Generate Bill)
```http
POST /api/tickets/{id}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "secondWeight": 5000.00,
  "charges": 500.00,
  "notes": "Completed"
}

Response 200 OK:
{
  "bill": {
    "id": 1,
    "billNo": "WB-2025-0001",
    "netWeight": 10000.00,
    "status": "COMPLETED",
    ...
  }
}
```

#### 4. Delete Open Ticket
```http
DELETE /api/tickets/{id}
Authorization: Bearer {token}

Response 204 No Content
```

### Stored Tare Endpoints

#### 1. Get All Stored Tares
```http
GET /api/tares
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": 1,
    "vehicleNo": "MH12AB1234",
    "tareWeight": 5000.00,
    "partyName": "ABC Traders",
    "productName": "Wheat",
    "resetFrequency": "MONTHLY",
    "lastUsedAt": "2025-01-15T14:30:00",
    "createdAt": "2025-01-01T00:00:00"
  }
]
```

#### 2. Get Stored Tare by Vehicle Number
```http
GET /api/tares/vehicle/{vehicleNo}
Authorization: Bearer {token}

Response 200 OK:
{
  "id": 1,
  "vehicleNo": "MH12AB1234",
  "tareWeight": 5000.00,
  ...
}

Response 404 Not Found:
{
  "error": "No stored tare found for this vehicle"
}
```

#### 3. Create Stored Tare
```http
POST /api/tares
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleNo": "MH12AB1234",
  "tareWeight": 5000.00,
  "partyName": "ABC Traders",
  "productName": "Wheat",
  "resetFrequency": "MONTHLY"
}

Response 201 Created:
{
  "id": 1,
  "vehicleNo": "MH12AB1234",
  "tareWeight": 5000.00,
  ...
}
```

#### 4. Update Stored Tare
```http
PUT /api/tares/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "tareWeight": 5200.00,
  "resetFrequency": "WEEKLY"
}

Response 200 OK:
{
  "id": 1,
  "tareWeight": 5200.00,
  ...
}
```

#### 5. Delete Stored Tare
```http
DELETE /api/tares/{id}
Authorization: Bearer {token}

Response 204 No Content
```

### Master Data Endpoints

#### Vehicles

```http
GET /api/vehicles
POST /api/vehicles
PUT /api/vehicles/{id}
DELETE /api/vehicles/{id}
GET /api/vehicles/{vehicleNo}
```

Example Vehicle Object:
```json
{
  "id": 1,
  "vehicleNo": "MH12AB1234",
  "vehicleType": "Truck",
  "ownerName": "John Doe",
  "status": "ACTIVE",
  "tareWeight": 5000.00,
  "notes": "10-ton capacity",
  "createdAt": "2025-01-01T00:00:00"
}
```

#### Parties

```http
GET /api/parties
POST /api/parties
PUT /api/parties/{id}
DELETE /api/parties/{id}
GET /api/parties/search?name={name}
```

Example Party Object:
```json
{
  "id": 1,
  "partyName": "ABC Traders",
  "contactPerson": "Rajesh Kumar",
  "phone": "+91-9876543210",
  "email": "abc@traders.com",
  "address": "Mumbai, Maharashtra",
  "gstin": "27AABCU9603R1ZM",
  "createdAt": "2025-01-01T00:00:00"
}
```

#### Products

```http
GET /api/products
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}
GET /api/products/search?name={name}
```

Example Product Object:
```json
{
  "id": 1,
  "productName": "Wheat",
  "productCode": "WHT001",
  "category": "Grains",
  "unit": "KG",
  "ratePerUnit": 25.00,
  "hsnCode": "1001",
  "createdAt": "2025-01-01T00:00:00"
}
```

### Configuration Endpoints

#### Serial Number Configuration

```http
GET /api/serial-number/next
GET /api/serial-number/config
PUT /api/serial-number/config
```

Example Config:
```json
{
  "prefix": "WB",
  "suffix": "",
  "separator": "-",
  "startFrom": 1,
  "currentNumber": 150,
  "padding": 4,
  "includeYear": true,
  "yearFormat": "YYYY",
  "includeMonth": false,
  "resetFrequency": "YEARLY"
}
```

Example Next Number Response:
```json
{
  "nextBillNo": "WB-2025-0151"
}
```

#### Camera Configuration

```http
GET /api/camera/config
PUT /api/camera/config
POST /api/camera/capture-both
```

Example Capture Response:
```json
{
  "camera1ImagePath": "/images/2025/01/15/cam1_123456.jpg",
  "camera2ImagePath": "/images/2025/01/15/cam2_123456.jpg",
  "timestamp": "2025-01-15T14:30:00"
}
```

#### Weighbridge Configuration

```http
GET /api/weighbridge/config
PUT /api/weighbridge/config
GET /api/weighbridge/current-weight
```

Example Current Weight Response:
```json
{
  "weight": 15250.50,
  "unit": "KG",
  "stable": true,
  "timestamp": "2025-01-15T14:30:00"
}
```

### User Management Endpoints

```http
GET /api/users
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}
PUT /api/users/{id}/password
```

Example User Object:
```json
{
  "id": 1,
  "username": "operator1",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "roles": ["OPERATOR"],
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00"
}
```

### Reports Endpoint

```http
GET /api/reports/summary?fromDate=2025-01-01&toDate=2025-01-31
GET /api/reports/party-wise?fromDate=2025-01-01&toDate=2025-01-31
GET /api/reports/product-wise?fromDate=2025-01-01&toDate=2025-01-31
GET /api/reports/vehicle-wise?fromDate=2025-01-01&toDate=2025-01-31
```

### Health Check

```http
GET /api/health

Response 200 OK:
{
  "status": "UP",
  "database": "UP",
  "weighbridge": "CONNECTED",
  "cameras": {
    "camera1": "CONNECTED",
    "camera2": "DISCONNECTED"
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "operator1",
  "userId": 1,
  "tenantId": 1,
  "roles": ["OPERATOR"],
  "iat": 1705329000,
  "exp": 1705415400
}
```

### Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/operator/**").hasAnyRole("OPERATOR", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### Role-Based Access Control

| Endpoint | SUPER_ADMIN | ADMIN | OPERATOR |
|----------|-------------|-------|----------|
| Login | ✅ | ✅ | ✅ |
| View Bills | ✅ | ✅ | ✅ |
| Create Bill | ✅ | ✅ | ✅ |
| Delete Bill | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ |
| Manage Master Data | ✅ | ✅ | ❌ |
| System Config | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ (limited) |

---

## Business Logic Requirements

### Serial Number Generation Service

```java
@Service
public class SerialNumberService {

    @Autowired
    private SerialNumberConfigRepository configRepository;

    public synchronized String generateNextBillNumber(Long tenantId) {
        SerialNumberConfig config = configRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("Serial number config not found"));

        // Check if reset is needed
        if (shouldReset(config)) {
            config.setCurrentNumber(config.getStartFrom());
            config.setLastResetAt(LocalDateTime.now());
        }

        // Build bill number
        StringBuilder billNo = new StringBuilder();

        // Add prefix
        if (config.getPrefix() != null) {
            billNo.append(config.getPrefix());
        }

        // Add separator
        if (billNo.length() > 0) {
            billNo.append(config.getSeparator());
        }

        // Add year
        if (config.getIncludeYear()) {
            String year = LocalDate.now().getYear() + "";
            if (config.getYearFormat() == YearFormat.YY) {
                year = year.substring(2);
            }
            billNo.append(year).append(config.getSeparator());
        }

        // Add month
        if (config.getIncludeMonth()) {
            String month = String.format("%02d", LocalDate.now().getMonthValue());
            billNo.append(month).append(config.getSeparator());
        }

        // Add padded number
        String number = String.format("%0" + config.getPadding() + "d", 
                                      config.getCurrentNumber());
        billNo.append(number);

        // Add suffix
        if (config.getSuffix() != null) {
            billNo.append(config.getSeparator()).append(config.getSuffix());
        }

        // Increment and save
        config.setCurrentNumber(config.getCurrentNumber() + 1);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        return billNo.toString();
    }

    private boolean shouldReset(SerialNumberConfig config) {
        if (config.getResetFrequency() == ResetFrequency.NONE) {
            return false;
        }

        LocalDateTime lastReset = config.getLastResetAt();
        if (lastReset == null) {
            return true;
        }

        LocalDateTime now = LocalDateTime.now();

        switch (config.getResetFrequency()) {
            case DAILY:
                return !lastReset.toLocalDate().equals(now.toLocalDate());
            case MONTHLY:
                return lastReset.getMonth() != now.getMonth() 
                    || lastReset.getYear() != now.getYear();
            case YEARLY:
                return lastReset.getYear() != now.getYear();
            default:
                return false;
        }
    }
}
```

### Stored Tare Validation Service

```java
@Service
public class StoredTareService {

    @Autowired
    private StoredTareRepository tareRepository;

    public StoredTare getValidTareForVehicle(String vehicleNo, Long tenantId) {
        StoredTare tare = tareRepository.findByVehicleNoAndTenantId(vehicleNo, tenantId)
            .orElseThrow(() -> new NotFoundException("No stored tare for vehicle: " + vehicleNo));

        // Check if tare needs reset
        if (shouldResetTare(tare)) {
            throw new TareExpiredException("Stored tare has expired for vehicle: " + vehicleNo);
        }

        // Update last used timestamp
        tare.setLastUsedAt(LocalDateTime.now());
        tareRepository.save(tare);

        return tare;
    }

    private boolean shouldResetTare(StoredTare tare) {
        if (tare.getResetFrequency() == ResetFrequency.NONE) {
            return false;
        }

        LocalDateTime lastUsed = tare.getLastUsedAt();
        if (lastUsed == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        switch (tare.getResetFrequency()) {
            case DAILY:
                return !lastUsed.toLocalDate().equals(now.toLocalDate());
            case WEEKLY:
                return ChronoUnit.WEEKS.between(lastUsed, now) >= 1;
            case MONTHLY:
                return lastUsed.getMonth() != now.getMonth() 
                    || lastUsed.getYear() != now.getYear();
            default:
                return false;
        }
    }
}
```

### Bill Creation Service

```java
@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private SerialNumberService serialNumberService;

    @Autowired
    private StoredTareService storedTareService;

    @Transactional
    public Bill createBillFromOpenTicket(OpenTicket ticket, BigDecimal secondWeight, 
                                         BigDecimal charges, String notes) {
        Bill bill = new Bill();
        
        // Generate bill number
        String billNo = serialNumberService.generateNextBillNumber(ticket.getTenant().getId());
        bill.setBillNo(billNo);
        
        bill.setTenant(ticket.getTenant());
        bill.setDate(LocalDate.now());
        bill.setTime(LocalTime.now());
        bill.setVehicleNo(ticket.getVehicleNo());
        bill.setPartyName(ticket.getPartyName());
        bill.setProductName(ticket.getProductName());
        bill.setFirstWeight(ticket.getFirstWeight());
        bill.setSecondWeight(secondWeight);
        bill.setWeightType(ticket.getWeightType());
        bill.setOperatorName(ticket.getOperatorName());
        bill.setCamera1ImagePath(ticket.getCamera1ImagePath());
        bill.setCamera2ImagePath(ticket.getCamera2ImagePath());
        bill.setCreatedBy(ticket.getCreatedBy());
        bill.setCharges(charges);
        bill.setNotes(notes);

        // Calculate net weight based on weight type
        if (ticket.getWeightType() == WeightType.TWO_TRIP) {
            BigDecimal weight1 = ticket.getFirstWeight();
            BigDecimal weight2 = secondWeight;
            
            // Determine which is tare and which is gross
            if (weight1.compareTo(weight2) > 0) {
                bill.setGrossWeight(weight1);
                bill.setTareWeight(weight2);
            } else {
                bill.setGrossWeight(weight2);
                bill.setTareWeight(weight1);
            }
            
            bill.setNetWeight(bill.getGrossWeight().subtract(bill.getTareWeight()));
        }

        bill.setStatus(BillStatus.COMPLETED);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setUpdatedAt(LocalDateTime.now());

        return billRepository.save(bill);
    }

    @Transactional
    public Bill createQuickBill(BillRequest request, User currentUser) {
        Bill bill = new Bill();
        
        String billNo = serialNumberService.generateNextBillNumber(currentUser.getTenant().getId());
        bill.setBillNo(billNo);
        
        bill.setTenant(currentUser.getTenant());
        bill.setDate(LocalDate.now());
        bill.setTime(LocalTime.now());
        bill.setVehicleNo(request.getVehicleNo());
        bill.setPartyName(request.getPartyName());
        bill.setProductName(request.getProductName());
        bill.setGrossWeight(request.getGrossWeight());
        bill.setTareWeight(request.getTareWeight());
        bill.setNetWeight(request.getGrossWeight().subtract(request.getTareWeight()));
        bill.setWeightType(WeightType.ONE_TIME);
        bill.setStatus(BillStatus.COMPLETED);
        bill.setCharges(request.getCharges());
        bill.setNotes(request.getNotes());
        bill.setOperatorName(currentUser.getFullName());
        bill.setCreatedBy(currentUser);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setUpdatedAt(LocalDateTime.now());

        return billRepository.save(bill);
    }
}
```

---

## External Integrations

### CCTV Camera Integration

Supported camera brands:
- HikVision
- Dahua
- CP Plus
- Generic RTSP/HTTP cameras

```java
@Service
public class CameraService {

    @Autowired
    private CameraConfigRepository configRepository;

    public CaptureResult captureBothCameras(Long tenantId) {
        CameraConfig config = configRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("Camera config not found"));

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        CaptureResult result = new CaptureResult();

        if (config.getCamera1Enabled()) {
            String imagePath = captureFromCamera(
                config.getCamera1Ip(),
                config.getCamera1Port(),
                config.getCamera1Username(),
                config.getCamera1Password(),
                config.getStoragePath(),
                "cam1_" + timestamp
            );
            result.setCamera1ImagePath(imagePath);
        }

        if (config.getCamera2Enabled()) {
            String imagePath = captureFromCamera(
                config.getCamera2Ip(),
                config.getCamera2Port(),
                config.getCamera2Username(),
                config.getCamera2Password(),
                config.getStoragePath(),
                "cam2_" + timestamp
            );
            result.setCamera2ImagePath(imagePath);
        }

        return result;
    }

    private String captureFromCamera(String ip, Integer port, String username, 
                                     String password, String storagePath, String filename) {
        // Implementation for RTSP/HTTP snapshot capture
        // For HikVision: http://{ip}:{port}/ISAPI/Streaming/channels/101/picture
        // For Dahua: http://{ip}:{port}/cgi-bin/snapshot.cgi
        
        String snapshotUrl = String.format("http://%s:%d/ISAPI/Streaming/channels/101/picture", 
                                          ip, port);
        
        // Use HTTP client with basic auth to download image
        // Save to storage path with filename
        // Return relative path for database storage
        
        return String.format("%s/%s.jpg", storagePath, filename);
    }
}
```

### Weighbridge Indicator Integration

Supports:
- Serial Port (RS232/RS485)
- Network/TCP connection

```java
@Service
public class WeighbridgeService {

    @Autowired
    private WeighbridgeConfigRepository configRepository;

    public WeightReading getCurrentWeight(Long tenantId) {
        WeighbridgeConfig config = configRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("Weighbridge config not found"));

        if (config.getConnectionType() == ConnectionType.SERIAL) {
            return readFromSerialPort(config.getSerialPort(), config.getBaudRate());
        } else {
            return readFromNetwork(config.getNetworkIp(), config.getNetworkPort());
        }
    }

    private WeightReading readFromSerialPort(String port, Integer baudRate) {
        // Use jSerialComm or similar library
        // Open serial port with specified baud rate
        // Read data from weighbridge indicator
        // Parse weight value (format depends on indicator model)
        // Example format: "WT:15250.50 KG ST"
        
        // Placeholder implementation
        return new WeightReading(15250.50, "KG", true, LocalDateTime.now());
    }

    private WeightReading readFromNetwork(String ip, Integer port) {
        // Open TCP socket connection
        // Send command to request weight
        // Parse response
        
        // Placeholder implementation
        return new WeightReading(15250.50, "KG", true, LocalDateTime.now());
    }
}
```

---

## Project Structure

```
weighbridge-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── weighbridge/
│   │   │           ├── WeighbridgeApplication.java
│   │   │           ├── config/
│   │   │           │   ├── SecurityConfig.java
│   │   │           │   ├── SwaggerConfig.java
│   │   │           │   ├── CorsConfig.java
│   │   │           │   └── JpaConfig.java
│   │   │           ├── controller/
│   │   │           │   ├── AuthController.java
│   │   │           │   ├── BillController.java
│   │   │           │   ├── OpenTicketController.java
│   │   │           │   ├── StoredTareController.java
│   │   │           │   ├── VehicleController.java
│   │   │           │   ├── PartyController.java
│   │   │           │   ├── ProductController.java
│   │   │           │   ├── UserController.java
│   │   │           │   ├── SerialNumberController.java
│   │   │           │   ├── CameraController.java
│   │   │           │   ├── WeighbridgeController.java
│   │   │           │   └── ReportController.java
│   │   │           ├── dto/
│   │   │           │   ├── request/
│   │   │           │   │   ├── LoginRequest.java
│   │   │           │   │   ├── BillRequest.java
│   │   │           │   │   ├── OpenTicketRequest.java
│   │   │           │   │   └── ...
│   │   │           │   └── response/
│   │   │           │       ├── LoginResponse.java
│   │   │           │       ├── BillResponse.java
│   │   │           │       └── ...
│   │   │           ├── entity/
│   │   │           │   ├── Tenant.java
│   │   │           │   ├── User.java
│   │   │           │   ├── UserRole.java
│   │   │           │   ├── Bill.java
│   │   │           │   ├── OpenTicket.java
│   │   │           │   ├── StoredTare.java
│   │   │           │   ├── Vehicle.java
│   │   │           │   ├── Party.java
│   │   │           │   ├── Product.java
│   │   │           │   └── ...
│   │   │           ├── enums/
│   │   │           │   ├── AppRole.java
│   │   │           │   ├── BillStatus.java
│   │   │           │   ├── WeightType.java
│   │   │           │   └── ...
│   │   │           ├── exception/
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   ├── NotFoundException.java
│   │   │           │   ├── TareExpiredException.java
│   │   │           │   └── ...
│   │   │           ├── repository/
│   │   │           │   ├── TenantRepository.java
│   │   │           │   ├── UserRepository.java
│   │   │           │   ├── BillRepository.java
│   │   │           │   ├── OpenTicketRepository.java
│   │   │           │   ├── StoredTareRepository.java
│   │   │           │   └── ...
│   │   │           ├── security/
│   │   │           │   ├── JwtAuthenticationFilter.java
│   │   │           │   ├── JwtTokenProvider.java
│   │   │           │   └── UserDetailsServiceImpl.java
│   │   │           └── service/
│   │   │               ├── AuthService.java
│   │   │               ├── BillService.java
│   │   │               ├── OpenTicketService.java
│   │   │               ├── StoredTareService.java
│   │   │               ├── SerialNumberService.java
│   │   │               ├── CameraService.java
│   │   │               ├── WeighbridgeService.java
│   │   │               └── ...
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── data.sql (initial seed data)
│   └── test/
│       └── java/
│           └── com/
│               └── weighbridge/
│                   ├── controller/
│                   ├── service/
│                   └── repository/
├── Dockerfile
├── docker-compose.yml
├── pom.xml (or build.gradle)
└── README.md
```

---

## Development Setup

### Prerequisites
- JDK 17 or higher
- Maven 3.8+ or Gradle 7+
- PostgreSQL 15+
- Docker (optional, for containerized deployment)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd weighbridge-backend
```

#### 2. Configure Database
Create PostgreSQL database:
```sql
CREATE DATABASE weighbridge_db;
CREATE USER weighbridge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE weighbridge_db TO weighbridge_user;
```

#### 3. Configure Application Properties
Create `src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: weighbridge-backend
  
  datasource:
    url: jdbc:postgresql://localhost:5432/weighbridge_db
    username: weighbridge_user
    password: your_password
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  jackson:
    time-zone: Asia/Kolkata
    date-format: yyyy-MM-dd HH:mm:ss

server:
  port: 8080
  servlet:
    context-path: /api

# JWT Configuration
jwt:
  secret: your-256-bit-secret-key-here-change-in-production
  expiration: 86400000 # 24 hours in milliseconds
  refresh-expiration: 604800000 # 7 days

# CORS Configuration
cors:
  allowed-origins: http://localhost:8080,http://localhost:5173
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
  allowed-headers: "*"
  allow-credentials: true

# File Upload
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

# Logging
logging:
  level:
    com.weighbridge: DEBUG
    org.springframework.web: INFO
    org.hibernate: INFO

# Swagger
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
  api-docs:
    path: /v3/api-docs
```

#### 4. Build and Run

Using Maven:
```bash
mvn clean install
mvn spring-boot:run
```

Using Gradle:
```bash
gradle clean build
gradle bootRun
```

#### 5. Initialize Sample Data
Create `src/main/resources/data.sql`:

```sql
-- Insert default tenant
INSERT INTO tenants (tenant_name, subscription_plan, created_at, updated_at)
VALUES ('Demo Company', 'PREMIUM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default super admin user (password: admin123)
INSERT INTO users (tenant_id, username, password_hash, full_name, email, is_active, created_at, updated_at)
VALUES (1, 'admin', '$2a$10$YourBCryptHashHere', 'System Admin', 'admin@demo.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert user role
INSERT INTO user_roles (user_id, role)
VALUES (1, 'SUPER_ADMIN');

-- Insert sample operator user (password: operator123)
INSERT INTO users (tenant_id, username, password_hash, full_name, email, is_active, created_at, updated_at)
VALUES (1, 'operator1', '$2a$10$AnotherBCryptHashHere', 'John Operator', 'operator@demo.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role)
VALUES (2, 'OPERATOR');

-- Insert sample vehicles
INSERT INTO vehicles (tenant_id, vehicle_no, vehicle_type, owner_name, status, tare_weight, created_at, updated_at)
VALUES 
(1, 'MH12AB1234', '10-Ton Truck', 'ABC Transport', 'ACTIVE', 5000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'MH14CD5678', '6-Ton Truck', 'XYZ Logistics', 'ACTIVE', 3500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'DL05EF9012', '20-Ton Truck', 'PQR Carriers', 'ACTIVE', 8000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample parties
INSERT INTO parties (tenant_id, party_name, contact_person, phone, email, address, gstin, created_at, updated_at)
VALUES 
(1, 'ABC Traders', 'Rajesh Kumar', '+91-9876543210', 'abc@traders.com', 'Mumbai, Maharashtra', '27AABCU9603R1ZM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'XYZ Industries', 'Amit Patel', '+91-9876543211', 'xyz@industries.com', 'Pune, Maharashtra', '27AABCU9603R1ZN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'PQR Enterprises', 'Suresh Gupta', '+91-9876543212', 'pqr@enterprises.com', 'Nagpur, Maharashtra', '27AABCU9603R1ZO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample products
INSERT INTO products (tenant_id, product_name, product_code, category, unit, rate_per_unit, hsn_code, created_at, updated_at)
VALUES 
(1, 'Wheat', 'WHT001', 'Grains', 'KG', 25.00, '1001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Rice', 'RICE001', 'Grains', 'KG', 40.00, '1006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Sugar', 'SUG001', 'Food', 'KG', 35.00, '1701', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Iron Ore', 'IRO001', 'Minerals', 'TON', 5000.00, '2601', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert serial number configuration
INSERT INTO serial_number_config (tenant_id, prefix, suffix, separator, start_from, current_number, padding, include_year, year_format, include_month, reset_frequency, updated_at)
VALUES (1, 'WB', '', '-', 1, 1, 4, true, 'YYYY', false, 'YEARLY', CURRENT_TIMESTAMP);

-- Insert weighbridge configuration
INSERT INTO weighbridge_config (tenant_id, connection_type, serial_port, baud_rate, unit, tolerance, auto_capture, updated_at)
VALUES (1, 'SERIAL', 'COM1', 9600, 'KG', 5.0, true, CURRENT_TIMESTAMP);

-- Insert camera configuration
INSERT INTO camera_config (tenant_id, camera1_enabled, camera2_enabled, storage_path, updated_at)
VALUES (1, false, false, '/var/weighbridge/images', CURRENT_TIMESTAMP);
```

#### 6. Access Application
- **API Base URL**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **H2 Console** (if using H2 for dev): http://localhost:8080/api/h2-console

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline

COPY src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: weighbridge-postgres
    environment:
      POSTGRES_DB: weighbridge_db
      POSTGRES_USER: weighbridge_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    networks:
      - weighbridge-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U weighbridge_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: weighbridge-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/weighbridge_db
      SPRING_DATASOURCE_USERNAME: weighbridge_user
      SPRING_DATASOURCE_PASSWORD: your_secure_password
      JWT_SECRET: your-production-secret-key-change-this
      CORS_ALLOWED_ORIGINS: http://localhost:8080,https://yourdomain.com
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - weighbridge-network
    volumes:
      - ./images:/var/weighbridge/images
    restart: unless-stopped

volumes:
  postgres-data:

networks:
  weighbridge-network:
    driver: bridge
```

### Running with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes (caution: deletes data)
docker-compose down -v
```

---

## Testing Strategy

### Unit Tests Example

```java
@SpringBootTest
@AutoConfigureMockMvc
class BillServiceTest {

    @Autowired
    private BillService billService;

    @MockBean
    private BillRepository billRepository;

    @MockBean
    private SerialNumberService serialNumberService;

    @Test
    void testCreateQuickBill() {
        // Arrange
        BillRequest request = new BillRequest();
        request.setVehicleNo("MH12AB1234");
        request.setPartyName("ABC Traders");
        request.setProductName("Wheat");
        request.setGrossWeight(new BigDecimal("15000.00"));
        request.setTareWeight(new BigDecimal("5000.00"));

        when(serialNumberService.generateNextBillNumber(anyLong()))
            .thenReturn("WB-2025-0001");

        // Act
        Bill bill = billService.createQuickBill(request, mockUser);

        // Assert
        assertNotNull(bill);
        assertEquals("WB-2025-0001", bill.getBillNo());
        assertEquals(new BigDecimal("10000.00"), bill.getNetWeight());
        assertEquals(BillStatus.COMPLETED, bill.getStatus());
    }
}
```

### Integration Tests Example

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class BillControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "OPERATOR")
    void testCreateBillEndpoint() throws Exception {
        BillRequest request = new BillRequest();
        request.setVehicleNo("MH12AB1234");
        request.setPartyName("ABC Traders");
        request.setProductName("Wheat");
        request.setGrossWeight(new BigDecimal("15000.00"));
        request.setTareWeight(new BigDecimal("5000.00"));

        mockMvc.perform(post("/api/bills")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billNo").exists())
                .andExpect(jsonPath("$.netWeight").value(10000.00));
    }
}
```

---

## Appendix

### API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/login | User login | No |
| POST | /api/auth/refresh | Refresh token | No |
| GET | /api/bills | Get all bills | Yes |
| GET | /api/bills/{id} | Get bill by ID | Yes |
| POST | /api/bills | Create new bill | Yes |
| PUT | /api/bills/{id} | Update bill | Yes |
| DELETE | /api/bills/{id} | Delete bill | Yes (Admin) |
| GET | /api/tickets/open | Get open tickets | Yes |
| POST | /api/tickets | Create open ticket | Yes |
| POST | /api/tickets/{id}/complete | Complete ticket | Yes |
| DELETE | /api/tickets/{id} | Delete ticket | Yes |
| GET | /api/tares | Get stored tares | Yes |
| GET | /api/tares/vehicle/{vehicleNo} | Get tare by vehicle | Yes |
| POST | /api/tares | Create stored tare | Yes |
| PUT | /api/tares/{id} | Update tare | Yes |
| DELETE | /api/tares/{id} | Delete tare | Yes |
| GET | /api/vehicles | Get all vehicles | Yes |
| POST | /api/vehicles | Create vehicle | Yes |
| GET | /api/parties | Get all parties | Yes |
| POST | /api/parties | Create party | Yes |
| GET | /api/products | Get all products | Yes |
| POST | /api/products | Create product | Yes |
| GET | /api/users | Get all users | Yes (Admin) |
| POST | /api/users | Create user | Yes (Admin) |
| GET | /api/serial-number/config | Get config | Yes (Admin) |
| PUT | /api/serial-number/config | Update config | Yes (Admin) |
| GET | /api/camera/config | Get config | Yes (Admin) |
| POST | /api/camera/capture-both | Capture images | Yes |
| GET | /api/weighbridge/current-weight | Get current weight | Yes |
| GET | /api/health | Health check | No |

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weighbridge_db
DB_USER=weighbridge_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Application
SERVER_PORT=8080
APP_TIMEZONE=Asia/Kolkata

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# File Storage
STORAGE_PATH=/var/weighbridge/images
MAX_FILE_SIZE=10MB
```

### Sample Postman Collection

```json
{
  "info": {
    "name": "WeighBridge Pro API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"operator1\",\n  \"password\": \"operator123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
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
              "raw": "{{base_url}}/bills?page=0&size=20",
              "host": ["{{base_url}}"],
              "path": ["bills"],
              "query": [
                {"key": "page", "value": "0"},
                {"key": "size", "value": "20"}
              ]
            }
          }
        },
        {
          "name": "Create Bill",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"vehicleNo\": \"MH12AB1234\",\n  \"partyName\": \"ABC Traders\",\n  \"productName\": \"Wheat\",\n  \"grossWeight\": 15000.00,\n  \"tareWeight\": 5000.00,\n  \"charges\": 500.00,\n  \"weightType\": \"ONE_TIME\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/bills",
              "host": ["{{base_url}}"],
              "path": ["bills"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## Support & Contact

For issues, questions, or contributions, please contact:
- **Email**: support@weighbridge.example.com
- **GitHub**: https://github.com/yourorg/weighbridge-backend
- **Documentation**: https://docs.weighbridge.example.com

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
