import { cn } from '@/lib/cn'
import { Skeleton } from './States'

export interface Column<T> {
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  className?: string
}

// Tabla en pantallas medianas en adelante y lista de tarjetas en el celular.
export function ResponsiveTable<T>({
  rows,
  columns,
  rowKey,
  mobileCard,
  onRowClick,
  loading,
  skeletonRows = 5,
  empty,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  mobileCard: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  loading?: boolean
  skeletonRows?: number
  empty?: React.ReactNode
}) {
  if (!loading && rows.length === 0) return <>{empty}</>

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] whitespace-nowrap',
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F2F5]">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('table-row-3d', onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((c, j) => (
                      <td key={j} className={cn('px-5 py-3.5', c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[#F1F2F5]">
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 4) }).map((_, i) => (
              <div key={i} className="px-4 py-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : rows.map((row) =>
              onRowClick ? (
                <button
                  key={rowKey(row)}
                  type="button"
                  onClick={() => onRowClick(row)}
                  className="w-full text-left px-4 py-3.5 active:bg-canvas transition-colors duration-150"
                >
                  {mobileCard(row)}
                </button>
              ) : (
                <div key={rowKey(row)} className="px-4 py-3.5">
                  {mobileCard(row)}
                </div>
              )
            )}
      </div>
    </>
  )
}
