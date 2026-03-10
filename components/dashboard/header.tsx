'use client'

import { Activity, Download } from 'lucide-react'
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
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Anomaly Detection
          </h1>
          <p className="text-sm text-muted-foreground">
            Data Quality Insights Dashboard
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Current View
        </Button>
      </div>
    </header>
  )
}
