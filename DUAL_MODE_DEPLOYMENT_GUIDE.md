# Dual-Mode Deployment Guide

## Complete Guide to Building Online Web App & Offline Desktop App from Same Codebase

This guide explains how to maintain a single codebase that can be built as:
1. **Online Web Application** - Frontend connects to remote backend API (hosted separately)
2. **Offline Desktop Application** - Standalone .exe with localStorage data persistence (using Tauri)

---

## Architecture Overview

### How It Works

The application uses a **unified service layer** (`src/services/unifiedServices.ts`) that automatically switches between:
- **Backend API calls** (for online web app)
- **localStorage operations** (for offline desktop app)

This switching is controlled by the `VITE_APP_MODE` environment variable at build time.

```
┌─────────────────────────────────────────────────────────┐
│                  React Components                        │
│         (Same code for both online & desktop)           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Unified Service Layer                       │
│           (src/services/unifiedServices.ts)             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │   isOfflineMode() checks VITE_APP_MODE         │    │
│  └────────────────────────────────────────────────┘    │
│              ↓                        ↓                  │
│    ┌─────────────────┐      ┌──────────────────┐       │
│    │ API Services    │      │ localStorage     │       │
│    │ (Online)        │      │ Services         │       │
│    │                 │      │ (Desktop)        │       │
│    └─────────────────┘      └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Environment Configuration

### Create `.env.production` (Online Web App)

Create file in project root:

```env
# Online Web Application Mode
VITE_APP_MODE=online
VITE_API_BASE_URL=https://your-backend-api.com
```

### Create `.env.desktop` (Offline Desktop App)

Create file in project root:

```env
# Desktop Application Mode (Offline)
VITE_APP_MODE=desktop
VITE_API_BASE_URL=http://localhost:8080
```

**Note**: For desktop mode, `VITE_API_BASE_URL` is only used for optional hardware integration (weighbridge/camera via local network). It's not used for data storage.

---

## Step 2: Update `unifiedServices.ts`

Modify `src/services/unifiedServices.ts` to check build mode:

### Replace the `isDevelopmentMode()` function:

```typescript
/**
 * Check if app is in offline/desktop mode
 * Priority: 1. Build-time env var, 2. Runtime localStorage flag
 */
const isOfflineMode = (): boolean => {
  // Check build-time mode first
  const buildMode = import.meta.env.VITE_APP_MODE;
  if (buildMode === 'desktop') {
    return true; // Desktop build always uses offline mode
  }
  if (buildMode === 'online') {
    return false; // Online build always uses backend API
  }
  
  // Fallback: Check runtime localStorage (for development)
  return localStorage.getItem('developmentMode') === 'true';
};
```

### Update all service function calls:

Replace all occurrences of `isDevelopmentMode()` with `isOfflineMode()`:

```typescript
export const getBills = async (): Promise<Bill[]> => {
  if (isOfflineMode()) {
    return localStorageBillService.getBills();
  } else {
    const { data, error } = await apiBillService.getBills();
    // ... rest of code
  }
};
```

**Files to update**:
- `src/services/unifiedServices.ts` - All service functions

---

## Step 3: Update Build Scripts

### Modify `package.json`

Add these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:online": "tsc -b && vite build --mode production",
    "build:desktop": "tsc -b && vite build --mode desktop",
    "preview": "vite preview",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

**Script Explanation**:
- `build:online` - Builds web app that connects to backend API
- `build:desktop` - Builds desktop app that uses localStorage
- `tauri:build` - Builds Tauri desktop executable (.exe)

---

## Step 4: Configure Tauri (Desktop Only)

### Update `src-tauri/tauri.conf.json`

Ensure the `beforeBuildCommand` uses the desktop build:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build:desktop",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Weighbridge Management System",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "scope": ["$APPDATA/*", "$RESOURCE/*"]
      },
      "dialog": {
        "all": true
      },
      "shell": {
        "all": false,
        "open": true
      },
      "http": {
        "all": false,
        "request": true,
        "scope": ["http://localhost:*", "http://192.168.*"]
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.weighbridge.management",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "windows": {
      "title": "Weighbridge Management System",
      "width": 1280,
      "height": 720,
      "resizable": true,
      "fullscreen": false
    }
  }
}
```

---

## Step 5: Building for Each Mode

### Building Online Web Application

```bash
# Build for production (online mode)
npm run build:online

# Output: dist/ folder
# Deploy this folder to:
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Your own web server
```

**What happens**:
- `VITE_APP_MODE=online` is used
- All data operations use backend API calls
- Frontend connects to `VITE_API_BASE_URL`

**Backend Requirements**:
- Spring Boot backend must be running at `VITE_API_BASE_URL`
- Database (MySQL/PostgreSQL) must be accessible to backend
- All API endpoints must be implemented

### Building Desktop Application

