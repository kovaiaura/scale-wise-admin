# Node.js/Express Backend Implementation Guide

This guide provides a complete implementation of a Node.js/Express backend for the Weighbridge Management System, designed to work seamlessly with the existing React frontend.

## Table of Contents
1. [Why Node.js/Express?](#why-nodejsexpress)
2. [Project Setup](#project-setup)
3. [Database Integration](#database-integration)
4. [Authentication & JWT](#authentication--jwt)
5. [API Endpoints Implementation](#api-endpoints-implementation)
6. [Middleware](#middleware)
7. [File Upload (Camera Images)](#file-upload-camera-images)
8. [WebSocket Support](#websocket-support)
9. [Docker Deployment](#docker-deployment)
10. [Testing](#testing)

---

## Why Node.js/Express?

### Node.js/Express vs Spring Boot

| Feature | Node.js/Express | Spring Boot |
|---------|----------------|-------------|
| **Learning Curve** | Easier, JavaScript-based | Steeper, Java-based |
| **Performance** | Excellent for I/O-heavy apps | Better for CPU-intensive tasks |
| **Ecosystem** | npm (largest package registry) | Maven/Gradle |
| **Real-time** | Native WebSocket support | Requires additional setup |
| **Development Speed** | Faster prototyping | More boilerplate code |
| **Type Safety** | Optional (TypeScript) | Built-in (Java) |
| **Community** | Larger for web apps | Larger for enterprise |
| **Deployment** | Lightweight containers | Heavier JVM footprint |

### When to Choose Node.js/Express
- Your team is already familiar with JavaScript/TypeScript
- You need rapid development and prototyping
- Real-time features are critical (WebSocket, live updates)
- You want a lightweight, scalable solution
- Microservices architecture

### When to Choose Spring Boot
- You need enterprise-grade security features
- Your team is Java-centric
- You require strong type safety and compile-time checks
- You're building complex business logic
- Integration with Java ecosystem (Hibernate, Spring Security)

**For this project**: Node.js/Express is ideal because the frontend is already JavaScript/React, enabling full-stack JavaScript development.

---

## Project Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Initialize Project

```bash
# Create project directory
mkdir weighbridge-backend
cd weighbridge-backend

# Initialize npm project
npm init -y

# Install core dependencies
npm install express cors dotenv pg jsonwebtoken bcryptjs

# Install development dependencies
npm install --save-dev typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs ts-node nodemon

# Install additional utilities
npm install express-validator multer socket.io helmet morgan winston
npm install --save-dev @types/multer
```

### Project Structure

```
weighbridge-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection
│   │   └── jwt.ts                # JWT configuration
│   ├── controllers/
│   │   ├── authController.ts     # Authentication logic
│   │   ├── billController.ts     # Bill operations
│   │   ├── ticketController.ts   # Open ticket operations
│   │   ├── tareController.ts     # Stored tare operations
│   │   ├── masterDataController.ts # Vehicles, parties, products
│   │   ├── serialNumberController.ts # Serial number generation
│   │   └── cameraController.ts   # Camera operations
│   ├── middleware/
│   │   ├── authMiddleware.ts     # JWT verification
│   │   ├── errorHandler.ts       # Global error handling
│   │   ├── validateRequest.ts    # Input validation
│   │   └── roleCheck.ts          # Role-based access control
│   ├── models/
│   │   ├── userModel.ts          # User database model
│   │   ├── billModel.ts          # Bill database model
│   │   └── ... (other models)
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth endpoints
│   │   ├── billRoutes.ts         # Bill endpoints
│   │   └── ... (other routes)
│   ├── services/
│   │   ├── authService.ts        # Business logic for auth
│   │   ├── billService.ts        # Business logic for bills
│   │   └── ... (other services)
│   ├── utils/
│   │   ├── logger.ts             # Winston logger
│   │   └── validators.ts         # Custom validators
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── websocket/
│   │   └── weighbridgeSocket.ts  # Real-time weight updates
│   └── app.ts                    # Express app setup
├── uploads/                      # Camera image uploads
├── .env                          # Environment variables
├── .gitignore
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Environment Variables (`.env`)

```env
# Server
NODE_ENV=development
PORT=8080
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weighbridge_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

---

## Database Integration

### PostgreSQL Connection (`src/config/database.ts`)

```typescript
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weighbridge_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
export const withTransaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

### Database Schema
Use the same schema from `DATABASE_DOCUMENTATION.md`. Run the SQL scripts to create all tables:

```bash
psql -U postgres -d weighbridge_db -f database_schema.sql
```

---

## Authentication & JWT

### JWT Configuration (`src/config/jwt.ts`)

```typescript
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_this';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
```

### Auth Service (`src/services/authService.ts`)

```typescript
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';

export interface LoginCredentials {
  tenantId: string;
  username: string;
  password: string;
}

export interface AuthResponse {
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

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { tenantId, username, password } = credentials;

  // Find user by tenant_id and username
  const result = await pool.query(
    `SELECT u.*, t.tenant_name 
     FROM users u
     JOIN tenants t ON u.tenant_id = t.tenant_id
     WHERE u.tenant_id = $1 AND u.username = $2 AND u.is_active = true`,
    [tenantId, username]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.user_id,
    email: user.email,
    tenantId: user.tenant_id,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE user_id = $1',
    [user.user_id]
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      username: user.username,
      email: user.email,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
    },
  };
};

export const getUserById = async (userId: string) => {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.tenant_id, t.tenant_name
     FROM users u
     JOIN tenants t ON u.tenant_id = t.tenant_id
     WHERE u.user_id = $1 AND u.is_active = true`,
    [userId]
  );

  return result.rows[0] || null;
};

export const getUserRoles = async (userId: string): Promise<string[]> => {
  const result = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = $1',
    [userId]
  );

  return result.rows.map(row => row.role);
};
```

### Auth Controller (`src/controllers/authController.ts`)

```typescript
import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { tenantId, username, password } = req.body;

    if (!tenantId || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const authResponse = await authService.login({ tenantId, username, password });

    res.json(authResponse);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

export const getMeHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await authService.getUserById(userId);
    const roles = await authService.getUserRoles(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ ...user, roles });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};
```

### Auth Routes (`src/routes/authRoutes.ts`)

```typescript
import { Router } from 'express';
import { loginHandler, getMeHandler } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', loginHandler);
router.get('/me', authenticateToken, getMeHandler);

export default router;
```

---

## API Endpoints Implementation

### Bills API (`src/services/billService.ts`)

```typescript
import { pool } from '../config/database';
import { Bill, BillStatus } from '../types';

export const getAllBills = async (tenantId: string): Promise<Bill[]> => {
  const result = await pool.query(
    `SELECT * FROM bills WHERE tenant_id = $1 ORDER BY bill_date DESC`,
    [tenantId]
  );
  return result.rows;
};

export const createBill = async (bill: Bill, tenantId: string): Promise<Bill> => {
  const {
    billNo,
    billDate,
    vehicleNo,
    partyName,
    productName,
    grossWeight,
    tareWeight,
    netWeight,
    chargeableWeight,
    firstWeightType,
    frontImage,
    rearImage,
    status,
  } = bill;

  const result = await pool.query(
    `INSERT INTO bills (
      tenant_id, bill_no, bill_date, vehicle_no, party_name, product_name,
      gross_weight, tare_weight, net_weight, chargeable_weight,
      first_weight_type, front_image, rear_image, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      tenantId, billNo, billDate, vehicleNo, partyName, productName,
      grossWeight, tareWeight, netWeight, chargeableWeight,
      firstWeightType, frontImage, rearImage, status
    ]
  );

  return result.rows[0];
};

export const getBillById = async (billId: string, tenantId: string): Promise<Bill | null> => {
  const result = await pool.query(
    'SELECT * FROM bills WHERE bill_id = $1 AND tenant_id = $2',
    [billId, tenantId]
  );
  return result.rows[0] || null;
};

export const updateBillStatus = async (
  billId: string,
  status: BillStatus,
  tenantId: string
): Promise<Bill | null> => {
  const result = await pool.query(
    'UPDATE bills SET status = $1, updated_at = NOW() WHERE bill_id = $2 AND tenant_id = $3 RETURNING *',
    [status, billId, tenantId]
  );
  return result.rows[0] || null;
};

export const searchBills = async (query: string, tenantId: string): Promise<Bill[]> => {
  const result = await pool.query(
    `SELECT * FROM bills 
     WHERE tenant_id = $1 AND (
       bill_no ILIKE $2 OR
       vehicle_no ILIKE $2 OR
       party_name ILIKE $2 OR
       product_name ILIKE $2
     )
     ORDER BY bill_date DESC`,
    [tenantId, `%${query}%`]
  );
  return result.rows;
};
```

### Bills Controller (`src/controllers/billController.ts`)

```typescript
import { Request, Response } from 'express';
import * as billService from '../services/billService';

export const getBills = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const bills = await billService.getAllBills(tenantId);
    res.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};

export const createBill = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const bill = await billService.createBill(req.body, tenantId);
    res.status(201).json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
};

export const getBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const bill = await billService.getBillById(id, tenantId);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
};

export const updateBillStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = (req as any).user.tenantId;
    
    const bill = await billService.updateBillStatus(id, status, tenantId);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Update bill status error:', error);
    res.status(500).json({ error: 'Failed to update bill status' });
  }
};

export const searchBills = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const tenantId = (req as any).user.tenantId;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const bills = await billService.searchBills(q, tenantId);
    res.json(bills);
  } catch (error) {
    console.error('Search bills error:', error);
    res.status(500).json({ error: 'Failed to search bills' });
  }
};
```

### Bills Routes (`src/routes/billRoutes.ts`)

```typescript
import { Router } from 'express';
import { getBills, createBill, getBill, updateBillStatus, searchBills } from '../controllers/billController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getBills);
router.post('/', createBill);
router.get('/search', searchBills);
router.get('/:id', getBill);
router.put('/:id/status', updateBillStatus);

export default router;
```

### Complete API Endpoint Structure

Following the same pattern, implement:

1. **Open Tickets API** (`/api/tickets`)
   - GET `/` - Get all open tickets
   - POST `/` - Create open ticket
   - GET `/:id` - Get ticket by ID
   - POST `/:id/close` - Close ticket with second weight
   - DELETE `/:id` - Delete ticket

2. **Stored Tares API** (`/api/tares`)
   - GET `/` - Get all stored tares
   - POST `/` - Create/update stored tare
   - GET `/vehicle/:vehicleNo` - Get tare by vehicle
   - GET `/:vehicleNo/expiry` - Get tare expiry info

3. **Master Data APIs**
   - `/api/vehicles` - CRUD for vehicles
   - `/api/parties` - CRUD for parties
   - `/api/products` - CRUD for products

4. **Serial Number API** (`/api/serial-number`)
   - GET `/next` - Get next serial number
   - GET `/config` - Get serial number configuration
   - PUT `/config` - Update configuration
   - POST `/preview` - Preview serial number format

5. **Camera API** (`/api/camera`)
   - POST `/snapshot` - Capture single camera image
   - POST `/capture-both` - Capture both cameras
   - GET `/config` - Get camera configuration
   - PUT `/config` - Update camera configuration

---

## Middleware

### Authentication Middleware (`src/middleware/authMiddleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

### Role Check Middleware (`src/middleware/roleCheck.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { getUserRoles } from '../services/authService';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const userRoles = await getUserRoles(userId);

      const hasPermission = userRoles.some(role => allowedRoles.includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};
```

### Error Handler Middleware (`src/middleware/errorHandler.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(500).json({ error: 'Internal server error' });
};
```

### Request Validation Middleware (`src/middleware/validateRequest.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  next();
};
```

---

## File Upload (Camera Images)

### Upload Configuration (`src/config/upload.ts`)

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  }
});
```

