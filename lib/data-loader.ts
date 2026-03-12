import Papa from 'papaparse'
import type {
  AnomalyRecord,
  DataQualityRecord,
  DiscardsRecord,
  CellInventory,
  EnrichedRecord,
  FilterState,
  SummaryStats,
  MetricStats,
  BarChartData,
} from './types'

function normalizeKey(value: string | null | undefined): string {
  return String(value ?? '').trim().toUpperCase()
}

function parseDelimited<T>(
  text: string,
  transform?: (value: string, field: string | number) => unknown,
  delimiter = ''
): Promise<T[]> {
  return new Promise((resolve) => {
    Papa.parse<T>(text, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      dynamicTyping: true,
      transform,
      complete: (results) => resolve(results.data),
    })
  })
}

export async function loadAnomaliesCSV(): Promise<AnomalyRecord[]> {
  try {
    const response = await fetch('/data/export_08_03.csv')
    if (!response.ok) return []
    const csvText = await response.text()
    const headerLine = csvText.split('\n')[0] ?? ''
    const semicolonCount = (headerLine.match(/;/g) || []).length
    const tabCount = (headerLine.match(/\t/g) || []).length
    const commaCount = (headerLine.match(/,/g) || []).length
    const delimiter = semicolonCount > commaCount && semicolonCount > tabCount
      ? ';'
      : tabCount > commaCount
        ? '\t'
        : ','

    const rows = await parseDelimited<Record<string, unknown>>(csvText, (value) => {
      if (value === 'null' || value === '') return null
      return value
    }, delimiter)

    const normalizeHeader = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase()

    const pickString = (row: Record<string, unknown>, keys: string[]): string => {
      const byNormalized = new Map<string, unknown>()
      Object.entries(row).forEach(([key, value]) => {
        byNormalized.set(normalizeHeader(key), value)
      })

      for (const key of keys) {
        const raw = byNormalized.get(normalizeHeader(key))
        if (raw === null || raw === undefined) continue
        const value = String(raw).trim()
        if (value) return value
      }
      return ''
    }

    return rows
      .map((row) => {
        // Supports canonical exports and semicolon operational exports.
        const cell = pickString(row, ['cell', 'cell_name', 'celda', 'cellname'])
        const metric = pickString(row, ['metric', 'kpi_desviado', 'metrica', 'kpi', 'kpi_desviado'])
        if (!metric || !cell) return null
        return {
          metric,
          cell,
          timestamp: pickString(row, ['timestamp', 'fecha_procesado', 'fecha']) || null,
          anomaly_detected:
            pickString(row, ['anomaly_detected', 'anomalia', 'anomaly_cluster_name', 'cluster_name']) ||
            'Detectada',
          raw: Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, (v ?? null) as string | number | boolean | null])
          ),
        } satisfies AnomalyRecord
      })
      .filter((row): row is AnomalyRecord => row !== null)
  } catch {
    return []
  }
}

// Parse CSV data
export async function loadDataQualityCSV(): Promise<DataQualityRecord[]> {
  const response = await fetch('/data/bd_kpi_ad_data_quality.csv')
  const csvText = await response.text()
  
  return parseDelimited<DataQualityRecord>(csvText, (value, field) => {
    if (value === 'null' || value === '') return null
    if (field === 'trend_change') return value === 'true'
    return value
  }, '\t')
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
    
    return parseDelimited<DiscardsRecord>(csvText, (value, field) => {
      if (value === 'null' || value === '') return null
      if (['insufficient_history', 'activity_criteria', 'insufficient_rops'].includes(String(field))) {
        return value === 'true' || value === true
      }
      return value
    }, '\t')
  } catch {
    return []
  }
}

export async function loadCellsInventoryCSV(): Promise<CellInventory[]> {
  const response = await fetch('/data/cells_actuals.csv')
  const csvText = await response.text()
  
  return parseDelimited<CellInventory>(csvText)
}

// Create a lookup map for cells inventory using cell_name
export function createCellLookup(inventory: CellInventory[]): Map<string, CellInventory> {
  const lookup = new Map<string, CellInventory>()
  
  for (const cell of inventory) {
    // Inventory must be joined using cells_actuals.cell_name.
    if (cell.cell_name) {
      lookup.set(normalizeKey(cell.cell_name), cell)
    }
  }
  
  return lookup
}

