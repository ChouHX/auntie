import { useMemo, useState, type ReactNode } from "react"
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  List,
  MoonStars,
  SignOut,
  Sun,
  UserCircle,
  X,
  type Icon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AdminNavItem<TSection extends string> = {
  group?: "content" | "main" | "settings"
  icon: Icon
  id: TSection
  label: string
}

type AdminLayoutProps<TSection extends string> = {
  activeSection: TSection
  children: ReactNode
  isDarkTheme: boolean
  isRefreshing?: boolean
  isSaving: boolean
  items: AdminNavItem<TSection>[]
  loading?: boolean
  logoImage?: string
  onLogout: () => void
  onRefresh?: () => void
  onSectionChange: (section: TSection) => void
  onThemeToggle: () => void
  subtitle: string
  title: string
}

function AdminLayout<TSection extends string>({
  activeSection,
  children,
  isDarkTheme,
  isRefreshing = false,
  items,
  loading,
  logoImage = "/logo.webp",
  onLogout,
  onRefresh,
  onSectionChange,
  onThemeToggle,
  subtitle,
  title,
}: AdminLayoutProps<TSection>) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeSection) ?? items[0],
    [activeSection, items]
  )

  function handleSectionChange(section: TSection) {
    onSectionChange(section)
    setIsNavOpen(false)
  }

  return (
    <div
      className="min-h-screen bg-muted text-foreground"
      data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
    >
      <AdminSidebar
        activeSection={activeSection}
        collapsed={isSidebarCollapsed}
        items={items}
        logoImage={logoImage}
        onSectionChange={handleSectionChange}
      />

      <button
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity lg:hidden",
          isNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsNavOpen(false)}
        tabIndex={-1}
        type="button"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[230px] border-r border-border bg-card shadow-xl transition-transform lg:hidden",
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebarContent
          activeSection={activeSection}
          items={items}
          logoImage={logoImage}
          onClose={() => setIsNavOpen(false)}
          onSectionChange={handleSectionChange}
        />
      </aside>

      <div
        className={cn(
          "min-w-0 transition-[padding] duration-300 lg:pl-[230px]",
          isSidebarCollapsed && "lg:pl-[88px]"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              aria-label="打开后台菜单"
              className="size-8 rounded-md lg:hidden"
              onClick={() => setIsNavOpen(true)}
              size="icon-sm"
              type="button"
              variant="navIcon"
            >
              <List size={17} weight="bold" />
            </Button>
            <Button
              aria-label={isSidebarCollapsed ? "展开后台菜单" : "折叠后台菜单"}
              className="hidden size-8 rounded-md lg:inline-flex"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              size="icon-sm"
              type="button"
              variant="navIcon"
            >
              {isSidebarCollapsed ? (
                <CaretRight size={17} weight="bold" />
              ) : (
                <CaretLeft size={17} weight="bold" />
              )}
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                  {activeItem?.label ?? title}
                </h1>
                {loading ? (
                  <Badge className="hidden h-6 border-border bg-muted text-[11px] text-muted-foreground sm:inline-flex">
                    Loading
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>

            {onRefresh ? (
              <Button
                aria-label="刷新当前页面数据"
                className="size-9 min-[420px]:size-10"
                disabled={isRefreshing}
                onClick={onRefresh}
                size="icon"
                title="刷新当前页面数据"
                type="button"
                variant="navIcon"
              >
                <ArrowsClockwise
                  className={cn(isRefreshing && "animate-spin")}
                  size={18}
                  weight="bold"
                />
              </Button>
            ) : null}

            <Button
              aria-label={isDarkTheme ? "切换亮色模式" : "切换暗色模式"}
              className="size-9 min-[420px]:size-10"
              onClick={onThemeToggle}
              size="icon"
              type="button"
              variant="navIcon"
            >
              {isDarkTheme ? <Sun size={18} /> : <MoonStars size={18} />}
            </Button>

            <AdminProfileMenu onLogout={onLogout} />
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px] min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}

function AdminSidebar<TSection extends string>({
  activeSection,
  collapsed,
  items,
  logoImage,
  onSectionChange,
}: {
  activeSection: TSection
  collapsed: boolean
  items: AdminNavItem<TSection>[]
  logoImage: string
  onSectionChange: (section: TSection) => void
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 hidden border-r border-border bg-card transition-[width] duration-300 lg:block",
        collapsed ? "w-[88px]" : "w-[230px]"
      )}
    >
      <AdminSidebarContent
        activeSection={activeSection}
        collapsed={collapsed}
        items={items}
        logoImage={logoImage}
        onSectionChange={onSectionChange}
      />
    </aside>
  )
}

