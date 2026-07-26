import { MediaItem, Template } from '@/types'

export function selectTemplate(media: MediaItem[]): number {
  const imageCount = media.filter(m => m.type === 'image').length
  const videoCount = media.filter(m => m.type === 'video').length
  const total = media.length

  if (total === 0) return 5
  if (total === 1) {
    if (videoCount === 1) return 3
    return 7
  }
  if (total === 2) {
    if (videoCount === 1 && imageCount === 1) return 2
    if (videoCount === 2) return 3
    return 1
  }
  if (total === 3) {
    if (videoCount >= 1 && imageCount >= 1) return 6
    return 11
  }
  if (total === 4) {
    if (videoCount >= 1 && imageCount >= 1) return 10
    return 8
  }
  return 8
}

export const TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Lado a Lado',
    minMedia: 2, maxMedia: 2,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 0, y: 0, width: 50, height: 100, label: 'Imagem 1' },
      { id: 'img2', x: 50, y: 0, width: 50, height: 100, label: 'Imagem 2' },
    ],
  },
  {
    id: 2,
    name: 'Imagem + Vídeo',
    minMedia: 2, maxMedia: 2,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 0, width: 50, height: 100, label: 'Mídia 1' },
      { id: 'media2', x: 50, y: 0, width: 50, height: 100, label: 'Mídia 2' },
    ],
  },
  {
    id: 3,
    name: 'Vídeo Full',
    minMedia: 1, maxMedia: 1,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 0, width: 100, height: 100, label: 'Mídia' },
    ],
  },
  {
    id: 4,
    name: '3 Colunas',
    minMedia: 3, maxMedia: 3,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 0, y: 0, width: 33.33, height: 100, label: 'Imagem 1' },
      { id: 'img2', x: 33.33, y: 0, width: 33.33, height: 100, label: 'Imagem 2' },
      { id: 'img3', x: 66.66, y: 0, width: 33.33, height: 100, label: 'Imagem 3' },
    ],
  },
  {
    id: 5,
    name: 'Destaque + Duas',
    minMedia: 1, maxMedia: 3,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 0, y: 0, width: 100, height: 66, label: 'Imagem Grande' },
      { id: 'img2', x: 0, y: 66, width: 50, height: 34, label: 'Imagem 2' },
      { id: 'img3', x: 50, y: 66, width: 50, height: 34, label: 'Imagem 3' },
    ],
  },
  {
    id: 6,
    name: 'Vídeo + Abaixo',
    minMedia: 2, maxMedia: 2,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 0, width: 100, height: 66, label: 'Vídeo' },
      { id: 'media2', x: 0, y: 66, width: 100, height: 34, label: 'Imagem' },
    ],
  },
  {
    id: 7,
    name: 'Imagem Central',
    minMedia: 1, maxMedia: 1,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 8, y: 0, width: 84, height: 100, label: 'Imagem' },
    ],
  },
  {
    id: 8,
    name: 'Grid 2×2',
    minMedia: 4, maxMedia: 4,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 0, y: 0, width: 50, height: 50, label: '1' },
      { id: 'img2', x: 50, y: 0, width: 50, height: 50, label: '2' },
      { id: 'img3', x: 0, y: 50, width: 50, height: 50, label: '3' },
      { id: 'img4', x: 50, y: 50, width: 50, height: 50, label: '4' },
    ],
  },
  {
    id: 9,
    name: 'Listra Cinza',
    minMedia: 1, maxMedia: 2,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 0, width: 100, height: 50, label: 'Mídia 1' },
      { id: 'media2', x: 0, y: 50, width: 100, height: 50, label: 'Mídia 2' },
    ],
  },
  {
    id: 10,
    name: 'Destaque + Grid',
    minMedia: 3, maxMedia: 5,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 0, width: 66, height: 100, label: 'Destaque' },
      { id: 'media2', x: 66, y: 0, width: 34, height: 50, label: '2' },
      { id: 'media3', x: 66, y: 50, width: 34, height: 50, label: '3' },
    ],
  },
  {
    id: 11,
    name: '3 Verticais',
    minMedia: 3, maxMedia: 3,
    acceptsVideo: false, acceptsImage: true,
    slots: [
      { id: 'img1', x: 0, y: 0, width: 100, height: 33.33, label: 'Imagem 1' },
      { id: 'img2', x: 0, y: 33.33, width: 100, height: 33.33, label: 'Imagem 2' },
      { id: 'img3', x: 0, y: 66.66, width: 100, height: 33.33, label: 'Imagem 3' },
    ],
  },
  {
    id: 12,
    name: 'Cinema',
    minMedia: 1, maxMedia: 1,
    acceptsVideo: true, acceptsImage: true,
    slots: [
      { id: 'media1', x: 0, y: 15, width: 100, height: 70, label: 'Mídia' },
    ],
  },
]
