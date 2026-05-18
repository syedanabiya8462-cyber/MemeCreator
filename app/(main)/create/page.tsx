'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { MemeEditor } from '@/components/meme/MemeEditor'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import { Loader2, Sparkles, Wand2, Image as ImageIcon, RefreshCw, Shuffle, Download, Share2, Save, Clock, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  // State for meme generation
  const [activeTab, setActiveTab] = useState<'template' | 'ai'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('funny')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedAnimation, setGeneratedAnimation] = useState<string>('none')
  const [agentCaptions, setAgentCaptions] = useState<{ top: string; bottom: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const [recentMemes, setRecentMemes] = useState<any[]>([])
  const [trendingPrompts, setTrendingPrompts] = useState<string[]>([
    "Distracted boyfriend but with programming languages",
    "Two panel meme about work from home struggles",
    "Expanding brain meme about AI",
    "Drake hotline bling rejecting vs loving memes",
    "Change my mind template about pineapple on pizza"
  ])

  // Load recent memes
  useEffect(() => {
    if (user) {
      loadRecentMemes()
    }
  }, [user])

  // Load template from URL query param client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const templateId = params.get('templateId')
      const imageUrlParam = params.get('imageUrl')

      if (templateId) {
        supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setSelectedTemplate(data)
            }
          })
      } else if (imageUrlParam) {
        setGeneratedImage(decodeURIComponent(imageUrlParam))
      }
    }
  }, [supabase])

  const loadRecentMemes = async () => {
    const { data } = await supabase
      .from('memes')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentMemes(data)
    }
  }

  // Handle AI image generation
  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt describing your meme')
      return
    }



    setIsGenerating(true)
    const loadingToast = toast.loading('Generating your meme with AI...')

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      setGeneratedImage(data.imageUrl)
      setSelectedTemplate(null)
      
      // Apply the fresh creative captions returned by the AI
      if (data.topText || data.bottomText) {
        setAgentCaptions({ 
          top: data.topText || '', 
          bottom: data.bottomText || '' 
        })
      } else {
        setAgentCaptions(null)
      }
      
      const animations = ['pulse', 'bounce', 'spin', 'none']
      const randomAnim = animations[Math.floor(Math.random() * (animations.length - 1))] // prioritize real animations
      setGeneratedAnimation(randomAnim)

      toast.success('Fresh new creative meme generated!', { id: loadingToast })
      
      // Add to generation history
      setGenerationHistory(prev => [{
        prompt: aiPrompt,
        imageUrl: data.imageUrl,
        timestamp: new Date()
      }, ...prev].slice(0, 10))
      
    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate meme', { id: loadingToast })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle random meme generation
  const handleRandomGeneration = async () => {
    const randomPrompt = trendingPrompts[Math.floor(Math.random() * trendingPrompts.length)]
    setAiPrompt(randomPrompt)
    // Small delay to show the prompt being set
    setTimeout(() => handleAIGeneration(), 100)
  }



  // Handle saving the meme
  const handleSaveMeme = async (imageUrl: string, captions?: any) => {
    const userId = user?.id || '00000000-0000-0000-0000-000000000001'
    setIsSaving(true)

    try {
      // First, download the generated image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Upload to Supabase Storage
      const fileName = `${userId}-${Date.now()}.png`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName)

      // Save to database
      const { data: memeData, error: dbError } = await supabase
        .from('memes')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          template_id: selectedTemplate?.id || null,
          caption_custom: captions || null,
          is_public: true,
          is_ai_generated: activeTab === 'ai',
          generation_prompt: activeTab === 'ai' ? aiPrompt : null
        })
        .select()
        .single()

      if (dbError) throw dbError

      toast.success('Meme saved to your gallery!')
      
      // Update template usage count if template was used
      if (selectedTemplate) {
        await supabase.rpc('increment_template_usage', { template_id: selectedTemplate.id })
      }
      
      // Navigate to the meme page
      router.push(`/meme/${memeData.id}`)
      
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save meme')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle sharing
  const handleShare = async (platform: string) => {
    const shareUrl = window.location.href
    const shareText = `Check out this hilarious meme I created on MemeMaster!`
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      discord: `https://discord.com/channels/@me`
    }
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Your Meme (Or don't. I'm not your boss)
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose a template or let the robot do all the heavy lifting for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Creation Options */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Template
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Generator
                </TabsTrigger>
              </TabsList>

              {/* Template Tab */}
              <TabsContent value="template" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Choose a Template</CardTitle>
                    <CardDescription>
                      Select from 50+ classic meme templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplateGallery
                      onSelectTemplate={(template) => {
                        setSelectedTemplate(template)
                        setGeneratedImage(null)
                        setAgentCaptions(null)
                      }}
                      selectedTemplateId={selectedTemplate?.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Generation Tab */}
              <TabsContent value="ai" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Describe Your Masterpiece</CardTitle>
                    <CardDescription>
                      Tell AI what kind of meme you want. Be specific, it can't read your mind (yet).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Example: A cat sitting at a computer looking confused, with text about debugging code..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    
                    <Select value={aiStyle} onValueChange={setAiStyle}>
                      <option value="funny">Funny 😂</option>
                      <option value="sarcastic">Sarcastic 🙄</option>
                      <option value="wholesome">Wholesome 🥰</option>
                      <option value="dark">Dark Humor 💀</option>
                      <option value="professional">Professional 👔</option>
                    </Select>

                    <div className="flex gap-4 mt-6">
                      <Button 
                        onClick={handleAIGeneration} 
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Wand2 className="w-5 h-5" />
                        )}
                        Generate Meme
                      </Button>
                      <Button 
                        onClick={handleRandomGeneration}
                        variant="outline"
                        disabled={isGenerating}
                        className="gap-2"
                        size="lg"
                      >
                        <Shuffle className="w-5 h-5" />
                        Surprise Me
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Prompts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Trending Prompts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {trendingPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start text-left"
                          onClick={() => setAiPrompt(prompt)}
                        >
                          <Sparkles className="w-3 h-3 mr-2 text-purple-500" />
                          <span className="text-sm truncate">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Generation History */}
                {generationHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Generations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {generationHistory.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setAiPrompt(item.prompt)
                              setGeneratedImage(item.imageUrl)
                            }}
                          >
                            <div className="w-12 h-12 relative rounded overflow-hidden">
                              <Image
                                src={item.imageUrl}
                                alt="History"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{item.prompt}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>


            </Tabs>

            {/* Recent Memes */}
            {recentMemes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Your Recent Memes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentMemes.map((meme) => (
                      <div
                        key={meme.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => router.push(`/meme/${meme.id}`)}
                      >
                        <div className="w-12 h-12 relative rounded overflow-hidden">
                          <Image
                            src={meme.image_url}
                            alt="Recent meme"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Meme #{meme.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meme.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Editor & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meme Editor */}
            {(selectedTemplate || generatedImage) && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Meme Editor</CardTitle>
                  <CardDescription>
                    Customize your meme with text, filters, and more
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <MemeEditor
                    initialImage={generatedImage || selectedTemplate?.image_url}
                    template={selectedTemplate}
                    initialCaptions={agentCaptions}
                    initialAnimation={generatedAnimation}
                    onSave={handleSaveMeme}
                  />
                </CardContent>
              </Card>
            )}

            {/* No Selection State */}
            {!selectedTemplate && !generatedImage && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Nothing Selected... crickets...</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-8 text-lg">
                    Pick a template or let the AI do it. Come on, we don't have all day.
                  </p>
                  <div className="flex justify-center gap-6 w-full max-w-md mx-auto">
                    <Button onClick={() => setActiveTab('template')} size="lg" className="flex-1">
                      Browse Templates
                    </Button>
                    <Button onClick={() => setActiveTab('ai')} variant="outline" size="lg" className="flex-1">
                      Try AI Generation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {(selectedTemplate || generatedImage) && (
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (generatedImage) {
                      const link = document.createElement('a')
                      link.href = generatedImage
                      link.download = 'meme.png'
                      link.click()
                      toast.success('Meme downloaded!')
                    }
                  }}
                  className="gap-2 min-w-[140px]"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('copy')}
                  className="gap-2 min-w-[120px]"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button
                  onClick={() => {
                    if (generatedImage) {
                      handleSaveMeme(generatedImage)
                    } else if (selectedTemplate) {
                      toast.success('Use the editor to save your meme')
                    }
                  }}
                  disabled={isSaving}
                  className="gap-2 min-w-[160px]"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save to Gallery
                </Button>
              </div>
            )}

            {/* Tips Section */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Pro Tips
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use specific descriptions for better AI results</li>
                  <li>• Drag text boxes anywhere on the image</li>
                  <li>• Try different tones for captions to match your humor</li>
                  <li>• Save your memes to share with the community</li>
                  <li>• Like and comment on others' memes to show support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}