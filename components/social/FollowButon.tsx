'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserPlus, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export function FollowButton({ userId }: { userId: string }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      checkFollowStatus()
    }
  }, [user, userId])

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user!.id)
      .eq('following_id', userId)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please login to follow users')
      return
    }

    if (user.id === userId) {
      toast.error("You can't follow yourself")
      return
    }

    setLoading(true)

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user!.id)
        .eq('following_id', userId)

      if (!error) {
        setIsFollowing(false)
        toast.success('Unfollowed')
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user!.id, following_id: userId })

      if (!error) {
        setIsFollowing(true)
        toast.success('Following!')
      }
    }

    setLoading(false)
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleFollow}
      disabled={loading}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </Button>
  )
}