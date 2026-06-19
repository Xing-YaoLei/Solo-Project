import { useState, useRef, useEffect } from 'react'
import { Upload, Image, Box, Music, Trash2, Download, Plus, Search, CheckCircle2, Save } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useConfigStore } from '@/stores/useConfigStore'
import { cn } from '@/lib/utils'
import type { Asset } from '@/types/config'

const TYPE_CONFIG: Record<Asset['type'], { label: string; icon: typeof Image; color: string }> = {
  model: { label: '3D模型', icon: Box, color: 'bg-indigo-100 text-indigo-600' },
  image: { label: '图片', icon: Image, color: 'bg-emerald-100 text-emerald-600' },
  audio: { label: '音频', icon: Music, color: 'bg-amber-100 text-amber-600' },
}

export default function ConfigAssetsPage() {
  const storeAssets = useConfigStore((s) => s.assets)
  const updateAssets = useConfigStore((s) => s.updateAssets)
  const loadConfig = useConfigStore((s) => s.loadConfig)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<Asset['type'] | 'all'>('all')
  const [assets, setAssets] = useState<Asset[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    setAssets(storeAssets)
  }, [storeAssets])

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || asset.type === filterType
    return matchesSearch && matchesType
  })

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const newAssets: Asset[] = Array.from(files).map((file) => ({
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('audio/') ? 'audio' : 'model',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
    }))
    
    setAssets((prev) => [...prev, ...newAssets])
    setSaved(false)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('确定删除该素材吗？')) {
      setAssets((prev) => prev.filter((a) => a.id !== id))
      setSaved(false)
    }
  }

  const handleSave = () => {
    updateAssets(assets)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">素材管理</h2>
            <p className="text-sm text-neutral-500">共 {filteredAssets.length} 个素材资源</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saved}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4" />
              上传素材
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleUpload(e.dataTransfer.files)
          }}
          className={cn(
            'mb-4 rounded-xl border-2 border-dashed p-8 text-center transition-all',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'
          )}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-neutral-800">
            拖拽文件到此处，或
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ml-1 text-primary hover:underline"
            >
              点击选择文件
            </button>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            支持 3D 模型（.glb, .gltf）、图片（.jpg, .png, .webp）、音频（.mp3, .wav）
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索素材名称..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                filterType === 'all' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              全部
            </button>
            {(Object.keys(TYPE_CONFIG) as Asset['type'][]).map((type) => {
              const { label } = TYPE_CONFIG[type]
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                    filterType === type ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-12 text-center">
            <Image className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-500">暂无素材资源</p>
            <p className="mt-1 text-xs text-neutral-400">上传素材后将在此显示</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => {
              const typeConfig = TYPE_CONFIG[asset.type]
              const TypeIcon = typeConfig.icon
              return (
                <div
                  key={asset.id}
                  className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-accent/50 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', typeConfig.color)}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-primary">
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="truncate text-sm font-medium text-neutral-800">{asset.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span className={cn('rounded px-1.5 py-0.5', typeConfig.color)}>{typeConfig.label}</span>
                    <span>{formatDate(asset.uploadedAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
