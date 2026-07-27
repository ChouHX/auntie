import type { Language } from "@/lib/i18n"

type FaqItem = {
  answer: string[]
  question: string
}

type FaqContent = {
  description: string
  intro: string[]
  introLabel: string
  items: FaqItem[]
  kicker: string
  navLabel: string
  title: string
}

const faqContent = {
  zh: {
    kicker: "FAQ",
    title: "常见问题",
    description:
      "了解陈阿姨到家的基础服务逻辑、通用服务标准和预约前需要确认的事项。",
    navLabel: "问题导航",
    introLabel: "使用说明",
    intro: [
      "由于陈阿姨到家目前服务多个城市，不同地区的阿姨配置、价格标准、服务时长、附加项目、付款方式和具体服务范围可能会有轻微差异。",
      "以下 QA 主要用于帮助客户了解我们的基础服务逻辑和通用服务标准。",
      "具体价格、服务人数、可做项目、超时费用和付款方式，请以您所在城市客服最终确认的信息为准。",
    ],
    items: [
      {
        question: "你们是按面积收费，还是按小时收费？",
        answer: [
          "我们的价格会根据房屋户型、服务类型、预计服务时间和所在城市综合预估。",
          "价格表里的时间是参考时间，不是绝对承诺。",
          "实际服务时长会根据现场卫生情况、物品多少、油污水垢程度和客户需求有所浮动。",
          "如现场情况比较复杂，或客户临时增加服务内容，可能会产生超时费用，具体以客服确认和当地价格标准为准。",
        ],
      },
      {
        question: "日常保洁和深度保洁有什么区别？",
        answer: [
          "日常保洁适合定期维护的家庭，主要处理日常灰尘、地面、台面、厨房表面、浴室表面等基础清洁。",
          "深度保洁适合较久没有彻底打扫、卫生死角较多、厨房油污或浴室水垢较明显的家庭。",
          "深度保洁会比日常保洁多做一些细节区域，例如踢脚线、门框、窗台、柜门外部、油烟机表面、微波炉内部、浴室水垢等。",
          "简单理解：",
          "日常保洁偏“维持干净”；",
          "深度保洁偏“重新清一遍”。",
        ],
      },
      {
        question: "我应该选择日常保洁还是深度保洁？",
        answer: [
          "如果家里一直有定期打扫，卫生情况比较稳定，可以选择日常保洁。",
          "如果家里两个月以上没有系统打扫，或者厨房、浴室、地面、死角位置明显比较脏，建议选择深度保洁。",
          "如果现场情况和预约类型差异比较大，阿姨可能会根据实际情况建议调整服务时间或服务方案。",
        ],
      },
      {
        question: "开荒和退租清洁适合什么情况？",
        answer: [
          "开荒清洁一般适合新房、装修后、长期空置后第一次入住前的清洁。",
          "退租清洁一般适合搬家退房前，希望把房屋恢复到较干净状态，方便交房或退押金。",
          "这两类服务通常比日常和深度更耗时，也更看现场情况。",
          "不同城市对开荒、退租的服务范围和报价方式可能不同，具体请以当地客服确认为准。",
        ],
      },
      {
        question: "价格表上的时间一定能做完吗？",
        answer: [
          "价格表上的时间是基于正常家庭卫生情况做出的参考预估，并不是保证所有家庭都一定在这个时间内完成。",
          "每个家庭的卫生情况、物品多少、油污水垢程度、客户要求都会不同。",
          "如果阿姨在正常工作、不拖拉的情况下仍然没有完成，超出的时间会按照当地超时标准计费。",
        ],
      },
      {
        question: "超时怎么收费？",
        answer: [
          "不同城市的超时费用可能不同。",
          "如服务时间超出预约参考时间，会按照您所在城市对应服务类型的超时标准计算。",
          "超时前，阿姨或客服会尽量提前和您沟通确认。",
        ],
      },
      {
        question: "你们一般安排几个阿姨上门？",
        answer: [
          "上门人数会根据所在城市、房屋面积、服务类型、阿姨档期和现场需求灵活安排。",
          "一般来说，日常保洁多为 1 位阿姨；深度保洁、开荒和退租服务，部分地区或大户型可能会安排 2 位阿姨上门。",
          "具体上门人数，请以客服最终确认为准。",
          "如果实际人数有调整，服务时长也会相应变化。",
        ],
      },
      {
        question: "阿姨上门前会提前确认吗？",
        answer: [
          "会的。",
          "上门前客服会确认服务时间、地址、服务类型、重点区域和注意事项。",
          "阿姨到达后，也会先和客户简单巡视房屋，确认本次服务重点，再开始打扫。",
        ],
      },
      {
        question: "阿姨会自己决定先打扫哪里吗？",
        answer: [
          "阿姨会根据现场情况和客户需求灵活安排。",
          "一般会先确认客户最在意的区域，比如厨房、浴室、地面、卧室等。",
          "如果客户当时要使用某个区域，阿姨也会调整顺序，尽量不影响客户正常生活。",
        ],
      },
      {
        question: "服务完成后可以验收吗？",
        answer: [
          "可以，而且我们建议客户现场验收。",
          "服务结束后，阿姨会带客户按照清洁清单检查主要区域。",
          "如果客户觉得有细节不到位，可以当场提出，阿姨会在合理范围内补做。",
          "我们也会通过回访了解客户对本次服务是否满意。",
        ],
      },
      {
        question: "如果我对服务不满意怎么办？",
        answer: [
          "如果您对服务有不满意的地方，可以及时告诉客服。",
          "我们会根据实际情况核对问题原因，例如是否属于服务范围内、是否现场时间不足、是否阿姨执行不到位，之后再安排对应处理方式。",
          "我们不能保证每一次服务都完全没有偏差，但我们会认真处理真实反馈，不会逃避问题。",
        ],
      },
      {
        question: "阿姨会不会随便动我的东西？",
        answer: [
          "不会。",
          "阿姨在整理桌面、卧室、装饰物、床铺等区域时，会尽量保持物品原位。",
          "如涉及贵重物品、易碎物品、文件、药品、风水摆件等，建议客户提前收好或提前说明。",
          "原则上，阿姨不会随意移动客户的重要私人物品。",
        ],
      },
      {
        question: "厨房一般会打扫哪些地方？",
        answer: [
          "厨房属于清洁重点区域。",
          "常规情况下，会清洁厨房台面、灶台表面、水槽、小家电表面、柜门表面、地面等。",
          "深度保洁会增加更多细节区域，例如油烟机表面、灶台缝隙、微波炉内部、柜门外部、踢脚线等。",
          "注意：油烟机内部风轮、柜体内部等不属于常规服务范围，如需处理需提前沟通。",
        ],
      },
      {
        question: "服务价格会不会中途加价？",
        answer: ["不会，采用线上先沟通价格、再施工的模式，中途不加价。"],
      },
      {
        question: "服务会不会遗漏死角区域？出现问题能否返工？",
        answer: ["不会遗漏死角区域，若服务有问题可现场返工。"],
      },
      {
        question: "阿姨会自带工具和清洁剂吗？",
        answer: [
          "一般情况下，阿姨会携带基础清洁工具和常用清洁剂。",
          "但不同城市、不同阿姨团队的工具配置可能会略有差异。",
          "如果客户家中有特殊材质，比如大理石、实木地板、特殊台面、高端家电等，建议提前说明。",
          "如客户希望使用自家指定清洁剂，也可以提前准备并告知阿姨。",
        ],
      },
      {
        question: "服务过程中可以临时增加项目吗？",
        answer: [
          "可以提出，但是否能做要看现场时间、工具和阿姨能力。",
          "如果临时增加项目导致服务时间延长，会按照超时或附加项目计费。",
          "建议有额外需求时提前告诉客服，方便提前安排。",
        ],
      },
      {
        question: "可以指定阿姨吗？",
        answer: [
          "如果您之前用过某位阿姨，并且希望继续由她上门，可以提前告诉客服。",
          "我们会优先协调熟悉阿姨，但具体还要看阿姨档期、距离和当天排班情况。",
          "不能保证每一次都一定安排同一位阿姨，但会尽量优先匹配。",
        ],
      },
      {
        question: "为什么不建议客户私下和阿姨约单？",
        answer: [
          "为了保障客户权益，请不要私下和阿姨单独约单。",
          "一旦绕过公司直接交易，如果出现服务质量、价格争议、损坏赔付或其他问题，公司无法为您提供售后保障。",
          "所有预约、改期、加项和付款，建议统一通过陈阿姨到家客服确认。",
        ],
      },
      {
        question: "付款一般怎么付？",
        answer: [
          "由于我们服务多个城市，不同地区支持的付款方式可能不同。",
          "客服会在预约前或服务完成后，按照您所在城市的实际情况告知具体付款方式。",
          "客户付款后，客服会进行记录和确认。",
        ],
      },
      {
        question: "次卡适合什么客户？",
        answer: [
          "次卡更适合有长期清洁需求的客户，比如固定每月清洁、家里有小孩宠物、双职工家庭、房屋面积较大，或希望长期安排熟悉阿姨的客户。",
          "次卡客户一般可以享受更省心的预约体验和相应权益。",
          "具体次卡价格、有效期、使用规则和赠送权益，以所在城市当期说明为准。",
        ],
      },
      {
        question: "你们怎么筛选阿姨？",
        answer: [
          "我们不会随便安排阿姨上门。",
          "合作阿姨一般会经过基础沟通、线上面试、试工筛选和服务流程培训。",
          "只有通过筛选和试工的阿姨，才会进入正式服务名单。",
          "后续我们也会根据客户反馈、好评率、迟到情况、投诉情况等，对阿姨进行持续管理。",
        ],
      },
      {
        question: "你们如何保证服务质量？",
        answer: [
          "家政服务不是标准化商品，不同家庭现场情况会有差异。",
          "但我们会通过以下方式尽量保证服务稳定：",
          "上门前确认需求；",
          "服务前带客户巡视重点区域；",
          "服务中保持沟通；",
          "服务结束后现场验收；",
          "客户服务后回访；",
          "阿姨服务记录和客户反馈归档。",
          "如果出现问题，我们会根据实际情况复盘和处理。",
        ],
      },
      {
        question: "你们的服务原则是什么？",
        answer: [
          "我们希望做长期品牌，不做一次性生意。",
          "所以我们更在意客户是否愿意复购，是否愿意推荐朋友，是否觉得这个服务值得信任。",
          "家政行业没有永远不出问题的服务，",
          "但一定要有出了问题后愿意负责、愿意跟进、愿意改进的品牌。",
          "这也是陈阿姨到家一直坚持的原则。",
        ],
      },
    ],
  },
  en: {
    kicker: "FAQ",
    title: "Frequently Asked Questions",
    description:
      "Understand Auntie Chen Home's basic service logic, general standards, and what to confirm before booking.",
    navLabel: "Question navigation",
    introLabel: "How to use this FAQ",
    intro: [
      "Auntie Chen Home currently serves multiple cities. Auntie availability, pricing standards, service duration, add-on items, payment methods, and exact scope may vary slightly by area.",
      "This FAQ helps clients understand our basic service logic and general service standards.",
      "For exact pricing, number of aunties, available items, overtime fees, and payment methods, please follow the final confirmation from support in your city.",
    ],
    items: [
      {
        question: "Do you charge by home size or by hour?",
        answer: [
          "Pricing is estimated based on home layout, service type, expected service time, and city. The time shown in a price table is a reference, not an absolute promise.",
          "Actual service time may vary depending on the home's condition, amount of belongings, grease or scale level, and client requests.",
          "If the on-site situation is more complex, or if extra items are added during service, overtime fees may apply based on support confirmation and local pricing standards.",
        ],
      },
      {
        question: "What is the difference between regular and deep cleaning?",
        answer: [
          "Regular cleaning is for homes that are maintained on a routine basis. It focuses on everyday dust, floors, counters, kitchen surfaces, bathroom surfaces, and basic cleaning.",
          "Deep cleaning is better for homes that have not been thoroughly cleaned for a while, have more hidden corners, heavier kitchen grease, or more visible bathroom scale.",
          "Deep cleaning includes more detailed areas such as baseboards, door frames, window sills, cabinet exteriors, range hood surfaces, microwave interiors, and bathroom scale.",
          "Simply put: regular cleaning maintains cleanliness; deep cleaning is closer to resetting the home.",
        ],
      },
      {
        question: "Should I choose regular cleaning or deep cleaning?",
        answer: [
          "If your home is cleaned regularly and the condition is stable, regular cleaning is usually enough.",
          "If your home has not had a systematic cleaning for more than two months, or if the kitchen, bathroom, floors, or hidden corners are clearly dirty, deep cleaning is recommended.",
          "If the on-site condition differs significantly from the booked service type, the auntie may suggest adjusting the service time or plan.",
        ],
      },
      {
        question: "When should I choose post-renovation or move-out cleaning?",
        answer: [
          "Post-renovation cleaning is usually for new homes, after renovation, or before first move-in after long vacancy.",
          "Move-out cleaning is for handing over a rental or preparing a home for inspection, with the goal of restoring it to a cleaner state.",
          "These services usually take longer than regular or deep cleaning and depend heavily on the site. Scope and pricing may vary by city, so local support confirmation is required.",
        ],
      },
      {
        question: "Is the listed service time guaranteed to be enough?",
        answer: [
          "The listed time is a reference estimate based on a normal home condition. It does not guarantee that every home can be completed within that time.",
          "Every home differs in cleanliness, amount of belongings, grease or scale level, and client requirements.",
          "If the auntie is working normally and efficiently but still needs more time, the additional time is billed according to local overtime standards.",
        ],
      },
      {
        question: "How are overtime fees charged?",
        answer: [
          "Overtime fees may vary by city.",
          "If the service exceeds the reference booking time, the overtime standard for your city and service type will apply.",
          "Before overtime begins, the auntie or support team will try to communicate with you in advance for confirmation.",
        ],
      },
      {
        question: "How many aunties usually come to the home?",
        answer: [
          "The number of aunties depends on city, home size, service type, auntie schedule, and on-site needs.",
          "Regular cleaning is usually handled by one auntie. Deep cleaning, post-renovation cleaning, and move-out cleaning may involve two aunties in some areas or for larger homes.",
          "Please follow the final support confirmation. If the number of aunties changes, the service duration may also change accordingly.",
        ],
      },
      {
        question: "Will the visit be confirmed before the auntie arrives?",
        answer: [
          "Yes. Before the visit, support confirms service time, address, service type, priority areas, and notes.",
          "After arrival, the auntie will also briefly walk through the home with the client, confirm priorities, and then begin cleaning.",
        ],
      },
      {
        question: "Does the auntie decide where to clean first?",
        answer: [
          "The auntie will adjust based on the actual home condition and client needs.",
          "Usually, she first confirms the areas the client cares about most, such as the kitchen, bathroom, floors, or bedrooms.",
          "If the client needs to use a certain area during service, the auntie can adjust the order to reduce disruption.",
        ],
      },
      {
        question: "Can I inspect the work after service?",
        answer: [
          "Yes, and we recommend an on-site inspection.",
          "After service, the auntie will walk through the main areas with the client based on the cleaning checklist.",
          "If any detail is not satisfactory, the client can raise it on site and the auntie will redo it within a reasonable scope. We also follow up after service for feedback.",
        ],
      },
      {
        question: "What if I am not satisfied with the service?",
        answer: [
          "If you are not satisfied, please tell support promptly.",
          "We will review the situation, including whether the issue was within scope, whether time was insufficient, and whether execution was not up to standard, then arrange an appropriate response.",
          "We cannot guarantee every service will have zero deviation, but we take real feedback seriously and do not avoid problems.",
        ],
      },
      {
        question: "Will the auntie move my belongings without permission?",
        answer: [
          "No. When organizing desks, bedrooms, decor, beds, and similar areas, the auntie will try to keep items in their original positions.",
          "For valuables, fragile items, documents, medicine, religious or feng shui items, please put them away or point them out in advance.",
          "As a principle, aunties do not casually move important private belongings.",
        ],
      },
      {
        question: "What does kitchen cleaning usually include?",
        answer: [
          "The kitchen is a priority area. Normally, cleaning includes countertops, stove surfaces, sink, small appliance surfaces, cabinet door surfaces, and floors.",
          "Deep cleaning adds more detailed areas such as range hood surfaces, stove gaps, microwave interiors, cabinet exteriors, and baseboards.",
          "Note: internal range hood fan wheels and cabinet interiors are not part of regular scope. Please communicate in advance if needed.",
        ],
      },
      {
        question: "Will the service price increase halfway through?",
        answer: [
          "No. We confirm the price online before service begins, then arrange the visit. The price will not be increased halfway through the service.",
        ],
      },
      {
        question: "Will hidden corners be missed? Can issues be redone?",
        answer: [
          "Hidden corners are part of the service focus. If there is a service issue, the auntie can redo it on site within a reasonable scope.",
        ],
      },
      {
        question: "Will the auntie bring tools and cleaning products?",
        answer: [
          "In general, aunties bring basic cleaning tools and common cleaning products. Tool setup may vary slightly by city and auntie team.",
          "If your home has special materials such as marble, solid wood floors, special countertops, or high-end appliances, please mention this in advance.",
          "If you prefer to use your own specific cleaning products, you can prepare them and tell the auntie in advance.",
        ],
      },
      {
        question: "Can I add items during the service?",
        answer: [
          "You can ask, but whether it can be done depends on on-site time, tools, and the auntie's capability.",
          "If extra items extend the service time, overtime or add-on fees may apply.",
          "For extra needs, we recommend telling support in advance so the visit can be planned properly.",
        ],
      },
      {
        question: "Can I request a specific auntie?",
        answer: [
          "If you have used a specific auntie before and would like her again, please tell support in advance.",
          "We will prioritize familiar aunties where possible, but the final arrangement depends on schedule, distance, and daily dispatching.",
          "We cannot guarantee the same auntie every time, but we will try to prioritize the match.",
        ],
      },
      {
        question: "Why should clients avoid booking privately with aunties?",
        answer: [
          "To protect client rights, please do not make private bookings directly with aunties.",
          "If the transaction bypasses the company, we cannot provide after-service support for service quality, price disputes, damage claims, or other issues.",
          "All bookings, rescheduling, add-ons, and payment should be confirmed through Auntie Chen Home support.",
        ],
      },
      {
        question: "How do I usually pay?",
        answer: [
          "Because we serve multiple cities, supported payment methods may vary by area.",
          "Support will explain the available payment method for your city before booking or after service.",
          "After payment, support records and confirms it.",
        ],
      },
      {
        question: "Who is a package card suitable for?",
        answer: [
          "Package cards are better for clients with long-term cleaning needs, such as monthly cleaning, families with children or pets, dual-income households, larger homes, or clients who prefer familiar aunties over time.",
          "Package clients usually receive a more convenient booking experience and related benefits.",
          "Specific package pricing, validity, rules, and benefits depend on the current terms in your city.",
        ],
      },
      {
        question: "How do you screen aunties?",
        answer: [
          "We do not send aunties casually. Partner aunties generally go through basic communication, online interview, trial work screening, and service process training.",
          "Only aunties who pass screening and trial work enter the formal service list.",
          "Afterward, we continue managing aunties based on client feedback, positive review rate, lateness, complaints, and other records.",
        ],
      },
      {
        question: "How do you maintain service quality?",
        answer: [
          "Home service is not a standardized product, and every home's situation can differ.",
          "We work to maintain stability through pre-visit need confirmation, an on-site walk-through before service, communication during service, final inspection, post-service follow-up, and archived auntie service records and client feedback.",
          "If issues occur, we review and handle them based on the actual situation.",
        ],
      },
      {
        question: "What is your service principle?",
        answer: [
          "We want to build a long-term brand, not a one-time cleaning business.",
          "That is why we care about whether clients repurchase, recommend us to friends, and feel the service is trustworthy.",
          "No home-service brand can promise that problems will never happen, but a responsible brand must be willing to follow up, take responsibility, and improve when issues arise. This is what Auntie Chen Home continues to stand for.",
        ],
      },
    ],
  },
} satisfies Record<Language, FaqContent>

export { faqContent }
