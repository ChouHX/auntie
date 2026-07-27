"use client"

import { useMemo, useState, type ReactNode } from "react"
import { FloppyDisk, Plus } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { CmsContent, CmsFaqContent, CmsFaqItem, CmsStatus } from "@/types/cms"
import {
  type FaqLanguage,
  type PersistContent,
  BulkActions,
  RecordsPanel,
  RowMenu,
  StatusBadge,
  TableFooterInfo,
  createId,
  emptyFaqItem,
  stripQuestionNumber,
  sortByOrder,
  toLines,
  upsertAt,
  useAdminNoticeDialog,
  useTablePagination,
  useTableSelection,
} from "@/components/admin/admin-shared"

type FaqPair = {
  en: CmsFaqItem
  index: number
  key: string
  status: CmsStatus
  zh: CmsFaqItem
}

type FaqPairDraft = {
  enAnswer: string
  enQuestion: string
  index: number
  key: string
  status: CmsStatus
  zhAnswer: string
  zhQuestion: string
}

function createFaqPairs(content: CmsContent): FaqPair[] {
  const zhItems = content.faq.zh.items.toSorted(sortByOrder)
  const enItems = content.faq.en.items.toSorted(sortByOrder)
  const count = Math.max(zhItems.length, enItems.length)

  return Array.from({ length: count }, (_, index) => {
    const zh = zhItems[index] ?? {
      ...emptyFaqItem,
      id: `zh-faq-${index + 1}`,
      sortOrder: index + 1,
    }
    const en = enItems[index] ?? {
      ...emptyFaqItem,
      id: `en-faq-${index + 1}`,
      sortOrder: index + 1,
    }

    return {
      en,
      index,
      key: `${zh.id || "zh"}:${en.id || "en"}:${index}`,
      status:
        zh.status === "draft" || en.status === "draft" ? "draft" : "published",
      zh,
    }
  })
}

function upsertFaqPair(content: CmsContent, draft: FaqPairDraft): CmsContent {
  const zhItems = content.faq.zh.items.toSorted(sortByOrder)
  const enItems = content.faq.en.items.toSorted(sortByOrder)
  const currentZh = zhItems[draft.index]
  const currentEn = enItems[draft.index]
  const zhItem: CmsFaqItem = {
    id: currentZh?.id || createId("zh-faq"),
    question: stripQuestionNumber(draft.zhQuestion),
    answer: toLines(draft.zhAnswer),
    status: draft.status,
    sortOrder: draft.index + 1,
  }
  const enItem: CmsFaqItem = {
    id: currentEn?.id || createId("en-faq"),
    question: stripQuestionNumber(draft.enQuestion),
    answer: toLines(draft.enAnswer),
    status: draft.status,
    sortOrder: draft.index + 1,
  }

  return {
    ...content,
    faq: {
      zh: {
        ...content.faq.zh,
        items: reindexItems(upsertAt(zhItems, draft.index, zhItem)),
      },
      en: {
        ...content.faq.en,
        items: reindexItems(upsertAt(enItems, draft.index, enItem)),
      },
    },
  }
}

function removeFaqPairs(content: CmsContent, indexes: number[]): CmsContent {
  const indexSet = new Set(indexes)

  return {
    ...content,
    faq: {
      zh: {
        ...content.faq.zh,
        items: reindexItems(
          content.faq.zh.items
            .toSorted(sortByOrder)
            .filter((_, index) => !indexSet.has(index))
        ),
      },
      en: {
        ...content.faq.en,
        items: reindexItems(
          content.faq.en.items
            .toSorted(sortByOrder)
            .filter((_, index) => !indexSet.has(index))
        ),
      },
    },
  }
}

function updateFaqPairStatus(
  content: CmsContent,
  indexes: number[],
  status: CmsStatus
): CmsContent {
  const indexSet = new Set(indexes)

  return {
    ...content,
    faq: {
      zh: {
        ...content.faq.zh,
        items: reindexItems(
          content.faq.zh.items.toSorted(sortByOrder).map((item, index) =>
            indexSet.has(index)
              ? {
                  ...item,
                  status,
                }
              : item
          )
        ),
      },
      en: {
        ...content.faq.en,
        items: reindexItems(
          content.faq.en.items.toSorted(sortByOrder).map((item, index) =>
            indexSet.has(index)
              ? {
                  ...item,
                  status,
                }
              : item
          )
        ),
      },
    },
  }
}

