import type { Metadata } from "next"

import { SalesPortal } from "@/components/sales/sales-portal"

export const metadata: Metadata = {
  description: "销售数据与团队业绩面板",
  title: "销售工作台 | 陈阿姨到家",
}

export default function SalesPage() {
  return <SalesPortal />
}
