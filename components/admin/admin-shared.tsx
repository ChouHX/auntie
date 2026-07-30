"use client"

import {
  type PointerEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  Code,
  CreditCard,
  DotsThree,
  GearSix,
  HouseLine,
  ImageSquare,
  Images,
  Key,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  MagnifyingGlass,
  MapPin,
  Minus,
  Newspaper,
  PencilSimple,
  Quotes,
  Tag,
  TextB,
  TextItalic,
  Trash,
  UploadSimple,
  UserCircle,
  Users,
  Wallet,
} from "@phosphor-icons/react"

import { type AdminNavItem } from "@/components/admin/admin-layout"
import { BlogMarkdown } from "@/components/blog-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  CmsBlogCategory,
  CmsBlogPost,
  CmsContent,
  CmsFaqItem,
  CmsStatus,
} from "@/types/cms"

export type AdminSection =
  | "dashboard"
  | "blogs"
  | "categories"
  | "gallery"
  | "reviews"
  | "faq"
  | "orders"
  | "customers"
  | "aunties"
  | "serviceAreas"
  | "siteSettings"
  | "paymentSettings"
  | "account"
export type FaqLanguage = "zh" | "en"
export type PersistContent = (
  updater: (current: CmsContent) => CmsContent,
  successMessage?: string
) => Promise<CmsContent | null>

export const adminSections: AdminNavItem<AdminSection>[] = [
  { id: "dashboard", label: "Dashboard", icon: HouseLine, group: "main" },
  { id: "blogs", label: "博客管理", icon: Newspaper, group: "content" },
  { id: "categories", label: "博客分类", icon: Tag, group: "content" },
  { id: "gallery", label: "画廊图片", icon: Images, group: "content" },
  { id: "reviews", label: "好评图片", icon: CheckCircle, group: "content" },
  { id: "faq", label: "QA管理", icon: ListChecks, group: "content" },
  { id: "orders", label: "订单管理", icon: Wallet, group: "main" },
  { id: "customers", label: "客户管理", icon: UserCircle, group: "main" },
  { id: "aunties", label: "阿姨管理", icon: Users, group: "main" },
  {
    id: "serviceAreas",
    label: "服务区域",
    icon: MapPin,
    group: "content",
  },
  {
    id: "siteSettings",
    label: "站点设置",
    icon: GearSix,
    group: "settings",
  },
  {
    id: "paymentSettings",
    label: "支付配置",
    icon: CreditCard,
    group: "settings",
  },
  { id: "account", label: "账号安全", icon: Key, group: "settings" },
]

export const adminSectionMeta: Record<
  AdminSection,
  {
    description: string
    title: string
  }
> = {
  account: {
    description: "更新后台登录密码和账号安全配置。",
    title: "账号安全",
  },
  blogs: {
    description: "维护博客文章、分类、发布状态和正文 Markdown。",
    title: "博客管理",
  },
  categories: {
    description: "维护博客分类，供文章筛选和前台展示使用。",
    title: "博客分类",
  },
  dashboard: {
    description: "查看订单金额、订单状态和当前待处理订单。",
    title: "Dashboard",
  },
  customers: {
    description: "查看企业微信客户资料并配置每日自动同步。",
    title: "客户管理",
  },
  faq: {
    description: "维护中英文 QA 条目和页面基础配置。",
    title: "QA管理",
  },
  gallery: {
    description: "管理画廊页面展示的服务图片。",
    title: "画廊图片",
  },
  orders: {
    description: "客服创建服务完成后付款订单并生成专属链接。",
    title: "订单管理",
  },
  aunties: {
    description: "管理阿姨信息、服务区域、状态和评分记录。",
    title: "阿姨管理",
  },
  paymentSettings: {
    description: "维护 Airwallex 支付开关、默认币种和环境变量状态。",
    title: "支付配置",
  },
  reviews: {
    description: "管理首页客户好评区域展示的截图素材。",
    title: "好评图片",
  },
  serviceAreas: {
    description:
      "维护服务覆盖的国家/地区与城市服务点，决定首页 3D 地球展示与预约可选项。",
    title: "服务区域",
  },
  siteSettings: {
    description: "维护电话、站点邮箱、通知邮箱和微信二维码。",
    title: "站点设置",
  },
}