function cloneFaqContent(content: CmsFaqContent): CmsFaqContent {
  return {
    ...content,
    intro: [...content.intro],
    items: [...content.items],
  }
}

function reindexItems(items: CmsFaqItem[]) {
  return items.map((item, index) => ({
    ...item,
    question: stripQuestionNumber(item.question),
    sortOrder: index + 1,
  }))
}

function FaqSettingsFields({
  draft,
  languageLabel,
  onChange,
}: {
  draft: CmsFaqContent
  languageLabel: string
  onChange: (patch: Partial<CmsFaqContent>) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-4 text-sm font-semibold">{languageLabel}</div>
      <div className="grid gap-4">
        <FormField label="页面标题">
          <Input
            className="h-9 rounded-md"
            onChange={(event) => onChange({ title: event.target.value })}
            value={draft.title}
          />
        </FormField>
        <FormField label="Kicker">
          <Input
            className="h-9 rounded-md"
            onChange={(event) => onChange({ kicker: event.target.value })}
            value={draft.kicker}
          />
        </FormField>
        <FormField label="页面描述">
          <Textarea
            className="min-h-20 rounded-md"
            onChange={(event) => onChange({ description: event.target.value })}
            value={draft.description}
          />
        </FormField>
        <FormField label="使用说明">
          <Textarea
            className="min-h-32 rounded-md"
            onChange={(event) =>
              onChange({ intro: toLines(event.target.value) })
            }
            value={draft.intro.join("\n")}
          />
        </FormField>
      </div>
    </div>
  )
}

