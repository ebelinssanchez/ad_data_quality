"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import type { CellData } from "@/lib/mock-data"
import { ROPS_THRESHOLD, generateDailyData, generateRopsDistribution, provinces, vendors } from "@/lib/mock-data"
import { useMemo } from "react"

interface ChartsProps {
  cells: CellData[]
}

const COLORS = {
  primary: "hsl(var(--primary))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  destructive: "hsl(var(--destructive))",
  success: "hsl(var(--success))",
}

const vendorColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"]

export function Charts({ cells }: ChartsProps) {
  // Cells discarded by province
  const provinceData = useMemo(() => {
    const failedCells = cells.filter((c) => c.status === "Failed")
    return provinces.map((province) => ({
      province: province.replace(" Region", ""),
      count: failedCells.filter((c) => c.province === province).length,
    }))
  }, [cells])

  // Cells discarded by vendor
  const vendorData = useMemo(() => {
    const failedCells = cells.filter((c) => c.status === "Failed")
    return vendors.map((vendor, index) => ({
      name: vendor,
      value: failedCells.filter((c) => c.vendor === vendor).length,
      fill: vendorColors[index],
    }))
  }, [cells])

  // ROPs distribution data
  const ropsData = useMemo(() => generateRopsDistribution(), [])

  // Daily issues data
  const dailyData = useMemo(() => generateDailyData(14), [])

  const chartConfig = {
    count: {
      label: "Cells",
      color: "hsl(var(--chart-1))",
    },
    issues: {
      label: "Issues",
      color: "hsl(var(--destructive))",
    },
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-3">Visualizations</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Cells Discarded by Province */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cells Discarded by Province</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={provinceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="province" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={COLORS.chart1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Cells Discarded by Vendor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cells Discarded by Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <PieChart>
                <Pie
                  data={vendorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {vendorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Histogram - ROPs Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribution of Off-Hours ROPs Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={ropsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="rops"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "ROPs Count", position: "bottom", offset: -5, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ReferenceLine
                  x={ROPS_THRESHOLD}
                  stroke={COLORS.destructive}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: "Threshold", position: "top", fill: COLORS.destructive, fontSize: 10 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={COLORS.chart2} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Series - Daily Data Quality Issues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Data Quality Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="issues"
                  stroke={COLORS.destructive}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
