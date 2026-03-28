import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  title: string
  description: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "outline"
}

export function PageHeader({ title, description, badge, badgeVariant = "secondary" }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
