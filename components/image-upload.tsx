'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from './ui/button'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onChange(data.url)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    } else {
      setError('Please drop an image file')
    }
  }

  const handleRemove = () => {
    onChange('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        // Preview
        <div className="relative rounded-2xl overflow-hidden bg-dark-800 group">
          <div className="relative h-48 sm:h-64">
            <Image
              src={value}
              alt="Upload preview"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative h-48 sm:h-64 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-dark-600 hover:border-purple-500/50 hover:bg-dark-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Uploading...</p>
              </>
            ) : (
              <>
                <span className="text-5xl mb-4">📷</span>
                <p className="text-gray-300 font-medium mb-2">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  JPEG, PNG, GIF, or WebP • Max 5MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}
