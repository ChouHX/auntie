import { useEffect } from "react"
import { Link } from "@/lib/router-compat"

import { PageHero } from "@/components/common/page-hero"
import { Section } from "@/components/common/section"
import { Card } from "@/components/ui/card"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n, type Language } from "@/lib/i18n"

type LegalPageType = "delivery" | "privacy" | "refund" | "terms"

type LegalSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

type LegalCopy = {
  kicker: string
  title: string
  description: string
  effectiveDate: string
  updatedNote: string
  sections: LegalSection[]
  contactTitle: string
  contactText: string
  contactLink: string
}

const legalContent: Record<Language, Record<LegalPageType, LegalCopy>> = {
  zh: {
    privacy: {
      kicker: "Privacy Policy",
      title: "隐私政策",
      description:
        "我们重视你的个人信息安全。本政策说明陈阿姨到家如何收集、使用、保存和保护你在预约清洁服务时提供的信息。",
      effectiveDate: "生效日期：2025 年 6 月 3 日",
      updatedNote:
        "本页面根据海外本地生活服务常见隐私政策整理，后续可按实际公司主体、电话和邮箱继续替换。",
      sections: [
        {
          title: "1. 我们收集的信息",
          paragraphs: [
            "当你浏览网站、填写预约表单、与客服沟通或使用我们的清洁服务时，我们可能会收集你主动提供或由系统自动产生的信息。",
          ],
          bullets: [
            "联系信息：姓名、邮箱、电话号码、微信或其他沟通方式。",
            "服务信息：服务地址、房型面积、期望上门时间、服务类型、重点清洁需求、宠物或宝宝注意事项。",
            "付款与账单信息：用于报价、开票、收款或退款沟通所需的信息；如接入第三方支付，支付信息由对应平台处理。",
            "网站使用信息：IP 地址、设备与浏览器类型、访问页面、停留时间、来源页面等基础分析数据。",
          ],
        },
        {
          title: "2. 我们如何使用信息",
          bullets: [
            "安排和履行清洁服务，包括确认城市、档期、人员、范围和报价。",
            "发送预约确认、上门提醒、服务变更、售后回访等必要通知。",
            "处理付款、账单、退款、争议沟通和客户支持。",
            "分析网站和服务使用情况，以优化页面体验、预约流程和客服响应。",
            "在取得同意的情况下，发送优惠活动、服务更新或营销信息。",
          ],
        },
        {
          title: "3. 信息共享",
          paragraphs: [
            "我们不会为了第三方营销目的出售或共享你的个人信息。为完成预约和服务，我们可能仅在必要范围内与服务人员、客服系统、支付处理方、网站托管或分析服务商共享相关信息。",
            "这些供应商仅可在协助我们提供服务、发送消息、处理付款或维护系统安全的范围内使用信息。",
          ],
        },
        {
          title: "4. 数据安全",
          paragraphs: [
            "我们会采取合理的技术和管理措施保护个人信息，防止未经授权的访问、修改、披露或删除。但互联网传输和电子存储无法保证 100% 安全，因此请避免在表单中提交与服务无关的敏感信息。",
          ],
        },
        {
          title: "5. 你的权利",
          bullets: [
            "访问：请求了解我们持有的与你相关的个人信息。",
            "更正：要求修正不准确或不完整的信息。",
            "删除：在适用法律允许的范围内请求删除个人信息。",
            "退出：随时撤回营销通信同意。",
          ],
        },
        {
          title: "6. 政策更新",
          paragraphs: [
            "我们可能会不定期更新本隐私政策。更新后的版本会发布在本页面，并标注新的生效日期。建议你定期查看，以了解我们如何保护你的信息。",
          ],
        },
      ],
      contactTitle: "7. 联系我们",
      contactText:
        "如果你对本隐私政策或数据处理方式有任何问题，可以通过联系我们页面提交需求或联系在线客服。",
      contactLink: "前往联系我们",
    },
    terms: {
      kicker: "Terms of Service",
      title: "服务条款",
      description:
        "使用陈阿姨到家网站、预约表单或清洁服务，即表示你同意以下服务条款。请在预约前仔细阅读。",
      effectiveDate: "生效日期：2025 年 6 月 3 日",
      updatedNote:
        "以下条款用于说明预约、报价、服务履行和责任边界，后续可按实际运营主体进一步调整。",
      sections: [
        {
          title: "1. 服务范围",
          paragraphs: [
            "陈阿姨到家提供日常清洁、深度清洁、开荒清洁、退租清洁、商业清洁和定期清洁等服务。具体服务范围、时间、人员安排和报价以预约前客服确认结果为准。",
          ],
        },
        {
          title: "2. 预约与报价",
          bullets: [
            "客户需提供准确的服务地址、房型面积、服务类型、重点需求和期望时间。",
            "报价通常基于城市、面积、房屋状态、服务类型、污渍程度和可预约档期。",
            "如现场情况与预约描述明显不符，服务时间、费用或范围可能需要重新确认。",
            "任何额外项目或延长服务时间，应在执行前与客户确认。",
          ],
        },
        {
          title: "3. 客户配合事项",
          bullets: [
            "请确保服务人员可按时进入物业，并提前说明门禁、停车、电梯、宠物、宝宝或特殊用品要求。",
            "请妥善保管贵重物品、现金、证件、珠宝、易碎品和私人敏感物品。",
            "如存在安全风险、严重卫生风险、违法物品或超出普通清洁范围的情况，我们有权拒绝或暂停服务。",
          ],
        },
        {
          title: "4. 付款、取消与改期",
          paragraphs: [
            "付款方式、定金、取消规则和改期规则会在预约时由客服说明。若客户临时取消、无法进入物业或现场条件无法服务，可能产生相应费用。具体以预约沟通记录为准。",
          ],
        },
        {
          title: "5. 验收与售后",
          paragraphs: [
            "服务完成后，客户应尽量及时检查重点区域并反馈问题。我们会根据实际情况协调补救、复查或其他合理处理方式。因房屋老化、顽固污渍、材质限制或不可逆损耗导致无法完全清洁的情况，不视为服务未完成。",
          ],
        },
        {
          title: "6. 责任限制",
          paragraphs: [
            "在法律允许的最大范围内，我们不对因客户提供信息不准确、物业无法进入、第三方平台故障、不可抗力、材料自然老化或非服务人员原因造成的间接损失承担责任。",
          ],
        },
        {
          title: "7. 条款更新",
          paragraphs: [
            "我们可能会不定期更新本服务条款。继续使用网站或预约服务，即表示你接受更新后的条款。",
          ],
        },
      ],
      contactTitle: "8. 联系我们",
      contactText:
        "如果你对服务条款或预约规则有疑问，可以通过联系我们页面提交咨询。",
      contactLink: "前往联系我们",
    },
    refund: {
      kicker: "Cancellation & Refund Policy",
      title: "取消与退款政策",
      description:
        "本政策说明陈阿姨到家预约订单的取消、改期、退款和售后处理规则。",
      effectiveDate: "生效日期：2026 年 6 月 27 日",
      updatedNote:
        "陈阿姨到家提供上门清洁服务，具体金额、定金和付款安排以客服或订单页面最终确认为准。",
      sections: [
        {
          title: "1. 定金规则",
          paragraphs: [
            "预约订单通常需要支付预估费用的 30% 作为定金，用于锁定服务档期和安排服务。剩余尾款根据订单约定，在服务前、服务中或服务完成后按客服确认方式支付。",
          ],
        },
        {
          title: "2. 取消与改期",
          bullets: [
            "服务开始前 48 小时以上取消或改期：可免费取消或调整时间。",
            "服务开始前 48 小时内取消：已支付定金原则上不予退还。",
            "服务人员已出发或已到达现场后取消：可能收取上门费用或最低服务费用。",
            "如因陈阿姨到家原因无法按约提供服务，我们会协助客户改期或处理相关退款。",
          ],
        },
        {
          title: "3. 服务完成后的退款和售后",
          paragraphs: [
            "清洁服务属于上门服务。服务完成后，通常不支持无理由退款。",
            "如客户对服务效果不满意，应在服务完成后 48 小时内联系客服，并提供相关照片、视频或问题说明。我们会根据实际情况核实，并提供说明服务范围、协调补做、售后跟进、部分补偿、优惠或特殊情况酌情退款等处理方式。",
            "超过 48 小时后反馈的问题，因较难判断是否与本次服务直接相关，原则上不适用免费补做或退款处理。",
          ],
        },
        {
          title: "4. 通常不支持退款的情况",
          bullets: [
            "客户要求完成明显超出预约时间或服务范围的工作。",
            "客户临时增加项目但不愿增加时间或费用。",
            "老旧污渍、霉斑、水垢、地毯深层污渍、墙面损伤等无法完全恢复。",
            "客户未提前说明特殊情况，导致服务效果与预期不一致。",
            "客户私下与服务人员交易。",
            "服务完成超过 48 小时后才提出问题，且无法核实原因。",
          ],
        },
      ],
      contactTitle: "5. 联系我们",
      contactText:
        "如有预约、付款、退款或售后问题，请通过联系我们页面或客服邮箱 {{contactEmail}} 联系我们。",
      contactLink: "前往联系我们",
    },
    delivery: {
      kicker: "Service Delivery Policy",
      title: "服务履约说明",
      description:
        "陈阿姨到家提供的是上门清洁服务，不涉及实体商品配送。本页面说明客户付款后我们如何安排服务。",
      effectiveDate: "生效日期：2026 年 6 月 27 日",
      updatedNote:
        "由于本服务为上门服务，本页面替代传统 Shipping Policy，用于说明服务履约流程和边界。",
      sections: [
        {
          title: "1. 服务流程",
          bullets: [
            "客户提交预约需求或联系客服。",
            "客服确认服务城市、房型、清洁需求和预计价格。",
            "客户确认预约时间并支付定金或订单费用。",
            "陈阿姨到家安排上门服务。",
            "服务按预约内容完成清洁。",
            "客户现场查看服务效果。",
            "如有问题，可在 48 小时内联系客服反馈。",
          ],
        },
        {
          title: "2. 服务时间",
          paragraphs: [
            "预约时间可能会受到交通、天气、停车、小区出入、前一单服务时长等因素影响。如上门时间发生明显变化，我们会尽量提前与客户沟通。",
          ],
        },
        {
          title: "3. 加时与附加服务",
          paragraphs: [
            "如现场工作量超过原预估，或客户临时增加服务项目，服务人员会先与客户确认是否加时或加项。客户确认后，才会继续服务。",
            "如当天后续已有其他预约，不一定可以无限加时。此时我们会优先在原定时间内处理客户最重要的区域，剩余部分可另行协调。",
          ],
        },
        {
          title: "4. 无法履约的情况",
          bullets: [
            "客户无法联系。",
            "地址错误或无法进入房屋。",
            "现场环境存在安全风险。",
            "客户临时增加大量超出预约范围的项目。",
            "房屋存在危险物品、严重污染或特殊清洁风险。",
            "客户临时取消服务。",
          ],
        },
      ],
      contactTitle: "5. 联系我们",
      contactText:
        "如有服务履约、付款或售后相关问题，请通过联系我们页面或客服邮箱 {{contactEmail}} 联系我们。",
      contactLink: "前往联系我们",
    },
  },
  en: {
    privacy: {
      kicker: "Privacy Policy",
      title: "Privacy Policy",
      description:
        "We value your privacy. This policy explains how Auntie Chen Home collects, uses, stores, and protects information you provide when booking cleaning services.",
      effectiveDate: "Effective Date: June 3, 2025",
      updatedNote:
        "This page is adapted from common local-service privacy disclosures and can be updated later with the final business entity, phone number, and email.",
      sections: [
        {
          title: "1. Information We Collect",
          paragraphs: [
            "When you browse our website, submit a booking form, communicate with support, or use our cleaning services, we may collect information you provide directly or information generated through website use.",
          ],
          bullets: [
            "Contact information: name, email address, phone number, WeCom/WeChat or other contact details.",
            "Service details: service address, home type and size, preferred time, service type, cleaning priorities, pets, babies, or special notes.",
            "Payment and billing information: information needed for estimates, invoices, payments, refunds, or billing support; third-party payment processors may handle payment data when used.",
            "Usage data: IP address, device and browser type, pages visited, time on site, referral pages, and similar analytics data.",
          ],
        },
        {
          title: "2. How We Use Your Information",
          bullets: [
            "To schedule and perform cleaning services, including confirming city, availability, staff, scope, and quote.",
            "To send booking confirmations, reminders, service updates, and after-service follow-ups.",
            "To process payments, billing, refunds, disputes, and customer support requests.",
            "To analyze website and service usage and improve the booking experience and support response.",
            "To send promotions or service updates with your consent.",
          ],
        },
        {
          title: "3. Information Sharing",
          paragraphs: [
            "We do not sell or share your personal information for third-party marketing. To provide services, we may share necessary information with cleaning staff, support tools, payment processors, hosting providers, or analytics vendors.",
            "These providers may use information only as needed to help us deliver services, send messages, process payments, or maintain system security.",
          ],
        },
        {
          title: "4. Data Security",
          paragraphs: [
            "We use reasonable technical and organizational safeguards to protect personal information from unauthorized access, alteration, disclosure, or deletion. However, no internet transmission or electronic storage method is 100% secure, so please avoid submitting sensitive information unrelated to the service.",
          ],
        },
        {
          title: "5. Your Rights",
          bullets: [
            "Access: Request a copy of personal information we hold about you.",
            "Correction: Request correction of inaccurate or incomplete information.",
            "Deletion: Request deletion of personal information where permitted by applicable law.",
            "Opt-out: Withdraw consent for marketing communications at any time.",
          ],
        },
        {
          title: "6. Changes to This Policy",
          paragraphs: [
            "We may update this Privacy Policy periodically. Updates will be posted on this page with a revised effective date. We encourage you to review this page regularly.",
          ],
        },
      ],
      contactTitle: "7. Contact Us",
      contactText:
        "If you have questions about this Privacy Policy or our data practices, please submit a request through the contact page or reach out to support.",
      contactLink: "Go to Contact",
    },
    terms: {
      kicker: "Terms of Service",
      title: "Terms of Service",
      description:
        "By using Auntie Chen Home’s website, booking form, or cleaning services, you agree to the following terms. Please read them before booking.",
      effectiveDate: "Effective Date: June 3, 2025",
      updatedNote:
        "These terms explain booking, estimates, service delivery, and responsibility boundaries and may be adjusted later for the final operating entity.",
      sections: [
        {
          title: "1. Service Scope",
          paragraphs: [
            "Auntie Chen Home provides regular cleaning, deep cleaning, post-renovation cleaning, move-out cleaning, commercial cleaning, and recurring cleaning. The final scope, timing, staff assignment, and quote are based on support confirmation before booking.",
          ],
        },
        {
          title: "2. Booking and Quotes",
          bullets: [
            "Clients should provide accurate service address, home type and size, service type, priorities, and preferred time.",
            "Quotes may depend on city, size, home condition, service type, soil level, and availability.",
            "If on-site conditions differ significantly from the booking details, time, price, or scope may need to be reconfirmed.",
            "Any extra items or extended service time should be confirmed with the client before work continues.",
          ],
        },
        {
          title: "3. Client Responsibilities",
          bullets: [
            "Please ensure service staff can access the property on time and provide access, parking, elevator, pet, baby, or supply notes in advance.",
            "Please secure valuables, cash, IDs, jewelry, fragile items, and private sensitive belongings before service.",
            "If there are safety risks, severe sanitation risks, illegal items, or tasks outside ordinary cleaning scope, we may refuse or pause service.",
          ],
        },
        {
          title: "4. Payment, Cancellation, and Rescheduling",
          paragraphs: [
            "Payment methods, deposits, cancellation rules, and rescheduling rules will be explained during booking. Last-minute cancellation, inability to access the property, or unserviceable site conditions may result in related fees. The booking communication record will apply.",
          ],
        },
        {
          title: "5. Acceptance Check and After-Service Support",
          paragraphs: [
            "After service is completed, clients should check priority areas and provide feedback promptly. We will coordinate reasonable remedies, rechecks, or other support depending on the situation. Aging materials, stubborn stains, material limitations, or irreversible wear may not be fully removable and do not necessarily mean service was not completed.",
          ],
        },
        {
          title: "6. Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by law, we are not responsible for indirect losses caused by inaccurate client information, inability to access the property, third-party platform failures, force majeure, natural material aging, or causes outside the service staff’s control.",
          ],
        },
        {
          title: "7. Changes to These Terms",
          paragraphs: [
            "We may update these Terms periodically. Continued use of the website or services means you accept the updated Terms.",
          ],
        },
      ],
      contactTitle: "8. Contact Us",
      contactText:
        "If you have questions about these Terms or booking rules, please submit an inquiry through the contact page.",
      contactLink: "Go to Contact",
    },
    refund: {
      kicker: "Cancellation & Refund Policy",
      title: "Cancellation & Refund Policy",
      description:
        "This policy explains cancellation, rescheduling, refund, and after-service handling for Auntie Chen Home booking orders.",
      effectiveDate: "Effective Date: June 27, 2026",
      updatedNote:
        "Auntie Chen Home provides on-site cleaning services. Final amount, deposit, and payment arrangement are based on support confirmation or the order page.",
      sections: [
        {
          title: "1. Deposit Rules",
          paragraphs: [
            "Booking orders usually require a deposit of 30% of the estimated fee to reserve the service time and arrange staff. The remaining balance is paid before, during, or after service according to the confirmed order arrangement.",
          ],
        },
        {
          title: "2. Cancellation and Rescheduling",
          bullets: [
            "More than 48 hours before service starts: cancellation or rescheduling can be handled without charge.",
            "Within 48 hours before service starts: paid deposits are generally non-refundable.",
            "After staff have departed or arrived on site: a travel fee or minimum service fee may apply.",
            "If Auntie Chen Home cannot provide the confirmed service for our own reasons, we will help reschedule or process the related refund.",
          ],
        },
        {
          title: "3. Refunds and After-service Support",
          paragraphs: [
            "Cleaning is an on-site service. After service is completed, no-reason refunds are generally not supported.",
            "If a client is dissatisfied with the service result, they should contact support within 48 hours after service completion and provide photos, videos, or a description of the issue. We will review the situation and may explain the service scope, coordinate rework, follow up after service, provide partial compensation, offer credit, or process a discretionary refund in special cases.",
            "Issues reported after 48 hours are harder to verify as related to the service and generally do not qualify for free rework or refund handling.",
          ],
        },
        {
          title: "4. Situations Usually Not Eligible for Refund",
          bullets: [
            "The client asks for work clearly beyond the reserved time or service scope.",
            "The client adds tasks but does not agree to extra time or fees.",
            "Old stains, mold, scale, deep carpet stains, wall damage, or similar conditions cannot be fully restored.",
            "The client did not disclose special conditions in advance, causing results to differ from expectations.",
            "The client transacts privately with service staff.",
            "The issue is reported more than 48 hours after service completion and cannot be verified.",
          ],
        },
      ],
      contactTitle: "5. Contact Us",
      contactText:
        "For booking, payment, refund, or after-service questions, contact us through the contact page or support email {{contactEmail}}.",
      contactLink: "Go to Contact",
    },
    delivery: {
      kicker: "Service Delivery Policy",
      title: "Service Delivery Policy",
      description:
        "Auntie Chen Home provides on-site cleaning services and does not ship physical goods. This page explains how service is arranged after payment.",
      effectiveDate: "Effective Date: June 27, 2026",
      updatedNote:
        "Because this is an on-site service, this page replaces a traditional Shipping Policy and explains service fulfillment.",
      sections: [
        {
          title: "1. Service Flow",
          bullets: [
            "The client submits a booking request or contacts support.",
            "Support confirms the service city, home type, cleaning needs, and estimated price.",
            "The client confirms the service time and pays the deposit or order amount.",
            "Auntie Chen Home arranges the on-site service.",
            "The cleaning is completed according to the confirmed booking scope.",
            "The client checks the service result on site.",
            "If there is an issue, the client may contact support within 48 hours.",
          ],
        },
        {
          title: "2. Service Time",
          paragraphs: [
            "Service time may be affected by traffic, weather, parking, building access, or the previous appointment taking longer than expected. If the arrival time changes significantly, we will try to communicate with the client in advance.",
          ],
        },
        {
          title: "3. Extra Time and Add-on Services",
          paragraphs: [
            "If the on-site workload exceeds the original estimate or the client adds tasks, staff will first confirm whether extra time or add-ons are accepted. Service continues only after the client confirms.",
            "If there are later appointments on the same day, unlimited extra time may not be available. In that case, we will prioritize the most important areas within the original time and coordinate remaining work separately if needed.",
          ],
        },
        {
          title: "4. Cases Where Service Cannot Be Fulfilled",
          bullets: [
            "The client cannot be reached.",
            "The address is wrong or the property cannot be accessed.",
            "The on-site environment presents a safety risk.",
            "The client adds a large amount of work outside the reserved scope.",
            "The property contains dangerous items, severe contamination, or special cleaning risks.",
            "The client cancels at the last minute.",
          ],
        },
      ],
      contactTitle: "5. Contact Us",
      contactText:
        "For service fulfillment, payment, or after-service questions, contact us through the contact page or support email {{contactEmail}}.",
      contactLink: "Go to Contact",
    },
  },
}

