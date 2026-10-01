import { queryAll, queryOne, execute } from '../database/connection'
import { v4 as uuid } from 'uuid'
import { webContents } from 'electron'

export async function getSystemPrinters() {
  const contents = webContents.getAllWebContents()[0]
  if (!contents) return []
  return await contents.getPrintersAsync()
}

export function getConfigs() {
  return queryAll('SELECT * FROM printer_configs ORDER BY is_default DESC, name ASC', [])
}

export function saveConfig(data: any) {
  const name = data?.name
  if (!name) throw new Error('A printer name is required')

  if (data.id) {
    execute(
      `UPDATE printer_configs
       SET name = ?, type = ?, printer_name = ?, paper_width = ?, copies = ?, auto_print = ?, is_default = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        name,
        data.type || 'receipt',
        data.printer_name || null,
        data.paper_width ?? 80,
        data.copies ?? 1,
        data.auto_print ? 1 : 0,
        data.is_default ? 1 : 0,
        data.id
      ]
    )
    return getConfig(data.id)
  }

  const id = uuid()
  if (data.is_default) execute('UPDATE printer_configs SET is_default = 0', [])
  execute(
    `INSERT INTO printer_configs (id, name, type, printer_name, paper_width, copies, auto_print, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      data.type || 'receipt',
      data.printer_name || null,
      data.paper_width ?? 80,
      data.copies ?? 1,
      data.auto_print ? 1 : 0,
      data.is_default ? 1 : 0
    ]
  )
  return getConfig(id)
}

function getConfig(id: string) {
  return queryOne('SELECT * FROM printer_configs WHERE id = ?', [id])
}

export function deleteConfig(id: string) {
  const config = queryOne<{ id: string }>('SELECT id FROM printer_configs WHERE id = ?', [id])
  if (!config) throw new Error('Printer config not found')
  execute('DELETE FROM printer_configs WHERE id = ?', [id])
  return { success: true }
}

export async function printReceipt(orderId: string) {
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]) as any
  if (!order) throw new Error('Order not found')
  
  const items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [orderId])
  const restaurant = queryOne('SELECT * FROM restaurant WHERE id = \'1\'', []) as any
  const config = queryOne('SELECT * FROM printer_configs WHERE is_default = 1 LIMIT 1', []) as any
  
  if (!config) throw new Error('No default printer configured')

  let html = `
    <html>
    <head>
      <style>
        body { font-family: monospace; width: ${config.paper_width}mm; padding: 0; margin: 0; }
        .center { text-align: center; }
        .flex { display: flex; justify-content: space-between; }
        .bold { font-weight: bold; }
        hr { border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="center bold">${restaurant?.name || 'Restaurant Name'}</div>
      <div class="center">${restaurant?.address || ''}</div>
      <div class="center">${restaurant?.phone || ''}</div>
      <hr/>
      <div>Order: ${order.order_number}</div>
      <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
      ${order.table_id ? `<div>Table: ${order.table_id}</div>` : ''}
      <hr/>
      ${items.map((i: any) => `
        <div class="flex">
          <span>${i.quantity}x ${i.product_name}</span>
          <span>${i.total}</span>
        </div>
      `).join('')}
      <hr/>
      <div class="flex"><span>Subtotal:</span><span>${order.subtotal}</span></div>
      ${order.discount_amount > 0 ? `<div class="flex"><span>Discount:</span><span>-${order.discount_amount}</span></div>` : ''}
      ${order.tax_amount > 0 ? `<div class="flex"><span>Tax:</span><span>${order.tax_amount}</span></div>` : ''}
      <div class="flex bold"><span>Total:</span><span>${order.total}</span></div>
      <hr/>
      <div class="center">${restaurant?.receipt_footer || 'Thank you!'}</div>
    </body>
    </html>
  `
  
  return { success: true, html, printer_name: config.printer_name, copies: config.copies }
}

export async function printKitchenTicket(orderId: string, newItemsOnly: boolean = false) {
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]) as any
  if (!order) throw new Error('Order not found')

  let query = 'SELECT * FROM order_items WHERE order_id = ?'
  const params: unknown[] = [orderId]
  if (newItemsOnly) {
    query += ' AND sent_to_kitchen = 0'
  }
  const items = queryAll(query, params)
  if (items.length === 0) throw new Error('No kitchen items to print')

  const tables = queryOne<{ number: string }>('SELECT number FROM tables WHERE id = ?', [order.table_id || ''])
  const html = `
    <html>
    <body style="font-family: monospace;">
      <h2>Order ${order.order_number}${tables ? ` - Table ${tables.number}` : ''}</h2>
      <ul>
        ${items.map((i: any) => `<li>${i.quantity}x ${i.product_name}${i.notes ? ` (${i.notes})` : ''}</li>`).join('')}
      </ul>
    </body>
    </html>
  `
  return { success: true, html }
}

export async function testPrint(configId: string) {
  const config = queryOne('SELECT * FROM printer_configs WHERE id = ?', [configId]) as any
  if (!config) throw new Error('Printer config not found')
  if (!config.printer_name) throw new Error('That config has no printer name selected')

  return {
    success: true,
    printer_name: config.printer_name,
    html: '<html><body style="font-family: monospace;">POS test print</body></html>'
  }
}
