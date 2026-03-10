import Papa from 'papaparse'
import type { DataQualityRecord, DiscardsRecord, CellInventory, EnrichedRecord, FilterState, SummaryStats, MetricStats, BarChartData } from './types'

// Parse CSV data
export async function loadDataQualityCSV(): Promise<DataQualityRecord[]> {
  const response = await fetch('/data/bd_kpi_ad_data_quality.csv')
  const csvText = await response.text()
  
  return new Promise((resolve) => {
    Papa.parse<DataQualityRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transform: (value, field) => {
        if (value === 'null' || value === '') return null
        if (field === 'trend_change') return value === 'true'
        return value
      },
      complete: (results) => {
        resolve(results.data)
      }
    })
  })
}

export async function loadDiscardsCSV(): Promise<DiscardsRecord[]> {
  try {
    const response = await fetch('/data/bd_kpi_ad_data_quality_discards.csv')
    const csvText = await response.text()
    
    // Check if the file has discards-specific columns
    const firstLine = csvText.split('\n')[0]
    if (!firstLine.includes('historical_days_available') && !firstLine.includes('activity_criteria')) {
      // File doesn't have discards columns, return empty
      return []
    }
    
    return new Promise((resolve) => {
      Papa.parse<DiscardsRecord>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transform: (value, field) => {
          if (value === 'null' || value === '') return null
          if (['insufficient_history', 'activity_criteria', 'insufficient_rops'].includes(field)) {
            return value === 'true' || value === true
          }
          return value
        },
        complete: (results) => {
          resolve(results.data)
        }
      })
    })
  } catch {
    return []
  }
}

export async function loadCellsInventoryCSV(): Promise<CellInventory[]> {
  const response = await fetch('/data/cells_actuals.csv')
  const csvText = await response.text()
  
  return new Promise((resolve) => {
    Papa.parse<CellInventory>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data)
      }
    })
  })
}

// Create a lookup map for cells inventory using cell_name
export function createCellLookup(inventory: CellInventory[]): Map<string, CellInventory> {
  const lookup = new Map<string, CellInventory>()
  
  for (const cell of inventory) {
    if (cell.cell_name) {
      lookup.set(cell.cell_name, cell)
    }
  }
  
  return lookup
}

// Create a lookup map for discards using cell+metric key
export function createDiscardsLookup(discards: DiscardsRecord[]): Map<string, DiscardsRecord> {
  const lookup = new Map<string, DiscardsRecord>()
  
  for (const record of discards) {
    if (record.cell && record.metric) {
      const key = `${record.cell}|${record.metric}`
      lookup.set(key, record)
    }
  }
  
  return lookup
}

// Determine DQ status and conditions based on the data
function determineDQStatus(
  record: DataQualityRecord, 
  discards: DiscardsRecord | undefined
): { dq_status: 'Clear' | 'Flagged' | 'Excluded by Condition', condition: string, conditions: string[] } {
  const conditions: string[] = []
  
  // Check trend_change
  if (record.trend_change === true) {
    conditions.push('Trend Change')
  }
  
  // Check days_modified
  if (record.days_modified && record.days_modified > 0) {
    conditions.push('Days Modified')
  }
  
  // Check days_available (flagged if less than 14 days of historical data)
  if (record.days_available !== null && record.days_available < 14) {
    conditions.push('Low Days Available')
  }
  
  // Check discards data if available
  if (discards) {
    if (discards.insufficient_history) {
      conditions.push('Insufficient History')
    }
    if (discards.insufficient_rops) {
      conditions.push('Insufficient ROPs')
    }
    if (discards.activity_criteria) {
      conditions.push('Activity Criteria')
    }
  }
  
  if (conditions.length === 0) {
    return { dq_status: 'Clear', condition: 'None', conditions: [] }
  }
  
  // Determine if it's "Excluded by Condition" or just "Flagged"
  const excludingConditions = ['Trend Change', 'Low Days Available', 'Insufficient History', 'Insufficient ROPs', 'Activity Criteria']
  const hasExcludingCondition = conditions.some(c => excludingConditions.includes(c))
  
  return {
    dq_status: hasExcludingCondition ? 'Excluded by Condition' : 'Flagged',
    condition: conditions.join(', '),
    conditions
  }
}

