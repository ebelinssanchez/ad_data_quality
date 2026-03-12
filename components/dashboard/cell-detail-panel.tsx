'use client'

import { X, MapPin, Radio, Activity, Calendar, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useData } from '@/lib/data-context'
import { formatMetricName } from '@/lib/data-loader'

export function CellDetailPanel() {
  const { selectedCell, setSelectedCell } = useData()

  if (!selectedCell) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Normal':
        return <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>
      case 'Afectado':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Afectado</Badge>
      case 'Excluido por condición':
        return <Badge variant="secondary">Excluido por condición</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Sheet open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">Detalle de celda</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatMetricName(selectedCell.metric)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCell(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Estado DQ:</span>
            {getStatusBadge(selectedCell.dq_status)}
          </div>

          <Separator />

          {/* Network Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Network Information
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cell Name</p>
                <p className="text-sm font-mono font-medium break-all">{selectedCell.cell}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">CGI</p>
                <p className="text-sm font-mono">{selectedCell.cgi ?? 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Node</p>
                <p className="text-sm font-medium">{selectedCell.node_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Site</p>
                <p className="text-sm">{selectedCell.site_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm capitalize">{selectedCell.supplier}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Technology</p>
                <p className="text-sm">{selectedCell.band}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Province</p>
                <p className="text-sm font-medium">{selectedCell.province}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="text-sm">{selectedCell.region}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Town</p>
              <p className="text-sm">{selectedCell.town}</p>
            </div>
          </div>

          <Separator />

          {/* Metric Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Metric Details
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Metric</p>
                <p className="text-sm font-medium">{formatMetricName(selectedCell.metric)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Raw Name</p>
                <p className="text-sm font-mono text-xs">{selectedCell.metric}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Days Available</p>
                <p className="text-sm font-mono">
                  {selectedCell.days_available ?? 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Days Modified</p>
                <p className="text-sm font-mono font-medium">
                  {selectedCell.days_modified}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Trend Change</p>
              <p className="text-sm">
                {selectedCell.trend_change === true 
                  ? <Badge variant="secondary">Yes - New Normality Detected</Badge>
                  : <span className="text-muted-foreground">No</span>
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Historical Days Available</p>
                <p className="text-sm font-mono">{selectedCell.historical_days_available ?? 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ROPs Available</p>
                <p className="text-sm font-mono">{selectedCell.num_rops_available ?? 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modulator KPI</p>
                <p className="text-sm">{selectedCell.modulator_kpi ?? 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modulator Value</p>
                <p className="text-sm font-mono">{selectedCell.value_modulator_kpi ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Quality Condition */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Data Quality Condition
            </h3>
            
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm">
                {selectedCell.condition === 'Normal' 
                  ? 'No se detectaron condiciones de calidad para esta anomalía.'
                  : selectedCell.condition
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Timestamp */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Timestamp
            </h3>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Analysis Date</p>
              <p className="text-sm font-mono">
                {new Date(selectedCell.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
