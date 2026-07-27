import * as React from "react"

type Language = "en" | "zh"

type I18nProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type I18nContextValue = {
  cityName: (name: string) => string
  dict: Dictionary
  formatLocation: (city?: string, country?: string) => string
  language: Language
  regionName: (name: string) => string
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LANGUAGES: Language[] = ["zh", "en"]

const dictionaries = {
  zh: {
    common: {
      brandName: "陈阿姨到家",
      brandSub: "让家重新像个家",
      siteTitle: "陈阿姨到家｜品质有保障、售后无忧的华人清洁品牌",
      siteDescription:
        "预约前先看官网了解我们的服务，有彩蛋哟，从阿姨安排、价格说明、服务验收到售后跟进，我们把大家最担心的问题都写清楚了",
      bookNow: "立即预约",
      languageLabel: "English",
      socialXiaohongshu: "小红书",
      socialWeCom: "企业微信",
      themeDark: "深色模式",
      themeLight: "浅色模式",
      menuOpen: "打开导航菜单",
      menuClose: "关闭导航菜单",
    },
    nav: {
      home: "首页",
      about: "关于我们",
      why: "为什么选择我们",
      services: "服务项目",
      process: "预约流程",
      areas: "覆盖地区",
      gallery: "画廊",
      blog: "博客",
      faq: "常见问题",
      afterSales: "售后中心",
      join: "加入我们",
      contact: "联系我们",
    },
    footer: {
      menuTitle: "菜单",
      whoTitle: "我们是谁",
      helpTitle: "我们如何提供帮助",
      contactDescription: "优先扫码添加微信联系，电话、邮件回复常会延迟。",
      rights: "保留所有权利",
      socialShipinhao: "视频号",
      teamLink: "创始人团队",
      goldAuntiesLink: "本月上榜金牌阿姨",
    },
    problemsSection: {
      kicker: "Why we exist",
      title: "我们想解决什么问题",
      description:
        "海外华人找清洁阿姨，不应该继续只靠熟人推荐和运气。我们把预约、派单、服务、验收和售后串成一套更清楚的流程。",
    },
    founderTeam: {
      kicker: "Team",
      title: "创始人团队",
      description:
        "我们希望把海外华人家政清洁，从一次性撮合，做成长期稳定、透明、有人负责的服务品牌。",
      members: [
        {
          name: "Will",
          role: "创始人",
          title: "运营与客户体验负责人",
          text: "负责运营流程、客户服务和服务标准建设。关注客户从咨询、预约、上门到售后的完整体验，让每一次服务更清楚、更可追溯。",
        },
        {
          name: "Isaac",
          role: "创始人",
          title: "品牌与增长负责人",
          text: "负责品牌定位、市场增长和业务系统搭建。希望把海外华人家政清洁，从“靠熟人推荐和运气”，变成更稳定、更透明、更省心的服务体验。",
        },
        {
          name: "Fan",
          role: "联合创始人",
          title: "阿姨体系负责人",
          text: "负责阿姨体系管理和一线服务标准建设。凭借长期清洁服务经验，帮助团队优化阿姨筛选、培训、派单和实际打扫流程，让服务质量更稳定。",
        },
      ],
    },
    goldAunties: {
      kicker: "Gold Aunties",
      title: "本月上榜金牌阿姨",
      description:
        "把阿姨筛选好、流程培训好、服务跟进好，是我们让服务更稳定的基础。",
      imageAlt: "本月金牌阿姨",
    },
    blogPreview: {
      kicker: "Blog",
      title: "清洁服务笔记",
      description:
        "把常见清洁问题、服务选择和上门前确认事项整理成更容易阅读的短文。",
      viewAll: "查看全部",
      readMore: "阅读更多",
    },
    hero: {
      badge: "欢迎来到",
      titleLineOne: "欢迎来到",
      titleLineTwo: "海外华人排名第一的家政清洁公司",
      typingWords: ["无隐藏费用", "免费返工", "阿姨不摸鱼", "不糊弄表面"],
      description:
        "找清洁阿姨，不该再靠熟人推荐和运气。\n陈阿姨到家用更清楚的报价、更稳定的阿姨安排和更负责的售后跟进，\n让海外华人家庭清洁变得更省心",
      primaryCta: "立即预约清洁服务",
      secondaryCta: "查看服务项目",
      cardTitle: "预约前先确认范围与报价",
      cardText: "房型、面积、重点区域和可预约档期一次讲清楚。",
      trustPoints: ["先确认范围与报价", "阿姨筛选与带教", "服务后客服回访"],
      stats: [
        { to: 7, suffix: " 年", label: "团队从业经验" },
        { to: 100000, suffix: "+", label: "累计服务华人家庭" },
        { to: 98, suffix: "%", label: "客户好评率" },
        { to: 100, suffix: "+", label: "团队阿姨" },
      ],
    },
    homeExperience: {
      kicker: "Service promise",
      title: "把清洁服务做得更清楚、更稳定",
      description:
        "预约前讲清范围和报价，上门前确认重点区域，服务后有人回访。你不需要自己反复协调，也不用担心问题没人处理。",
      sceneLabel: "重点",
      scopeMetric: "范围",
      standardMetric: "标准",
      supportMetric: "售后",
      dialogDescription: "以下是完整细节，方便你在预约前核对。",
      scenes: [
        {
          eyebrow: "01 / 预约前",
          title: "先确认范围，再安排上门",
          text: "房型、面积、重点区域、可能加项和参考报价先讲清楚，减少服务后才临时补充规则。",
          cta: "查看完整对比",
          dialogTitle: "陈阿姨到家和常见选择的对比",
        },
        {
          eyebrow: "02 / 上门中",
          title: "阿姨有标准，不靠临场发挥",
          text: "阿姨筛选、服务态度、宝宝宠物友好和细节检查都有明确要求，让每一次上门更稳定。",
          cta: "查看服务标准",
          dialogTitle: "我们如何降低服务不确定性",
        },
        {
          eyebrow: "03 / 服务后",
          title: "问题有人跟进，不让你自己兜底",
          text: "服务完成后按重点区域验收，客服继续跟进反馈。有遗漏或沟通偏差，会有人协调处理。",
          cta: "查看预约流程",
          dialogTitle: "从咨询到售后的完整流程",
        },
      ],
    },
    why: {
      kicker: "Why choose us",
      title: "为什么选择我们",
      description:
        "从响应速度、人员筛选到服务细节，我们用更明确的标准减少家政服务的不确定性。",
      items: [
        {
          title: "最快当天 / 次日上门",
          text: "依托稳定的阿姨体系，尽量为您安排当天或次日服务，临时需要清洁也能更快响应。",
        },
        {
          title: "严格筛选与培训",
          text: "阿姨上岗前需经过面试、试工和培训，清洁能力和服务态度不合格，不安排上门。",
        },
        {
          title: "超长时间客服在线",
          text: "从预约、上门到服务结束，全程都有专人跟进，遇到问题可以及时沟通处理。",
        },
        {
          title: "宝宝和宠物友好",
          text: "我们优先使用对宝宝和宠物更友好的清洁用品，也可根据客户需求灵活调整。",
        },
        {
          title: "服务态度有要求",
          text: "我们不接受甩脸色、态度差、沟通不耐烦的服务人员。进客户家，态度和质量一样重要。",
        },
        {
          title: "更灵活的定制服务",
          text: "服务范围外的小需求，只要现场阿姨力所能及、顺手可做，我们都会尽量帮您处理。",
        },
      ],
    },
    brandComparison: {
      title: "这就是我们成为海外华人家政第一品牌公司的原因",
      featureColumn: "对比项目",
      brandColumn: "陈阿姨到家",
      competitorColumns: ["本地零散阿姨", "小个体清洁团队", "国外家政平台"],
      rows: [
        {
          feature: "售后有保障",
          values: ["good", "warn", "bad", "bad"],
        },
        {
          feature: "阿姨服务态度好",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "阿姨从业经验丰富",
          values: ["good", "warn", "good", "bad"],
        },
        {
          feature: "细节打扫干净",
          values: ["good", "warn", "warn", "warn"],
        },
        {
          feature: "价格完全透明",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "有问题免费返工",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "售后有人专门跟进",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "客户重点区域记录",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "阿姨打扫不摸鱼",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "熟悉阿姨优先安排",
          values: ["good", "good", "good", "good"],
        },
        {
          feature: "服务后回访评价",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "老客户优惠",
          values: ["good", "good", "good", "good"],
        },
      ],
    },
    aboutFit: {
      title: "陈阿姨到家不适合哪些人？",
      paragraphs: [
        {
          parts: [
            { text: "我们" },
            { text: "不是市场上价格最低", bold: true },
            {
              text: "的清洁服务。如果您只想找一个最便宜的阿姨，简单打扫一下就可以；不太在意阿姨是否准时、服务过程中是否认真、细节有没有做到位、出了问题有没有人负责，那陈阿姨到家可能不是最适合您的选择。",
            },
          ],
        },
        {
          parts: [{ text: "但如果您更在意：" }],
        },
        {
          parts: [
            { text: "阿姨能不能" },
            { text: "准时上门", bold: true },
            { text: "；上门后是不是" },
            { text: "认真干活", bold: true },
            {
              text: "，而不是边做边摸鱼浪费时间；厨房、浴室、地面、死角这些重点区域有没有",
            },
            { text: "真正处理", bold: true },
            {
              text: "；服务前价格和范围能不能尽量说清楚；万一服务中有问题，后面有没有人",
            },
            { text: "跟进处理", bold: true },
            { text: "。" },
          ],
        },
        {
          emphasis: true,
          parts: [{ text: "那您来对地方了。" }],
        },
        {
          parts: [
            { text: "我们做的不是“随便找一个阿姨上门”，而是尽量把" },
            { text: "阿姨筛选好", bold: true },
            { text: "、" },
            { text: "服务标准讲清楚", bold: true },
            { text: "、" },
            { text: "上门流程管理好", bold: true },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "家政服务很难保证每一次都完全一样，但我们会尽量" },
            { text: "减少客户踩坑的概率", bold: true },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "如果您在意的是" },
            { text: "省心、稳定、认真和有人负责", bold: true },
            { text: "，陈阿姨到家会更适合您。" },
          ],
        },
      ],
      button: "预约家庭清洁服务",
    },
    auntieStandards: {
      kicker: "Auntie standards",
      title: "我们对阿姨上岗有多严格？",
      lead: "好的家政服务不是临时派人上门，而是从阿姨进入团队的第一步开始，就要经过筛选、试工、培训和持续管理。",
      description:
        "为了尽量保证每一次上门服务的稳定性，陈阿姨到家会对阿姨进行完整的筛选与培训流程。",
      centerTitle: "只筛选市面上排名前 10% 的阿姨",
      centerText: "只有通过基础筛选和试工确认的阿姨，才会正式安排服务客户。",
      videoTitle: "阿姨的自述",
      processLabel: "陈阿姨到家阿姨筛选流程",
      processText:
        "我们不会随便安排阿姨上门。每一位阿姨正式接单前，都会经过基础筛选、沟通、试工和培训。",
      stepLabel: "步骤",
      steps: [
        {
          title: "基础沟通",
          text: "先了解阿姨所在城市、服务区域、清洁经验、可接单时间，以及是否能做日常清洁、深度清洁、退租清洁等服务。",
        },
        {
          title: "线上面试",
          text: "通过初步沟通后，进一步了解阿姨的服务经验、沟通态度和做事习惯，判断她是否适合进入服务体系。",
        },
        {
          title: "线下试工",
          text: "观察阿姨是否准时、做事是否细致、沟通是否顺畅、服务效果是否达到标准。试工不合格，不安排独立上门服务。",
        },
        {
          title: "服务流程培训",
          text: "试工通过后，阿姨需要学习上门前确认、服务中沟通、服务后验收、填写回访单，以及客户额外需求处理方式。",
        },
        {
          title: "正式接单与回访",
          text: "正式服务后持续跟进客户反馈。服务稳定、好评较多的阿姨会获得更多优先派单机会；出现问题会及时复盘调整。",
        },
      ],
      principleTitle: "我们的原则",
      principleText:
        "家政服务很难做到每一次完全一样，但我们会尽量把阿姨筛选好、流程培训好、服务跟进好。如果服务中出现问题，陈阿姨到家不会逃避，也不会包庇，会认真处理客户反馈，让每一次服务都比上一次更稳定。",
    },
    servicesPage: {
      kicker: "Services",
      heroTitle: "围绕家庭状态与入住阶段，匹配合适的清洁服务方案",
      heroDescription:
        "日常清洁、深度清洁、开荒清洁、退租清洁、商业清洁与定期清洁都可以先沟通范围和报价，再安排阿姨上门。",
    },
    servicesSection: {
      kicker: "Services",
      title: "我们的清洁服务包含哪些内容",
      description:
        "覆盖 6 类高频清洁需求。不同城市、房型、面积和污渍程度会影响报价，发送需求后客服会先帮你确认范围与时间。",
      items: [
        {
          title: "日常清洁",
          tag: "Regular Cleaning",
          text: "适合长期居住家庭、宝宝家庭和忙碌上班族，可选择 Weekly、Bi-weekly 或 Monthly。",
          points: [
            "客厅卧室整理",
            "厨卫基础清洁",
            "地面吸尘拖洗",
            "固定周期维护",
          ],
        },
        {
          title: "深度清洁",
          tag: "Deep Cleaning",
          text: "加强厨房油污、浴室水垢、边角死角和长期积灰区域，适合阶段性重点处理。",
          points: [
            "厨房重油污处理",
            "浴室水垢清洁",
            "边角死角加强",
            "柜体外部擦拭",
          ],
        },
        {
          title: "开荒清洁",
          tag: "Post-renovation",
          text: "适合新房、装修后或首次入住前，重点处理装修粉尘、表面污渍和入住前复核。",
          points: [
            "装修浮尘清理",
            "玻璃与表面擦拭",
            "大面积地面处理",
            "入住前重点复核",
          ],
        },
        {
          title: "退租清洁",
          tag: "Move-out Cleaning",
          text: "适合搬家交房、留学生、公寓退租和房东验收准备，尽量减少交接压力。",
          points: [
            "空房整体清洁",
            "厨卫重点处理",
            "门窗与柜体外部",
            "交接前验收配合",
          ],
        },
        {
          title: "商业清洁",
          tag: "Commercial Cleaning",
          text: "面向办公室、店铺、工作室等小型商业空间，可根据营业节奏定制清洁范围。",
          points: [
            "办公区清洁",
            "店铺日常维护",
            "公共区域整理",
            "按场地定制范围",
          ],
        },
        {
          title: "定期清洁",
          tag: "Recurring Cleaning",
          text: "固定周期、尽量稳定阿姨、长期维护，让家里持续保持干净，也减少反复沟通。",
          points: [
            "固定周期安排",
            "尽量稳定人员",
            "长期维护计划",
            "客服持续跟进",
          ],
        },
      ],
      detailIntro:
        "由于陈阿姨到家服务多个城市，不同地区的阿姨配置、价格标准、附加项目和具体服务范围可能会有轻微差异。以下内容为基础服务参考，具体请以您所在城市客服最终确认为准。",
      detailTitle: "服务范围补充说明",
      details: [
        {
          title: "日常保洁包含内容",
          text: "适合平时有基础维护、希望定期保持家里干净整洁的家庭。",
          items: [
            "全屋地面吸尘、扫地与拖洗",
            "桌面、台面、柜面和家具表面除尘擦拭",
            "客厅、卧室、厨房、浴室基础清洁",
            "垃圾清理、更换垃圾袋和简单物品归位",
          ],
        },
        {
          title: "深度保洁包含内容",
          text: "适合两个月以上没有系统清洁、卫生死角较多、厨房油污或浴室水垢较明显的家庭。",
          items: [
            "踢脚线、门框、开关面板、墙角蜘蛛网等细节清洁",
            "厨房油烟机外部、灶台缝隙、小家电外部和水槽水垢处理",
            "浴室玻璃、水垢、排水口周边、马桶底部和台盆缝隙处理",
            "卧室与客厅家具边角、窗台窗轨和可触达底部清洁",
          ],
        },
        {
          title: "开荒 / 退租清洁包含内容",
          text: "适合搬家、退房、新房入住前、装修后或长期空置后的房屋。",
          items: [
            "全屋灰尘、地面、厨卫、柜门外部、门框和踢脚线清洁",
            "窗台、常见死角、垃圾简单归集和交房前基础恢复清洁",
            "大量建筑垃圾、严重油污、重度霉菌或地毯深洗需提前沟通",
          ],
        },
        {
          title: "可选附加项目",
          text: "不同城市支持情况不同，需提前咨询客服确认。",
          items: [
            "玻璃窗、窗槽、冰箱内部、烤箱内部、橱柜内部",
            "地毯深洗、蒸汽地毯、布艺清洗、除螨和浴室消毒",
            "地板养护、沙发养护、专业收纳、车库清洁等",
          ],
        },
        {
          title: "通常不包含的服务范围",
          text: "以下内容一般不包含在常规日常 / 深度保洁内，如有需要请提前说明。",
          items: [
            "油烟机内部风轮拆洗、家电拆机、大面积墙面和高空清洁",
            "重度霉菌根除、大量垃圾清运、宠物排泄物和危险物品清理",
            "搬运重物、大规模收纳整理和特殊专业清洁",
          ],
        },
        {
          title: "服务前客户需要配合什么",
          text: "提前说明现场情况，可以提高服务效率，也能减少范围误差。",
          items: [
            "提前告知重点区域、宠物小孩老人、特殊材质和额外项目需求",
            "贵重物品、现金、证件、药品、易碎品和收藏品请提前收好",
            "如需使用指定清洁剂，请提前准备并告知阿姨",
          ],
        },
      ],
    },
    processPage: {
      kicker: "Booking process",
      heroTitle: "预约流程清晰一点，服务体验就稳定一点",
      heroDescription:
        "本页重点展示一次预约如何被确认、执行和复核，不再重复服务项目内容，让客户更快理解下单后的每一步。",
    },
    processSection: {
      kicker: "Booking process",
      title: "从咨询到售后，有人跟进每个节点",
      description:
        "6 个关键节点聚焦预约履约：确认信息、锁定档期、上门服务、验收回访，每一步都有明确沟通。",
      cta: "咨询可预约时间",
      steps: [
        {
          title: "提交基础信息",
          text: "告诉客服所在城市、服务地址、房屋面积、期望时间和重点需求，先判断是否可安排。",
        },
        {
          title: "明确范围与报价",
          text: "客服根据现场情况说明预计时长、参考价格、重点区域和可能加项，避免服务后才临时加价。",
        },
        {
          title: "锁定档期与人员",
          text: "确认预约后同步上门时间、服务人员安排和沟通方式，让客户提前知道谁来、何时到。",
        },
        {
          title: "上门前再次确认",
          text: "上门前确认地址、停车门禁、宠物宝宝注意事项和特殊用品需求，减少现场等待与误会。",
        },
        {
          title: "现场执行与同步",
          text: "服务中按确认范围推进，临时调整会先沟通；如需额外时间或项目，必须先征得客户确认。",
        },
        {
          title: "验收与售后回访",
          text: "完成后按重点区域验收，客服跟进反馈；如有问题，保留沟通记录并及时协调处理。",
        },
      ],
    },
    aboutPage: {
      kicker: "About us",
      heroTitle: "把家政服务做成可沟通、可验收、可负责的长期服务",
      heroDescription:
        "陈阿姨到家面向海外华人家庭，从服务前沟通、阿姨筛选到服务后回访，建立更稳定透明的家政体验。",
      sectionKicker: "品牌故事",
      sectionTitle: "关于陈阿姨到家",
      sectionDescription:
        "这个品牌开始于一次并不愉快的清洁预约，也因此更重视透明报价、稳定交付和认真售后。",
      imageAlt: "陈阿姨到家服务场景",
      imageCaption: "陈阿姨到家，让家重新像个家。",
      storyTitle: "从一次糟糕体验，到想把服务做好",
      brandReasonTitle: "品牌为什么叫“陈阿姨”？",
      storyIntro:
        "我们希望客户找清洁阿姨时，不再靠运气，而是知道有人沟通、有人跟进、有人负责。",
      storyDialogTitle: "完整品牌故事",
      storyReadMore: "查看完整故事",
      story: [
        "创始人 Will 在上学期间，有一次因为家里实在太乱，临时想找一个清洁团队上门。可问了一圈，靠谱一点的团队都要等到一周以后。无奈之下，他只能预约了另一家服务商。",
        "等到对方上门后，结果并没有让人满意。家里没有被打扫到理想状态，很多细节没有处理好，部分附加项目收费也不够透明。更让人失望的是，后续沟通售后时，对方态度并不友好，问题也没有被认真解决。",
        "这次经历让 Will 意识到：海外华人和留学生不是找不到清洁服务，而是很难找到一个价格透明、服务稳定、沟通顺畅、出了问题有人负责的团队。",
        "毕业后，Will 决定自己做一家更靠谱的清洁服务公司。他找到了很好的朋友 Isaac，两人一拍即合，开始把这个想法真正落地。",
        "品牌为什么叫“陈阿姨”，也和 Will 的家庭有关。Will 的妈妈姓陈，早些年也是做保洁相关的工作。在 Will 的印象里，妈妈身上有很多传统华人阿姨很珍贵的品质：踏实、认真、能吃苦，也很在意别人对自己的信任。",
        "所以，“陈阿姨”不只是一个品牌名。它代表的是一种亲切感，也代表一种朴素的服务态度：把客户的家当成需要认真对待的地方，把每一次上门服务都当成一份信任。",
        "从洛杉矶出发，陈阿姨到家一步步开始服务更多地区的华人家庭。未来，我们希望无论你在洛杉矶、西雅图、纽约，还是伦敦、悉尼、多伦多，只要你想找一位靠谱阿姨，都能想到陈阿姨到家。",
        "陈阿姨到家由杭州陈阿姨到家品牌管理有限公司运营，面向家庭用户提供上门清洁服务。",
      ],
      stats: [
        { value: "7 年", label: "团队经验沉淀" },
        { value: "10+", label: "服务国家 / 地区" },
        { value: "26+", label: "重点服务城市" },
      ],
      valuesKicker: "我们的价值观",
      valuesTitle: "我们不是想做一次性的清洁生意",
      valuesDescription:
        "成熟的服务体验来自清楚的价格、稳定的交付、及时的沟通和可追踪的售后。",
      valuesFeatureTitle: "找家政清洁，最重要的是安心",
      valuesFeatureText:
        "我们把服务前、服务中、服务后的关键节点标准化，让客户知道每一步谁负责、怎么验收、如何售后。",
      values: [
        {
          title: "价格更安心",
          text: "服务前先沟通范围与需求，报价规则提前说明。不靠模糊低价吸引客户，也不让客户服务后才发现各种隐藏收费。",
        },
        {
          title: "服务更有心",
          text: "厨房、浴室、边角、死角等重点区域，都有清楚的服务流程。不是随便打扫一下，而是尽力把每一次服务都做得稳定、细致。",
        },
        {
          title: "安排更省心",
          text: "根据房型、服务类型和现场情况安排合适的阿姨与服务时间。如有变动，客服会提前沟通确认，不让客户临时被动等待。",
        },
        {
          title: "售后更放心",
          text: "服务完成后持续跟进客户反馈。如果有问题，不推脱、不消失，而是认真沟通，负责到底。",
        },
      ],
      videoKicker: "Auntie story",
      videoTitle: "阿姨的自述",
      videoDescription:
        "后续可以在这里放入阿姨采访视频，展示真实服务经验、工作态度和客户沟通方式，让品牌更有温度。",
      videoPlaceholder: "视频内容制作中",
      videoMeta: "Interview video placeholder",
    },
    areas: {
      kicker: "Service areas",
      title: "服务覆盖地区",
      countries: "国家 / 地区",
      cities: "重点城市",
      servicePoints: "服务区域",
      rangeTitle: "已开通服务范围",
      rangeMeta: "个国家 / 地区",
      cityMeta: "个重点城市",
      ipLocated: "IP 已定位",
      locating: "定位中",
      recommendedArea: "推荐区域",
      autoRecommend: "自动推荐",
      unsupportedVisitor: "当前所在地暂未开通，已推荐最近服务点",
      visitorLocation: "访问位置：",
      visitorFallback: "根据访问位置匹配",
      loading: "正在加载服务地图",
      failed: "地图数据加载失败，请稍后重试。",
    },
    testimonials: {
      kicker: "Testimonials",
      title: "客户好评",
      description: "点击图片可查看大图",
      verified: "已验证客户",
      items: [
        {
          name: "洛杉矶留学生客户",
          text: "临时要退租，客服很快帮我安排了阿姨。价格提前说清楚，清洁完也有验收，比我之前找的省心很多。",
        },
        {
          name: "尔湾家庭客户",
          text: "家里有宝宝和猫，阿姨上门前会先确认用品和注意事项。做事很安静，厨房和浴室细节处理得很好。",
        },
        {
          name: "西雅图上班族",
          text: "工作太忙，最怕沟通成本高。他们会建群同步时间、地址和重点区域，服务后客服还会回访。",
        },
        {
          name: "纽约公寓客户",
          text: "我最在意隐藏收费，这次预约前就把范围和可能加项讲清楚了，整体体验很稳定。",
        },
      ],
    },
    cta: {
      kicker: "Get started",
      title: "填写预约需求，我们会帮你确认合适的服务方案",
      description:
        "进入预约表单后，填写服务类型、面积、地址、重点区域、宠物或宝宝注意事项。客服会根据你的信息确认范围、时间和参考报价。",
      cardTitle: "预约需求表单",
      cardText: "提交后客服会根据所在城市与房屋情况继续确认",
      button: "填写预约需求",
    },
    serviceVideoGallery: {
      kicker: "Service videos",
      title: "服务现场展示",
      description: "通过短视频呈现不同清洁场景的服务节奏、重点区域和完成效果。",
      placeholder: "服务视频",
      items: [
        {
          title: "日常清洁服务展示",
          description:
            "适合展示客厅、卧室、厨房和浴室的基础清洁流程，突出稳定维护与细节检查。",
        },
        {
          title: "厨房深度清洁",
          description: "展示油污、水槽、灶台和台面细节处理。",
        },
        {
          title: "浴室水垢处理",
          description: "展示玻璃、水龙头、马桶和地面清洁效果。",
        },
        {
          title: "退租清洁前后对比",
          description: "展示搬家交房前的重点区域复原效果。",
        },
      ],
    },
    contact: {
      kicker: "Contact",
      heroTitle: "告诉我们你的服务地址、房型和清洁需求",
      heroDescription:
        "客服会先帮你确认服务类型、预计时间、重点区域和参考报价，再安排后续预约。",
      formTitle: "获取清洁报价",
      formDescription: "填写下方表单，我们会尽快根据你的需求给出预估方案。",
      fullName: "姓名",
      email: "邮箱地址",
      phone: "电话",
      address: "服务地址",
      frequency: "选择服务频率",
      serviceType: "选择服务类型",
      serviceArea: "选择服务城市 / 区域",
      otherCity: "咨询其他城市",
      details:
        "请填写房型、面积、期望服务时间、重点清洁区域、宠物或宝宝注意事项等信息。",
      privacy: "隐私政策",
      terms: "服务条款",
      submit: "提交需求",
      submitting: "发送中...",
      submitted: "已收到需求",
      success: "需求已发送，我们会尽快根据您的信息联系确认。",
      submitError: "提交失败，请稍后再试，或直接通过邮箱联系我们。",
      frequencyOptions: [
        "一次性清洁",
        "每周固定",
        "每两周一次",
        "每月一次",
        "退租 / 搬家清洁",
        "开荒 / 装修后清洁",
      ],
      sideTitle: "提交后我们会确认",
      sideItems: [
        "服务城市与可预约时间",
        "房型面积与重点区域",
        "报价范围与可能加项",
      ],
      phoneTitle: "需要更快沟通？",
      phoneText: "可先电话或企业微信联系，表单信息后续可同步给客服。",
    },
    afterSalesPage: {
      kicker: "After-service support",
      heroTitle: "有售后问题，直接找我们",
      heroDescription:
        "陈阿姨到家不是阿姨做完就结束。您把问题告诉我们，我们来协调。",
      introTitle: "售后中心",
      intro: [
        "如果服务过程中或服务完成后，您觉得有地方没沟通清楚、没做到位，或者出现其他合理售后问题，可以直接通过这里联系我们。",
        "不用您自己和阿姨反复沟通，也不用担心没人处理。",
        "我们会在收到反馈后尽快联系您，正常情况下会在 30 分钟内与您取得联系，并根据实际情况给出处理方案。",
      ],
      supportTitle: "我要售后处理",
      supportDescription:
        "如果您遇到以下情况，可以选择售后处理。提交售后后，我们会尽快联系您，并根据实际情况处理。",
      supportItems: [
        "有地方明显遗漏",
        "清洁效果和预约内容不一致",
        "阿姨迟到或沟通不顺",
        "服务过程中出现问题",
        "现场情况和前期沟通有偏差",
        "需要平台协助协调处理",
      ],
      feedbackTitle: "投诉与建议",
      feedbackDescription:
        "如果您对本次服务、阿姨表现、客服沟通、预约流程或价格说明有任何意见，也可以在这里提交。",
      feedbackBody: [
        "您的反馈不会被忽略。",
        "我们会把每一次投诉和建议记录下来，用于后续阿姨管理、服务流程优化和客户体验改进。",
        "您愿意告诉我们问题，本身就是在帮我们把服务做得更好。",
      ],
      qrTitle: "扫码联系售后",
      qrDescription: "有售后、投诉或建议问题，可以优先扫码添加微信联系。",
      qrItems: ["售后处理", "投诉建议"],
      responseMeta: "正常情况下 30 分钟内联系您",
      storyKicker: "我们的售后态度",
      storyTitle: "家政行业没有永远不出问题的服务，但一定要有人负责",
      story: [
        "做家政服务越久，越明白这个行业有一个很现实的难点：",
        "我们可以在上门前培训阿姨、制定流程、反复强调标准，但阿姨真正进入客户家里以后，现场情况是无法被后台完全监管的。",
        "每个家庭的卫生程度不同，客户的标准不同，阿姨当天的理解和执行也会有差异。所以家政服务很难像一件标准商品一样，保证每一次交付都百分百完全一致。",
        "这是这个行业客观存在的问题，也是我们一直在努力优化，但无法彻底消除的问题。",
        "但陈阿姨到家能承诺的是：只要客户提出真实反馈，我们一定会认真看、认真处理。哪里做得不到位，我们不会装看不见；阿姨哪里不符合标准，我们也不会包庇。",
        "我们不能保证每一次上门都绝对完美，但我们能保证，出现问题后，一定有人负责、有人跟进、有人解决。",
        "因为我们不是想做一阵子的生意。",
        "华人圈子说大不大，说小不小。一家服务做得好不好，客户愿不愿意复购，朋友之间一打听，其实很快就知道了。",
        "如果只想着做一次性生意，今天糊弄一个客户，明天换一个客户，短期看好像能赚到钱，但长期看是最笨的做法。",
        "品牌没有信任，就没有复利。行业换来换去，也做不出真正长久的东西。",
        "我们是真的希望陈阿姨到家能在这个行业里扎下根，做 5 年、10 年，甚至更久。",
        "所以每一次客户反馈，对我们来说都不是麻烦，而是提醒我们：哪里还不够好，哪里还要继续改。",
        "家政行业没有永远不出问题的服务，但一定要有出了问题后愿意站出来负责的品牌。",
        "陈阿姨到家，会一直把这件事放在心上。",
        "如果您是之后的用户才看到这条朋友圈，有任何投诉和建议问题可以直接添加以下联系方式哟，好的建议我们有礼品回馈。",
      ],
    },
    joinPage: {
      kicker: "Join us",
      heroTitle: "加入陈阿姨到家阿姨团队",
      heroDescription:
        "如果你有清洁经验、服务态度稳定、愿意按流程服务客户，可以提交申请。客服会根据城市、经验和档期进一步沟通。",
      formTitle: "阿姨加入申请",
      formDescription:
        "请尽量填写真实信息，方便我们判断所在城市是否有合作需求，以及是否适合进入后续沟通、试工和培训流程。",
      name: "姓名 / 称呼",
      contact: "联系方式",
      city: "所在城市",
      serviceArea: "可服务区域",
      experience: "清洁经验，例如 2 年 / 5 年",
      availability: "可接单时间",
      availabilityPlaceholder: "例如 工作日 / 周末 / 全天",
      tools: "是否自带工具和清洁剂",
      serviceTypes: "可做服务类型",
      serviceTypeOptions: [
        "日常清洁",
        "深度清洁",
        "开荒清洁",
        "退租清洁",
        "商业清洁",
        "定期清洁",
      ],
      notes: "补充说明",
      notesPlaceholder: "过往工作经验、擅长项目、是否有车辆、是否能长期合作等",
      success: "申请已记录。后续客服会根据所在城市、经验和档期与你进一步沟通。",
      submit: "提交加入申请",
      submitting: "发送中...",
      submitted: "申请已提交",
      submitError: "提交失败，请稍后再试，或直接通过邮箱联系我们。",
      sideTitle: "我们看重什么",
      highlights: [
        "通过筛选和试工后，进入正式合作阿姨名单",
        "客服统一沟通需求、时间、地址和服务范围",
        "服务记录和客户反馈会持续沉淀，稳定好评可获得更多优先派单机会",
      ],
      fitTitle: "我们适合什么样的阿姨？",
      fitItems: [
        {
          title: "做事认真",
          text: "认真对待每一次服务，不敷衍客户，不随便应付。",
        },
        {
          title: "愿意学习",
          text: "清洁技术可以慢慢提升，但要愿意接受培训、学习流程和服务标准。",
        },
        {
          title: "服务态度好",
          text: "对客户有耐心，沟通语气友善，遇到问题愿意好好解决。",
        },
        {
          title: "有责任心",
          text: "答应接单就认真完成，不随便迟到、不临时失联。",
        },
        {
          title: "接受公司流程",
          text: "愿意配合服务前确认、服务中沟通、服务后验收和提交反馈。",
        },
        {
          title: "愿意长期合作",
          text: "不是只想临时接几单，而是希望稳定接单、长期发展。",
        },
      ],
      notFitTitle: "什么样的人不适合加入我们？",
      notFitItems: [
        "服务态度差，和客户沟通不耐烦或容易产生冲突",
        "做事敷衍，只想快点结束，不愿意处理细节",
        "不接受培训、试工和基础服务流程",
        "经常迟到、不提前沟通或服务后不提交验收反馈",
        "私下接单 / 飞单，一经发现将终止合作",
        "遇到问题推卸责任，不配合团队解决",
      ],
      benefitsTitle: "加入我们能获得什么？",
      benefits: [
        {
          title: "稳定客户资源",
          text: "根据城市和档期获得客户订单，不需要完全靠自己找客户。",
        },
        {
          title: "成熟培训体系",
          text: "有基础培训、服务流程、打扫标准和客户沟通规范。",
        },
        {
          title: "金牌阿姨晋升体系",
          text: "表现稳定、客户好评多的阿姨，可获得更多薪资分成和优先派单机会。",
        },
        {
          title: "小费全部归阿姨",
          text: "客户给阿姨的小费，公司一分不收，全部归阿姨本人。",
        },
        {
          title: "团队售后兜底",
          text: "遇到客户沟通、售后反馈或现场问题，团队会一起介入处理。",
        },
        {
          title: "工作更安心",
          text: "我们希望阿姨接单不只是有收入，也能做得安心、放心、舒心。",
        },
      ],
      growthTitle: "阿姨成长路径",
      growthSteps: [
        "新人阿姨",
        "合格阿姨",
        "优选阿姨",
        "金牌阿姨",
        "城市小组长 / 城市合伙人",
      ],
      principlesTitle: "我们的合作原则",
      principles: [
        {
          title: "认真做事的人，会被认真对待",
          text: "阿姨认真服务客户，公司也会认真维护阿姨的权益和收入机会。",
        },
        {
          title: "好服务会有回报",
          text: "客户好评越多，派单机会越多，长期收入也会更稳定。",
        },
        {
          title: "有问题一起解决",
          text: "服务中出现沟通或售后问题，团队会一起介入。",
        },
        {
          title: "不接受敷衍和飞单",
          text: "服务态度差、做事敷衍、私下接单的人，不适合长期合作。",
        },
      ],
      closingTitle: "如果您认真负责，欢迎加入陈阿姨到家",
      closingText:
        "我们希望在这里，让真正做得好的阿姨被客户看见，也让认真做事的人获得更稳定的机会和更好的回报。",
      contactCardTitle: "优先扫码联系",
      contactCardText: "建议先扫码添加微信，电话、邮件回复可能会延迟。",
      phoneLabel: "请通过邮箱联系",
      emailLabel: "邮箱：auntiechenhome@gmail.com",
    },
    regions: {
      美国: "美国",
      英国: "英国",
      法国: "法国",
      新加坡: "新加坡",
      加拿大: "加拿大",
      澳大利亚: "澳大利亚",
      新西兰: "新西兰",
      马来西亚: "马来西亚",
      日本: "日本",
      韩国: "韩国",
    },
    cities: {
      洛杉矶: "洛杉矶",
      尔湾: "尔湾",
      西雅图: "西雅图",
      圣何塞: "圣何塞",
      旧金山: "旧金山",
      费城: "费城",
      芝加哥: "芝加哥",
      纽约: "纽约",
      波士顿: "波士顿",
      底特律: "底特律",
      新加坡: "新加坡",
      伦敦: "伦敦",
      伯明翰: "伯明翰",
      巴黎: "巴黎",
      东京: "东京",
      大阪: "大阪",
      首尔: "首尔",
      悉尼: "悉尼",
      墨尔本: "墨尔本",
      布里斯班: "布里斯班",
      奥克兰: "奥克兰",
      "洛杉矶 / 尔湾": "洛杉矶 / 尔湾",
      "巴黎 / 巴黎大区": "巴黎 / 巴黎大区",
      "多伦多 GTA": "多伦多 GTA",
      温哥华: "温哥华",
      "吉隆坡 / 巴生谷": "吉隆坡 / 巴生谷",
      "槟城 / 乔治市": "槟城 / 乔治市",
      新山: "新山",
    },
  },
  en: {
    common: {
      brandName: "Auntie Chen Home",
      brandSub: "Make home feel like home again",
      siteTitle:
        "Auntie Chen Home | A trusted Chinese cleaning brand with service guarantees",
      siteDescription:
        "Before booking, visit our site to understand how we handle auntie assignment, pricing, acceptance checks, and after-service follow-up for the concerns families care about most.",
      bookNow: "Book now",
      languageLabel: "中文",
      socialXiaohongshu: "Xiaohongshu",
      socialWeCom: "WeCom",
      themeDark: "Dark mode",
      themeLight: "Light mode",
      menuOpen: "Open navigation menu",
      menuClose: "Close navigation menu",
    },
    nav: {
      home: "Home",
      about: "About",
      why: "Why choose us",
      services: "Services",
      process: "Process",
      areas: "Areas",
      gallery: "Gallery",
      blog: "Blog",
      faq: "FAQ",
      afterSales: "After-sales",
      join: "Join us",
      contact: "Contact",
    },
    footer: {
      menuTitle: "Menu",
      whoTitle: "Who we are",
      helpTitle: "How we help",
      contactDescription:
        "We recommend scanning the WeChat QR code first. Phone and email replies may be delayed.",
      rights: "All rights reserved",
      socialShipinhao: "WeChat Channels",
      teamLink: "Founding team",
      goldAuntiesLink: "Gold aunties this month",
    },
    problemsSection: {
      kicker: "Why we exist",
      title: "What problems are we solving?",
      description:
        "Finding cleaning help overseas should not depend only on referrals and luck. We connect booking, dispatch, service, inspection, and after-service follow-up into a clearer process.",
    },
    founderTeam: {
      kicker: "Team",
      title: "Founding team",
      description:
        "We want to turn overseas Chinese home cleaning from one-off matching into a stable, transparent service brand with real accountability.",
      members: [
        {
          name: "Will",
          role: "Founder",
          title: "Operations and customer experience",
          text: "Leads operations, customer support, and service standards. He focuses on the full experience from inquiry and booking to home visit and after-service follow-up.",
        },
        {
          name: "Isaac",
          role: "Founder",
          title: "Brand and growth",
          text: "Leads brand positioning, growth, and business systems. He wants overseas Chinese cleaning services to feel more stable, transparent, and easier to book.",
        },
        {
          name: "Fan",
          role: "Co-founder",
          title: "Auntie operations",
          text: "Leads auntie management and front-line service standards. With long-term cleaning experience, she helps improve screening, training, dispatch, and service execution.",
        },
      ],
    },
    goldAunties: {
      kicker: "Gold Aunties",
      title: "Gold aunties this month",
      description:
        "Careful screening, process training, and follow-up are the foundation of more stable service.",
      imageAlt: "Gold auntie this month",
    },
    blogPreview: {
      kicker: "Blog",
      title: "Cleaning service notes",
      description:
        "Short articles on common cleaning questions, service choices, and what to confirm before a visit.",
      viewAll: "View all",
      readMore: "Read more",
    },
    hero: {
      badge: "Welcome to",
      titleLineOne: "Welcome to",
      titleLineTwo:
        "the leading home cleaning company for overseas Chinese families",
      typingWords: [
        "No hidden fees",
        "Free rework",
        "No time-wasting",
        "No surface-only cleaning",
      ],
      description:
        "Finding cleaning help should not depend on referrals and luck.\nAuntie Chen Home uses clearer quotes, steadier auntie scheduling, and more accountable follow-up,\nso overseas Chinese families can book cleaning with less stress.",
      primaryCta: "Book cleaning service",
      secondaryCta: "View services",
      cardTitle: "Confirm scope and quote first",
      cardText:
        "Home type, size, priority areas, and available time slots are clarified before booking.",
      trustPoints: [
        "Scope and quote first",
        "Screened and trained aunties",
        "Post-service follow-up",
      ],
      stats: [
        { to: 7, suffix: " yrs", label: "Team experience" },
        { to: 100000, suffix: "+", label: "Chinese families served" },
        { to: 98, suffix: "%", label: "Positive feedback" },
        { to: 100, suffix: "+", label: "Team aunties" },
      ],
    },
    homeExperience: {
      kicker: "Service promise",
      title: "Cleaning service that feels clearer and steadier",
      description:
        "Scope and quote are clarified before booking, priority areas are checked before the visit, and support follows up after service. You do not have to coordinate everything yourself.",
      sceneLabel: "Focus",
      scopeMetric: "Scope",
      standardMetric: "Standards",
      supportMetric: "Support",
      dialogDescription:
        "Use these details to check the full service logic before booking.",
      scenes: [
        {
          eyebrow: "01 / Before booking",
          title: "Confirm the scope before the visit",
          text: "Home type, size, priority areas, add-ons, and reference quote are discussed first so expectations are clear.",
          cta: "View comparison",
          dialogTitle: "Auntie Chen Home compared with common alternatives",
        },
        {
          eyebrow: "02 / During service",
          title: "Aunties follow standards, not guesswork",
          text: "Screening, service attitude, baby and pet friendliness, and detail checks are handled as standards for steadier visits.",
          cta: "View standards",
          dialogTitle: "How we reduce service uncertainty",
        },
        {
          eyebrow: "03 / After service",
          title: "Issues are followed up by support",
          text: "After the visit, priority areas are checked and support follows up. If something is missed, someone coordinates the next step.",
          cta: "View process",
          dialogTitle: "The full flow from inquiry to after-service",
        },
      ],
    },
    why: {
      kicker: "Why choose us",
      title: "Why families choose us",
      description:
        "Clear standards across response time, auntie screening, service details, and after-service support help reduce uncertainty.",
      items: [
        {
          title: "Same-day / next-day response",
          text: "With a stable auntie network, we try to arrange same-day or next-day service whenever availability allows.",
        },
        {
          title: "Screening and training",
          text: "Aunties go through interviews, trial work, and training before taking independent home-service orders.",
        },
        {
          title: "Long-hour customer support",
          text: "From booking to completion, a dedicated support contact follows the whole process and helps resolve issues.",
        },
        {
          title: "Baby and pet friendly",
          text: "We prioritize safer cleaning products and can adjust details based on babies, pets, or family preferences.",
        },
        {
          title: "Service attitude matters",
          text: "We care about attitude as much as cleaning quality. Communication should feel respectful and reassuring.",
        },
        {
          title: "Flexible custom requests",
          text: "For small extra needs outside the standard scope, aunties will help whenever it is reasonable on site.",
        },
      ],
    },
    brandComparison: {
      title:
        "Why we are becoming the leading home-service brand for overseas Chinese families",
      featureColumn: "Comparison item",
      brandColumn: "Auntie Chen Home",
      competitorColumns: [
        "Independent local aunties",
        "Small cleaning teams",
        "Overseas home-service platforms",
      ],
      rows: [
        {
          feature: "After-service guarantee",
          values: ["good", "warn", "bad", "bad"],
        },
        {
          feature: "Good auntie service attitude",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "Experienced aunties",
          values: ["good", "warn", "good", "bad"],
        },
        {
          feature: "Detailed cleaning quality",
          values: ["good", "warn", "warn", "warn"],
        },
        {
          feature: "Fully transparent pricing",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "Free rework when issues happen",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "Dedicated after-service follow-up",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "Client priority-area records",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "Aunties do not waste time on site",
          values: ["good", "warn", "warn", "good"],
        },
        {
          feature: "Familiar auntie priority arrangement",
          values: ["good", "good", "good", "good"],
        },
        {
          feature: "Post-service review follow-up",
          values: ["good", "bad", "warn", "warn"],
        },
        {
          feature: "Returning-client benefits",
          values: ["good", "good", "good", "good"],
        },
      ],
    },
    aboutFit: {
      title: "Who is Auntie Chen Home not for?",
      paragraphs: [
        {
          parts: [
            { text: "We are " },
            { text: "not the lowest-priced", bold: true },
            {
              text: " cleaning service on the market. If you only want the cheapest auntie for a quick surface clean, and do not care much about punctuality, work attitude, details, or whether someone follows up when issues happen, Auntie Chen Home may not be the best fit.",
            },
          ],
        },
        {
          parts: [{ text: "But if you care more about:" }],
        },
        {
          parts: [
            { text: "Whether the auntie " },
            { text: "arrives on time", bold: true },
            { text: "; whether she " },
            { text: "works carefully", bold: true },
            {
              text: " instead of wasting time on site; whether kitchens, bathrooms, floors, and corners are ",
            },
            { text: "truly handled", bold: true },
            {
              text: "; whether price and scope are explained clearly before service; and whether someone ",
            },
            { text: "follows up", bold: true },
            { text: " if an issue happens." },
          ],
        },
        {
          emphasis: true,
          parts: [{ text: "Then you are in the right place." }],
        },
        {
          parts: [
            {
              text: "We are not simply sending any available auntie to your home. We work to ",
            },
            { text: "screen aunties carefully", bold: true },
            { text: ", " },
            { text: "explain service standards clearly", bold: true },
            { text: ", and " },
            { text: "manage the home-visit process well", bold: true },
            { text: "." },
          ],
        },
        {
          parts: [
            {
              text: "Home service cannot be exactly identical every time, but we work to ",
            },
            { text: "reduce avoidable service problems", bold: true },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "If what you care about is " },
            {
              text: "peace of mind, stability, careful work, and accountability",
              bold: true,
            },
            { text: ", Auntie Chen Home is a better fit." },
          ],
        },
      ],
      button: "Book home cleaning",
    },
    auntieStandards: {
      kicker: "Auntie standards",
      title: "How strict are our auntie onboarding standards?",
      lead: "Good home service is not a last-minute dispatch. It starts from screening, trial work, training, and ongoing management before an auntie joins the team.",
      description:
        "To make every visit more stable, Auntie Chen Home runs a full screening and training process for partner aunties.",
      centerTitle: "Only the top 10% of aunties are selected",
      centerText:
        "Only aunties who pass basic screening and trial work are formally assigned to client homes.",
      videoTitle: "Auntie's story",
      processLabel: "Auntie Chen Home screening process",
      processText:
        "We do not send aunties casually. Before taking orders, every partner auntie goes through basic screening, communication, trial work, and training.",
      stepLabel: "Step",
      steps: [
        {
          title: "Basic communication",
          text: "We first confirm city, service area, cleaning experience, available schedule, and whether the auntie can handle regular, deep, or move-out cleaning.",
        },
        {
          title: "Online interview",
          text: "After initial communication, we review service experience, attitude, and work habits to decide whether she fits our service system.",
        },
        {
          title: "In-person trial work",
          text: "We observe punctuality, attention to detail, communication, and cleaning results. Aunties who do not pass trial work are not sent independently.",
        },
        {
          title: "Service process training",
          text: "After passing trial work, aunties learn pre-visit confirmation, on-site communication, final checks, follow-up forms, and extra-request handling.",
        },
        {
          title: "Orders and follow-up",
          text: "After formal service begins, we keep tracking client feedback. Stable aunties with more positive feedback receive more priority orders.",
        },
      ],
      principleTitle: "Our principle",
      principleText:
        "Home service cannot be identical every time, but we work to screen aunties well, train the process clearly, and follow up seriously. When issues happen, Auntie Chen Home does not avoid or cover them up; we handle feedback and make each service more stable than the last.",
    },
    servicesPage: {
      kicker: "Services",
      heroTitle:
        "Match the right cleaning plan to your home status and move-in stage",
      heroDescription:
        "Regular, deep, post-renovation, move-out, commercial, and recurring cleaning can all be discussed with scope and quote confirmed before scheduling.",
    },
    servicesSection: {
      kicker: "Services",
      title: "What our cleaning services include",
      description:
        "Six common cleaning needs are covered. City, home size, property type, and soil level may affect the quote, so support confirms scope and timing first.",
      items: [
        {
          title: "Regular Cleaning",
          tag: "Daily / recurring home care",
          text: "For lived-in homes, families with babies, and busy professionals. Weekly, bi-weekly, or monthly options are available.",
          points: [
            "Living areas",
            "Kitchen and bathrooms",
            "Vacuum and mopping",
            "Routine upkeep",
          ],
        },
        {
          title: "Deep Cleaning",
          tag: "Detail-focused cleaning",
          text: "Targets kitchen grease, bathroom scale, corners, and long-term dust build-up for a more thorough reset.",
          points: [
            "Heavy kitchen grease",
            "Bathroom scale",
            "Corners and edges",
            "Exterior cabinets",
          ],
        },
        {
          title: "Post-renovation",
          tag: "New home / first move-in",
          text: "For renovated or newly finished homes, focusing on construction dust, surface residue, and move-in readiness.",
          points: [
            "Construction dust",
            "Glass and surfaces",
            "Large floor areas",
            "Move-in check",
          ],
        },
        {
          title: "Move-out Cleaning",
          tag: "Lease return / handover",
          text: "For moving, student apartments, lease return, and landlord handover preparation with less stress.",
          points: [
            "Empty-home cleaning",
            "Kitchen and bathrooms",
            "Doors and cabinets",
            "Handover support",
          ],
        },
        {
          title: "Commercial Cleaning",
          tag: "Office / shop / studio",
          text: "For small offices, stores, and studios, with scope adjusted around your business schedule and space type.",
          points: [
            "Office areas",
            "Shop upkeep",
            "Shared spaces",
            "Custom scope",
          ],
        },
        {
          title: "Recurring Cleaning",
          tag: "Stable long-term upkeep",
          text: "Fixed cadence, more stable auntie assignment where possible, and long-term maintenance to reduce repeated coordination.",
          points: [
            "Fixed cadence",
            "Stable assignment",
            "Maintenance plan",
            "Support follow-up",
          ],
        },
      ],
      detailIntro:
        "Auntie Chen Home serves multiple cities, so auntie availability, pricing standards, add-ons, and exact service scope may vary slightly. The following is a baseline reference; please follow the final confirmation from support in your city.",
      detailTitle: "Service scope notes",
      details: [
        {
          title: "Regular cleaning includes",
          text: "For homes with basic upkeep that need a cleaner and more orderly routine.",
          items: [
            "Vacuuming, sweeping, and mopping floors throughout the home",
            "Dusting and wiping tables, counters, cabinet surfaces, and furniture surfaces",
            "Basic cleaning for living areas, bedrooms, kitchen, and bathrooms",
            "Trash removal, bag replacement, and simple item tidying",
          ],
        },
        {
          title: "Deep cleaning includes",
          text: "For homes that have not been systematically cleaned for more than two months or have more visible grease, scale, or hidden dust.",
          items: [
            "Baseboards, door frames, switch panels, corners, and cobweb removal",
            "Kitchen range hood exterior, stove gaps, small appliance exteriors, and sink scale",
            "Bathroom glass, scale, drain areas, toilet base, and sink seams",
            "Furniture edges, window sills, tracks, and reachable lower areas",
          ],
        },
        {
          title: "Post-renovation / move-out cleaning includes",
          text: "For moving, lease return, first move-in, renovation, or homes vacant for a long time.",
          items: [
            "Dust, floors, kitchen, bathrooms, cabinet exteriors, door frames, and baseboards",
            "Window sills, common corners, simple trash gathering, and basic handover cleaning",
            "Construction debris, severe grease, heavy mold, or carpet washing requires advance confirmation",
          ],
        },
        {
          title: "Optional add-ons",
          text: "Availability varies by city and should be confirmed with support in advance.",
          items: [
            "Window glass, tracks, refrigerator interior, oven interior, and cabinet interiors",
            "Carpet washing, steam carpet, fabric cleaning, mite removal, and bathroom disinfection",
            "Floor care, sofa care, professional organizing, garage cleaning, and more",
          ],
        },
        {
          title: "Usually not included",
          text: "These are generally not included in regular or deep cleaning unless confirmed beforehand.",
          items: [
            "Internal range hood fan cleaning, appliance disassembly, large wall areas, and high-level cleaning",
            "Heavy mold removal, large trash removal, pet waste, or hazardous item cleaning",
            "Moving heavy items, large-scale organizing, and special professional cleaning",
          ],
        },
        {
          title: "How clients can prepare",
          text: "Sharing site details in advance improves efficiency and reduces scope mismatch.",
          items: [
            "Tell support priority areas, pets, children, elderly family members, special materials, and add-on needs",
            "Put away valuables, cash, documents, medicine, fragile items, and collectibles",
            "Prepare and point out any cleaning products you specifically want used",
          ],
        },
      ],
    },
    processPage: {
      kicker: "Booking process",
      heroTitle: "A clearer booking process makes service feel more stable",
      heroDescription:
        "This page focuses on how a booking is confirmed, delivered, checked, and followed up, without repeating the service category content.",
    },
    processSection: {
      kicker: "Booking process",
      title: "From inquiry to after-service, every step is followed",
      description:
        "Six key moments focus on delivery: information confirmation, scheduling, home visit, acceptance check, and follow-up support.",
      cta: "Ask available times",
      steps: [
        {
          title: "Share basic details",
          text: "Tell support your city, address, home size, preferred time, and priorities so availability can be checked first.",
        },
        {
          title: "Confirm scope and quote",
          text: "Support explains estimated time, reference quote, priority areas, and possible add-ons before the visit.",
        },
        {
          title: "Lock time and team",
          text: "After confirmation, the visit time, auntie arrangement, and communication channel are synced in advance.",
        },
        {
          title: "Pre-visit check",
          text: "Address, parking, access, pets, babies, and special supplies are confirmed again to reduce waiting or confusion.",
        },
        {
          title: "On-site execution",
          text: "Work follows the confirmed scope. Any extra time or item must be discussed and approved before proceeding.",
        },
        {
          title: "Check and follow up",
          text: "After completion, priority areas are checked and support follows up on feedback or issues with clear records.",
        },
      ],
    },
    aboutPage: {
      kicker: "About us",
      heroTitle:
        "Turning home services into a long-term experience that is clear, trackable, and accountable",
      heroDescription:
        "Auntie Chen Home serves overseas Chinese families with clearer communication, screened aunties, and after-service follow-up.",
      sectionKicker: "Brand story",
      sectionTitle: "About Auntie Chen Home",
      sectionDescription:
        "The brand started from a disappointing cleaning booking, which is why we care so much about clear pricing, stable delivery, and responsible support.",
      imageAlt: "Auntie Chen Home service scene",
      imageCaption: "Every home visit is treated as a matter of trust.",
      storyTitle: "From a bad experience to building a better service",
      brandReasonTitle: "Why is the brand called Auntie Chen?",
      storyIntro:
        "We want families to stop relying on luck when booking cleaning help. There should be someone to communicate, follow up, and take responsibility.",
      storyDialogTitle: "Full brand story",
      storyReadMore: "Read the full story",
      story: [
        "When founder Will was still in school, his home became too messy and he urgently needed a cleaning team. After asking around, the more reliable teams were all booked at least a week out, so he had to try another provider.",
        "The result was disappointing. The home was not cleaned to the expected standard, many details were missed, and some add-on charges were not transparent. What felt worse was the follow-up: the communication was unfriendly and the issue was not handled seriously.",
        "That experience made Will realize that overseas Chinese families and students are not unable to find cleaners; they struggle to find a team with transparent pricing, stable service, smooth communication, and real accountability when problems happen.",
        "After graduation, Will decided to build a more reliable cleaning service company. He found a close friend, Isaac, and the two started turning the idea into a real service system.",
        "The name “Auntie Chen” is also connected to Will’s family. Will’s mother’s surname is Chen, and she used to work in cleaning-related services. To Will, she represented qualities many Chinese aunties are known for: practical, careful, hardworking, and serious about trust.",
        "So Auntie Chen is more than a brand name. It represents warmth and a simple service attitude: treat every client’s home seriously and treat every visit as a trust placed in us.",
        "Starting from Los Angeles, Auntie Chen Home has gradually expanded to serve more Chinese families in more regions. In the future, whether you are in Los Angeles, Seattle, New York, London, Sydney, or Toronto, we hope Auntie Chen Home is the name you think of when you need reliable help.",
        "Auntie Chen Home is operated by Hangzhou Auntie Chen Home Brand Management Co., Ltd. and provides on-site cleaning services for families.",
      ],
      stats: [
        { value: "7 yrs", label: "team experience" },
        { value: "10+", label: "countries / regions" },
        { value: "26+", label: "key service cities" },
      ],
      valuesKicker: "Our values",
      valuesTitle: "We are not building a one-time cleaning business",
      valuesDescription:
        "A mature service experience comes from clear pricing, stable delivery, timely communication, and traceable after-service support.",
      valuesFeatureTitle: "For home cleaning, peace of mind matters most",
      valuesFeatureText:
        "We standardize the key moments before, during, and after service so clients know who is responsible, how to check the work, and how support is handled.",
      values: [
        {
          title: "Clearer pricing",
          text: "Scope and needs are discussed before service, and pricing rules are explained upfront. We avoid vague low-price offers and hidden fees after the visit.",
        },
        {
          title: "More careful service",
          text: "Kitchens, bathrooms, corners, and high-priority areas follow a clear service process. We focus on stable, detailed work rather than a quick surface clean.",
        },
        {
          title: "Easier scheduling",
          text: "We arrange suitable aunties and service time based on home type, service needs, and on-site conditions. If anything changes, support confirms it in advance.",
        },
        {
          title: "Responsible follow-up",
          text: "After service, we continue to follow up on feedback. If there is a problem, we communicate seriously and take responsibility instead of disappearing.",
        },
      ],
      videoKicker: "Auntie story",
      videoTitle: "Auntie interview",
      videoDescription:
        "An interview video can be placed here later to show real service experience, work attitude, and client communication style.",
      videoPlaceholder: "Video in production",
      videoMeta: "Interview video placeholder",
    },
    areas: {
      kicker: "Service areas",
      title: "Service areas",
      countries: "Countries / regions",
      cities: "Key cities",
      servicePoints: "Service areas",
      rangeTitle: "Supported service areas",
      rangeMeta: "countries / regions",
      cityMeta: "key cities",
      ipLocated: "IP located",
      locating: "Locating",
      recommendedArea: "Recommended",
      autoRecommend: "Auto recommendation",
      unsupportedVisitor:
        "Your current area is not open yet; nearest service point recommended",
      visitorLocation: "Visitor: ",
      visitorFallback: "Matched by visitor location",
      loading: "Loading service map",
      failed: "Map data failed to load. Please try again later.",
    },
    testimonials: {
      kicker: "Testimonials",
      title: "Client feedback",
      description: "Click an image to view it larger.",
      verified: "Verified client",
      items: [
        {
          name: "LA student client",
          text: "I needed move-out cleaning at short notice. Support arranged an auntie quickly, explained the price upfront, and checked the result after cleaning.",
        },
        {
          name: "Irvine family client",
          text: "We have a baby and a cat. The auntie confirmed supplies and details before arrival, worked quietly, and handled kitchen and bathroom details well.",
        },
        {
          name: "Seattle professional",
          text: "I am busy and hate back-and-forth coordination. They synced time, address, and focus areas clearly, then followed up after service.",
        },
        {
          name: "New York apartment client",
          text: "I care most about hidden fees. This booking explained scope and possible add-ons before service, and the overall experience felt stable.",
        },
      ],
    },
    cta: {
      kicker: "Get started",
      title: "Submit your booking details and we will confirm the right plan",
      description:
        "Use the booking form to share service type, home size, address, priority areas, pets, babies, or special notes. Support will confirm scope, timing, and reference quote.",
      cardTitle: "Booking request form",
      cardText: "Support follows up based on your city and home details",
      button: "Submit request",
    },
    serviceVideoGallery: {
      kicker: "Service videos",
      title: "Service video gallery",
      description:
        "Short service videos show the pace, priority areas, and finished results across different cleaning scenes.",
      placeholder: "Service video",
      items: [
        {
          title: "Regular cleaning walkthrough",
          description:
            "For showing basic cleaning flow across living rooms, bedrooms, kitchens, and bathrooms with routine checks.",
        },
        {
          title: "Kitchen deep cleaning",
          description: "Show grease, sink, stove, and countertop details.",
        },
        {
          title: "Bathroom scale treatment",
          description:
            "Show glass, faucets, toilets, and floor cleaning results.",
        },
        {
          title: "Move-out before and after",
          description: "Show priority areas restored before rental handover.",
        },
      ],
    },
    contact: {
      kicker: "Contact",
      heroTitle: "Tell us your address, home type, and cleaning needs",
      heroDescription:
        "Our support team will confirm the service type, estimated time, priority areas, and reference quote before scheduling.",
      formTitle: "Request an estimate",
      formDescription: "Fill out the form below for a free estimate.",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone",
      address: "Property Address",
      frequency: "Select frequency",
      serviceType: "Select service type",
      serviceArea: "Select service city / area",
      otherCity: "Ask about another city",
      details:
        "Please provide home size, preferred time, priority areas, pets, babies, or other details that will help us create your estimate.",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      submit: "Submit request",
      submitting: "Sending...",
      submitted: "Request received",
      success:
        "Your request has been sent. We will contact you to confirm the details.",
      submitError:
        "Submission failed. Please try again later or contact us by phone / WeChat.",
      frequencyOptions: [
        "One-time cleaning",
        "Weekly",
        "Every two weeks",
        "Monthly",
        "Move-out cleaning",
        "Post-renovation cleaning",
      ],
      sideTitle: "After submitting, we confirm",
      sideItems: [
        "Service city and available time",
        "Home size and priority areas",
        "Quote range and possible add-ons",
      ],
      phoneTitle: "Need faster help?",
      phoneText:
        "You can contact us by phone or WeCom first, then share the form details with support.",
    },
    afterSalesPage: {
      kicker: "After-service support",
      heroTitle: "If there is an after-service issue, contact us directly",
      heroDescription:
        "Auntie Chen Home does not disappear after the auntie leaves. Tell us the issue and we will help coordinate.",
      introTitle: "After-sales center",
      intro: [
        "If something was not communicated clearly, not completed properly, or another reasonable after-service issue happened during or after service, you can contact us here directly.",
        "You do not need to repeatedly negotiate with the auntie yourself, and you do not need to worry that nobody will handle it.",
        "After receiving your feedback, we will contact you as soon as possible. Under normal circumstances, we will reach out within 30 minutes and provide a handling plan based on the actual situation.",
      ],
      supportTitle: "Request after-service handling",
      supportDescription:
        "If you encounter any of the following situations, you can submit an after-service request. We will contact you and handle it based on the actual facts.",
      supportItems: [
        "A clear area was missed",
        "The cleaning result did not match the booked scope",
        "The auntie was late or communication was not smooth",
        "An issue occurred during service",
        "The on-site situation differed from prior communication",
        "You need platform support to coordinate",
      ],
      feedbackTitle: "Complaints and suggestions",
      feedbackDescription:
        "If you have any feedback about the service, auntie performance, support communication, booking process, or price explanation, you can submit it here.",
      feedbackBody: [
        "Your feedback will not be ignored.",
        "We record every complaint and suggestion so we can improve auntie management, service processes, and client experience.",
        "When you are willing to tell us what happened, you are helping us make the service better.",
      ],
      qrTitle: "Scan to contact after-service support",
      qrDescription:
        "For after-service issues, complaints, or suggestions, scan the QR code to add us on WeChat first.",
      qrItems: ["After-service", "Complaints"],
      responseMeta: "Normally we contact you within 30 minutes",
      storyKicker: "Our after-service attitude",
      storyTitle:
        "Home service will never be issue-free forever, but there must be a brand willing to take responsibility",
      story: [
        "The longer we work in home services, the more clearly we understand a difficult reality of this industry:",
        "We can train aunties before visits, set processes, and repeat standards, but once an auntie enters a client’s home, the on-site situation cannot be fully supervised from the back office.",
        "Every home has a different condition, every client has different standards, and every auntie may understand and execute details differently that day. Home service is difficult to deliver like a perfectly standardized product every single time.",
        "This is an objective challenge in the industry. We keep improving it, but we cannot completely eliminate it.",
        "What Auntie Chen Home can promise is this: when clients give real feedback, we will read it seriously and handle it seriously. If something was not done well, we will not pretend we did not see it. If an auntie does not meet our standard, we will not cover it up.",
        "We cannot promise every visit will be absolutely perfect, but we can promise that when an issue happens, someone will take responsibility, follow up, and work toward a solution.",
        "Because we are not trying to build a short-term business.",
        "The overseas Chinese community is not that large. Whether a service is good, whether clients reorder, and whether friends recommend it becomes known very quickly.",
        "If a business only wants one-time transactions, it may look profitable in the short term, but it is the worst long-term strategy.",
        "Without trust, a brand has no compounding value. Jumping from one business to another will not build anything lasting.",
        "We truly hope Auntie Chen Home can take root in this industry for 5 years, 10 years, and longer.",
        "Every piece of client feedback is not a burden to us. It reminds us where we are not good enough and where we need to keep improving.",
        "There is no home-service brand that never has problems, but there must be a brand willing to stand up and take responsibility when problems happen.",
        "Auntie Chen Home will always keep this in mind.",
        "If you see this later and have any complaint or suggestion, you can add the contact below directly. Good suggestions may receive a small thank-you gift from us.",
      ],
    },
    joinPage: {
      kicker: "Join us",
      heroTitle: "Join the Auntie Chen Home partner auntie team",
      heroDescription:
        "If you have cleaning experience, a stable service attitude, and are willing to follow our service process, you can submit an application. Support will follow up based on your city, experience, and availability.",
      formTitle: "Auntie application",
      formDescription:
        "Please provide accurate information so we can check whether there is partner demand in your city and whether you are a fit for follow-up communication, trial work, and training.",
      name: "Name / preferred name",
      contact: "Contact method",
      city: "Current city",
      serviceArea: "Service areas",
      experience: "Cleaning experience, e.g. 2 years / 5 years",
      availability: "Available schedule",
      availabilityPlaceholder: "e.g. weekdays / weekends / full day",
      tools: "Do you bring tools and cleaning products?",
      serviceTypes: "Service types you can provide",
      serviceTypeOptions: [
        "Regular Cleaning",
        "Deep Cleaning",
        "Post-renovation",
        "Move-out Cleaning",
        "Commercial Cleaning",
        "Recurring Cleaning",
      ],
      notes: "Additional notes",
      notesPlaceholder:
        "Past work experience, strengths, vehicle availability, long-term cooperation, and other details",
      success:
        "Your application has been recorded. Support will follow up based on your city, experience, and availability.",
      submit: "Submit application",
      submitting: "Sending...",
      submitted: "Application submitted",
      submitError:
        "Submission failed. Please try again later or contact us by phone / WeChat.",
      sideTitle: "What we care about",
      highlights: [
        "After screening and trial work, qualified aunties join the formal partner list.",
        "Support coordinates client needs, time, address, and service scope.",
        "Service records and client feedback are tracked over time; stable positive feedback can lead to more priority dispatch opportunities.",
      ],
      fitTitle: "Who is a good fit?",
      fitItems: [
        {
          title: "Careful work",
          text: "You take every visit seriously and do not rush through details.",
        },
        {
          title: "Willing to learn",
          text: "Cleaning skills can improve over time, but you need to accept training and service standards.",
        },
        {
          title: "Good attitude",
          text: "You communicate patiently and handle issues calmly with clients.",
        },
        {
          title: "Responsible",
          text: "Once you accept a job, you complete it seriously and do not disappear.",
        },
        {
          title: "Process-friendly",
          text: "You can follow confirmation, on-site communication, inspection, and feedback steps.",
        },
        {
          title: "Long-term mindset",
          text: "You want stable work and long-term growth, not just a few temporary orders.",
        },
      ],
      notFitTitle: "Who is not a good fit?",
      notFitItems: [
        "Poor service attitude or impatient communication with clients",
        "Rushed work and unwillingness to handle details",
        "Refusing training, trial work, or basic service processes",
        "Frequent lateness, no advance communication, or missing inspection feedback",
        "Private off-platform orders, which will end cooperation once found",
        "Avoiding responsibility when problems need to be solved",
      ],
      benefitsTitle: "What you can get",
      benefits: [
        {
          title: "Stable client resources",
          text: "Orders can be matched based on city and schedule, so you do not rely only on self-sourcing.",
        },
        {
          title: "Training system",
          text: "Basic training, service process, cleaning standards, and client communication guidance are provided.",
        },
        {
          title: "Gold auntie path",
          text: "Stable performance and strong reviews can lead to more income share and priority orders.",
        },
        {
          title: "Tips belong to aunties",
          text: "Client tips go fully to the auntie; the company does not take a cut.",
        },
        {
          title: "Team support",
          text: "When communication or after-service issues happen, the team helps handle them together.",
        },
        {
          title: "More peace of mind",
          text: "We want aunties to earn income while working with more clarity and support.",
        },
      ],
      growthTitle: "Auntie growth path",
      growthSteps: [
        "New auntie",
        "Qualified auntie",
        "Preferred auntie",
        "Gold auntie",
        "City group lead / city partner",
      ],
      principlesTitle: "How we cooperate",
      principles: [
        {
          title: "People who work seriously are treated seriously",
          text: "When aunties serve clients carefully, the company also protects their rights and income opportunities.",
        },
        {
          title: "Good service is rewarded",
          text: "Better reviews can bring more order opportunities and more stable long-term income.",
        },
        {
          title: "Problems are solved together",
          text: "When service or after-sales issues happen, the team joins the handling process.",
        },
        {
          title: "No rushed work or private orders",
          text: "Poor attitude, careless work, and private off-platform orders are not acceptable.",
        },
      ],
      closingTitle: "If you are responsible, welcome to join Auntie Chen Home",
      closingText:
        "We want capable aunties to be seen by clients and to receive more stable opportunities and better rewards.",
      contactCardTitle: "Scan first to contact",
      contactCardText:
        "We recommend adding WeChat first. Phone and email replies may be delayed.",
      phoneLabel: "Please contact by email",
      emailLabel: "Email: auntiechenhome@gmail.com",
    },
    regions: {
      美国: "United States",
      英国: "United Kingdom",
      法国: "France",
      新加坡: "Singapore",
      加拿大: "Canada",
      澳大利亚: "Australia",
      新西兰: "New Zealand",
      马来西亚: "Malaysia",
      日本: "Japan",
      韩国: "South Korea",
    },
    cities: {
      洛杉矶: "Los Angeles",
      尔湾: "Irvine",
      西雅图: "Seattle",
      圣何塞: "San Jose",
      旧金山: "San Francisco",
      费城: "Philadelphia",
      芝加哥: "Chicago",
      纽约: "New York",
      波士顿: "Boston",
      底特律: "Detroit",
      新加坡: "Singapore",
      伦敦: "London",
      伯明翰: "Birmingham",
      巴黎: "Paris",
      东京: "Tokyo",
      大阪: "Osaka",
      首尔: "Seoul",
      悉尼: "Sydney",
      墨尔本: "Melbourne",
      布里斯班: "Brisbane",
      奥克兰: "Auckland",
      "洛杉矶 / 尔湾": "Los Angeles / Irvine",
      "巴黎 / 巴黎大区": "Paris / Île-de-France",
      "多伦多 GTA": "Toronto GTA",
      温哥华: "Vancouver",
      "吉隆坡 / 巴生谷": "Kuala Lumpur / Klang Valley",
      "槟城 / 乔治市": "Penang / George Town",
      新山: "Johor Bahru",
    },
  },
} as const