// Enrich data quality records with inventory and discards information
export function enrichDataQuality(
  records: DataQualityRecord[], 
  cellLookup: Map<string, CellInventory>,
  discardsLookup: Map<string, DiscardsRecord>
): EnrichedRecord[] {
  return records.map(record => {
    // Try to find matching cell in inventory (using cell name from metrics to match cell_name in inventory)
    const inventory = cellLookup.get(record.cell)
    const discardsKey = `${record.cell}|${record.metric}`
    const discards = discardsLookup.get(discardsKey)
    const { dq_status, condition, conditions } = determineDQStatus(record, discards)
    
    return {
      ...record,
      // From inventory
      supplier: inventory?.supplier || 'Unknown',
      region: inventory?.region || 'Unknown',
      province: inventory?.province || 'Unknown',
      site_name: inventory?.site_name || 'Unknown',
      node_name: inventory?.node_name || 'Unknown',
      band: inventory?.band || 'Unknown',
      town: inventory?.town || 'Unknown',
      tech_id: inventory?.tech_id || 'Unknown',
      // From discards
      historical_days_available: discards?.historical_days_available ?? null,
      insufficient_history: discards?.insufficient_history ?? false,
      activity_criteria: discards?.activity_criteria ?? false,
      modulator_kpi: discards?.modulator_kpi ?? null,
      value_modulator_kpi: discards?.value_modulator_kpi ?? null,
      insufficient_rops: discards?.insufficient_rops ?? false,
      num_rops_available: discards?.num_rops_available ?? null,
      // Computed
      dq_status,
      condition,
      conditions
    }
  })
}

// Apply filters to data
export function applyFilters(data: EnrichedRecord[], filters: FilterState): EnrichedRecord[] {
  return data.filter(record => {
    // Province filter
    if (filters.province.length > 0 && !filters.province.includes(record.province)) {
      return false
    }
    
    // Region filter
    if (filters.region.length > 0 && !filters.region.includes(record.region)) {
      return false
    }
    
    // Vendor filter
    if (filters.vendor.length > 0 && !filters.vendor.includes(record.supplier)) {
      return false
    }
    
    // Technology/Band filter
    if (filters.technology.length > 0 && !filters.technology.includes(record.band)) {
      return false
    }
    
    // Metric filter
    if (filters.metric.length > 0 && !filters.metric.includes(record.metric)) {
      return false
    }
    
    // Node filter
    if (filters.node.length > 0 && !filters.node.includes(record.node_name)) {
      return false
    }
    
    // Cell filter
    if (filters.cell.length > 0 && !filters.cell.includes(record.cell)) {
      return false
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(record.dq_status)) {
      return false
    }
    
    // Condition filter
    if (filters.condition.length > 0) {
      const hasMatchingCondition = filters.condition.some(c => record.conditions.includes(c))
      if (!hasMatchingCondition) return false
    }
    
    return true
  })
}

// Calculate summary statistics
export function calculateSummaryStats(data: EnrichedRecord[]): SummaryStats {
  const total = data.length
  const flagged = data.filter(r => r.dq_status === 'Flagged').length
  const excluded = data.filter(r => r.dq_status === 'Excluded by Condition').length
  const clear = data.filter(r => r.dq_status === 'Clear').length
  
  return {
    totalCellKPI: total,
    flagged,
    clear,
    excluded,
    coverageRate: total > 0 ? ((clear / total) * 100) : 0
  }
}

