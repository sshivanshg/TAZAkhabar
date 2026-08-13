import type { ReactNode } from 'react'

const COLORS: Record<string, { bg: string; fg: string }> = {
  PendingReview: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  Published: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  Rejected: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Draft: { bg: 'var(--surface-hover)', fg: 'var(--text-muted)' },
  Archived: { bg: 'var(--surface-hover)', fg: 'var(--text-muted)' },
  Queued: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  Processing: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  Ready: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  Failed: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  Error: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
}

export function StatusBadge({ status }: { status: string }) {
  const c = COLORS[status] ?? { bg: 'var(--surface-hover)', fg: 'var(--text-muted)' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {status}
    </span>
  )
}

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  emptyMessage = 'No rows',
}: DataTableProps<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 28, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        <span className="num">
          {total} total · page {page} / {pages}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Prev
          </button>
          <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
