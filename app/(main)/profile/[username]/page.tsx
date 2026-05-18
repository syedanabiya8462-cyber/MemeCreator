'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemeGrid } from '@/components/meme/MemeGrid'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Meme } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Calendar, Users, Heart, MessageCircle, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<User | null>(null)
  const [memes, setMemes] = useState<Meme[]>([])
  const [likedMemes, setLikedMemes] = useState<Meme[]>([])
  const [bookmarkedMemes, setBookmarkedMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
    fetchMemes()
    checkFollowStatus()
  }, [username])

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (!error && data) {
      setProfile(data)
      fetchFollowCounts(data.id)
    }
    setLoading(false)
  }

  const fetchMemes = async () => {
    const { data } = await supabase
      .from('memes')
      .select('*, user:users(*), template:templates(*)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (data) setMemes(data)
  }

  const fetchFollowCounts = async (userId: string) => {
    // Get followers count
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get following count
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    setFollowersCount(followers || 0)
    setFollowingCount(following || 0)
  }

  const checkFollowStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', profile?.id)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please login to follow users')
      return
    }

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile?.id)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
      toast.success(`Unfollowed ${profile?.display_name}`)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile?.id })
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
      toast.success(`Following ${profile?.display_name}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 mb-8">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/10" />

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-24">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-4xl">
                {profile.display_name?.charAt(0) || profile.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
              
              {profile.bio && (
                <p className="mb-4">{profile.bio}</p>
              )}
              
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{followersCount} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{followingCount} following</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="memes">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="memes">Memes ({memes.length})</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
              <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
            </TabsList>
            
            <TabsContent value="memes" className="mt-6">
              <MemeGrid memes={memes} />
            </TabsContent>
            
            <TabsContent value="liked" className="mt-6">
              <MemeGrid memes={likedMemes} />
            </TabsContent>
            
            <TabsContent value="bookmarked" className="mt-6">
              <MemeGrid memes={bookmarkedMemes} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}