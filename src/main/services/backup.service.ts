import { queryAll, queryOne, execute, createAuditLog, getDbPath, saveDatabase, closeDb, initDb } from '../database/connection'
import { getSetting, bulkSet } from './settings.service'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import path from 'path'
import { app, dialog } from 'electron'

// There is no backup_settings table; these preferences live in the settings table.
const KEYS = {
  enabled: 'backup.auto_enabled',
  frequency: 'backup.frequency',
  location: 'backup.location',
  retain: 'backup.retain_count'
} as const

function settingNumber(key: string, fallback: number): number {
  const parsed = Number(getSetting(key))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getBackupSettings() {
  return {
    auto_backup_enabled: getSetting(KEYS.enabled) === '1' ? 1 : 0,
    backup_frequency: getSetting(KEYS.frequency) || 'daily',
    backup_location: getSetting(KEYS.location) || '',
    retain_count: settingNumber(KEYS.retain, 7)
  }
}

export function updateBackupSettings(settings: any, adminId?: string, adminName?: string) {
  bulkSet(
    [
      { key: KEYS.enabled, value: settings?.auto_backup_enabled ? '1' : '0', group: 'backup' },
      { key: KEYS.frequency, value: settings?.backup_frequency || 'daily', group: 'backup' },
      { key: KEYS.location, value: settings?.backup_location || '', group: 'backup' },
      { key: KEYS.retain, value: String(settings?.retain_count ?? 7), group: 'backup' }
    ],
    adminId,
    adminName
  )
  return getBackupSettings()
}

function backupDirectory(): string {
  const configured = getBackupSettings().backup_location
  const dir = configured || path.join(app.getPath('documents'), 'POS_Backups')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function createBackup(userId?: string, userName?: string, type: string = 'manual') {
  // sql.js keeps the database in memory, so the file is only current after a flush.
  saveDatabase()

  const dbPath = getDbPath()
  if (!fs.existsSync(dbPath)) throw new Error('The database file has not been created yet')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup_${timestamp}.db`
  const destPath = path.join(backupDirectory(), filename)
  fs.copyFileSync(dbPath, destPath)

  const id = uuid()
  execute(
    `INSERT INTO backups (id, filename, filepath, size, type, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, filename, destPath, fs.statSync(destPath).size, type, userId || null]
  )

  if (userId && userName) {
    createAuditLog(userId, userName, 'create_backup', 'backups', id, JSON.stringify({ filepath: destPath }))
  }

  return { id, filename, filepath: destPath }
}

export async function restoreBackup(backupId: string, userId?: string, userName?: string) {
  const backup = queryOne<any>('SELECT * FROM backups WHERE id = ?', [backupId])
  if (!backup) throw new Error('Backup not found')
  if (!fs.existsSync(backup.filepath)) throw new Error('Backup file not found on disk')

  // closeDb() flushes the in-memory database onto the file, so the snapshot has to be copied
  // after it - copying first would let that flush overwrite the backup we are restoring.
  closeDb()
  fs.copyFileSync(backup.filepath, getDbPath())
  await initDb()

  if (userId && userName) {
    createAuditLog(userId, userName, 'restore_backup', 'backups', backupId, JSON.stringify({ filepath: backup.filepath }))
  }
  return { success: true, message: 'Database restored from backup' }
}

export function listBackups() {
  return queryAll(
    `SELECT b.*, u.name AS user_name
     FROM backups b
     LEFT JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC, b.rowid DESC`,
    []
  )
}

export function deleteBackup(backupId: string, userId?: string, userName?: string) {
  const backup = queryOne<any>('SELECT * FROM backups WHERE id = ?', [backupId])
  if (!backup) throw new Error('Backup not found')

  if (fs.existsSync(backup.filepath)) fs.unlinkSync(backup.filepath)
  execute('DELETE FROM backups WHERE id = ?', [backupId])

  if (userId && userName) {
    createAuditLog(userId, userName, 'delete_backup', 'backups', backupId, JSON.stringify({ filename: backup.filename }))
  }
  return { success: true }
}

export async function selectFolder() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
}

export function exportData(type: string, filters: any = {}) {
  return { success: true, data: 'mock,data,csv\n1,2,3' }
}
