// sql.js ships no TypeScript definitions; this declares the surface the app actually uses.
declare module 'sql.js' {
  export interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  export interface Statement {
    bind(values?: unknown[] | Record<string, unknown>): boolean
    run(values?: unknown[] | Record<string, unknown>): void
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): boolean
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null)
    run(sql: string, params?: unknown[]): Database
    exec(sql: string, params?: unknown[]): QueryExecResult[]
    prepare(sql: string, params?: unknown[]): Statement
    export(): Uint8Array
    close(): void
  }

  export interface SqlJsStatic {
    Database: typeof Database
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>
}