// Calculate metric-specific statistics
export function calculateMetricStats(data: EnrichedRecord[]): MetricStats {
  const total = data.length
  
  const daysAvailableAffected = data.filter(r => r.days_available !== null && r.days_available < 14).length
  const daysModifiedAffected = data.filter(r => r.days_modified > 0).length
  const trendChangeAffected = data.filter(r => r.trend_change === true).length
  const insufficientHistoryAffected = data.filter(r => r.insufficient_history).length
  const insufficientRopsAffected = data.filter(r => r.insufficient_rops).length
  const activityCriteriaAffected = data.filter(r => r.activity_criteria).length
  
  return {
    daysAvailable: { 
      affected: daysAvailableAffected, 
      percentage: total > 0 ? (daysAvailableAffected / total) * 100 : 0 
    },
    daysModified: { 
      affected: daysModifiedAffected, 
      percentage: total > 0 ? (daysModifiedAffected / total) * 100 : 0 
    },
    trendChange: { 
      affected: trendChangeAffected, 
      percentage: total > 0 ? (trendChangeAffected / total) * 100 : 0 
    },
    insufficientHistory: { 
      affected: insufficientHistoryAffected, 
      percentage: total > 0 ? (insufficientHistoryAffected / total) * 100 : 0 
    },
    insufficientRops: { 
      affected: insufficientRopsAffected, 
      percentage: total > 0 ? (insufficientRopsAffected / total) * 100 : 0 
    },
    activityCriteria: { 
      affected: activityCriteriaAffected, 
      percentage: total > 0 ? (activityCriteriaAffected / total) * 100 : 0 
    }
  }
}

// Get unique values for filters
export function getUniqueValues(data: EnrichedRecord[]): {
  provinces: string[]
  regions: string[]
  vendors: string[]
  technologies: string[]
  metrics: string[]
  nodes: string[]
  cells: string[]
  statuses: string[]
  conditions: string[]
} {
  const allConditions = new Set<string>()
  data.forEach(r => r.conditions.forEach(c => allConditions.add(c)))
  
  return {
    provinces: [...new Set(data.map(r => r.province))].filter(Boolean).sort(),
    regions: [...new Set(data.map(r => r.region))].filter(Boolean).sort(),
    vendors: [...new Set(data.map(r => r.supplier))].filter(Boolean).sort(),
    technologies: [...new Set(data.map(r => r.band))].filter(Boolean).sort(),
    metrics: [...new Set(data.map(r => r.metric))].filter(Boolean).sort(),
    nodes: [...new Set(data.map(r => r.node_name))].filter(Boolean).sort(),
    cells: [...new Set(data.map(r => r.cell))].filter(Boolean).sort(),
    statuses: ['Clear', 'Flagged', 'Excluded by Condition'],
    conditions: [...allConditions].sort()
  }
}

