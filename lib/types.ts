// Data Quality record from bd_kpi_ad_data_quality
export interface DataQualityRecord {
  metric: string
  cell: string
  cgi: string
  trend_change: boolean | null
  days_available: number | null
  days_modified: number
  timestamp: string
  timespan: number
  year: number
  month: number
  day: number
}

// Discards record from bd_kpi_ad_data_quality_discards (extended columns)
export interface DiscardsRecord {
  metric: string
  cell: string
  historical_days_available: number | null
  insufficient_history: boolean
  activity_criteria: boolean
  modulator_kpi: string | null
  value_modulator_kpi: number | null
  insufficient_rops: boolean
  num_rops_available: number | null
}

// Cell inventory from cells_actuals
export interface CellInventory {
  supplier: string
  region: string
  province: string
  site_name: string
  site_id: string
  node_name: string
  cell_name: string
  band: string
  town: string
  sector_type: string
  tech_id: string
  latitude: number
  longitude: number
  is_active: string
}

// Enriched record after joining
export interface EnrichedRecord extends DataQualityRecord {
  // From inventory
  supplier: string
  region: string
  province: string
  site_name: string
  node_name: string
  band: string
  town: string
  tech_id: string
  // From discards (if available)
  historical_days_available: number | null
  insufficient_history: boolean
  activity_criteria: boolean
  modulator_kpi: string | null
  value_modulator_kpi: number | null
  insufficient_rops: boolean
  num_rops_available: number | null
  // Computed status
  dq_status: 'Clear' | 'Flagged' | 'Excluded by Condition'
  condition: string
  conditions: string[]
}

// Filter state
export interface FilterState {
  dateRange: { start: string | null; end: string | null }
  province: string[]
  region: string[]
  vendor: string[]
  technology: string[]
  metric: string[]
  node: string[]
  cell: string[]
  status: string[]
  condition: string[]
}

// Summary stats
export interface SummaryStats {
  totalCellKPI: number
  flagged: number
  clear: number
  excluded: number
  coverageRate: number
}

// Metric stats
export interface MetricStats {
  daysAvailable: { affected: number; percentage: number }
  daysModified: { affected: number; percentage: number }
  trendChange: { affected: number; percentage: number }
  insufficientHistory: { affected: number; percentage: number }
  insufficientRops: { affected: number; percentage: number }
  activityCriteria: { affected: number; percentage: number }
}

// Chart data types
export interface BarChartData {
  name: string
  value: number
  fill?: string
}

export interface PieChartData {
  name: string
  value: number
  fill?: string
}

// Tab panel names
export type PanelTab = 
  | 'overview' 
  | 'days-available' 
  | 'days-modified' 
  | 'trend-change'
  | 'activity-criteria'
