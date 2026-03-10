'use client'

import { DataProvider, useData } from '@/lib/data-context'
import { DashboardHeader } from '@/components/dashboard/header'
import { FiltersPanel } from '@/components/dashboard/filters-panel'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { OverviewCharts } from '@/components/dashboard/overview-charts'
import { RankingTables } from '@/components/dashboard/ranking-tables'
import { DataTable } from '@/components/dashboard/data-table'
import { CellDetailPanel } from '@/components/dashboard/cell-detail-panel'
import { PanelTabs } from '@/components/dashboard/panel-tabs'
import { DaysAvailablePanel, DaysModifiedPanel, TrendChangePanel } from '@/components/dashboard/metric-panels'
import { Spinner } from '@/components/ui/spinner'

function DashboardContent() {
  const { activeTab, isLoading, error } = useData()

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-destructive text-lg font-medium mb-2">Error Loading Data</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <FiltersPanel />

      <main className="p-6 space-y-6">
        {/* Summary Metrics */}
        <SummaryCards />

        {/* Panel Tabs */}
        <div className="pt-2">
          <PanelTabs />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {/* Tab Content */}
        {!isLoading && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <OverviewCharts />
                <RankingTables />
                <DataTable />
              </div>
            )}

            {activeTab === 'days-available' && <DaysAvailablePanel />}
            {activeTab === 'days-modified' && <DaysModifiedPanel />}
            {activeTab === 'trend-change' && <TrendChangePanel />}
          </>
        )}
      </main>

      {/* Cell Detail Panel */}
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
