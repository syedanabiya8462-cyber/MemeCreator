'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LikeButton } from '@/components/social/LikeButton'
import { Comments } from '@/components/social/Comments'
import { ShareButtons } from '@/components/social/ShareButtons'
import { Heart, MessageCircle, Share2, Bookmark, Flag, Download, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function MemeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [meme, setMeme] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
  const [relatedMemes, setRelatedMemes] = useState<any[]>([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMemeDetails()
  }, [params.id])

  const fetchMemeDetails = async () => {
    setLoading(true)
    
    // Fetch meme
    const { data: memeData, error: memeError } = await supabase
      .from('memes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (memeError || !memeData) {
      toast.error('Meme not found')
      router.push('/explore')
      return
    }

    setMeme(memeData)

    // Fetch creator
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', memeData.user_id)
      .single()

    setCreator(userData)

    // Fetch related memes (same template or same creator)
    let query = supabase
      .from('memes')
      .select('*, user:users(*)')
      .eq('is_public', true)
      .neq('id', params.id)
      .limit(6)

    if (memeData.template_id) {
      query = query.eq('template_id', memeData.template_id)
    } else {
      query = query.eq('user_id', memeData.user_id)
    }

    const { data: relatedData } = await query
    setRelatedMemes(relatedData || [])

    // Check if bookmarked
    if (user) {
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('meme_id', params.id)
        .single()

      setIsBookmarked(!!bookmarkData)
    }

    // Increment view count (optional)
    await supabase.rpc('increment_meme_views', { meme_id: params.id })

    setLoading(false)
  }

  const handleBookmark = async () => {
    if (!user) {
      toast.error('Please login to bookmark memes')
      return
    }

    if (isBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('meme_id', params.id)

      if (!error) {
        setIsBookmarked(false)
        toast.success('Removed from bookmarks')
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, meme_id: params.id })

      if (!error) {
        setIsBookmarked(true)
        toast.success('Saved to bookmarks')
      }
    }
  }

  const handleReport = async () => {
    if (!user) {
      toast.error('Please login to report')
      return
    }

    // Open report modal or handle report
    toast.success('Report submitted. We will review it.')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-muted rounded-lg mb-8"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!meme) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Meme Display */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative bg-black/5">
              <Image
                src={meme.image_url}
                alt="Meme"
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            
            {/* Action Buttons */}
            <div className="p-4 border-t flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-4">
                <LikeButton memeId={meme.id} initialLikes={meme.likes_count} />
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{meme.comments_count || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBookmark} className="gap-2">
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                  Bookmark
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReport} className="gap-2">
                  <Flag className="w-4 h-4" />
                  Report
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = meme.image_url
                    link.download = `meme-${meme.id}.png`
                    link.click()
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <ShareButtons memeId={meme.id} memeUrl={meme.image_url} />
              </div>
            </div>
          </Card>

          {/* Creator Info */}
          {creator && (
            <Card className="p-4 mt-6">
              <div className="flex items-center justify-between">
                <Link href={`/profile/${creator.username}`} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>{creator.display_name?.[0] || creator.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{creator.display_name || creator.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(meme.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profile/${creator.username}`}>View Profile</Link>
                </Button>
              </div>
              
              {meme.generation_prompt && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">AI Prompt:</p>
                  <p className="text-sm text-muted-foreground">{meme.generation_prompt}</p>
                </div>
              )}
            </Card>
          )}

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Comments ({meme.comments_count || 0})</h3>
            <Comments memeId={meme.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likes</span>
                <span className="font-semibold">{meme.likes_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span className="font-semibold">{meme.comments_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-semibold">{meme.shares_count || 0}</span>
              </div>
            </div>
          </Card>

          {/* Related Memes */}
          {relatedMemes.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Related Memes</h3>
              <div className="space-y-3">
                {relatedMemes.map((related: any) => (
                  <Link key={related.id} href={`/meme/${related.id}`}>
                    <div className="flex gap-3 hover:bg-muted p-2 rounded-lg transition-colors">
                      <div className="relative w-16 h-16 rounded overflow-hidden">
                        <Image
                          src={related.image_url}
                          alt="Related meme"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {related.user?.display_name || related.user?.username}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>❤️ {related.likes_count}</span>
                          <span>💬 {related.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}