export const tablePageSizeOptions = [10, 20, 50] as const
export const orderServiceTypeOptions = [
  "日常清洁",
  "深度清洁",
  "退租清洁",
  "开荒清洁",
  "地毯清洗",
  "商业清洁",
  "定期清洁",
  "其他",
]
export const emptyFaqItem: CmsFaqItem = {
  answer: [],
  id: "",
  question: "",
  sortOrder: 1,
  status: "draft",
}

export function RecordsPanel({
  action,
  bulkActions,
  children,
  count,
  countExtra,
  description,
  filters,
  hideSearch,
  query,
  searchPlaceholder,
  setQuery,
  showCount = true,
  title,
}: {
  action?: ReactNode
  bulkActions?: ReactNode
  children: ReactNode
  count: number
  countExtra?: ReactNode
  description?: string
  filters?: ReactNode
  hideSearch?: boolean
  query: string
  searchPlaceholder: string
  setQuery: (query: string) => void
  showCount?: boolean
  title?: string
}) {
  const hasControls = filters || action || !hideSearch
  const hasToolbar = hasControls || title

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {hasToolbar ? (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {title ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold text-foreground">
                  {title}
                </h2>
                {showCount ? (
                  <Badge variant="secondary">{count} 条</Badge>
                ) : null}
                {countExtra}
              </div>
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          {hasControls ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {filters}
              {hideSearch ? null : (
                <div className="relative">
                  <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    weight="bold"
                  />
                  <Input
                    className="h-9 w-full rounded-full border-input bg-background pl-9 text-sm shadow-none sm:w-64"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    value={query}
                  />
                </div>
              )}
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      {bulkActions}
      <div className="-mx-5 -mb-5 overflow-hidden border-t border-border [&_[data-slot=table-body]_[data-slot=table-row]:hover]:bg-muted/60 [&_[data-slot=table-cell]]:px-5 [&_[data-slot=table-cell]]:py-3.5 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-head]]:h-12 [&_[data-slot=table-head]]:px-5 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-medium [&_[data-slot=table-head]]:text-muted-foreground [&_[data-slot=table-row]]:border-border">
        {children}
      </div>
    </section>
  )
}

export function BulkActions({
  allCount,
  onClear,
  onDelete,
  onDraft,
  onPublish,
  onSelectAll,
  selectedCount,
}: {
  allCount: number
  onClear: () => void
  onDelete: () => void
  onDraft: () => void
  onPublish: () => void
  onSelectAll: () => void
  selectedCount: number
}) {
  if (!selectedCount) {
    return null
  }

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div>
        已选择{" "}
        <span className="font-semibold text-foreground">{selectedCount}</span>{" "}
        项
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedCount < allCount ? (
          <Button
            className="h-7 rounded-md px-2 text-xs"
            onClick={onSelectAll}
            size="xs"
            type="button"
            variant="outline"
          >
            选择全部 {allCount} 项
          </Button>
        ) : null}
        <Button
          className="h-7 rounded-md px-2 text-xs"
          onClick={onPublish}
          size="xs"
          type="button"
          variant="outline"
        >
          批量发布
        </Button>
        <Button
          className="h-7 rounded-md px-2 text-xs"
          onClick={onDraft}
          size="xs"
          type="button"
          variant="outline"
        >
          设为草稿
        </Button>
        <Button
          className="h-7 rounded-md px-2 text-xs"
          onClick={onDelete}
          size="xs"
          type="button"
          variant="destructive"
        >
          批量删除
        </Button>
        <Button
          className="h-7 rounded-md px-2 text-xs"
          onClick={onClear}
          size="xs"
          type="button"
          variant="ghost"
        >
          取消选择
        </Button>
      </div>
    </div>
  )
}

export type TablePagination = ReturnType<typeof useTablePagination>

export function useTablePagination(totalCount: number, resetKey: string) {
  const [state, setState] = useState({
    page: 1,
    pageSize: 10,
    resetKey,
  })
  const pageSize = state.pageSize
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const requestedPage = state.resetKey === resetKey ? state.page : 1
  const safePage = Math.min(Math.max(requestedPage, 1), totalPages)
  const startIndex = totalCount ? (safePage - 1) * pageSize : 0
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  function setPage(nextPage: number) {
    setState((current) => ({
      ...current,
      page: Math.min(Math.max(nextPage, 1), totalPages),
      resetKey,
    }))
  }

  function setPageSize(nextPageSize: number) {
    setState((current) => ({
      ...current,
      page: 1,
      pageSize: nextPageSize,
      resetKey,
    }))
  }

  return {
    endIndex,
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    startIndex,
    totalCount,
    totalPages,
  }
}

export function useTableSelection(resetKey: string) {
  const [state, setState] = useState({
    ids: [] as string[],
    resetKey,
  })
  const selectedIds = useMemo(
    () => (state.resetKey === resetKey ? state.ids : []),
    [resetKey, state.ids, state.resetKey]
  )

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggle(id: string, checked: boolean) {
    setState((currentState) => {
      const current = currentState.resetKey === resetKey ? currentState.ids : []

      if (checked) {
        return {
          ids: current.includes(id) ? current : [...current, id],
          resetKey,
        }
      }

      return {
        ids: current.filter((item) => item !== id),
        resetKey,
      }
    })
  }

  function toggleMany(ids: string[], checked: boolean) {
    setState((currentState) => {
      const current = currentState.resetKey === resetKey ? currentState.ids : []
      const next = new Set(current)

      ids.forEach((id) => {
        if (checked) {
          next.add(id)
        } else {
          next.delete(id)
        }
      })

      return {
        ids: Array.from(next),
        resetKey,
      }
    })
  }

  function selectAll(ids: string[]) {
    setState({
      ids: Array.from(new Set(ids)),
      resetKey,
    })
  }

  function clear() {
    setState({
      ids: [],
      resetKey,
    })
  }

  function getCheckedState(ids: string[]) {
    if (!ids.length) {
      return false
    }

    const selectedCount = ids.filter((id) => selectedSet.has(id)).length

    if (selectedCount === ids.length) {
      return true
    }

    return selectedCount ? "indeterminate" : false
  }

  return {
    clear,
    getCheckedState,
    isSelected: (id: string) => selectedSet.has(id),
    selectAll,
    selectedCount: selectedIds.length,
    selectedIds,
    toggle,
    toggleMany,
  }
}

export function TableFooterInfo({
  pagination,
}: {
  pagination: TablePagination
}) {
  const start = pagination.totalCount ? pagination.startIndex + 1 : 0
  const canPrevious = pagination.page > 1
  const canNext = pagination.page < pagination.totalPages

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          onValueChange={(value) => pagination.setPageSize(Number(value))}
          value={String(pagination.pageSize)}
        >
          <SelectTrigger className="h-8 w-[72px] rounded-md px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {tablePageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <div>
          Showing {start}-{pagination.endIndex} of {pagination.totalCount}
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="上一页"
            className="size-8 rounded-md"
            disabled={!canPrevious}
            onClick={() => pagination.setPage(pagination.page - 1)}
            size="icon-sm"
            type="button"
            variant="navIcon"
          >
            <CaretLeft size={14} weight="bold" />
          </Button>
          <div className="min-w-14 text-center">
            {pagination.page}/{pagination.totalPages}
          </div>
          <Button
            aria-label="下一页"
            className="size-8 rounded-md"
            disabled={!canNext}
            onClick={() => pagination.setPage(pagination.page + 1)}
            size="icon-sm"
            type="button"
            variant="navIcon"
          >
            <CaretRight size={14} weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RowMenu({
  destructiveLabel,
  hideEdit,
  onDelete,
  onEdit,
  onStatusChange,
  status,
}: {
  destructiveLabel: string
  hideEdit?: boolean
  onDelete: () => void | Promise<void>
  onEdit?: () => void
  onStatusChange?: (status: CmsStatus) => void | Promise<void>
  status?: CmsStatus
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="打开操作菜单"
          className="size-8 rounded-full"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <DotsThree size={18} weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg">
        {hideEdit ? null : (
          <DropdownMenuItem onClick={onEdit}>
            <PencilSimple size={15} />
            编辑
          </DropdownMenuItem>
        )}
        {onStatusChange && status ? (
          <>
            <DropdownMenuItem
              onClick={() =>
                onStatusChange(status === "published" ? "draft" : "published")
              }
            >
              <CheckCircle size={15} />
              {status === "published" ? "设为草稿" : "发布"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash size={15} />
          {destructiveLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StatusBadge({ status }: { status: CmsStatus }) {
  const isPublished = status === "published"

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          isPublished ? "bg-primary" : "bg-muted-foreground"
        )}
      />
      {isPublished ? "published" : "draft"}
    </span>
  )
}

export function UploadButton({
  disabled,
  label,
  onFile,
  onFiles,
  multiple = false,
}: {
  disabled?: boolean
  label: string
  multiple?: boolean
  onFile?: (file: File) => void
  onFiles?: (files: File[]) => void
}) {
  return (
    <Button
      asChild
      className="h-8 rounded-md px-3"
      disabled={disabled}
      size="sm"
      type="button"
    >
      <label aria-disabled={disabled}>
        <UploadSimple size={15} weight="bold" />
        {label}
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled}
          multiple={multiple}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.currentTarget.value = ""

            if (!files.length) {
              return
            }

            if (multiple && onFiles) {
              onFiles(files)
              return
            }

            if (onFile) {
              onFile(files[0])
            }
          }}
          type="file"
        />
      </label>
    </Button>
  )
}

export function DraggableCoverImage({
  image,
  imagePosition,
  onPositionChange,
}: {
  image: string
  imagePosition: string
  onPositionChange: (position: string) => void
}) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function updatePosition(event: PointerEvent<HTMLDivElement>) {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    onPositionChange(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative touch-none overflow-hidden rounded-lg bg-muted/40",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setIsDragging(true)
          updatePosition(event)
        }}
        onPointerMove={(event) => {
          if (isDragging) {
            updatePosition(event)
          }
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId)
          setIsDragging(false)
        }}
        onPointerCancel={() => setIsDragging(false)}
        ref={previewRef}
        role="button"
        tabIndex={0}
      >
        <img
          alt=""
          className="aspect-[4/3] w-full object-cover select-none"
          draggable={false}
          src={image}
          style={{ objectPosition: imagePosition }}
        />
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-md"
          style={{
            left: imagePosition.split(" ")[0] || "50%",
            top: imagePosition.split(" ")[1] || "50%",
          }}
        />
      </div>
      <div className="text-[11px] text-muted-foreground">
        当前焦点：{imagePosition}
      </div>
    </div>
  )
}

