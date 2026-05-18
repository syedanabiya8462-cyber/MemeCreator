'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Compass, 
  Image as ImageIcon, 
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  Bookmark,
  User,
  Settings
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const mainLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/templates', label: 'Templates', icon: ImageIcon },
    { href: '/create', label: 'Create', icon: Sparkles },
  ]

  const discoverLinks = [
    { href: '/explore?sort=trending', label: 'Trending', icon: TrendingUp },
    { href: '/explore?sort=newest', label: 'Latest', icon: Clock },
  ]

  const userLinks = user ? [
    { href: `/profile/${user.user_metadata?.username || user.email?.split('@')[0]}`, label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ] : []

  return (
    <aside className="hidden lg:block fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <div className="flex h-full flex-col justify-between py-6">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">MAIN</h3>
            <div className="space-y-1">
              {mainLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Discover */}
          <div>
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">DISCOVER</h3>
            <div className="space-y-1">
              {discoverLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User */}
          {user && (
            <div>
              <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">YOUR SPACE</h3>
              <div className="space-y-1">
                {userLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Create hilarious memes with AI. Share with the world!
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}