// Create a lookup map for discards using cell+metric key
export function createDiscardsLookup(discards: DiscardsRecord[]): Map<string, DiscardsRecord> {
  const lookup = new Map<string, DiscardsRecord>()
  
  for (const record of discards) {
    if (record.cell && record.metric) {
      const key = `${normalizeKey(record.cell)}|${normalizeKey(record.metric)}`
      lookup.set(key, record)
    }
  }
  
  return lookup
}

export function createDQLookup(records: DataQualityRecord[]): Map<string, DataQualityRecord> {
  const lookup = new Map<string, DataQualityRecord>()

  for (const record of records) {
    if (!record.cell || !record.metric) continue
    const key = `${normalizeKey(record.cell)}|${normalizeKey(record.metric)}`
    const existing = lookup.get(key)
    if (!existing) {
      lookup.set(key, record)
      continue
    }
    const existingTs = existing.timestamp ? new Date(String(existing.timestamp)).getTime() : 0
    const nextTs = record.timestamp ? new Date(String(record.timestamp)).getTime() : 0
    if (nextTs >= existingTs) {
      lookup.set(key, record)
    }
  }

  return lookup
}

export function createUnifiedDQRecords(
  dqRecords: DataQualityRecord[],
  discardsRecords: DiscardsRecord[]
): DataQualityRecord[] {
  // Build one record per cell+metric using historical aggregation:
  // - days_available: minimum non-null value
  // - days_modified: maximum value
  // - trend_change: true if true at least once
  // - timestamp: latest timestamp
  const aggregated = new Map<string, DataQualityRecord>()

  for (const record of dqRecords) {
    if (!record.cell || !record.metric) continue
    const key = `${normalizeKey(record.cell)}|${normalizeKey(record.metric)}`
    const existing = aggregated.get(key)

    if (!existing) {
      aggregated.set(key, { ...record })
      continue
    }

    const existingTs = existing.timestamp ? new Date(String(existing.timestamp)).getTime() : 0
    const nextTs = record.timestamp ? new Date(String(record.timestamp)).getTime() : 0
    const latest = nextTs >= existingTs ? record : existing

    const existingDays = existing.days_available
    const nextDays = record.days_available
    const minDaysAvailable =
      existingDays === null
        ? nextDays
        : nextDays === null
          ? existingDays
          : Math.min(existingDays, nextDays)

    aggregated.set(key, {
      ...latest,
      days_available: minDaysAvailable,
      days_modified: Math.max(existing.days_modified ?? 0, record.days_modified ?? 0),
      trend_change: (existing.trend_change === true) || (record.trend_change === true),
    })
  }

  const keys = new Set<string>([...aggregated.keys()])
  for (const discards of discardsRecords) {
    if (discards.cell && discards.metric) keys.add(`${normalizeKey(discards.cell)}|${normalizeKey(discards.metric)}`)
  }

  return [...keys].map((key) => {
    const existing = aggregated.get(key)
    if (existing) return existing
    const [cell, ...metricParts] = key.split('|')
    const metric = metricParts.join('|')
    return {
      metric,
      cell,
      cgi: null,
      trend_change: null,
      days_available: null,
      days_modified: 0,
      timestamp: '',
      timespan: null,
      year: null,
      month: null,
      day: null,
    } satisfies DataQualityRecord
  })
}

export function createAnomalyLookup(anomalies: AnomalyRecord[]): Map<string, AnomalyRecord> {
  const lookup = new Map<string, AnomalyRecord>()
  for (const anomaly of anomalies) {
    if (!anomaly.cell || !anomaly.metric) continue
    const key = `${normalizeKey(anomaly.cell)}|${normalizeKey(anomaly.metric)}`
    const existing = lookup.get(key)
    if (!existing) {
      lookup.set(key, anomaly)
      continue
    }
    const existingTs = existing.timestamp ? new Date(String(existing.timestamp)).getTime() : 0
    const nextTs = anomaly.timestamp ? new Date(String(anomaly.timestamp)).getTime() : 0
    if (nextTs >= existingTs) lookup.set(key, anomaly)
  }
  return lookup
}

