'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { EnrichedRecord, FilterState, SummaryStats, MetricStats, PanelTab, AnomalyRecord } from './types'
import {
  loadAnomaliesCSV,
  loadDataQualityCSV,
  loadDiscardsCSV,
  loadCellsInventoryCSV,
  createUnifiedDQRecords,
  createAnomalyLookup,
  createAnomalyCellLookup,
  createCellLookup,
  createDiscardsLookup,
  enrichDataQuality,
  applyFilters,
  calculateSummaryStats,
  calculateMetricStats,
  getUniqueValues
} from './data-loader'

interface DataContextValue {
  // Data
  allData: EnrichedRecord[]
  filteredData: EnrichedRecord[]
  anomalyRecords: AnomalyRecord[]
  isLoading: boolean
  error: string | null
  
  // Filters
  filters: FilterState
  setFilters: (filters: FilterState) => void
  resetFilters: () => void
  
  // Filter options
  filterOptions: {
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
  }
  
  // Summary stats
  anomalySummaryStats: SummaryStats
  summaryStats: SummaryStats
  metricStats: MetricStats
  
  // Active tab
  activeTab: PanelTab
  setActiveTab: (tab: PanelTab) => void
  
  // Selected cell for detail panel
  selectedCell: EnrichedRecord | null
  setSelectedCell: (cell: EnrichedRecord | null) => void
}

const defaultFilters: FilterState = {
  dateRange: { start: null, end: null },
  anomaly: [],
  province: [],
  region: [],
  vendor: [],
  technology: [],
  metric: [],
  node: [],
  cell: [],
  status: [],
  condition: []
}

const defaultFilterOptions = {
  anomalies: [],
  provinces: [],
  regions: [],
  vendors: [],
  technologies: [],
  metrics: [],
  nodes: [],
  cells: [],
  statuses: [],
  conditions: []
}

const defaultSummaryStats: SummaryStats = {
  totalCellKPI: 0,
  flagged: 0,
  clear: 0,
  excluded: 0,
  coverageRate: 0
}

