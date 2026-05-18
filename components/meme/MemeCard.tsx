'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LikeButton } from '@/components/social/LikeButton'
import { Heart, MessageCircle, Bookmark, PenLine } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface MemeCardProps {
  meme: any
  variant?: 'default' | 'compact'
}

export function MemeCard({ meme, variant = 'default' }: MemeCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={`/meme/${meme.id}`}>
        <div className="relative bg-muted">
          <Image
            src={meme.image_url}
            alt="Meme"
            width={400}
            height={400}
            className="w-full h-auto object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        </div>
      </Link>
      
      <div className="p-3">
        {variant !== 'compact' && (
          <Link href={`/profile/${meme.user?.username}`}>
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={meme.user?.avatar_url} />
                <AvatarFallback>{meme.user?.display_name?.[0] || meme.user?.username?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {meme.user?.display_name || meme.user?.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(meme.created_at), { addSuffix: true })}
              </span>
            </div>
          </Link>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <LikeButton memeId={meme.id} initialLikes={meme.likes_count} />
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{meme.comments_count || 0}</span>
            </button>
          </div>
          <div className="flex gap-2">
            <Link href={`/create?imageUrl=${encodeURIComponent(meme.image_url)}`} className="text-muted-foreground hover:text-primary transition-colors">
              <PenLine className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="text-muted-foreground hover:text-primary"
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-primary text-primary")} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}