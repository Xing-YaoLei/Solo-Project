import { create } from 'zustand'
import type { FunnelDataPoint, DispatchDurationPoint, Task, Conclusion } from '@/types'

interface DashboardState {
  startDate: string
  endDate: string
  routeId: string | null
  selectedChartPoint: string | null
  selectedChartType: string | null
  showConclusionPanel: boolean
  funnelData: FunnelDataPoint[]
  dispatchDurationData: DispatchDurationPoint[]
  threshold: number
  tasks: Task[]
  conclusions: Conclusion[]
  setDateRange: (start: string, end: string) => void
  setRouteId: (routeId: string | null) => void
  selectChartPoint: (pointId: string | null, chartType: string | null) => void
  toggleConclusionPanel: (show?: boolean) => void
  setFunnelData: (data: FunnelDataPoint[]) => void
  setDispatchDurationData: (data: DispatchDurationPoint[], threshold: number) => void
  setTasks: (tasks: Task[]) => void
  setConclusions: (conclusions: Conclusion[]) => void
  addConclusion: (conclusion: Conclusion) => void
  updateTask: (task: Task) => void
}

export const useDashboardStore = create<DashboardState>((set) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  return {
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    routeId: null,
    selectedChartPoint: null,
    selectedChartType: null,
    showConclusionPanel: false,
    funnelData: [],
    dispatchDurationData: [],
    threshold: 1800,
    tasks: [],
    conclusions: [],
    
    setDateRange: (start, end) => set({ startDate: start, endDate: end }),
    setRouteId: (routeId) => set({ routeId }),
    selectChartPoint: (pointId, chartType) => set({ 
      selectedChartPoint: pointId, 
      selectedChartType: chartType,
      showConclusionPanel: !!pointId
    }),
    toggleConclusionPanel: (show) => set((state) => ({ 
      showConclusionPanel: show !== undefined ? show : !state.showConclusionPanel 
    })),
    setFunnelData: (data) => set({ funnelData: data }),
    setDispatchDurationData: (data, threshold) => set({ 
      dispatchDurationData: data,
      threshold 
    }),
    setTasks: (tasks) => set({ tasks }),
    setConclusions: (conclusions) => set({ conclusions }),
    addConclusion: (conclusion) => set((state) => ({ 
      conclusions: [...state.conclusions, conclusion] 
    })),
    updateTask: (task) => set((state) => ({
      tasks: state.tasks.map(t => t.id === task.id ? task : t)
    })),
  }
})
