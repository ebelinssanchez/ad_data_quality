'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/lib/data-context'
import { aggregateFlaggedByField } from '@/lib/data-loader'

export function RankingTables() {
  const { filteredData, isLoading } = useData()

  const topNodes = useMemo(() => 
    aggregateFlaggedByField(filteredData, 'node_name', 10),
    [filteredData]
  )

  const topCells = useMemo(() => 
    aggregateFlaggedByField(filteredData, 'cell', 10),
    [filteredData]
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-8 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Affected Nodes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Top Affected Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topNodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No flagged nodes found
              </p>
            ) : (
              topNodes.map((node, index) => (
                <div 
                  key={node.name} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {node.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {node.value.toLocaleString()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Affected Cells */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Top Affected Cells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCells.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No flagged cells found
              </p>
            ) : (
              topCells.map((cell, index) => (
                <div 
                  key={cell.name} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {cell.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {cell.value.toLocaleString()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
