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
} from 'recharts'
import { useData } from '@/lib/data-context'
import {
  aggregateFlaggedByField,
  getConditionCounts,
  getRopsDistribution,
} from '@/lib/data-loader'

function ChartCard({
  title,
  data,
  color,
  layout = 'vertical',
}: {
  title: string
  data: { name: string; value: number }[]
  color: string
  layout?: 'vertical' | 'horizontal'
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={layout}
              margin={layout === 'vertical' ? { left: 10, right: 20 } : { left: 0, right: 10, top: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={layout === 'vertical'} vertical={layout !== 'vertical'} />
              {layout === 'vertical' ? (
                <>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 18 ? `${value.slice(0, 18)}...` : value}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 14 ? `${value.slice(0, 14)}...` : value}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                </>
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="value" fill={color} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewCharts() {
  const { filteredData, isLoading } = useData()

  const topProvinces = useMemo(() => aggregateFlaggedByField(filteredData, 'province', 8), [filteredData])
  const topRegions = useMemo(() => aggregateFlaggedByField(filteredData, 'region', 8), [filteredData])
  const topVendors = useMemo(() => aggregateFlaggedByField(filteredData, 'supplier', 8), [filteredData])
  const ropsDistribution = useMemo(() => getRopsDistribution(filteredData), [filteredData])
  const conditionData = useMemo(() => getConditionCounts(filteredData, 8), [filteredData])

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[280px] rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Top Provinces Affected" data={topProvinces} color="hsl(var(--chart-1))" />
      <ChartCard title="Top Regions Affected" data={topRegions} color="hsl(var(--chart-2))" />
      <ChartCard title="Top Vendors Affected" data={topVendors} color="hsl(var(--chart-3))" />
      <ChartCard title="Distribution of ROPs" data={ropsDistribution} color="hsl(var(--chart-4))" layout="horizontal" />
      <ChartCard title="Most Frequent Data Quality Conditions" data={conditionData} color="hsl(var(--primary))" layout="horizontal" />
    </div>
  )
}
