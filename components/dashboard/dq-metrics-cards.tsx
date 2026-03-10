"use client"

import { Clock, History, RefreshCw, TrendingUp, Activity, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CellData } from "@/lib/mock-data"

interface DQMetricsCardsProps {
  cells: CellData[]
}

interface MetricCardProps {
  title: string
  icon: React.ReactNode
  belowThreshold: number
  passingThreshold: number
  total: number
  threshold: string
}

function DQMetricCard({ title, icon, belowThreshold, passingThreshold, total, threshold }: MetricCardProps) {
  const passRate = total > 0 ? (passingThreshold / total) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="font-medium">{belowThreshold}</span>
            <span className="text-muted-foreground text-xs">below threshold</span>
          </div>
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">{passingThreshold}</span>
            <span className="text-muted-foreground text-xs">passing</span>
          </div>
        </div>
        <Progress value={passRate} className="h-1.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {total} cells</span>
          <span>Threshold: {threshold}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function DQMetricsCards({ cells }: DQMetricsCardsProps) {
  // Off-hours ROPs Coverage
  const ropsCells = cells.filter((c) => c.metricType === "Off-Hours ROPs Coverage")
  const ropsBelow = ropsCells.filter((c) => c.status === "Failed").length
  const ropsPassing = ropsCells.filter((c) => c.status === "Passed").length

  // Historical Data Availability
  const histCells = cells.filter((c) => c.metricType === "Historical Data Availability")
  const histBelow = histCells.filter((c) => c.status === "Failed").length
  const histPassing = histCells.filter((c) => c.status === "Passed").length

  // Modified Historical Data
  const modCells = cells.filter((c) => c.metricType === "Modified Historical Data")
  const modBelow = modCells.filter((c) => c.status === "Failed").length
  const modPassing = modCells.filter((c) => c.status === "Passed").length

  // Trend Change Detection
  const trendCells = cells.filter((c) => c.metricType === "Trend Change Detection")
  const trendBelow = trendCells.filter((c) => c.status === "Failed").length
  const trendPassing = trendCells.filter((c) => c.status === "Passed").length

  // Activity Criteria
  const actCells = cells.filter((c) => c.metricType === "Activity Criteria")
  const actBelow = actCells.filter((c) => c.status === "Failed").length
  const actPassing = actCells.filter((c) => c.status === "Passed").length

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-3">Data Quality Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <DQMetricCard
          title="Off-Hours ROPs Coverage"
          icon={<Clock className="h-4 w-4 text-primary" />}
          belowThreshold={ropsBelow}
          passingThreshold={ropsPassing}
          total={ropsCells.length}
          threshold="≥80%"
        />
        <DQMetricCard
          title="Insufficient Historical Data"
          icon={<History className="h-4 w-4 text-primary" />}
          belowThreshold={histBelow}
          passingThreshold={histPassing}
          total={histCells.length}
          threshold="≥7 days"
        />
        <DQMetricCard
          title="Modified Historical Data"
          icon={<RefreshCw className="h-4 w-4 text-primary" />}
          belowThreshold={modBelow}
          passingThreshold={modPassing}
          total={modCells.length}
          threshold="0 corrections"
        />
        <DQMetricCard
          title="Trend Change Detection"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          belowThreshold={trendBelow}
          passingThreshold={trendPassing}
          total={trendCells.length}
          threshold="≤15%"
        />
        <DQMetricCard
          title="Activity Criteria Filtering"
          icon={<Activity className="h-4 w-4 text-primary" />}
          belowThreshold={actBelow}
          passingThreshold={actPassing}
          total={actCells.length}
          threshold="≥50%"
        />
      </div>
    </div>
  )
}
