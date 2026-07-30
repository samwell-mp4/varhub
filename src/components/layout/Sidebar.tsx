'use client'

import { useUIStore } from '@/store'
import { TabId } from '@/types'
import { motion } from 'framer-motion'
import {
  LayoutTemplate,
  FolderOpen,
  Upload,
  Settings,
  Bell,
  Wrench,
  ShoppingBag,
} from 'lucide-react'

const tabs: { id: TabId; label: string; icon: typeof LayoutTemplate }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'projetos', label: 'Projetos', icon: FolderOpen },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'tiktok-shop', label: 'TikTok Shop', icon: ShoppingBag },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const { activeTab, setActiveTab, isSidebarOpen } = useUIStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 240 : 64 }}
      className="h-full bg-[#0d0d14] border-r border-[#1a1a28] flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#1a1a28] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-semibold text-white text-sm"
          >
            Story Studio
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
              activeTab === id
                ? 'bg-violet-500/10 text-violet-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                {label}
              </motion.span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1a1a28]">
        {isSidebarOpen && (
          <div className="text-xs text-zinc-600">
            Story Studio v1.0
          </div>
        )}
      </div>
    </motion.aside>
  )
}