export function FaqAdmin({
  content,
  isSaving,
  onCommit,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
}) {
  const [editingPair, setEditingPair] = useState<FaqPairDraft | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<Record<
    FaqLanguage,
    CmsFaqContent
  > | null>(null)
  const [query, setQuery] = useState("")
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()
  const pairs = useMemo(() => createFaqPairs(content), [content])
  const filteredPairs = useMemo(
    () =>
      pairs.filter((pair) =>
        [
          pair.zh.question,
          pair.en.question,
          pair.zh.answer.join(" "),
          pair.en.answer.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [pairs, query]
  )
  const pagination = useTablePagination(filteredPairs.length, query)
  const visiblePairs = useMemo(
    () => filteredPairs.slice(pagination.startIndex, pagination.endIndex),
    [filteredPairs, pagination.endIndex, pagination.startIndex]
  )
  const selection = useTableSelection(query)
  const visibleIds = visiblePairs.map((pair) => pair.key)
  const filteredIds = filteredPairs.map((pair) => pair.key)

  function openPair(pair: FaqPair) {
    setEditingPair({
      enAnswer: pair.en.answer.join("\n"),
      enQuestion: stripQuestionNumber(pair.en.question),
      index: pair.index,
      key: pair.key,
      status: pair.status,
      zhAnswer: pair.zh.answer.join("\n"),
      zhQuestion: stripQuestionNumber(pair.zh.question),
    })
  }

  function addPair() {
    setEditingPair({
      enAnswer: "",
      enQuestion: "",
      index: pairs.length,
      key: createId("faq-pair"),
      status: "draft",
      zhAnswer: "",
      zhQuestion: "",
    })
  }

  async function savePair() {
    if (!editingPair) {
      return
    }

    const saved = await onCommit(
      (current) => upsertFaqPair(current, editingPair),
      "QA 已保存"
    )

    if (saved) {
      setEditingPair(null)
      selection.clear()
    }
  }

  async function deletePairs(keys: string[]) {
    if (
      !keys.length ||
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除 ${keys.length} 个 QA。此操作无法撤销。`,
        title: "确认删除 QA？",
      }))
    ) {
      return
    }

    const indexes = pairs
      .filter((pair) => keys.includes(pair.key))
      .map((pair) => pair.index)
    const saved = await onCommit(
      (current) => removeFaqPairs(current, indexes),
      "QA 已删除"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function updatePairStatus(keys: string[], status: CmsStatus) {
    if (!keys.length) {
      return
    }

    const indexes = pairs
      .filter((pair) => keys.includes(pair.key))
      .map((pair) => pair.index)
    const saved = await onCommit(
      (current) => updateFaqPairStatus(current, indexes, status),
      status === "published" ? "QA 已发布" : "QA 已设为草稿"
    )

    if (saved) {
      selection.clear()
    }
  }

  async function saveSettings() {
    if (!settingsDraft) {
      return
    }

    const saved = await onCommit(
      (current) => ({
        ...current,
        faq: {
          zh: {
            ...settingsDraft.zh,
            items: current.faq.zh.items,
          },
          en: {
            ...settingsDraft.en,
            items: current.faq.en.items,
          },
        },
      }),
      "QA 页面设置已保存"
    )

    if (saved) {
      setSettingsDraft(null)
    }
  }

  return (
    <>
      {noticeDialog}
      <RecordsPanel
        action={
          <div className="flex gap-2">
            <Button
              className="h-8 rounded-md"
              onClick={() =>
                setSettingsDraft({
                  zh: cloneFaqContent(content.faq.zh),
                  en: cloneFaqContent(content.faq.en),
                })
              }
              size="sm"
              type="button"
              variant="outline"
            >
              页面设置
            </Button>
            <Button className="h-8 rounded-md" onClick={addPair} size="sm">
              <Plus size={15} weight="bold" />
              新增
            </Button>
          </div>
        }
        bulkActions={
          <BulkActions
            allCount={filteredIds.length}
            onClear={selection.clear}
            onDelete={() => deletePairs(selection.selectedIds)}
            onDraft={() => updatePairStatus(selection.selectedIds, "draft")}
            onPublish={() =>
              updatePairStatus(selection.selectedIds, "published")
            }
            onSelectAll={() => selection.selectAll(filteredIds)}
            selectedCount={selection.selectedCount}
          />
        }
        count={filteredPairs.length}
        description="中英文 QA 成对管理。删除、发布或设为草稿会同时作用于对应中文和英文。"
        query={query}
        searchPlaceholder="搜索中文或英文 QA..."
        setQuery={setQuery}
        title="QA管理"
      >
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9">
                <Checkbox
                  aria-label="选择当前页 QA"
                  checked={selection.getCheckedState(visibleIds)}
                  onCheckedChange={(checked) =>
                    selection.toggleMany(visibleIds, checked === true)
                  }
                />
              </TableHead>
              <TableHead className="w-16">序号</TableHead>
              <TableHead>中文问题</TableHead>
              <TableHead>English Question</TableHead>
              <TableHead className="w-24">段落</TableHead>
              <TableHead className="w-28">状态</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePairs.map((pair) => (
              <TableRow key={pair.key}>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 QA ${pair.index + 1}`}
                    checked={selection.isSelected(pair.key)}
                    onCheckedChange={(checked) =>
                      selection.toggle(pair.key, checked === true)
                    }
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {pair.index + 1}
                </TableCell>
                <TableCell className="min-w-80">
                  <button
                    className="block max-w-md truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => openPair(pair)}
                    type="button"
                  >
                    {stripQuestionNumber(pair.zh.question) || "未填写中文问题"}
                  </button>
                  <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                    {pair.zh.answer[0] || "暂无中文答案"}
                  </div>
                </TableCell>
                <TableCell className="min-w-80">
                  <div className="max-w-md truncate font-medium">
                    {stripQuestionNumber(pair.en.question) ||
                      "No English question"}
                  </div>
                  <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                    {pair.en.answer[0] || "No English answer"}
                  </div>
                </TableCell>
                <TableCell>
                  {pair.zh.answer.length}/{pair.en.answer.length}
                </TableCell>
                <TableCell>
                  <StatusBadge status={pair.status} />
                </TableCell>
                <TableCell>
                  <RowMenu
                    destructiveLabel="删除"
                    onDelete={() => deletePairs([pair.key])}
                    onEdit={() => openPair(pair)}
                    onStatusChange={(status) =>
                      updatePairStatus([pair.key], status)
                    }
                    status={pair.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooterInfo pagination={pagination} />

        <Dialog
          onOpenChange={(open) => !open && setEditingPair(null)}
          open={Boolean(editingPair)}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>
                {editingPair ? `编辑 QA ${editingPair.index + 1}` : "编辑 QA"}
              </DialogTitle>
              <DialogDescription>
                序号由系统根据当前排序生成，不需要写在问题文本里。
              </DialogDescription>
            </DialogHeader>
            {editingPair ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-4 text-sm font-semibold">中文</div>
                  <div className="grid gap-4">
                    <FormField label="问题">
                      <Input
                        className="h-9 rounded-md"
                        onChange={(event) =>
                          setEditingPair((current) =>
                            current
                              ? { ...current, zhQuestion: event.target.value }
                              : current
                          )
                        }
                        value={editingPair.zhQuestion}
                      />
                    </FormField>
                    <FormField label="答案">
                      <Textarea
                        className="min-h-64 rounded-md"
                        onChange={(event) =>
                          setEditingPair((current) =>
                            current
                              ? { ...current, zhAnswer: event.target.value }
                              : current
                          )
                        }
                        value={editingPair.zhAnswer}
                      />
                    </FormField>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-4 text-sm font-semibold">English</div>
                  <div className="grid gap-4">
                    <FormField label="Question">
                      <Input
                        className="h-9 rounded-md"
                        onChange={(event) =>
                          setEditingPair((current) =>
                            current
                              ? { ...current, enQuestion: event.target.value }
                              : current
                          )
                        }
                        value={editingPair.enQuestion}
                      />
                    </FormField>
                    <FormField label="Answer">
                      <Textarea
                        className="min-h-64 rounded-md"
                        onChange={(event) =>
                          setEditingPair((current) =>
                            current
                              ? { ...current, enAnswer: event.target.value }
                              : current
                          )
                        }
                        value={editingPair.enAnswer}
                      />
                    </FormField>
                  </div>
                </div>
                <FormField className="lg:col-span-2" label="状态">
                  <Select
                    onValueChange={(status) =>
                      setEditingPair((current) =>
                        current
                          ? {
                              ...current,
                              status:
                                status === "draft" ? "draft" : "published",
                            }
                          : current
                      )
                    }
                    value={editingPair.status}
                  >
                    <SelectTrigger className="h-9 max-w-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">published</SelectItem>
                      <SelectItem value="draft">draft</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                className="h-8 rounded-md"
                onClick={() => setEditingPair(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                className="h-8 rounded-md"
                disabled={isSaving || !editingPair?.zhQuestion.trim()}
                onClick={savePair}
                size="sm"
                type="button"
              >
                <FloppyDisk size={15} weight="bold" />
                {isSaving ? "保存中..." : "保存此 QA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          onOpenChange={(open) => !open && setSettingsDraft(null)}
          open={Boolean(settingsDraft)}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>QA 页面设置</DialogTitle>
              <DialogDescription>
                页面标题、描述和使用说明按中英文分别保存。
              </DialogDescription>
            </DialogHeader>
            {settingsDraft ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <FaqSettingsFields
                  draft={settingsDraft.zh}
                  languageLabel="中文"
                  onChange={(patch) =>
                    setSettingsDraft((current) =>
                      current
                        ? {
                            ...current,
                            zh: { ...current.zh, ...patch },
                          }
                        : current
                    )
                  }
                />
                <FaqSettingsFields
                  draft={settingsDraft.en}
                  languageLabel="English"
                  onChange={(patch) =>
                    setSettingsDraft((current) =>
                      current
                        ? {
                            ...current,
                            en: { ...current.en, ...patch },
                          }
                        : current
                    )
                  }
                />
              </div>
            ) : null}
            <DialogFooter>
              <Button
                className="h-8 rounded-md"
                onClick={() => setSettingsDraft(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button
                className="h-8 rounded-md"
                disabled={isSaving}
                onClick={saveSettings}
                size="sm"
                type="button"
              >
                <FloppyDisk size={15} weight="bold" />
                {isSaving ? "保存中..." : "保存页面设置"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RecordsPanel>
    </>
  )
}
