'use client'

import { useProjectStore } from '@/store'
import { AutoTemplate } from '@/components/templates/AutoTemplate'
import { motion } from 'framer-motion'

export function Preview() {
  const { project } = useProjectStore()

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        key={project.templateId + project.media.length}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-black"
      >
        <AutoTemplate
          media={project.media}
          templateId={project.templateId}
          title={project.title}
          subtitle={project.subtitle}
          category={project.category}
          logo={project.logo}
          titleSize={project.titleSize}
          subtitleSize={project.subtitleSize}
          titleBold={project.titleBold}
          subtitleBold={project.subtitleBold}
          bgColor={project.bgColor}
          titleColor={project.titleColor}
          subtitleColor={project.subtitleColor}
        />
      </motion.div>
    </div>
  )
}
