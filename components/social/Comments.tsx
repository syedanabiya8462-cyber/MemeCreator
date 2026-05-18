'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export function Comments({ memeId }: { memeId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
  }, [memeId])

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(*)')
      .eq('meme_id', memeId)
      .order('created_at', { ascending: false })

    if (!error) {
      setComments(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }
    if (!newComment.trim()) return

    setSubmitting(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        meme_id: memeId,
        content: newComment.trim()
      })
      .select('*, user:users(*)')
      .single()

    if (!error && data) {
      setComments([data, ...comments])
      setNewComment('')
      toast.success('Comment added!')
      
      // Update comment count
      await supabase
        .from('memes')
        .update({ comments_count: comments.length + 1 })
        .eq('id', memeId)
    } else {
      toast.error('Failed to post comment')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.user?.avatar_url} />
                <AvatarFallback>
                  {comment.user?.display_name?.[0] || comment.user?.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.user?.display_name || comment.user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}