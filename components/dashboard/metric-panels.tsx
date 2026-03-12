'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useData } from '@/lib/data-context'
import {
  aggregateByField,
  aggregateFlaggedByField,
  aggregateSumByField,
  formatMetricName,
} from '@/lib/data-loader'
import type { EnrichedRecord } from '@/lib/types'

function LoadingPanel() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />
}

function SummaryStatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${accent ?? 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function VerticalBarCard({
  title,
  data,
  color,
}: {
  title: string
  data: { name: string; value: number }[]
  color: string
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.length > 16 ? `${value.slice(0, 16)}...` : value}
              />
              <Tooltip />
              <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function RecordListCard({
  title,
  records,
  onClick,
  valueLabel,
  valueField,
  badgeLabel,
}: {
  title: string
  records: EnrichedRecord[]
  onClick: (cell: EnrichedRecord) => void
  valueLabel?: string
  valueField?: 'days_modified' | 'days_available' | 'historical_days_available' | 'num_rops_available'
  badgeLabel?: string
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {records.map((record, index) => (
            <div
              key={`${record.cell}-${record.metric}-${index}`}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/35 p-3 transition-colors hover:bg-muted/55"
              onClick={() => onClick(record)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{record.cell}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {record.province} | {formatMetricName(record.metric)}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                {badgeLabel ? <Badge variant="secondary">{badgeLabel}</Badge> : null}
                {valueField ? (
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{record[valueField] ?? 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{valueLabel}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ConditionPanel({
  title,
  description,
  records,
  onClick,
  color,
  statCards,
  valueField,
  valueLabel,
  chartMode = 'count',
  badgeLabel,
}: {
  title: string
  description: string
  records: EnrichedRecord[]
  onClick: (cell: EnrichedRecord) => void
  color: string
  statCards: { label: string; value: string | number; accent?: string }[]
  valueField?: 'days_modified' | 'days_available' | 'historical_days_available' | 'num_rops_available'
  valueLabel?: string
  chartMode?: 'count' | 'sum'
  badgeLabel?: string
}) {
  const topProvinces = useMemo(
    () =>
      chartMode === 'sum' && valueField
        ? aggregateSumByField(records, 'province', valueField, 8)
        : aggregateByField(records, 'province', 8),
    [chartMode, records, valueField]
  )
  const topMetrics = useMemo(
    () =>
      chartMode === 'sum' && valueField
        ? aggregateSumByField(records, 'metric', valueField, 8)
        : aggregateByField(records, 'metric', 8),
    [chartMode, records, valueField]
  )
  const topVendors = useMemo(() => aggregateFlaggedByField(records, 'supplier', 8), [records])
  const featuredRecords = useMemo(() => records.slice(0, 10), [records])

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <SummaryStatCard key={card.label} label={card.label} value={card.value} accent={card.accent} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <VerticalBarCard title={`${title}: Top Provinces`} data={topProvinces} color={color} />
        <VerticalBarCard title={`${title}: Top Metrics`} data={topMetrics.map((item) => ({ ...item, name: formatMetricName(item.name) }))} color={color} />
        <VerticalBarCard title={`${title}: Top Vendors`} data={topVendors} color={color} />
      </div>

      <RecordListCard
        title={`${title}: Cell-KPI sample`}
        records={featuredRecords}
        onClick={onClick}
        valueField={valueField}
        valueLabel={valueLabel}
        badgeLabel={badgeLabel}
      />
    </div>
  )
}

export function DaysAvailablePanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.days_available !== null && record.days_available < 14),
    [filteredData]
  )

  if (isLoading) return <LoadingPanel />

  const average = records.length ? records.reduce((sum, record) => sum + (record.days_available ?? 0), 0) / records.length : 0
  const minimum = records.length ? Math.min(...records.map((record) => record.days_available ?? 0)) : 0

  return (
    <ConditionPanel
      title="Days Available"
      description="Focus on Cell-KPI with low data availability. These records reduce historical reliability and can directly limit anomaly interpretation."
      records={[...records].sort((a, b) => (a.days_available ?? 0) - (b.days_available ?? 0))}
      onClick={setSelectedCell}
      color="hsl(var(--chart-1))"
      valueField="days_available"
      valueLabel="Days Available"
      statCards={[
        { label: 'Affected Cell-KPI', value: records.length.toLocaleString(), accent: 'text-chart-1' },
        { label: 'Average Days Available', value: average.toFixed(1) },
        { label: 'Minimum Days Available', value: minimum },
        { label: 'Coverage Impact', value: `${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%` },
      ]}
    />
  )
}

export function DaysModifiedPanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.days_modified > 0),
    [filteredData]
  )

  if (isLoading) return <LoadingPanel />

  const average = records.length ? records.reduce((sum, record) => sum + record.days_modified, 0) / records.length : 0
  const totalDays = records.reduce((sum, record) => sum + record.days_modified, 0)

  return (
    <ConditionPanel
      title="Days Modified"
      description="This panel highlights Cell-KPI with modified history. These records are analytically important because data corrections may alter the expected baseline."
      records={[...records].sort((a, b) => b.days_modified - a.days_modified)}
      onClick={setSelectedCell}
      color="hsl(var(--warning))"
      valueField="days_modified"
      valueLabel="Modified Days"
      chartMode="sum"
      statCards={[
        { label: 'Affected Cell-KPI', value: records.length.toLocaleString(), accent: 'text-warning' },
        { label: 'Average Days Modified', value: average.toFixed(1) },
        { label: 'Total Modified Days', value: totalDays.toLocaleString() },
        { label: 'Impact Share', value: `${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%` },
      ]}
    />
  )
}

export function TrendChangePanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.trend_change === true),
    [filteredData]
  )

  if (isLoading) return <LoadingPanel />

  return (
    <ConditionPanel
      title="Trend Change"
      description="Trend Change marks Cell-KPI where the anomaly model detected a structural shift in baseline behavior. These records are excluded by condition and should be interpreted as model adaptation rather than outage."
      records={records}
      onClick={setSelectedCell}
      color="hsl(var(--chart-4))"
      statCards={[
        { label: 'Affected Cell-KPI', value: records.length.toLocaleString(), accent: 'text-chart-4' },
        { label: 'Top Impact Share', value: `${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%` },
        { label: 'Unique Nodes', value: new Set(records.map((record) => record.node_name)).size.toLocaleString() },
        { label: 'Unique Metrics', value: new Set(records.map((record) => record.metric)).size.toLocaleString() },
      ]}
      badgeLabel="Trend Change"
    />
  )
}

export function InsufficientHistoryPanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.insufficient_history),
    [filteredData]
  )

  if (isLoading) return <LoadingPanel />

  const averageHistory = records.length
    ? records.reduce((sum, record) => sum + (record.historical_days_available ?? 0), 0) / records.length
    : 0

  return (
    <ConditionPanel
      title="Insufficient History"
      description="These exclusions occur when the historical window is not deep enough to support robust anomaly detection for the selected Cell-KPI."
      records={[...records].sort((a, b) => (a.historical_days_available ?? 0) - (b.historical_days_available ?? 0))}
      onClick={setSelectedCell}
      color="hsl(var(--muted-foreground))"
      valueField="historical_days_available"
      valueLabel="History Days"
      statCards={[
        { label: 'Excluded Cell-KPI', value: records.length.toLocaleString(), accent: 'text-foreground' },
        { label: 'Average History Days', value: averageHistory.toFixed(1) },
        { label: 'Unique Cells', value: new Set(records.map((record) => record.cell)).size.toLocaleString() },
        { label: 'Impact Share', value: `${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%` },
      ]}
    />
  )
}

