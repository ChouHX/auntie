import { permanentRedirect } from "next/navigation"

export default function ContactPageRedirect() {
  permanentRedirect("/about#contact")
}
