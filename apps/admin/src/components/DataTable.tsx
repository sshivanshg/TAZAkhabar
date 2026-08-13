import type { ReactNode } from 'react'
import { theme } from '../theme'

const COLORS: Record<string, { bg: string; fg: string }> = {
  PendingReview: { bg: '#FFF8E1', fg: theme.warning },
  Published: { bg: '#E8F5E9', fg: theme.success },
  Rejected: { bg: '#FFEBEE', fg: theme.danger },
  Draft: { bg: '#F5F5F5', fg: theme.draft },
  Archived: { bg: '#EEEEEE', fg: theme.archived },
  Queued: { bg: '#FFF8E1', fg: theme.warning },
  Processing: { bg: '#EEF1FF', fg: theme.accent },
  Ready: { bg: '#E8F5E9', fg: theme.success },
  Failed: { bg: '#FFEBEE', fg: theme.danger },
}

export function StatusBadge({ status }: { status: string }) {
  const c = COLORS[status] ?? { bg: '#F5F5F5', fg: theme.textMuted }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        whiteSpace: 'nowrap',
      }}
    >
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
      <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: 6, background: theme.surface }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: theme.background, textAlign: 'left' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                    fontWeight: 600,
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 24, color: theme.textMuted, textAlign: 'center' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13, color: theme.textSecondary }}>
        <span>
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
