'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useProjectStore, useUIStore } from '@/store'
import { Upload, Film, Image } from 'lucide-react'
import { motion } from 'framer-motion'

export function DropZone() {
  const addMedia = useProjectStore((s) => s.addMedia)
  const setIsDragging = useUIStore((s) => s.setIsDragging)

  const onDrop = useCallback(
    (accepted: File[]) => {
      addMedia(accepted)
    },
    [addMedia]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
      }`}
    >
      <input {...getInputProps()} />
      <motion.div
        animate={{ scale: isDragActive ? 1.1 : 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Upload size={24} className="text-violet-400" />
        </div>
        <div>
          <p className="text-sm text-zinc-300 font-medium">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para enviar'}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            PNG, JPG, WEBP, AVIF, GIF, MP4, MOV, WEBM
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Image size={12} /> Imagens
          </span>
          <span className="flex items-center gap-1.5">
            <Film size={12} /> Vídeos
          </span>
        </div>
      </motion.div>
    </div>
  )
}
