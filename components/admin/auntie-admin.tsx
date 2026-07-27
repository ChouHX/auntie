"use client"

import { useMemo, useRef, useState } from "react"
import {
  Camera,
  CaretLeft,
  CaretRight,
  ChatsCircle,
  FloppyDisk,
  PencilSimple,
  Plus,
  Star,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  createId,
  type PersistContent,
  RecordsPanel,
  TableFooterInfo,
  useAdminNoticeDialog,
  useTablePagination,
} from "@/components/admin/admin-shared"
import { OrderServiceAreaSelect } from "@/components/admin/order-admin"
import {
  calculateAuntieStats,
  getAuntieRatingClassName,
} from "@/lib/auntie-stats"
import { regionsWithDerivedCities } from "@/lib/service-regions"
import {
  fetchAuntieDetail,
  uploadAdminImage,
  type AdminAuntieStatsMap,
  type AuntieReviewItem,
} from "@/lib/cms-api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import MultipleSelector, {
  type Option as MultiSelectOption,
} from "@/components/ui/multiple-selector"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  CmsContent,
  CmsServiceRegion,
  CmsTeamMember,
  CmsTeamMemberStatus,
} from "@/types/cms"

const auntieStatusOptions: { label: string; value: CmsTeamMemberStatus }[] = [
  { label: "可接单", value: "available" },
  { label: "服务中", value: "on-task" },
  { label: "休息", value: "off-duty" },
  { label: "请假", value: "on-leave" },
]

const auntieStatusLabel: Record<CmsTeamMemberStatus, string> = {
  available: "可接单",
  "on-task": "服务中",
  "off-duty": "休息",
  "on-leave": "请假",
}

const auntieStatusColor: Record<CmsTeamMemberStatus, string> = {
  available:
    "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50",
  "on-task":
    "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50",
  "off-duty":
    "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/50",
  "on-leave":
    "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50",
}

const auntieStatusDotClass: Record<CmsTeamMemberStatus, string> = {
  available: "bg-emerald-500",
  "on-task": "bg-blue-500",
  "off-duty": "bg-gray-400",
  "on-leave": "bg-amber-500",
}

function createAuntieDraft(): CmsTeamMember {
  return {
    id: "",
    name: "",
    avatar: "",
    role: "",
    status: "available",
    area: "",
    completedCount: 0,
    rating: 0,
    phone: "",
    joinedAt: new Date().toISOString().split("T")[0],
    serviceAreas: [],
  }
}

function normalizeAuntieDraft(auntie: CmsTeamMember): CmsTeamMember {
  return {
    ...auntie,
    id: auntie.id || createId("auntie"),
    name: auntie.name.trim() || "未命名阿姨",
    phone: (auntie.phone ?? "").trim(),
    role: auntie.role.trim() || "保洁师",
    area: auntie.area.trim(),
    avatar: auntie.avatar.trim(),
    joinedAt: auntie.joinedAt || new Date().toISOString().split("T")[0],
    serviceAreas: auntie.serviceAreas ?? [],
  }
}

function AuntieStatusOptionLabel({ status }: { status: CmsTeamMemberStatus }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          auntieStatusDotClass[status]
        )}
      />
      {auntieStatusLabel[status]}
    </span>
  )
}

type AuntieAdminRemotePagination = {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onQueryChange: (query: string) => void
  onStatusFilterChange: (status: string) => void
  page: number
  pageSize: number
  query: string
  statusFilter: string
  totalCount: number
  totalPages: number
}

