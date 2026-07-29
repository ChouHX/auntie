import { permanentRedirect } from "next/navigation"

export default function JoinPageRedirect() {
  permanentRedirect("/about#join")
}
