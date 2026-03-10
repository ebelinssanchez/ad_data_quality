'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { EnrichedRecord, FilterState, SummaryStats, MetricStats, PanelTab } from './types'
import {
  loadDataQualityCSV,
  loadDiscardsCSV,
  loadCellsInventoryCSV,
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
  isLoading: boolean
  error: string | null
  
  // Filters
  filters: FilterState
  setFilters: (filters: FilterState) => void
  resetFilters: () => void
  
  // Filter options
  filterOptions: {
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
  const [metricStats, setMetricStats] = useState<MetricStats>(defaultMetricStats)
  const [activeTab, setActiveTab] = useState<PanelTab>('overview')
  const [selectedCell, setSelectedCell] = useState<EnrichedRecord | null>(null)
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load all CSV files
        const [dqRecords, discardsRecords, cellsInventory] = await Promise.all([
          loadDataQualityCSV(),
          loadDiscardsCSV(),
          loadCellsInventoryCSV()
        ])
        
        // Create lookups
        const cellLookup = createCellLookup(cellsInventory)
        const discardsLookup = createDiscardsLookup(discardsRecords)
        
        // Enrich data
        const enrichedData = enrichDataQuality(dqRecords, cellLookup, discardsLookup)
        
        setAllData(enrichedData)
        setFilteredData(enrichedData)
        setFilterOptions(getUniqueValues(enrichedData))
        setSummaryStats(calculateSummaryStats(enrichedData))
        setMetricStats(calculateMetricStats(enrichedData))
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data. Please try again.')
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
  }, [allData, filters])
  
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
        isLoading,
        error,
        filters,
        setFilters,
        resetFilters,
        filterOptions,
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