export function AuntieAdmin({
  auntieStats,
  content,
  isSaving,
  onCommit,
  onDeleteAuntie,
  remotePagination,
  token,
}: {
  auntieStats?: AdminAuntieStatsMap
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
  onDeleteAuntie?: (auntieId: string) => Promise<CmsContent | null>
  remotePagination?: AuntieAdminRemotePagination
  token: string
}) {
  const [editingAuntie, setEditingAuntie] = useState<CmsTeamMember | null>(null)
  const [auntieError, setAuntieError] = useState("")
  const [avatarUploadError, setAvatarUploadError] = useState("")
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  // 查看历史评价 Dialog 状态
  const [reviewAuntie, setReviewAuntie] = useState<CmsTeamMember | null>(null)
  const [reviews, setReviews] = useState<AuntieReviewItem[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewPageSize, setReviewPageSize] = useState(5)
  const [reviewTotalCount, setReviewTotalCount] = useState(0)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const effectiveQuery = remotePagination?.query ?? query
  const effectiveStatusFilter = remotePagination?.statusFilter ?? statusFilter
  const aunties = useMemo(
    () =>
      (content.teamMembers ?? []).toSorted((a, b) =>
        a.name.localeCompare(b.name, "zh")
      ),
    [content.teamMembers]
  )
  const filterKey = `${effectiveQuery}|${effectiveStatusFilter}`
  const filteredAunties = useMemo(() => {
    if (remotePagination) {
      return aunties
    }

    return aunties.filter((auntie) => {
      const searchable = [
        auntie.name,
        auntie.phone ?? "",
        auntie.role,
        auntie.area,
        ...(auntie.serviceAreas ?? []),
      ]
        .join(" ")
        .toLowerCase()
      const matchesQuery = searchable.includes(query.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || auntie.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [aunties, query, remotePagination, statusFilter])
  const localPagination = useTablePagination(filteredAunties.length, filterKey)
  const visibleAunties = useMemo(
    () =>
      remotePagination
        ? filteredAunties
        : filteredAunties.slice(
            localPagination.startIndex,
            localPagination.endIndex
          ),
    [
      filteredAunties,
      localPagination.endIndex,
      localPagination.startIndex,
      remotePagination,
    ]
  )
  const remoteStartIndex =
    remotePagination && remotePagination.totalCount
      ? (remotePagination.page - 1) * remotePagination.pageSize
      : 0
  const pagination = remotePagination
    ? {
        endIndex: Math.min(
          remoteStartIndex + visibleAunties.length,
          remotePagination.totalCount
        ),
        page: remotePagination.page,
        pageSize: remotePagination.pageSize,
        setPage: remotePagination.onPageChange,
        setPageSize: remotePagination.onPageSizeChange,
        startIndex: remoteStartIndex,
        totalCount: remotePagination.totalCount,
        totalPages: remotePagination.totalPages,
      }
    : localPagination
  const getStats = (auntie: CmsTeamMember) =>
    auntieStats?.[auntie.id] ?? {
      activeAssignedCount: 0,
      avgRating: auntie.rating,
      completedCount: auntie.completedCount,
      reviewCount: auntie.rating > 0 ? 1 : 0,
    }

  function startCreateAuntie() {
    setAuntieError("")
    setAvatarUploadError("")
    setIsEditingName(false)
    setEditingAuntie(createAuntieDraft())
  }

  function startEditAuntie(auntie: CmsTeamMember) {
    setAuntieError("")
    setAvatarUploadError("")
    setIsEditingName(false)
    setEditingAuntie(auntie)
  }

  async function loadReviews(auntieId: string, page: number, pageSize: number) {
    setIsReviewLoading(true)
    try {
      const detail = await fetchAuntieDetail(token, auntieId, {
        reviews: true,
        page,
        pageSize,
      })
      setReviews(detail.reviews ?? [])
      setReviewPage(detail.reviewPagination?.page ?? page)
      setReviewPageSize(detail.reviewPagination?.pageSize ?? pageSize)
      setReviewTotalCount(detail.reviewPagination?.totalCount ?? 0)
      setReviewTotalPages(detail.reviewPagination?.totalPages ?? 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载评价失败")
    } finally {
      setIsReviewLoading(false)
    }
  }

  function startViewReviews(auntie: CmsTeamMember) {
    setReviewAuntie(auntie)
    setReviews([])
    setReviewPage(1)
    setReviewPageSize(5)
    setReviewTotalCount(0)
    setReviewTotalPages(1)
    void loadReviews(auntie.id, 1, 5)
  }

  function handleReviewPageChange(nextPage: number) {
    if (!reviewAuntie) return
    void loadReviews(reviewAuntie.id, nextPage, reviewPageSize)
  }

  function handleReviewPageSizeChange(nextPageSize: number) {
    if (!reviewAuntie) return
    void loadReviews(reviewAuntie.id, 1, nextPageSize)
  }

  function updateEditingAuntie(patch: Partial<CmsTeamMember>) {
    setEditingAuntie((current) =>
      current ? { ...current, ...patch } : current
    )
    setAuntieError("")
  }

  async function handleAvatarUpload(file: File) {
    setAvatarUploadError("")
    setIsAvatarUploading(true)

    try {
      const result = await uploadAdminImage(token, "pages", file)
      updateEditingAuntie({
        avatar: result.src,
        avatarThumb: result.thumbSrc ?? result.src,
      })
    } catch (error) {
      setAvatarUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsAvatarUploading(false)
    }
  }

  async function saveAuntie() {
    if (!editingAuntie) return
    const normalized = normalizeAuntieDraft(editingAuntie)
    if (!normalized.name || !normalized.name.trim()) {
      setAuntieError("请填写阿姨姓名。")
      return
    }
    const existing = content.teamMembers ?? []
    const exists = existing.some((a) => a.id === normalized.id)
    const nextAunties = exists
      ? existing.map((a) => (a.id === normalized.id ? normalized : a))
      : [...existing, normalized]
    const savedContent = await onCommit(
      (current) => ({
        ...current,
        teamMembers: nextAunties,
      }),
      "阿姨信息已保存"
    )
    if (savedContent) {
      setEditingAuntie(null)
    }
  }

  async function deleteAuntie(auntieId: string) {
    const auntie = aunties.find((a) => a.id === auntieId)
    if (
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除阿姨「${auntie?.name ?? ""}」。此操作无法撤销。`,
        title: "确认删除阿姨？",
      }))
    ) {
      return
    }

    if (onDeleteAuntie) {
      await onDeleteAuntie(auntieId)
      return
    }

    const nextAunties = (content.teamMembers ?? []).filter(
      (a) => a.id !== auntieId
    )
    await onCommit(
      (current) => ({
        ...current,
        teamMembers: nextAunties,
      }),
      "阿姨信息已删除"
    )
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <Button
            className="h-8 rounded-md"
            disabled={isSaving}
            onClick={startCreateAuntie}
            size="sm"
            type="button"
          >
            <Plus size={15} weight="bold" />
            新建阿姨
          </Button>
        }
        count={
          remotePagination
            ? remotePagination.totalCount
            : filteredAunties.length
        }
        description="管理阿姨信息、服务区域、状态和评分记录。评分由客户评价自动统计。"
        filters={
          <Select
            onValueChange={
              remotePagination?.onStatusFilterChange ?? setStatusFilter
            }
            value={effectiveStatusFilter}
          >
            <SelectTrigger className="h-8 w-full rounded-md px-2.5 text-xs sm:w-32">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                {auntieStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <AuntieStatusOptionLabel status={opt.value} />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
        query={effectiveQuery}
        searchPlaceholder="搜索姓名、电话、角色..."
        setQuery={remotePagination?.onQueryChange ?? setQuery}
        title="阿姨管理"
      >
        {visibleAunties.length ? (
          <>
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>阿姨</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>服务区域</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>完成单数</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAunties.map((auntie) => {
                  const stats = getStats(auntie)
                  return (
                    <TableRow key={auntie.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {(auntie.avatarThumb ?? auntie.avatar) ? (
                            <img
                              alt={auntie.name}
                              className="size-9 shrink-0 rounded-full object-cover"
                              loading="lazy"
                              src={auntie.avatarThumb ?? auntie.avatar!}
                            />
                          ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                              {auntie.name.slice(0, 1)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <button
                              className="block truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                              onClick={() => startEditAuntie(auntie)}
                              type="button"
                            >
                              {auntie.name}
                            </button>
                            {auntie.joinedAt ? (
                              <div className="text-xs text-muted-foreground">
                                入职 {auntie.joinedAt}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {auntie.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {auntie.role || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate text-xs text-muted-foreground">
                          {(auntie.serviceAreas ?? []).length
                            ? auntie.serviceAreas!.join("、")
                            : auntie.area || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            auntieStatusColor[auntie.status]
                          )}
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              auntieStatusDotClass[auntie.status]
                            )}
                          />
                          {auntieStatusLabel[auntie.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {stats.reviewCount > 0 ? (
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 font-semibold text-amber-500",
                              getAuntieRatingClassName(stats)
                            )}
                          >
                            <Star size={14} weight="fill" />
                            <span className="font-semibold">
                              {stats.avgRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({stats.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            暂无评价
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {stats.completedCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            aria-label="编辑阿姨"
                            className="size-8 rounded-md"
                            onClick={() => startEditAuntie(auntie)}
                            size="icon-sm"
                            type="button"
                            variant="navIcon"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </Button>
                          <Button
                            aria-label="查看评价"
                            className="size-8 rounded-md"
                            onClick={() => startViewReviews(auntie)}
                            size="icon-sm"
                            type="button"
                            variant="navIcon"
                          >
                            <ChatsCircle size={14} weight="bold" />
                          </Button>
                          <Button
                            aria-label="删除阿姨"
                            className="size-8 rounded-md"
                            disabled={isSaving}
                            onClick={() => deleteAuntie(auntie.id)}
                            size="icon-sm"
                            type="button"
                            variant="destructive"
                          >
                            <Trash size={14} weight="bold" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TableFooterInfo pagination={pagination} />
          </>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            暂无阿姨信息。点击右上角新建阿姨后，可在订单中分配阿姨。
          </div>
        )}
      </RecordsPanel>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setIsEditingName(false)
            setEditingAuntie(null)
          }
        }}
        open={Boolean(editingAuntie)}
      >
        <DialogContent className="max-w-2xl gap-3 overflow-visible p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>阿姨信息</DialogTitle>
            <DialogDescription>
              填写阿姨的基本信息，保存后可在订单管理中分配给具体订单。
            </DialogDescription>
          </DialogHeader>
          {editingAuntie
            ? (() => {
                // 提前计算评分数据，以便在顶部卡片中使用
                const stats =
                  editingAuntie.id && auntieStats?.[editingAuntie.id]
                    ? auntieStats[editingAuntie.id]
                    : calculateAuntieStats(
                        editingAuntie.id,
                        content.paymentOrders ?? []
                      )

                return (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 sm:col-span-2 sm:grid-cols-[76px_minmax(0,1fr)]">
                      <div className="flex min-w-0 flex-col items-center gap-2">
                        <button
                          aria-label={
                            editingAuntie.avatar
                              ? "更换阿姨照片"
                              : "添加阿姨照片"
                          }
                          className="relative size-16 overflow-hidden rounded-full border border-border bg-muted text-muted-foreground transition hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                          data-empty={editingAuntie.avatar ? "false" : "true"}
                          disabled={isAvatarUploading || isSaving}
                          onClick={() => avatarInputRef.current?.click()}
                          title={editingAuntie.avatar ? "更换照片" : "添加照片"}
                          type="button"
                        >
                          {editingAuntie.avatar ? (
                            <img
                              alt="阿姨照片"
                              className="size-full object-cover"
                              src={editingAuntie.avatar}
                            />
                          ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium">
                              <Camera size={17} weight="bold" />
                              <span>照片</span>
                            </div>
                          )}
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-slate-950/60 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Camera size={16} weight="bold" />
                            {isAvatarUploading
                              ? "上传中"
                              : editingAuntie.avatar
                                ? "更换"
                                : "添加"}
                          </span>
                        </button>
                        <input
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          disabled={isAvatarUploading || isSaving}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.currentTarget.value = ""

                            if (file) {
                              void handleAvatarUpload(file)
                            }
                          }}
                          ref={avatarInputRef}
                          type="file"
                        />
                      </div>

                      <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {isEditingName ? (
                              <Input
                                autoFocus
                                className="h-8 w-40 rounded-md font-medium"
                                onBlur={() => setIsEditingName(false)}
                                onChange={(event) =>
                                  updateEditingAuntie({
                                    name: event.target.value,
                                  })
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    setIsEditingName(false)
                                  }
                                }}
                                value={editingAuntie.name}
                              />
                            ) : (
                              <span className="min-w-0 truncate text-base font-semibold text-foreground">
                                {editingAuntie.name || "未命名阿姨"}
                              </span>
                            )}
                            <Button
                              aria-label="编辑姓名"
                              className="size-7 shrink-0 rounded-md"
                              onClick={() => setIsEditingName(true)}
                              size="icon-xs"
                              type="button"
                              variant="ghost"
                            >
                              <PencilSimple size={15} weight="bold" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              状态
                            </span>
                            <Select
                              onValueChange={(value) =>
                                updateEditingAuntie({
                                  status: value as CmsTeamMemberStatus,
                                })
                              }
                              value={editingAuntie.status}
                            >
                              <SelectTrigger className="h-8 w-32 rounded-md bg-transparent px-2 text-xs">
                                <SelectValue placeholder="选择状态" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {auntieStatusOptions.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      <AuntieStatusOptionLabel
                                        status={opt.value}
                                      />
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          {stats.reviewCount > 0 ? (
                            <div
                              className={cn(
                                "flex inline-flex items-center gap-1 text-xs font-semibold text-amber-500",
                                getAuntieRatingClassName(stats)
                              )}
                            >
                              <Star
                                size={14}
                                weight="fill"
                                className="text-amber-400"
                              />
                              <span className="font-semibold text-foreground">
                                {stats.avgRating.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">
                                {stats.reviewCount} 条评价 ·{" "}
                                {stats.completedCount} 单完成
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star size={14} weight="regular" />
                              <span>暂无评价</span>
                            </div>
                          )}
                        </div>

                        {avatarUploadError ? (
                          <div className="mt-1 mb-0 mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-2 px-3 py-1.5 py-2 text-sm text-xs text-destructive">
                            {avatarUploadError}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <FormField className="space-y-1.5" label="联系电话">
                      <Input
                        className="h-8 rounded-md"
                        onChange={(e) =>
                          updateEditingAuntie({ phone: e.target.value })
                        }
                        placeholder="+1 xxx-xxx-xxxx"
                        value={editingAuntie.phone ?? ""}
                      />
                    </FormField>
                    <FormField className="space-y-1.5" label="角色 / 职能">
                      <Input
                        className="h-8 rounded-md"
                        onChange={(e) =>
                          updateEditingAuntie({ role: e.target.value })
                        }
                        placeholder="高级保洁师、深度清洁专员..."
                        value={editingAuntie.role}
                      />
                    </FormField>
                    <FormField className="space-y-1.5" label="入职日期">
                      <Input
                        className="h-8 rounded-md"
                        onChange={(e) =>
                          updateEditingAuntie({ joinedAt: e.target.value })
                        }
                        type="date"
                        value={editingAuntie.joinedAt ?? ""}
                      />
                    </FormField>
                    <FormField className="space-y-1.5" label="主要服务区域">
                      <OrderServiceAreaSelect
                        triggerClassName="h-8 rounded-md px-2 text-xs"
                        onChange={(area) => updateEditingAuntie({ area })}
                        value={editingAuntie.area}
                      />
                    </FormField>
                    <FormField
                      className="space-y-1.5 sm:col-span-2"
                      description="选择阿姨可服务的城市区域，支持按地区批量选择。"
                      label="服务区域列表"
                    >
                      <AuntieServiceAreaMultiSelect
                        selected={editingAuntie.serviceAreas ?? []}
                        onChange={(serviceAreas) =>
                          updateEditingAuntie({ serviceAreas })
                        }
                        regions={regionsWithDerivedCities(
                          content.serviceRegions ?? [],
                          content.serviceLocations ?? []
                        )}
                      />
                    </FormField>

                    {/* 底部错误提示 */}
                    {auntieError ? (
                      <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                        {auntieError}
                      </div>
                    ) : null}
                  </div>
                )
              })()
            : null}
          <DialogFooter>
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingAuntie(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="h-8 rounded-md"
              disabled={isSaving}
              onClick={saveAuntie}
              size="sm"
              type="button"
            >
              <FloppyDisk size={15} weight="bold" />
              {isSaving ? "保存中..." : "保存阿姨"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看历史评价 Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setReviewAuntie(null)
            setReviews([])
          }
        }}
        open={Boolean(reviewAuntie)}
      >
        <DialogContent className="max-w-2xl gap-3 overflow-visible p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>{reviewAuntie?.name ?? ""} 的历史评价</DialogTitle>
            <DialogDescription>
              按订单完成时间倒序展示客户对该阿姨的评价。
            </DialogDescription>
          </DialogHeader>
          {reviewAuntie
            ? (() => {
                const stats = getStats(reviewAuntie)
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <Star
                        className={cn(
                          "size-5",
                          stats.avgRating > 0
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        )}
                        weight="fill"
                      />
                      <div className="text-sm">
                        <span className="font-semibold">
                          {stats.avgRating > 0
                            ? stats.avgRating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          共 {stats.reviewCount} 条评价 · 完成{" "}
                          {stats.completedCount} 单
                        </span>
                      </div>
                    </div>

                    {isReviewLoading ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        加载中...
                      </div>
                    ) : reviews.length ? (
                      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                        {reviews.map((review) => (
                          <div
                            key={review.orderId}
                            className="rounded-lg border border-border bg-card p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {review.customerName || "匿名客户"}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "size-3",
                                        i < review.rating
                                          ? "text-amber-500"
                                          : "text-muted-foreground/30"
                                      )}
                                      weight="fill"
                                    />
                                  ))}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {review.createdAt
                                  ? new Date(
                                      review.createdAt
                                    ).toLocaleDateString("zh-CN")
                                  : ""}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {review.serviceType} · {review.serviceArea} ·{" "}
                              {review.serviceDate}
                            </div>
                            {review.comment ? (
                              <p className="mt-2 text-sm leading-6 text-foreground">
                                {review.comment}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">
                                （客户未留言）
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        暂无评价
                      </div>
                    )}

                    {!isReviewLoading && reviews.length > 0 ? (
                      <ReviewPagination
                        page={reviewPage}
                        pageSize={reviewPageSize}
                        totalCount={reviewTotalCount}
                        totalPages={reviewTotalPages}
                        onPageChange={handleReviewPageChange}
                        onPageSizeChange={handleReviewPageSizeChange}
                      />
                    ) : null}
                  </div>
                )
              })()
            : null}
          <DialogFooter>
            <Button
              className="h-8 rounded-md"
              onClick={() => setReviewAuntie(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AuntieServiceAreaMultiSelect({
  selected,
  onChange,
  regions,
}: {
  selected: string[]
  onChange: (areas: string[]) => void
  regions: CmsServiceRegion[]
}) {
  const allOptions = useMemo<MultiSelectOption[]>(
    () =>
      regions.flatMap((region) =>
        region.cities.map((city) => ({
          value: `${city} · ${region.name}`,
          label: `${city} · ${region.name}`,
          group: region.name,
        }))
      ),
    [regions]
  )

  const selectedOptions = useMemo<MultiSelectOption[]>(
    () =>
      selected.map((area) => ({
        value: area,
        label: area,
      })),
    [selected]
  )

  return (
    <MultipleSelector
      value={selectedOptions}
      options={allOptions}
      groupBy="group"
      placeholder="点击选择服务区域"
      emptyIndicator={
        <p className="text-center text-xs text-slate-400">无匹配区域</p>
      }
      onChange={(options) => onChange(options.map((o) => o.value))}
      className="min-h-8 rounded-md text-xs"
      badgeClassName="h-6 pr-6 pl-2 text-[11px]"
      inputProps={{
        className: "py-1.5 text-xs",
      }}
    />
  )
}

type ReviewPaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function ReviewPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: ReviewPaginationProps) {
  const start = totalCount ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, totalCount)
  const canPrevious = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>每页</span>
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger className="h-8 w-[72px] rounded-md px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {[5, 10, 20].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <div>
          第 {start}-{end} 条，共 {totalCount} 条
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="上一页"
            className="size-8 rounded-md"
            disabled={!canPrevious}
            onClick={() => onPageChange(page - 1)}
            size="icon-sm"
            type="button"
            variant="navIcon"
          >
            <CaretLeft size={14} weight="bold" />
          </Button>
          <div className="min-w-14 text-center">
            {page}/{totalPages}
          </div>
          <Button
            aria-label="下一页"
            className="size-8 rounded-md"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
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