// Aggregation functions for charts
export function aggregateByField(data: EnrichedRecord[], field: keyof EnrichedRecord, limit = 10): BarChartData[] {
  const counts = new Map<string, number>()
  
  for (const record of data) {
    const key = String(record[field] || 'Unknown')
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

export function aggregateFlaggedByField(data: EnrichedRecord[], field: keyof EnrichedRecord, limit = 10): BarChartData[] {
  const flaggedData = data.filter(r => r.dq_status !== 'Clear')
  return aggregateByField(flaggedData, field, limit)
}

export function aggregateByDaysModified(
  data: EnrichedRecord[],
  field: keyof EnrichedRecord,
  limit = 10
): BarChartData[] {
  const totals = new Map<string, number>()

  for (const record of data) {
    const key = String(record[field] || 'Unknown')
    totals.set(key, (totals.get(key) || 0) + record.days_modified)
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

export function aggregateByCondition(data: EnrichedRecord[], limit = 10): BarChartData[] {
  const counts = new Map<string, number>()
  
  for (const record of data) {
    for (const cond of record.conditions) {
      counts.set(cond, (counts.get(cond) || 0) + 1)
    }
  }
  
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

export function getConditionCounts(data: EnrichedRecord[], limit = 10): BarChartData[] {
  const flaggedData = data.filter(r => r.dq_status !== 'Clear')
  return aggregateByCondition(flaggedData, limit)
}

export function aggregateByModulatorKPI(data: EnrichedRecord[], limit = 10): BarChartData[] {
  const counts = new Map<string, number>()
  
  for (const record of data) {
    if (record.activity_criteria && record.modulator_kpi) {
      counts.set(record.modulator_kpi, (counts.get(record.modulator_kpi) || 0) + 1)
    }
  }
  
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

export function getRopsDistribution(data: EnrichedRecord[]): BarChartData[] {
  const buckets = new Map<string, number>()
  
  for (const record of data) {
    if (record.num_rops_available !== null) {
      const bucket = Math.floor(record.num_rops_available / 10) * 10
      const label = `${bucket}-${bucket + 9}`
      buckets.set(label, (buckets.get(label) || 0) + 1)
    }
  }
  
  return [...buckets.entries()]
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([name, value]) => ({ name, value }))
}

// Export to CSV
export function exportToCSV(data: EnrichedRecord[], filename: string): void {
  const headers = [
    'Province', 'Region', 'Vendor', 'Technology', 'Node', 'Site Name', 'Cell', 'Metric',
    'CGI', 'Days Available', 'Days Modified', 'Historical Days Available', 'ROPs Available',
    'Trend Change', 'Insufficient History', 'Insufficient ROPs', 'Activity Criteria',
    'Modulator KPI', 'Modulator Value', 'DQ Status', 'Condition', 'Timestamp'
  ]
  
  const rows = data.map(r => [
    r.province,
    r.region,
    r.supplier,
    r.band,
    r.node_name,
    r.site_name,
    r.cell,
    r.metric,
    r.cgi,
    r.days_available ?? '',
    r.days_modified,
    r.historical_days_available ?? '',
    r.num_rops_available ?? '',
    r.trend_change ?? '',
    r.insufficient_history ?? '',
    r.insufficient_rops ?? '',
    r.activity_criteria ?? '',
    r.modulator_kpi ?? '',
    r.value_modulator_kpi ?? '',
    r.dq_status,
    r.condition,
    r.timestamp
  ])
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Format metric names for display
export function formatMetricName(metric: string): string {
  return metric
    .replace(/_/g, ' ')
    .replace(/pct/gi, '%')
    .replace(/avg/gi, 'Avg')
    .replace(/volte/gi, 'VoLTE')
    .replace(/bcr/gi, 'BCR')
    .replace(/dcr/gi, 'DCR')
    .replace(/nsa/gi, 'NSA')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Get top affected items
export function getTopAffectedNodes(data: EnrichedRecord[], limit = 10): { name: string; flagged: number; total: number }[] {
  const nodeStats = new Map<string, { flagged: number; total: number }>()
  
  for (const record of data) {
    const current = nodeStats.get(record.node_name) || { flagged: 0, total: 0 }
    current.total++
    if (record.dq_status !== 'Clear') {
      current.flagged++
    }
    nodeStats.set(record.node_name, current)
  }
  
  return [...nodeStats.entries()]
    .sort((a, b) => b[1].flagged - a[1].flagged)
    .slice(0, limit)
    .map(([name, stats]) => ({ name, ...stats }))
}

export function getTopAffectedCells(data: EnrichedRecord[], limit = 10): { name: string; conditions: string[]; metric: string }[] {
  const cellConditions = new Map<string, { conditions: Set<string>; metric: string }>()
  
  for (const record of data) {
    if (record.dq_status !== 'Clear') {
      const current = cellConditions.get(record.cell) || { conditions: new Set(), metric: record.metric }
      record.conditions.forEach(c => current.conditions.add(c))
      cellConditions.set(record.cell, current)
    }
  }
  
  return [...cellConditions.entries()]
    .sort((a, b) => b[1].conditions.size - a[1].conditions.size)
    .slice(0, limit)
    .map(([name, data]) => ({ name, conditions: [...data.conditions], metric: data.metric }))
}