export function createAnomalyCellLookup(anomalies: AnomalyRecord[]): Map<string, AnomalyRecord> {
  const lookup = new Map<string, AnomalyRecord>()
  for (const anomaly of anomalies) {
    if (!anomaly.cell) continue
    const key = normalizeKey(anomaly.cell)
    const existing = lookup.get(key)
    if (!existing) {
      lookup.set(key, anomaly)
      continue
    }
    const existingTs = existing.timestamp ? new Date(String(existing.timestamp)).getTime() : 0
    const nextTs = anomaly.timestamp ? new Date(String(anomaly.timestamp)).getTime() : 0
    if (nextTs >= existingTs) lookup.set(key, anomaly)
  }
  return lookup
}

// Determine DQ status and conditions based on the data
function determineDQStatus(
  record: DataQualityRecord, 
  discards: DiscardsRecord | undefined
): { dq_status: 'Normal' | 'Afectado' | 'Excluido por condición', condition: string, conditions: string[] } {
  const conditions: string[] = []
  
  // Check trend_change
  if (record.trend_change === true) {
    conditions.push('Cambio de tendencia')
  }
  
  // Check days_modified
  if (record.days_modified && record.days_modified > 0) {
    conditions.push('Días modificados')
  }
  
  // Check days_available (flagged if less than 14 days of historical data)
  if (record.days_available !== null && record.days_available < 14) {
    conditions.push('Baja disponibilidad histórica')
  }
  
  // Check discards data if available
  if (discards) {
    if (discards.insufficient_history) {
      conditions.push('Histórico insuficiente')
    }
    if (discards.insufficient_rops) {
      conditions.push('ROPs insuficientes')
    }
    if (discards.activity_criteria) {
      conditions.push('Criterio de actividad')
    }
  }
  
  if (conditions.length === 0) {
    return { dq_status: 'Normal', condition: 'Normal', conditions: [] }
  }
  
  const excludingConditions = [
    'Cambio de tendencia',
    'Baja disponibilidad histórica',
    'Histórico insuficiente',
    'ROPs insuficientes',
    'Criterio de actividad',
  ]
  const hasExcludingCondition = conditions.some(c => excludingConditions.includes(c))
  
  return {
    dq_status: hasExcludingCondition ? 'Excluido por condición' : 'Afectado',
    condition: conditions.join(', '),
    conditions
  }
}

