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

### Issue 1: "npm run tauri:dev" says "Missing script: tauri:dev"

**Solution**: You forgot Step 3! Edit `package.json` and add the scripts.

---

### Issue 2: Rust Compilation Fails

**Error**:
```
error: linking with `link.exe` failed
```

**Solution**: Install Visual Studio Build Tools (Step 1.3 above)

---

### Issue 3: "Failed to compile Rust code"

**Try these**:

1. **Update Rust**:
   ```powershell
   rustup update
   ```

2. **Clear Rust cache**:
   ```powershell
   cd src-tauri
   cargo clean
   cd ..
   npm run tauri:dev
   ```

3. **Check Windows Defender**:
   - Sometimes it blocks Rust compilation
   - Add your project folder to exclusions

---

### Issue 4: Port 8080 Already in Use

**Solution**:

**Option A**: Kill the process using port 8080
```powershell
netstat -ano | findstr :8080
# Note the PID (last column)
taskkill /PID <PID> /F
```

**Option B**: Change the port in `vite.config.ts`:
```typescript
server: {
  port: 8081,  // Change this
  strictPort: true,
}
```

And `src-tauri/tauri.conf.json`:
```json
"devPath": "http://localhost:8081"
```

---

### Issue 5: "Non-query execution failed - this application requires Tauri desktop environment"

**This means the app is running in browser mode instead of desktop mode.**

**Verify**:
1. Are you running `npm run tauri:dev` (not `npm run dev`)?
2. Did Tauri window open, or are you using a web browser?
3. Check console logs (F12) for Tauri detection

**Fix**:
- Close everything
- Restart PowerShell
- Run `npm run tauri:dev` again

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
