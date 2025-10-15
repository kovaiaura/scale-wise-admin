# Truckore Pro - Quick Start Guide

## 🚀 Setting Up on Your Local Machine

Since you're working with Lovable.dev, follow these steps to set up the desktop app on your local Windows machine.

---

## Step 1: Install Prerequisites (One-Time Setup)

### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS version)
- Run installer and follow prompts
- Verify: Open PowerShell and run:
  ```powershell
  node --version
  npm --version
  ```

### 2. Install Rust
- Download from: https://rustup.rs/
- Run `rustup-init.exe`
- Follow the prompts (choose default options)
- Restart PowerShell after installation
- Verify:
  ```powershell
  rustc --version
  cargo --version
  ```

### 3. Install Visual Studio Build Tools
- Download: https://visualstudio.microsoft.com/downloads/
- Choose "Build Tools for Visual Studio 2022"
- During installation, select:
  - ✅ Desktop development with C++
  - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
  - ✅ Windows 10/11 SDK

**This is the most important step for Windows!**

---

## Step 2: Download Your Project

1. Download the project from Lovable.dev
2. Extract to a folder, e.g., `C:\Users\YourName\Desktop\truckore-pro`
3. Open PowerShell in that folder:
   ```powershell
   cd C:\Users\YourName\Desktop\truckore-pro
   ```

---

## Step 3: Fix package.json (IMPORTANT!)

Open `package.json` and modify the `"scripts"` section to include these lines:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:desktop": "vite build --mode desktop",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Why?** Lovable.dev's `package.json` is read-only, so you need to add these scripts manually on your local machine.

---

## Step 4: Install Dependencies

```powershell
npm install
```

This will install all required packages including `@tauri-apps/cli`.

---

## Step 5: Run the Desktop App

```powershell
npm run tauri:dev
```

### What Happens Next:

1. **First Time**: Rust will compile (takes 2-5 minutes)
   - You'll see a lot of "Compiling..." messages
   - This is normal! Be patient.

2. **Vite Dev Server**: Starts on http://localhost:8080
   - Console shows: "VITE v5.x.x ready in XXXms"

3. **Tauri Window Opens**: Your desktop app launches!
   - If it doesn't open automatically, check for errors in PowerShell

4. **First-Time Setup Wizard**:
   - Create your Super Admin account
   - Set a strong password
   - Click "Create Account"

5. **Login**: Use your newly created credentials

---

## Step 6: Verify It's Working

After the app opens, press **F12** to open Developer Tools and check the console:

### ✅ Correct (Desktop Mode):
```
[DB Init] Tauri available: true
[DB Init] Initializing Tauri SQLite database...
✅ Database initialized (Desktop Mode - SQLite)
```

### ❌ Wrong (Browser Mode):
```
[DB Init] Tauri available: false
✅ Database initialized (Browser Mode - localStorage)
```

If you see "Browser Mode", something went wrong. See troubleshooting below.

---

## Common Issues and Solutions

### 🔴 Issue 1: "npm run tauri:dev" says "Missing script: tauri:dev"

**Solution**: You forgot Step 3! Edit `package.json` and add the scripts.

---

### 🔴 Issue 2: Rust Compilation Fails

**Error**:
```
error: linking with `link.exe` failed
error: could not compile `windows-sys`
```

**Solution**: Install Visual Studio Build Tools (Step 1.3 above)

**Detailed steps:**
1. Download "Build Tools for Visual Studio 2022"
2. Install "Desktop development with C++"
3. Restart computer
4. Verify: `cl.exe` in PowerShell should show compiler info

---

### 🔴 Issue 3: Rust/Cargo Not Recognized

**Error**:
```
'cargo' is not recognized as an internal or external command
```

**Solution**:
1. Close ALL PowerShell windows
2. Open NEW PowerShell window
3. If still fails: Restart computer
4. Still fails? Check PATH includes: `C:\Users\<YourName>\.cargo\bin`

---

### 🟡 Issue 4: Windows Defender Slowing Compilation

**Symptom**: First build takes 10+ minutes or randomly fails