function PrivacyPolicyPage() {
  return <LegalDocumentPage type="privacy" />
}

function TermsPage() {
  return <LegalDocumentPage type="terms" />
}

function CancellationRefundPage() {
  return <LegalDocumentPage type="refund" />
}

function ServiceDeliveryPage() {
  return <LegalDocumentPage type="delivery" />
}

function LegalDocumentPage({ type }: { type: LegalPageType }) {
  const { dict, language } = useI18n()
  const { content: cmsContent } = useCmsContent(["contactPage"])
  const content = legalContent[language][type]
  const contactEmail =
    cmsContent.contactPage?.[language]?.contactEmail ||
    cmsContent.contactPage?.zh?.contactEmail ||
    "auntiechenhome@gmail.com"
  const contactText = content.contactText.replaceAll(
    "{{contactEmail}}",
    contactEmail
  )

  useEffect(() => {
    document.title = `${content.title}｜${dict.common.brandName}`
  }, [content.title, dict.common.brandName])

  return (
    <>
      <PageHero
        kicker={content.kicker}
        title={content.title}
        description={content.description}
      />
      <Section
        data-scroll-reveal="false"
        className="py-14 transition-colors duration-300 sm:py-16"
      >
        <Card className="mx-auto max-w-4xl rounded-2xl bg-card/82 p-6 shadow-xl shadow-blue-100/60 sm:p-8 lg:p-10 dark:bg-slate-900/82 dark:shadow-blue-950/24">
          <div className="border-b border-border pb-6 dark:border-white/10">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {content.effectiveDate}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {content.updatedNote}
            </p>
          </div>

          <div className="mt-8 space-y-8">
            {content.sections.map((section) => (
              <section key={section.title} className="scroll-mt-28">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-3 size-1.5 shrink-0 rounded-full bg-blue-700 dark:bg-blue-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-400/20 dark:bg-blue-500/10">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
              {content.contactTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {contactText}
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-flex text-sm font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-300"
            >
              {content.contactLink}
            </Link>
          </div>
        </Card>
      </Section>
    </>
  )
}

export {
  CancellationRefundPage,
  PrivacyPolicyPage,
  ServiceDeliveryPage,
  TermsPage,
}
