'use client'

import { useUIStore } from '@/store'
import { TabId } from '@/types'
import {
  LayoutTemplate,
  FolderOpen,
  Upload,
  Settings,
  Bell,
  Wrench,
  ShoppingBag,
} from 'lucide-react'

const tabs: { id: TabId; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'templates', label: 'Modelos', icon: LayoutTemplate },
  { id: 'projetos', label: 'Projetos', icon: FolderOpen },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'tiktok-shop', label: 'Shop', icon: ShoppingBag },
  { id: 'notificacoes', label: 'Novidades', icon: Bell },
  { id: 'configuracoes', label: 'Ajustes', icon: Settings },
]

export function MobileNav() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setShowMobilePanel = useUIStore((s) => s.setShowMobilePanel)

  const handleTab = (id: TabId) => {
    setActiveTab(id)
    setShowMobilePanel(true)
  }

  return (
    <nav className="h-14 bg-[#0d0d14] border-t border-[#1a1a28] flex items-center justify-around px-1 shrink-0">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleTab(id)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-0 ${
            activeTab === id
              ? 'text-violet-400'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <Icon size={18} />
          <span className="text-[9px] font-medium leading-tight">{label}</span>
        </button>
      ))}
    </nav>
  )
}
