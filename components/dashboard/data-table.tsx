'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

type SortField =
  | 'province'
  | 'region'
  | 'supplier'
  | 'node_name'
  | 'site_name'
  | 'cell'
  | 'metric'
  | 'condition'
  | 'days_available'
  | 'days_modified'
  | 'historical_days_available'
  | 'num_rops_available'
  | 'modulator_kpi'
  | 'value_modulator_kpi'
  | 'dq_status'
  | 'timestamp'

type SortDirection = 'asc' | 'desc'

type ColumnFilters = {
  province: string
  region: string
  supplier: string
  metric: string
  condition: string
  dq_status: string
}

const PAGE_SIZE = 20

const defaultColumnFilters: ColumnFilters = {
  province: 'all',
  region: 'all',
  supplier: 'all',
  metric: 'all',
  condition: 'all',
  dq_status: 'all',
}

const statusRank: Record<EnrichedRecord['dq_status'], number> = {
  Clear: 0,
  Flagged: 1,
  'Excluded by Condition': 2,
}

function StatusBadge({ status }: { status: EnrichedRecord['dq_status'] }) {
  if (status === 'Clear') {
    return <Badge className="border-success/20 bg-success/10 text-success">Clear</Badge>
  }

  if (status === 'Flagged') {
    return <Badge className="border-warning/20 bg-warning/10 text-warning">Flagged</Badge>
  }

  return <Badge variant="secondary">Excluded by Condition</Badge>
}

export function DataTable() {
  const { filteredData, filterOptions, setSelectedCell, isLoading } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(defaultColumnFilters)

  const processedData = useMemo(() => {
    let data = [...filteredData]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter((record) =>
        [
          record.cell,
          record.metric,
          record.province,
          record.region,
          record.supplier,
          record.node_name,
          record.site_name,
          record.condition,
          record.modulator_kpi ?? '',
        ].some((value) => value.toLowerCase().includes(term))
      )
    }

    if (columnFilters.province !== 'all') {
      data = data.filter((record) => record.province === columnFilters.province)
    }
    if (columnFilters.region !== 'all') {
      data = data.filter((record) => record.region === columnFilters.region)
    }
    if (columnFilters.supplier !== 'all') {
      data = data.filter((record) => record.supplier === columnFilters.supplier)
    }
    if (columnFilters.metric !== 'all') {
      data = data.filter((record) => record.metric === columnFilters.metric)
    }
    if (columnFilters.condition !== 'all') {
      data = data.filter((record) => record.conditions.includes(columnFilters.condition))
    }
    if (columnFilters.dq_status !== 'all') {
      data = data.filter((record) => record.dq_status === columnFilters.dq_status)
    }

    data.sort((left, right) => {
      if (sortField === 'dq_status') {
        const value = statusRank[left.dq_status] - statusRank[right.dq_status]
        return sortDirection === 'asc' ? value : -value
      }

      const leftValue = left[sortField]
      const rightValue = right[sortField]

      if (leftValue == null && rightValue == null) return 0
      if (leftValue == null) return 1
      if (rightValue == null) return -1

      if (sortField === 'timestamp') {
        const value = new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime()
        return sortDirection === 'asc' ? value : -value
      }

      const value =
        typeof leftValue === 'string'
          ? leftValue.localeCompare(String(rightValue))
          : Number(leftValue) - Number(rightValue)

      return sortDirection === 'asc' ? value : -value
    })

    return data
  }, [filteredData, searchTerm, columnFilters, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE))
  const paginatedData = processedData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const setFilterValue = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }))
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection('desc')
  }

  const handleExport = () => {
    exportToCSV(processedData, `ad-data-quality-detailed-table-${new Date().toISOString().split('T')[0]}.csv`)
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-[420px] rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Detailed Analyst Table</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Rich Cell-KPI records with inventory enrichment, exclusion context and export-ready telemetry fields.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export filtered table
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(6,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
              placeholder="Search cell, metric, node, modulator..."
            />
          </div>

          <Select value={columnFilters.province} onValueChange={(value) => setFilterValue('province', value)}>
            <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {filterOptions.provinces.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={columnFilters.region} onValueChange={(value) => setFilterValue('region', value)}>
            <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {filterOptions.regions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={columnFilters.supplier} onValueChange={(value) => setFilterValue('supplier', value)}>
            <SelectTrigger><SelectValue placeholder="Vendor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {filterOptions.vendors.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={columnFilters.metric} onValueChange={(value) => setFilterValue('metric', value)}>
            <SelectTrigger><SelectValue placeholder="Metric" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              {filterOptions.metrics.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={columnFilters.condition} onValueChange={(value) => setFilterValue('condition', value)}>
            <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {filterOptions.conditions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={columnFilters.dq_status} onValueChange={(value) => setFilterValue('dq_status', value)}>
            <SelectTrigger><SelectValue placeholder="DQ Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {filterOptions.statuses.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{processedData.length.toLocaleString()} analyst rows</span>
          <span>Click a row to inspect enriched record details.</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {[
                  ['province', 'Province'],
                  ['region', 'Region'],
                  ['supplier', 'Vendor'],
                  ['node_name', 'Node'],
                  ['site_name', 'Site Name'],
                  ['cell', 'Cell'],
                  ['metric', 'Metric'],
                  ['condition', 'Condition'],
                  ['days_available', 'Days Available'],
                  ['days_modified', 'Days Modified'],
                  ['historical_days_available', 'Historical Days Available'],
                  ['num_rops_available', 'ROPs Available'],
                  ['modulator_kpi', 'Modulator KPI'],
                  ['value_modulator_kpi', 'Modulator Value'],
                  ['dq_status', 'DQ Status'],
                  ['timestamp', 'Timestamp'],
                ].map(([field, label]) => (
                  <TableHead key={field}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-0 font-medium"
                      onClick={() => handleSort(field as SortField)}
                    >
                      {label}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="py-10 text-center text-muted-foreground">
                    No telecom quality rows match the current search and column filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record, index) => (
                  <TableRow
                    key={`${record.cell}-${record.metric}-${record.timestamp}-${index}`}
                    className="cursor-pointer align-top hover:bg-muted/35"
                    onClick={() => setSelectedCell(record)}
                  >
                    <TableCell className="text-xs font-medium">{record.province}</TableCell>
                    <TableCell className="text-xs">{record.region}</TableCell>
                    <TableCell className="text-xs">{record.supplier}</TableCell>
                    <TableCell className="max-w-[160px] text-xs">{record.node_name}</TableCell>
                    <TableCell className="max-w-[180px] text-xs">{record.site_name}</TableCell>
                    <TableCell className="max-w-[180px] font-mono text-xs">{record.cell}</TableCell>
                    <TableCell className="min-w-[180px] text-xs">{formatMetricName(record.metric)}</TableCell>
                    <TableCell className="min-w-[180px] text-xs text-muted-foreground">{record.condition}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.days_available ?? 'N/A'}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.days_modified}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.historical_days_available ?? 'N/A'}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.num_rops_available ?? 'N/A'}</TableCell>
                    <TableCell className="max-w-[180px] text-xs">{record.modulator_kpi ?? 'N/A'}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{record.value_modulator_kpi ?? 'N/A'}</TableCell>
                    <TableCell><StatusBadge status={record.dq_status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
