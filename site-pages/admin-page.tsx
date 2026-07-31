"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import { MoonStars, Sun } from "@phosphor-icons/react"
import { toast } from "sonner"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  clearStoredAdminToken,
  deleteAdminAuntie,
  deleteAdminBlogPosts,
  deleteAdminPaymentOrder,
  fetchAdminSectionContent,
  getStoredAdminToken,
  loginAdmin,
  saveAdminContentSection,
  setStoredAdminToken,
  upsertAdminPaymentOrder,
  type AdminAuntieStatsMap,
  type AdminContentPagination,
  type AdminContentSection,
  type AdminContentSectionResult,
  type AdminDashboardSummary,
} from "@/lib/cms-api"
import { defaultCmsContent } from "@/data/cms-defaults"
import { resetCmsContentCache, useCmsContent } from "@/hooks/use-cms-content"
import { getSiteLogo } from "@/lib/site-settings"
import { cn } from "@/lib/utils"
import type { CmsContent, CmsPaymentOrder } from "@/types/cms"

import {
  type AdminSection,
  type PersistContent,
  adminSectionMeta,
  adminSections,
} from "@/components/admin/admin-shared"
import { DashboardAdmin } from "@/components/admin/dashboard-admin"
import { CustomerAdmin } from "@/components/admin/customer-admin"
import { BlogAdmin, BlogCategoryAdmin } from "@/components/admin/blog-admin"
import { ImageLibraryAdmin } from "@/components/admin/image-library-admin"
import { FaqAdmin } from "@/components/admin/faq-admin"
import { AuntieAdmin } from "@/components/admin/auntie-admin"
import { OrderAdmin } from "@/components/admin/order-admin"
import { ServiceAreasAdmin } from "@/components/admin/service-areas-admin"
import {
  AccountAdmin,
  PaymentSettingsAdmin,
  SiteSettingsAdmin,
} from "@/components/admin/settings-admin"

