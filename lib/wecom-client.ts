import type { WecomCustomer } from "@/lib/wecom-types"

const API_BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000

const addWayNames: Record<number, string> = {
  0: "未知来源",
  1: "扫描二维码",
  2: "搜索手机号",
  3: "名片分享",
  4: "群聊",
  5: "手机通讯录",
  6: "微信联系人",
  8: "安装第三方应用时自动添加的客服人员",
  9: "搜索邮箱",
  10: "视频号添加",
  11: "通过日程参与人添加",
  12: "通过会议参与人添加",
  13: "添加微信好友对应的企业微信",
  14: "通过智慧硬件专属客服添加",
  15: "通过上门服务客服添加",
  16: "通过获客链接添加",
  17: "通过定制开发添加",
  18: "通过需求回复添加",
  21: "通过第三方售前客服添加",
  22: "通过可能的商务伙伴添加",
  24: "通过接受微信账号收到的好友申请添加",
  201: "内部成员共享",
  202: "管理员/负责人分配",
}

type ApiRecord = Record<string, unknown>
type CustomerRelationship = {
  customer: ApiRecord
  followInfo: ApiRecord
}
export type WecomCustomerRelation = {
  externalUserId: string
  followUserId: string
  relationId: string
}

let cachedToken: { expiresAt: number; value: string } | null = null

export class WecomApiError extends Error {
  readonly errcode?: number

  constructor(message: string, errcode?: number) {
    super(message)
    this.name = "WecomApiError"
    this.errcode = errcode
  }
}

export function isWecomConfigured() {
  return Boolean(
    process.env.WECOM_CORP_ID?.trim() && process.env.WECOM_CORP_SECRET?.trim()
  )
}

export async function fetchWecomCustomerRelations(): Promise<
  WecomCustomerRelation[]
> {
  const token = await getAccessToken()
  const userIds = await getFollowUsers(token)
  if (!userIds.length) {
    throw new WecomApiError("没有找到已配置客户联系功能的成员")
  }

  const relationGroups = await mapWithConcurrency(
    userIds,
    5,
    async (userId) => {
      const result = await requestJson("/externalcontact/list", {
        query: { access_token: token, userid: userId },
      })
      if (!Array.isArray(result.external_userid)) {
        throw new WecomApiError(`成员 ${userId} 的客户列表缺少 external_userid`)
      }
      return result.external_userid.map((externalUserId) => ({
        externalUserId: String(externalUserId),
        followUserId: userId,
        relationId: createRelationId(String(externalUserId), userId),
      }))
    }
  )

  return relationGroups.flat()
}

export async function fetchWecomCustomersByExternalIds(
  externalUserIds: string[],
  allowedRelationIds: Set<string>
): Promise<{
  customers: WecomCustomer[]
  invalidExternalUserIds: string[]
}> {
  if (!externalUserIds.length) {
    return { customers: [], invalidExternalUserIds: [] }
  }

  const token = await getAccessToken()
  const detailGroups = await mapWithConcurrency(
    externalUserIds,
    5,
    async (externalUserId) => getCustomerDetail(token, externalUserId)
  )
  const invalidExternalUserIds = detailGroups
    .filter((detail) => detail.invalid)
    .map((detail) => detail.externalUserId)
  const relationships = detailGroups
    .flatMap((detail) => detail.relationships)
    .filter(({ customer, followInfo }) =>
      allowedRelationIds.has(
        createRelationId(
          String(customer.external_userid || ""),
          String(followInfo.userid || "")
        )
      )
    )
  if (!relationships.length) {
    return { customers: [], invalidExternalUserIds }
  }
  const followUserIds = [
    ...new Set(
      relationships.map(({ followInfo }) => String(followInfo.userid))
    ),
  ]
  const [memberNames, tagMap] = await Promise.all([
    getMemberNames(token, followUserIds),
    getCorpTags(token),
  ])
  const syncedAt = new Date().toISOString()

  return {
    customers: relationships.map(({ customer, followInfo }) =>
      buildCustomer(customer, followInfo, memberNames, tagMap, syncedAt)
    ),
    invalidExternalUserIds,
  }
}

