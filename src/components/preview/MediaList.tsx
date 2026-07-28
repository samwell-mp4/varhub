'use client'

import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { X, GripVertical, Film, Crop, ZoomIn, RotateCcw, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { VideoTrimmer } from '@/components/ui/VideoTrimmer'
import { CropModal } from '@/components/ui/CropModal'
import { TEMPLATES } from '@/lib/autoLayout'

export function MediaList() {
  const { project, selectedMediaId, removeMedia, reorderMedia, updateMediaScale, resetMediaCrop, setSelectedMedia } = useProjectStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cropModalMedia, setCropModalMedia] = useState<{ id: string; aspect: number } | null>(null)

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === project.templateId) ?? TEMPLATES[4],
    [project.templateId]
  )

  const getSlotAspect = (mediaIndex: number): number => {
    const slot = template.slots[mediaIndex]
    if (!slot) return 9 / 16
    return (slot.width / 100) / (slot.height / 100)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    reorderMedia(result.source.index, result.destination.index)
  }

  if (project.media.length === 0) return null

  return (
    <div className="space-y-2">
      {cropModalMedia && (
        <CropModal
          media={project.media.find(m => m.id === cropModalMedia.id)!}
          slotAspect={cropModalMedia.aspect}
          onClose={() => setCropModalMedia(null)}
        />
      )}

      <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
        Mídias ({project.media.length})
      </p>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="media-list">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
              {project.media.map((media, index) => (
                <Draggable key={media.id} draggableId={media.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-zinc-900/80 rounded-lg overflow-hidden transition-all ${
                        snapshot.isDragging ? 'ring-1 ring-violet-500/50 bg-zinc-800' : ''
                      } ${selectedMediaId === media.id ? 'ring-1 ring-violet-500/30' : ''}`}
                    >
                      <div className="flex items-center gap-2 px-2 py-1.5 group">
                        <div {...provided.dragHandleProps} className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} />
                        </div>
                        <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {media.type === 'video' ? (
                            <Film size={14} className="text-zinc-500" />
                          ) : (
                            <img src={media.thumbnail || media.src} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 truncate flex-1">
                          {media.file.name}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedMedia(media.id)
                            setCropModalMedia({ id: media.id, aspect: getSlotAspect(index) })
                          }}
                          className="p-1 rounded transition-all text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10"
                          title="Abrir original e ajustar corte"
                        >
                          <ImageIcon size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setExpandedId(expandedId === media.id ? null : media.id)
                            setSelectedMedia(media.id)
                          }}
                          className={`p-1 rounded transition-all ${
                            expandedId === media.id ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          <Crop size={12} />
                        </button>
                        {media.type === 'video' && (
                          <button
                            onClick={() => setExpandedId(expandedId === media.id ? null : media.id)}
                            className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition-all"
                          >
                            {expandedId === media.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                        <button
                          onClick={() => removeMedia(media.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {expandedId === media.id && (
                        <div className="px-3 pb-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <ZoomIn size={12} className="text-zinc-500" />
                            <span className="text-[11px] text-zinc-500 font-medium">Zoom</span>
                            <span className="text-[11px] text-zinc-600 ml-auto tabular-nums">
                              {Math.round((media.scale || 1) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={100}
                            max={400}
                            value={Math.round((media.scale || 1) * 100)}
                            onChange={(e) => updateMediaScale(media.id, parseInt(e.target.value) / 100)}
                            className="w-full h-1 appearance-none bg-zinc-800 rounded-full cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
                              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black
                              [&::-webkit-slider-thumb]:shadow-lg"
                          />
                          <div className="flex items-center justify-between text-[11px] text-zinc-600">
                            <span>1×</span>
                            <span>4×</span>
                          </div>
                          <button
                            onClick={() => resetMediaCrop(media.id)}
                            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-all"
                          >
                            <RotateCcw size={10} />
                            Resetar corte
                          </button>
                          <button
                            onClick={() => setCropModalMedia({ id: media.id, aspect: getSlotAspect(index) })}
                            className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-all"
                          >
                            <ImageIcon size={10} />
                            Ver imagem original
                          </button>
                          {media.type === 'video' && <VideoTrimmer media={media} />}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
