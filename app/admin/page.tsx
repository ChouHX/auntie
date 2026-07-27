"use client"

import dynamic from "next/dynamic"

const AdminPage = dynamic(
  () => import("@/site-pages/admin-page").then((module) => module.AdminPage),
  {
    ssr: false,
  }
)

export default AdminPage
