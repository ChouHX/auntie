/**
 * Seed script — generates realistic dashboard data into the CMS SQLite store.
 *
 * Run with: node scripts/seed-dashboard.mjs
 * (or: npx tsx scripts/seed-dashboard.mjs if tsx is available)
 *
 * This script writes payment orders, team members, notifications, and tasks
 * directly into data/cms.sqlite using the same single-row JSON pattern as
 * cms-store.ts.
 */

import fs from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

const sqliteFile =
  process.env.CMS_SQLITE_FILE ?? path.join(process.cwd(), "data", "cms.sqlite")

// Ensure data directory exists
fs.mkdirSync(path.dirname(sqliteFile), { recursive: true })

function openDatabase() {
  const database = new DatabaseSync(sqliteFile)
  database.exec("PRAGMA busy_timeout = 5000")
  database.exec("PRAGMA journal_mode = WAL")
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_content (
      id INTEGER PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  return database
}

function readContentFromSqlite() {
  const database = openDatabase()
  try {
    const row = database
      .prepare("SELECT content_json FROM cms_content WHERE id = 1")
      .get()
    return row?.content_json ? JSON.parse(row.content_json) : null
  } finally {
    database.close()
  }
}

function writeContentToSqlite(content) {
  const database = openDatabase()
  try {
    database
      .prepare(
        `
          INSERT INTO cms_content (id, content_json, updated_at)
          VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            content_json = excluded.content_json,
            updated_at = excluded.updated_at
        `
      )
      .run(JSON.stringify(content), content.updatedAt)
  } finally {
    database.close()
  }
}

// --- Seed data generators ---

const serviceTypes = [
  "日常清洁",
  "深度清洁",
  "退租清洁",
  "开荒清洁",
  "地毯清洗",
  "定期清洁",
]

const serviceAreas = [
  { area: "洛杉矶 / 尔湾 · 美国", country: "美国" },
  { area: "温哥华 · 加拿大", country: "加拿大" },
  { area: "悉尼 · 澳大利亚", country: "澳大利亚" },
  { area: "伦敦 · 英国", country: "英国" },
  { area: "多伦多 GTA / 加拿大", country: "加拿大" },
  { area: "圣何塞 · 美国", country: "美国" },
  { area: "墨尔本 · 澳大利亚", country: "澳大利亚" },
  { area: "西雅图 · 美国", country: "美国" },
  { area: "纽约 · 美国", country: "美国" },
  { area: "旧金山 · 美国", country: "美国" },
  { area: "东京 · 日本", country: "日本" },
  { area: "首尔 · 韩国", country: "韩国" },
]

const customerNames = [
  "Sarah Chen",
  "Wei Zhang",
  "Emily Liu",
  "Min Wang",
  "Jason Li",
  "Yuki Tanaka",
  "Catherine Xu",
  "David Kim",
  "Sophia Huang",
  "Tom Zhou",
  "Lily Yang",
  "Kevin Lu",
  "Amy Sun",
  "Frank Wu",
  "Grace Tang",
  "Henry Ma",
  "Vivian Hu",
  "Eric Jin",
  "Nancy Lin",
  "Bob Cao",
  "Diana He",
  "Oscar Tang",
  "Paula Pan",
  "Jack Shen",
  "Mira Du",
]

const auntieNames = [
  "王阿姨",
  "李阿姨",
  "张阿姨",
  "刘阿姨",
  "陈阿姨",
  "赵阿姨",
  "黄阿姨",
  "周阿姨",
  "吴阿姨",
  "徐阿姨",
  "孙阿姨",
  "马阿姨",
  "朱阿姨",
  "胡阿姨",
  "林阿姨",
  "何阿姨",
]

const auntieRoles = [
  "高级保洁师",
  "深度保洁师",
  "退租清洁专员",
  "开荒清洁专员",
  "日常保洁师",
  "地毯清洗专员",
  "定期清洁专员",
  "商业清洁专员",
]

const auntieStatuses = [
  "available",
  "on-task",
  "available",
  "off-duty",
  "on-task",
  "available",
  "available",
  "on-leave",
  "available",
  "on-task",
  "off-duty",
  "available",
  "on-task",
  "available",
  "available",
  "off-duty",
]

const auntieAreas = [
  {
    area: "洛杉矶 / 尔湾 · 美国",
    country: "美国",
    phone: "+1 949",
    areas: ["洛杉矶 / 尔湾 · 美国", "圣何塞 · 美国"],
  },
  {
    area: "温哥华 · 加拿大",
    country: "加拿大",
    phone: "+1 604",
    areas: ["温哥华 · 加拿大", "多伦多 GTA / 加拿大"],
  },
  {
    area: "悉尼 · 澳大利亚",
    country: "澳大利亚",
    phone: "+61 2",
    areas: ["悉尼 · 澳大利亚", "墨尔本 · 澳大利亚"],
  },
  {
    area: "伦敦 · 英国",
    country: "英国",
    phone: "+44 20",
    areas: ["伦敦 · 英国"],
  },
  {
    area: "洛杉矶 / 尔湾 · 美国",
    country: "美国",
    phone: "+1 310",
    areas: ["洛杉矶 / 尔湾 · 美国", "旧金山 · 美国"],
  },
  {
    area: "多伦多 GTA / 加拿大",
    country: "加拿大",
    phone: "+1 416",
    areas: ["多伦多 GTA / 加拿大", "温哥华 · 加拿大"],
  },
  {
    area: "墨尔本 · 澳大利亚",
    country: "澳大利亚",
    phone: "+61 3",
    areas: ["墨尔本 · 澳大利亚", "悉尼 · 澳大利亚"],
  },
  {
    area: "圣何塞 · 美国",
    country: "美国",
    phone: "+1 408",
    areas: ["圣何塞 · 美国", "洛杉矶 / 尔湾 · 美国"],
  },
  {
    area: "西雅图 · 美国",
    country: "美国",
    phone: "+1 206",
    areas: ["西雅图 · 美国", "洛杉矶 / 尔湾 · 美国"],
  },
  {
    area: "纽约 · 美国",
    country: "美国",
    phone: "+1 212",
    areas: ["纽约 · 美国", "波士顿 · 美国"],
  },
  {
    area: "旧金山 · 美国",
    country: "美国",
    phone: "+1 415",
    areas: ["旧金山 · 美国", "圣何塞 · 美国"],
  },
  {
    area: "温哥华 · 加拿大",
    country: "加拿大",
    phone: "+1 778",
    areas: ["温哥华 · 加拿大"],
  },
  {
    area: "布里斯班 · 澳大利亚",
    country: "澳大利亚",
    phone: "+61 7",
    areas: ["布里斯班 · 澳大利亚", "悉尼 · 澳大利亚"],
  },
  {
    area: "洛杉矶 / 尔湾 · 美国",
    country: "美国",
    phone: "+1 323",
    areas: ["洛杉矶 / 尔湾 · 美国", "西雅图 · 美国"],
  },
  {
    area: "东京 · 日本",
    country: "日本",
    phone: "+81 3",
    areas: ["东京 · 日本", "大阪 · 日本"],
  },
  {
    area: "首尔 · 韩国",
    country: "韩国",
    phone: "+82 2",
    areas: ["首尔 · 韩国"],
  },
]

const teamMembers = auntieNames.map((name, i) => {
  const num = String(i + 1).padStart(2, "0")
  const areaInfo = auntieAreas[i]
  const joinYear = 2023 + (i % 3)
  const joinMonth = String((i % 12) + 1).padStart(2, "0")
  const joinDay = String((i % 28) + 1).padStart(2, "0")
  return {
    id: `team-${i + 1}`,
    name,
    avatar: `/gold-aunties/gold-auntie-${num}-detail.webp`,
    avatarThumb: `/gold-aunties/gold-auntie-${num}-thumb.webp`,
    role: auntieRoles[i % auntieRoles.length],
    status: auntieStatuses[i],
    area: areaInfo.area,
    completedCount: Math.floor(Math.random() * 120) + 30,
    rating: 4.5 + Math.random() * 0.5,
    phone: `${areaInfo.phone}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    joinedAt: `${joinYear}-${joinMonth}-${joinDay}T00:00:00.000Z`,
    serviceAreas: areaInfo.areas,
  }
})

const reviewComments = [
  "阿姨非常专业，清洁得很干净，态度也很好！",
  "准时到达，服务很细致，厨房和浴室都很满意。",
  "工作认真负责，家里焕然一新，下次还会预约。",
  "清洁效果不错，但稍晚到了十几分钟，整体满意。",
  "服务态度很好，沟通顺畅，推荐！",
  "非常用心，死角都清理到了，非常感谢。",
  "效率很高，三小时做完两居室深度清洁，质量也很好。",
  "阿姨很friendly，做完还帮我检查了几个地方，很细心。",
]

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomAmount(serviceType) {
  const basePrices = {
    日常清洁: 180,
    深度清洁: 320,
    退租清洁: 450,
    开荒清洁: 680,
    地毯清洗: 220,
    定期清洁: 200,
    商业清洁: 500,
  }
  const base = basePrices[serviceType] ?? 200
  const variation = Math.floor(Math.random() * 80) - 20
  return `$${base + variation}`
}

function parsePaymentAmount(value) {
  const amount = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0
  )

  return Number.isFinite(amount) ? amount : 0
}

function randomDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(
    Math.floor(Math.random() * 12) + 8,
    Math.floor(Math.random() * 60),
    0,
    0
  )
  return date.toISOString()
}

function generateOrders(count) {
  const orders = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const serviceType = randomItem(serviceTypes)
    const areaInfo = randomItem(serviceAreas)
    const daysAgo = Math.floor(Math.random() * 14) // Last 14 days
    const createdAt = randomDate(daysAgo)
    const serviceDate = new Date(
      now + (Math.random() > 0.4 ? -1 : 2) * 86400000
    )
      .toISOString()
      .split("T")[0]

    // Distribute statuses: ~40% paid (completed), ~35% paid (unfinished), ~20% unpaid, ~5% failed
    const rand = Math.random()
    let status
    let isCompleted = false
    if (rand < 0.05) {
      status = "failed"
    } else if (rand < 0.25) {
      status = "unpaid"
    } else if (rand < 0.6) {
      status = "paid" // unfinished (service date in future)
    } else {
      status = "paid" // completed (service date in past)
      isCompleted = true
    }

    const orderId = `AC-2506-${String(100 - i).padStart(4, "0")}`
    const customerName = randomItem(customerNames)
    const finalServiceDate = isCompleted
      ? new Date(now - Math.random() * 5 * 86400000).toISOString().split("T")[0]
      : serviceDate
    const amount = randomAmount(serviceType)

    const order = {
      orderId,
      customerName,
      contact: `+1 ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(
        Math.random() * 900 + 100
      )}-${Math.floor(Math.random() * 9000 + 1000)}`,
      serviceAddress: `${Math.floor(Math.random() * 9000 + 100)} ${
        areaInfo.area.split(" · ")[0]
      } St`,
      serviceArea: areaInfo.area,
      serviceType,
      serviceDate: finalServiceDate,
      amount,
      amountValue: parsePaymentAmount(amount),
      currency: "USD",
      provider: "airwallex",
      status,
      createdAt,
      updatedAt: createdAt,
      note: Math.random() > 0.7 ? "客户要求重点清洁厨房和浴室" : "",
      webhookEventIds: [],
    }

    // Assign auntie to paid orders
    if (status === "paid") {
      const auntie = randomItem(teamMembers)
      order.assignedAuntieId = auntie.id

      // Add review to completed orders (70% chance)
      if (isCompleted && Math.random() < 0.7) {
        const rating = Math.random() < 0.85 ? 5 : 4
        order.review = {
          rating,
          comment: randomItem(reviewComments),
          createdAt: new Date(
            new Date(finalServiceDate).getTime() + Math.random() * 2 * 86400000
          ).toISOString(),
          customerName,
        }
      }
    }

    orders.push(order)
  }

  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function generateNotifications(orders) {
  const notifications = []
  const now = Date.now()
  const hour = 3_600_000

  const recentOrders = orders.slice(0, 5)

  recentOrders.forEach((order, index) => {
    const type = order.status === "paid" ? "payment" : "order"
    notifications.push({
      id: `notif-seed-${index + 1}`,
      type,
      title: type === "payment" ? "收款成功" : "新订单创建",
      message:
        type === "payment"
          ? `订单 ${order.orderId} 已完成支付，金额 ${order.amount}`
          : `客户 ${order.customerName} 创建了一笔${order.serviceType}订单，金额 ${order.amount}`,
      createdAt: new Date(now - (index + 1) * hour * 2).toISOString(),
      read: index > 2,
    })
  })

  notifications.push({
    id: "notif-seed-sys-1",
    type: "system",
    title: "阿姨排班更新",
    message: "赵阿姨已申请休假，6月30日排班已自动调整",
    createdAt: new Date(now - 8 * hour).toISOString(),
    read: true,
  })

  notifications.push({
    id: "notif-seed-task-1",
    type: "task",
    title: "任务即将到期",
    message: "「联系退租客户确认到场时间」将在 2 小时后到期",
    createdAt: new Date(now - 4 * hour).toISOString(),
    read: false,
  })

  return notifications
}

function generateTasks(orders) {
  const now = Date.now()
  const hour = 3_600_000
  const day = 86_400_000
  const tasks = []

  const pendingOrders = orders.filter((o) => o.status === "unpaid").slice(0, 3)
  const paidOrders = orders.filter((o) => o.status === "paid").slice(0, 3)

  pendingOrders.forEach((order, index) => {
    tasks.push({
      id: `task-seed-${tasks.length + 1}`,
      title: `跟进 ${order.customerName} 的待付款订单`,
      description: `订单 ${order.orderId}（${order.serviceType}）尚未付款，需要联系客户确认`,
      priority: index === 0 ? "high" : "medium",
      status: "pending",
      dueDate: new Date(now + (index + 1) * day).toISOString(),
      assignee: "客服组",
      relatedOrderId: order.orderId,
      createdAt: new Date(now - (index + 2) * hour).toISOString(),
    })
  })

  paidOrders.forEach((order, index) => {
    tasks.push({
      id: `task-seed-${tasks.length + 1}`,
      title: `安排阿姨上门 — ${order.serviceType}`,
      description: `订单 ${order.orderId} 已付款，需安排阿姨在 ${order.serviceDate} 上门服务`,
      priority: index === 0 ? "high" : "medium",
      status: index === 0 ? "in-progress" : "pending",
      dueDate: new Date(now + (index + 1) * day).toISOString(),
      assignee: "调度组",
      relatedOrderId: order.orderId,
      createdAt: new Date(now - (index + 3) * hour).toISOString(),
    })
  })

  tasks.push({
    id: `task-seed-${tasks.length + 1}`,
    title: "整理本月客户好评截图",
    description: "从微信和邮件渠道收集本月客户好评，更新到首页好评区域",
    priority: "low",
    status: "completed",
    dueDate: new Date(now - day).toISOString(),
    assignee: "运营组",
    createdAt: new Date(now - 5 * day).toISOString(),
  })

  tasks.push({
    id: `task-seed-${tasks.length + 1}`,
    title: "更新 Airwallex 支付配置",
    description: "切换到生产环境前需要补充 webhook 回调地址和密钥",
    priority: "medium",
    status: "pending",
    dueDate: new Date(now + 7 * day).toISOString(),
    assignee: "技术组",
    createdAt: new Date(now - 3 * day).toISOString(),
  })

  return tasks
}

// --- Main: read existing content, merge seed data, write back ---

let content
const existingContent = readContentFromSqlite()
if (existingContent) {
  content = existingContent
  console.log(
    `Existing content found. Current orders: ${content.paymentOrders?.length ?? 0}`
  )
} else {
  console.log("No existing content found. Creating from defaults.")
  content = {
    version: 1,
    updatedAt: "",
    blogPosts: [],
    blogCategories: [],
    galleryItems: [],
    reviewItems: [],
    faq: { zh: { items: [] }, en: { items: [] } },
    contactPage: {},
    afterSalesPage: {},
    paymentOrders: [],
    paymentSettings: {
      enabled: false,
      provider: "airwallex",
      currency: "USD",
    },
    notificationSettings: {
      recipientEmail: "auntiechenhome@gmail.com",
      smtpFrom: "",
      smtpHost: "",
      smtpPassword: "",
      smtpPort: "587",
      smtpSecure: false,
      smtpUsername: "",
    },
    siteSettings: { logoImage: "/logo.webp" },
    teamMembers: [],
    dashboardNotifications: [],
    dashboardTasks: [],
  }
}

// Generate and merge seed data
const seedOrders = generateOrders(40)
content.paymentOrders = seedOrders
content.teamMembers = teamMembers
content.dashboardNotifications = generateNotifications(seedOrders)
content.dashboardTasks = generateTasks(seedOrders)
content.updatedAt = new Date().toISOString()

try {
  writeContentToSqlite(content)
  console.log("Seed data written successfully!")
  console.log(`  - Payment orders: ${seedOrders.length}`)
  console.log(`  - Team members: ${content.teamMembers.length}`)
  console.log(`  - Notifications: ${content.dashboardNotifications.length}`)
  console.log(`  - Tasks: ${content.dashboardTasks.length}`)
} catch (error) {
  console.error("Failed to write seed data:", error)
  process.exit(1)
}
