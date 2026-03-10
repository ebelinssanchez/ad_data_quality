// Telecom mock data for the Data Quality Panel

export const provinces = [
  "North Region",
  "South Region",
  "East Region",
  "West Region",
  "Central Region",
]

export const vendors = ["Ericsson", "Nokia"]

export const technologies = ["4G", "5G"]

export const kpis = [
  "DL_Throughput",
  "UL_Throughput",
  "Latency",
  "PRB_Utilization",
  "Call_Drop_Rate",
  "Handover_Success_Rate",
  "RRC_Connection_Success",
]

export const metricTypes = [
  "Off-Hours ROPs Coverage",
  "Historical Data Availability",
  "Modified Historical Data",
  "Trend Change Detection",
  "Activity Criteria",
]

export const reasons = [
  "insufficient off-hours observations",
  "insufficient historical data",
  "activity criteria not met",
  "trend change detected - new normality",
  "historical data was modified",
]

export const statuses = ["Passed", "Failed"] as const

export type CellData = {
  id: string
  province: string
  vendor: string
  technology: string
  nodeName: string
  cellName: string
  kpi: string
  metricType: string
  metricValue: number
  threshold: number
  status: "Passed" | "Failed"
  reason: string
  ropsValue: number
  historicalDays: number
}

function generateNodeName(vendor: string, index: number): string {
  const prefix = vendor === "Ericsson" ? "ERBS" : "NKL"
  return `${prefix}_${String(index).padStart(4, "0")}`
}

function generateCellName(nodeName: string, sector: number): string {
  return `${nodeName}_S${sector}`
}

export function generateMockCells(count: number = 500): CellData[] {
  const cells: CellData[] = []

  for (let i = 0; i < count; i++) {
    const province = provinces[Math.floor(Math.random() * provinces.length)]
    const vendor = vendors[Math.floor(Math.random() * vendors.length)]
    const technology = technologies[Math.floor(Math.random() * technologies.length)]
    const kpi = kpis[Math.floor(Math.random() * kpis.length)]
    const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)]
    const nodeName = generateNodeName(vendor, Math.floor(Math.random() * 1000))
    const sector = Math.floor(Math.random() * 3) + 1
    const cellName = generateCellName(nodeName, sector)

    // Generate realistic values
    let threshold: number
    let metricValue: number
    let status: "Passed" | "Failed"
    let reason: string

    if (metricType === "Off-Hours ROPs Coverage") {
      threshold = 80
      metricValue = Math.floor(Math.random() * 100)
      status = metricValue >= threshold ? "Passed" : "Failed"
      reason = status === "Failed" ? "insufficient off-hours observations" : ""
    } else if (metricType === "Historical Data Availability") {
      threshold = 7
      metricValue = Math.floor(Math.random() * 14)
      status = metricValue >= threshold ? "Passed" : "Failed"
      reason = status === "Failed" ? "insufficient historical data" : ""
    } else if (metricType === "Activity Criteria") {
      threshold = 50
      metricValue = Math.floor(Math.random() * 100)
      status = metricValue >= threshold ? "Passed" : "Failed"
      reason = status === "Failed" ? "activity criteria not met" : ""
    } else if (metricType === "Trend Change Detection") {
      threshold = 0.15
      metricValue = Math.random() * 0.3
      status = metricValue <= threshold ? "Passed" : "Failed"
      reason = status === "Failed" ? "trend change detected - new normality" : ""
    } else {
      threshold = 0
      metricValue = Math.floor(Math.random() * 10)
      status = metricValue === 0 ? "Passed" : "Failed"
      reason = status === "Failed" ? "historical data was modified" : ""
    }

    cells.push({
      id: `cell-${i}`,
      province,
      vendor,
      technology,
      nodeName,
      cellName,
      kpi,
      metricType,
      metricValue: Math.round(metricValue * 100) / 100,
      threshold,
      status,
      reason,
      ropsValue: Math.floor(Math.random() * 96),
      historicalDays: Math.floor(Math.random() * 30),
    })
  }

  return cells
}

export function generateDailyData(days: number = 30): { date: string; issues: number }[] {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split("T")[0],
      issues: Math.floor(Math.random() * 200) + 50,
    })
  }

  return data
}

export function generateRopsDistribution(): { rops: number; count: number }[] {
  const data = []
  for (let i = 0; i <= 96; i += 4) {
    // Generate a distribution that peaks around 80-90
    const base = Math.exp(-Math.pow((i - 85) / 20, 2)) * 100
    data.push({
      rops: i,
      count: Math.floor(base + Math.random() * 20),
    })
  }
  return data
}

export const ROPS_THRESHOLD = 80
