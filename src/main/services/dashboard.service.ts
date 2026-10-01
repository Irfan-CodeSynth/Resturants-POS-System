import { queryAll, queryOne } from '../database/connection'

export function getStats() {
  const today = new Date().toISOString().split('T')[0]
  
  // Today's stats
  const orders = queryOne<any>(`SELECT COUNT(*) as count, SUM(total) as total, SUM(discount_amount) as discount, SUM(tax_amount) as tax FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled' AND status != 'void'`, [today]) || { count: 0, total: 0, discount: 0, tax: 0 }
  
  // Net Sales = Gross Sales - Discounts - Refunds
  const refunds = queryOne<any>(`SELECT SUM(amount) as total FROM refunds WHERE DATE(created_at) = ?`, [today]) || { total: 0 }
  const expenses = queryOne<any>(`SELECT SUM(amount) as total FROM expenses WHERE DATE(date) = ?`, [today]) || { total: 0 }

  // Cash movements are stored signed (cash_out and refunds are negative), so a plain sum is the balance.
  const cashBalance = queryOne<any>(`
    SELECT SUM(amount) as balance
    FROM cash_movements 
    WHERE DATE(created_at) = ?
  `, [today]) || { balance: 0 }

  return {
    sales: orders.total || 0,
    orders: orders.count || 0,
    avgOrderValue: orders.count > 0 ? (orders.total / orders.count) : 0,
    grossProfit: (orders.total || 0) - (refunds.total || 0) - (expenses.total || 0),
    netSales: (orders.total || 0) - (orders.discount || 0) - (refunds.total || 0),
    discounts: orders.discount || 0,
    refunds: refunds.total || 0,
    expenses: expenses.total || 0,
    cashBalance: cashBalance.balance || 0
  }
}

export function getCharts(period: 'today' | 'week' | 'month' = 'week') {
  let timeModifier = '-7 days'
  if (period === 'today') timeModifier = '0 days'
  else if (period === 'month') timeModifier = '-30 days'

  const salesData = queryAll<any>(`
    SELECT DATE(created_at) as date, SUM(total) as sales 
    FROM orders 
    WHERE created_at >= date('now', ?) AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [timeModifier])

  const topProducts = queryAll<any>(`
    SELECT p.name, SUM(oi.quantity) as count
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= date('now', ?) AND o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 5
  `, [timeModifier])

  return {
    sales: salesData,
    topProducts
  }
}

export function getRecentOrders(limit: number = 10) {
  return queryAll<any>(`SELECT * FROM orders ORDER BY created_at DESC, rowid DESC LIMIT ?`, [limit])
}

export function getLowStock() {
  return queryAll<any>(
    `SELECT * FROM inventory_items WHERE is_active = 1 AND current_stock <= minimum_stock ORDER BY current_stock ASC`,
    []
  )
}

export function getRecentActivity(limit: number = 10) {
  // audit_logs already denormalises user_name, so no users join is needed.
  return queryAll<any>(
    `SELECT * FROM audit_logs ORDER BY created_at DESC, rowid DESC LIMIT ?`,
    [limit]
  )
}