**Solution**:
1. Open Windows Security
2. Virus & threat protection → Manage settings
3. Add exclusions for:
   - Your project folder
   - `C:\Users\<YourName>\.cargo`
   - `C:\Users\<YourName>\.rustup`
4. Rebuild - should be 3-5x faster!

---

### 🟡 Issue 5: Port 8080 Already in Use

**Error**:
```
Error: Port 8080 is already in use
```

**Solution**:

**Option A**: Kill the process
```powershell
# Find process using port 8080
netstat -ano | findstr :8080
# Note the PID (last column, e.g., 12345)

# Kill it (replace 12345 with your PID)
taskkill /PID 12345 /F

# Or kill all Node processes
taskkill /IM node.exe /F
```

**Option B**: Change the port
1. Edit `vite.config.ts` → change port to `8081`
2. Edit `src-tauri/tauri.conf.json` → change `devPath` to `http://localhost:8081`

---

### 🔴 Issue 6: "Non-query execution failed - requires Tauri desktop environment"

**This means the app is running in browser mode instead of desktop mode!**

**Verify**:
1. ✅ Are you running `npm run tauri:dev` (NOT `npm run dev`)?
2. ✅ Did a Tauri **window** open (not a browser tab)?
3. ✅ Press F12 in Tauri window and check console:
   ```
   [DB Init] Tauri available: true    ✅ Good!
   [DB Init] Tauri available: false   ❌ Problem!
   ```

**Fix**:
```powershell
# Close everything
taskkill /IM node.exe /F

# Ensure dependencies installed
npm install

# Start in desktop mode
npm run tauri:dev
```

---

### 🔴 Issue 7: WebView2 Runtime Missing

**Error**: "WebView2 is not installed"

**Solution**:
1. Visit: https://developer.microsoft.com/microsoft-edge/webview2/
2. Download "Evergreen Standalone Installer"
3. Install and restart computer

---

### 🟡 Issue 8: Database Lock Error

**Error**:
```
Error: database is locked
```

**Solution**:
```powershell
# Kill all app instances
taskkill /IM truckore-pro.exe /F
taskkill /IM node.exe /F

# Restart
npm run tauri:dev
```

---

### 🟢 Issue 9: First Compilation Very Slow (10+ Minutes)

**This is NORMAL!** First build compiles 200+ Rust dependencies.

Subsequent builds will be under 1 minute.

**Speed up:**
- Add Windows Defender exclusions (see Issue 4)
- Close other heavy applications
- Be patient! ☕

---

### 📚 Need More Help?

See comprehensive troubleshooting: **`WINDOWS_TROUBLESHOOTING.md`**

Covers 17+ issues including:
- Visual Studio Build Tools detailed setup
- Long path names (260 char limit)
- Permission errors
- Antivirus conflicts
- Memory issues
- Emergency recovery steps

---

## Building for Production

When you're ready to create an installer:

```powershell
npm run tauri:build
```

The installer will be created at:
```
src-tauri\target\release\bundle\msi\Truckore Pro_1.0.0_x64_en-US.msi
```

You can distribute this `.msi` file to other users!

---

## Where is My Database?

After you create the Super Admin account, the database is stored at:

```
C:\Users\YourUsername\AppData\Roaming\truckore-pro\data\truckore_data.db
```

You can open it with SQLite tools if needed.

---

## Next Steps

1. ✅ Complete the first-time setup
2. ✅ Login with Super Admin credentials
3. ✅ Configure weighbridge settings
4. ✅ Add master data (vehicles, parties, products)
5. ✅ Start using the operator console

---

## Need More Help?

See the full documentation: `DESKTOP_APP_SETUP_GUIDE.md`

Or check Tauri docs: https://tauri.app/

---

## Summary Commands

```powershell
# Install dependencies (first time only)
npm install

# Run desktop app in development
npm run tauri:dev

# Build production installer
npm run tauri:build

# Update Rust (if issues)
rustup update

# Clear cache and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

---

**Important**: Make sure you're running `npm run tauri:dev` (not `npm run dev`) to get desktop mode!

**Good luck! 🚀**
