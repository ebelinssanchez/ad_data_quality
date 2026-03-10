'use client'

import { BarChart3, CheckCircle2, AlertTriangle, XCircle, Percent, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useData } from '@/lib/data-context'

interface MetricCardProps {
  title: string
  value: string | number
  tooltip: string
  icon: React.ElementType
  color: string
  bgColor: string
}

function MetricCard({ title, value, tooltip, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards() {
  const { summaryStats, isLoading } = useData()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-4 bg-muted rounded w-28 mb-3" />
              <div className="h-8 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const coverageColor = summaryStats.coverageRate >= 80 
    ? 'text-success' 
    : summaryStats.coverageRate >= 50 
      ? 'text-warning' 
      : 'text-destructive'

  const coverageBgColor = summaryStats.coverageRate >= 80 
    ? 'bg-success/10' 
    : summaryStats.coverageRate >= 50 
      ? 'bg-warning/10' 
      : 'bg-destructive/10'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Total Cell-KPI Evaluated"
        value={summaryStats.totalCellKPI}
        icon={BarChart3}
        color="text-primary"
        bgColor="bg-primary/10"
        tooltip="Total number of cell-KPI pairs processed in the data quality analysis"
      />
      <MetricCard
        title="Cell-KPI Flagged"
        value={summaryStats.flagged}
        icon={AlertTriangle}
        color="text-warning"
        bgColor="bg-warning/10"
        tooltip="Cell-KPI pairs with data quality conditions that require attention"
      />
      <MetricCard
        title="Cell-KPI Clear"
        value={summaryStats.clear}
        icon={CheckCircle2}
        color="text-success"
        bgColor="bg-success/10"
        tooltip="Cell-KPI pairs that passed all data quality checks"
      />
      <MetricCard
        title="Excluded by Conditions"
        value={summaryStats.excluded}
        icon={XCircle}
        color="text-muted-foreground"
        bgColor="bg-muted"
        tooltip="Cell-KPI pairs excluded due to specific conditions like trend change or insufficient history"
      />
      <MetricCard
        title="Data Quality Coverage"
        value={`${summaryStats.coverageRate.toFixed(1)}%`}
        icon={Percent}
        color={coverageColor}
        bgColor={coverageBgColor}
        tooltip="Percentage of cell-KPI pairs that passed data quality checks"
      />
    </div>
  )
}
