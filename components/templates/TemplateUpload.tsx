'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { optimizeImage } from '@/lib/utils/clientImageProcessor'
import toast from 'react-hot-toast'

interface TemplateUploadProps {
  onSuccess: () => void
}

const categories = [
  'Reaction',
  'Wholesome',
  'Dark Humor',
  'Work',
  'Relationships',
  'Animals',
  'Movies',
  'Politics',
  'Gaming'
]

export function TemplateUpload({ onSuccess }: TemplateUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleUpload = async () => {
    if (!file || !name || !category) {
      toast.error('Please fill in all required fields')
      return
    }

    setUploading(true)

    try {
      // Optimize image
      const optimizedBlob = await optimizeImage(file, 1200, 1200)
      const optimizedFile = new File([optimizedBlob], file.name, { type: file.type })

      // Upload to Supabase Storage
      const fileExt = optimizedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `templates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, optimizedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Save to database
      const { error: dbError } = await supabase
        .from('templates')
        .insert({
          name,
          image_url: publicUrl,
          category,
          tags,
          is_custom: true,
          uploaded_by: user?.id,
          usage_count: 0
        })

      if (dbError) throw dbError

      toast.success('Template uploaded successfully!')
      onSuccess()
      
      // Reset form
      setFile(null)
      setPreview(null)
      setName('')
      setCategory('')
      setTags([])
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload template')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
          ${preview ? 'p-0' : ''}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                setPreview(null)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isDragActive
                ? "Drop the image here"
                : "Drag & drop an image here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Template Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Distracted Boyfriend"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tags (press Enter)"
            />
            <Button type="button" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleUpload} disabled={uploading || !file || !name || !category} className="w-full">
          {uploading ? "Uploading..." : "Upload Template"}
        </Button>
      </div>
    </div>
  )
}