// Enrich data quality records with inventory and discards information
export function enrichDataQuality(
  baseRecords: DataQualityRecord[],
  anomalyLookup: Map<string, AnomalyRecord>,
  anomalyCellLookup: Map<string, AnomalyRecord>,
  cellLookup: Map<string, CellInventory>,
  discardsLookup: Map<string, DiscardsRecord>
): EnrichedRecord[] {
  return baseRecords.map((baseRecord) => {
    const key = `${normalizeKey(baseRecord.cell)}|${normalizeKey(baseRecord.metric)}`
    const anomaly = anomalyLookup.get(key) ?? anomalyCellLookup.get(normalizeKey(baseRecord.cell))
    // metrics.cell = cells_actuals.cell_name
    const inventory = cellLookup.get(normalizeKey(baseRecord.cell))
    const discards = discardsLookup.get(key)
    const { dq_status, condition, conditions } = determineDQStatus(baseRecord, discards)
    
    return {
      ...baseRecord,
      anomaly_detected: anomaly ? anomaly.anomaly_detected : 'Sin contexto',
      anomaly_source_timestamp: anomaly?.timestamp ?? null,
      // From inventory
      supplier: inventory?.supplier || 'Sin mapeo',
      region: inventory?.region || 'Sin mapeo',
      province: inventory?.province || 'Sin mapeo',
      site_name: inventory?.site_name || 'Sin mapeo',
      node_name: inventory?.node_name || 'Sin mapeo',
      band: inventory?.band || 'Sin mapeo',
      town: inventory?.town || 'Sin mapeo',
      tech_id: inventory?.tech_id || 'Sin mapeo',
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
    // Anomaly filter (diagnostic mode)
    if (filters.anomaly.length > 0 && !filters.anomaly.includes(record.anomaly_detected)) {
      return false
    }

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
  const flagged = data.filter(r => r.dq_status !== 'Normal').length
  const excluded = data.filter(r => r.dq_status === 'Excluido por condición').length
  const clear = data.filter(r => r.dq_status === 'Normal').length
  
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
  anomalies: string[]
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
    anomalies: [...new Set(data.map(r => r.anomaly_detected))]
      .filter((v) => Boolean(v) && v !== 'Sin contexto')
      .sort(),
    provinces: [...new Set(data.map(r => r.province))].filter(Boolean).sort(),
    regions: [...new Set(data.map(r => r.region))].filter(Boolean).sort(),
    vendors: [...new Set(data.map(r => r.supplier))].filter(Boolean).sort(),
    technologies: [...new Set(data.map(r => r.band))].filter(Boolean).sort(),
    metrics: [...new Set(data.map(r => r.metric))].filter(Boolean).sort(),
    nodes: [...new Set(data.map(r => r.node_name))].filter(Boolean).sort(),
    cells: [...new Set(data.map(r => r.cell))].filter(Boolean).sort(),
    statuses: ['Normal', 'Afectado', 'Excluido por condición'],
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

export function aggregateByFieldMapped(
  data: EnrichedRecord[],
  field: keyof EnrichedRecord,
  limit = 10
): BarChartData[] {
  const filtered = data.filter((record) => {
    const value = String(record[field] ?? '').trim()
    return value !== '' && value !== 'Unknown' && value !== 'Sin mapeo'
  })
  return aggregateByField(filtered, field, limit)
}

export function aggregateFlaggedByField(data: EnrichedRecord[], field: keyof EnrichedRecord, limit = 10): BarChartData[] {
  const flaggedData = data.filter((r) => {
    if (r.dq_status === 'Normal') return false
    const value = String(r[field] ?? '').trim()
    return value !== '' && value !== 'Unknown' && value !== 'Sin mapeo'
  })
  return aggregateByField(flaggedData, field, limit)
}

// Aggregate flagged records by field using unique impacted cells (not raw row count).
// This avoids "total-like" charts when a few cells have many KPI rows.
export function aggregateFlaggedUniqueCellsByField(
  data: EnrichedRecord[],
  field: keyof EnrichedRecord,
  limit = 10
): BarChartData[] {
  const cellsByGroup = new Map<string, Set<string>>()

  for (const record of data) {
    if (record.dq_status === 'Normal') continue

    const group = String(record[field] || 'Unknown')
    if (!group || group === 'Unknown' || group === 'Sin mapeo') continue

    if (!cellsByGroup.has(group)) {
      cellsByGroup.set(group, new Set<string>())
    }
    cellsByGroup.get(group)!.add(record.cell)
  }

  return [...cellsByGroup.entries()]
    .map(([name, cells]) => ({ name, value: cells.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function aggregateSumByField(
  data: EnrichedRecord[],
  groupField: keyof EnrichedRecord,
  valueField: keyof EnrichedRecord,
  limit = 10
): BarChartData[] {
  const totals = new Map<string, number>()

  for (const record of data) {
    const key = String(record[groupField] || 'Unknown')
    const value = Number(record[valueField] ?? 0)
    totals.set(key, (totals.get(key) || 0) + value)
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
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
  const flaggedData = data.filter(r => r.dq_status !== 'Normal')
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
    'Provincia', 'Región', 'Vendor', 'Nodo', 'Site', 'Celda', 'Métrica', 'Anomalía detectada', 'Condición de calidad',
    'Days Available', 'Days Modified', 'Historical Days Available', 'ROPs Available',
    'Modulator KPI', 'Valor modulador', 'Estado DQ', 'Timestamp'
  ]
  
  const rows = data.map(r => [
    r.province,
    r.region,
    r.supplier,
    r.node_name,
    r.site_name,
    r.cell,
    r.metric,
    r.anomaly_detected,
    r.condition,
    r.days_available ?? '',
    r.days_modified,
    r.historical_days_available ?? '',
    r.num_rops_available ?? '',
    r.modulator_kpi ?? '',
    r.value_modulator_kpi ?? '',
    r.dq_status,
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
    if (record.dq_status !== 'Normal') {
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
    if (record.dq_status !== 'Normal') {
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
