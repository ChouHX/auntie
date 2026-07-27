"use client"

import { useMemo, useState } from "react"
import { Eye } from "@phosphor-icons/react"

import {
  type PersistContent,
  BulkActions,
  RecordsPanel,
  RowMenu,
  StatusBadge,
  TableFooterInfo,
  UploadButton,
  createId,
  useAdminNoticeDialog,
  useTablePagination,
  useTableSelection,
} from "@/components/admin/admin-shared"
import { Checkbox } from "@/components/ui/checkbox"
import { ImagePreviewer } from "@/components/ui/image-previewer"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  uploadAdminImage,
  type UploadCollection,
  type UploadResult,
} from "@/lib/cms-api"
import type { CmsContent, CmsStatus } from "@/types/cms"

export function ImageLibraryAdmin({
  collection,
  content,
  description,
  field,
  isSaving,
  onCommit,
  title,
  token,
}: {
  collection: UploadCollection
  content: CmsContent
  description: string
  field: "galleryItems" | "reviewItems"
  isSaving: boolean
  onCommit: PersistContent
  title: string
  token: string
}) {
  const [query, setQuery] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const items = useMemo(
    () => content[field].toSorted((a, b) => a.sortOrder - b.sortOrder),
    [content, field]
  )
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.src.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  )
  const pagination = useTablePagination(
    filteredItems.length,
    `${collection}:${query}`
  )
  const visibleItems = useMemo(
    () => filteredItems.slice(pagination.startIndex, pagination.endIndex),
    [filteredItems, pagination.endIndex, pagination.startIndex]
  )
  const previewImages = useMemo(
    () =>
      filteredItems.map((item, index) => ({
        alt: `${title} ${index + 1}`,
        src: item.src,
      })),
    [filteredItems, title]
  )
  const selection = useTableSelection(`${collection}:${query}`)
  const visibleIds = visibleItems.map((item) => item.id)
  const filteredIds = filteredItems.map((item) => item.id)

  async function handleUpload(files: File[]) {
    if (!files.length) {
      return
    }

    setUploadError("")
    setIsUploading(true)

    try {
      const uploads: UploadResult[] = []

      for (const file of files) {
        uploads.push(await uploadAdminImage(token, collection, file))
      }

      await onCommit(
        (current) => ({
          ...current,
          [field]: [
            ...current[field],
            ...uploads.map((result, index) => ({
              id: createId(collection),
              src: result.src,
              status: "published",
              sortOrder: current[field].length + index + 1,
            })),
          ],
        }),
        uploads.length > 1 ? `已上传 ${uploads.length} 张图片` : "图片已上传"
      )
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  async function deleteItems(ids: string[]) {
    if (
      !ids.length ||
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除 ${ids.length} 张图片。此操作无法撤销。`,
        title: "确认删除图片？",
      }))
    ) {
      return
    }

    const idSet = new Set(ids)
    const saved = await onCommit(
      (current) => ({
        ...current,
        [field]: current[field].filter((item) => !idSet.has(item.id)),
      }),
      "图片已删除"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function updateItemStatus(ids: string[], status: CmsStatus) {
    if (!ids.length) {
      return
    }

    const idSet = new Set(ids)
    const saved = await onCommit(
      (current) => ({
        ...current,
        [field]: current[field].map((item) =>
          idSet.has(item.id) ? { ...item, status } : item
        ),
      }),
      status === "published" ? "图片已发布" : "图片已设为草稿"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function updateItemOrder(
    id: string,
    value: string,
    currentSortOrder: number
  ) {
    const sortOrder = Number(value)
    if (
      !Number.isFinite(sortOrder) ||
      sortOrder < 1 ||
      sortOrder === currentSortOrder
    ) {
      return
    }

    await onCommit(
      (current) => ({
        ...current,
        [field]: current[field].map((item) =>
          item.id === id ? { ...item, sortOrder } : item
        ),
      }),
      "图片排序已保存"
    )
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <UploadButton
            disabled={isUploading || isSaving}
            label={isUploading ? "上传中..." : "批量上传图片"}
            multiple
            onFiles={handleUpload}
          />
        }
        bulkActions={
          <BulkActions
            allCount={filteredIds.length}
            onClear={selection.clear}
            onDelete={() => deleteItems(selection.selectedIds)}
            onDraft={() => updateItemStatus(selection.selectedIds, "draft")}
            onPublish={() =>
              updateItemStatus(selection.selectedIds, "published")
            }
            onSelectAll={() => selection.selectAll(filteredIds)}
            selectedCount={selection.selectedCount}
          />
        }
        count={filteredItems.length}
        description={description}
        query={query}
        searchPlaceholder="搜索图片路径..."
        setQuery={setQuery}
        title={title}
      >
        {uploadError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </div>
        ) : null}
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9">
                <Checkbox
                  aria-label="选择当前页图片"
                  checked={selection.getCheckedState(visibleIds)}
                  onCheckedChange={(checked) =>
                    selection.toggleMany(visibleIds, checked === true)
                  }
                />
              </TableHead>
              <TableHead className="w-20">图片</TableHead>
              <TableHead>自动路径</TableHead>
              <TableHead className="w-28">状态</TableHead>
              <TableHead className="w-24">排序</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((item) => {
              const previewItemIndex = filteredItems.findIndex(
                (filteredItem) => filteredItem.id === item.id
              )

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${item.src}`}
                      checked={selection.isSelected(item.id)}
                      onCheckedChange={(checked) =>
                        selection.toggle(item.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      aria-label="预览图片"
                      className="group relative block overflow-hidden rounded-md"
                      onClick={() => setPreviewIndex(previewItemIndex)}
                      type="button"
                    >
                      <img
                        alt=""
                        className="h-12 w-14 object-cover"
                        src={item.src}
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
                        <Eye size={17} weight="bold" />
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[520px]">
                    <code className="block truncate text-xs text-muted-foreground">
                      {item.src}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-16 rounded-md px-2"
                      defaultValue={item.sortOrder}
                      key={`${item.id}-${item.sortOrder}`}
                      min={1}
                      onBlur={(event) =>
                        updateItemOrder(
                          item.id,
                          event.currentTarget.value,
                          item.sortOrder
                        )
                      }
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <RowMenu
                      destructiveLabel="删除"
                      hideEdit
                      onDelete={() => deleteItems([item.id])}
                      onStatusChange={(status) =>
                        updateItemStatus([item.id], status)
                      }
                      status={item.status}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TableFooterInfo pagination={pagination} />
        <ImagePreviewer
          images={previewImages}
          onOpenChange={setPreviewIndex}
          openIndex={previewIndex}
        />
      </RecordsPanel>
    </>
  )
}
