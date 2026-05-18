'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

export function LikeButton({ memeId, initialLikes = 0 }: { memeId: string; initialLikes?: number }) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      checkIfLiked()
    }
  }, [user, memeId])

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user!.id)
      .eq('meme_id', memeId)
      .single()

    setIsLiked(!!data)
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like memes')
      return
    }

    setLoading(true)

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user!.id)
        .eq('meme_id', memeId)

      if (!error) {
        setLikes(prev => prev - 1)
        setIsLiked(false)
        
        // Update meme likes count
        await supabase
          .from('memes')
          .update({ likes_count: likes - 1 })
          .eq('id', memeId)
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: user!.id, meme_id: memeId })

      if (!error) {
        setLikes(prev => prev + 1)
        setIsLiked(true)
        
        // Update meme likes count
        await supabase
          .from('memes')
          .update({ likes_count: likes + 1 })
          .eq('id', memeId)
      }
    }

    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className="gap-2"
    >
      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
      <span>{likes}</span>
    </Button>
  )
}