function AdminSidebarContent<TSection extends string>({
  activeSection,
  collapsed = false,
  items,
  logoImage,
  onClose,
  onSectionChange,
}: {
  activeSection: TSection
  collapsed?: boolean
  items: AdminNavItem<TSection>[]
  logoImage: string
  onClose?: () => void
  onSectionChange: (section: TSection) => void
}) {
  const groupedItems = useMemo(() => {
    const groups: Array<{
      id: NonNullable<AdminNavItem<TSection>["group"]>
      label: string
      items: AdminNavItem<TSection>[]
    }> = [
      { id: "main", label: "Main Menu", items: [] },
      { id: "content", label: "Content", items: [] },
      { id: "settings", label: "Support", items: [] },
    ]

    items.forEach((item) => {
      const group = item.group ?? "content"
      const target = groups.find((candidate) => candidate.id === group)
      target?.items.push(item)
    })

    return groups.filter((group) => group.items.length > 0)
  }, [items])

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center gap-3 border-b border-border px-5",
          collapsed && "justify-center px-3"
        )}
      >
        <img
          alt=""
          className="size-10 rounded-xl object-cover"
          src={logoImage}
        />
        <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
          <div className="truncate text-base font-semibold tracking-[-0.03em]">
            陈阿姨到家
          </div>
          <div className="truncate text-xs text-muted-foreground">Admin</div>
        </div>
        {onClose ? (
          <Button
            aria-label="关闭后台菜单"
            className="size-8 rounded-md"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X size={17} weight="bold" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {groupedItems.map((group) => (
          <div className="mb-6 last:mb-0" key={group.id}>
            <div
              className={cn(
                "mb-3 text-center text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase",
                collapsed && "sr-only"
              )}
            >
              {group.label}
            </div>
            <nav className="grid gap-1.5">
              {group.items.map((item) => (
                <AdminSidebarButton
                  active={activeSection === item.id}
                  collapsed={collapsed}
                  item={item}
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSidebarButton<TSection extends string>({
  active,
  collapsed,
  item,
  onClick,
}: {
  active: boolean
  collapsed?: boolean
  item: AdminNavItem<TSection>
  onClick: () => void
}) {
  const Icon = item.icon

  return (
    <Button
      className={cn(
        "h-10 w-full justify-center gap-3 rounded-full px-3 text-center text-sm font-medium text-foreground/75 hover:bg-primary/10 hover:text-primary",
        active && "bg-primary/10 text-primary"
      )}
      onClick={onClick}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Icon className="text-current" size={17} weight="bold" />
      <span className={cn("truncate", collapsed && "sr-only")}>
        {item.label}
      </span>
    </Button>
  )
}

function AdminProfileMenu({ onLogout }: { onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-10 gap-2 rounded-full px-1.5 pr-3"
          type="button"
          variant="ghost"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
            <UserCircle size={18} weight="bold" />
          </span>
          <span className="hidden text-sm font-medium md:inline">管理员</span>
          <CaretDown className="hidden md:block" size={14} weight="bold" />
          <span className="sr-only">打开账号菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">管理员</div>
          <div className="text-xs font-normal text-muted-foreground">
            内容管理后台
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <SignOut size={15} />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AdminLayout, type AdminNavItem }
