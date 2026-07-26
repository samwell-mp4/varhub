import { create } from 'zustand'
import { TabId } from '@/types'

export type MobileStep = 1 | 2 | 3

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
  isMobile: boolean
  setIsMobile: (v: boolean) => void
  showMobilePanel: boolean
  setShowMobilePanel: (v: boolean) => void
  showMobileTemplatePicker: boolean
  setShowMobileTemplatePicker: (v: boolean) => void
  mobileStep: MobileStep
  setMobileStep: (step: MobileStep) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'upload',
  setActiveTab: (tab) => set({ activeTab: tab, showMobilePanel: tab !== 'upload' }),
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
  isExporting: false,
  exportProgress: '',
  setExporting: (v, msg = '') => set({ isExporting: v, exportProgress: msg }),
  isMobile: false,
  setIsMobile: (v) => set({ isMobile: v, isSidebarOpen: !v, showMobileTemplatePicker: v }),
  showMobilePanel: false,
  setShowMobilePanel: (v) => set({ showMobilePanel: v }),
  showMobileTemplatePicker: false,
  setShowMobileTemplatePicker: (v) => set({ showMobileTemplatePicker: v }),
  mobileStep: 1,
  setMobileStep: (step) => set({ mobileStep: step }),
}))
