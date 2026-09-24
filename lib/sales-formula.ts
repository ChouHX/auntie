import type {
  CmsFormulaField,
  CmsFormulaTarget,
  CmsFormulaTemplate,
  CmsFormulaToken,
  CmsContent,
  CmsPaymentOrder,
} from "@/types/cms"
// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
import * as salesCommissionRules from "./sales-commission.ts"

const formulaFieldLabels: Record<CmsFormulaField, string> = {
  auntieSalary: "阿姨薪资",
  otherCost: "其他成本",
  paymentAmount: "订单金额（含小费）",
  receivedAmount: "实收金额（不含小费）",
  salesCommission: "学员提成",
}

const formulaTargetLabels: Record<CmsFormulaTarget, string> = {
  orderProfit: "公司利润",
}

/**
 * 默认利润模板：(实收金额 - 其他成本) - 阿姨薪资 - 学员提成。
 * 括号内即为阿姨薪资与学员提成的分成基数，保持三者同一口径。
 */
function createDefaultOrderProfitTokens(): CmsFormulaToken[] {
  return [
    { type: "paren", value: "(" },
    { type: "field", value: "receivedAmount" },
    { type: "operator", value: "-" },
    { type: "field", value: "otherCost" },
    { type: "paren", value: ")" },
    { type: "operator", value: "-" },
    { type: "field", value: "auntieSalary" },
    { type: "operator", value: "-" },
    { type: "field", value: "salesCommission" },
  ]
}

// 旧版默认模板（未分组）：receivedAmount - auntieSalary - otherCost - salesCommission
const legacyOrderProfitSignature = [
  "field:receivedAmount",
  "operator:-",
  "field:auntieSalary",
  "operator:-",
  "field:otherCost",
  "operator:-",
  "field:salesCommission",
].join("|")

function formulaSignature(tokens: CmsFormulaToken[]) {
  return tokens.map((token) => `${token.type}:${token.value}`).join("|")
}

/**
 * 把旧版未分组的默认利润模板升级为分组写法。运算结果不变，仅调整结构；
 * 只匹配旧默认序列，用户自定义的模板原样保留。
 */
function upgradeOrderProfitTemplate(
  template: CmsFormulaTemplate
): CmsFormulaTemplate {
  if (formulaSignature(template.tokens) !== legacyOrderProfitSignature) {
    return template
  }
  return { ...template, tokens: createDefaultOrderProfitTokens() }
}

const computedFields = new Set<CmsFormulaField>()

function validateFormulaTokens(tokens: CmsFormulaToken[]) {
  if (!tokens.length) throw new Error("公式不能为空")
  let expectsOperand = true
  let depth = 0

  tokens.forEach((token) => {
    if (
      token.type === "field" ||
      token.type === "number" ||
      token.type === "percent"
    ) {
      if (!expectsOperand) throw new Error("数值或字段之间缺少运算符")
      if (
        (token.type === "number" || token.type === "percent") &&
        !Number.isFinite(token.value)
      ) {
        throw new Error("公式包含无效数值")
      }
      expectsOperand = false
      return
    }

    if (token.type === "operator") {
      if (expectsOperand) throw new Error("运算符位置不正确")
      expectsOperand = true
      return
    }

    if (token.value === "(") {
      if (!expectsOperand) throw new Error("左括号前缺少运算符")
      depth += 1
      return
    }

    if (expectsOperand || depth <= 0) throw new Error("右括号位置不正确")
    depth -= 1
  })

  if (expectsOperand) throw new Error("公式不能以运算符结尾")
  if (depth !== 0) throw new Error("公式括号不匹配")
}

