import { create } from 'zustand'
import { TabId } from '@/types'

interface UIState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  isExporting: boolean
  exportProgress: string
  setExporting: (v: boolean, msg?: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'upload',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
  isExporting: false,
  exportProgress: '',
  setExporting: (v, msg = '') => set({ isExporting: v, exportProgress: msg }),
}))
