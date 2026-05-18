'use client'

import { useState, useEffect, useCallback } from 'react'
import { MemeGrid } from '@/components/meme/MemeGrid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, TrendingUp, Clock, Flame } from 'lucide-react'
import { Meme } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function ExplorePage() {
  const [memes, setMemes] = useState<Meme[]>([])
  const [externalMemes, setExternalMemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [externalLoading, setExternalLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'new' | 'top'>('trending')
  const [timeFrame, setTimeFrame] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchMemes = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1)
      setMemes([])
    }

    setLoading(true)
    
    try {
      const queryParams = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        sortBy,
        timeFrame,
      })
      if (searchQuery) queryParams.set('search', searchQuery)

      const res = await fetch(`/api/explore?${queryParams}`)
      const data = await res.json()

      if (res.ok) {
        if (reset) {
          setMemes(data)
        } else {
          setMemes(prev => [...prev, ...data])
        }
        setHasMore(data.length === 20)
      } else {
        console.error('Failed to fetch memes:', data.error)
      }
    } catch (error) {
      console.error('Network error fetching memes:', error)
    }
    
    setLoading(false)
  }, [searchQuery, sortBy, timeFrame, page])

  useEffect(() => {
    fetchMemes(true)
  }, [searchQuery, sortBy, timeFrame])

  useEffect(() => {
    const fetchExternal = async () => {
      setExternalLoading(true)
      try {
        const res = await fetch('/api/external/trending')
        if (res.ok) {
          const data = await res.json()
          setExternalMemes(data.slice(0, 10)) // Get top 10
        }
      } catch (error) {
        console.error('Error fetching external memes:', error)
      } finally {
        setExternalLoading(false)
      }
    }
    fetchExternal()
  }, [])

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      fetchMemes()
    }
  }

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search memes by caption, template, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Sort and Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <TabsList>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  <Clock className="w-4 h-4" />
                  New
                </TabsTrigger>
                <TabsTrigger value="top" className="gap-2">
                  <Flame className="w-4 h-4" />
                  Top
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {sortBy === 'top' && (
              <Select value={timeFrame} onValueChange={(v) => setTimeFrame(v as any)}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* Trending External Memes */}
        {sortBy === 'trending' && !searchQuery && externalMemes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Trending Across the Web</h2>
            </div>
            {externalLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-none w-[300px] h-[300px] bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {externalMemes.map(meme => (
                  <div key={meme.id} className="flex-none w-[300px]">
                    <div className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                      <img 
                        src={meme.image_url} 
                        alt={meme.name} 
                        className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <p className="text-white font-medium truncate mb-2">{meme.name}</p>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.location.href = `/create?imageUrl=${encodeURIComponent(meme.image_url)}`}
                        >
                          Remix Template
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Community Memes</h2>
        </div>

        <MemeGrid memes={memes} loading={loading} />
        
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!hasMore && memes.length > 0 && (
          <p className="text-center text-muted-foreground py-8">
            You've reached the end! 🎉
          </p>
        )}
      </div>
    </div>
  )
}