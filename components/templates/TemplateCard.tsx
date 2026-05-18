import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function TemplateCard({ template }: { template: any }) {
  return (
    <Link href={template.isExternal ? `/create?imageUrl=${encodeURIComponent(template.image_url)}` : `/create?templateId=${template.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-square">
          <Image
            src={template.image_url}
            alt={template.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate">{template.name}</h3>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{template.category}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}