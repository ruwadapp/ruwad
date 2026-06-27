'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud, FileText, Image as ImageIcon, File, X, Loader2 } from 'lucide-react'

export interface UploadedFile {
  name: string
  url: string
  type: string
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type === 'application/pdf') return FileText
  return File
}

export function FileUploadZone({
  bucket,
  pathPrefix,
  files,
  onChange,
  maxFiles = 5,
}: {
  bucket: string
  pathPrefix: string
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  maxFiles?: number
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const upload = useCallback(async (fileList: FileList) => {
    if (files.length + fileList.length > maxFiles) {
      setError(`الحد الأقصى ${maxFiles} ملفات`)
      return
    }
    setUploading(true)
    setError(null)
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(fileList)) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`"${file.name}" أكبر من 25MB`)
        continue
      }
      const path = `${pathPrefix}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
      if (uploadError) {
        setError(`تعذّر رفع "${file.name}"`)
        continue
      }
      if (bucket === 'assignment-attachments') {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        newFiles.push({ name: file.name, url: data.publicUrl, type: file.type })
      } else {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 30)
        newFiles.push({ name: file.name, url: data?.signedUrl ?? path, type: file.type })
      }
    }

    onChange([...files, ...newFiles])
    setUploading(false)
  }, [files, maxFiles, bucket, pathPrefix, onChange, supabase])

  function removeFile(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-ruwad p-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${
          dragging ? 'border-ruwad-blue bg-ruwad-blue/5 scale-[1.01]' : 'border-ruwad-gray hover:border-ruwad-blue/50 hover:bg-ruwad-gray/10'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
        {uploading ? (
          <Loader2 size={32} className="text-ruwad-blue animate-spin" />
        ) : (
          <UploadCloud size={32} className="text-ruwad-blue/60" />
        )}
        <p className="text-sm font-semibold text-ruwad-navy">
          {uploading ? 'جارٍ الرفع...' : 'اسحب الملفات هنا أو اضغط للاختيار'}
        </p>
        <p className="text-xs text-ruwad-navy/40">حتى {maxFiles} ملفات، 25MB لكل ملف</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f, idx) => {
            const Icon = iconFor(f.type)
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-ruwad-sm bg-ruwad-gray/10">
                <Icon size={18} className="text-ruwad-blue shrink-0" />
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-ruwad-navy truncate hover:underline">
                  {f.name}
                </a>
                <button type="button" onClick={() => removeFile(idx)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition shrink-0">
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
