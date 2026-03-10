'use client'

import { Filter, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData } from '@/lib/data-context'

const filterConfig = [
  { field: 'province', label: 'Province', placeholder: 'All Provinces', optionKey: 'provinces' },
  { field: 'region', label: 'Region', placeholder: 'All Regions', optionKey: 'regions' },
  { field: 'vendor', label: 'Vendor', placeholder: 'All Vendors', optionKey: 'vendors' },
  { field: 'technology', label: 'Band', placeholder: 'All Bands', optionKey: 'technologies' },
  { field: 'metric', label: 'Metric', placeholder: 'All Metrics', optionKey: 'metrics' },
  { field: 'node', label: 'Node', placeholder: 'All Nodes', optionKey: 'nodes' },
  { field: 'status', label: 'DQ Status', placeholder: 'All Status', optionKey: 'statuses' },
  { field: 'condition', label: 'Condition', placeholder: 'All Conditions', optionKey: 'conditions' },
] as const

export function FiltersPanel() {
  const { filters, setFilters, resetFilters, filterOptions } = useData()

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'dateRange') return false
    return Array.isArray(value) && value.length > 0
  })

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters({
      ...filters,
      [field]: value === 'all' ? [] : [value],
    })
  }

  const removeFilter = (field: keyof typeof filters) => {
    setFilters({ ...filters, [field]: [] })
  }

  return (
    <section className="border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Analyst Filters
          </div>
          <p className="text-sm text-muted-foreground">
            Slice the telecom inventory and quality conditions across geography, vendor and exclusion type.
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset filters
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {filterConfig.map(({ field, label, placeholder, optionKey }) => (
            <div key={field} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <Select
                value={filters[field][0] || 'all'}
                onValueChange={(value) => handleFilterChange(field, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{placeholder}</SelectItem>
                  {filterOptions[optionKey].slice(0, 80).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
