"use client"

import { useMemo, useState } from "react"
import { FloppyDisk, Plus } from "@phosphor-icons/react"

import {
  type PersistContent,
  RecordsPanel,
  RowMenu,
  TableFooterInfo,
  createId,
  useAdminNoticeDialog,
  useTablePagination,
} from "@/components/admin/admin-shared"
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
import { cn } from "@/lib/utils"
import { deriveCitiesByRegion } from "@/lib/service-regions"
import type {
  CmsContent,
  CmsServiceLocation,
  CmsServiceRegion,
} from "@/types/cms"

type RegionDraft = CmsServiceRegion
type LocationDraft = CmsServiceLocation

function createRegionDraft(): RegionDraft {
  return {
    id: "",
    name: "",
    code2: "",
    latitude: 0,
    longitude: 0,
    cities: [],
    isTiny: false,
  }
}

function createLocationDraft(regions: CmsServiceRegion[]): LocationDraft {
  const fallbackCountry = regions[0]?.name ?? ""
  return {
    id: "",
    city: "",
    country: fallbackCountry,
    label: "",
    latitude: 0,
    longitude: 0,
  }
}

function normalizeRegionDraft(region: RegionDraft): RegionDraft {
  return {
    ...region,
    // id 为 ISO_A3，由后台填入。编辑时保留原值；新增时若未填则留空让后端报错
    id: region.id.trim(),
    name: region.name.trim() || "未命名地区",
    code2: region.code2.trim().toUpperCase(),
    latitude: Number(region.latitude) || 0,
    longitude: Number(region.longitude) || 0,
    // cities 不再由后台维护，保留原值仅为类型兼容，实际由 serviceLocations 聚合
    cities: [],
    isTiny: Boolean(region.isTiny),
  }
}

function normalizeLocationDraft(location: LocationDraft): LocationDraft {
  return {
    ...location,
    // id 新增时自动生成 nanoid（createId），编辑时保留原值
    id: location.id || createId("loc"),
    city: location.city.trim() || "未命名城市",
    country: location.country.trim(),
    label: location.label.trim(),
    latitude: Number(location.latitude) || 0,
    longitude: Number(location.longitude) || 0,
  }
}