```bash
# Install Tauri CLI (first time only)
npm install --save-dev @tauri-apps/cli

# Build desktop executable
npm run tauri:build

# Output: src-tauri/target/release/bundle/
# - Windows: .exe installer
# - Linux: .deb, .AppImage
# - macOS: .dmg, .app
```

**What happens**:
- `VITE_APP_MODE=desktop` is used
- All data operations use localStorage
- No backend server required
- Hardware integration (weighbridge/camera) uses local network

---

## Step 6: Deployment Instructions

### Online Web App Deployment

#### Option A: Netlify (Recommended)

1. Push code to GitHub
2. Connect repository to Netlify
3. Configure build settings:
   - **Build command**: `npm run build:online`
   - **Publish directory**: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_APP_MODE=online`
   - `VITE_API_BASE_URL=https://your-backend-api.com`

#### Option B: Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Configure build settings:
   - **Build command**: `npm run build:online`
   - **Output directory**: `dist`
4. Add environment variables:
   - `VITE_APP_MODE=online`
   - `VITE_API_BASE_URL=https://your-backend-api.com`

#### Option C: Traditional Web Server

```bash
# Build locally
npm run build:online

# Upload dist/ folder to web server
scp -r dist/* user@yourserver.com:/var/www/html/

# Configure nginx/apache to serve the files
```

### Desktop App Distribution

#### Windows Distribution

1. After `npm run tauri:build`, locate installer:
   ```
   src-tauri/target/release/bundle/msi/
   Weighbridge Management System_1.0.0_x64_en-US.msi
   ```

2. Distribute the `.msi` file to users

3. Users double-click to install

4. Application data stored in:
   ```
   C:\Users\{username}\AppData\Roaming\com.weighbridge.management\
   ```

#### Linux Distribution

```bash
# .deb package (Ubuntu/Debian)
src-tauri/target/release/bundle/deb/
weighbridge-management-system_1.0.0_amd64.deb

# AppImage (Universal)
src-tauri/target/release/bundle/appimage/
weighbridge-management-system_1.0.0_amd64.AppImage
```

#### macOS Distribution

```bash
# .dmg installer
src-tauri/target/release/bundle/dmg/
Weighbridge Management System_1.0.0_x64.dmg

# .app bundle
src-tauri/target/release/bundle/macos/
Weighbridge Management System.app
```

---

## Step 7: Testing Both Modes

### Testing Online Mode (Development)

```bash
# Start backend server first
cd backend
./mvnw spring-boot:run

# In another terminal, start frontend
cd frontend
npm run dev

# Temporarily set online mode in browser console
localStorage.setItem('developmentMode', 'false')
```

### Testing Desktop Mode (Development)

```bash
# Start Tauri dev mode
npm run tauri:dev

# App automatically uses desktop/offline mode
```

---

## File Structure Summary

```
project-root/
├── .env.production          # Online web app config
├── .env.desktop            # Desktop app config
├── src/
│   ├── services/
│   │   ├── unifiedServices.ts        # ✅ Modified: isOfflineMode()
│   │   ├── api/                      # Used in online mode
│   │   │   ├── billService.ts
│   │   │   ├── masterDataService.ts
│   │   │   └── ...
│   │   ├── localStorage/             # Used in desktop mode
│   │   │   ├── billService.ts
│   │   │   ├── masterDataService.ts
│   │   │   └── ...
│   │   ├── weighbridgeService.ts     # Hardware integration (both modes)
│   │   └── cameraService.ts          # Hardware integration (both modes)
│   ├── components/                   # Same for both modes
│   ├── pages/                        # Same for both modes
│   └── ...
├── src-tauri/                        # Desktop app only
│   ├── tauri.conf.json              # ✅ Modified: beforeBuildCommand
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── package.json                      # ✅ Modified: build scripts
└── ...
```

---

## Common Scenarios

### Scenario 1: Cloud-Based Business (Online Mode)

**Use Case**: SaaS weighbridge management for multiple locations

**Setup**:
1. Build frontend: `npm run build:online`
2. Deploy frontend to Netlify/Vercel
3. Deploy backend to AWS/Azure/DigitalOcean
4. Configure `VITE_API_BASE_URL` to backend URL
5. Users access via browser at `https://yourapp.com`

**Benefits**:
- Centralized data
- Access from anywhere
- Real-time synchronization
- Easy updates

### Scenario 2: Single Weighbridge Installation (Desktop Mode)

**Use Case**: Standalone weighbridge at a factory/warehouse

**Setup**:
1. Build desktop app: `npm run tauri:build`
2. Install `.msi` on weighbridge PC
3. Connect weighbridge indicator via serial/network
4. Connect CCTV cameras via local network
5. All data stored locally in `AppData`

**Benefits**:
- No internet required
- Faster performance
- Data privacy
- One-time purchase

### Scenario 3: Hybrid Setup

**Use Case**: Multiple weighbridges with central office

