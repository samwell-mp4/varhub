export type MediaType = 'image' | 'video'

export interface VideoTrim {
  start: number
  end: number
}

export interface MediaItem {
  id: string
  type: MediaType
  src: string
  file: File
  thumbnail?: string
  trim?: VideoTrim
  duration?: number
  panX?: number
  panY?: number
  scale?: number
  naturalWidth?: number
  naturalHeight?: number
}

export interface Project {
  id: string
  title: string
  subtitle: string
  category: string
  media: MediaItem[]
  templateId: number
  logo?: string
  titleSize?: number
  subtitleSize?: number
  titleBold?: boolean
  subtitleBold?: boolean
  bgColor?: string
  titleColor?: string
  subtitleColor?: string
}

export interface Template {
  id: number
  name: string
  minMedia: number
  maxMedia: number
  acceptsVideo: boolean
  acceptsImage: boolean
  slots: TemplateSlot[]
}

export interface TemplateSlot {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
}

export type ExportFormat = 'png' | 'jpg' | 'mp4'

export type TabId = 'templates' | 'projetos' | 'upload' | 'configuracoes' | 'notificacoes' | 'ferramentas' | 'tiktok-shop' | 'extrator-audio'

export interface InstagramPost {
  id: string
  shortcode: string
  caption: string
  likes: string
  comments: string
  time: string
  thumbnail: string
}

export interface InstagramAccount {
  username: string
  label: string
}

export const ACCOUNTS: InstagramAccount[] = [
  { username: 'choquei', label: 'Choquei' },
  { username: 'hugogloss', label: 'Hugo Gloss' },
  { username: 'letsgossip', label: "Let's Gossip" },
  { username: 'oamarelinhoof', label: 'Amarelinho' },
]