export function ServiceAreasAdmin({
  content,
  isSaving,
  onCommit,
}: {
  content: CmsContent
  isSaving: boolean
  onCommit: PersistContent
}) {
  const [activeTab, setActiveTab] = useState<"locations" | "regions">("regions")
  const [editingRegion, setEditingRegion] = useState<RegionDraft | null>(null)
  const [editingLocation, setEditingLocation] = useState<LocationDraft | null>(
    null
  )
  const [regionError, setRegionError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [regionQuery, setRegionQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const { confirmAction, noticeDialog } = useAdminNoticeDialog()

  const regions = useMemo(
    () => content.serviceRegions ?? [],
    [content.serviceRegions]
  )
  const locations = useMemo(
    () => content.serviceLocations ?? [],
    [content.serviceLocations]
  )
  // 城市列表从 serviceLocations 聚合，避免双数据源改串
  const citiesByRegion = useMemo(
    () => deriveCitiesByRegion(regions, locations),
    [regions, locations]
  )

  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((r) => {
      const cities = citiesByRegion.get(r.name) ?? []
      return [r.id, r.name, r.code2, ...cities]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [regions, regionQuery, citiesByRegion])

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase()
    if (!q) return locations
    return locations.filter((l) =>
      [l.id, l.city, l.country, l.label].join(" ").toLowerCase().includes(q)
    )
  }, [locations, locationQuery])

  const regionPagination = useTablePagination(filteredRegions.length, regionQuery)
  const locationPagination = useTablePagination(
    filteredLocations.length,
    locationQuery
  )

  const visibleRegions = filteredRegions.slice(
    regionPagination.startIndex,
    regionPagination.endIndex
  )
  const visibleLocations = filteredLocations.slice(
    locationPagination.startIndex,
    locationPagination.endIndex
  )

  function updateEditingRegion(patch: Partial<RegionDraft>) {
    setEditingRegion((current) =>
      current ? { ...current, ...patch } : current
    )
    setRegionError("")
  }

  function updateEditingLocation(patch: Partial<LocationDraft>) {
    setEditingLocation((current) =>
      current ? { ...current, ...patch } : current
    )
    setLocationError("")
  }

  async function saveRegion() {
    if (!editingRegion) return
    const normalized = normalizeRegionDraft(editingRegion)
    if (!normalized.id) {
      setRegionError("请填写国家 id（ISO_A3 三字母代码，如 USA/GBR）。")
      return
    }
    const exists = regions.some((r) => r.id === normalized.id)
    const nextRegions = exists
      ? regions.map((r) => (r.id === normalized.id ? normalized : r))
      : [...regions, normalized]
    const saved = await onCommit(
      (current) => ({
        ...current,
        serviceRegions: nextRegions,
      }),
      "服务地区已保存"
    )
    if (saved) {
      setEditingRegion(null)
    }
  }

  async function deleteRegion(regionId: string) {
    const region = regions.find((r) => r.id === regionId)
    if (
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除地区「${region?.name ?? ""}」及其城市列表。3D 地球上对应国家将不再高亮。此操作无法撤销。`,
        title: "确认删除地区？",
      }))
    ) {
      return
    }
    const nextRegions = regions.filter((r) => r.id !== regionId)
    // 同时移除属于该国家的城市服务点
    const nextLocations = locations.filter(
      (l) => l.country !== region?.name
    )
    await onCommit(
      (current) => ({
        ...current,
        bookingConfigs: current.bookingConfigs.filter((config) =>
          nextLocations.some((location) => location.id === config.locationId)
        ),
        serviceRegions: nextRegions,
        serviceLocations: nextLocations,
      }),
      "服务地区已删除"
    )
  }

  async function saveLocation() {
    if (!editingLocation) return
    const normalized = normalizeLocationDraft(editingLocation)
    if (!normalized.city.trim()) {
      setLocationError("请填写城市中文名。")
      return
    }
    if (!normalized.country.trim()) {
      setLocationError("请选择所属国家。")
      return
    }
    const exists = locations.some((l) => l.id === normalized.id)
    const nextLocations = exists
      ? locations.map((l) => (l.id === normalized.id ? normalized : l))
      : [...locations, normalized]
    const saved = await onCommit(
      (current) => ({
        ...current,
        serviceLocations: nextLocations,
      }),
      "服务点已保存"
    )
    if (saved) {
      setEditingLocation(null)
    }
  }

  async function deleteLocation(locationId: string) {
    const location = locations.find((l) => l.id === locationId)
    if (
      !(await confirmAction({
        confirmLabel: "删除",
        description: `将删除服务点「${location?.city ?? ""}」。此操作无法撤销。`,
        title: "确认删除服务点？",
      }))
    ) {
      return
    }
    const nextLocations = locations.filter((l) => l.id !== locationId)
    await onCommit(
      (current) => ({
        ...current,
        bookingConfigs: current.bookingConfigs.filter(
          (config) => config.locationId !== locationId
        ),
        serviceLocations: nextLocations,
      }),
      "服务点已删除"
    )
  }

  return (
    <div className="space-y-4">
      {noticeDialog}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "regions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("regions")}
            type="button"
          >
            国家 / 地区 ({regions.length})
          </button>
          <button
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "locations"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("locations")}
            type="button"
          >
            城市服务点 ({locations.length})
          </button>
        </div>
      </div>

      {activeTab === "regions" ? (
        <RecordsPanel
          action={
            <Button
              className="h-8 rounded-md"
              disabled={isSaving}
              onClick={() => {
                setRegionError("")
                setEditingRegion(createRegionDraft())
              }}
              size="sm"
              type="button"
            >
              <Plus size={15} weight="bold" />
              新增地区
            </Button>
          }
          count={filteredRegions.length}
          description="维护服务覆盖的国家/地区。id 为 ISO_A3 三字母代码，与 3D 地球轮廓匹配。"
          query={regionQuery}
          searchPlaceholder="搜索国家、id 或城市..."
          setQuery={setRegionQuery}
          title="服务区域"
        >
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">id (ISO_A3)</TableHead>
                <TableHead>国家 / 地区</TableHead>
                <TableHead className="w-20">ISO2</TableHead>
                <TableHead>城市列表</TableHead>
                <TableHead className="w-24">坐标</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRegions.length ? (
                visibleRegions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {region.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {region.name}
                      {region.isTiny ? (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          小型地区
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">{region.code2}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(citiesByRegion.get(region.name) ?? []).join("、") || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {region.latitude}, {region.longitude}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowMenu
                        destructiveLabel="删除"
                        onEdit={() => {
                          setRegionError("")
                          setEditingRegion({ ...region, cities: [...region.cities] })
                        }}
                        onDelete={() => deleteRegion(region.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="py-10 text-center text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    暂无服务地区
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TableFooterInfo pagination={regionPagination} />
        </RecordsPanel>
      ) : (
        <RecordsPanel
          action={
            <Button
              className="h-8 rounded-md"
              disabled={isSaving}
              onClick={() => {
                setLocationError("")
                setEditingLocation(createLocationDraft(regions))
              }}
              size="sm"
              type="button"
            >
              <Plus size={15} weight="bold" />
              新增服务点
            </Button>
          }
          count={filteredLocations.length}
          description="维护 3D 地球上的城市服务点标记。每个点对应地球上的一个标记。"
          query={locationQuery}
          searchPlaceholder="搜索城市、英文名或国家..."
          setQuery={setLocationQuery}
          title="服务区域"
        >
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32">id</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>所属国家</TableHead>
                <TableHead>英文名</TableHead>
                <TableHead className="w-24">坐标</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLocations.length ? (
                visibleLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {location.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {location.city}
                    </TableCell>
                    <TableCell className="text-sm">{location.country}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {location.label || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {location.latitude}, {location.longitude}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowMenu
                        destructiveLabel="删除"
                        onEdit={() => {
                          setLocationError("")
                          setEditingLocation({ ...location })
                        }}
                        onDelete={() => deleteLocation(location.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="py-10 text-center text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    暂无服务点
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TableFooterInfo pagination={locationPagination} />
        </RecordsPanel>
      )}

      {/* 国家/地区编辑 Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingRegion(null)
          }
        }}
        open={Boolean(editingRegion)}
      >
        <DialogContent className="max-w-xl gap-3 overflow-visible p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>服务地区信息</DialogTitle>
            <DialogDescription>
              国家 id 为 ISO_A3 三字母代码（如 USA、GBR、FRA），与 3D
              地球国家轮廓匹配，请勿随意改动。
            </DialogDescription>
          </DialogHeader>
          {editingRegion ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                className="space-y-1.5"
                description="ISO_A3 三字母代码，新增后不可改。"
                label="国家 id"
                required
              >
                <Input
                  className="h-8 rounded-md font-mono"
                  disabled={regions.some((r) => r.id === editingRegion.id)}
                  onChange={(e) => updateEditingRegion({ id: e.target.value })}
                  placeholder="USA"
                  value={editingRegion.id}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                label="国家 / 地区中文名"
                required
              >
                <Input
                  className="h-8 rounded-md"
                  onChange={(e) =>
                    updateEditingRegion({ name: e.target.value })
                  }
                  placeholder="美国"
                  value={editingRegion.name}
                />
              </FormField>
              <FormField className="space-y-1.5" label="ISO2 代码">
                <Input
                  className="h-8 rounded-md font-mono"
                  onChange={(e) =>
                    updateEditingRegion({ code2: e.target.value })
                  }
                  placeholder="US"
                  value={editingRegion.code2}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                description="用于 3D 地球国家中心定位。"
                label="纬度 (latitude)"
              >
                <Input
                  className="h-8 rounded-md font-mono"
                  onChange={(e) =>
                    updateEditingRegion({
                      latitude: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="38"
                  type="number"
                  value={editingRegion.latitude}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                label="经度 (longitude)"
              >
                <Input
                  className="h-8 rounded-md font-mono"
                  onChange={(e) =>
                    updateEditingRegion({
                      longitude: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="-97"
                  type="number"
                  value={editingRegion.longitude}
                />
              </FormField>
              <FormField
                className="space-y-1.5 sm:col-span-2"
                description="城市由「城市服务点」tab 维护，这里只读展示当前该国家下的城市。"
                label="城市列表（只读）"
              >
                <div className="min-h-12 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {(citiesByRegion.get(editingRegion.name) ?? []).join("、") || "—"}
                </div>
              </FormField>
              <FormField
                className="space-y-1.5 sm:col-span-2"
                description="小型地区会在 3D 地球上放大光晕半径。"
                label="小型地区标记"
              >
                <Select
                  onValueChange={(value) =>
                    updateEditingRegion({ isTiny: value === "true" })
                  }
                  value={String(editingRegion.isTiny ?? false)}
                >
                  <SelectTrigger className="h-8 w-40 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">否</SelectItem>
                    <SelectItem value="true">是</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          ) : null}
          {regionError ? (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {regionError}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingRegion(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="h-8 rounded-md"
              disabled={isSaving}
              onClick={saveRegion}
              size="sm"
              type="button"
            >
              <FloppyDisk size={15} weight="bold" />
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 城市服务点编辑 Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingLocation(null)
          }
        }}
        open={Boolean(editingLocation)}
      >
        <DialogContent className="max-w-xl gap-3 overflow-visible p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>城市服务点信息</DialogTitle>
            <DialogDescription>
              每个服务点对应 3D 地球上的一个标记。新增时系统会自动生成
              id。
            </DialogDescription>
          </DialogHeader>
          {editingLocation ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                className="space-y-1.5"
                description="系统自动生成，编辑时不可改。"
                label="服务点 id"
              >
                <Input
                  className="h-8 rounded-md font-mono"
                  disabled
                  value={editingLocation.id || "（保存后自动生成）"}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                label="所属国家"
                required
              >
                <Select
                  onValueChange={(value) =>
                    updateEditingLocation({ country: value })
                  }
                  value={editingLocation.country}
                >
                  <SelectTrigger className="h-8 rounded-md">
                    <SelectValue placeholder="选择国家" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.name}>
                        {region.name} ({region.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                className="space-y-1.5"
                label="城市中文名"
                required
              >
                <Input
                  className="h-8 rounded-md"
                  onChange={(e) =>
                    updateEditingLocation({ city: e.target.value })
                  }
                  placeholder="洛杉矶"
                  value={editingLocation.city}
                />
              </FormField>
              <FormField className="space-y-1.5" label="城市英文名">
                <Input
                  className="h-8 rounded-md"
                  onChange={(e) =>
                    updateEditingLocation({ label: e.target.value })
                  }
                  placeholder="Los Angeles"
                  value={editingLocation.label}
                />
              </FormField>
              <FormField
                className="space-y-1.5"
                description="用于 3D 地球标记定位。"
                label="纬度 (latitude)"
              >
                <Input
                  className="h-8 rounded-md font-mono"
                  onChange={(e) =>
                    updateEditingLocation({
                      latitude: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="34.0522"
                  type="number"
                  value={editingLocation.latitude}
                />
              </FormField>
              <FormField className="space-y-1.5" label="经度 (longitude)">
                <Input
                  className="h-8 rounded-md font-mono"
                  onChange={(e) =>
                    updateEditingLocation({
                      longitude: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="-118.2437"
                  type="number"
                  value={editingLocation.longitude}
                />
              </FormField>
            </div>
          ) : null}
          {locationError ? (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {locationError}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-8 rounded-md"
              onClick={() => setEditingLocation(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="h-8 rounded-md"
              disabled={isSaving}
              onClick={saveLocation}
              size="sm"
              type="button"
            >
              <FloppyDisk size={15} weight="bold" />
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