**Setup**:
- Each weighbridge: Desktop app (offline mode)
- Central office: Web app (online mode)
- Periodic data sync via export/import or database replication

---

## Environment Variables Reference

### For Online Web App

```env
VITE_APP_MODE=online
VITE_API_BASE_URL=https://api.yourcompany.com
```

### For Desktop App

```env
VITE_APP_MODE=desktop
VITE_API_BASE_URL=http://localhost:8080
```

### For Development

No `.env` file needed. Use localStorage:

```javascript
// Test online mode
localStorage.setItem('developmentMode', 'false')

// Test offline mode
localStorage.setItem('developmentMode', 'true')
```

---

## Backend API Requirements (Online Mode Only)

When building for online mode, your Spring Boot backend must implement:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Bill Management
- `GET /api/bills` - Get all bills
- `GET /api/bills/{id}` - Get bill by ID
- `POST /api/bills` - Create new bill
- `PUT /api/bills/{id}` - Update bill
- `DELETE /api/bills/{id}` - Delete bill

### Master Data
- `GET /api/vehicles` - Get all vehicles
- `GET /api/parties` - Get all parties
- `GET /api/products` - Get all products
- `POST /api/vehicles` - Add vehicle
- `POST /api/parties` - Add party
- `POST /api/products` - Add product

### Open Tickets
- `GET /api/tickets/open` - Get open tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}/close` - Close ticket

### Settings
- `GET /api/settings/weighbridge` - Get weighbridge config
- `PUT /api/settings/weighbridge` - Update weighbridge config
- `GET /api/settings/print-template` - Get print template
- `PUT /api/settings/print-template` - Update print template

Refer to `BACKEND_DOCUMENTATION.md` for complete API specifications.

---

## Troubleshooting

### Issue: Build uses wrong mode

**Problem**: Built online app but it's using localStorage

**Solution**:
```bash
# Check .env file exists and has correct VITE_APP_MODE
cat .env.production

# Clean build and rebuild
rm -rf dist/
npm run build:online
```

### Issue: Desktop app trying to connect to API

**Problem**: Desktop app shows API connection errors

**Solution**:
```bash
# Verify desktop build command
npm run build:desktop

# Check tauri.conf.json uses build:desktop
# Rebuild Tauri app
npm run tauri:build
```

### Issue: Environment variables not loading

**Problem**: `VITE_API_BASE_URL` is undefined

**Solution**:
- Vite only loads `.env` files at build time
- Environment variables must start with `VITE_`
- Restart dev server after changing `.env` files

### Issue: Different behavior in dev vs production

**Problem**: Works in `npm run dev` but not in build

**Solution**:
```bash
# Test production build locally
npm run build:online
npm run preview

# For desktop
npm run tauri:build
# Install and test the .msi
```

---

## Migration from Single Mode

If you currently have a single-mode app and want to add dual-mode support:

1. ✅ Create `.env.production` and `.env.desktop` files
2. ✅ Update `isOfflineMode()` function in `unifiedServices.ts`
3. ✅ Update `package.json` build scripts
4. ✅ Update `tauri.conf.json` (if using Tauri)
5. ✅ Test both builds separately
6. ✅ Set up CI/CD for both deployment paths

---

## CI/CD Pipeline Example

### GitHub Actions for Online Web App

```yaml
# .github/workflows/deploy-online.yml
name: Deploy Online Web App

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:online
        env:
          VITE_APP_MODE: online
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### GitHub Actions for Desktop App

```yaml
# .github/workflows/build-desktop.yml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run tauri:build
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: src-tauri/target/release/bundle/msi/*.msi
```

---

## Summary

| Aspect | Online Web App | Desktop App |
|--------|---------------|-------------|
| **Build Command** | `npm run build:online` | `npm run tauri:build` |
| **Environment** | `.env.production` | `.env.desktop` |
| **Data Storage** | Backend API + Database | localStorage |
| **Deployment** | Netlify/Vercel/Server | .msi/.exe installer |
| **Internet** | Required | Not required |
| **Updates** | Automatic (on refresh) | Manual (new installer) |
| **Hardware** | Optional (if backend supports) | Direct (serial/network) |
| **Best For** | SaaS, multi-user | Single installation, offline |

---

## Next Steps

1. ✅ Set up environment files (`.env.production`, `.env.desktop`)
2. ✅ Update `unifiedServices.ts` with `isOfflineMode()`
3. ✅ Update `package.json` scripts
4. ✅ Test both builds locally
5. ✅ Deploy online version to hosting platform
6. ✅ Build and distribute desktop installer
7. ✅ Set up CI/CD pipelines (optional)

---

## Resources

- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Tauri Documentation**: https://tauri.app/
- **Backend API Guide**: See `BACKEND_DOCUMENTATION.md`
- **Desktop Conversion Guide**: See `DESKTOP_APP_CONVERSION_GUIDE.md`

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0
