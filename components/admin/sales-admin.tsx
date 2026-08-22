"use client"

import { useEffect, useState } from "react"
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAdminNoticeDialog } from "@/components/admin/admin-shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { NumberInput } from "@/components/ui/number-input"
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
import { fetchAdminSalesMembers, saveAdminSalesMembers } from "@/lib/cms-api"
import type { AdminSalesCommissionSummary } from "@/lib/cms-api"
import type { CmsSalesMember } from "@/types/cms"

export function SalesAdmin({ token }: { token: string }) {
  const [members, setMembers] = useState<CmsSalesMember[]>([])
  const [studentTags, setStudentTags] = useState<string[]>([])
  const [commissionSummaries, setCommissionSummaries] = useState<
    AdminSalesCommissionSummary[]
  >([])
  const [editing, setEditing] = useState<CmsSalesMember | null>(null)
  const [editingPassword, setEditingPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()

  useEffect(() => {
    let mounted = true
    fetchAdminSalesMembers(token)
      .then((result) => {
        if (!mounted) return
        setMembers(result.salesMembers)
        setStudentTags(result.studentTags)
        setCommissionSummaries(result.commissionSummaries)
      })
      .catch(
        (error) =>
          mounted &&
          toast.error(
            error instanceof Error ? error.message : "销售资料加载失败"
          )
      )
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [token])

  function createMember() {
    const now = new Date().toISOString()
    setEditing({
      accountUsername: "",
      commissionAdjustment: 0,
      commissionPercentage: 0,
      createdAt: now,
      id: `sales-${crypto.randomUUID()}`,
      name: "",
      status: "active",
      studentTag: "",
      updatedAt: now,
    })
    setEditingPassword("")
  }

  async function persist(nextMembers: CmsSalesMember[]) {
    setIsSaving(true)
    try {
      const result = await saveAdminSalesMembers(
        token,
        nextMembers,
        editing && editingPassword
          ? { [editing.id]: editingPassword }
          : undefined
      )
      setMembers(result.salesMembers)
      setStudentTags(result.studentTags)
      setCommissionSummaries(result.commissionSummaries)
      setEditing(null)
      setEditingPassword("")
      toast.success("销售资料已保存")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "销售资料保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteMember(member: CmsSalesMember) {
    const confirmed = await confirmAction({
      confirmLabel: "删除",
      description: `将删除销售「${member.name}」与学员标签的绑定。历史订单金额不会被修改。`,
      title: "确认删除销售？",
    })
    if (confirmed)
      await persist(members.filter((item) => item.id !== member.id))
  }

  const tagOptions = Array.from(
    new Set([
      ...studentTags,
      ...members.map((member) => member.studentTag).filter(Boolean),
    ])
  ).sort((left, right) => left.localeCompare(right, "zh-CN"))
  const tagOwners = new Map(
    members.map((member) => [member.studentTag, member])
  )
  const commissionSummaryMap = new Map(
    commissionSummaries.map((summary) => [summary.salesMemberId, summary])
  )

  return (
    <>
      {noticeDialog}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">销售管理</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              将企业微信学员分区标签绑定到销售，并配置订单学员提成。
            </p>
          </div>
          <Button className="h-8" onClick={createMember} size="sm">
            <Plus size={15} />
            新建销售
          </Button>
        </div>
        <Card className="overflow-hidden rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>销售名称</TableHead>
                <TableHead>登录账号</TableHead>
                <TableHead>学员分区标签</TableHead>
                <TableHead>分成规则</TableHead>
                <TableHead>累计提成（原币 / 人民币）</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length ? (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      {member.accountUsername ? (
                        <span className="font-mono text-xs">
                          {member.accountUsername}
                        </span>
                      ) : (
                        <Badge variant="secondary">未开通</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.studentTag}</Badge>
                    </TableCell>
                    <TableCell>{formatCommissionRule(member)}</TableCell>
                    <TableCell>
                      <CommissionSummary
                        summary={commissionSummaryMap.get(member.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }
                        variant="secondary"
                      >
                        {member.status === "active" ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          aria-label="编辑销售"
                          className="size-8"
                          onClick={() => {
                            setEditingPassword("")
                            setEditing({ ...member })
                          }}
                          size="icon-sm"
                          variant="navIcon"
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          aria-label="删除销售"
                          className="size-8"
                          onClick={() => void deleteMember(member)}
                          size="icon-sm"
                          variant="destructive"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-28 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    {isLoading
                      ? "正在加载..."
                      : "暂无销售，请从学员分区标签创建"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setEditingPassword("")
          }
        }}
        open={Boolean(editing)}
      >
        <DialogContent className="max-w-lg gap-3">
          <DialogHeader>
            <DialogTitle>
              {members.some((item) => item.id === editing?.id)
                ? "编辑销售"
                : "新建销售"}
            </DialogTitle>
            <DialogDescription>
              客户的学员分区标签匹配后，订单将自动归属并计算分成。
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="销售名称" required>
                <Input
                  className="h-8"
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                  value={editing.name}
                />
              </FormField>
              <FormField
                description="用于登录 /sales，支持小写字母、数字、点、下划线和连字符。"
                label="登录账号"
              >
                <Input
                  autoComplete="off"
                  className="h-8"
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      accountUsername: event.target.value.toLocaleLowerCase(),
                    })
                  }
                  placeholder="例如 chen.li"
                  value={editing.accountUsername ?? ""}
                />
              </FormField>
              <FormField
                description={
                  members.some((item) => item.id === editing.id)
                    ? "留空保留原密码；填写后会重置密码并退出旧会话。"
                    : "开通账号时需设置至少 8 位密码。"
                }
                label={
                  members.some((item) => item.id === editing.id)
                    ? "重置登录密码"
                    : "初始登录密码"
                }
              >
                <Input
                  autoComplete="new-password"
                  className="h-8"
                  minLength={8}
                  onChange={(event) => setEditingPassword(event.target.value)}
                  placeholder="至少 8 位"
                  type="password"
                  value={editingPassword}
                />
              </FormField>
              <FormField label="学员分区标签" required>
                <Select
                  onValueChange={(studentTag) =>
                    setEditing({ ...editing, studentTag })
                  }
                  value={editing.studentTag}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="选择标签" />
                  </SelectTrigger>
                  <SelectContent>
                    {tagOptions.map((tag) => {
                      const owner = tagOwners.get(tag)
                      const occupied = Boolean(owner && owner.id !== editing.id)
                      return (
                        <SelectItem disabled={occupied} key={tag} value={tag}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{tag}</span>
                            {occupied ? (
                              <span className="text-xs text-muted-foreground">
                                已绑定 · {owner?.name}
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                description="保存后仅适用于之后新归属的订单，历史订单仍使用原比例。"
                label="订单分成比例（%）"
                required
              >
                <NumberInput
                  className="h-8"
                  max="100"
                  min="0"
                  onValueChange={(commissionPercentage) =>
                    setEditing({
                      ...editing,
                      commissionPercentage,
                    })
                  }
                  step="0.01"
                  value={editing.commissionPercentage}
                />
              </FormField>
              <FormField
                description="正数增加，负数扣减；比例填 0 时为纯固定分成。修改同样仅影响后续订单。"
                label="固定调整（订单币种）"
              >
                <NumberInput
                  className="h-8"
                  onValueChange={(commissionAdjustment) =>
                    setEditing({
                      ...editing,
                      commissionAdjustment,
                    })
                  }
                  step="0.01"
                  value={editing.commissionAdjustment ?? 0}
                />
              </FormField>
              <FormField label="状态">
                <Select
                  onValueChange={(status: CmsSalesMember["status"]) =>
                    setEditing({ ...editing, status })
                  }
                  value={editing.status}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-8"
              onClick={() => setEditing(null)}
              size="sm"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="h-8"
              disabled={
                isSaving ||
                !editing?.name.trim() ||
                !editing?.studentTag ||
                (Boolean(editing?.accountUsername) &&
                  !members.find((item) => item.id === editing?.id)
                    ?.accountUsername &&
                  editingPassword.length < 8) ||
                (editingPassword.length > 0 && editingPassword.length < 8)
              }
              onClick={() =>
                editing &&
                void persist(
                  members.some((item) => item.id === editing.id)
                    ? members.map((item) =>
                        item.id === editing.id ? editing : item
                      )
                    : [...members, editing]
                )
              }
              size="sm"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatCommissionRule(member: CmsSalesMember) {
  const percentage = Number(member.commissionPercentage) || 0
  const adjustment = Number(member.commissionAdjustment) || 0
  const percentagePart = percentage ? `${percentage}%` : ""
  const adjustmentPart = adjustment
    ? percentagePart
      ? `${adjustment > 0 ? "+" : "-"} ${Math.abs(adjustment)}`
      : String(adjustment)
    : ""

  return [percentagePart, adjustmentPart].filter(Boolean).join(" ") || "0"
}

function CommissionSummary({
  summary,
}: {
  summary?: AdminSalesCommissionSummary
}) {
  if (!summary?.currencies.length) {
    return <span className="text-muted-foreground">暂无提成</span>
  }

  return (
    <div className="space-y-0.5 whitespace-nowrap tabular-nums">
      <div>
        {summary.currencies
          .map(
            (item) =>
              `${item.currency} ${item.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}`
          )
          .join(" · ")}
      </div>
      <div className="text-xs text-muted-foreground">
        CNY{" "}
        {summary.cnyAmount.toLocaleString("zh-CN", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
        {summary.missingCnyCount
          ? ` · ${summary.missingCnyCount} 笔待汇率`
          : ""}
      </div>
    </div>
  )
}