const defaultMetricStats: MetricStats = {
  daysAvailable: { affected: 0, percentage: 0 },
  daysModified: { affected: 0, percentage: 0 },
  trendChange: { affected: 0, percentage: 0 },
  insufficientHistory: { affected: 0, percentage: 0 },
  insufficientRops: { affected: 0, percentage: 0 },
  activityCriteria: { affected: 0, percentage: 0 }
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [allData, setAllData] = useState<EnrichedRecord[]>([])
  const [filteredData, setFilteredData] = useState<EnrichedRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters)
  const [filterOptions, setFilterOptions] = useState(defaultFilterOptions)
  const [summaryStats, setSummaryStats] = useState<SummaryStats>(defaultSummaryStats)
  const [anomalySummaryStats, setAnomalySummaryStats] = useState<SummaryStats>(defaultSummaryStats)
  const [metricStats, setMetricStats] = useState<MetricStats>(defaultMetricStats)
  const [anomalyData, setAnomalyData] = useState<AnomalyRecord[]>([])
  const [activeTab, setActiveTab] = useState<PanelTab>('days-available')
  const [selectedCell, setSelectedCell] = useState<EnrichedRecord | null>(null)
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)
        
        const [anomalyRecords, dqRecords, discardsRecords, cellsInventory] = await Promise.all([
          loadAnomaliesCSV(),
          loadDataQualityCSV(),
          loadDiscardsCSV(),
          loadCellsInventoryCSV()
        ])

        // Base obligatorio: datasets DQ + discards (cell+metric)
        const baseDQRecords = createUnifiedDQRecords(dqRecords, discardsRecords)

        // Contexto opcional de anomalías (left join lógico, no filtra base)
        const anomalyLookup = createAnomalyLookup(anomalyRecords)
        const anomalyCellLookup = createAnomalyCellLookup(anomalyRecords)

        const cellLookup = createCellLookup(cellsInventory)
        const discardsLookup = createDiscardsLookup(discardsRecords)

        const enrichedData = enrichDataQuality(baseDQRecords, anomalyLookup, anomalyCellLookup, cellLookup, discardsLookup)
        
        setAnomalyData(anomalyRecords)
        setAllData(enrichedData)
        setFilteredData(enrichedData)
        const options = getUniqueValues(enrichedData)
        options.anomalies = [...new Set(anomalyRecords.map((a) => a.anomaly_detected))]
          .filter((v) => Boolean(v) && v !== 'Sin contexto')
          .sort()
        setFilterOptions(options)
        setSummaryStats(calculateSummaryStats(enrichedData))
        setMetricStats(calculateMetricStats(enrichedData))
      } catch (err) {
        console.error('Error loading data:', err)
        setError('No se pudieron cargar los datasets de anomalías/calidad. Verifica los archivos CSV y vuelve a intentarlo.')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Apply filters when they change
  useEffect(() => {
    const filtered = applyFilters(allData, filters)
    setFilteredData(filtered)
    setSummaryStats(calculateSummaryStats(filtered))
    setMetricStats(calculateMetricStats(filtered))

    // Anomaly-level summary from export anomaly names (cluster level, not Cell-KPI row count)
    const cellStatusByCell = new Map<string, { flagged: boolean; excluded: boolean; clear: boolean }>()
    filtered.forEach((row) => {
      const key = row.cell
      const current = cellStatusByCell.get(key) ?? { flagged: false, excluded: false, clear: true }
      const isExcluded = String(row.dq_status).toLowerCase().startsWith('excluido')
      if (row.dq_status !== 'Normal') current.flagged = true
      if (isExcluded) current.excluded = true
      if (row.dq_status !== 'Normal') current.clear = false
      cellStatusByCell.set(key, current)
    })

    const anomaliesFiltered = anomalyData.filter((a) => {
      if (filters.anomaly.length > 0 && !filters.anomaly.includes(a.anomaly_detected)) return false
      if (filters.cell.length > 0 && !filters.cell.includes(a.cell)) return false
      if (filters.metric.length > 0 && !filters.metric.includes(a.metric)) return false
      return true
    })

    const anomalyNames = [...new Set(anomaliesFiltered.map((a) => a.anomaly_detected).filter(Boolean))]
    const cellsByAnomaly = new Map<string, Set<string>>()
    anomaliesFiltered.forEach((a) => {
      if (!a.anomaly_detected) return
      if (!cellsByAnomaly.has(a.anomaly_detected)) cellsByAnomaly.set(a.anomaly_detected, new Set())
      if (a.cell) cellsByAnomaly.get(a.anomaly_detected)!.add(a.cell)
    })

    let total = anomalyNames.length
    let flagged = 0
    let excluded = 0
    let clear = 0

    anomalyNames.forEach((anomalyName) => {
      const cells = cellsByAnomaly.get(anomalyName) ?? new Set<string>()
      const statuses = [...cells]
        .map((c) => cellStatusByCell.get(c))
        .filter((s): s is { flagged: boolean; excluded: boolean; clear: boolean } => Boolean(s))
      if (statuses.length === 0) return
      const hasExcluded = statuses.some((s) => s.excluded)
      const hasFlagged = statuses.some((s) => s.flagged)
      if (hasExcluded) excluded += 1
      if (hasFlagged) flagged += 1
      if (!hasFlagged) clear += 1
    })

    setAnomalySummaryStats({
      totalCellKPI: total,
      flagged,
      clear,
      excluded,
      coverageRate: total > 0 ? (clear / total) * 100 : 0,
    })
  }, [allData, anomalyData, filters])
  
  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters)
  }, [])
  
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [])
  
  return (
    <DataContext.Provider
      value={{
        allData,
        filteredData,
        anomalyRecords: anomalyData,
        isLoading,
        error,
        filters,
        setFilters,
        resetFilters,
        filterOptions,
        anomalySummaryStats,
        summaryStats,
        metricStats,
        activeTab,
        setActiveTab,
        selectedCell,
        setSelectedCell
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
