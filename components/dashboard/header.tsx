'use client'

import { Download, RadioTower, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useData } from '@/lib/data-context'
import { exportToCSV } from '@/lib/data-loader'

export function DashboardHeader() {
  const { filteredData, activeTab } = useData()
  
  const handleExport = () => {
    const filename = `data-quality-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(filteredData, filename)
  }
  
  return (
    <header className="border-b border-border bg-[linear-gradient(135deg,rgba(38,86,217,0.08),rgba(255,255,255,0.95),rgba(28,163,122,0.08))] px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-sm">
            <RadioTower className="h-5 w-5" />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Analítica Telecom
              </span>
              <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-success">
                Calidad del dato
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Control de Calidad de Anomalías RAN
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisión operativa de anomalías detectadas y su fiabilidad de dato.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-border bg-card/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              Espacio de optimización
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Exporta en cualquier momento la vista filtrada.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-11 px-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar vista actual
          </Button>
        </div>
      </div>
    </header>
  )
}
