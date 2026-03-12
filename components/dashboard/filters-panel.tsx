'use client'

import { useMemo } from 'react'
import { ChevronDown, Filter, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useData } from '@/lib/data-context'
import type { FilterState } from '@/lib/types'

const filterConfig = [
  { field: 'anomaly', label: 'Anomalia detectada (cluster)', placeholder: 'Todos los clusters de anomalia', optionKey: 'anomalies' },
  { field: 'province', label: 'Provincia', placeholder: 'Todas las provincias', optionKey: 'provinces' },
  { field: 'region', label: 'Region', placeholder: 'Todas las regiones', optionKey: 'regions' },
  { field: 'vendor', label: 'Vendor', placeholder: 'Todos los vendors', optionKey: 'vendors' },
  { field: 'technology', label: 'Banda', placeholder: 'Todas las bandas', optionKey: 'technologies' },
  { field: 'metric', label: 'Metrica', placeholder: 'Todas las metricas', optionKey: 'metrics' },
  { field: 'node', label: 'Nodo', placeholder: 'Todos los nodos', optionKey: 'nodes' },
  { field: 'status', label: 'Estado de calidad', placeholder: 'Todos los estados', optionKey: 'statuses' },
  { field: 'condition', label: 'Condicion', placeholder: 'Todas las condiciones', optionKey: 'conditions' },
] as const

type FilterField = Exclude<keyof FilterState, 'dateRange'>

export function FiltersPanel() {
  const { allData, filters, setFilters, resetFilters, filterOptions } = useData()

  const provinceOptions = useMemo(() => {
    const regions = new Set(filters.region)
    const source = regions.size > 0
      ? allData.filter((record) => regions.has(record.region))
      : allData
    return [...new Set(source.map((record) => record.province))].filter(Boolean).sort()
  }, [allData, filters.region])

  const regionOptions = useMemo(() => {
    const provinces = new Set(filters.province)
    const source = provinces.size > 0
      ? allData.filter((record) => provinces.has(record.province))
      : allData
    return [...new Set(source.map((record) => record.region))].filter(Boolean).sort()
  }, [allData, filters.province])

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'dateRange') return false
    return Array.isArray(value) && value.length > 0
  })

  const getFilteredRegionOptions = (selectedProvinces: string[]) => {
    const provinces = new Set(selectedProvinces)
    const source = provinces.size > 0
      ? allData.filter((record) => provinces.has(record.province))
      : allData
    return [...new Set(source.map((record) => record.region))].filter(Boolean).sort()
  }

  const getFilteredProvinceOptions = (selectedRegions: string[]) => {
    const regions = new Set(selectedRegions)
    const source = regions.size > 0
      ? allData.filter((record) => regions.has(record.region))
      : allData
    return [...new Set(source.map((record) => record.province))].filter(Boolean).sort()
  }

  const getOptions = (field: FilterField, optionKey: (typeof filterConfig)[number]['optionKey']) => {
    if (field === 'province') return provinceOptions
    if (field === 'region') return regionOptions
    return filterOptions[optionKey]
  }

  const getTriggerLabel = (field: FilterField, placeholder: string) => {
    const selected = filters[field]
    if (selected.length === 0) return placeholder
    if (selected.length === 1) return selected[0]
    return `${selected.length} seleccionadas`
  }

  const toggleFilterValue = (field: FilterField, value: string) => {
    const currentValues = filters[field]
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]

    const nextFilters = {
      ...filters,
      [field]: nextValues,
    }

    if (field === 'province') {
      const allowedRegions = getFilteredRegionOptions(nextFilters.province)
      nextFilters.region = nextFilters.region.filter((region) => allowedRegions.includes(region))
    }

    if (field === 'region') {
      const allowedProvinces = getFilteredProvinceOptions(nextFilters.region)
      nextFilters.province = nextFilters.province.filter((province) => allowedProvinces.includes(province))
    }

    setFilters(nextFilters)
  }

  const removeFilter = (field: FilterField) => {
    const nextFilters = { ...filters, [field]: [] }
    if (field === 'province') {
      const allowedRegions = getFilteredRegionOptions([])
      nextFilters.region = nextFilters.region.filter((region) => allowedRegions.includes(region))
    }
    if (field === 'region') {
      const allowedProvinces = getFilteredProvinceOptions([])
      nextFilters.province = nextFilters.province.filter((province) => allowedProvinces.includes(province))
    }
    setFilters(nextFilters)
  }

  return (
    <section className="border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtros
          </div>
          <p className="text-sm text-muted-foreground">
            Filtra por cluster de anomalia o por contexto Cell-KPI para diagnostico operativo.
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {filterConfig.map(({ field, label, placeholder, optionKey }) => (
            <div key={field} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap font-normal"
                  >
                    <span className="truncate">{getTriggerLabel(field, placeholder)}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-80 w-72 overflow-y-auto">
                  <DropdownMenuItem onClick={() => removeFilter(field)}>
                    Limpiar {label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {getOptions(field, optionKey).slice(0, 160).map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option}
                      checked={filters[field].includes(option)}
                      onCheckedChange={() => toggleFilterValue(field, option)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {option}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filterConfig.map(({ field, label }) =>
              filters[field].map((value) => (
                <Badge key={`${field}-${value}`} variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  {label}: {value}
                  <button onClick={() => removeFilter(field)} aria-label={`Remove ${label} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}

