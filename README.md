# Truckore Pro - Desktop Weighbridge Management System

**Pure Desktop Application** - Built with Tauri + React + SQLite

This is a desktop-only application. All data is stored locally in SQLite database.
No internet connection or backend server required.

## Project Info

**URL**: https://lovable.dev/projects/45b2d75f-daf3-4d14-b514-85db289df096

## Building the Desktop App

```bash
# Install dependencies
npm install

# Build desktop application
npm run tauri:build
```

Find the installer in `src-tauri/target/release/bundle/`

## Development

```bash
# Start development server for UI development
npm run dev

# Start Tauri development mode (with database)
npm run tauri:dev
```

## Technologies

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Desktop Runtime**: Tauri
- **Database**: SQLite (via Tauri)
- **State Management**: React Context + TanStack Query

## Features

- ✅ **Pure Offline Operation** - No internet required
- ✅ **SQLite Database** - All data stored locally
- ✅ **Multi-Platform** - Windows, macOS, Linux
- ✅ **Weighbridge Integration** - Serial/Network connectivity
- ✅ **CCTV Camera Support** - Capture weighment images
- ✅ **Bill Management** - Complete weighment workflow
- ✅ **Master Data** - Vehicles, Parties, Products
- ✅ **Reports & Analytics** - Export to Excel/PDF

## Documentation

See the following guides for more information:
- `DESKTOP_APP_SETUP_GUIDE.md` - Desktop app setup and configuration
- `DATABASE_DOCUMENTATION.md` - Database schema and operations
- `FRONTEND_DOCUMENTATION.md` - UI components and architecture

## Deployment

This is a desktop application that must be compiled and distributed as an installer.

1. Build the application: `npm run tauri:build`
2. Distribute the installer from `src-tauri/target/release/bundle/`
3. Users install and run locally on their machines

## License

Proprietary - All Rights Reserved
