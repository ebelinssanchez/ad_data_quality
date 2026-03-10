'use client'

import { Activity, CalendarClock, History, RadioTower, TrendingUp, Waypoints } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useData } from '@/lib/data-context'
import type { PanelTab } from '@/lib/types'

type MetricCardConfig = {
  title: string
  subtitle: string
  affected: number
  percentage: number
  tab: PanelTab
  icon: React.ElementType
  accentClass: string
}

function MetricCard({ title, subtitle, affected, percentage, tab, icon: Icon, accentClass }: MetricCardConfig) {
  const { setActiveTab } = useData()

  const openPanel = () => {
    setActiveTab(tab)
    globalThis.document?.getElementById('detailed-panels')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-lg border px-2 py-2 ${accentClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold">{affected.toLocaleString()}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Affected count</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">{percentage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">of filtered Cell-KPI</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={openPanel}>
          Open detailed panel
        </Button>
      </CardContent>
    </Card>
  )
}

export function DQMetricsCards() {
  const { metricStats, isLoading } = useData()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-4 h-8 w-16 rounded bg-muted" />
              <div className="mt-4 h-9 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards: MetricCardConfig[] = [
    {
      title: 'Days Available',
      subtitle: 'Cell-KPI with low historical availability',
      affected: metricStats.daysAvailable.affected,
      percentage: metricStats.daysAvailable.percentage,
      tab: 'days-available',
      icon: CalendarClock,
      accentClass: 'border-chart-1/20 bg-chart-1/10 text-chart-1',
    },
    {
      title: 'Days Modified',
      subtitle: 'Cell-KPI with corrected historical days',
      affected: metricStats.daysModified.affected,
      percentage: metricStats.daysModified.percentage,
      tab: 'days-modified',
      icon: Activity,
      accentClass: 'border-warning/20 bg-warning/10 text-warning',
    },
    {
      title: 'Trend Change',
      subtitle: 'Cell-KPI with baseline behavior shifts',
      affected: metricStats.trendChange.affected,
      percentage: metricStats.trendChange.percentage,
      tab: 'trend-change',
      icon: TrendingUp,
      accentClass: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
    },
    {
      title: 'Insufficient History',
      subtitle: 'Records excluded due to missing history depth',
      affected: metricStats.insufficientHistory.affected,
      percentage: metricStats.insufficientHistory.percentage,
      tab: 'insufficient-history',
      icon: History,
      accentClass: 'border-muted-foreground/20 bg-muted text-foreground',
    },
    {
      title: 'Insufficient ROPs',
      subtitle: 'Records with insufficient ROP samples',
      affected: metricStats.insufficientRops.affected,
      percentage: metricStats.insufficientRops.percentage,
      tab: 'insufficient-rops',
      icon: RadioTower,
      accentClass: 'border-chart-3/20 bg-chart-3/10 text-chart-3',
    },
    {
      title: 'Activity Criteria',
      subtitle: 'Exclusions driven by modulator rules',
      affected: metricStats.activityCriteria.affected,
      percentage: metricStats.activityCriteria.percentage,
      tab: 'activity-criteria',
      icon: Waypoints,
      accentClass: 'border-primary/20 bg-primary/10 text-primary',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  )
}
