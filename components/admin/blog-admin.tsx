"use client"

import { useMemo, useState } from "react"
import { FloppyDisk, Images, Plus } from "@phosphor-icons/react"

import {
  type PersistContent,
  AssetLibraryDialog,
  BulkActions,
  DraggableCoverImage,
  MarkdownEditor,
  RecordsPanel,
  RowMenu,
  StatusBadge,
  TableFooterInfo,
  UploadButton,
  createId,
  getBlogCategoryOptions,
  normalizeBlogCategoryDraft,
  normalizeBlogPostDraft,
  reindexBlogCategories,
  uniqueStrings,
  useAdminNoticeDialog,
  useTablePagination,
  useTableSelection,
} from "@/components/admin/admin-shared"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
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
import { uploadAdminImage } from "@/lib/cms-api"
import type {
  CmsBlogCategory,
  CmsBlogPost,
  CmsContent,
  CmsStatus,
} from "@/types/cms"

function extractMarkdownImageSources(value: string) {
  return Array.from(value.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g), (match) =>
    match[1].trim()
  ).filter(Boolean)
}

function appendMarkdownImage(content: string, src: string) {
  const trimmed = content.trimEnd()
  return `${trimmed}${trimmed ? "\n\n" : ""}![图片](${src})`
}

type BlogAdminRemotePagination = {
  category?: string
  onCategoryFilterChange?: (category: string) => void
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

export function BlogAdmin({
  content,
  isSaving,
  onCommit,
  onDeletePosts,
  remotePagination,
  token,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
  onDeletePosts?: (postIds: string[]) => Promise<CmsContent | null>
  remotePagination?: BlogAdminRemotePagination
  token: string
}) {
  const [editingPost, setEditingPost] = useState<CmsBlogPost | null>(null)
  const [assetDialog, setAssetDialog] = useState<null | "content" | "cover">(
    null
  )
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sessionBlogAssets, setSessionBlogAssets] = useState<string[]>([])
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const effectiveQuery = remotePagination?.query ?? query
  const effectiveCategory = remotePagination?.category ?? categoryFilter
  const effectiveStatusFilter = remotePagination?.statusFilter ?? statusFilter
  const posts = useMemo(
    () => content.blogPosts.toSorted((a, b) => a.sortOrder - b.sortOrder),
    [content.blogPosts]
  )
  const categories = useMemo(() => getBlogCategoryOptions(content), [content])
  const filterKey = `${effectiveQuery}|${effectiveCategory}|${effectiveStatusFilter}`
  const filteredPosts = useMemo(() => {
    if (remotePagination) {
      return posts
    }

    return posts.filter((post) => {
      const matchesQuery =
        `${post.title} ${post.category} ${post.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || post.category === categoryFilter
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [categoryFilter, posts, query, remotePagination, statusFilter])
  const localPagination = useTablePagination(filteredPosts.length, filterKey)
  const visiblePosts = useMemo(
    () =>
      remotePagination
        ? filteredPosts
        : filteredPosts.slice(localPagination.startIndex, localPagination.endIndex),
    [filteredPosts, localPagination.endIndex, localPagination.startIndex, remotePagination]
  )
  const remoteStartIndex =
    remotePagination && remotePagination.totalCount
      ? (remotePagination.page - 1) * remotePagination.pageSize
      : 0
  const pagination = remotePagination
    ? {
        endIndex: Math.min(
          remoteStartIndex + visiblePosts.length,
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
  const selection = useTableSelection(filterKey)
  const visibleIds = visiblePosts.map((post) => post.id)
  const filteredIds = filteredPosts.map((post) => post.id)
  const blogAssetSources = useMemo(
    () =>
      uniqueStrings([
        ...content.blogPosts.flatMap((post) => [
          post.image,
          ...extractMarkdownImageSources(post.content),
        ]),
        ...sessionBlogAssets,
      ]).filter(Boolean),
    [content.blogPosts, sessionBlogAssets]
  )

  function addPost() {
    const id = createId("blog")
    setUploadError("")
    setEditingPost({
      id,
      slug: id,
      category: categories[0]?.label ?? "清洁指南",
      title: "新文章标题",
      description: "",
      readTime: "5 分钟阅读",
      image: "/about_us.png",
      imagePosition: "50% 50%",
      content: "",
      status: "draft",
      sortOrder: posts.length + 1,
    })
  }

  function openPost(post: CmsBlogPost) {
    setUploadError("")
    setEditingPost({ ...post })
  }

  async function saveEditingPost() {
    if (!editingPost) {
      return
    }

    const nextPost = normalizeBlogPostDraft(editingPost)
    const saved = await onCommit((current) => {
      const exists = current.blogPosts.some((post) => post.id === nextPost.id)
      return {
        ...current,
        blogPosts: exists
          ? current.blogPosts.map((post) =>
              post.id === nextPost.id ? nextPost : post
            )
          : [...current.blogPosts, nextPost],
      }
    }, "博客已保存")

    if (saved) {
      setEditingPost(null)
      selection.clear()
    }
  }

  async function deletePosts(ids: string[]) {
    if (
      !ids.length ||
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除 ${ids.length} 篇博客。此操作无法撤销。`,
        title: "确认删除博客？",
      }))
    ) {
      return
    }

    if (onDeletePosts) {
      const saved = await onDeletePosts(ids)
      if (saved) {
        selection.clear()
      }
      return
    }

    const idSet = new Set(ids)
    const saved = await onCommit(
      (current) => ({
        ...current,
        blogPosts: current.blogPosts.filter((post) => !idSet.has(post.id)),
      }),
      "博客已删除"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function updatePostStatus(ids: string[], status: CmsStatus) {
    if (!ids.length) {
      return
    }

    const idSet = new Set(ids)
    const saved = await onCommit(
      (current) => ({
        ...current,
        blogPosts: current.blogPosts.map((post) =>
          idSet.has(post.id) ? { ...post, status } : post
        ),
      }),
      status === "published" ? "博客已发布" : "博客已设为草稿"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function handleCoverUpload(file: File) {
    if (!editingPost) {
      return
    }

    setUploadError("")
    setIsUploading(true)
    try {
      const result = await uploadAdminImage(token, "blog", file)
      setSessionBlogAssets((current) => uniqueStrings([...current, result.src]))
      setEditingPost((current) =>
        current
          ? { ...current, image: result.src, imagePosition: "50% 50%" }
          : current
      )
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleContentImageUpload(file: File) {
    setUploadError("")
    setIsUploading(true)

    try {
      const result = await uploadAdminImage(token, "blog", file)
      setSessionBlogAssets((current) => uniqueStrings([...current, result.src]))
      return result.src
    } catch (error) {
      const message = error instanceof Error ? error.message : "上传失败"
      setUploadError(message)
      throw new Error(message, { cause: error })
    } finally {
      setIsUploading(false)
    }
  }

  function handleAssetSelect(src: string) {
    if (assetDialog === "cover") {
      setEditingPost((current) =>
        current
          ? {
              ...current,
              image: src,
              imagePosition: current.imagePosition ?? "50% 50%",
            }
          : current
      )
      setAssetDialog(null)
      return
    }

    if (assetDialog === "content") {
      setEditingPost((current) =>
        current
          ? {
              ...current,
              content: appendMarkdownImage(current.content, src),
            }
          : current
      )
      setAssetDialog(null)
    }
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <Button className="h-8 rounded-md" onClick={addPost} size="sm">
            <Plus size={15} weight="bold" />
            新增
          </Button>
        }
        bulkActions={
          <BulkActions
            allCount={filteredIds.length}
            onClear={selection.clear}
            onDelete={() => deletePosts(selection.selectedIds)}
            onDraft={() => updatePostStatus(selection.selectedIds, "draft")}
            onPublish={() =>
              updatePostStatus(selection.selectedIds, "published")
            }
            onSelectAll={() => selection.selectAll(filteredIds)}
            selectedCount={selection.selectedCount}
          />
        }
        count={
          remotePagination ? remotePagination.totalCount : filteredPosts.length
        }
        description="管理文章、封面和发布状态。排序请在编辑弹窗中调整并单独保存。"
        filters={
          <BlogPostFilters
            categories={categories}
            categoryFilter={effectiveCategory}
            onCategoryFilterChange={
              remotePagination?.onCategoryFilterChange ?? setCategoryFilter
            }
            onStatusFilterChange={
              remotePagination?.onStatusFilterChange ?? setStatusFilter
            }
            statusFilter={effectiveStatusFilter}
          />
        }
        query={effectiveQuery}
        searchPlaceholder="搜索博客..."
        setQuery={remotePagination?.onQueryChange ?? setQuery}
        title="博客管理"
      >
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9">
                <Checkbox
                  aria-label="选择当前页博客"
                  checked={selection.getCheckedState(visibleIds)}
                  onCheckedChange={(checked) =>
                    selection.toggleMany(visibleIds, checked === true)
                  }
                />
              </TableHead>
              <TableHead>标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 ${post.title}`}
                    checked={selection.isSelected(post.id)}
                    onCheckedChange={(checked) =>
                      selection.toggle(post.id, checked === true)
                    }
                  />
                </TableCell>
                <TableCell className="min-w-72">
                  <button
                    className="block max-w-md truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => openPost(post)}
                    type="button"
                  >
                    {post.title}
                  </button>
                  <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                    {post.description || "暂无摘要"}
                  </div>
                </TableCell>
                <TableCell>{post.category}</TableCell>
                <TableCell>
                  <StatusBadge status={post.status} />
                </TableCell>
                <TableCell>
                  <RowMenu
                    destructiveLabel="删除"
                    onDelete={() => deletePosts([post.id])}
                    onEdit={() => openPost(post)}
                    onStatusChange={(status) =>
                      updatePostStatus([post.id], status)
                    }
                    status={post.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooterInfo pagination={pagination} />

        <Dialog
          onOpenChange={(open) => !open && setEditingPost(null)}
          open={Boolean(editingPost)}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{editingPost?.title ?? "编辑博客"}</DialogTitle>
              <DialogDescription>
                修改内容后点击本弹窗底部保存，只保存当前文章。
              </DialogDescription>
            </DialogHeader>
            {editingPost ? (
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <DraggableCoverImage
                    image={editingPost.image}
                    imagePosition={editingPost.imagePosition ?? "50% 50%"}
                    onPositionChange={(imagePosition) =>
                      setEditingPost((current) =>
                        current ? { ...current, imagePosition } : current
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <UploadButton
                      disabled={isUploading}
                      label={isUploading ? "上传中..." : "上传封面"}
                      onFile={handleCoverUpload}
                    />
                    <Button
                      className="h-8 rounded-md px-3"
                      disabled={isUploading || !blogAssetSources.length}
                      onClick={() => setAssetDialog("cover")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Images size={15} weight="bold" />
                      选择素材
                    </Button>
                  </div>
                  {uploadError ? (
                    <p className="text-xs text-red-600">{uploadError}</p>
                  ) : null}
                  <p className="text-xs leading-5 text-muted-foreground">
                    拖动封面预览，可调整前台裁切时的图片位置。
                  </p>
                  <FormField label="状态">
                    <Select
                      onValueChange={(status) =>
                        setEditingPost((current) =>
                          current
                            ? {
                                ...current,
                                status:
                                  status === "draft" ? "draft" : "published",
                              }
                            : current
                        )
                      }
                      value={editingPost.status}
                    >
                      <SelectTrigger className="h-9 rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">published</SelectItem>
                        <SelectItem value="draft">draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="排序">
                    <Input
                      className="h-9 rounded-md"
                      min={1}
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current
                            ? {
                                ...current,
                                sortOrder: Number(event.target.value),
                              }
                            : current
                        )
                      }
                      type="number"
                      value={editingPost.sortOrder}
                    />
                  </FormField>
                </div>

                <div className="grid min-w-0 gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="标题">
                      <Input
                        className="h-9 rounded-md"
                        onChange={(event) =>
                          setEditingPost((current) =>
                            current
                              ? { ...current, title: event.target.value }
                              : current
                          )
                        }
                        value={editingPost.title}
                      />
                    </FormField>
                    <FormField label="分类">
                      <Select
                        onValueChange={(category) =>
                          setEditingPost((current) =>
                            current
                              ? {
                                  ...current,
                                  category,
                                }
                              : current
                          )
                        }
                        value={editingPost.category}
                      >
                        <SelectTrigger className="h-9 rounded-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getBlogCategoryOptions(
                            content,
                            editingPost.category
                          ).map((category) => (
                            <SelectItem
                              key={category.label}
                              value={category.label}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <FormField label="摘要">
                    <Input
                      className="h-9 rounded-md"
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current
                            ? { ...current, description: event.target.value }
                            : current
                        )
                      }
                      value={editingPost.description}
                    />
                  </FormField>
                  <FormField label="正文 Markdown">
                    <MarkdownEditor
                      disabled={isUploading}
                      onChange={(value) =>
                        setEditingPost((current) =>
                          current ? { ...current, content: value } : current
                        )
                      }
                      onOpenAssetLibrary={() => setAssetDialog("content")}
                      onUploadImage={handleContentImageUpload}
                      value={editingPost.content}
                    />
                  </FormField>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                className="h-8 rounded-md"
                onClick={() => setEditingPost(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                className="h-8 rounded-md"
                disabled={isSaving || isUploading || !editingPost?.title.trim()}
                onClick={saveEditingPost}
                size="sm"
                type="button"
              >
                <FloppyDisk size={15} weight="bold" />
                {isSaving ? "保存中..." : "保存此文章"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AssetLibraryDialog
          assets={blogAssetSources}
          onOpenChange={(open) => !open && setAssetDialog(null)}
          onSelect={handleAssetSelect}
          open={Boolean(assetDialog)}
          title={assetDialog === "cover" ? "选择封面素材" : "插入正文图片"}
        />
      </RecordsPanel>
    </>
  )
}

function BlogPostFilters({
  categories,
  categoryFilter,
  onCategoryFilterChange,
  onStatusFilterChange,
  statusFilter,
}: {
  categories: CmsBlogCategory[]
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  statusFilter: string
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select onValueChange={onCategoryFilterChange} value={categoryFilter}>
        <SelectTrigger className="h-8 w-full rounded-md px-2.5 text-xs sm:w-36">
          <SelectValue placeholder="全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.label} value={category.label}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onStatusFilterChange} value={statusFilter}>
        <SelectTrigger className="h-8 w-full rounded-md px-2.5 text-xs sm:w-32">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="published">已发布</SelectItem>
          <SelectItem value="draft">草稿</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function BlogCategoryAdmin({
  content,
  isSaving,
  onCommit,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
}) {
  const [editingCategory, setEditingCategory] =
    useState<CmsBlogCategory | null>(null)
  const [query, setQuery] = useState("")
  const { confirmAction, noticeDialog, showAlert } = useAdminNoticeDialog()
  const categories = useMemo(() => getBlogCategoryOptions(content), [content])
  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>()
    content.blogPosts.forEach((post) => {
      counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
    })
    return counts
  }, [content.blogPosts])
  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.label.toLowerCase().includes(query.toLowerCase())
      ),
    [categories, query]
  )

  function addCategory() {
    setEditingCategory({
      id: createId("blog-category"),
      label: "新分类",
      sortOrder: categories.length + 1,
    })
  }

  function openCategory(category: CmsBlogCategory) {
    setEditingCategory({ ...category })
  }

  async function saveEditingCategory() {
    if (!editingCategory) {
      return
    }

    const nextCategory = normalizeBlogCategoryDraft(editingCategory)
    const previousCategory = categories.find(
      (category) => category.id === nextCategory.id
    )
    const duplicateCategory = categories.find(
      (category) =>
        category.id !== nextCategory.id &&
        category.label.toLowerCase() === nextCategory.label.toLowerCase()
    )

    if (duplicateCategory) {
      await showAlert({
        description: "分类名称已存在，请更换名称。",
        title: "分类名称重复",
      })
      return
    }

    const saved = await onCommit((current) => {
      const currentCategories = getBlogCategoryOptions(current)
      const exists = currentCategories.some(
        (category) => category.id === nextCategory.id
      )
      const nextCategories = exists
        ? currentCategories.map((category) =>
            category.id === nextCategory.id ? nextCategory : category
          )
        : [...currentCategories, nextCategory]
      const blogPosts =
        previousCategory && previousCategory.label !== nextCategory.label
          ? current.blogPosts.map((post) =>
              post.category === previousCategory.label
                ? { ...post, category: nextCategory.label }
                : post
            )
          : current.blogPosts

      return {
        ...current,
        blogCategories: reindexBlogCategories(nextCategories),
        blogPosts,
      }
    }, "分类已保存")

    if (saved) {
      setEditingCategory(null)
    }
  }

  async function deleteCategory(category: CmsBlogCategory) {
    const usedCount = usageCounts.get(category.label) ?? 0
    if (usedCount) {
      await showAlert({
        description: `该分类下还有 ${usedCount} 篇文章，不能删除。`,
        title: "无法删除分类",
      })
      return
    }

    if (
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除分类「${category.label}」。此操作无法撤销。`,
        title: "确认删除分类？",
      }))
    ) {
      return
    }

    await onCommit(
      (current) => ({
        ...current,
        blogCategories: reindexBlogCategories(
          getBlogCategoryOptions(current).filter(
            (item) => item.id !== category.id
          )
        ),
      }),
      "分类已删除"
    )
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <Button className="h-8 rounded-md" onClick={addCategory} size="sm">
            <Plus size={15} weight="bold" />
            新增
          </Button>
        }
        count={filteredCategories.length}
        description="管理博客文章可选分类。重命名分类会同步更新已使用该分类的文章。"
        query={query}
        searchPlaceholder="搜索分类..."
        setQuery={setQuery}
        title="博客分类"
      >
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>分类名称</TableHead>
              <TableHead className="w-24">文章数</TableHead>
              <TableHead className="w-24">排序</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <button
                    className="block max-w-md truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => openCategory(category)}
                    type="button"
                  >
                    {category.label}
                  </button>
                </TableCell>
                <TableCell>{usageCounts.get(category.label) ?? 0}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {category.sortOrder}
                </TableCell>
                <TableCell>
                  <RowMenu
                    destructiveLabel="删除"
                    onDelete={() => deleteCategory(category)}
                    onEdit={() => openCategory(category)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog
          onOpenChange={(open) => !open && setEditingCategory(null)}
          open={Boolean(editingCategory)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory?.label ?? "编辑分类"}</DialogTitle>
              <DialogDescription>
                分类用于博客文章编辑时选择，前台会直接显示分类名称。
              </DialogDescription>
            </DialogHeader>
            {editingCategory ? (
              <div className="grid gap-4">
                <FormField label="分类名称" required>
                  <Input
                    className="h-9 rounded-md"
                    onChange={(event) =>
                      setEditingCategory((current) =>
                        current
                          ? { ...current, label: event.target.value }
                          : current
                      )
                    }
                    value={editingCategory.label}
                  />
                </FormField>
                <FormField label="排序">
                  <Input
                    className="h-9 rounded-md"
                    min={1}
                    onChange={(event) =>
                      setEditingCategory((current) =>
                        current
                          ? {
                              ...current,
                              sortOrder: Number(event.target.value),
                            }
                          : current
                      )
                    }
                    type="number"
                    value={editingCategory.sortOrder}
                  />
                </FormField>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                className="h-8 rounded-md"
                onClick={() => setEditingCategory(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                className="h-8 rounded-md"
                disabled={isSaving || !editingCategory?.label.trim()}
                onClick={saveEditingCategory}
                size="sm"
                type="button"
              >
                <FloppyDisk size={15} weight="bold" />
                {isSaving ? "保存中..." : "保存分类"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RecordsPanel>
    </>
  )
}
