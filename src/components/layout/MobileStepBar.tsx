'use client'

import { useUIStore, MobileStep } from '@/store/useUIStore'
import { Check } from 'lucide-react'

const steps: { id: MobileStep; label: string }[] = [
  { id: 1, label: 'Modelo' },
  { id: 2, label: 'Conteúdo' },
  { id: 3, label: 'Revisar' },
]

function getCurrentStep(activeTab: string, showMobilePanel: boolean): MobileStep | null {
  if (activeTab === 'templates') return 1
  if (activeTab === 'upload' && showMobilePanel) return 2
  if (activeTab === 'upload' && !showMobilePanel) return 3
  return null
}

export function MobileStepBar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const showMobilePanel = useUIStore((s) => s.showMobilePanel)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setShowMobilePanel = useUIStore((s) => s.setShowMobilePanel)

  const currentStep = getCurrentStep(activeTab, showMobilePanel)
  if (!currentStep) return null

  const goToStep = (step: MobileStep) => {
    if (step === 1) {
      setActiveTab('templates')
      setShowMobilePanel(true)
    } else if (step === 2) {
      setActiveTab('upload')
      setShowMobilePanel(true)
    } else if (step === 3) {
      setActiveTab('upload')
      setShowMobilePanel(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-0 px-4 py-2 bg-[#0d0d14] border-b border-[#1a1a28] shrink-0">
      {steps.map((step, i) => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id

        return (
          <div key={step.id} className="flex items-center gap-0">
            {i > 0 && (
              <div
                className={`w-6 h-px transition-colors ${
                  isCompleted || isActive ? 'bg-violet-500/40' : 'bg-zinc-700'
                }`}
              />
            )}
            <button
              onClick={() => goToStep(step.id)}
              disabled={false}
              className="flex items-center gap-1.5"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  isCompleted
                    ? 'bg-violet-600 text-white'
                    : isActive
                      ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/40'
                      : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {isCompleted ? <Check size={12} /> : step.id}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-violet-400'
                    : isCompleted
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                }`}
              >
                {step.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
