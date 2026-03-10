'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useData } from '@/lib/data-context'
import type { PanelTab } from '@/lib/types'

const tabs: { value: PanelTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'days-available', label: 'Days Available' },
  { value: 'days-modified', label: 'Days Modified' },
  { value: 'trend-change', label: 'Trend Change' },
]

export function PanelTabs() {
  const { activeTab, setActiveTab } = useData()

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PanelTab)}>
      <TabsList className="grid w-full max-w-2xl grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
