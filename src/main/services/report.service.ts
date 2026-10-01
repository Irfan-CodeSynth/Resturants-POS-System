import { queryAll } from '../database/connection'

export interface Report {
  title: string
  date_range: { start: string | null; end: string | null }
  headers: string[]
  rows: (string | number | null)[][]
  summary: Record<string, unknown>
}

function getBaseReport(title: string, startDate?: string, endDate?: string): Report {
  return {
    title,
    date_range: { start: startDate || null, end: endDate || null },
    headers: [],
    rows: [],
    summary: {}
  }
}

export function salesReport(dateRange: {start?: string, end?: string}) {
  const report = getBaseReport('Sales Report', dateRange.start, dateRange.end)
  
  let query = "SELECT date(created_at) as date, COUNT(id) as order_count, SUM(total) as total FROM orders WHERE status = 'completed'"
  const params: any[] = []
  
  if (dateRange.start && dateRange.end) {
    query += ' AND date(created_at) BETWEEN date(?) AND date(?)'
    params.push(dateRange.start, dateRange.end)
  }
  
  query += ' GROUP BY date(created_at) ORDER BY date DESC'
  
  report.headers = ['Date', 'Orders', 'Total Sales']
  const rows = queryAll(query, params)
  
  let totalSales = 0
  report.rows = rows.map((r: any) => {
    totalSales += r.total
    return [r.date, r.order_count, r.total]
  })
  
  report.summary = { totalSales, totalDays: rows.length }
  return report
}

export function ordersReport(dateRange: {start?: string, end?: string}) {
  const report = getBaseReport('Orders Report', dateRange.start, dateRange.end)
  
  let query = "SELECT order_type, status, COUNT(id) as count, AVG(total) as avg_value FROM orders WHERE 1=1"
  const params: any[] = []
  
  if (dateRange.start && dateRange.end) {
    query += ' AND date(created_at) BETWEEN date(?) AND date(?)'
    params.push(dateRange.start, dateRange.end)
  }
  
  query += ' GROUP BY order_type, status'
  
  report.headers = ['Type', 'Status', 'Count', 'Avg Value']
  const rows = queryAll(query, params)
  
  report.rows = rows.map((r: any) => [r.order_type, r.status, r.count, r.avg_value])
  return report
}

export function productsReport(dateRange: {start?: string, end?: string}) {
  const report = getBaseReport('Products Report', dateRange.start, dateRange.end)
  
  let query = `
    SELECT i.product_name, SUM(i.quantity) as qty, SUM(i.total) as rev
    FROM order_items i
    JOIN orders o ON i.order_id = o.id
    WHERE o.status = 'completed'
  `
  const params: any[] = []
  
  if (dateRange.start && dateRange.end) {
    query += ' AND date(o.created_at) BETWEEN date(?) AND date(?)'
    params.push(dateRange.start, dateRange.end)
  }
  
  query += ' GROUP BY i.product_id, i.product_name ORDER BY qty DESC'
  
  report.headers = ['Product', 'Quantity Sold', 'Revenue']
  const rows = queryAll(query, params)
  
  report.rows = rows.map((r: any) => [r.product_name, r.qty, r.rev])
  return report
}

// ... other reports returning empty base reports for now as per previous version
export function categoriesReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Categories Report', dateRange.start, dateRange.end) }
export function paymentsReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Payments Report', dateRange.start, dateRange.end) }
export function discountsReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Discounts Report', dateRange.start, dateRange.end) }
export function refundsReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Refunds Report', dateRange.start, dateRange.end) }
export function cashRegisterReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Cash Register Report', dateRange.start, dateRange.end) }
export function employeesReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Employees Report', dateRange.start, dateRange.end) }
export function inventoryReport() { return getBaseReport('Inventory Report') }
export function stockMovementsReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Stock Movements Report', dateRange.start, dateRange.end) }
export function purchasesReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Purchases Report', dateRange.start, dateRange.end) }
export function suppliersReport() { return getBaseReport('Suppliers Report') }
export function expensesReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Expenses Report', dateRange.start, dateRange.end) }
export function profitLossReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Profit Loss Report', dateRange.start, dateRange.end) }
export function taxReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Tax Report', dateRange.start, dateRange.end) }
export function wastageReport(dateRange: {start?: string, end?: string}) { return getBaseReport('Wastage Report', dateRange.start, dateRange.end) }
