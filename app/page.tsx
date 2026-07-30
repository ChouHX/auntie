import { SharedOrderEntry } from "@/components/marketing/shared-order-entry"
import { HomePage } from "@/site-pages/home-page"

type HomeRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomeRoute({ searchParams }: HomeRouteProps) {
  const params = await searchParams
  const orderId =
    getFirstQueryValue(params.order)?.trim() ||
    getFirstQueryValue(params.paymentOrder)?.trim() ||
    ""

  return orderId ? <SharedOrderEntry orderId={orderId} /> : <HomePage />
}

function getFirstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
