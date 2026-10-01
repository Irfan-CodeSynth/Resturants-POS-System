# Restaurant POS — Operations & User Manual

Welcome to the **Restaurant POS System**. This guide provides restaurant owners, managers, cashiers, and kitchen staff with step-by-step instructions for day-to-day operations.

---

## Table of Contents
1. [Initial Login & Shifts](#1-initial-login--shifts)
2. [Point of Sale (POS) Order Taking](#2-point-of-sale-pos-order-taking)
3. [Tables & Floor Management](#3-tables--floor-management)
4. [Kitchen Display System (KDS)](#4-kitchen-display-system-kds)
5. [Billing, Payments & Refunds](#5-billing-payments--refunds)
6. [Inventory & Recipe Management](#6-inventory--recipe-management)
7. [End-of-Day Cash Drawer Closing](#7-end-of-day-cash-drawer-closing)
8. [Reports & Analytics](#8-reports--analytics)
9. [Database Backup & Safety](#9-database-backup--safety)

---

## 1. Initial Login & Shifts

### Logging In
1. Launch the application from your desktop shortcut.
2. Enter your **Username** and **Password**, or switch to **PIN Mode** for quick numeric entry.
3. If auto-lock is triggered, enter your numeric PIN to return immediately to your active screen.

### Starting a Cash Register Shift
1. Navigate to **Cash Register** from the left navigation bar.
2. If closed, click **Open Register**.
3. Enter your **Opening Float** (the cash amount already in the drawer).
4. Click **Start Shift**.

---

## 2. Point of Sale (POS) Order Taking

### Order Types
Select the appropriate order mode at the top or cart panel:
- **Dine-In**: Prompts for a table selection.
- **Takeaway**: Fast counter checkout.
- **Delivery**: Prompts for Customer Name, Phone, and Delivery Address.

### Adding Items to Cart
1. Tap a **Category** on the left to filter the menu (e.g., *Burgers*, *Pizzas*, *Drinks*).
2. Tap any **Product Card**.
3. If the item has **Modifiers** (e.g., *Size*, *Extra Cheese*, *Spice Level*), a popup will appear:
   - Select required and optional modifiers.
   - Click **Add to Order**.
4. Adjust item quantities in the right cart panel using the `+` and `-` buttons.
5. Click the trash icon to remove an item.

### Holding and Recalling Orders
- **Hold Order**: Tap **Hold Order** if a customer steps away.
- **Recall Order**: Tap **Held Orders** at the top right to retrieve any saved ticket.

---

## 3. Tables & Floor Management

1. Click **Tables** on the main navigation.
2. Each table card visually reflects its live state:
   - 🟢 **Available**: Ready for new diners. Tap to open a new Dine-In order.
   - 🔵 **Occupied**: Active order in progress. Displays current total and dining duration.
   - 🟡 **Reserved**: Reserved for upcoming parties.
   - 🟣 **Billing**: Bill has been requested or printed.
   - ⚪ **Cleaning**: Table is awaiting turnover.
3. Click an occupied table to view or add items to the ticket.

---

## 4. Kitchen Display System (KDS)

The KDS is designed for the kitchen or expo station:
1. When an order is confirmed, tickets appear in real time under the **New** column with an auditory alert.
2. Kitchen staff can tap **Start Preparing** to advance the ticket to **Preparing** (yellow).
3. Once all dishes are ready, tap **Mark Ready** (green) to alert waitstaff or couriers.

---

## 5. Billing, Payments & Refunds

### Accepting Payment
1. In the POS Cart, click the prominent green **Pay** button.
2. Select the payment method:
   - **Cash**: Enter amount received. The system will automatically calculate exact change. Quick-increment buttons (+100, +500, +1000) are available.
   - **Card / Bank Transfer**: Enter reference or transaction number.
   - **Split Payment**: Enter custom split amounts between Cash and Card. The system verifies that the balance clears to zero.
3. Click **Complete Payment**. A thermal receipt will automatically be printed or prompted.

### Refunds
1. Open **Orders**, locate the completed order, and click **View**.
2. Click **Issue Refund**.
3. Enter the refund amount and mandatory explanation reason.
4. If configured, a **Manager Approval** PIN will be requested.

---

## 6. Inventory & Recipe Management

### Automatic Deduction
- When you sell a product linked to a **Recipe**, the system transactionally deducts the exact recipe ingredient quantities from your **Inventory** stock levels.

### Stock Adjustments & Wastage
- **Stock Adjustment**: Go to **Inventory** ➔ Click **Adjust Stock** ➔ Enter `+` or `-` amount with reason.
- **Wastage**: Go to **Wastage** ➔ Click **Record Wastage** ➔ Select item, quantity, and reason (*Expired*, *Burnt*, *Damaged*, *Spilled*).

---

## 7. End-of-Day Cash Drawer Closing

1. At the end of the day or cashier shift, open **Cash Register**.
2. Click **Close Register**.
3. Count the physical cash in the drawer and input the **Actual Cash Count**.
4. The system calculates:
   - `Expected Cash = Opening Float + Cash Sales + Cash In - Cash Out - Cash Refunds`
   - `Difference (Over / Short / Balanced)`
5. Enter closing notes and click **Confirm & Close Shift**.

---

## 8. Reports & Analytics

Navigate to **Reports** to inspect operational metrics across customizable date ranges (Today, This Week, This Month, Custom):
- **Sales & Orders Report**: Gross revenue, Net revenue, and order volume.
- **Product & Category Rankings**: Top-performing items by volume and revenue.
- **Profit & Loss / COGS**: Revenue minus ingredient costs and recorded expenses.
- **Exporting**: Click **Export PDF** or **Export CSV/Excel** for offline spreadsheets and tax accounting.

---

## 9. Database Backup & Safety

- The system automatically commits changes to disk.
- To perform a manual offsite backup:
  1. Open **Settings** ➔ **Backup & Restore**.
  2. Click **Create Backup Now**.
  3. The encrypted SQLite snapshot will be saved with a timestamp.
  4. You can also export full tables in CSV format at any time.
