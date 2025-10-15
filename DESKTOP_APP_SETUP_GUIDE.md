# Truckore Pro - Desktop App Setup Guide

## Complete Guide: From Source Code to Running Desktop Application

This guide will walk you through setting up, building, and running Truckore Pro as a desktop application using Tauri.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Initial Setup](#initial-setup)
4. [Running in Development Mode](#running-in-development-mode)
5. [Building for Production](#building-for-production)
6. [Troubleshooting](#troubleshooting)
7. [Database Location](#database-location)

---

## Prerequisites

### Required Software

#### 1. **Node.js and npm** (v18 or higher)
- Download from: https://nodejs.org/
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### 2. **Rust** (Required for Tauri)
- Download from: https://rustup.rs/
- For Windows: Download and run `rustup-init.exe`
- For Mac/Linux:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- Verify installation:
  ```bash
  rustc --version
  cargo --version
  ```

#### 3. **Visual Studio Build Tools** (Windows Only)
Tauri requires C++ build tools on Windows.

**Option A: Visual Studio Community (Recommended)**
- Download from: https://visualstudio.microsoft.com/downloads/
- During installation, select:
  - "Desktop development with C++"
  - Windows 10/11 SDK
  - MSVC v143 build tools

**Option B: Build Tools Only**
- Download "Build Tools for Visual Studio 2022"
- Install the same components as above

#### 4. **WebView2** (Windows Only - Usually Pre-installed)
- Windows 10/11 typically includes WebView2
- If needed, download from: https://developer.microsoft.com/microsoft-edge/webview2/

#### 5. **Xcode Command Line Tools** (macOS Only)
```bash
xcode-select --install
```

#### 6. **Development Dependencies** (Linux Only)
```bash
# Debian/Ubuntu
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Fedora
sudo dnf install webkit2gtk3-devel.x86_64 \
    openssl-devel \
    curl \
    wget \
    libappindicator-gtk3 \
    librsvg2-devel

# Arch Linux
sudo pacman -S webkit2gtk \
    base-devel \
    curl \
    wget \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg
```

---

## Understanding the Architecture

Truckore Pro uses a **dual-layer architecture**:

```
┌─────────────────────────────────────────────────┐
│            Frontend (React + Vite)              │
│  • UI Components                                │
│  • Business Logic                               │
│  • Runs in OS-native WebView                    │
└────────────────┬────────────────────────────────┘
                 │ Tauri Bridge
                 ▼
┌─────────────────────────────────────────────────┐
│          Backend (Rust + Tauri)                 │
│  • SQLite Database Operations                   │
│  • File System Access                           │
│  • Secure Local Storage                         │
│  • Runs as Native Binary                        │
└─────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | User interface and application logic |
| **Backend** | Rust + Tauri | Native OS integration, database management |
| **Database** | SQLite | Local data storage (encrypted) |
| **Bridge** | Tauri Invoke API | Communication between frontend and backend |

---

## Initial Setup

### Step 1: Clone/Extract the Project

```bash
# Navigate to your project directory
cd path/to/truckore-pro
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

This installs:
- React and UI components
- Tauri API client (`@tauri-apps/api`)
- All frontend dependencies

### Step 3: Verify Tauri CLI Installation

The Tauri CLI should be installed as a dev dependency. Verify it's available:

```bash
npx tauri --version
```

You should see output like: `tauri-cli 1.5.x`

### Step 4: Configure Package.json Scripts

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:desktop": "vite build --mode desktop",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Note**: In Lovable.dev, `package.json` is read-only. You'll need to manually add these scripts when setting up on your local machine.

### Step 5: Verify Files Are in Place

Check that these critical files exist:

- ✅ `src-tauri/src/main.rs` - Rust backend code
- ✅ `src-tauri/Cargo.toml` - Rust dependencies
- ✅ `src-tauri/tauri.conf.json` - Tauri configuration
- ✅ `src/services/database/schema.sql` - Database schema
- ✅ `.env.desktop` - Desktop environment variables

---

## Running in Development Mode

### Step 1: Start the Development Server

```bash
npm run tauri:dev
```

This command does the following:
1. Starts Vite dev server on `http://localhost:8080`
2. Compiles the Rust backend
3. Opens the Tauri window with your app

### Step 2: First-Time Setup

When you first run the app:

1. **Loading Screen** appears while initializing the database
2. **First-Time Setup Wizard** launches:
   - Welcome screen
   - Create Super Admin account
   - Set secure password
3. **Success** - You'll be redirected to the login page

### Step 3: Login

Use the Super Admin credentials you just created to log in.

### Step 4: Development Hot Reload

- Frontend changes (React code) will hot-reload automatically
- Backend changes (Rust code) require restarting `npm run tauri:dev`

---

## Building for Production

### Step 1: Build the Application

```bash
npm run tauri:build
```

This creates a production-ready installer in:
- **Windows**: `src-tauri/target/release/bundle/msi/` or `nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` or `app/`
- **Linux**: `src-tauri/target/release/bundle/deb/`, `appimage/`, or `rpm/`

### Step 2: Distribute the Installer

The generated installer includes:
- Compiled Rust backend
- Bundled React frontend
- SQLite database engine
- All required dependencies

**Users only need to install the application** - no Node.js, Rust, or other dependencies required!

---

## Troubleshooting

> **💡 Windows Users**: See **`WINDOWS_TROUBLESHOOTING.md`** for comprehensive Windows-specific troubleshooting covering 17+ common issues.

### Issue 1: "Non-query execution failed - this application requires Tauri desktop environment"

**Cause**: The app is running in browser mode instead of Tauri desktop mode.

**Solution**:

1. **Check if you're running the correct command**:
   ```bash
   npm run tauri:dev   # ✅ Correct - Desktop mode
   npm run dev         # ❌ Wrong - Browser mode
   ```

2. **Verify Tauri is detected**:
   - Open the app
   - Open Developer Tools (F12 or Ctrl+Shift+I)
   - Check console logs:
     ```
     [DB Init] Tauri available: true    ✅ Good
     [DB Init] Tauri available: false   ❌ Problem
     ```

3. **If Tauri is not detected**:
   - Ensure `@tauri-apps/api` is installed: `npm install`
   - Check that `window.__TAURI__` exists in the browser console
   - Restart the dev server

4. **Windows-specific fixes**:
   ```powershell
   # Kill all processes
   taskkill /IM node.exe /F
   taskkill /IM truckore-pro.exe /F
   
   # Clean install
   npm install
   
   # Restart
   npm run tauri:dev
   ```

---

### Issue 2: Rust Compilation Errors

**Common Errors**:

#### Error: `linking with link.exe failed`
```
error: linking with `link.exe` failed
error: could not compile `windows-sys`
```

**Solution**: Install Visual Studio Build Tools (Windows) - see [Prerequisites](#prerequisites)

**Windows detailed steps:**
1. Download "Build Tools for Visual Studio 2022"
2. Install "Desktop development with C++"
3. Ensure MSVC v143 and Windows 10/11 SDK are selected
4. Restart computer
5. Verify: `cl.exe` should work in PowerShell

#### Error: `could not find Cargo.toml`
```
error: could not find `Cargo.toml`
```

**Solution**: You're in the wrong directory. Navigate to the project root where `src-tauri/` exists.

#### Error: Undeclared crate
```
error[E0433]: failed to resolve: use of undeclared crate
```

**Solution**: Missing Rust dependencies. Run:
```bash
cd src-tauri
cargo build
cd ..
```

#### Windows: Slow compilation or random failures

**Cause**: Windows Defender scanning each compiled file.

**Solution**:
1. Open Windows Security
2. Add exclusions for:
   - Project folder
   - `C:\Users\<YourName>\.cargo`
   - `C:\Users\<YourName>\.rustup`
3. Rebuild - should be 3-5x faster!

---

### Issue 3: Schema File Not Found

**Error**:
```
Failed to initialize database: schema file not found
```

**Solution**:

1. Verify `src/services/database/schema.sql` exists
2. Check the path in `src-tauri/src/main.rs`:
   ```rust
   let schema = include_str!("../../src/services/database/schema.sql");
   ```
3. Ensure the relative path is correct from `src-tauri/src/main.rs`

---

### Issue 4: Port Already in Use

**Error**:
```
Port 8080 is already in use
EADDRINUSE: address already in use
```

**Solution**:

**Option A**: Kill the process using port 8080

Windows:
```powershell
# Find process using port 8080
netstat -ano | findstr :8080
# Note the PID (last column, e.g., 12345)

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Or kill all Node.js processes
taskkill /IM node.exe /F
```

Mac/Linux:
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

**Option B**: Change the port in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 8081,  // Change this
    strictPort: true,
  },
  // ...
});
```

And update `src-tauri/tauri.conf.json`:
```json
{
  "build": {
    "devPath": "http://localhost:8081"  // Change this
  }
}
```

---

### Issue 5: "Failed to create account" During Setup

**Possible Causes**:

1. **Database not initialized**
   - Check console logs for database errors
   - Verify SQLite is working: `sqlite3 --version`
   - Windows: Check database folder exists at `%APPDATA%\truckore-pro\data`

2. **Permission issues**
   
   Windows:
   ```powershell
   # Run as Administrator (one time)
   # Right-click PowerShell → Run as Administrator
   npm run tauri:dev
   ```
   
   Mac/Linux:
   ```bash
   # Check permissions
   ls -la ~/Library/Application\ Support/com.truckore.pro/  # macOS
   ls -la ~/.local/share/truckore-pro/                      # Linux
   ```

3. **Password validation failed**
   - Password must meet requirements:
     - At least 8 characters
     - Contains uppercase letter
     - Contains lowercase letter
     - Contains number
     - Contains special character

4. **Database lock error (Windows)**
   ```powershell
   # Close all instances
   taskkill /IM truckore-pro.exe /F
   taskkill /IM node.exe /F
   
   # Restart
   npm run tauri:dev
   ```

---

### Issue 6: Application Won't Start

**Debug Steps**:

1. **Check Rust compilation**:
   ```bash
   cd src-tauri
   cargo build
   ```

2. **Check frontend build**:
   ```bash
   npm run build
   ```

3. **View detailed logs**:
   ```bash
   npm run tauri:dev -- --verbose
   ```

4. **Clear cache and rebuild**:
   
   Windows:
   ```powershell
   # Stop all processes
   taskkill /IM node.exe /F
   taskkill /IM truckore-pro.exe /F
   
   # Clear Rust build cache
   cd src-tauri
   cargo clean
   cd ..
   
   # Clear Node modules
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   
   # Clear Vite cache
   Remove-Item -Recurse -Force .vite
   
   # Reinstall and rebuild
   npm install
   npm run tauri:dev
   ```
   
   Mac/Linux:
   ```bash
   # Clear Rust build cache
   cd src-tauri
   cargo clean
   
   # Clear Node modules
   cd ..
   rm -rf node_modules package-lock.json
   
   # Reinstall
   npm install
   
   # Rebuild
   npm run tauri:dev
   ```

5. **Windows: Check for blocking issues**:
   - Windows Defender slowing compilation → Add exclusions
   - Antivirus quarantining `.exe` → Check quarantine, add exclusions
   - Long path names (260 char limit) → Enable long paths or use shorter project path

---

## Database Location

The SQLite database is stored in the user's application data directory:

### Windows
```
C:\Users\<YourUsername>\AppData\Roaming\truckore-pro\data\truckore_data.db
```

### macOS
```
~/Library/Application Support/com.truckore.pro/data/truckore_data.db
```

### Linux
```
~/.local/share/truckore-pro/data/truckore_data.db
```

### Accessing the Database

You can view/edit the database using SQLite tools:

```bash
# Install sqlite3 (if not already installed)
# Windows: Download from https://sqlite.org/download.html
# Mac: brew install sqlite3
# Linux: sudo apt install sqlite3

# Open the database
sqlite3 "C:\Users\<YourUsername>\AppData\Roaming\truckore-pro\data\truckore_data.db"
```

**Useful SQLite Commands**:
```sql
-- View all tables
.tables

-- View users
SELECT * FROM users;

-- View setup status
SELECT * FROM app_config WHERE key = 'setup_completed';

-- Exit
.quit
```

---

## Advanced Configuration

### Customizing the App

#### 1. Change App Name

Edit `src-tauri/tauri.conf.json`:
```json
{
  "package": {
    "productName": "Your Custom Name",
    "version": "1.0.0"
  }
}
```

#### 2. Change App Icon

Replace icons in `src-tauri/icons/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

Use https://tauri.app/v1/guides/features/icons/ to generate icons.

#### 3. Change Window Size

Edit `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "windows": [{
      "title": "Truckore Pro",
      "width": 1400,
      "height": 900,
      "minWidth": 1200,
      "minHeight": 700
    }]
  }
}
```

---

## Security Best Practices

1. **Never share the database file** - it contains hashed passwords but is still sensitive
2. **Backup regularly** - the database is stored locally
3. **Use strong passwords** - the Super Admin account has full access
4. **Keep the app updated** - apply security patches
5. **Restrict file system access** - follow principle of least privilege

---

## Getting Help

### Logs Location

Check logs for debugging:

**Windows**:
```
C:\Users\<YourUsername>\AppData\Roaming\truckore-pro\logs\
```

**macOS**:
```
~/Library/Logs/com.truckore.pro/
```

**Linux**:
```
~/.local/share/truckore-pro/logs/
```

### Common Resources

- **Tauri Documentation**: https://tauri.app/
- **Rust Documentation**: https://doc.rust-lang.org/
- **SQLite Documentation**: https://www.sqlite.org/docs.html
- **React Documentation**: https://react.dev/

---

## Summary Checklist

Before running the app for the first time:

- [ ] Node.js and npm installed
- [ ] Rust and Cargo installed
- [ ] Visual Studio Build Tools installed (Windows)
- [ ] Dependencies installed (`npm install`)
- [ ] Tauri CLI available (`npx tauri --version`)
- [ ] All required files exist (main.rs, schema.sql, etc.)
- [ ] Scripts added to package.json (if on local machine)

To run the app:

```bash
npm run tauri:dev
```

To build for production:

```bash
npm run tauri:build
```

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Truckore Pro** - Offline Weighbridge Management System
