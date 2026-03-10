'use client'

import { X, Filter, RotateCcw } from 'lucide-react'
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

export function FiltersPanel() {
  const { filters, setFilters, resetFilters, filterOptions } = useData()
  
  const hasActiveFilters = 
    filters.province.length > 0 ||
    filters.region.length > 0 ||
    filters.vendor.length > 0 ||
    filters.technology.length > 0 ||
    filters.metric.length > 0 ||
    filters.node.length > 0

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    if (value === 'all') {
      setFilters({ ...filters, [field]: [] })
    } else {
      setFilters({ ...filters, [field]: [value] })
    }
  }

  const removeFilter = (field: keyof typeof filters) => {
    setFilters({ ...filters, [field]: [] })
  }

  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Global Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto h-7 text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset All
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Province Filter */}
        <Select
          value={filters.province[0] || 'all'}
          onValueChange={(v) => handleFilterChange('province', v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {filterOptions.provinces.slice(0, 50).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region Filter */}
        <Select
          value={filters.region[0] || 'all'}
          onValueChange={(v) => handleFilterChange('region', v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {filterOptions.regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vendor Filter */}
        <Select
          value={filters.vendor[0] || 'all'}
          onValueChange={(v) => handleFilterChange('vendor', v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {filterOptions.vendors.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Technology Filter */}
        <Select
          value={filters.technology[0] || 'all'}
          onValueChange={(v) => handleFilterChange('technology', v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technologies</SelectItem>
            {filterOptions.technologies.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Metric Filter */}
        <Select
          value={filters.metric[0] || 'all'}
          onValueChange={(v) => handleFilterChange('metric', v)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Metric (KPI)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metrics</SelectItem>
            {filterOptions.metrics.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Node Filter */}
        <Select
          value={filters.node[0] || 'all'}
          onValueChange={(v) => handleFilterChange('node', v)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Node" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Nodes</SelectItem>
            {filterOptions.nodes.slice(0, 50).map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.province.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              Province: {p}
              <button onClick={() => removeFilter('province')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.region.map((r) => (
            <Badge key={r} variant="secondary" className="gap-1">
              Region: {r}
              <button onClick={() => removeFilter('region')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.vendor.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              Vendor: {v}
              <button onClick={() => removeFilter('vendor')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.technology.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              Tech: {t}
              <button onClick={() => removeFilter('technology')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.metric.map((m) => (
            <Badge key={m} variant="secondary" className="gap-1">
              Metric: {m}
              <button onClick={() => removeFilter('metric')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.node.map((n) => (
            <Badge key={n} variant="secondary" className="gap-1">
              Node: {n}
              <button onClick={() => removeFilter('node')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
