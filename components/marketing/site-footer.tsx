import type { MouseEvent, ReactNode } from "react"
import {
  EnvelopeSimple,
  FacebookLogo,
  GoogleLogo,
  InstagramLogo,
  PhoneCall,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react"
import { Link, useLocation } from "@/lib/router-compat"

import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"
import { getSiteLogo } from "@/lib/site-settings"
import { cn } from "@/lib/utils"

type FooterColumn = {
  links: Array<{
    label: string
    to: string
  }>
  title: string
}

type SocialItem = {
  href?: string
  icon: ReactNode
  label: string
}

type FooterContactBlockProps = {
  className?: string
  contactDescription: string
  contactEmail: string
  contactPhone: string
  contactQrImage: string
  title: string
}

const socialLinks = {
  shipinhao: "https://weixin.qq.com/sph/AHl2tRPA0Q",
  wecom: "https://work.weixin.qq.com/ca/cawcdec55f12d9b1c8",
  xiaohongshu:
    "https://www.xiaohongshu.com/user/profile/67fb386a000000000e010a07?xsec_token=YBxP9RhaxvjtcCcNMLz_mUn91ATbZWHF_nnJGI4RHnkfI=&xsec_source=app_share&xhsshare=CopyLink&shareRedId=ODdIOTo9Njo2NzUyOTgwNjczOTc7NT86&apptime=1781775057&share_id=bd2ef5228cf947a8acb242b8b090c32f&wechatWid=adf54e4a212d7ca3dce71d8dc6b1d0d5&wechatOrigin=menu",
} as const

const policyLinks = {
  zh: [
    { label: "隐私政策", to: "/privacy" },
    { label: "服务条款", to: "/terms" },
    { label: "取消与退款政策", to: "/cancellation-refund" },
    { label: "服务履约说明", to: "/service-delivery" },
    { label: "联系我们", to: "/about#contact" },
  ],
  en: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Cancellation & Refund", to: "/cancellation-refund" },
    { label: "Service Delivery", to: "/service-delivery" },
    { label: "Contact Us", to: "/about#contact" },
  ],
} as const