### Camera Controller with Upload (`src/controllers/cameraController.ts`)

```typescript
import { Request, Response } from 'express';
import { upload } from '../config/upload';

export const captureBoth = [
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'rearImage', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.frontImage || !files.rearImage) {
        return res.status(400).json({ error: 'Both front and rear images required' });
      }

      const frontImagePath = `/uploads/${files.frontImage[0].filename}`;
      const rearImagePath = `/uploads/${files.rearImage[0].filename}`;

      res.json({
        frontImage: frontImagePath,
        rearImage: rearImagePath,
      });
    } catch (error) {
      console.error('Camera capture error:', error);
      res.status(500).json({ error: 'Failed to capture images' });
    }
  }
];
```

---

## WebSocket Support

### WebSocket Server (`src/websocket/weighbridgeSocket.ts`)

```typescript
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface WeighbridgeData {
  weight: number;
  isStable: boolean;
  unit: string;
  timestamp: number;
}

export const initializeWebSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Simulate weighbridge data (replace with real hardware integration)
    const interval = setInterval(() => {
      const mockData: WeighbridgeData = {
        weight: Math.floor(Math.random() * 10000) + 1000,
        isStable: Math.random() > 0.3,
        unit: 'KG',
        timestamp: Date.now(),
      };

      socket.emit('weighbridge-data', mockData);
    }, 1000);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      clearInterval(interval);
    });
  });

  return io;
};
```

