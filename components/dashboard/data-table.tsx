'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useData } from '@/lib/data-context'
import { exportToCSV, formatMetricName } from '@/lib/data-loader'
import type { EnrichedRecord } from '@/lib/types'

type SortField = 'province' | 'region' | 'supplier' | 'node_name' | 'cell' | 'metric' | 'days_modified' | 'dq_status'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 15

export function DataTable() {
  const { filteredData, setSelectedCell, isLoading } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('days_modified')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const processedData = useMemo(() => {
    let data = [...filteredData]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(
        (r) =>
          r.cell.toLowerCase().includes(term) ||
          r.metric.toLowerCase().includes(term) ||
          r.province.toLowerCase().includes(term) ||
          r.node_name.toLowerCase().includes(term)
      )
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(String(bVal))
        : Number(aVal) - Number(bVal)
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return data
  }, [filteredData, searchTerm, sortField, sortDirection])

  const totalPages = Math.ceil(processedData.length / PAGE_SIZE)
  const paginatedData = processedData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRowClick = (record: EnrichedRecord) => {
    setSelectedCell(record)
  }

  const handleExport = () => {
    exportToCSV(processedData, `cell-kpi-data-quality-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Clear':
        return <Badge className="bg-success/10 text-success border-success/20">Clear</Badge>
      case 'Flagged':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Flagged</Badge>
      case 'Excluded by Condition':
        return <Badge variant="secondary">Excluded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Cell-KPI Affected by Data Quality Conditions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cells, metrics, provinces..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {processedData.length.toLocaleString()} records
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('province')}
                  >
                    Province
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('region')}
                  >
                    Region
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[90px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('supplier')}
                  >
                    Vendor
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('node_name')}
                  >
                    Node
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('cell')}
                  >
                    Cell
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort('metric')}
                  >
                    Metric
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort('days_modified')}
                  >
                    Days Mod.
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort('dq_status')}
                  >
                    DQ Status
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No records found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record, idx) => (
                  <TableRow
                    key={`${record.cell}-${record.metric}-${idx}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(record)}
                  >
                    <TableCell className="font-medium text-xs">{record.province}</TableCell>
                    <TableCell className="text-xs">{record.region}</TableCell>
                    <TableCell className="text-xs capitalize">{record.supplier}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">{record.node_name}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[180px]">{record.cell}</TableCell>
                    <TableCell className="text-xs">{formatMetricName(record.metric)}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.days_modified}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(record.dq_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {record.condition}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