function AdminPage() {
  const { setTheme, theme } = useTheme()
  const [token, setToken] = useState(() => getStoredAdminToken() ?? "")
  const [content, setContent] = useState<CmsContent | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard")
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [orderQuery, setOrderQuery] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")
  const [orderPage, setOrderPage] = useState(1)
  const [orderPageSize, setOrderPageSize] = useState(10)
  const [orderPagination, setOrderPagination] =
    useState<AdminContentPagination>({
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    })
  const [auntieStats, setAuntieStats] = useState<AdminAuntieStatsMap>({})
  const [dashboardSummary, setDashboardSummary] =
    useState<AdminDashboardSummary | null>(null)
  const [chartRange, setChartRange] = useState(14)
  const [isRefreshingCurrentSection, setIsRefreshingCurrentSection] =
    useState(false)
  const dashboardInitRef = useRef(false)
  const lastChartRangeRef = useRef(14)
  const [genericPage, setGenericPage] = useState(1)
  const [genericPageSize, setGenericPageSize] = useState(10)
  const [genericQuery, setGenericQuery] = useState("")
  const [genericStatus, setGenericStatus] = useState("all")
  const [genericCategory, setGenericCategory] = useState("all")
  const [genericPagination, setGenericPagination] =
    useState<AdminContentPagination>({
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    })
  const isDarkTheme = theme === "dark"
  const activeMeta = adminSectionMeta[activeSection]

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true
    const params = createAdminSectionParams(
      activeSection,
      {
        page: orderPage,
        pageSize: orderPageSize,
        query: orderQuery,
        status: orderStatusFilter,
      },
      {
        category: genericCategory,
        chartRange,
        page: genericPage,
        pageSize: genericPageSize,
        query: genericQuery,
        status: genericStatus,
      }
    )

    fetchAdminSectionContent(token, params)
      .then((result) => {
        if (!isMounted) {
          return
        }

        setContent((current) => mergeAdminContent(current, result.content))
        applyAdminSectionMeta(result, {
          activeSection,
          setAuntieStats,
          setDashboardSummary,
          setGenericPagination,
          setOrderPagination,
        })
        if (activeSection === "dashboard" && result.dashboardSummary) {
          dashboardInitRef.current = true
          lastChartRangeRef.current = chartRange
        }
      })
      .catch((loadError: Error) => {
        if (!isMounted) {
          return
        }

        const message = loadError.message
        toast.error(message)
        clearStoredAdminToken()
        setContent(null)
        setAuntieStats({})
        setDashboardSummary(null)
        setToken("")
        dashboardInitRef.current = false
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
          setIsRefreshingCurrentSection(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [
    activeSection,
    genericCategory,
    genericPage,
    genericPageSize,
    genericQuery,
    genericStatus,
    orderPage,
    orderPageSize,
    orderQuery,
    orderStatusFilter,
    reloadKey,
    token,
  ])

  useEffect(() => {
    if (!token || activeSection !== "orders") {
      return
    }

    let isRefreshing = false

    function refreshContent() {
      if (isSaving || isRefreshing || document.visibilityState === "hidden") {
        return
      }

      isRefreshing = true
      setReloadKey((current) => current + 1)
      window.setTimeout(() => {
        isRefreshing = false
      }, 500)
    }

    const timerId = window.setInterval(refreshContent, 15_000)
    window.addEventListener("focus", refreshContent)
    document.addEventListener("visibilitychange", refreshContent)

    return () => {
      window.clearInterval(timerId)
      window.removeEventListener("focus", refreshContent)
      document.removeEventListener("visibilitychange", refreshContent)
    }
  }, [activeSection, isSaving, token])

  // Chart-only fetch: when chartRange changes, fetch only the chart data
  // and merge it into the existing dashboardSummary (no full re-fetch).
  useEffect(() => {
    if (
      !token ||
      activeSection !== "dashboard" ||
      !dashboardInitRef.current ||
      lastChartRangeRef.current === chartRange
    ) {
      return
    }

    lastChartRangeRef.current = chartRange
    let isMounted = true

    fetchAdminSectionContent(token, {
      chartRange,
      dashboardParts: "chart",
      section: "dashboard",
    })
      .then((result) => {
        if (!isMounted || !result.dashboardSummary) {
          return
        }
        setDashboardSummary((prev) =>
          prev
            ? {
                ...prev,
                orderDailyStats: {
                  ...prev.orderDailyStats,
                  ...result.dashboardSummary!.orderDailyStats,
                },
              }
            : prev
        )
      })
      .catch(() => {
        // Silent fail — chart just won't update
      })

    return () => {
      isMounted = false
    }
  }, [chartRange, activeSection, token])

  async function persistContent(
    updater: (current: CmsContent) => CmsContent,
    successMessage = "已保存"
  ) {
    if (!content || !token) {
      return null
    }

    const nextContent = updater(content)
    const sectionParams = createAdminSectionParams(
      activeSection,
      {
        page: orderPage,
        pageSize: orderPageSize,
        query: orderQuery,
        status: orderStatusFilter,
      },
      {
        category: genericCategory,
        chartRange,
        page: genericPage,
        pageSize: genericPageSize,
        query: genericQuery,
        status: genericStatus,
      }
    )
    setIsSaving(true)

    try {
      const saved = await saveAdminContentSection(
        token,
        activeSection as AdminContentSection,
        nextContent,
        sectionParams
      )
      const merged = mergeAdminContent(content, saved.content)
      if (saved.pagination) {
        if (activeSection === "orders") {
          setOrderPage(saved.pagination.page)
        } else if (activeSection === "aunties" || activeSection === "blogs") {
          setGenericPage(saved.pagination.page)
        }
      }
      setContent(merged)
      applyAdminSectionMeta(saved, {
        activeSection,
        setAuntieStats,
        setDashboardSummary,
        setGenericPagination,
        setOrderPagination,
      })
      resetCmsContentCache()
      toast.success(successMessage)
      return merged
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "保存失败"
      toast.error(message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function saveOrder(order: CmsPaymentOrder) {
    if (!token) {
      return null
    }

    setIsSaving(true)

    try {
      const saved = await upsertAdminPaymentOrder(token, order, {
        page: 1,
        pageSize: orderPageSize,
        query: orderQuery,
        status: orderStatusFilter,
      })
      const merged = mergeAdminContent(content, saved.content)
      setOrderPage(saved.pagination?.page ?? 1)
      setContent(merged)
      applyAdminSectionMeta(saved, {
        activeSection,
        setAuntieStats,
        setDashboardSummary,
        setGenericPagination,
        setOrderPagination,
      })
      resetCmsContentCache()
      toast.success("付款订单已保存")
      return merged
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "保存失败")
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteOrder(orderId: string) {
    if (!token) {
      return null
    }

    setIsSaving(true)

    try {
      const saved = await deleteAdminPaymentOrder(token, orderId, {
        page: orderPage,
        pageSize: orderPageSize,
        query: orderQuery,
        status: orderStatusFilter,
      })
      const merged = mergeAdminContent(content, saved.content)
      if (saved.pagination) {
        setOrderPage(saved.pagination.page)
      }
      setContent(merged)
      applyAdminSectionMeta(saved, {
        activeSection,
        setAuntieStats,
        setDashboardSummary,
        setGenericPagination,
        setOrderPagination,
      })
      resetCmsContentCache()
      toast.success("付款订单已删除")
      return merged
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "删除失败")
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteAuntie(memberId: string) {
    if (!token) {
      return null
    }

    setIsSaving(true)

    try {
      const saved = await deleteAdminAuntie(token, memberId, {
        page: genericPage,
        pageSize: genericPageSize,
        query: genericQuery,
        status: genericStatus,
      })
      const merged = mergeAdminContent(content, saved.content)
      if (saved.pagination) {
        setGenericPage(saved.pagination.page)
        setGenericPagination(saved.pagination)
      }
      setContent(merged)
      applyAdminSectionMeta(saved, {
        activeSection,
        setAuntieStats,
        setDashboardSummary,
        setGenericPagination,
        setOrderPagination,
      })
      resetCmsContentCache()
      toast.success("阿姨已删除")
      return merged
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "删除失败")
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteBlogPosts(postIds: string[]) {
    if (!token || postIds.length === 0) {
      return null
    }

    setIsSaving(true)

    try {
      const saved = await deleteAdminBlogPosts(token, postIds, {
        category: genericCategory,
        page: genericPage,
        pageSize: genericPageSize,
        query: genericQuery,
        status: genericStatus,
      })
      const merged = mergeAdminContent(content, saved.content)
      if (saved.pagination) {
        setGenericPage(saved.pagination.page)
        setGenericPagination(saved.pagination)
      }
      setContent(merged)
      applyAdminSectionMeta(saved, {
        activeSection,
        setAuntieStats,
        setDashboardSummary,
        setGenericPagination,
        setOrderPagination,
      })
      resetCmsContentCache()
      toast.success("博客文章已删除")
      return merged
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "删除失败")
      return null
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogout() {
    clearStoredAdminToken()
    setToken("")
    setContent(null)
    setAuntieStats({})
    setDashboardSummary(null)
  }

  function handleLogin(nextToken: string) {
    setIsLoading(true)
    setToken(nextToken)
  }

  function handleSectionChange(section: AdminSection) {
    setIsLoading(true)
    setGenericPage(1)
    setGenericQuery("")
    setGenericStatus("all")
    setGenericCategory("all")
    setActiveSection(section)
  }

  function handleOrderQueryChange(query: string) {
    setIsLoading(true)
    setOrderQuery(query)
    setOrderPage(1)
  }

  function handleOrderStatusFilterChange(status: string) {
    setIsLoading(true)
    setOrderStatusFilter(status)
    setOrderPage(1)
  }

  function handleOrderPageChange(page: number) {
    setIsLoading(true)
    setOrderPage(page)
  }

  function handleOrderPageSizeChange(pageSize: number) {
    setIsLoading(true)
    setOrderPageSize(pageSize)
    setOrderPage(1)
  }

  function handleGenericQueryChange(query: string) {
    setIsLoading(true)
    setGenericQuery(query)
    setGenericPage(1)
  }

  function handleGenericStatusFilterChange(status: string) {
    setIsLoading(true)
    setGenericStatus(status)
    setGenericPage(1)
  }

  function handleGenericCategoryChange(category: string) {
    setIsLoading(true)
    setGenericCategory(category)
    setGenericPage(1)
  }

  function handleGenericPageChange(page: number) {
    setIsLoading(true)
    setGenericPage(page)
  }

  function handleGenericPageSizeChange(pageSize: number) {
    setIsLoading(true)
    setGenericPageSize(pageSize)
    setGenericPage(1)
  }

  function handleTrendRangeChange(range: number) {
    setChartRange(range)
  }

  function handleRefreshCurrentSection() {
    if (!token) {
      return
    }
    setIsRefreshingCurrentSection(true)
    setReloadKey((current) => current + 1)
  }

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark")
  }

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <AdminLayout
      activeSection={activeSection}
      isDarkTheme={isDarkTheme}
      isRefreshing={isRefreshingCurrentSection}
      isSaving={isSaving}
      items={adminSections}
      loading={isLoading}
      logoImage={getSiteLogo(content)}
      onLogout={handleLogout}
      onRefresh={handleRefreshCurrentSection}
      onSectionChange={handleSectionChange}
      onThemeToggle={toggleTheme}
      subtitle={activeMeta.description}
      title={activeMeta.title}
    >
      {isLoading || !content ? (
        <Card className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-none">
          正在加载后台内容...
        </Card>
      ) : (
        <AdminContentEditor
          activeSection={activeSection}
          auntieStats={auntieStats}
          chartRange={chartRange}
          content={content}
          dashboardSummary={dashboardSummary}
          genericCategory={genericCategory}
          genericPage={genericPage}
          genericPageSize={genericPageSize}
          genericPagination={genericPagination}
          genericQuery={genericQuery}
          genericStatus={genericStatus}
          isSaving={isSaving}
          onDeleteAuntie={deleteAuntie}
          onDeleteBlogPosts={deleteBlogPosts}
          onDeleteOrder={deleteOrder}
          onGenericCategoryFilterChange={handleGenericCategoryChange}
          onGenericPageChange={handleGenericPageChange}
          onGenericPageSizeChange={handleGenericPageSizeChange}
          onGenericQueryChange={handleGenericQueryChange}
          onGenericStatusFilterChange={handleGenericStatusFilterChange}
          onOrderPageChange={handleOrderPageChange}
          onOrderPageSizeChange={handleOrderPageSizeChange}
          onOrderQueryChange={handleOrderQueryChange}
          onOrderStatusFilterChange={handleOrderStatusFilterChange}
          onSaveOrder={saveOrder}
          onTokenChange={setToken}
          onTrendRangeChange={handleTrendRangeChange}
          onCommit={persistContent}
          orderPage={orderPage}
          orderPageSize={orderPageSize}
          orderPagination={orderPagination}
          orderQuery={orderQuery}
          orderStatusFilter={orderStatusFilter}
          token={token}
        />
      )}
    </AdminLayout>
  )
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const { setTheme, theme } = useTheme()
  const { content } = useCmsContent(["siteSettings"])
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDarkTheme = theme === "dark"
  const logoImage = getSiteLogo(content)

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const result = await loginAdmin(username, password)
      setStoredAdminToken(result.token)
      toast.success("登录成功")
      onLogin(result.token)
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "登录失败"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen w-full bg-background">
      <Button
        aria-label={isDarkTheme ? "切换亮色模式" : "切换暗色模式"}
        className="absolute top-5 right-5 z-10 size-10"
        onClick={toggleTheme}
        size="icon"
        type="button"
        variant="navIcon"
      >
        {isDarkTheme ? <Sun size={18} /> : <MoonStars size={18} />}
      </Button>

      <div className="hidden w-full md:inline-block">
        <img
          alt=""
          className="h-full min-h-screen w-full object-cover"
          src="/about_us.png"
        />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12">
        <form
          className="flex w-80 flex-col items-center justify-center md:w-96"
          onSubmit={handleSubmit}
        >
          <img alt="" className="mb-6 size-12 rounded-md" src={logoImage} />
          <h2 className="text-4xl font-medium text-gray-900 dark:text-white">
            Sign in
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500/90 dark:text-slate-300">
            Welcome back! Please sign in to continue
          </p>

          <div className="my-8 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-300/90 dark:bg-white/15" />
            <p className="w-full text-center text-sm text-nowrap text-gray-500/90 dark:text-slate-400">
              admin account
            </p>
            <div className="h-px w-full bg-gray-300/90 dark:bg-white/15" />
          </div>

          <label
            className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 dark:border-white/15"
            htmlFor="admin-username"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="11"
              viewBox="0 0 16 11"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                fill="#6B7280"
                fillRule="evenodd"
              />
            </svg>
            <input
              autoComplete="username"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder:text-gray-500/80 dark:text-slate-200 dark:placeholder:text-slate-500"
              id="admin-username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              required
              value={username}
            />
          </label>

          <label
            className="mt-6 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 dark:border-white/15"
            htmlFor="admin-password"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="17"
              viewBox="0 0 13 17"
              width="13"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                fill="#6B7280"
              />
            </svg>
            <input
              autoComplete="current-password"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder:text-gray-500/80 dark:text-slate-200 dark:placeholder:text-slate-500"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </label>

          <label className="mt-8 flex w-full items-center gap-2 text-gray-500/80 dark:text-slate-400">
            <input className="h-5" type="checkbox" />
            <span className="text-sm">Remember me</span>
          </label>

          {error ? (
            <div className="mt-5 mb-0 mb-4 w-full rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            className={cn(
              "mt-8 h-11 w-full rounded-full bg-indigo-500 text-white transition-opacity hover:opacity-90",
              isSubmitting && "cursor-not-allowed opacity-70"
            )}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  )
}

function createAdminSectionParams(
  activeSection: AdminSection,
  orders: {
    page: number
    pageSize: number
    query: string
    status: string
  },
  generic: {
    category: string
    chartRange: number
    page: number
    pageSize: number
    query: string
    status: string
  }
) {
  if (activeSection === "orders") {
    return {
      page: orders.page,
      pageSize: orders.pageSize,
      query: orders.query,
      section: "orders" as const,
      status: orders.status,
    }
  }

  if (activeSection === "blogs") {
    return {
      category: generic.category,
      page: generic.page,
      pageSize: generic.pageSize,
      query: generic.query,
      section: "blogs" as const,
      status: generic.status,
    }
  }

  if (activeSection === "aunties") {
    return {
      page: generic.page,
      pageSize: generic.pageSize,
      query: generic.query,
      section: "aunties" as const,
      status: generic.status,
    }
  }

  if (activeSection === "dashboard") {
    return {
      chartRange: generic.chartRange,
      section: "dashboard" as AdminContentSection,
    }
  }

  return {
    section: activeSection as AdminContentSection,
  }
}

function mergeAdminContent(
  current: CmsContent | null,
  partial: Partial<CmsContent>
): CmsContent {
  return {
    ...defaultCmsContent,
    ...current,
    ...partial,
    afterSalesPage:
      partial.afterSalesPage ??
      current?.afterSalesPage ??
      defaultCmsContent.afterSalesPage,
    blogCategories:
      partial.blogCategories ??
      current?.blogCategories ??
      defaultCmsContent.blogCategories,
    blogPosts:
      partial.blogPosts ?? current?.blogPosts ?? defaultCmsContent.blogPosts,
    contactPage:
      partial.contactPage ??
      current?.contactPage ??
      defaultCmsContent.contactPage,
    dashboardTasks:
      partial.dashboardTasks ??
      current?.dashboardTasks ??
      defaultCmsContent.dashboardTasks,
    faq: partial.faq ?? current?.faq ?? defaultCmsContent.faq,
    galleryItems:
      partial.galleryItems ??
      current?.galleryItems ??
      defaultCmsContent.galleryItems,
    notificationSettings:
      partial.notificationSettings ??
      current?.notificationSettings ??
      defaultCmsContent.notificationSettings,
    paymentOrders: partial.paymentOrders ?? current?.paymentOrders ?? [],
    paymentSettings:
      partial.paymentSettings ??
      current?.paymentSettings ??
      defaultCmsContent.paymentSettings,
    reviewItems:
      partial.reviewItems ??
      current?.reviewItems ??
      defaultCmsContent.reviewItems,
    serviceRegions:
      partial.serviceRegions ??
      current?.serviceRegions ??
      defaultCmsContent.serviceRegions,
    serviceLocations:
      partial.serviceLocations ??
      current?.serviceLocations ??
      defaultCmsContent.serviceLocations,
    siteSettings: {
      ...defaultCmsContent.siteSettings,
      ...current?.siteSettings,
      ...partial.siteSettings,
    },
    teamMembers:
      partial.teamMembers ??
      current?.teamMembers ??
      defaultCmsContent.teamMembers,
  }
}

function applyAdminSectionMeta(
  result: AdminContentSectionResult,
  setters: {
    activeSection: AdminSection
    setAuntieStats: (stats: AdminAuntieStatsMap) => void
    setDashboardSummary: (summary: AdminDashboardSummary | null) => void
    setGenericPagination: (pagination: AdminContentPagination) => void
    setOrderPagination: (pagination: AdminContentPagination) => void
  }
) {
  if (setters.activeSection === "orders" && result.pagination) {
    setters.setOrderPagination(result.pagination)
  }

  if (
    setters.activeSection !== "orders" &&
    setters.activeSection !== "dashboard" &&
    result.pagination
  ) {
    setters.setGenericPagination(result.pagination)
  }

  if (result.auntieStats) {
    setters.setAuntieStats(result.auntieStats)
  }

  if (result.dashboardSummary) {
    setters.setDashboardSummary(result.dashboardSummary)
  }
}

function AdminContentEditor({
  activeSection,
  auntieStats,
  chartRange,
  content,
  dashboardSummary,
  genericCategory,
  genericPage,
  genericPageSize,
  genericPagination,
  genericQuery,
  genericStatus,
  isSaving,
  onDeleteAuntie,
  onDeleteBlogPosts,
  onDeleteOrder,
  onGenericCategoryFilterChange,
  onGenericPageChange,
  onGenericPageSizeChange,
  onGenericQueryChange,
  onGenericStatusFilterChange,
  onOrderPageChange,
  onOrderPageSizeChange,
  onOrderQueryChange,
  onOrderStatusFilterChange,
  onSaveOrder,
  onTokenChange,
  onTrendRangeChange,
  onCommit,
  orderPage,
  orderPageSize,
  orderPagination,
  orderQuery,
  orderStatusFilter,
  token,
}: {
  activeSection: AdminSection
  auntieStats: AdminAuntieStatsMap
  chartRange: number
  content: CmsContent
  dashboardSummary: AdminDashboardSummary | null
  genericCategory: string
  genericPage: number
  genericPageSize: number
  genericPagination: AdminContentPagination
  genericQuery: string
  genericStatus: string
  isSaving: boolean
  onDeleteAuntie: (memberId: string) => Promise<CmsContent | null>
  onDeleteBlogPosts: (postIds: string[]) => Promise<CmsContent | null>
  onDeleteOrder: (orderId: string) => Promise<CmsContent | null>
  onGenericCategoryFilterChange: (category: string) => void
  onGenericPageChange: (page: number) => void
  onGenericPageSizeChange: (pageSize: number) => void
  onGenericQueryChange: (query: string) => void
  onGenericStatusFilterChange: (status: string) => void
  onOrderPageChange: (page: number) => void
  onOrderPageSizeChange: (pageSize: number) => void
  onOrderQueryChange: (query: string) => void
  onOrderStatusFilterChange: (status: string) => void
  onSaveOrder: (order: CmsPaymentOrder) => Promise<CmsContent | null>
  onTokenChange: (token: string) => void
  onTrendRangeChange: (range: number) => void
  onCommit: PersistContent
  orderPage: number
  orderPageSize: number
  orderPagination: AdminContentPagination
  orderQuery: string
  orderStatusFilter: string
  token: string
}) {
  if (activeSection === "dashboard") {
    return (
      <DashboardAdmin
        chartRange={chartRange}
        content={content}
        dashboardSummary={dashboardSummary ?? undefined}
        onTrendRangeChange={onTrendRangeChange}
        token={token}
      />
    )
  }

  if (activeSection === "customers") {
    return <CustomerAdmin token={token} />
  }

  if (activeSection === "blogs") {
    return (
      <BlogAdmin
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
        onDeletePosts={onDeleteBlogPosts}
        remotePagination={{
          category: genericCategory,
          onCategoryFilterChange: onGenericCategoryFilterChange,
          onPageChange: onGenericPageChange,
          onPageSizeChange: onGenericPageSizeChange,
          onQueryChange: onGenericQueryChange,
          onStatusFilterChange: onGenericStatusFilterChange,
          page: genericPage,
          pageSize: genericPageSize,
          query: genericQuery,
          statusFilter: genericStatus,
          totalCount: genericPagination.totalCount,
          totalPages: genericPagination.totalPages,
        }}
        token={token}
      />
    )
  }
  if (activeSection === "categories") {
    return (
      <BlogCategoryAdmin
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
      />
    )
  }
  if (activeSection === "gallery") {
    return (
      <ImageLibraryAdmin
        collection="gallery"
        content={content}
        description="用于画廊页面展示的服务图片。"
        field="galleryItems"
        isSaving={isSaving}
        onCommit={onCommit}
        title="画廊图片"
        token={token}
      />
    )
  }
  if (activeSection === "reviews") {
    return (
      <ImageLibraryAdmin
        collection="reviews"
        content={content}
        description="用于首页客户好评滚动区域的截图。"
        field="reviewItems"
        isSaving={isSaving}
        onCommit={onCommit}
        title="好评图片"
        token={token}
      />
    )
  }
  if (activeSection === "faq") {
    return (
      <FaqAdmin content={content} isSaving={isSaving} onCommit={onCommit} />
    )
  }
  if (activeSection === "orders") {
    return (
      <OrderAdmin
        auntieStats={auntieStats}
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
        onDeleteOrder={onDeleteOrder}
        onSaveOrder={onSaveOrder}
        token={token}
        remotePagination={{
          onPageChange: onOrderPageChange,
          onPageSizeChange: onOrderPageSizeChange,
          onQueryChange: onOrderQueryChange,
          onStatusFilterChange: onOrderStatusFilterChange,
          page: orderPage,
          pageSize: orderPageSize,
          query: orderQuery,
          statusFilter: orderStatusFilter,
          totalCount: orderPagination.totalCount,
          totalPages: orderPagination.totalPages,
        }}
      />
    )
  }
  if (activeSection === "aunties") {
    return (
      <AuntieAdmin
        auntieStats={auntieStats}
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
        onDeleteAuntie={onDeleteAuntie}
        remotePagination={{
          onPageChange: onGenericPageChange,
          onPageSizeChange: onGenericPageSizeChange,
          onQueryChange: onGenericQueryChange,
          onStatusFilterChange: onGenericStatusFilterChange,
          page: genericPage,
          pageSize: genericPageSize,
          query: genericQuery,
          statusFilter: genericStatus,
          totalCount: genericPagination.totalCount,
          totalPages: genericPagination.totalPages,
        }}
        token={token}
      />
    )
  }
  if (activeSection === "serviceAreas") {
    return (
      <ServiceAreasAdmin
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
      />
    )
  }
  if (activeSection === "siteSettings") {
    return (
      <SiteSettingsAdmin
        content={content}
        isSaving={isSaving}
        onCommit={onCommit}
        token={token}
      />
    )
  }
  if (activeSection === "account") {
    return <AccountAdmin onTokenChange={onTokenChange} token={token} />
  }

  return (
    <PaymentSettingsAdmin
      content={content}
      isSaving={isSaving}
      onCommit={onCommit}
      token={token}
    />
  )
}

export { AdminPage }
