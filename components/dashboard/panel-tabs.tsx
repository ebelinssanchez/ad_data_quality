'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useData } from '@/lib/data-context'
import type { PanelTab } from '@/lib/types'

const tabs: { value: PanelTab; label: string }[] = [
  { value: 'days-available', label: 'Days Available' },
  { value: 'days-modified', label: 'Days Modified' },
  { value: 'trend-change', label: 'Trend Change' },
  { value: 'insufficient-history', label: 'Insufficient History' },
  { value: 'insufficient-rops', label: 'Insufficient ROPs' },
  { value: 'activity-criteria', label: 'Activity Criteria' },
]

export function PanelTabs() {
  const { activeTab, setActiveTab } = useData()

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PanelTab)}>
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
