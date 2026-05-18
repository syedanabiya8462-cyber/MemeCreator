'use client'

import { Button } from '@/components/ui/button'
import { 
  Twitter, 
  Instagram, 
  MessageCircle, 
  Share2, 
  Copy, 
  Download,
  Link as LinkIcon,
  Code
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

interface ShareButtonsProps {
  memeId: string
  memeUrl: string
  caption?: string
  onDownload?: () => void
}

export function ShareButtons({ memeId, memeUrl, caption, onDownload }: ShareButtonsProps) {
  const shareToTwitter = () => {
    const text = caption ? `Check out this meme: ${caption}` : 'Check out this awesome meme!'
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(memeUrl)}`
    window.open(url, '_blank')
  }

  const shareToReddit = () => {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(memeUrl)}`
    window.open(url, '_blank')
  }

  const shareToDiscord = () => {
    const url = `https://discord.com/channels/@me`
    navigator.clipboard.writeText(memeUrl)
    toast.success('Link copied! Paste it in Discord.')
    window.open(url, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(memeUrl)
    toast.success('Link copied to clipboard!')
  }

  const getEmbedCode = () => {
    const embedCode = `<iframe src="${process.env.NEXT_PUBLIC_APP_URL}/embed/${memeId}" width="600" height="600" frameborder="0" allowfullscreen></iframe>`
    navigator.clipboard.writeText(embedCode)
    toast.success('Embed code copied!')
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={shareToTwitter}>
        <Twitter className="w-4 h-4 mr-2" />
        Twitter
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={shareToReddit}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Reddit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToDiscord}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Discord
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyLink}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={getEmbedCode}>
            <Code className="w-4 h-4 mr-2" />
            Get Embed Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {onDownload && (
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      )}
    </div>
  )
}