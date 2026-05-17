import { Link } from 'react-router-dom'
import type { Inspiration } from '@/types'
import { cn, formatDate, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS } from '@/lib/utils'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pin, MessageSquare, Link2, Eye } from 'lucide-react'

interface InspirationCardProps {
  inspiration: Inspiration
  className?: string
  compact?: boolean
}

export function InspirationCard({ inspiration, className, compact }: InspirationCardProps) {
  const {
    id,
    title,
    type,
    status,
    description,
    tags,
    connections,
    viewCount,
    isPinned,
    updatedAt,
  } = inspiration

  return (
    <Link to={`/inspiration/${id}`}>
      <Card
        className={cn(
          'group transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer',
          isPinned && 'ring-1 ring-primary/20',
          className
        )}
      >
        <CardHeader className={cn(compact ? 'p-3 pb-0' : 'p-4 pb-2')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <h3 className={cn('font-medium leading-tight truncate', compact ? 'text-sm' : 'text-sm')}>
                  {title}
                </h3>
              </div>
              {!compact && description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  STATUS_COLORS[status]
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(compact ? 'p-3 pt-1' : 'p-4 pt-2')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground">{TYPE_LABELS[type]}</span>
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
              {connections.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Link2 className="h-3 w-3" />
                  {connections.length}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {viewCount}
              </span>
              <span>{formatDate(updatedAt, 'relative')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
