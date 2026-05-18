'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Sparkles, RefreshCw } from 'lucide-react'
import { ToneType } from '@/types'
import toast from 'react-hot-toast'

export function AICaptionSuggestion({ template, onSelectCaption }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tone, setTone] = useState<ToneType>('sarcastic')

  const generateCaptions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template?.id,
          context: template?.name,
          tone,
          count: 5
        })
      })
      
      const data = await response.json()
      setSuggestions(data.captions)
    } catch (error) {
      toast.error('Failed to generate captions')
    } finally {
      setLoading(false)
    }
  }

  const enhanceCaption = async (caption: string) => {
    toast.loading('Making it funnier...')
    try {
      const response = await fetch('/api/ai/enhance-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          instruction: 'Make it funnier and more engaging'
        })
      })
      
      const data = await response.json()
      toast.dismiss()
      onSelectCaption(data.enhanced)
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to enhance caption')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={tone} onValueChange={(value: ToneType) => setTone(value)}>
          <option value="sarcastic">Sarcastic 😏</option>
          <option value="wholesome">Wholesome 🥰</option>
          <option value="dark">Dark 💀</option>
          <option value="professional">Professional 👔</option>
          <option value="gen-z">Gen-Z 📱</option>
        </Select>
        <Button onClick={generateCaptions} disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Captions
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-6 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      )}

      {suggestions.map((suggestion, index) => (
        <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            {suggestion.top && (
              <p className="font-semibold">Top: {suggestion.top}</p>
            )}
            {suggestion.bottom && (
              <p className="font-semibold">Bottom: {suggestion.bottom}</p>
            )}
            {suggestion.custom && suggestion.custom.map((text: string, i: number) => (
              <p key={i}>{text}</p>
            ))}
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => onSelectCaption(suggestion)}>
                Use This
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => enhanceCaption(suggestion.top || suggestion.bottom || suggestion.custom?.[0])}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Make Funnier
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}