export function AssetLibraryDialog({
  assets,
  onOpenChange,
  onSelect,
  open,
  title,
}: {
  assets: string[]
  onOpenChange: (open: boolean) => void
  onSelect: (src: string) => void
  open: boolean
  title: string
}) {
  const [visibleCount, setVisibleCount] = useState(24)
  const visibleAssets = assets.slice(0, visibleCount)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            只会加载当前可见范围内的图片，选择后会回填到正在编辑的文章。
          </DialogDescription>
        </DialogHeader>

        {assets.length ? (
          <div className="max-h-[62dvh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {visibleAssets.map((src) => (
                <button
                  className="group relative overflow-hidden rounded-lg bg-muted text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  key={src}
                  onClick={() => onSelect(src)}
                  title={src}
                  type="button"
                >
                  <img
                    alt=""
                    className="aspect-square w-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={src}
                  />
                  <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
                    选择
                  </span>
                </button>
              ))}
            </div>
            {visibleCount < assets.length ? (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() =>
                    setVisibleCount((current) =>
                      Math.min(current + 24, assets.length)
                    )
                  }
                  type="button"
                  variant="outline"
                >
                  加载更多
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            暂无素材。请先上传封面或正文图片。
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function MarkdownEditor({
  disabled,
  onChange,
  onOpenAssetLibrary,
  onUploadImage,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  onOpenAssetLibrary?: () => void
  onUploadImage?: (file: File) => Promise<string>
  value: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [imageUploadError, setImageUploadError] = useState("")

  function wrapSelection(before: string, after = before) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(nextValue)

    window.requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      )
    })
  }

  function prefixSelection(prefix: string) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selected = value.slice(start, end) || "请输入内容"
    const nextValue = `${value.slice(0, start)}${selected
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n")}${value.slice(end)}`
    onChange(nextValue)
  }

  function prefixOrderedSelection() {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selected = value.slice(start, end) || "请输入内容"
    const nextValue = `${value.slice(0, start)}${selected
      .split("\n")
      .map((line, index) => `${index + 1}. ${line}`)
      .join("\n")}${value.slice(end)}`
    onChange(nextValue)
  }

  function insertAtSelection(text: string) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const needsLeadingBreak = start > 0 && value[start - 1] !== "\n"
    const needsTrailingBreak = value[end] && value[end] !== "\n"
    const insertion = `${needsLeadingBreak ? "\n" : ""}${text}${needsTrailingBreak ? "\n" : ""}`
    const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
    onChange(nextValue)

    window.requestAnimationFrame(() => {
      const cursor = start + insertion.length
      textarea?.focus()
      textarea?.setSelectionRange(cursor, cursor)
    })
  }

  function insertImage(src: string) {
    insertAtSelection(`![图片](${src})`)
  }

  function insertLink() {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selected = value.slice(start, end) || "链接文字"
    const nextValue = `${value.slice(0, start)}[${selected}](https://)${value.slice(end)}`
    onChange(nextValue)

    window.requestAnimationFrame(() => {
      const cursor = start + selected.length + 3
      textarea?.focus()
      textarea?.setSelectionRange(cursor, cursor + 8)
    })
  }

  async function handleImageUpload(file: File) {
    if (!onUploadImage) {
      return
    }

    setImageUploadError("")

    try {
      const src = await onUploadImage(file)
      insertImage(src)
      setMode("edit")
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "上传失败")
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-start justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5">
            <Select
              disabled={disabled}
              onValueChange={(format) => {
                if (format === "h2") {
                  prefixSelection("## ")
                  return
                }

                if (format === "h3") {
                  prefixSelection("### ")
                }
              }}
              value="body"
            >
              <SelectTrigger className="h-8 w-28 rounded-md text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="body">正文</SelectItem>
                <SelectItem value="h2">标题 2</SelectItem>
                <SelectItem value="h3">标题 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5">
            <Button
              aria-label="加粗"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => wrapSelection("**")}
              size="icon-sm"
              title="加粗"
              type="button"
              variant="ghost"
            >
              <TextB size={16} weight="bold" />
            </Button>
            <Button
              aria-label="斜体"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => wrapSelection("*")}
              size="icon-sm"
              title="斜体"
              type="button"
              variant="ghost"
            >
              <TextItalic size={16} weight="bold" />
            </Button>
            <Button
              aria-label="行内代码"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => wrapSelection("`")}
              size="icon-sm"
              title="行内代码"
              type="button"
              variant="ghost"
            >
              <Code size={16} weight="bold" />
            </Button>
          </div>

          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5">
            <Button
              aria-label="无序列表"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => prefixSelection("- ")}
              size="icon-sm"
              title="无序列表"
              type="button"
              variant="ghost"
            >
              <ListBullets size={16} weight="bold" />
            </Button>
            <Button
              aria-label="有序列表"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={prefixOrderedSelection}
              size="icon-sm"
              title="有序列表"
              type="button"
              variant="ghost"
            >
              <ListNumbers size={16} weight="bold" />
            </Button>
            <Button
              aria-label="引用"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => prefixSelection("> ")}
              size="icon-sm"
              title="引用"
              type="button"
              variant="ghost"
            >
              <Quotes size={16} weight="bold" />
            </Button>
          </div>

          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5">
            <Button
              aria-label="插入链接"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={insertLink}
              size="icon-sm"
              title="插入链接"
              type="button"
              variant="ghost"
            >
              <LinkSimple size={16} weight="bold" />
            </Button>
            <Button
              aria-label="分割线"
              className="size-8 rounded-md"
              disabled={disabled}
              onClick={() => insertAtSelection("\n---\n")}
              size="icon-sm"
              title="分割线"
              type="button"
              variant="ghost"
            >
              <Minus size={16} weight="bold" />
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 max-[880px]:w-full max-[880px]:justify-between">
          {onUploadImage ? (
            <UploadButton
              disabled={disabled}
              label={disabled ? "上传中..." : "上传"}
              onFile={handleImageUpload}
            />
          ) : null}
          {onOpenAssetLibrary ? (
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              disabled={disabled}
              onClick={onOpenAssetLibrary}
              size="xs"
              type="button"
              variant="outline"
            >
              <ImageSquare size={15} weight="bold" />
              素材
            </Button>
          ) : null}
          <div className="flex h-8 items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5">
            <Button
              className="h-7 rounded-md px-2.5 text-xs"
              onClick={() => setMode("edit")}
              size="xs"
              type="button"
              variant={mode === "edit" ? "default" : "outline"}
            >
              编辑
            </Button>
            <Button
              className="h-7 rounded-md px-2.5 text-xs"
              onClick={() => setMode("preview")}
              size="xs"
              type="button"
              variant={mode === "preview" ? "default" : "outline"}
            >
              预览
            </Button>
          </div>
        </div>
      </div>
      {mode === "edit" ? (
        <Textarea
          className="min-h-72 resize-y rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="支持 Markdown，例如 ## 标题、- 列表、**加粗**、![图片](图片地址)"
          ref={textareaRef}
          value={value}
        />
      ) : (
        <MarkdownPreview value={value} />
      )}
      {imageUploadError ? (
        <div className="border-t border-border px-3 py-2 text-xs text-red-600">
          {imageUploadError}
        </div>
      ) : null}
    </div>
  )
}

