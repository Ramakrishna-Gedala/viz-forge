import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-14 items-center gap-2 px-4 border-b bg-background sticky top-0 z-10">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <span className="text-sm font-medium truncate flex-1">
        {title ?? "Data Processing Learning Platform"}
      </span>
      <ThemeSwitcher />
    </header>
  )
}