export function InsufficientRopsPanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.insufficient_rops),
    [filteredData]
  )

  if (isLoading) return <LoadingPanel />

  const averageRops = records.length
    ? records.reduce((sum, record) => sum + (record.num_rops_available ?? 0), 0) / records.length
    : 0

  return (
    <ConditionPanel
      title="Insufficient ROPs"
      description="This view isolates Cell-KPI with too few ROP samples to support reliable quality evaluation. Use it to detect where traffic sparsity drives exclusions."
      records={[...records].sort((a, b) => (a.num_rops_available ?? 0) - (b.num_rops_available ?? 0))}
      onClick={setSelectedCell}
      color="hsl(var(--chart-3))"
      valueField="num_rops_available"
      valueLabel="ROPs"
      statCards={[
        { label: 'Excluded Cell-KPI', value: records.length.toLocaleString(), accent: 'text-chart-3' },
        { label: 'Average ROPs Available', value: averageRops.toFixed(1) },
        { label: 'Unique Nodes', value: new Set(records.map((record) => record.node_name)).size.toLocaleString() },
        { label: 'Impact Share', value: `${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%` },
      ]}
    />
  )
}

export function ActivityCriteriaPanel() {
  const { filteredData, setSelectedCell, isLoading } = useData()

  const records = useMemo(
    () => filteredData.filter((record) => record.activity_criteria),
    [filteredData]
  )

  const modulatorData = useMemo(() => aggregateByField(records, 'modulator_kpi', 10), [records])
  const topCells = useMemo(() => aggregateByField(records, 'cell', 10), [records])
  const topVendors = useMemo(() => aggregateByField(records, 'supplier', 8), [records])

  if (isLoading) return <LoadingPanel />

  return (
    <div className="space-y-6">
      <Card className="border-primary/15 bg-primary/5 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Activity Criteria</span> groups exclusions caused by modulator KPIs. This section helps analysts understand which traffic or behavioral modulators are driving records out of the evaluation window.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard label="Excluded Cell-KPI" value={records.length.toLocaleString()} accent="text-primary" />
        <SummaryStatCard label="Top Modulator KPIs" value={modulatorData.length.toLocaleString()} />
        <SummaryStatCard label="Affected Cells" value={new Set(records.map((record) => record.cell)).size.toLocaleString()} />
        <SummaryStatCard label="Impact Share" value={`${((records.length / (filteredData.length || 1)) * 100).toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <VerticalBarCard title="Top Modulator KPIs Causing Exclusions" data={modulatorData} color="hsl(var(--primary))" />
        <VerticalBarCard title="Cells with Most Activity Criteria Exclusions" data={topCells} color="hsl(var(--chart-2))" />
        <VerticalBarCard title="Vendors with Most Activity Criteria Exclusions" data={topVendors} color="hsl(var(--chart-3))" />
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Detalle de Activity Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  {['Celda', 'Métrica', 'Anomalía', 'Modulator KPI', 'Valor', 'Condición'].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map((record, index) => (
                  <tr
                    key={`${record.cell}-${record.metric}-${index}`}
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() => setSelectedCell(record)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{record.cell}</td>
                    <td className="px-4 py-3 text-xs">{formatMetricName(record.metric)}</td>
                    <td className="px-4 py-3 text-xs text-center">{record.anomaly_detected}</td>
                    <td className="px-4 py-3 text-xs">{record.modulator_kpi ?? 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{record.value_modulator_kpi ?? 'N/D'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{record.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
