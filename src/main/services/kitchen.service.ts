import { queryAll, execute, runTransaction } from '../database/connection'

export function getKitchenOrders() {
  const orders = queryAll<any>(`
    SELECT o.*, t.name as table_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.status IN ('confirmed', 'preparing')
    ORDER BY o.created_at ASC
  `, [])

  for (const order of orders) {
    order.items = queryAll<any>(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ? AND oi.sent_to_kitchen = 1
    `, [order.id])
  }

  // Filter orders that have at least one item sent to kitchen
  return orders.filter(o => o.items && o.items.length > 0)
}

export function updateItemStatus(itemId: string, status: string) {
  execute(`UPDATE order_items SET status = ? WHERE id = ?`, [status, itemId])
  return true
}

export function updateOrderKitchenStatus(orderId: string, status: string) {
  runTransaction(() => {
    execute(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, orderId])
    // Update all sent_to_kitchen items to match the status
    let itemStatus = 'pending'
    if (status === 'preparing') itemStatus = 'preparing'
    else if (status === 'ready') itemStatus = 'ready'
    else if (status === 'delivered') itemStatus = 'delivered'
    
    execute(`UPDATE order_items SET status = ? WHERE order_id = ? AND sent_to_kitchen = 1`, [itemStatus, orderId])
  })
  return true
}

export function completeOrder(orderId: string) {
  return updateOrderKitchenStatus(orderId, 'ready')
}
