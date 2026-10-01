import { queryAll, queryOne } from '../database/connection'

// audit_logs already denormalises user_name, so no users join is needed.
export function listLogs(filters: any = {}) {
  const where: string[] = ['1=1']
  const params: any[] = []

  if (filters?.action) {
    where.push('action = ?')
    params.push(filters.action)
  }

  if (filters?.userId) {
    where.push('user_id = ?')
    params.push(filters.userId)
  }

  if (filters?.entity) {
    where.push('entity = ?')
    params.push(filters.entity)
  }

  if (filters?.search) {
    const like = `%${filters.search}%`
    where.push('(user_name LIKE ? OR action LIKE ? OR details LIKE ?)')
    params.push(like, like, like)
  }

  if (filters?.startDate && filters?.endDate) {
    where.push('date(created_at) BETWEEN date(?) AND date(?)')
    params.push(filters.startDate, filters.endDate)
  }

  const whereSql = where.join(' AND ')
  const total = Number(
    (queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM audit_logs WHERE ${whereSql}`, params))?.c ?? 0
  )

  let query = `SELECT * FROM audit_logs WHERE ${whereSql} ORDER BY created_at DESC, rowid DESC`
  const pageParams = [...params]
  if (filters?.limit) {
    query += ' LIMIT ? OFFSET ?'
    pageParams.push(Number(filters.limit), Number(filters.offset ?? 0))
  }

  return { logs: queryAll(query, pageParams), total }
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function exportLogs(filters: any = {}) {
  const { logs } = listLogs({ ...filters, limit: undefined, offset: undefined })
  const rows = [['ID', 'Date', 'User', 'Action', 'Entity', 'Entity ID', 'Details']]
  for (const log of logs) {
    const entry = log as any
    rows.push([
      entry.id,
      entry.created_at,
      entry.user_name,
      entry.action,
      entry.entity,
      entry.entity_id,
      entry.details
    ])
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}
