export type WecomCustomer = {
  addTime: string
  addWay: string
  auntie: string
  avatar: string
  corpName: string
  description: string
  externalUserId: string
  followUser: string
  followUserId: string
  gender: "female" | "male" | "unknown"
  nameAndType: string
  position: string
  region: string
  relationId: string
  remarkMobiles: string
  remarkCorpName: string
  studentType: string
  syncedAt: string
}

export type WecomSyncSettings = {
  configured: boolean
  enabled: boolean
  hour: number
  lastCompletedAt: string
  lastCount: number
  lastError: string
  lastStartedAt: string
  lastStatus: "failed" | "idle" | "running" | "success"
  minute: number
  nextRunAt: string
  timezone: "Asia/Shanghai"
}

export type WecomCustomerPage = {
  customers: WecomCustomer[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  settings: WecomSyncSettings
  tagColors: Record<string, number>
}