export function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return (
      <div className="min-h-72 px-4 py-3 text-sm text-muted-foreground">
        暂无 Markdown 内容
      </div>
    )
  }

  return (
    <BlogMarkdown
      className="min-h-72 px-4 py-3 text-sm leading-7"
      imageClassName="max-h-80"
      value={value}
    />
  )
}

export function upsertAt<TItem>(items: TItem[], index: number, item: TItem) {
  if (index >= items.length) {
    return [...items, item]
  }

  return items.map((current, currentIndex) =>
    currentIndex === index ? item : current
  )
}

export function sortByOrder(
  left: { sortOrder: number },
  right: { sortOrder: number }
) {
  return left.sortOrder - right.sortOrder
}

export function normalizeBlogPostDraft(post: CmsBlogPost): CmsBlogPost {
  return {
    ...post,
    category: post.category.trim() || "清洁指南",
    content: post.content,
    description: post.description.trim(),
    imagePosition: normalizeImagePosition(post.imagePosition),
    readTime: post.readTime || "5 分钟阅读",
    slug: post.slug || slugify(post.title || post.id),
    sortOrder: Number.isFinite(post.sortOrder) ? post.sortOrder : 1,
    title: post.title.trim() || "未命名文章",
  }
}

export function normalizeImagePosition(value: string | undefined) {
  const position = (value || "").trim()

  if (/^\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%$/.test(position)) {
    return position
  }

  return "50% 50%"
}

