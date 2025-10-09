# Frontend Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Components Deep Dive](#components-deep-dive)
5. [Hooks Explained](#hooks-explained)
6. [Services Layer](#services-layer)
7. [Utils Explained](#utils-explained)
8. [Weighbridge Hardware Integration](#weighbridge-hardware-integration)
9. [CCTV Camera Integration](#cctv-camera-integration)
10. [Database Connection Flow](#database-connection-flow)
11. [Workflow Documentation](#workflow-documentation)
12. [Context Providers](#context-providers)
13. [Routing & Navigation](#routing-navigation)
14. [State Management Strategy](#state-management-strategy)
15. [UI/UX Design System](#uiux-design-system)
16. [Configuration Files](#configuration-files)
17. [Development Workflow](#development-workflow)

---

## Project Overview

### What is this application?
This is a **Weighbridge Management System** - a complete solution for managing industrial weighbridges (truck scales). It handles:
- Real-time weight measurement from weighbridge indicators
- CCTV camera integration for vehicle documentation
- Bill generation and management
- Master data (vehicles, parties, products)
- Multi-user access control
- Print template management
- Comprehensive reporting

### Architecture Philosophy
- **Frontend**: React + TypeScript + Vite
- **Backend-agnostic**: Works with any REST API (Spring Boot, Node.js, etc.)
- **Real-time hardware**: WebSocket/Serial communication for weighbridge
- **Offline-capable**: localStorage fallback for development
- **Component-based**: Modular, reusable UI components

### Key Design Decisions
1. **TypeScript**: Type safety for complex business logic
2. **Shadcn/ui**: Accessible, customizable components
3. **React Router**: Client-side routing
4. **Context API**: Global state (auth, access control, notifications)
5. **Axios**: HTTP client with interceptors
6. **Custom hooks**: Hardware abstraction (`useWeighbridge`)

---

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # App layout components
│   │   ├── AppLayout.tsx      # Main layout wrapper
│   │   ├── AppSidebar.tsx     # Navigation sidebar
│   │   └── Navbar.tsx         # Top navigation bar
│   ├── operator/       # Operator console components
│   │   ├── UnifiedWeighmentForm.tsx    # Main weighment form
│   │   ├── QuickWeighment.tsx          # Quick weighment workflow
│   │   ├── RegularWeighment.tsx        # Two-trip workflow
│   │   ├── ShuttleWeighment.tsx        # One-time workflow
│   │   ├── BillManagement.tsx          # Bill CRUD operations
│   │   ├── OpenBillManagement.tsx      # Open tickets management
│   │   ├── DualCameraFeed.tsx          # Live camera preview
│   │   ├── ManualEntry.tsx             # Manual weight entry
│   │   ├── WorkflowSelector.tsx        # Workflow type selector
│   │   └── AccessBlockedDialog.tsx     # Access control modal
│   ├── print/          # Print-related components
│   │   ├── PrintTemplate.tsx           # Template editor
│   │   ├── BillPrintView.tsx           # Print preview
│   │   └── BillWithTemplate.tsx        # Template-based rendering
│   └── ui/             # Shadcn UI components (buttons, forms, etc.)
├── contexts/           # React Context providers
│   ├── AuthContext.tsx              # Authentication state
│   ├── AccessControlContext.tsx     # Access control state
│   └── NotificationContext.tsx      # Notification management
├── hooks/              # Custom React hooks
│   ├── useWeighbridge.tsx           # Weighbridge hardware hook
│   ├── useOnlineStatus.ts           # Network status
│   ├── use-toast.ts                 # Toast notifications
│   └── use-mobile.tsx               # Mobile detection
├── services/           # API & hardware services
│   ├── api/           # Backend API services
│   │   ├── masterDataService.ts     # Vehicles, parties, products
│   │   ├── billService.ts           # Bill operations
│   │   ├── openTicketService.ts     # Open ticket operations
│   │   ├── storedTareService.ts     # Stored tare operations
│   │   └── serialNumberService.ts   # Serial number generation
│   ├── apiClient.ts                 # Axios HTTP client
│   ├── weighbridgeService.ts        # Weighbridge hardware service
│   ├── cameraService.ts             # CCTV camera service
│   ├── printTemplateService.ts      # Print template management
│   └── unifiedServices.ts           # Unified business logic
├── pages/              # Route pages
│   ├── Index.tsx                    # Home/Dashboard
│   ├── Login.tsx                    # Login page
│   ├── Dashboard.tsx                # Analytics dashboard
│   ├── OperatorConsole.tsx          # Main operator interface
│   ├── Weighments.tsx               # Weighments history
│   ├── Reports.tsx                  # Reports page
│   ├── MastersVehicles.tsx          # Vehicle master data
│   ├── MastersParties.tsx           # Party master data
│   ├── MastersProducts.tsx          # Product master data
│   ├── SettingsUsers.tsx            # User management
│   ├── SettingsProfile.tsx          # User profile
│   ├── SettingsWeighbridge.tsx      # Weighbridge settings
│   ├── SettingsSerialNumber.tsx     # Serial number config
│   ├── PrintSettings.tsx            # Print template settings
│   └── NotFound.tsx                 # 404 page
├── types/              # TypeScript type definitions
│   ├── weighment.ts                 # Weighment types
│   └── printTemplate.ts             # Print template types
├── utils/              # Utility functions
│   ├── mockData.ts                  # Mock data for development
│   └── exportUtils.ts               # Excel/PDF export utilities
├── config/             # Configuration
│   └── api.ts                       # API endpoints configuration
├── lib/                # Library code
│   └── utils.ts                     # Utility functions (cn, etc.)
├── App.tsx             # Root application component
├── main.tsx            # Application entry point
└── index.css           # Global styles & design tokens
```

---

## Technology Stack

### Core Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | Latest | Type safety |
| **Vite** | Latest | Build tool & dev server |
| **React Router** | 6.30.1 | Client-side routing |
| **TanStack Query** | 5.83.0 | Server state management |
| **Axios** | 1.12.2 | HTTP client |

### UI Libraries
| Library | Purpose |
|---------|---------|
| **Shadcn/ui** | Component library (Radix UI + Tailwind) |
| **Tailwind CSS** | Utility-first CSS |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations |
| **Recharts** | Charts & graphs |

### Form & Validation
| Library | Purpose |
|---------|---------|
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |

### Utilities
| Library | Purpose |
|---------|---------|
| **date-fns** | Date manipulation |
| **XLSX** | Excel export |
| **jsPDF** | PDF generation |
| **html2canvas** | Screenshot capture |

---

## Components Deep Dive

### Layout Components

#### `AppLayout.tsx`
**Purpose**: Main application layout wrapper with authentication guard.

```typescript
// Structure:
<SidebarProvider>
  <AppSidebar />           {/* Left navigation */}
  <div>
    <Navbar />             {/* Top bar */}
    <main>
      <Outlet />           {/* Route content */}
    </main>
  </div>
</SidebarProvider>
```

**Features**:
- Authentication check (redirects to `/login` if not authenticated)
- Responsive sidebar (collapsible on mobile)
- Outlet for nested routes

**Usage**: Wraps all protected routes in `App.tsx`

---

#### `AppSidebar.tsx`
**Purpose**: Navigation sidebar with menu items and collapsible sections.

**Features**:
- Role-based menu items (operator, admin, super_admin)
- Active route highlighting
- Collapsible sections (Masters, Settings)
- Icons from Lucide React

**Menu Structure**:
```
- Home
- Operator Console
- Weighments
- Reports
- Masters
  - Vehicles
  - Parties
  - Products
- Settings
  - Users
  - Profile
  - Weighbridge
  - Serial Number
  - Print Settings
```

---

#### `Navbar.tsx`
**Purpose**: Top navigation bar with user info and quick actions.

**Features**:
- Current page title
- User dropdown menu
- Theme toggle (light/dark mode)
- Online/offline status indicator
- Logout button

---

### Operator Components

#### `UnifiedWeighmentForm.tsx`
**Purpose**: Main weighment entry form - the heart of the application.

**Props**:
```typescript
interface Props {
  liveWeight: number;      // Current weight from weighbridge
  isStable: boolean;       // Weight stability indicator
}
```

**Features**:
1. **Workflow Selection**: Quick, Regular (Two-Trip), Shuttle (One-Time)
2. **Real-time Weight Display**: Shows live weight with stability indicator
3. **Form Fields**:
   - Serial Number (auto-generated)
   - Vehicle Number (autocomplete)
   - Party Name (autocomplete)
   - Product Name (autocomplete)
   - Challan Number
   - Weight Type (Gross/Tare)
   - Manual weight entry option
4. **Camera Integration**: Capture front/rear vehicle images
5. **Open Ticket Handling**: Load and close open tickets
6. **Validation**: Zod schema validation
7. **Bill Generation**: Creates bill after successful weighment

**Business Logic Flow**:
```
1. Select Workflow Type
2. Enter Vehicle Details
3. Capture Live Weight (or manual entry)
4. Capture Camera Images
5. Calculate Net Weight (if applicable)
6. Generate Bill
7. Print (optional)
```

---

#### `QuickWeighment.tsx`
**Purpose**: Quick weighment workflow for stored tare weights.

**Use Case**: Vehicle has a pre-stored tare weight in the system.

**Workflow**:
```
1. Enter Vehicle Number
2. System fetches stored tare weight
3. Capture Gross Weight (live)
4. Auto-calculate Net Weight = Gross - Tare
5. Generate Bill
```

**Advantages**:
- Fastest workflow (single weighment)
- Reduces queue time
- Ideal for regular vehicles with known tare weights

---

#### `RegularWeighment.tsx`
**Purpose**: Two-trip weighment workflow (most common).

**Use Case**: Weigh vehicle when loaded, weigh again when empty.

**Workflow**:
```
Trip 1 (First Weight):
1. Enter Vehicle Details
2. Capture Weight (Gross or Tare)
3. Save as Open Ticket

Trip 2 (Second Weight):
1. Load Open Ticket
2. Capture Second Weight (Tare or Gross)
3. Auto-calculate Net Weight
4. Close Ticket & Generate Bill
```

**Key Features**:
- Open ticket management
- Automatic net weight calculation
- Weight type validation (Gross → Tare or Tare → Gross)

---

#### `ShuttleWeighment.tsx`
**Purpose**: One-time weighment workflow (manual net weight entry).

**Use Case**: Emergency scenarios, offline weighbridge, manual corrections.

**Workflow**:
```
1. Enter Vehicle Details
2. Manually enter ALL weights:
   - Gross Weight
   - Tare Weight
3. System calculates Net Weight = Gross - Tare
4. Generate Bill
```

**Warning**: Bypasses live weighbridge - use only when necessary.

---

#### `BillManagement.tsx`
**Purpose**: View, search, filter, and export bills.

**Features**:
1. **Data Table**: Displays all bills with columns:
   - Serial No, Date, Vehicle No, Party, Product, Gross, Tare, Net, Status
2. **Search**: Real-time search across all fields
3. **Filters**: Date range, status (Open/Closed/Printed)
4. **Export**: Excel and PDF export
5. **Actions**: View details, print, delete
6. **Pagination**: Handle large datasets

**API Integration**:
- `getBills()`: Fetch all bills
- `searchBills(query)`: Search functionality
- `filterBillsByDateRange(start, end)`: Date filtering

---

#### `OpenBillManagement.tsx`
**Purpose**: Manage open tickets (incomplete weighments).

**Features**:
- Display all open tickets
- Close ticket functionality
- Delete expired tickets
- Load ticket in weighment form

**Use Case**: Continue incomplete two-trip weighments.

---

#### `DualCameraFeed.tsx`
**Purpose**: Live camera preview and image capture.

**Features**:
- Front camera feed
- Rear camera feed
- Capture both simultaneously
- Image preview
- Error handling (camera unavailable)

**API Integration**:
```typescript
// Capture both cameras
const { frontImage, rearImage } = await captureBothCameras();
```

---

### Print Components

#### `PrintTemplate.tsx`
**Purpose**: Visual print template editor.

**Features**:
- Drag-and-drop field placement
- Custom field labels
- Font size adjustment
- Template preview
- Save/Load templates

**Available Fields**:
- Serial No, Date, Vehicle No, Party Name, Product Name
- Gross Weight, Tare Weight, Net Weight
- Challan Number, Notes
- Company Logo, Header, Footer

---

#### `BillPrintView.tsx`
**Purpose**: Print preview and actual printing.

**Features**:
- Renders bill using selected template
- Print button (triggers browser print dialog)
- PDF export
- Image capture for archival

---

## Hooks Explained

### What are React Hooks?
**Hooks** are special functions that let you "hook into" React features. They allow you to:
- Manage state without classes
- Handle side effects (API calls, subscriptions)
- Reuse stateful logic across components
- Access context values

### Custom Hooks in This Project

#### `useWeighbridge()`
**Purpose**: Connect to weighbridge hardware and get real-time weight data.

**Location**: `src/hooks/useWeighbridge.tsx`

**Returns**:
```typescript
{
  liveWeight: number;              // Current weight (e.g., 15000)
  isStable: boolean;               // Weight stability flag
  unit: string;                    // Weight unit (KG, TON)
  timestamp: number;               // Last update timestamp
  connectionStatus: string;        // 'connected' | 'connecting' | 'disconnected'
  isConnected: boolean;            // Connection status
  isConnecting: boolean;           // Loading state
  disconnect: () => void;          // Manually disconnect
  reconnect: () => Promise<void>;  // Reconnect to weighbridge
}
```

**How it works**:
1. Auto-connects to weighbridge on mount
2. Subscribes to weight updates via `weighbridgeService`
3. Updates state whenever new weight data arrives
4. Cleans up subscription on unmount

**Usage Example**:
```typescript
function OperatorConsole() {
  const { liveWeight, isStable, connectionStatus } = useWeighbridge();
  
  return (
    <div>
      <h1>Current Weight: {liveWeight} KG</h1>
      {isStable && <Badge>Stable</Badge>}
      <Badge>{connectionStatus}</Badge>
    </div>
  );
}
```

**Why it's a hook**:
- Encapsulates hardware communication logic
- Reusable across multiple components
- Manages lifecycle (connect/disconnect)
- Provides reactive state updates

---

#### `useAuth()`
**Purpose**: Access authentication state and methods.

**Location**: `src/contexts/AuthContext.tsx`

**Returns**:
```typescript
{
  user: User | null;                      // Current logged-in user
  isAuthenticated: boolean;               // Auth status
  login: (username, password) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

**Usage**:
```typescript
function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
```

---

#### `useAccessControl()`
**Purpose**: Check user permissions and access restrictions.

**Location**: `src/contexts/AccessControlContext.tsx`

**Returns**:
```typescript
{
  checkAccess: (permission: string) => boolean;
  isAccessBlocked: boolean;           // User is blocked
  blockAccess: (userId: string) => void;
  unblockAccess: (userId: string) => void;
}
```

**Usage**:
```typescript
function OperatorConsole() {
  const { checkAccess, isAccessBlocked } = useAccessControl();
  
  if (!checkAccess('weighment.create')) {
    return <Alert>You don't have permission</Alert>;
  }
  
  if (isAccessBlocked) {
    return <Alert>Your access is blocked</Alert>;
  }
  
  return <UnifiedWeighmentForm />;
}
```

---

#### `useToast()`
**Purpose**: Show toast notifications.

**Location**: `src/hooks/use-toast.ts`

**Returns**:
```typescript
{
  toast: (options: ToastOptions) => void;
  toasts: Toast[];
  dismiss: (toastId: string) => void;
}
```

**Usage**:
```typescript
import { useToast } from '@/hooks/use-toast';

function SaveButton() {
  const { toast } = useToast();
  
  const handleSave = () => {
    // Save logic...
    toast({
      title: "Success",
      description: "Data saved successfully",
      variant: "default"
    });
  };
  
  return <Button onClick={handleSave}>Save</Button>;
}
```

**Toast Variants**:
- `default`: Normal message (blue)
- `destructive`: Error message (red)
- `success`: Success message (green)

---

#### `useOnlineStatus()`
**Purpose**: Detect network connectivity.

**Location**: `src/hooks/useOnlineStatus.ts`

**Returns**:
```typescript
{
  isOnline: boolean;
}
```

**Usage**:
```typescript
function Navbar() {
  const { isOnline } = useOnlineStatus();
  
  return (
    <nav>
      {!isOnline && (
        <Badge variant="destructive">Offline</Badge>
      )}
    </nav>
  );
}
```

---

#### `useMobile()`
**Purpose**: Detect mobile screen size.

**Location**: `src/hooks/use-mobile.tsx`

**Returns**:
```typescript
boolean  // true if screen width < 768px
```

**Usage**:
```typescript
function ResponsiveComponent() {
  const isMobile = useMobile();
  
  return (
    <div className={isMobile ? "p-2" : "p-6"}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

---

## Services Layer

### What are Services?
**Services** are modules that handle specific responsibilities:
- **API Services**: Communicate with backend REST APIs
- **Hardware Services**: Interact with weighbridge/camera hardware
- **Business Logic**: Complex operations that don't belong in components

### API Services

#### `apiClient.ts`
**Purpose**: Centralized HTTP client with interceptors.

**Key Features**:
1. **Base URL Configuration**: Reads from `localStorage` (user-configurable)
2. **JWT Authentication**: Auto-adds `Authorization` header
3. **Error Handling**: Global error interceptor
4. **Timeout**: 30 seconds default

**Code Breakdown**:
```typescript
// Create Axios instance
const client = axios.create({
  baseURL: getApiBaseUrl(),  // From localStorage or default
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - Add JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
    }
    return Promise.reject(error);
  }
);
```

**Usage in Services**:
```typescript
import { apiClient } from './apiClient';

export const getVehicles = async () => {
  const response = await apiClient.get('/api/vehicles');
  return response.data;
};
```

**Why it's useful**:
- DRY principle (Don't Repeat Yourself)
- Consistent error handling
- Centralized auth logic
- Easy to change base URL

---

#### `masterDataService.ts`
**Purpose**: Fetch master data (vehicles, parties, products).

**API Calls**:
```typescript
// Get all vehicles
const vehicles = await getVehicles();
// Returns: Vehicle[] with { vehicleNo, vehicleType, storedTare, ... }

// Get all parties
const parties = await getParties();
// Returns: Party[] with { partyName, address, phone, ... }

// Get all products
const products = await getProducts();
// Returns: Product[] with { productName, unit, rate, ... }

// Get specific vehicle
const vehicle = await getVehicleByNumber("MH12AB1234");

// Get next serial number
const serialNo = await getNextSerialNo();
// Returns: "00001" or custom format
```

**Backend Endpoints**:
- `GET /api/vehicles`
- `GET /api/parties`
- `GET /api/products`
- `GET /api/serial-number/next`

**Usage Example**:
```typescript
import { getVehicles } from '@/services/api/masterDataService';

function VehicleDropdown() {
  const [vehicles, setVehicles] = useState([]);
  
  useEffect(() => {
    getVehicles().then(setVehicles);
  }, []);
  
  return (
    <Select>
      {vehicles.map(v => (
        <SelectItem value={v.vehicleNo}>{v.vehicleNo}</SelectItem>
      ))}
    </Select>
  );
}
```

---

#### `billService.ts`
**Purpose**: Manage bills (create, read, update, delete).

**API Calls**:
```typescript
// Get all bills
const bills = await getBills();

// Create new bill
await saveBill({
  serialNo: "00001",
  vehicleNo: "MH12AB1234",
  partyName: "ABC Industries",
  grossWeight: 25000,
  tareWeight: 10000,
  netWeight: 15000,
  // ... other fields
});

// Update bill status
await updateBillStatus("bill-id", "PRINTED");

// Get single bill
const bill = await getBillById("bill-id");

// Search bills
const results = await searchBills("MH12");

// Filter by date range
const bills = await filterBillsByDateRange("2024-01-01", "2024-01-31");
```

**Backend Endpoints**:
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id/status` - Update status
- `GET /api/bills/:id` - Get single bill
- `GET /api/bills/search?q=query` - Search
- `GET /api/bills?start=...&end=...` - Filter by date

---

#### `openTicketService.ts`
**Purpose**: Manage open tickets (incomplete weighments).

**API Calls**:
```typescript
// Get all open tickets
const tickets = await getOpenTickets();

// Create new open ticket
await saveOpenTicket({
  id: "ticket-123",
  vehicleNo: "MH12AB1234",
  firstWeight: 25000,
  firstWeightType: "Gross",
  firstWeightDate: "2024-01-15T10:30:00Z",
  // ... other fields
});

// Close ticket (convert to bill)
await closeOpenTicket("ticket-123", {
  secondWeight: 10000,
  secondWeightType: "Tare",
  secondWeightDate: "2024-01-15T12:45:00Z"
});

// Delete ticket
await removeOpenTicket("ticket-123");

// Get specific ticket
const ticket = await getOpenTicketById("ticket-123");
```

**Backend Endpoints**:
- `GET /api/tickets/open`
- `POST /api/tickets`
- `POST /api/tickets/:id/close`
- `DELETE /api/tickets/:id`
- `GET /api/tickets/:id`

---

#### `storedTareService.ts`
**Purpose**: Manage stored tare weights for vehicles.

**API Calls**:
```typescript
// Get all stored tares
const tares = await getStoredTares();

// Save/Update tare
await saveStoredTare({
  vehicleNo: "MH12AB1234",
  tareWeight: 10000,
  expiryDate: "2025-01-15"
});

// Get tare for specific vehicle
const tare = await getStoredTareByVehicle("MH12AB1234");

// Check if tare is expired
const isExpired = await checkTareExpiry("MH12AB1234");

// Delete tare
await deleteStoredTare("MH12AB1234");
```

**Backend Endpoints**:
- `GET /api/tares`
- `POST /api/tares` or `PUT /api/tares`
- `GET /api/tares/vehicle/:vehicleNo`
- `GET /api/tares/:vehicleNo/expiry`
- `DELETE /api/tares/:vehicleNo`

---

### Hardware Services

#### `weighbridgeService.ts`
**Purpose**: Communicate with weighbridge indicator hardware.

**Architecture**:
```
Frontend (React)
    ↓
weighbridgeService.ts
    ↓
WebSocket / Serial Port
    ↓
Weighbridge Indicator (RS-232 / TCP/IP)
```

**Configuration**:
```typescript
interface WeighbridgeConfig {
  connectionType: 'serial' | 'network';
  
  // Serial connection
  serialPort?: string;        // e.g., "COM3" (Windows) or "/dev/ttyUSB0" (Linux)
  baudRate?: number;          // e.g., 9600, 19200
  dataBits?: number;          // e.g., 8
  stopBits?: number;          // e.g., 1
  parity?: 'none' | 'even' | 'odd';
  
  // Network connection
  ipAddress?: string;         // e.g., "192.168.1.100"
  port?: number;              // e.g., 4001
  
  // General
  unit: 'KG' | 'TON' | 'LBS'; // Weight unit
  pollInterval?: number;      // Polling interval in ms
}
```

**Key Methods**:
```typescript
// Connect to weighbridge
await weighbridgeService.connect();

// Disconnect
weighbridgeService.disconnect();

// Subscribe to weight updates
const unsubscribe = weighbridgeService.subscribe((data) => {
  console.log('Weight:', data.weight);
  console.log('Stable:', data.isStable);
});

// Get current weight
const currentWeight = weighbridgeService.getCurrentWeight();

// Get connection status
const status = weighbridgeService.getConnectionStatus();
```

**Weight Data Format**:
```typescript
interface WeighbridgeData {
  weight: number;       // Current weight (e.g., 15000)
  isStable: boolean;    // Weight stability flag
  unit: 'KG' | 'TON' | 'LBS';
  timestamp: number;    // Unix timestamp
}
```

**How it works (Production)**:
1. Frontend connects to WebSocket server or Serial Bridge
2. Bridge communicates with weighbridge via RS-232/TCP
3. Weighbridge sends weight data continuously (e.g., every 100ms)
4. Service parses data and notifies subscribers
5. Components update UI in real-time

**Development Mode**:
- Simulates weight data (random values)
- Simulates stability after 2 seconds
- No hardware required for testing

---

#### `cameraService.ts`
**Purpose**: Capture images from CCTV cameras.

**Configuration**:
```typescript
interface CameraConfig {
  frontCameraUrl: string;   // e.g., "http://192.168.1.101/snapshot"
  rearCameraUrl: string;    // e.g., "http://192.168.1.102/snapshot"
  username?: string;        // Camera auth (if required)
  password?: string;
  timeout?: number;         // Request timeout (ms)
}
```

**API Methods**:
```typescript
// Capture single camera
const image = await captureSnapshot('front');
// Returns: Base64 image string

// Capture both cameras simultaneously
const { frontImage, rearImage } = await captureBothCameras();

// Get camera feed URL (for live preview)
const feedUrl = getCameraFeedUrl('front');
```

**How it works**:
1. Frontend makes HTTP request to camera's snapshot endpoint
2. Camera returns JPEG image
3. Service converts to Base64 string
4. Base64 string stored in database with bill

**Camera Types Supported**:
- IP Cameras with HTTP snapshot API
- USB Cameras (via backend proxy)
- RTSP Cameras (via backend conversion)

**Backend Endpoints** (proxy for camera access):
- `GET /api/camera/snapshot?camera=front`
- `GET /api/camera/snapshot?camera=rear`
- `POST /api/camera/capture-both`

---

#### `printTemplateService.ts`
**Purpose**: Manage print templates (currently localStorage).

**Methods**:
```typescript
// Get all templates
const templates = await getAllTemplates();

// Get template by ID
const template = await getTemplateById("template-id");

// Save template
await saveTemplate({
  id: "template-id",
  name: "Default Template",
  fields: [
    { id: 'serialNo', label: 'Serial No', x: 10, y: 10 },
    { id: 'vehicleNo', label: 'Vehicle No', x: 10, y: 30 },
    // ...
  ]
});

// Delete template
await deleteTemplate("template-id");
```

**⚠️ Note**: Currently uses localStorage. Should be migrated to backend (see `BACKEND_MIGRATION_GUIDE.md`).

---

### Business Logic Services

#### `unifiedServices.ts`
**Purpose**: Centralized business logic for weighment operations.

**Key Functions**:

##### `calculateNetWeight()`
```typescript
// Calculate net weight based on workflow
const netWeight = calculateNetWeight(
  grossWeight: 25000,
  tareWeight: 10000,
  workflow: 'regular'
);
// Returns: 15000
```

##### `validateWeighment()`
```typescript
// Validate weighment data before saving
const errors = validateWeighment({
  vehicleNo: "MH12AB1234",
  grossWeight: 25000,
  tareWeight: 10000,
  workflow: 'regular'
});
// Returns: [] if valid, or array of error messages
```

##### `generateBillFromWeighment()`
```typescript
// Convert weighment data to bill object
const bill = await generateBillFromWeighment({
  vehicleNo: "MH12AB1234",
  partyName: "ABC Industries",
  productName: "Cement",
  grossWeight: 25000,
  tareWeight: 10000,
  // ...
});
// Returns: Complete Bill object ready for backend
```

**Why centralize business logic?**
- **Single Source of Truth**: Calculation logic in one place
- **Reusability**: Multiple components use same logic
- **Testing**: Easy to unit test
- **Maintainability**: Changes in one place affect all consumers

---

## Utils Explained

### What are Utils?
**Utils** (utilities) are **non-hook, non-API reusable functions**. They:
- Perform pure computations (no side effects)
- Format data
- Handle exports (Excel, PDF)
- Provide helper functions

### `exportUtils.ts`
**Purpose**: Export data to Excel and PDF formats.

**Functions**:

#### `exportToExcel()`
```typescript
// Export bills to Excel
exportToExcel(
  data: Bill[],
  filename: 'bills-export',
  sheetName: 'Bills'
);
// Downloads: bills-export.xlsx
```

**Features**:
- Automatic column headers
- Date formatting
- Number formatting (weights)
- Custom sheet names
- Uses `xlsx` library

---

#### `exportToPDF()`
```typescript
// Export bills to PDF
exportToPDF(
  data: Bill[],
  filename: 'bills-report',
  title: 'Weighment Report',
  columns: ['serialNo', 'vehicleNo', 'partyName', 'netWeight']
);
// Downloads: bills-report.pdf
```

**Features**:
- Table layout
- Custom title and headers
- Auto page breaks
- Uses `jsPDF` and `jspdf-autotable`

---

#### `formatDate()`
```typescript
// Format date for exports
const formatted = formatDate(new Date(), 'dd/MM/yyyy');
// Returns: "15/01/2024"
```

---

### `mockData.ts`
**Purpose**: Provide mock data for development and testing.

**Mock Data Includes**:
```typescript
// Mock vehicles
export const mockVehicles: Vehicle[] = [
  { vehicleNo: "MH12AB1234", vehicleType: "Truck", storedTare: 10000 },
  // ... 50 more vehicles
];

// Mock parties
export const mockParties: Party[] = [
  { partyName: "ABC Industries", address: "...", phone: "..." },
  // ... 30 more parties
];

// Mock products
export const mockProducts: Product[] = [
  { productName: "Cement", unit: "TON", rate: 5000 },
  // ... 20 more products
];

// Mock bills
export const mockBills: Bill[] = [
  // ... 100 sample bills
];
```

**Usage**:
```typescript
import { mockVehicles } from '@/utils/mockData';

// Use in development mode
if (developmentMode) {
  setVehicles(mockVehicles);
} else {
  // Fetch from backend
  const vehicles = await getVehicles();
  setVehicles(vehicles);
}
```

---

### `lib/utils.ts`
**Purpose**: General utility functions.

**Key Function: `cn()`**
```typescript
// Merge Tailwind classes intelligently
import { cn } from '@/lib/utils';

<Button className={cn(
  "px-4 py-2",
  isActive && "bg-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Click me
</Button>
```

**What it does**:
- Combines multiple class strings
- Resolves conflicts (last class wins)
- Removes duplicates
- Uses `clsx` and `tailwind-merge`

**Example**:
```typescript
cn("px-4", "px-6")           // Result: "px-6"
cn("bg-red-500", "bg-blue-500") // Result: "bg-blue-500"
```

---

## Weighbridge Hardware Integration

### Overview
The weighbridge (truck scale) is connected to a **weighbridge indicator** - an electronic device that:
- Reads weight from load cells
- Displays weight on LCD screen
- Outputs weight data via RS-232 or TCP/IP

### Connection Types

#### 1. **Serial Connection (RS-232)**
```
Weighbridge Indicator → RS-232 Cable → Computer's COM Port
                                      ↓
                        Serial Bridge (Node.js/Python)
                                      ↓
                              WebSocket Server
                                      ↓
                            Frontend (React App)
```

**Configuration**:
```typescript
{
  connectionType: 'serial',
  serialPort: 'COM3',        // Windows
  // serialPort: '/dev/ttyUSB0', // Linux
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
}
```

**Serial Bridge**: You need a backend service (Node.js/Python) to:
- Open serial port
- Read weight data continuously
- Parse data (format varies by indicator model)
- Broadcast via WebSocket to frontend

---

#### 2. **Network Connection (TCP/IP)**
```
Weighbridge Indicator → Ethernet Cable → Network Switch → Computer
                                                          ↓
                                                 Frontend (React App)
                                        (Direct TCP connection or WebSocket proxy)
```

**Configuration**:
```typescript
{
  connectionType: 'network',
  ipAddress: '192.168.1.100',
  port: 4001
}
```

**Advantages**:
- No serial ports required
- Works over LAN/WiFi
- Multiple clients can connect
- Easier remote access

---

### Weight Data Protocol

Most weighbridge indicators send data in ASCII format:

**Example Data String**:
```
ST,GS,+15000.0 kg
```

**Format Breakdown**:
- `ST`: Status (ST=Stable, US=Unstable)
- `GS`: Gross weight
- `+15000.0`: Weight value
- `kg`: Unit

**Parsing Logic** (in `weighbridgeService.ts`):
```typescript
function parseWeightData(rawData: string): WeighbridgeData {
  // Example: "ST,GS,+15000.0 kg"
  const parts = rawData.split(',');
  
  return {
    weight: parseFloat(parts[2]),  // 15000.0
    isStable: parts[0] === 'ST',   // true if "ST"
    unit: 'KG',
    timestamp: Date.now()
  };
}
```

---

### Weight Stability
**What is weight stability?**
- Weight is considered **stable** when it doesn't fluctuate
- Indicator calculates stability based on threshold (e.g., ±2 kg)
- Stable weight = vehicle is stationary, reading is accurate

**Why it matters**:
- Only capture weight when stable
- Prevents incorrect readings during vehicle movement
- Legal requirement for trade-approved weighments

**UI Indicator**:
```typescript
{isStable ? (
  <Badge variant="default">Stable ✓</Badge>
) : (
  <Badge variant="secondary">Waiting for stability...</Badge>
)}
```

---

### Supported Weighbridge Indicators

Common models with ASCII output:
1. **Avery Weigh-Tronix** (e.g., ZM303)
2. **Mettler Toledo** (e.g., IND560)
3. **Rice Lake** (e.g., 920i)
4. **A&D** (e.g., AD-4401)
5. **Generic indicators** with ASCII output

**Custom Indicators**: If your indicator uses a different protocol, you'll need to modify the parsing logic in `weighbridgeService.ts`.

---

### Development Mode (No Hardware)
For testing without real weighbridge:

```typescript
// weighbridgeService.ts simulates:
- Random weights between 0-50000 kg
- Weight becomes stable after 2 seconds
- Fluctuations to mimic real behavior
```

**Enable/Disable**:
```typescript
const developmentMode = true; // In SettingsWeighbridge.tsx
```

---

## CCTV Camera Integration

### Overview
CCTV cameras capture images of vehicles for:
- Visual verification
- Fraud prevention
- Record keeping
- Dispute resolution

**Camera Setup**:
- **Front Camera**: Captures vehicle registration plate (front view)
- **Rear Camera**: Captures vehicle from rear (optional: payload verification)

---

### Supported Camera Types

#### 1. **IP Cameras** (Most Common)
```
IP Camera → Ethernet → Network → Frontend
```

**Requirements**:
- HTTP snapshot API
- Accessible on local network
- No authentication OR basic auth

**Example Camera URLs**:
```
http://192.168.1.101/snapshot.jpg        // Axis camera
http://192.168.1.102/cgi-bin/snapshot    // Dahua camera
http://192.168.1.103/ISAPI/Streaming/channels/1/picture  // Hikvision
```

---

#### 2. **USB Cameras**
```
USB Camera → Computer → Backend Proxy → Frontend
```

**Requires Backend**: Node.js/Python service to:
- Access USB camera via OpenCV or similar library
- Expose HTTP endpoint: `GET /api/camera/snapshot?camera=usb1`
- Return JPEG image

---

#### 3. **RTSP Cameras**
```
RTSP Camera → Backend Converter → Frontend
```

**Requires Backend**: Convert RTSP stream to snapshots:
- Use FFmpeg to grab frames
- Expose HTTP endpoint
- Return JPEG image

---

### Configuration

**Frontend Config** (`cameraService.ts`):
```typescript
{
  frontCameraUrl: "http://192.168.1.101/snapshot.jpg",
  rearCameraUrl: "http://192.168.1.102/snapshot.jpg",
  username: "admin",      // Optional
  password: "camera123",  // Optional
  timeout: 5000           // 5 seconds
}
```

**Backend Proxy** (optional, for auth or USB cameras):
```typescript
// Node.js/Express endpoint
app.get('/api/camera/snapshot', async (req, res) => {
  const { camera } = req.query; // 'front' or 'rear'
  
  const cameraUrl = camera === 'front' 
    ? process.env.FRONT_CAMERA_URL 
    : process.env.REAR_CAMERA_URL;
  
  // Fetch image from camera
  const response = await axios.get(cameraUrl, {
    auth: { username: '...', password: '...' },
    responseType: 'arraybuffer'
  });
  
  // Return image
  res.set('Content-Type', 'image/jpeg');
  res.send(response.data);
});
```

---

### Image Capture Flow

**1. User clicks "Capture Weight"**
```typescript
// In UnifiedWeighmentForm.tsx
const handleCapture = async () => {
  // Capture both cameras
  const { frontImage, rearImage } = await captureBothCameras();
  
  // Store Base64 images in state
  setFormData({
    ...formData,
    frontImage,
    rearImage
  });
};
```

**2. Backend receives images with bill data**
```typescript
// POST /api/bills
{
  serialNo: "00001",
  vehicleNo: "MH12AB1234",
  // ...
  frontImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  rearImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**3. Backend stores images**
- **Option 1**: Store Base64 in database (simple but larger storage)
- **Option 2**: Save as files, store file paths in database (recommended)
- **Option 3**: Use cloud storage (AWS S3, etc.)

---

### Image Display

**In Bill View**:
```typescript
<div className="flex gap-4">
  <div>
    <h3>Front Camera</h3>
    <img src={bill.frontImage} alt="Front view" />
  </div>
  <div>
    <h3>Rear Camera</h3>
    <img src={bill.rearImage} alt="Rear view" />
  </div>
</div>
```

---

### Live Camera Preview

**Component**: `DualCameraFeed.tsx`

```typescript
function DualCameraFeed() {
  const [frontFeed, setFrontFeed] = useState('');
  const [rearFeed, setRearFeed] = useState('');
  
  useEffect(() => {
    // Poll cameras every 500ms for live preview
    const interval = setInterval(async () => {
      const front = await captureSnapshot('front');
      const rear = await captureSnapshot('rear');
      setFrontFeed(front);
      setRearFeed(rear);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <img src={frontFeed} alt="Front camera" />
      <img src={rearFeed} alt="Rear camera" />
    </div>
  );
}
```

---

### Camera Troubleshooting

**Common Issues**:

1. **CORS Error** (browser blocks camera URL):
   - **Solution**: Use backend proxy endpoint
   - Camera → Backend → Frontend (no CORS)

2. **Authentication Required**:
   - **Solution**: Add `username` and `password` in config
   - Or use backend proxy with credentials

3. **Slow Image Capture**:
   - **Solution**: Reduce image resolution at camera settings
   - Use JPEG instead of PNG
   - Increase timeout setting

4. **Camera Offline**:
   - Check network connectivity
   - Ping camera IP address
   - Verify camera URL in browser

---

## Database Connection Flow

### Architecture Overview

```
Frontend (React)
    ↓
Development Mode?
    ↓
YES → localStorage (Mock Data)
NO  → API Services (Backend)
         ↓
    Spring Boot / Node.js
         ↓
    PostgreSQL Database
```

---

### Development Mode (localStorage)

**When to use**: Testing, development, offline scenarios

**How it works**:
```typescript
// In Settings → Weighbridge
const [developmentMode, setDevelopmentMode] = useState(
  localStorage.getItem('developmentMode') === 'true'
);

// In components
if (developmentMode) {
  // Use mock data
  setVehicles(mockVehicles);
} else {
  // Fetch from backend
  const vehicles = await getVehicles();
  setVehicles(vehicles);
}
```

**Data Storage**:
- `localStorage.setItem('bills', JSON.stringify(bills))`
- `localStorage.setItem('openTickets', JSON.stringify(tickets))`
- `localStorage.setItem('vehicles', JSON.stringify(vehicles))`

**Limitations**:
- Data lost if browser cache cleared
- No multi-user access
- No data validation
- Limited storage (5-10 MB)

---

### Production Mode (Backend API)

**When to use**: Production, multi-user scenarios

**Data Flow**:

1. **Frontend Request**:
```typescript
// User clicks "Save" button
const handleSubmit = async (data) => {
  const result = await saveBill(data);
  if (result.success) {
    toast({ title: "Success" });
  }
};
```

2. **API Service**:
```typescript
// billService.ts
export const saveBill = async (bill: Bill) => {
  const response = await apiClient.post('/api/bills', bill);
  return response.data;
};
```

3. **Backend API**:
```typescript
// Spring Boot / Node.js
POST /api/bills
{
  serialNo: "00001",
  vehicleNo: "MH12AB1234",
  // ... bill data
}
```

4. **Database**:
```sql
INSERT INTO bills (serial_no, vehicle_no, party_name, ...)
VALUES ('00001', 'MH12AB1234', 'ABC Industries', ...);
```

5. **Response to Frontend**:
```json
{
  "id": "bill-id-123",
  "serialNo": "00001",
  // ... saved bill data
}
```

---

### Configuration (API Base URL)

**Settings → Weighbridge → API Configuration**:

```typescript
// User enters backend URL
const apiBaseUrl = "http://localhost:8080"; // or production URL

// Save to localStorage
localStorage.setItem('api_base_url', apiBaseUrl);

// apiClient.ts reads this value
export const getApiBaseUrl = () => {
  return localStorage.getItem('api_base_url') || 'http://localhost:8080';
};
```

---

### Database Schema

See `DATABASE_DOCUMENTATION.md` for complete schema.

**Key Tables**:
- `bills`: Completed weighments
- `open_tickets`: Incomplete weighments (first trip)
- `vehicles`: Master vehicle data
- `parties`: Master party data
- `products`: Master product data
- `stored_tares`: Stored tare weights
- `users`: User accounts

---

## Workflow Documentation

### 1. Quick Weighment Workflow

**Use Case**: Vehicle with stored tare weight

**Steps**:
1. Operator selects "Quick Weighment"
2. Enters vehicle number (e.g., "MH12AB1234")
3. System fetches stored tare weight (e.g., 10,000 kg)
4. Vehicle drives onto weighbridge
5. System captures gross weight (e.g., 25,000 kg)
6. System calculates: Net = Gross - Tare = 15,000 kg
7. Captures camera images
8. Generates and prints bill

**Advantages**:
- Fastest workflow (single weighment)
- Reduces vehicle wait time
- Ideal for regular vehicles

**Code Flow**:
```typescript
// QuickWeighment.tsx
const handleSubmit = async (data) => {
  // 1. Fetch stored tare
  const tare = await getStoredTareByVehicle(data.vehicleNo);
  
  // 2. Get live weight (gross)
  const grossWeight = liveWeight;
  
  // 3. Calculate net
  const netWeight = grossWeight - tare.tareWeight;
  
  // 4. Create bill
  await saveBill({
    ...data,
    grossWeight,
    tareWeight: tare.tareWeight,
    netWeight
  });
};
```

---

### 2. Regular Weighment (Two-Trip) Workflow

**Use Case**: Standard weighment process

**First Trip (Gross Weight)**:
1. Loaded vehicle arrives
2. Operator enters vehicle details
3. Captures gross weight (e.g., 25,000 kg)
4. Captures camera images
5. System saves as **Open Ticket**
6. Vehicle leaves

**Second Trip (Tare Weight)**:
1. Empty vehicle returns
2. Operator loads open ticket
3. Captures tare weight (e.g., 10,000 kg)
4. Captures camera images
5. System calculates: Net = 25,000 - 10,000 = 15,000 kg
6. Closes ticket and generates bill

**Code Flow**:
```typescript
// First Trip
const handleFirstTrip = async (data) => {
  await saveOpenTicket({
    vehicleNo: data.vehicleNo,
    firstWeight: liveWeight,
    firstWeightType: 'Gross',
    firstWeightDate: new Date().toISOString(),
    // ...
  });
};

// Second Trip
const handleSecondTrip = async (ticketId, data) => {
  await closeOpenTicket(ticketId, {
    secondWeight: liveWeight,
    secondWeightType: 'Tare',
    secondWeightDate: new Date().toISOString()
  });
  // Backend calculates net and creates bill
};
```

---

### 3. Shuttle Weighment (One-Time) Workflow

**Use Case**: Manual net weight entry, emergency scenarios

**Steps**:
1. Operator selects "Shuttle Weighment"
2. Enters vehicle details
3. **Manually enters**:
   - Gross Weight (e.g., 25,000 kg)
   - Tare Weight (e.g., 10,000 kg)
4. System calculates: Net = Gross - Tare = 15,000 kg
5. Generates bill

**⚠️ Warning**: Bypasses live weighbridge - use only when necessary.

---

### 4. Stored Tare Management Workflow

**Purpose**: Pre-store tare weights for regular vehicles

**Steps**:
1. Admin goes to **Masters → Vehicles**
2. Clicks "Add Stored Tare"
3. Enters:
   - Vehicle Number
   - Tare Weight
   - Expiry Date (optional)
4. Saves to database

**Expiry Handling**:
- System checks expiry before using stored tare
- Expired tares must be updated or re-weighed

---

### 5. Bill Management Workflow

**View Bills**:
1. Navigate to **Weighments** page
2. View all bills in table
3. Search by vehicle number, party, etc.
4. Filter by date range or status

**Print Bill**:
1. Click "Print" on bill row
2. System opens print preview
3. User confirms and prints

**Export Bills**:
1. Select date range
2. Click "Export to Excel" or "Export to PDF"
3. File downloads automatically

---

## Context Providers

### What are Context Providers?
React Context allows you to share data across components without passing props manually.

### `AuthContext`

**Purpose**: Manage authentication state globally.

**Provides**:
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  login: (username, password) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

**Implementation**:
```typescript
// AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (username: string, password: string) => {
    // Call backend API
    const response = await apiClient.post('/api/auth/login', {
      username,
      password
    });
    
    const { token, user } = response.data;
    
    // Store token
    localStorage.setItem('auth_token', token);
    
    // Set user
    setUser(user);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Usage**:
```typescript
function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
```

---

### `AccessControlContext`

**Purpose**: Manage user permissions and access blocking.

**Features**:
- Role-based access control (RBAC)
- Temporary access blocking
- Permission checking

**Provides**:
```typescript
{
  checkAccess: (permission: string) => boolean;
  isAccessBlocked: boolean;
  blockAccess: (userId: string) => void;
  unblockAccess: (userId: string) => void;
}
```

**Permissions**:
```typescript
const PERMISSIONS = {
  'weighment.create': ['operator', 'admin', 'super_admin'],
  'weighment.delete': ['admin', 'super_admin'],
  'user.create': ['super_admin'],
  'settings.edit': ['admin', 'super_admin'],
  // ...
};
```

**Usage**:
```typescript
function DeleteButton({ billId }) {
  const { checkAccess } = useAccessControl();
  
  if (!checkAccess('weighment.delete')) {
    return null; // Hide button
  }
  
  return <Button onClick={() => deleteBill(billId)}>Delete</Button>;
}
```

---

### `NotificationContext`

**Purpose**: Global notification management (toast messages).

**Provides**:
```typescript
{
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
}
```

**Usage**:
```typescript
function SaveButton() {
  const { notify } = useNotification();
  
  const handleSave = async () => {
    try {
      await saveBill(data);
      notify('Bill saved successfully', 'success');
    } catch (error) {
      notify('Failed to save bill', 'error');
    }
  };
  
  return <Button onClick={handleSave}>Save</Button>;
}
```

---

## Routing & Navigation

### Route Structure

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<Login />} />
  
  {/* Protected routes */}
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/operator" element={<OperatorConsole />} />
    <Route path="/weighments" element={<Weighments />} />
    <Route path="/reports" element={<Reports />} />
    
    {/* Master data routes */}
    <Route path="/masters/vehicles" element={<MastersVehicles />} />
    <Route path="/masters/parties" element={<MastersParties />} />
    <Route path="/masters/products" element={<MastersProducts />} />
    
    {/* Settings routes */}
    <Route path="/settings/users" element={<SettingsUsers />} />
    <Route path="/settings/profile" element={<SettingsProfile />} />
    <Route path="/settings/weighbridge" element={<SettingsWeighbridge />} />
    <Route path="/settings/serial-number" element={<SettingsSerialNumber />} />
    <Route path="/settings/print" element={<PrintSettings />} />
  </Route>
  
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Protected Routes

**AppLayout.tsx** acts as route guard:

```typescript
export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <SidebarProvider>
      {/* Layout with sidebar and navbar */}
      <Outlet />
    </SidebarProvider>
  );
};
```

### Role-Based Routes

**Example**: Only admins can access user management

```typescript
function SettingsUsers() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return <UserManagementPage />;
}
```

---

## State Management Strategy

### When to use what?

| State Type | Solution | Example |
|------------|----------|---------|
| **Local Component State** | `useState` | Form inputs, toggles |
| **Global App State** | Context API | Auth, notifications |
| **Server State** | TanStack Query | Bills, vehicles, parties |
| **Form State** | React Hook Form | Complex forms with validation |
| **URL State** | React Router | Current page, search params |

### Examples

#### Local State
```typescript
function Counter() {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}
```

#### Global State (Context)
```typescript
function Navbar() {
  const { user } = useAuth(); // From context
  return <div>Welcome, {user?.name}</div>;
}
```

#### Server State (TanStack Query)
```typescript
function VehicleList() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles
  });
  
  if (isLoading) return <Spinner />;
  return <List items={vehicles} />;
}
```

#### Form State (React Hook Form)
```typescript
function WeighmentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('vehicleNo', { required: true })} />
      {errors.vehicleNo && <span>Required</span>}
    </form>
  );
}
```

---

## UI/UX Design System

### Shadcn/ui Components
This project uses **Shadcn/ui** - a collection of accessible, customizable components built with:
- **Radix UI**: Unstyled, accessible primitives
- **Tailwind CSS**: Utility-first styling

### Core Components

#### Buttons
```typescript
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

#### Forms
```typescript
<Form {...form}>
  <FormField
    control={form.control}
    name="vehicleNo"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Vehicle Number</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

#### Dialogs
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <DialogDescription>Dialog content here</DialogDescription>
  </DialogContent>
</Dialog>
```

### Tailwind Theme
**File**: `index.css`

**Design Tokens**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

**Usage**:
```typescript
<div className="bg-background text-foreground p-4 border border-border rounded-md">
  <h1 className="text-primary">Hello</h1>
  <Button className="bg-destructive">Delete</Button>
</div>
```

### Responsive Design
```typescript
<div className="
  px-4 py-2          // Mobile (default)
  md:px-6 md:py-4   // Tablet (768px+)
  lg:px-8 lg:py-6   // Desktop (1024px+)
">
  Content
</div>
```

---

## Configuration Files

### `vite.config.ts`
**Purpose**: Vite build tool configuration

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080', // Proxy API calls to backend
    },
  },
});
```

### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration

```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        // ... more design tokens
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### `tsconfig.json`
**Purpose**: TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Development Workflow

### Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development vs Production

**Development Mode**:
- Uses mock data (localStorage)
- Hot module reloading
- Detailed error messages
- No hardware required

**Production Mode**:
- Connects to real backend API
- Optimized bundle size
- Error tracking
- Real weighbridge and cameras

### Testing Components

**Manual Testing**:
1. Run dev server: `npm run dev`
2. Open browser: `http://localhost:5173`
3. Test workflows in Operator Console

**Mock Data**: Use `mockData.ts` to test without backend

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to backend"
- **Check**: API base URL in Settings → Weighbridge
- **Verify**: Backend is running (`http://localhost:8080/api/health`)
- **Check**: CORS is enabled in backend

#### 2. "Weighbridge not connecting"
- **Check**: Connection settings (serial port / IP address)
- **Verify**: Hardware is powered on
- **Test**: Enable development mode for testing

#### 3. "Camera images not capturing"
- **Check**: Camera IP addresses in settings
- **Verify**: Cameras are accessible (ping IP)
- **Check**: CORS / use backend proxy

#### 4. "Bills not saving"
- **Check**: Browser console for errors
- **Verify**: Backend API is responding
- **Check**: Database connection in backend

---

## Next Steps

1. **Read Backend Documentation**: `BACKEND_DOCUMENTATION.md`, `NODEJS_BACKEND_GUIDE.md`
2. **Read Database Schema**: `DATABASE_DOCUMENTATION.md`
3. **Migration Guide**: `BACKEND_MIGRATION_GUIDE.md` (for moving localStorage to backend)
4. **Explore Components**: Start with `UnifiedWeighmentForm.tsx`
5. **Test Workflows**: Use Operator Console with mock data

---

## Summary

This React frontend is a **complete weighbridge management system** with:
- ✅ Real-time hardware integration (weighbridge + cameras)
- ✅ Multiple weighment workflows (Quick, Regular, Shuttle)
- ✅ Bill management and printing
- ✅ Master data management (vehicles, parties, products)
- ✅ Role-based access control
- ✅ Backend-agnostic design (works with any REST API)
- ✅ Offline-capable (localStorage fallback)
- ✅ Modern UI (Shadcn/ui + Tailwind)

**Key Components**:
- `UnifiedWeighmentForm.tsx` - Main weighment interface
- `useWeighbridge()` - Hardware abstraction hook
- `apiClient.ts` - HTTP client with JWT auth
- `weighbridgeService.ts` - Hardware communication

**Key Workflows**:
- Quick Weighment (stored tare)
- Regular Weighment (two-trip)
- Shuttle Weighment (one-time)
- Bill management and printing

For backend setup, see `NODEJS_BACKEND_GUIDE.md` or `BACKEND_DOCUMENTATION.md` (Spring Boot).
