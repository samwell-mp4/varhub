import { create } from 'zustand'
import { MediaItem, Project, VideoTrim } from '@/types'
import { generateId, getMediaType, readFileAsDataURL } from '@/lib/utils'
import { selectTemplate } from '@/lib/autoLayout'

interface ProjectState {
  project: Project
  selectedMediaId: string | null
  undoStack: Project[]
  addMedia: (files: File[]) => void
  removeMedia: (id: string) => void
  reorderMedia: (fromIndex: number, toIndex: number) => void
  setTitle: (title: string) => void
  setSubtitle: (subtitle: string) => void
  setTitleSize: (size: number) => void
  setSubtitleSize: (size: number) => void
  setTitleBold: (bold: boolean) => void
  setSubtitleBold: (bold: boolean) => void
  setBgColor: (color: string) => void
  setTitleColor: (color: string) => void
  setSubtitleColor: (color: string) => void
  setCategory: (category: string) => void
  setTemplateId: (id: number) => void
  setLogo: (logo: string | undefined) => void
  setVideoTrim: (id: string, trim: VideoTrim) => void
  setVideoDuration: (id: string, duration: number) => void
  setSelectedMedia: (id: string | null) => void
  updateMediaPan: (id: string, panX: number, panY: number) => void
  updateMediaScale: (id: string, scale: number) => void
  resetMediaCrop: (id: string) => void
  undo: () => void
  reset: () => void
}

const MAX_UNDO = 50

const createEmptyProject = (): Project => ({
  id: generateId(),
  title: '@CHAMAOVAR',
  subtitle: '',
  category: 'Notícia',
  media: [],
  templateId: 5,
  logo: '/logotipovar.jpg',
})

function clampPan(panX: number, panY: number, scale: number): { panX: number; panY: number } {
  const max = Math.max((scale - 1) * 300, 150)
  return {
    panX: Math.max(-max, Math.min(max, panX)),
    panY: Math.max(-max, Math.min(max, panY)),
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createEmptyProject(),
  selectedMediaId: null,
  undoStack: [],

  addMedia: async (files: File[]) => {
    const prev = get().project
    const newMedia: MediaItem[] = await Promise.all(
      files.map(async (file) => {
        const src = await readFileAsDataURL(file)
        const item: MediaItem = {
          id: generateId(),
          type: getMediaType(file),
          src,
          file,
          panX: 0,
          panY: 0,
          scale: 1,
        }
        if (item.type === 'image') {
          const img = new Image()
          img.src = src
          await new Promise<void>((resolve) => {
            img.onload = () => {
              item.naturalWidth = img.naturalWidth
              item.naturalHeight = img.naturalHeight
              resolve()
            }
          })
        }
        if (item.type === 'video') {
          const video = document.createElement('video')
          video.src = src
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              item.duration = video.duration
              resolve(null)
            }
          })
        }
        return item
      })
    )
    set((state) => {
      const updated = {
        ...state.project,
        media: [...state.project.media, ...newMedia],
      }
      updated.templateId = selectTemplate(updated.media)
      return {
        project: updated,
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    })
  },

  removeMedia: (id: string) => {
    set((state) => {
      const prev = state.project
      const updated = {
        ...state.project,
        media: state.project.media.filter((m) => m.id !== id),
      }
      updated.templateId = selectTemplate(updated.media)
      return {
        project: updated,
        selectedMediaId: state.selectedMediaId === id ? null : state.selectedMediaId,
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    })
  },

  reorderMedia: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const prev = state.project
      const media = [...state.project.media]
      const [moved] = media.splice(fromIndex, 1)
      media.splice(toIndex, 0, moved)
      return {
        project: { ...state.project, media },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    })
  },

  setTitle: (title: string) =>
    set((state) => {
      const prev = state.project
      return {
        project: { ...state.project, title },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setSubtitle: (subtitle: string) =>
    set((state) => {
      const prev = state.project
      return {
        project: { ...state.project, subtitle },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setTitleSize: (titleSize: number) =>
    set((state) => ({
      project: { ...state.project, titleSize },
    })),

  setSubtitleSize: (subtitleSize: number) =>
    set((state) => ({
      project: { ...state.project, subtitleSize },
    })),

  setTitleBold: (titleBold: boolean) =>
    set((state) => ({
      project: { ...state.project, titleBold },
    })),

  setSubtitleBold: (subtitleBold: boolean) =>
    set((state) => ({
      project: { ...state.project, subtitleBold },
    })),

  setBgColor: (bgColor: string) =>
    set((state) => ({
      project: { ...state.project, bgColor },
    })),

  setTitleColor: (titleColor: string) =>
    set((state) => ({
      project: { ...state.project, titleColor },
    })),

  setSubtitleColor: (subtitleColor: string) =>
    set((state) => ({
      project: { ...state.project, subtitleColor },
    })),

  setCategory: (category: string) =>
    set((state) => {
      const prev = state.project
      return {
        project: { ...state.project, category },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setTemplateId: (id: number) =>
    set((state) => {
      const prev = state.project
      return {
        project: { ...state.project, templateId: id },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setLogo: (logo: string | undefined) =>
    set((state) => {
      const prev = state.project
      return {
        project: { ...state.project, logo },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setVideoTrim: (id: string, trim: VideoTrim) =>
    set((state) => {
      const prev = state.project
      return {
        project: {
          ...state.project,
          media: state.project.media.map((m) =>
            m.id === id ? { ...m, trim } : m
          ),
        },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  setVideoDuration: (id: string, duration: number) =>
    set((state) => ({
      project: {
        ...state.project,
        media: state.project.media.map((m) =>
          m.id === id ? { ...m, duration } : m
        ),
      },
    })),

  setSelectedMedia: (id: string | null) =>
    set({ selectedMediaId: id }),

  updateMediaPan: (id: string, panX: number, panY: number) =>
    set((state) => {
      const scale = state.project.media.find(m => m.id === id)?.scale || 1
      const clamped = clampPan(panX, panY, scale)
      return {
        project: {
          ...state.project,
          media: state.project.media.map((m) =>
            m.id === id ? { ...m, panX: clamped.panX, panY: clamped.panY } : m
          ),
        },
      }
    }),

  updateMediaScale: (id: string, scale: number) =>
    set((state) => {
      const prev = state.project
      const media = state.project.media.find(m => m.id === id)
      if (!media) return state
      const pan = clampPan(media.panX || 0, media.panY || 0, scale)
      return {
        project: {
          ...state.project,
          media: state.project.media.map((m) =>
            m.id === id ? { ...m, scale, panX: pan.panX, panY: pan.panY } : m
          ),
        },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  resetMediaCrop: (id: string) =>
    set((state) => {
      const prev = state.project
      return {
        project: {
          ...state.project,
          media: state.project.media.map((m) =>
            m.id === id ? { ...m, panX: 0, panY: 0, scale: 1 } : m
          ),
        },
        undoStack: [...state.undoStack.slice(-MAX_UNDO), prev],
      }
    }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state
      const prev = state.undoStack[state.undoStack.length - 1]
      return {
        project: prev,
        undoStack: state.undoStack.slice(0, -1),
        selectedMediaId: null,
      }
    }),

  reset: () => set({ project: createEmptyProject(), selectedMediaId: null, undoStack: [] }),
}))