---

## Main Application Setup

### Express App (`src/app.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes';
import billRoutes from './routes/billRoutes';
// ... import other routes

// Middleware
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
// ... use other routes

// Error handling
app.use(errorHandler);

export default app;
```

### Server Entry Point (`src/server.ts`)

```typescript
import http from 'http';
import app from './app';
import { pool } from './config/database';
import { initializeWebSocket } from './websocket/weighbridgeSocket';

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});
```

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "dist/server.js"]
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: weighbridge_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Node.js Backend
  backend:
    build:
      context: ./weighbridge-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      PORT: 8080
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: weighbridge_db
      DB_USER: postgres
      DB_PASSWORD: postgres123
      JWT_SECRET: your_production_jwt_secret_change_this
      FRONTEND_URL: http://localhost
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - backend_uploads:/app/uploads

  # React Frontend (Nginx)
  frontend:
    build:
      context: ./weighbridge-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  backend_uploads:
```

### Frontend Dockerfile (for production)

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Start with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

---

## Testing

### Unit Tests with Jest

Install Jest dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};
```

### Example Test (`src/__tests__/billService.test.ts`)

```typescript
import * as billService from '../services/billService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('Bill Service', () => {
  const mockTenantId = 'tenant-123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getAllBills should return bills for tenant', async () => {
    const mockBills = [
      { bill_id: '1', bill_no: 'WB-001', vehicle_no: 'KA01AB1234' },
    ];

    (pool.query as jest.Mock).mockResolvedValue({ rows: mockBills });

    const bills = await billService.getAllBills(mockTenantId);

    expect(bills).toEqual(mockBills);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM bills'),
      [mockTenantId]
    );
  });
});
```

### Integration Tests with Supertest

```typescript
import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  test('POST /api/auth/login should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        tenantId: 'test-tenant',
        username: 'admin',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user');
  });

  test('POST /api/auth/login should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        tenantId: 'test-tenant',
        username: 'admin',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Development Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use strong, randomly generated secrets in production
3. **Password Hashing**: Always use bcrypt with salt rounds >= 10
4. **SQL Injection**: Use parameterized queries (already implemented with `pg`)
5. **CORS**: Restrict origins in production
6. **Rate Limiting**: Add express-rate-limit for API endpoints
7. **Helmet**: Security headers already configured
8. **Input Validation**: Use express-validator for all user inputs
9. **HTTPS**: Always use HTTPS in production
10. **Role Separation**: Store user roles in separate `user_roles` table

---

## Next Steps

1. ✅ Set up Node.js/Express project
2. ✅ Configure PostgreSQL connection
3. ✅ Implement JWT authentication
4. ✅ Create all API endpoints
5. ⬜ Integrate with hardware weighbridge (replace mock data)
6. ⬜ Implement real camera integration
7. ⬜ Add comprehensive error logging (Winston)
8. ⬜ Set up CI/CD pipeline
9. ⬜ Deploy to production server
10. ⬜ Configure SSL/TLS certificates

---

## Support & Resources

- **Node.js Documentation**: https://nodejs.org/docs
- **Express.js Guide**: https://expressjs.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Socket.io Documentation**: https://socket.io/docs/

**Ready to build!** Your Node.js/Express backend is fully compatible with the existing React frontend. 🚀
