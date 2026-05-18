import { MemeCard } from './MemeCard'
import { Skeleton } from '@/components/ui/skeleton'

interface MemeGridProps {
  memes: any[]
  loading?: boolean
  columns?: 3 | 4 | 5
}

export function MemeGrid({ memes, loading = false, columns = 4 }: MemeGridProps) {
  if (loading) {
    const skeletonCount = 12
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No memes found</p>
      </div>
    )
  }

  const gridCols = {
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  )
}