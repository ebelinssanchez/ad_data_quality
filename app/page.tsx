'use client'

import { GitBranch, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CellDetailPanel } from '@/components/dashboard/cell-detail-panel'
import { DataTable } from '@/components/dashboard/data-table'
import { DQMetricsCards } from '@/components/dashboard/dq-metrics-cards'
import { FiltersPanel } from '@/components/dashboard/filters-panel'
import { DashboardHeader } from '@/components/dashboard/header'
import {
  ActivityCriteriaPanel,
  DaysAvailablePanel,
  DaysModifiedPanel,
  InsufficientHistoryPanel,
  InsufficientRopsPanel,
  TrendChangePanel,
} from '@/components/dashboard/metric-panels'
import { OverviewCharts } from '@/components/dashboard/overview-charts'
import { PanelTabs } from '@/components/dashboard/panel-tabs'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { Spinner } from '@/components/ui/spinner'
import { DataProvider, useData } from '@/lib/data-context'

function SectionHeading({
  title,
  description,
  helper,
}: {
  title: string
  description: string
  helper?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {helper ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Ayuda contextual"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[280px] text-xs leading-relaxed">{helper}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className="max-w-4xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function DetailedPanels() {
  const { activeTab } = useData()

  switch (activeTab) {
    case 'days-available':
      return <DaysAvailablePanel />
    case 'days-modified':
      return <DaysModifiedPanel />
    case 'trend-change':
      return <TrendChangePanel />
    case 'insufficient-history':
      return <InsufficientHistoryPanel />
    case 'insufficient-rops':
      return <InsufficientRopsPanel />
    case 'activity-criteria':
      return <ActivityCriteriaPanel />
    default:
      return <DaysAvailablePanel />
  }
}

function DashboardContent() {
  const { isLoading, error, filters, filteredData, anomalyRecords } = useData()

  const selectedAnomalyKey = filters.anomaly.length === 1 ? filters.anomaly[0] : null
  const selectedAnomalyRows = selectedAnomalyKey
    ? anomalyRecords.filter((row) => row.anomaly_detected === selectedAnomalyKey)
    : []
  const selectedAnomalyDQRows = selectedAnomalyKey
    ? filteredData.filter((row) => row.anomaly_detected === selectedAnomalyKey)
    : []
  const selectedAnomalyRecord = selectedAnomalyRows[0] ?? null
  const selectedAnomalyHasDQ = selectedAnomalyDQRows.length > 0
  const singleValue = (values: string[]) => {
    const uniq = [...new Set(values.filter(Boolean))]
    if (uniq.length === 1) return uniq[0]
    if (uniq.length === 0) return 'N/D'
    return `Varias (${uniq.length})`
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <p className="mb-2 text-lg font-medium text-foreground">Error de carga de datasets</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(38,86,217,0.04),rgba(248,250,252,1)_18%,rgba(248,250,252,1))]">
      <DashboardHeader />
      <FiltersPanel />

      <main className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] px-6 py-4">
        <Tabs defaultValue="resumen" className="flex h-full min-h-0 w-full flex-col gap-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="calidad">Calidad del dato</TabsTrigger>
            <TabsTrigger value="analisis">Analisis</TabsTrigger>
            <TabsTrigger value="celdas">Celdas y metricas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="min-h-0 overflow-y-auto pr-1">
            <section className="space-y-5">
              <SectionHeading
                title="Resumen de anomalias"
                description="Vision ejecutiva de anomalias detectadas, su fiabilidad y sus exclusiones por calidad del dato."
                helper="Anomalia: evento detectado por el sistema."
              />
              <SummaryCards />
            </section>
          </TabsContent>

          <TabsContent value="calidad" className="min-h-0 overflow-y-auto pr-1">
            <section className="space-y-5">
              <SectionHeading
                title="Calidad del dato asociada a las anomalias"
                description="Diagnostico de historico y exclusiones del pipeline a nivel de Cell-KPI para evaluar si una anomalia debe analizarse o ignorarse."
                helper="Cell-KPI: metrica concreta de una celda usada para evaluar la fiabilidad de una anomalia."
              />
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <GitBranch className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm text-foreground">
                  Las siguientes metricas analizan la calidad de los datos (Cell-KPI) que sustentan las anomalias detectadas.
                </p>
              </div>
              {!selectedAnomalyRecord ? (
                <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                  Modo actual: exploracion global a nivel Cell-KPI (incluye celdas con y sin anomalia clusterizada).
                </div>
              ) : null}
              {selectedAnomalyRecord ? (
                <div className="rounded-xl border border-warning/25 bg-warning/10 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-warning">
                    Modo diagnostico activo: anomalia seleccionada
                  </p>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {selectedAnomalyKey}
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Filas del export para esta anomalia: {selectedAnomalyRows.length}. Cell-KPI mapeados contra DQ: {selectedAnomalyDQRows.length}.
                  </p>
                  {!selectedAnomalyHasDQ ? (
                    <p className="mb-3 text-xs text-warning">
                      Esta anomalia no tiene cruce con calidad del dato por cell/metric en el dataset DQ actual.
                    </p>
                  ) : null}
                  <div className="grid gap-2 text-sm md:grid-cols-3 xl:grid-cols-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Celda</p>
                      <p className="font-medium">{singleValue(selectedAnomalyRows.map((r) => r.cell))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">KPI</p>
                      <p className="font-medium">{singleValue(selectedAnomalyRows.map((r) => r.metric))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nodo</p>
                      <p className="font-medium">{singleValue(selectedAnomalyDQRows.map((r) => r.node_name))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Provincia</p>
                      <p className="font-medium">{singleValue(selectedAnomalyDQRows.map((r) => r.province))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Modulator KPI</p>
                      <p className="font-medium">{singleValue(selectedAnomalyDQRows.map((r) => r.modulator_kpi ?? 'N/D'))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor modulador</p>
                      <p className="font-medium">{singleValue(selectedAnomalyDQRows.map((r) => String(r.value_modulator_kpi ?? 'N/D')))}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              <DQMetricsCards />
              <PanelTabs />
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : (
                <DetailedPanels />
              )}
            </section>
          </TabsContent>

          <TabsContent value="analisis" className="min-h-0 overflow-y-auto pr-1">
            <section className="space-y-5">
              <SectionHeading
                title="Distribucion geografica de anomalias con problemas de calidad"
                description="Vista agregada por provincia, region, vendor y nodo para identificar donde se concentran las anomalias con peor calidad del dato."
              />
              <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                Nivel analitico: anomalia clusterizada (agregada). Si activas el filtro de anomalia, el analisis se centra en ese cluster.
              </div>
              <OverviewCharts />
            </section>
          </TabsContent>

          <TabsContent value="celdas" className="min-h-0 overflow-y-auto pr-1">
            <section className="space-y-5">
              <SectionHeading
                title="Celdas y metricas afectadas"
                description="Detalle operativo de celdas y metricas (Cell-KPI) para inspeccion, filtrado y exportacion."
              />
              <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                Nivel analitico: Cell-KPI operativo. Aqui puedes inspeccionar tanto celdas que dispararon anomalia como celdas sin anomalia clusterizada.
              </div>
              <DataTable />
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <CellDetailPanel />
    </div>
  )
}

export default function DataQualityDashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}