type Dictionary = (typeof dictionaries)[Language]

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined)

function isLanguage(value: string | null): value is Language {
  return value !== null && LANGUAGES.includes(value as Language)
}

function I18nProvider({
  children,
  defaultLanguage = "zh",
  storageKey = "language",
}: I18nProviderProps) {
  const [language, setLanguageState] = React.useState<Language>(() => {
    if (typeof window === "undefined") {
      return defaultLanguage
    }

    const storedLanguage = window.localStorage.getItem(storageKey)

    if (isLanguage(storedLanguage)) {
      return storedLanguage
    }

    return defaultLanguage
  })

  const setLanguage = React.useCallback(
    (nextLanguage: Language) => {
      window.localStorage.setItem(storageKey, nextLanguage)
      setLanguageState(nextLanguage)
      document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en"
    },
    [storageKey]
  )

  React.useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en"
  }, [language])

  const dict = dictionaries[language]

  const value = React.useMemo<I18nContextValue>(
    () => ({
      cityName: (name) => dict.cities[name as keyof typeof dict.cities] ?? name,
      dict,
      formatLocation: (city, country) => {
        if (!city && !country) {
          return dict.areas.autoRecommend
        }

        const translatedCity = city
          ? (dict.cities[city as keyof typeof dict.cities] ?? city)
          : ""
        const translatedCountry = country
          ? (dict.regions[country as keyof typeof dict.regions] ?? country)
          : ""

        return [translatedCity, translatedCountry].filter(Boolean).join(" · ")
      },
      language,
      regionName: (name) =>
        dict.regions[name as keyof typeof dict.regions] ?? name,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "zh" ? "en" : "zh"),
    }),
    [dict, language, setLanguage]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n() {
  const context = React.useContext(I18nContext)

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }

  return context
}

export { I18nProvider, useI18n, type Language }
