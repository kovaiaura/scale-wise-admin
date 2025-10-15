# Windows Troubleshooting Guide for Truckore Pro Desktop App

## 🎯 Complete Windows-Specific Setup & Troubleshooting Reference

This guide covers all common issues you might encounter when setting up and running Truckore Pro on Windows.

---

## Table of Contents

1. [Pre-Setup Checklist](#pre-setup-checklist)
2. [Quick Diagnostics](#quick-diagnostics)
3. [Installation Issues](#installation-issues)
4. [Compilation Errors](#compilation-errors)
5. [Runtime Errors](#runtime-errors)
6. [Database Issues](#database-issues)
7. [Performance Issues](#performance-issues)
8. [Common Error Messages Dictionary](#common-error-messages-dictionary)
9. [Emergency Recovery](#emergency-recovery)

---

## Pre-Setup Checklist

Before starting, verify you have:

- ☐ Windows 10 version 1903+ or Windows 11
- ☐ Administrator access on your machine
- ☐ At least 5GB free disk space
- ☐ Stable internet connection (for downloads)
- ☐ Antivirus/Firewall not blocking installations
- ☐ No VPN interfering with localhost connections
- ☐ Project path is short (e.g., `C:\Projects\truckore-pro` not `C:\Users\...\Documents\My Projects\...`)

---

## Quick Diagnostics

Run these commands in PowerShell to verify your setup:

```powershell
# Check Node.js (required: v18+)
node --version
npm --version

# Check Rust (required: 1.70+)
rustc --version
cargo --version

# Check Visual Studio Build Tools
cl.exe
# Should show: "Microsoft (R) C/C++ Optimizing Compiler"
# If error "not recognized", Build Tools not properly installed

# Check WebView2 Runtime
Get-AppxPackage -Name "Microsoft.WebView2Runtime" | Select-Object Name, Version

# Check if port 8080 is free
netstat -ano | findstr :8080
# Should be empty if port is free

# Verify Tauri CLI
npx tauri --version
```

---

## Installation Issues

### 🔴 Issue 1: Visual Studio Build Tools Not Found

**Symptoms:**
```
error: linking with `link.exe` failed
error: could not compile `windows-sys`
error: linker `link.exe` not found
```

**Cause:** Missing or incomplete Visual Studio Build Tools installation.

**Solution:**

#### Step-by-Step Installation:

1. **Download Installer**
   - Visit: https://visualstudio.microsoft.com/downloads/
   - Scroll to "Tools for Visual Studio"
   - Download "Build Tools for Visual Studio 2022"

2. **Run Installer**
   - Double-click the downloaded installer
   - Click "Continue" when prompted

3. **Select Workload**
   - In the "Workloads" tab, check:
     - ☑️ **Desktop development with C++**
   
4. **Verify Components** (should be auto-selected)
   - Switch to "Individual components" tab
   - Verify these are checked:
     - ☑️ MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)
     - ☑️ Windows 10 SDK (10.0.19041.0 or later)
     - ☑️ C++ CMake tools for Windows

5. **Install**
   - Click "Install" button
   - Download size: ~8GB
   - Installation time: 15-30 minutes
   - **Do not close installer until complete**

6. **Restart Computer**
   - Required for PATH updates to take effect

7. **Verify Installation**
   ```powershell
   # Open NEW PowerShell window
   where.exe cl
   # Should show: C:\Program Files\...\cl.exe
   
   # Test compilation
   cl.exe
   # Should show version info, not "not recognized"
   ```

**Still Not Working?**
- Make sure you installed "Build Tools", not just "Visual Studio Code"
- Check Windows PATH includes: `C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\...`
- Try repairing the installation via Visual Studio Installer

---

### 🔴 Issue 2: Rust Not Recognized After Installation

**Symptoms:**
```
'cargo' is not recognized as an internal or external command
'rustc' is not recognized as an internal or external command
```

**Cause:** Rust not added to system PATH, or PowerShell needs restart.

**Solution:**

1. **Close ALL PowerShell/Command Prompt windows**
   - Important: Old windows don't have updated PATH

2. **Open NEW PowerShell window**
   ```powershell
   cargo --version
   rustc --version
   ```

3. **If still not recognized:**
   - Press `Win + R`
   - Type: `sysdm.cpl` and press Enter
   - Click "Advanced" tab → "Environment Variables"
   - Under "User variables", find `Path`
   - Verify it includes: `C:\Users\<YourName>\.cargo\bin`
   - If missing, click "Edit" → "New" → Add the path
   - Click OK on all dialogs

4. **Restart Computer**
   - Required for system-wide PATH updates

5. **Reinstall Rust** (if still fails):
   ```powershell
   # Download rustup-init.exe again from https://rustup.rs/
   # Run installer
   # Choose option 1 (default installation)
   # Restart computer
   ```

---

### 🔴 Issue 3: WebView2 Runtime Missing

**Symptoms:**
```
Error: WebView2 Runtime not found
App fails to start with "WebView2 is not installed"
```

**Cause:** Older Windows 10 versions don't include WebView2.

**Solution:**

1. **Check if WebView2 is installed:**
   ```powershell
   Get-AppxPackage -Name "Microsoft.WebView2Runtime"
   ```

2. **If not installed:**
   - Visit: https://developer.microsoft.com/microsoft-edge/webview2/
   - Click "Download the WebView2 Runtime"
   - Choose "Evergreen Standalone Installer"
   - Download and run the installer
   - Restart computer

3. **Verify Installation:**
   ```powershell
   Get-AppxPackage -Name "Microsoft.WebView2Runtime" | Select-Object Name, Version
   # Should show version number
   ```

---

### 🟡 Issue 4: npm/Node Version Conflicts

**Symptoms:**
```
Error: The engine "node" is incompatible with this module
npm ERR! peer dependency issues
```

**Cause:** Incorrect Node.js version installed.

**Solution:**

1. **Check current version:**
   ```powershell
   node --version
   # Required: v18.x.x or v20.x.x (LTS versions)
   ```

2. **If wrong version:**
   - Go to Control Panel → Uninstall Programs
   - Uninstall "Node.js"
   - Download LTS version from: https://nodejs.org/
   - Install and restart computer

3. **Verify installation:**
   ```powershell
   node --version
   npm --version
   ```

---

## Compilation Errors

### 🔴 Issue 5: Windows Defender Blocking Rust Compilation

**Symptoms:**
- Compilation extremely slow (10+ minutes)
- Random compilation failures
- "Access denied" errors during build

**Cause:** Windows Defender scans each compiled file, causing massive slowdown.

**Solution:**

1. **Open Windows Security**
   - Press `Win + I` → Update & Security → Windows Security
   - Click "Virus & threat protection"

2. **Add Exclusions**
   - Click "Manage settings"
   - Scroll to "Exclusions"
   - Click "Add or remove exclusions"
   - Click "Add an exclusion" → "Folder"

3. **Add these folders:**
   - Your project folder: `C:\Users\<YourName>\Desktop\truckore-pro`
   - Cargo home: `C:\Users\<YourName>\.cargo`
   - Rustup home: `C:\Users\<YourName>\.rustup`

4. **Rebuild:**
   ```powershell
   cd src-tauri
   cargo clean
   cd ..
   npm run tauri:dev
   ```

**Result:** Compilation should now be 3-5x faster!

---

### 🔴 Issue 6: Long Path Names (260 Character Limit)

**Symptoms:**
```
error: failed to copy file to long path
IO error: The system cannot find the path specified
error: couldn't create a file (name too long)
```

**Cause:** Windows has a 260 character path limit by default.

**Solution:**

**Option A: Enable Long Paths (Recommended)**

1. **Open Registry Editor:**
   - Press `Win + R`
   - Type: `regedit`
   - Click Yes for Admin prompt

2. **Navigate to:**
   ```
   HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem
   ```

3. **Modify Setting:**
   - Find: `LongPathsEnabled`
   - Double-click it
   - Change value to: `1`
   - Click OK

4. **Restart Computer**

**Option B: Use Shorter Path (Quick Fix)**

Move your project to a shorter path:
```powershell
# Instead of:
C:\Users\YourLongUserName\Documents\Projects\Development\truckore-pro

# Use:
C:\Projects\truckore-pro
```

---

### 🟡 Issue 7: Slow First Compilation (10+ Minutes)

**Symptoms:**
- First `npm run tauri:dev` takes 10-15 minutes
- Stuck on "Compiling..." messages

**Cause:** Rust compiling all dependencies from scratch. **This is NORMAL.**

**Solution:**

**This is expected behavior!** First compilation includes:
- 200+ Rust dependencies (crates)
- Windows system bindings
- SQLite engine
- Tauri framework

**Speed up future builds:**

1. **Add Windows Defender exclusions** (see Issue 5)

2. **Use SSD instead of HDD** (if possible)

3. **Close other heavy applications**
   ```powershell
   # Check CPU/Memory usage
   taskmgr
   ```

4. **Wait patiently** - subsequent builds will be under 1 minute!

**Progress indicators to watch:**
```
Compiling windows-sys v0.x.x
Compiling rusqlite v0.x.x
Compiling tauri v1.x.x
```

---

### 🔴 Issue 8: Cargo Build Fails with "Out of Memory"

**Symptoms:**
```
error: could not compile `windows`
fatal error: out of memory allocating XXXXX bytes
```

**Cause:** Insufficient RAM or too many parallel build jobs.

**Solution:**

1. **Reduce parallel jobs:**
   ```powershell
   # Set in PowerShell before building
   $env:CARGO_BUILD_JOBS = "2"
   npm run tauri:dev
   ```

2. **Close other applications**
   - Close browsers, IDEs, heavy apps
   - Free up at least 4GB RAM

3. **Increase virtual memory:**
   - System Properties → Advanced → Performance Settings
   - Advanced tab → Virtual Memory → Change
   - Increase page file size to 8GB+

---

## Runtime Errors

### 🔴 Issue 9: "Non-query execution failed - requires Tauri desktop environment"

**Symptoms:**
- Error during first-time setup when creating Super Admin
- Cannot create database records

**Cause:** App is running in browser mode instead of desktop mode.

**Solution:**

1. **Verify you're using correct command:**
   ```powershell
   npm run tauri:dev   # ✅ Correct (Desktop mode)
   npm run dev         # ❌ Wrong (Browser mode)
   ```

2. **Check if Tauri window opened:**
   - Should be a native window (with window frame)
   - NOT a web browser tab

3. **Verify Tauri detection:**
   - In Tauri window, press **F12** (Developer Tools)
   - Go to Console tab
   - Look for:
     ```
     [DB Init] Tauri available: true    ✅ Good
     [DB Init] Using Tauri SQLite backend
     ```
   
   - If you see:
     ```
     [DB Init] Tauri available: false   ❌ Problem
     ```

4. **Fix steps:**
   ```powershell
   # Close everything
   taskkill /IM node.exe /F
   taskkill /IM truckore-pro.exe /F
   
   # Ensure dependencies are installed
   npm install
   
   # Restart in desktop mode
   npm run tauri:dev
   ```

---

### 🟡 Issue 10: Tauri Window Opens Blank/White Screen

**Symptoms:**
- Tauri window opens but shows blank white screen
- No UI visible

**Cause:** Frontend failed to load or Vite dev server not running.

**Solution:**

1. **Check PowerShell output:**
   - Look for: `VITE v5.x.x ready in XXms`
   - Should show: `➜  Local:   http://localhost:8080/`

2. **Open Developer Tools in Tauri window:**
   - Press **F12**
   - Check Console for errors

3. **Common fixes:**

   **A. Port mismatch:**
   - Check `src-tauri/tauri.conf.json`:
     ```json
     {
       "build": {
         "devPath": "http://localhost:8080"
       }
     }
     ```
   - Must match Vite's port in `vite.config.ts`

   **B. CSP (Content Security Policy) blocking:**
   - Check console for CSP errors
   - Usually fixed by restarting dev server

   **C. Clear cache:**
   ```powershell
   # Delete Tauri cache
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\truckore-pro"
   
   # Restart
   npm run tauri:dev
   ```

---

### 🟡 Issue 11: Port 8080 Already in Use

**Symptoms:**
```
Error: Port 8080 is already in use
EADDRINUSE: address already in use :::8080
```

**Cause:** Another application is using port 8080.

**Solution:**

**Option A: Kill the process using port 8080**

```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Example output:
# TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    12345
# The last number (12345) is the PID

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Alternative: Kill all Node.js processes
taskkill /IM node.exe /F
```

**Option B: Change the port**

1. Edit `vite.config.ts`:
   ```typescript
   export default defineConfig({
     server: {
       port: 8081,  // Change to any free port
       strictPort: true,
     },
   });
   ```

2. Edit `src-tauri/tauri.conf.json`:
   ```json
   {
     "build": {
       "devPath": "http://localhost:8081"
     }
   }
   ```

3. Restart:
   ```powershell
   npm run tauri:dev
   ```

---

### 🟡 Issue 12: Hot Reload Not Working

**Symptoms:**
- Make changes to React code
- Changes don't appear in Tauri window
- Need to restart app to see changes

**Cause:** Vite HMR (Hot Module Replacement) not working properly.

**Solution:**

1. **Verify Vite config:**
   - Check `vite.config.ts`:
     ```typescript
     server: {
       host: "::",
       port: 8080,
       strictPort: true,
     }
     ```

2. **Manual refresh:**
   - In Tauri window, press **Ctrl + R** to refresh

3. **Restart dev server:**
   ```powershell
   # Stop (Ctrl+C in PowerShell)
   # Then start again
   npm run tauri:dev
   ```

4. **Clear Vite cache:**
   ```powershell
   Remove-Item -Recurse -Force .vite
   npm run tauri:dev
   ```

---

## Database Issues

### 🔴 Issue 13: Database Lock Error

**Symptoms:**
```
Error: database is locked
SqliteFailure: database is locked (code 5)
```

**Cause:** Another instance of the app or SQLite tool has the database open.

**Solution:**

1. **Close all app instances:**
   ```powershell
   # Kill all Truckore Pro processes
   taskkill /IM truckore-pro.exe /F
   
   # Kill Node.js (if running dev server)
   taskkill /IM node.exe /F
   ```

2. **Check for SQLite tools:**
   - Close DB Browser for SQLite
   - Close any database viewers
   - Close any file explorers with database open

3. **Check Task Manager:**
   - Press `Ctrl + Shift + Esc`
   - Look for `truckore-pro.exe` in Processes
   - End all instances

4. **Restart:**
   ```powershell
   npm run tauri:dev
   ```

---

### 🔴 Issue 14: Permission Denied - Cannot Create Database

**Symptoms:**
```
Error: Permission denied (os error 5)
Failed to create database file
```

**Cause:** Insufficient permissions in AppData folder.

**Solution:**

1. **Run as Administrator (one time):**
   - Right-click PowerShell
   - Choose "Run as Administrator"
   - Navigate to project folder
   - Run: `npm run tauri:dev`

2. **Check folder permissions:**
   - Navigate to: `C:\Users\<YourName>\AppData\Roaming`
   - Right-click → Properties → Security
   - Ensure your user account has "Full control"

3. **Create folder manually:**
   ```powershell
   # Create app data folder
   mkdir "$env:APPDATA\truckore-pro\data" -Force
   
   # Verify
   dir "$env:APPDATA\truckore-pro\data"
   
   # Restart app
   npm run tauri:dev
   ```

---

### 🟢 Issue 15: Where is My Database?

**Not an issue - just information!**

**Database location:**
```
C:\Users\<YourUsername>\AppData\Roaming\truckore-pro\data\truckore_data.db
```

**Quick access:**

```powershell
# Open database folder in Explorer
explorer "$env:APPDATA\truckore-pro\data"

# Check if database exists
dir "$env:APPDATA\truckore-pro\data\truckore_data.db"

# View database (if SQLite installed)
sqlite3 "$env:APPDATA\truckore-pro\data\truckore_data.db"
```

**SQLite commands:**
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

## Performance Issues

### 🟡 Issue 16: Antivirus Blocking/Slowing Down App

**Symptoms:**
- App very slow to start
- Random freezes
- Compiled `.exe` disappears after build

**Cause:** Antivirus scanning or quarantining Tauri binaries.

**Solution:**

1. **Check antivirus quarantine:**
   - Open your antivirus software
   - Check quarantined items
   - Restore any `truckore-pro.exe` files

2. **Add exclusions:**
   - Add to antivirus exclusions:
     - Project folder: `C:\Projects\truckore-pro`
     - Build output: `C:\Projects\truckore-pro\src-tauri\target`
     - Executable: `truckore-pro.exe`

3. **Temporary test:**
   ```powershell
   # Temporarily disable antivirus
   # Rebuild app
   npm run tauri:build
   
   # If successful, issue is confirmed
   # Re-enable antivirus and add exclusions
   ```

---

### 🟡 Issue 17: High Memory Usage During Development

**Symptoms:**
- System becomes slow during `npm run tauri:dev`
- High RAM usage (8GB+)

**Cause:** Vite dev server + Rust compilation + multiple instances.

**Solution:**

1. **Normal memory usage:**
   - First build: 4-6GB (normal)
   - Subsequent runs: 2-3GB (normal)

2. **Reduce memory usage:**
   ```powershell
   # Limit Cargo parallel jobs
   $env:CARGO_BUILD_JOBS = "2"
   npm run tauri:dev
   ```

3. **Close other applications:**
   - Close browsers (especially Chrome with many tabs)
   - Close IDEs not in use
   - Close Discord, Slack, etc.

4. **Use production build for testing:**
   ```powershell
   # Production uses less memory
   npm run tauri:build
   
   # Run the built executable
   .\src-tauri\target\release\truckore-pro.exe
   ```

---

## Common Error Messages Dictionary

Quick reference for error messages you might encounter:

| Error Message | Severity | Meaning | Quick Fix |
|--------------|----------|---------|-----------|
| `link.exe failed` | 🔴 Critical | Missing Visual Studio Build Tools | Install Build Tools |
| `Permission denied (os error 5)` | 🔴 Critical | Insufficient permissions | Run as Administrator |
| `Port 8080 is already in use` | 🟡 Warning | Another app using port | Kill process or change port |
| `Tauri not available` | 🔴 Critical | Running in browser mode | Use `npm run tauri:dev` |
| `database is locked` | 🟡 Warning | App already running | Close all instances |
| `WebView2 not found` | 🔴 Critical | Missing WebView2 runtime | Install WebView2 |
| `cargo: not found` | 🔴 Critical | Rust not in PATH | Restart terminal or add to PATH |
| `schema file not found` | 🔴 Critical | Missing database schema | Verify file exists |
| `node: not found` | 🔴 Critical | Node.js not installed | Install Node.js |
| `out of memory` | 🔴 Critical | Insufficient RAM | Close apps, reduce parallel jobs |
| `name too long` | 🟡 Warning | Path exceeds 260 chars | Enable long paths or use shorter path |
| `Invalid Win32 application` | 🟡 Warning | Architecture mismatch | Build for correct target (x64/x86) |
| `EADDRINUSE` | 🟡 Warning | Port conflict | Change port or kill process |
| `Module not found` | 🟡 Warning | Missing dependencies | Run `npm install` |

---

## Emergency Recovery

If nothing works, follow these nuclear option steps:

### Complete Clean Reinstall

```powershell
# ====== STEP 1: Backup Data ======
# Backup your database (if you have data)
Copy-Item "$env:APPDATA\truckore-pro\data" "$env:USERPROFILE\Desktop\truckore-backup" -Recurse

# ====== STEP 2: Uninstall Rust ======
rustup self uninstall
# Confirm with 'y'

# ====== STEP 3: Delete Rust Directories ======
Remove-Item -Recurse -Force "$env:USERPROFILE\.cargo"
Remove-Item -Recurse -Force "$env:USERPROFILE\.rustup"

# ====== STEP 4: Clean Project ======
cd C:\Projects\truckore-pro  # Your project path

# Delete node modules
Remove-Item -Recurse -Force node_modules

# Delete Rust build cache
Remove-Item -Recurse -Force src-tauri\target

# Delete lock files
Remove-Item -Force package-lock.json

# Delete Vite cache
Remove-Item -Recurse -Force .vite

# ====== STEP 5: Reinstall Rust ======
# Download rustup-init.exe from https://rustup.rs/
# Run installer, choose option 1 (default)
# Restart PowerShell after installation

# ====== STEP 6: Verify Installations ======
node --version
npm --version
rustc --version
cargo --version
cl.exe  # Should show MSVC compiler

# ====== STEP 7: Fresh Install ======
npm install

# ====== STEP 8: Run Application ======
npm run tauri:dev

# ====== STEP 9: Restore Data (if needed) ======
# After first-time setup completes:
# Copy-Item "$env:USERPROFILE\Desktop\truckore-backup\*" "$env:APPDATA\truckore-pro\data" -Force
```

---

## Still Having Issues?

### Gathering Diagnostic Information

If you need help, collect this information:

```powershell
# System Information
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Software Versions
node --version
npm --version
rustc --version
cargo --version

# Check Visual Studio
where.exe cl

# Check project structure
dir src-tauri
dir src\services\database

# Check running processes
netstat -ano | findstr :8080

# Check Tauri CLI
npx tauri --version

# Save to file
systeminfo > diagnostic.txt
node --version >> diagnostic.txt
npm --version >> diagnostic.txt
rustc --version >> diagnostic.txt
cargo --version >> diagnostic.txt
```

### Resources

- **Tauri Documentation**: https://tauri.app/
- **Rust Installation Guide**: https://rustup.rs/
- **Visual Studio Build Tools**: https://visualstudio.microsoft.com/downloads/
- **Node.js Downloads**: https://nodejs.org/
- **SQLite Tools**: https://sqlite.org/download.html

---

## Success Checklist

After resolving issues, verify everything works:

- ☐ `npm run tauri:dev` starts without errors
- ☐ Tauri window opens (not browser)
- ☐ First-time setup wizard appears
- ☐ Can create Super Admin account
- ☐ Console shows: `[DB Init] Tauri available: true`
- ☐ Database file exists at: `%APPDATA%\truckore-pro\data\truckore_data.db`
- ☐ Can login with Super Admin credentials
- ☐ Dashboard loads successfully
- ☐ Hot reload works for React changes

---

**Good luck! 🚀**

*If you've followed all steps and still have issues, consider posting on Tauri's Discord: https://discord.com/invite/tauri*
