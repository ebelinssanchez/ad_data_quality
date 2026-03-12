'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { useData } from '@/lib/data-context'
import { aggregateByFieldMapped, getConditionCounts, getRopsDistribution } from '@/lib/data-loader'

type RankingItem = { name: string; value: number }

function RankingBarCard({
  title,
  data,
  color,
  totalBase,
}: {
  title: string
  data: RankingItem[]
  color: string
  totalBase: number
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sin datos suficientes para ranking.
          </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 36, bottom: 8, left: 8 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={190}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value.length > 28 ? `${value.slice(0, 28)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Registros']}
                  labelFormatter={(_, payload) => String(payload?.[0]?.payload?.name ?? '')}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="value" fill={color} barSize={16} radius={[0, 5, 5, 0]}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value: number) => {
                      if (!totalBase) return String(value)
                      const pct = ((value / totalBase) * 100).toFixed(1)
                      return `${value} (${pct}%)`
                    }}
                    style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OverviewCharts() {
  const { filteredData, isLoading } = useData()

  const affectedData = useMemo(
    () => filteredData.filter((row) => row.dq_status !== 'Normal'),
    [filteredData]
  )

  const topProvinces = useMemo(() => aggregateByFieldMapped(affectedData, 'province', 10), [affectedData])
  const topRegions = useMemo(() => aggregateByFieldMapped(affectedData, 'region', 10), [affectedData])
  const topVendors = useMemo(() => aggregateByFieldMapped(affectedData, 'supplier', 10), [affectedData])
  const topNodes = useMemo(() => aggregateByFieldMapped(affectedData, 'node_name', 10), [affectedData])
  const conditionData = useMemo(() => getConditionCounts(affectedData, 10), [affectedData])
  const ropsDistribution = useMemo(() => getRopsDistribution(filteredData).slice(0, 10), [filteredData])

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-52 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[260px] rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <RankingBarCard
        title="Top provincias por anomalías afectadas"
        data={topProvinces}
        color="hsl(var(--chart-1))"
        totalBase={affectedData.length}
      />
      <RankingBarCard
        title="Top regiones por anomalías afectadas"
        data={topRegions}
        color="hsl(var(--chart-2))"
        totalBase={affectedData.length}
      />
      <RankingBarCard
        title="Top vendors con anomalías afectadas"
        data={topVendors}
        color="hsl(var(--chart-3))"
        totalBase={affectedData.length}
      />
      <RankingBarCard
        title="Top nodos con anomalías afectadas"
        data={topNodes}
        color="hsl(var(--chart-4))"
        totalBase={affectedData.length}
      />
      <RankingBarCard
        title="Condiciones de calidad más frecuentes"
        data={conditionData}
        color="hsl(var(--primary))"
        totalBase={affectedData.length}
      />
      <RankingBarCard
        title="Distribución de ROPs"
        data={ropsDistribution}
        color="hsl(var(--chart-4))"
        totalBase={filteredData.length}
      />
    </div>
  )
}
