'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useData } from '@/lib/data-context'
import { aggregateByField, aggregateByDaysModified, formatMetricName } from '@/lib/data-loader'
import type { EnrichedRecord } from '@/lib/types'

// Days Available Panel
export function DaysAvailablePanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const panelData = useMemo(() => {
    const data = filteredData.filter(r => r.days_available !== null)
    const totalAffected = data.length
    const avgDays = data.length > 0 
      ? data.reduce((sum, r) => sum + (r.days_available || 0), 0) / data.length 
      : 0
    const minDays = data.length > 0 
      ? Math.min(...data.map(r => r.days_available || 0))
      : 0

    const topProvinces = aggregateByField(data, 'province', 8)
    const topMetrics = aggregateByField(data, 'metric', 8)
    const lowestCells = [...data]
      .sort((a, b) => (a.days_available || 0) - (b.days_available || 0))
      .slice(0, 10)

    return { totalAffected, avgDays, minDays, topProvinces, topMetrics, lowestCells }
  }, [filteredData])

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Affected Cell-KPI</p>
            <p className="text-2xl font-bold text-foreground">{panelData.totalAffected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Days Available</p>
            <p className="text-2xl font-bold text-foreground">{panelData.avgDays.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Minimum Days Available</p>
            <p className="text-2xl font-bold text-foreground">{panelData.minDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Provinces by Record Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topProvinces} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.length > 10 ? `${v.slice(0, 10)}...` : v}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Metrics by Record Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topMetrics} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatMetricName(v).slice(0, 15)}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cells Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Cells with Lowest Days Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelData.lowestCells.map((cell, idx) => (
              <CellRow key={`${cell.cell}-${idx}`} cell={cell} onClick={setSelectedCell} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Days Modified Panel
export function DaysModifiedPanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const panelData = useMemo(() => {
    const data = filteredData.filter(r => r.days_modified > 0)
    const totalAffected = data.length
    const avgModified = data.length > 0 
      ? data.reduce((sum, r) => sum + r.days_modified, 0) / data.length 
      : 0
    const totalModifiedDays = data.reduce((sum, r) => sum + r.days_modified, 0)

    const topProvinces = aggregateByDaysModified(data, 'province', 8)
    const topMetrics = aggregateByDaysModified(data, 'metric', 8)
    const highestCells = [...data]
      .sort((a, b) => b.days_modified - a.days_modified)
      .slice(0, 10)

    return { totalAffected, avgModified, totalModifiedDays, topProvinces, topMetrics, highestCells }
  }, [filteredData])

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Affected Cell-KPI</p>
            <p className="text-2xl font-bold text-warning">{panelData.totalAffected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Days Modified</p>
            <p className="text-2xl font-bold text-foreground">{panelData.avgModified.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Modified Days</p>
            <p className="text-2xl font-bold text-foreground">{panelData.totalModifiedDays.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Provinces by Total Modified Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topProvinces} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.length > 10 ? `${v.slice(0, 10)}...` : v}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top KPIs by Total Modified Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topMetrics} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatMetricName(v).slice(0, 15)}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cells Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Cells with Highest Days Modified</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelData.highestCells.map((cell, idx) => (
              <CellRow 
                key={`${cell.cell}-${idx}`} 
                cell={cell} 
                onClick={setSelectedCell}
                valueLabel="Days Modified"
                valueField="days_modified"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Trend Change Panel
export function TrendChangePanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const panelData = useMemo(() => {
    const data = filteredData.filter(r => r.trend_change === true)
    const totalAffected = data.length

    const topProvinces = aggregateByField(data, 'province', 8)
    const topMetrics = aggregateByField(data, 'metric', 8)
    const topNodes = aggregateByField(data, 'node_name', 10)
    const affectedCells = data.slice(0, 10)

    return { totalAffected, topProvinces, topMetrics, topNodes, affectedCells }
  }, [filteredData])

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          <strong>Trend Change</strong> indicates that the anomaly detection system detected a new 
          normality in the cell-KPI time series. This is not an error - it means the baseline 
          behavior has shifted and the model has adapted.
        </p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cell-KPI with Trend Change</p>
          <p className="text-3xl font-bold text-foreground">{panelData.totalAffected.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Provinces with Trend Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topProvinces} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.length > 10 ? `${v.slice(0, 10)}...` : v}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Metrics with Trend Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelData.topMetrics} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatMetricName(v).slice(0, 15)}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Nodes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Top Affected Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {panelData.topNodes.map((node) => (
              <div key={node.name} className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground truncate">{node.name}</p>
                <p className="text-lg font-bold">{node.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cells Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Cells with Trend Change</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelData.affectedCells.map((cell, idx) => (
              <CellRow 
                key={`${cell.cell}-${idx}`} 
                cell={cell} 
                onClick={setSelectedCell}
                showTrendBadge
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable Cell Row Component
interface CellRowProps {
  cell: EnrichedRecord
  onClick: (cell: EnrichedRecord) => void
  valueLabel?: string
  valueField?: 'days_modified' | 'days_available'
  showTrendBadge?: boolean
}

function CellRow({ cell, onClick, valueLabel, valueField, showTrendBadge }: CellRowProps) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors"
      onClick={() => onClick(cell)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{cell.cell}</p>
        <p className="text-xs text-muted-foreground">
          {cell.province} | {formatMetricName(cell.metric)}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {showTrendBadge && (
          <Badge variant="secondary">Trend Change</Badge>
        )}
        {valueField && (
          <div className="text-right">
            <p className="text-sm font-mono font-bold">{cell[valueField]}</p>
            <p className="text-xs text-muted-foreground">{valueLabel}</p>
          </div>
        )}
      </div>
    </div>
  )
}
