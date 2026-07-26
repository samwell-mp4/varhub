import { Project } from '@/types'

export function saveProjectToFile(project: Project) {
  const data = JSON.stringify({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    templateId: project.templateId,
    logo: project.logo,
    media: project.media.map((m) => ({
      id: m.id,
      type: m.type,
      src: m.src,
      name: m.file.name,
      panX: m.panX,
      panY: m.panY,
      scale: m.scale,
      trim: m.trim,
      duration: m.duration,
    })),
  })

  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.title || 'projeto'}.story-studio`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function loadProjectFromFile(): Promise<Project | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.story-studio'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) { resolve(null); return }
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const project: Project = {
          id: data.id,
          title: data.title || '',
          subtitle: data.subtitle || '',
          category: data.category || '',
          templateId: data.templateId || 5,
          logo: data.logo,
          media: data.media.map((m: any) => ({
            id: m.id,
            type: m.type,
            src: m.src,
            file: new File([], m.name, { type: m.type === 'video' ? 'video/mp4' : 'image/png' }),
            panX: m.panX || 0,
            panY: m.panY || 0,
            scale: m.scale || 1,
            trim: m.trim,
            duration: m.duration,
          })),
        }
        resolve(project)
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}

const STORAGE_KEY = 'story-studio-projects'

export function saveProjectToLocal(project: Project) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const idx = existing.findIndex((p: any) => p.id === project.id)
    const entry = {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      category: project.category,
      templateId: project.templateId,
      savedAt: Date.now(),
    }
    if (idx >= 0) {
      existing[idx] = entry
    } else {
      existing.unshift(entry)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)))
  } catch {}
}

export function loadLocalProjects(): { id: string; title: string; savedAt: number }[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}