export function extractMarkdownImageSources(value: string) {
  return Array.from(value.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g), (match) =>
    match[1].trim()
  ).filter(Boolean)
}

export function appendMarkdownImage(content: string, src: string) {
  const trimmed = content.trimEnd()
  return `${trimmed}${trimmed ? "\n\n" : ""}![图片](${src})`
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getBlogCategoryOptions(
  content: CmsContent,
  includeLabel?: string
): CmsBlogCategory[] {
  const explicitCategories = Array.isArray(content.blogCategories)
    ? content.blogCategories
    : []
  const items: CmsBlogCategory[] = [
    ...explicitCategories,
    ...content.blogPosts.map((post, index) => ({
      id: `blog-category-from-post-${index + 1}`,
      label: post.category,
      sortOrder: explicitCategories.length + index + 1,
    })),
  ]

  if (includeLabel?.trim()) {
    items.push({
      id: `blog-category-current-${slugify(includeLabel) || "custom"}`,
      label: includeLabel.trim(),
      sortOrder: items.length + 1,
    })
  }

  return reindexBlogCategories(items)
}

export function normalizeBlogCategoryDraft(
  category: CmsBlogCategory
): CmsBlogCategory {
  const label = category.label.trim() || "未命名分类"

  return {
    ...category,
    id: category.id || createId("blog-category"),
    label,
    sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : 1,
  }
}

export function reindexBlogCategories(categories: CmsBlogCategory[]) {
  const seenLabels = new Set<string>()

  return categories
    .map(normalizeBlogCategoryDraft)
    .filter((category) => {
      const key = category.label.toLowerCase()
      if (seenLabels.has(key)) {
        return false
      }
      seenLabels.add(key)
      return true
    })
    .toSorted(sortByOrder)
    .map((category, index) => ({
      ...category,
      sortOrder: index + 1,
    }))
}

export function stripQuestionNumber(question: string) {
  return question.replace(/^\s*\d+[.、]\s*/, "").trim()
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export { useAdminNoticeDialog } from "./admin-notice-dialog"
