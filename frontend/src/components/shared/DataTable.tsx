import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 10

interface DataTableProps {
  data: Record<string, unknown>[]
  maxColumns?: number
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—"
  if (typeof val === "number") return Number.isInteger(val) ? String(val) : val.toFixed(2)
  return String(val)
}

export function DataTable({ data, maxColumns = 10 }: DataTableProps) {
  const [page, setPage] = useState(0)
  if (!data || data.length === 0) return <p className="text-muted-foreground text-sm">No data</p>

  const columns = Object.keys(data[0]).slice(0, maxColumns)
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const rows = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap text-xs font-semibold">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col} className="text-xs whitespace-nowrap">
                    {formatValue(row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)} of {data.length} rows
          </span>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage(0)} disabled={page === 0}>
              «
            </Button>
            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
