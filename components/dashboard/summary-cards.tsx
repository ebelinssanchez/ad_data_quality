'use client'
import { AlertTriangle, BarChart3, CheckCircle2, Info, Percent, ShieldBan } from 'lucide-react'
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

interface LevelStats {
  total: number
  flagged: number
  clear: number
  excluded: number
  coverageRate: number
}

function MetricCard({ title, value, tooltip, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-1.5">
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
          <div className={`rounded-lg p-2.5 ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryLevel({
  title,
  stats,
  entityLabel,
}: {
  title: string
  stats: LevelStats
  entityLabel: 'anomalia' | 'cell-kpi'
}) {
  const coverageColor =
    stats.coverageRate >= 80
      ? 'text-success'
      : stats.coverageRate >= 50
        ? 'text-warning'
        : 'text-destructive'

  const coverageBgColor =
    stats.coverageRate >= 80
      ? 'bg-success/10'
      : stats.coverageRate >= 50
        ? 'bg-warning/10'
        : 'bg-destructive/10'

  const labels =
    entityLabel === 'anomalia'
      ? {
          total: 'Anomalías detectadas',
          flagged: 'Anomalías con problemas de calidad',
          clear: 'Anomalías con datos fiables',
          excluded: 'Anomalías excluidas por reglas',
          coverage: 'Cobertura de calidad',
        }
      : {
          total: 'Cell-KPI evaluados',
          flagged: 'Cell-KPI con problemas de calidad',
          clear: 'Cell-KPI con datos fiables',
          excluded: 'Cell-KPI excluidos por reglas',
          coverage: 'Cobertura de calidad del dato',
        }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title={labels.total}
          value={stats.total}
          icon={BarChart3}
          color="text-primary"
          bgColor="bg-primary/10"
          tooltip={`Total de ${entityLabel}s en la vista filtrada.`}
        />
        <MetricCard
          title={labels.flagged}
          value={stats.flagged}
          icon={AlertTriangle}
          color="text-warning"
          bgColor="bg-warning/10"
          tooltip={`${entityLabel}s en estado Afectado o Excluido por condicion.`}
        />
        <MetricCard
          title={labels.clear}
          value={stats.clear}
          icon={CheckCircle2}
          color="text-success"
          bgColor="bg-success/10"
          tooltip={`${entityLabel}s en estado Normal.`}
        />
        <MetricCard
          title={labels.excluded}
          value={stats.excluded}
          icon={ShieldBan}
          color="text-muted-foreground"
          bgColor="bg-muted/80"
          tooltip={`${entityLabel}s excluidos por reglas de calidad del dato.`}
        />
        <MetricCard
          title={labels.coverage}
          value={`${stats.coverageRate.toFixed(1)}%`}
          icon={Percent}
          color={coverageColor}
          bgColor={coverageBgColor}
          tooltip={`Porcentaje de ${entityLabel}s en estado Normal.`}
        />
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { anomalySummaryStats, summaryStats, isLoading } = useData()

  const cellKpiStats: LevelStats = {
    total: summaryStats.totalCellKPI,
    flagged: summaryStats.flagged,
    clear: summaryStats.clear,
    excluded: summaryStats.excluded,
    coverageRate: summaryStats.coverageRate,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 w-56 rounded bg-muted" />
            <div className="mt-3 h-10 rounded bg-muted" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 w-64 rounded bg-muted" />
            <div className="mt-3 h-10 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryLevel
        title="Resumen de anomalías detectadas"
        stats={anomalySummaryStats}
        entityLabel="anomalia"
      />
      <SummaryLevel
        title="Diagnóstico de calidad del dato (Cell-KPI)"
        stats={cellKpiStats}
        entityLabel="cell-kpi"
      />
    </div>
  )
}
