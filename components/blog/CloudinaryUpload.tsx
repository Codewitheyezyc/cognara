'use client'

import React, { useState } from 'react'
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react'

interface CloudinaryUploadProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function CloudinaryUpload({ value, onChange, label = 'Cover Image' }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image file must be under 8MB.')
      return
    }

    setIsUploading(true)
    setError('')

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ms87iyir'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cognara_uploads'

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData?.error?.message || 'Cloudinary upload failed')
      }

      const data = await response.json()
      onChange(data.secure_url)
    } catch (err: any) {
      console.error('Cloudinary upload error:', err)
      setError(err.message || 'Failed to upload cover image.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    onChange('')
    setError('')
  }

  return (
    <div className="space-y-2 text-left">
      <label className="text-xs font-bold text-text-2 uppercase tracking-wider">
        {label}
      </label>

      {value ? (
        // Preview State
        <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-alt/25 aspect-video w-full max-w-md group animate-page-enter">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={removeImage}
              className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition shadow-lg flex items-center justify-center cursor-pointer"
              title="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        // Upload Action State
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all aspect-video w-full max-w-md ${
          isUploading
            ? 'border-primary bg-primary/5 cursor-wait'
            : 'border-border hover:border-primary/40 bg-surface/50 hover:bg-surface-alt/40'
        }`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2.5 animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-1">Uploading image...</p>
                <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">Cloudinary Node</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2.5">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-1">Upload a cover image</p>
                <p className="text-[10px] text-text-2">Supports JPG, PNG (Max 8MB)</p>
              </div>
            </div>
          )}
        </label>
      )}

      {error && (
        <p className="text-[11px] text-rose-500 font-bold mt-1 animate-page-enter">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
