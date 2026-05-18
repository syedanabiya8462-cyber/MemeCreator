'use client'

import { useState, useEffect } from 'react'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { TemplateUpload } from '@/components/templates/TemplateUpload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Search, Upload, TrendingUp, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

const categories = [
  'All', 'Reaction', 'Wholesome', 'Dark Humor', 'Work', 'Relationships', 'Animals', 'Gaming', 'Classic'
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [externalTemplates, setExternalTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [externalLoading, setExternalLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showUpload, setShowUpload] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, searchTerm])

  useEffect(() => {
    const fetchExternal = async () => {
      setExternalLoading(true)
      try {
        const res = await fetch('/api/external/trending')
        if (res.ok) {
          const data = await res.json()
          setExternalTemplates(data)
        }
      } catch (error) {
        console.error('Error fetching external templates:', error)
      } finally {
        setExternalLoading(false)
      }
    }
    fetchExternal()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    
    let query = supabase
      .from('templates')
      .select('*')
      .order('usage_count', { ascending: false })

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory)
    }

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
    } else {
      setTemplates(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Meme Templates</h1>
          <p className="text-muted-foreground">Choose from our collection of classic and custom templates</p>
        </div>
        {user && (
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <TemplateUpload onSuccess={() => {
                setShowUpload(false)
                fetchTemplates()
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Trending Templates Section */}
      {selectedCategory === 'All' && !searchTerm && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Trending Templates</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {templates.slice(0, 6).map((template: any) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">
            {selectedCategory === 'All' ? 'All Templates' : selectedCategory}
          </h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {templates.map((template: any) => (
              <TemplateCard key={template.id} template={template} />
            ))}
            {selectedCategory === 'All' && !searchTerm && externalTemplates.map((template: any) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}