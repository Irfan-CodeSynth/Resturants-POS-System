# Restaurant POS — Offline Desktop Application

A modern, offline-first Restaurant Point of Sale and Management System built with Electron, React, TypeScript, Tailwind CSS, and SQLite.

![Restaurant POS](resources/banner.png)

## Overview

**Restaurant POS** is engineered specifically for food & beverage businesses operating in offline environments. It bundles full POS order taking, a real-time Kitchen Display System (KDS), table management, recipe & ingredient inventory deduction, staff access control with manager approvals, billing, receipts, cash drawer management, and analytical reports into an installable Windows desktop application.

---

## Key Features

### 1. Point of Sale (POS)
- **Ultra-fast Order Entry**: Touch-friendly categories and product cards with immediate cart updates.
- **Order Types**: Seamlessly switch between **Dine-In**, **Takeaway**, and **Delivery** with customer and table bindings.
- **Modifiers & Add-ons**: Supports required/optional modifier groups, min/max selection thresholds, and price increments.
- **Discounts & Taxes**: Flexible percentage or fixed discounts and automated tax calculations.
- **Hold & Recall**: Park pending orders and recall them instantly without losing context.
- **Barcode Scanner Support**: Native support for USB barcode scanners simulating keyboard input.

### 2. Kitchen Display System (KDS)
- Real-time ticket management (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`).
- Elapsed preparation timers and priority visual highlights.
- Print ticket triggers on confirmation.

### 3. Table & Floor Management
- Interactive restaurant floor plan.
- Visual table indicators: Available (green), Occupied (blue), Reserved (yellow), Billing (purple), Cleaning (gray).
- Order linking, table transfer, and table merging capabilities.

### 4. Inventory, Recipes & Wastage
- **Automatic Recipe Deduction**: Ingredients and raw goods deduct from inventory in real-time upon order completion.
- **Low Stock Alerts**: Configurable stock thresholds and warnings.
- **Purchase Orders & Suppliers**: Manage suppliers, invoice logging, and automatic stock replenishment.
- **Wastage Tracking**: Record expired, burnt, or damaged stock with reason logs.

### 5. Cash Register & Financial Tracking
- Cash drawer shift sessions (Opening float, Expected cash, Actual count, Over/Short difference).
- Cash In / Cash Out petty cash tracking with recorded reasons.
- Split payments (Mixed Cash, Card, Bank Transfer).
- Full and partial refund handling with manager authorization.

### 6. Security, Roles & Approvals
- Role-Based Access Control (RBAC) with granular permissions.
- Fast PIN-based login and password authentication using **bcrypt**.
- Auto-lock after configurable inactivity.
- Manager Override dialog for sensitive actions (high discounts, refunds, cancellations).
- Immutable audit logs tracking all user and financial actions.

### 7. Analytical Reports & Exports
- 17 Comprehensive reports: Sales, Category Performance, Product Rankings, Cash Register, Taxes, COGS & Profit/Loss, Wastage, Employee Sales, etc.
- Export to **CSV**, **Excel (XLSX)**, and formatted **PDF**.

### 8. System, Printing & Backup
- **Hardware Integration**: Thermal receipt printer abstraction (58mm and 80mm ESC/POS compatible) and standard Windows printers.
- **Backup & Restore**: Automatic scheduled backups, backup-on-close, and manual one-click safety restore.
- **Zero Cloud Dependency**: 100% operational offline without internet.

---

## Technology Stack

- **Desktop Shell**: Electron 33 (Isolated contextBridge + preload IPC)
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui design tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Database**: Embedded SQLite (WASM / pure JavaScript engine)
- **Validation**: Zod & React Hook Form
- **Charts**: Recharts
- **Exporting**: jsPDF, jsPDF-AutoTable, XLSX

---

## Project Structure

```
Resturants POS System/
├── build/                     # App icons and installer assets
├── resources/                 # Runtime assets
├── scripts/                   # Test and migration scripts
│   ├── test-e2e.js            # End-to-end integration test
│   └── fix-templates.js       # Build utility
├── src/
│   ├── main/                  # Electron Main Process (Node.js)
│   │   ├── database/          # SQLite schema, queries, transactions
│   │   ├── ipc/               # IPC handlers for all domains
│   │   ├── services/          # Core business logic services
│   │   └── index.ts           # App lifecycle & window manager
│   ├── preload/               # Secure contextBridge API
│   │   ├── index.ts           # window.api exposure
│   │   └── index.d.ts         # TypeScript API definitions
│   ├── shared/                # Shared types & permissions
│   │   ├── ipc-channels.ts    # IPC channel constants
│   │   ├── permissions.ts     # RBAC permissions
│   │   └── types.ts           # Entity models & contracts
│   └── renderer/              # React Frontend (Vite)
│       ├── src/
│       │   ├── components/    # shadcn/ui & common components
│       │   ├── pages/         # 20+ functional screens
│       │   ├── stores/        # Zustand state stores
│       │   ├── lib/           # Formatters & utilities
│       │   └── App.tsx        # Routing & guards
│       └── index.html
├── electron-builder.yml       # Windows installer configuration
├── package.json
└── tsconfig.json
```

---

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v22 LTS recommended)
- npm (v9+)

### Installation
```bash
# Clone the repository and navigate to root
cd "Resturants POS System"

# Install dependencies
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Run Integration Tests
```bash
node scripts/test-e2e.js
```

---

## Packaging the Windows Application

### 1. Compile & Build Assets
```bash
npm run build
```

### 2. Package Portable Directory (Unpacked)
```bash
npx electron-builder --win --dir
```
The unpacked executable will be generated at:
`installer/win-unpacked/RestaurantPOS.exe`

### 3. Generate the Windows NSIS Installer (.exe)
```bash
npm run make
```
The setup wizard installer will be generated at:
`installer/RestaurantPOS-Setup-1.0.0.exe`

---

## First-Run Setup Guide

1. Launch **Restaurant POS**.
2. If launching for the first time, the **Setup Wizard** will automatically initialize:
   - **Restaurant Profile**: Set restaurant name, contact phone, physical address, and preferred currency (e.g. `Rs.`, `$`, `€`).
   - **Financials**: Set default sales tax rate and service charge percentage.
   - **Admin Credentials**: Create your master administrator account and secure PIN.
   - **Printer Defaults**: Select default receipt and kitchen printer dimensions (80mm / 58mm).
3. Click **Finish Setup**. You are ready to take orders!

---

## License
MIT License. Commercial POS Distribution Ready.
