import { Link, useLocation } from "react-router-dom"
import {
  BarChart2,
  BarChart3,
  BrainCircuit,
  Database,
  Flame,
  Home,
  LineChart,
  Radar,
  Sigma,
  Wind,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: Home, color: "text-slate-500" },
  { label: "Matplotlib", path: "/tools/matplotlib", icon: LineChart, color: "text-blue-500" },
  { label: "Seaborn", path: "/tools/seaborn", icon: BarChart3, color: "text-purple-500" },
  { label: "Plotly", path: "/tools/plotly", icon: Radar, color: "text-green-500" },
  { label: "Pandas", path: "/tools/pandas", icon: BarChart2, color: "text-orange-500" },
  { label: "Bokeh", path: "/tools/bokeh", icon: Flame, color: "text-red-500" },
  { label: "Altair", path: "/tools/altair", icon: Wind, color: "text-cyan-500" },
  { label: "PySpark", path: "/tools/spark", icon: Database, color: "text-yellow-500" },
  { label: "NumPy", path: "/tools/numpy", icon: Sigma, color: "text-pink-500" },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">Data Platform</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon className={cn("h-4 w-4", item.color)} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
