'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
}

export function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)
    setUploading(true)

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary not configured')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'auction-me-vibes')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      onUpload(data.secure_url)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="aspect-video rounded-xl overflow-hidden bg-dark-800">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="p-2 bg-dark-900/80 hover:bg-dark-900 rounded-lg transition-colors"
              title="Change image"
            >
              🔄
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
              title="Remove image"
            >
              ✕
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-dark-600 hover:border-purple-500 bg-dark-800/50 hover:bg-dark-800 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <p className="text-gray-400">Click to upload image</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF up to 10MB</p>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}