function SiteFooter() {
  const { dict, language } = useI18n()
  const { content } = useCmsContent(["contactPage"])
  const location = useLocation()
  const contactSettings =
    content.contactPage?.[language] ?? content.contactPage?.zh
  const contactEmail =
    contactSettings?.contactEmail || "auntiechenhome@gmail.com"
  const contactPhone = contactSettings?.contactPhone || "+1 9492798310"
  const contactQrImage = contactSettings?.qrImage || "/wechat_qrcode.jpg"
  const logoImage = getSiteLogo(content)

  function handleHashLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    to: string
  ) {
    if (!to.startsWith("/#") || location.pathname !== "/") {
      return
    }

    const targetId = to.slice(2)
    const target = document.getElementById(targetId)

    if (!target) {
      return
    }

    event.preventDefault()
    window.history.replaceState(
      window.history.state,
      "",
      `#${targetId}`
    )
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    })
  }

  const footerColumns: FooterColumn[] = [
    {
      title: dict.footer.menuTitle,
      links: [
        { label: dict.nav.home, to: "/" },
        { label: dict.nav.gallery, to: "/gallery" },
        { label: dict.nav.faq, to: "/faq" },
        { label: dict.nav.afterSales, to: "/after-sales" },
        { label: dict.nav.join, to: "/about#join" },
        { label: dict.nav.about, to: "/about" },
      ],
    },
    {
      title: dict.footer.whoTitle,
      links: [
        { label: dict.nav.about, to: "/about" },
        { label: dict.why.title, to: "/#why" },
        { label: dict.footer.teamLink, to: "/#team" },
        { label: dict.footer.goldAuntiesLink, to: "/#gold-aunties" },
      ],
    },
    {
      title: dict.footer.helpTitle,
      links: [
        ...dict.servicesSection.items.map((service) => ({
          label: service.title,
          to: "/#services",
        })),
      ],
    },
  ]
  const socialItems: SocialItem[] = [
    { icon: <XLogo size={18} weight="bold" />, label: "X" },
    { icon: <FacebookLogo size={18} weight="fill" />, label: "Facebook" },
    { icon: <InstagramLogo size={18} weight="bold" />, label: "Instagram" },
    { icon: <YoutubeLogo size={19} weight="fill" />, label: "YouTube" },
    { icon: <GoogleLogo size={18} weight="bold" />, label: "Google" },
    {
      href: socialLinks.xiaohongshu,
      icon: <SocialAssetIcon src="/xiaohongshu.svg" />,
      label: dict.common.socialXiaohongshu,
    },
    {
      href: socialLinks.wecom,
      icon: <SocialAssetIcon src="/wechat.svg" />,
      label: dict.common.socialWeCom,
    },
    {
      href: socialLinks.shipinhao,
      icon: <SocialAssetIcon src="/shipinhao.svg" />,
      label: dict.footer.socialShipinhao,
    },
  ]

  return (
    <footer className="relative overflow-hidden border-t border-blue-100/80 text-slate-700 transition-colors duration-300 dark:border-white/10 dark:text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="hidden gap-9 pb-10 lg:grid lg:grid-cols-[1.25fr_0.75fr_0.95fr_1.2fr] lg:gap-12">
          <FooterContactBlock
            contactDescription={dict.footer.contactDescription}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            contactQrImage={contactQrImage}
            title={dict.nav.contact}
          />

          {footerColumns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="min-w-0"
            >
              <FooterHeading>{column.title}</FooterHeading>
              <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-4 gap-y-3 text-sm font-medium sm:block sm:space-y-3">
                {column.links.map((link) => (
                  <li className="min-w-0" key={`${column.title}-${link.label}`}>
                    <Link
                      className="block min-w-0 break-words text-slate-600 transition duration-200 hover:text-blue-700 sm:inline dark:text-slate-300 dark:hover:text-blue-200"
                      onClick={(event) => handleHashLinkClick(event, link.to)}
                      to={link.to}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            aria-label={dict.common.brandName}
            className="group flex w-fit items-center gap-3"
            to="/"
          >
            <img
              src={logoImage}
              alt={`${dict.common.brandName} Logo`}
              className="size-12 rounded-md bg-white object-cover shadow-sm ring-1 ring-blue-100 sm:size-14 dark:bg-white/10 dark:ring-white/10"
            />
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-[-0.03em] text-slate-900 sm:text-xl dark:text-white">
                {dict.common.brandName}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {dict.common.brandSub}
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {socialItems.map((item) => (
              <SocialDisplay key={item.label} item={item} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-blue-200/80 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:text-slate-400">
          <div>
            © 2026 {dict.common.brandName} | {dict.footer.rights}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {policyLinks[language].map((link) => (
              <Link
                key={link.to}
                className="hover:text-blue-700 dark:hover:text-blue-200"
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
      {children}
    </h2>
  )
}

function FooterContactBlock({
  className,
  contactDescription,
  contactEmail,
  contactPhone,
  contactQrImage,
  title,
}: FooterContactBlockProps) {
  const contactPhoneHref = contactPhone.replace(/[^\d+]/g, "")

  return (
    <section className={cn("min-w-0", className)}>
      <FooterHeading>{title}</FooterHeading>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        <p>{contactDescription}</p>
        <div className="flex items-start gap-4">
          <img
            alt="微信二维码"
            className="size-24 shrink-0 rounded-xl bg-white object-cover p-1.5 shadow-sm ring-1 ring-blue-100 dark:ring-white/10"
            loading="lazy"
            src={contactQrImage}
          />
          <div className="grid min-w-0 gap-2 pt-1">
            <a
              className="flex w-fit items-center gap-2 font-semibold text-slate-700 transition hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-200"
              href={`tel:${contactPhoneHref}`}
            >
              <PhoneCall className="shrink-0" size={17} weight="fill" />
              {contactPhone}
            </a>
            <a
              className="flex w-fit min-w-0 items-center gap-2 font-semibold text-slate-700 transition hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-200"
              href={`mailto:${contactEmail}`}
            >
              <EnvelopeSimple className="shrink-0" size={17} weight="bold" />
              <span className="truncate">{contactEmail}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialAssetIcon({ src }: { src: string }) {
  return <img alt="" className="size-5 rounded-[4px]" src={src} />
}

function SocialDisplay({ item }: { item: SocialItem }) {
  const className =
    "inline-flex size-9 items-center justify-center rounded-full bg-white/72 text-slate-600 shadow-sm ring-1 ring-blue-100 transition duration-200 hover:bg-white hover:text-blue-700 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/15 dark:hover:text-blue-200"

  if (item.href) {
    return (
      <a
        aria-label={item.label}
        className={className}
        href={item.href}
        rel="noreferrer"
        target="_blank"
        title={item.label}
      >
        {item.icon}
      </a>
    )
  }

  return (
    <span
      aria-label={item.label}
      className={className}
      role="img"
      title={item.label}
    >
      {item.icon}
    </span>
  )
}

export { FooterContactBlock, SiteFooter }
