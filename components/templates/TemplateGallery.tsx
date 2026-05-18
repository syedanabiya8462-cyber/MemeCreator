'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TemplateGalleryProps {
  onSelectTemplate: (template: any) => void
  selectedTemplateId?: string
}

export function TemplateGallery({ onSelectTemplate, selectedTemplateId }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [searchTerm])

  const fetchTemplates = async () => {
    setLoading(true)
    
    let query = supabase
      .from('templates')
      .select('*')
      .order('usage_count', { ascending: false })

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setTemplates(data)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer overflow-hidden transition-all hover:scale-105 hover:shadow-lg",
                selectedTemplateId === template.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="relative aspect-square">
                <Image
                  src={template.image_url}
                  alt={template.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  Used {template.usage_count} times
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}