function validateFormulaTemplateSet(templates: CmsFormulaTemplate[]) {
  const edges = new Map<CmsFormulaTarget, Set<CmsFormulaTarget>>()
  templates.forEach((template) => {
    validateFormulaTokens(template.tokens)
    const dependencies =
      edges.get(template.target) ?? new Set<CmsFormulaTarget>()
    template.tokens.forEach((token) => {
      if (token.type === "field" && computedFields.has(token.value)) {
        dependencies.add(token.value as CmsFormulaTarget)
      }
    })
    edges.set(template.target, dependencies)
  })
  const visiting = new Set<CmsFormulaTarget>()
  const visited = new Set<CmsFormulaTarget>()
  function visit(target: CmsFormulaTarget) {
    if (visiting.has(target)) throw new Error("公式模板之间存在循环引用")
    if (visited.has(target)) return
    visiting.add(target)
    edges.get(target)?.forEach(visit)
    visiting.delete(target)
    visited.add(target)
  }
  edges.forEach((_dependencies, target) => visit(target))
}

function evaluateFormulaTokens(
  tokens: CmsFormulaToken[],
  resolveField: (field: CmsFormulaField) => number
) {
  validateFormulaTokens(tokens)
  const output: CmsFormulaToken[] = []
  const operators: CmsFormulaToken[] = []
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 } as const

  tokens.forEach((token) => {
    if (
      token.type === "field" ||
      token.type === "number" ||
      token.type === "percent"
    ) {
      output.push(token)
      return
    }
    if (token.type === "operator") {
      while (operators.length) {
        const top = operators.at(-1)!
        if (
          top.type !== "operator" ||
          precedence[top.value] < precedence[token.value]
        )
          break
        output.push(operators.pop()!)
      }
      operators.push(token)
      return
    }
    if (token.value === "(") {
      operators.push(token)
      return
    }
    while (operators.length && operators.at(-1)?.type !== "paren") {
      output.push(operators.pop()!)
    }
    operators.pop()
  })
  while (operators.length) output.push(operators.pop()!)

  const values: number[] = []
  output.forEach((token) => {
    if (token.type === "field") values.push(resolveField(token.value))
    if (token.type === "number") values.push(token.value)
    if (token.type === "percent") values.push(token.value / 100)
    if (token.type !== "operator") return
    const right = values.pop()
    const left = values.pop()
    if (left === undefined || right === undefined)
      throw new Error("公式结构无效")
    if (token.value === "/" && right === 0) throw new Error("公式不能除以零")
    const result =
      token.value === "+"
        ? left + right
        : token.value === "-"
          ? left - right
          : token.value === "*"
            ? left * right
            : left / right
    if (!Number.isFinite(result)) throw new Error("公式计算结果无效")
    values.push(result)
  })
  if (values.length !== 1) throw new Error("公式结构无效")
  return roundMoney(values[0])
}