async function getAccessToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_MS
  ) {
    return cachedToken.value
  }

  const corpId = process.env.WECOM_CORP_ID?.trim()
  const corpSecret = process.env.WECOM_CORP_SECRET?.trim()
  if (!corpId || !corpSecret) {
    throw new WecomApiError(
      "企业微信未配置，请设置 WECOM_CORP_ID 和 WECOM_CORP_SECRET"
    )
  }

  const result = await requestJson("/gettoken", {
    query: { corpid: corpId, corpsecret: corpSecret },
  })
  const token = String(result.access_token ?? "")
  const expiresIn = Number(result.expires_in)
  if (!token || !Number.isFinite(expiresIn)) {
    throw new WecomApiError("获取 token 的响应缺少必要字段")
  }
  cachedToken = {
    expiresAt: Date.now() + expiresIn * 1000,
    value: token,
  }
  return token
}

async function getFollowUsers(token: string) {
  const result = await requestJson("/externalcontact/get_follow_user_list", {
    query: { access_token: token },
  })
  if (!Array.isArray(result.follow_user)) {
    throw new WecomApiError("服务人员列表响应中缺少 follow_user")
  }
  return result.follow_user.map(String)
}

async function getMemberNames(token: string, userIds: string[]) {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const member = await requestJson("/user/get", {
          query: { access_token: token, userid: userId },
        })
        return [userId, String(member.name || userId)] as const
      } catch {
        return [userId, userId] as const
      }
    })
  )
  return new Map(entries)
}

async function getCorpTags(token: string) {
  const result = await requestJson("/externalcontact/get_corp_tag_list", {
    body: { group_id: [], tag_id: [] },
    method: "POST",
    query: { access_token: token },
  })
  if (!Array.isArray(result.tag_group)) {
    throw new WecomApiError("企业标签库响应中缺少 tag_group")
  }

  const tags = new Map<string, { group: string; name: string }>()
  for (const rawGroup of result.tag_group) {
    const group = toRecord(rawGroup)
    if (!group || group.deleted || !Array.isArray(group.tag)) continue
    for (const rawTag of group.tag) {
      const tag = toRecord(rawTag)
      if (!tag || tag.deleted || !tag.id) continue
      tags.set(String(tag.id), {
        group: String(group.group_name || "未分组"),
        name: String(tag.name || ""),
      })
    }
  }
  return tags
}

async function getCustomerDetail(token: string, externalUserId: string) {
  const relationships: CustomerRelationship[] = []
  let customer: ApiRecord | null = null
  let cursor = ""

  do {
    let result: ApiRecord
    try {
      result = await requestJson("/externalcontact/get", {
        query: {
          access_token: token,
          ...(cursor ? { cursor } : {}),
          external_userid: externalUserId,
        },
      })
    } catch (error) {
      if (error instanceof WecomApiError && error.errcode === 84061) {
        return {
          externalUserId,
          invalid: true,
          relationships: [],
        }
      }
      throw error
    }
    customer ??= toRecord(result.external_contact)
    if (!customer) {
      throw new WecomApiError(
        `客户 ${externalUserId} 的详情缺少 external_contact`
      )
    }
    if (!Array.isArray(result.follow_user)) {
      throw new WecomApiError(`客户 ${externalUserId} 的详情缺少 follow_user`)
    }
    for (const rawFollowInfo of result.follow_user) {
      const followInfo = toRecord(rawFollowInfo)
      if (followInfo) relationships.push({ customer, followInfo })
    }
    cursor = String(result.next_cursor || "")
  } while (cursor)

  return { externalUserId, invalid: false, relationships }
}

