'use client'

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
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
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
  const { isLoading, error } = useData()

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <p className="mb-2 text-lg font-medium text-foreground">Dataset loading issue</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(38,86,217,0.04),rgba(248,250,252,1)_18%,rgba(248,250,252,1))]">
      <DashboardHeader />
      <FiltersPanel />

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-6 py-8">
        <section className="space-y-5">
          <SectionHeading
            eyebrow="01"
            title="Global Summary"
            description="Executive snapshot of evaluated Cell-KPI, flagged records, exclusions and clean telecom quality coverage."
          />
          <SummaryCards />
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="02"
            title="Data Quality Metrics"
            description="Operational metric cards showing affected counts, impact percentage and quick access to detailed drill-down panels."
          />
          <DQMetricsCards />
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="03"
            title="Visual Analytics"
            description="Geographic, vendor and condition-level charts designed for rapid analyst scanning across the filtered telecom population."
          />
          <OverviewCharts />
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="04"
            title="Detailed Table"
            description="Primary analyst surface with enriched inventory context, condition filters, sorting and export-ready views."
          />
          <DataTable />
        </section>

        <section id="detailed-panels" className="space-y-5">
          <SectionHeading
            eyebrow="05"
            title="Condition Detail Panels"
            description="Focused drill-downs for each major data quality driver, including the dedicated activity criteria and modulator analysis."
          />
          <PanelTabs />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <DetailedPanels />
          )}
        </section>
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