function calculateOrderFinancials(
  order: CmsPaymentOrder,
  content: Pick<CmsContent, "formulaTemplates" | "salesMembers" | "teamMembers">
): CmsPaymentOrder {
  const selectedId = order.formulaTemplateIds?.orderProfit
  const template =
    content.formulaTemplates.find(
      (item) => item.id === selectedId && item.enabled
    ) ?? content.formulaTemplates.find((item) => item.enabled)
  const paymentAmount = normalizeNumber(
    order.amountValue || order.baseAmountValue
  )
  const receivedAmount = normalizeNumber(order.receivedAmount)
  const otherCost = normalizeNumber(order.otherCost)
  // 客户小费 100% 归阿姨，不参与比例分成，需先从订单金额中剔除。
  const tipAmount = normalizeNumber(order.tipAmount)
  // 分成基数 = 订单金额 - 客户小费 - 其他成本（油费补贴等）。
  const distributableAmount = roundMoney(
    Math.max(0, paymentAmount - tipAmount - otherCost)
  )
  const auntie = content.teamMembers.find(
    (member) => member.id === order.assignedAuntieId
  )
  const salesMember = salesCommissionRules.findOrderSalesMember(
    order,
    content.salesMembers
  )
  const storedCommissionSnapshot = salesCommissionRules.isSnapshotForOrder(
    order,
    order.salesCommissionSnapshot
  )
    ? order.salesCommissionSnapshot
    : undefined
  const salesCommissionSnapshot = salesMember
    ? (storedCommissionSnapshot ??
      salesCommissionRules.createSalesCommissionSnapshot(salesMember))
    : storedCommissionSnapshot
  const salaryPercentage = normalizePercentage(auntie?.salaryPercentage)
  const salaryHourlyRate = normalizeNumber(auntie?.salaryHourlyRate)
  const serviceDurationHours = normalizeNumber(order.serviceDurationHours)
  const salaryAdjustment = normalizeSignedNumber(
    auntie?.salaryAdjustment ?? -normalizeNumber(auntie?.salaryDeduction)
  )
  const commissionPercentage = normalizePercentage(
    salesCommissionSnapshot?.commissionPercentage
  )
  const commissionAdjustment = normalizeSignedNumber(
    salesCommissionSnapshot?.commissionAdjustment
  )
  const auntieSalary =
    auntie?.salaryMode === "hourly" && serviceDurationHours <= 0
      ? normalizeNumber(order.auntieSalary)
      : roundMoney(
          Math.max(
            0,
            (auntie?.salaryMode === "hourly"
              ? serviceDurationHours * salaryHourlyRate
              : distributableAmount * (salaryPercentage / 100)) +
              salaryAdjustment
          )
        )
  const salesCommission = roundMoney(
    Math.max(
      0,
      distributableAmount * (commissionPercentage / 100) + commissionAdjustment
    )
  )
  const orderProfit = template
    ? evaluateFormulaTokens(template.tokens, (field) => {
        if (field === "paymentAmount") return paymentAmount
        if (field === "receivedAmount") return receivedAmount
        if (field === "otherCost") return otherCost
        if (field === "auntieSalary") return auntieSalary
        if (field === "salesCommission") return salesCommission
        return 0
      })
    : normalizeNumber(order.orderProfit)
  const exchangeRateToCny = normalizePositiveNumber(
    order.profitExchangeRateToCny
  )

  return {
    ...order,
    auntieSalary,
    calculationSnapshot: {
      calculatedAt: new Date().toISOString(),
      formulaVersions: template
        ? {
            orderProfit: {
              id: template.id,
              name: template.name,
              version: template.version,
            },
          }
        : {},
      inputs: {
        auntieSalary,
        distributableAmount,
        otherCost,
        paymentAmount,
        receivedAmount,
        salesCommission,
        serviceDurationHours,
        tipAmount,
      },
    },
    formulaTemplateIds: template ? { orderProfit: template.id } : {},
    orderProfit,
    orderProfitCny: exchangeRateToCny
      ? roundMoney(orderProfit * exchangeRateToCny)
      : order.orderProfitCny,
    salesCommission,
    salesCommissionSnapshot,
    salesMemberId: salesMember?.id ?? order.salesMemberId,
  }
}

function calculateOrderFinancialsSafely(
  order: CmsPaymentOrder,
  content: Pick<CmsContent, "formulaTemplates" | "salesMembers" | "teamMembers">
) {
  try {
    return calculateOrderFinancials(order, content)
  } catch {
    return order
  }
}

function formatFormulaTokens(tokens: CmsFormulaToken[]) {
  return tokens
    .map((token) => {
      if (token.type === "field") return formulaFieldLabels[token.value]
      if (token.type === "percent") return `${token.value}%`
      return String(token.value)
    })
    .join(" ")
}

function normalizeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeSignedNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizePositiveNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function normalizePercentage(value: unknown) {
  return Math.min(100, Math.max(0, normalizeNumber(value)))
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export {
  calculateOrderFinancials,
  calculateOrderFinancialsSafely,
  createDefaultOrderProfitTokens,
  evaluateFormulaTokens,
  formatFormulaTokens,
  formulaFieldLabels,
  formulaTargetLabels,
  upgradeOrderProfitTemplate,
  validateFormulaTokens,
  validateFormulaTemplateSet,
}