function buildCustomer(
  customer: ApiRecord,
  followInfo: ApiRecord,
  memberNames: Map<string, string>,
  tagMap: Map<string, { group: string; name: string }>,
  syncedAt: string
): WecomCustomer {
  const externalUserId = String(customer.external_userid || "")
  const followUserId = String(followInfo.userid || "")
  const groupedTags = resolveGroupedTags(followInfo, tagMap)
  const customerType =
    Number(customer.type) === 1
      ? "微信用户"
      : Number(customer.type) === 2
        ? "企业微信用户"
        : "未知"
  const gender =
    Number(customer.gender) === 1
      ? "male"
      : Number(customer.gender) === 2
        ? "female"
        : "unknown"

  return {
    addTime: formatTimestamp(followInfo.createtime),
    addWay: addWayNames[Number(followInfo.add_way)] ?? "未定义来源",
    auntie: groupedTags.get("对接阿姨")?.join(", ") ?? "",
    avatar: String(customer.avatar || ""),
    corpName: String(
      customer.corp_full_name ||
        customer.corp_name ||
        followInfo.remark_corp_name ||
        ""
    ),
    description: String(followInfo.description || ""),
    externalUserId,
    followUser: memberNames.get(followUserId) ?? followUserId,
    followUserId,
    gender,
    nameAndType: `${String(customer.name || "")}@${customerType}`,
    position: String(customer.position || ""),
    region: groupedTags.get("地区")?.join(", ") ?? "",
    relationId: createRelationId(externalUserId, followUserId),
    remarkMobiles: joinValues(followInfo.remark_mobiles),
    studentType: groupedTags.get("学员区分")?.join(", ") ?? "",
    syncedAt,
  }
}

function resolveGroupedTags(
  relationship: ApiRecord,
  tagMap: Map<string, { group: string; name: string }>
) {
  const tagIds: string[] = []
  if (Array.isArray(relationship.tags)) {
    for (const rawTag of relationship.tags) {
      const tag = toRecord(rawTag)
      if (tag?.tag_id) tagIds.push(String(tag.tag_id))
    }
  }
  if (Array.isArray(relationship.tag_id)) {
    tagIds.push(...relationship.tag_id.map(String))
  }

  const grouped = new Map<string, string[]>()
  for (const tagId of new Set(tagIds)) {
    const tag = tagMap.get(tagId)
    if (!tag) continue
    grouped.set(tag.group, [...(grouped.get(tag.group) ?? []), tag.name])
  }
  return grouped
}

function formatTimestamp(value: unknown) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).formatToParts(new Date(timestamp * 1000))
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}

function joinValues(value: unknown) {
  return Array.isArray(value) ? value.map(String).join(", ") : ""
}

function toRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" ? (value as ApiRecord) : null
}

function createRelationId(externalUserId: string, followUserId: string) {
  return `${externalUserId}:${followUserId}`
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>
) {
  const results = new Array<TOutput>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  )
  return results
}

async function requestJson(
  pathname: string,
  options: {
    body?: ApiRecord
    method?: "GET" | "POST"
    query: Record<string, string>
  }
) {
  const url = new URL(`${API_BASE_URL}${pathname}`)
  for (const [key, value] of Object.entries(options.query)) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: options.body
        ? { "content-type": "application/json; charset=utf-8" }
        : undefined,
      method: options.method ?? "GET",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    throw new WecomApiError(
      `请求企业微信 API 失败: ${error instanceof Error ? error.message : "网络错误"}`
    )
  }

  const result = (await response.json().catch(() => null)) as ApiRecord | null
  if (!response.ok || !result) {
    throw new WecomApiError(`企业微信 API 返回 HTTP ${response.status}`)
  }
  if (Number(result.errcode) !== 0) {
    const errcode = Number(result.errcode)
    throw new WecomApiError(
      `企业微信 API 调用失败: errcode=${String(result.errcode)}, errmsg=${String(result.errmsg || "")}`,
      Number.isFinite(errcode) ? errcode : undefined
    )
  }
  return result
}
