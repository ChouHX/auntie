import type {
  CmsFormulaField,
  CmsFormulaTarget,
  CmsFormulaTemplate,
  CmsFormulaToken,
  CmsContent,
  CmsPaymentOrder,
} from "@/types/cms"

const formulaFieldLabels: Record<CmsFormulaField, string> = {
  auntieSalary: "阿姨薪资",
  otherCost: "其他成本",
  paymentAmount: "订单金额",
  receivedAmount: "订单金额",
  salesCommission: "学员提成",
}

const formulaTargetLabels: Record<CmsFormulaTarget, string> = {
  orderProfit: "公司利润",
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
  const auntie = content.teamMembers.find(
    (member) => member.id === order.assignedAuntieId
  )
  const salesMember = content.salesMembers.find(
    (member) =>
      member.status === "active" &&
      (member.id === order.salesMemberId || member.name === order.salesOwner)
  )
  const salaryPercentage = normalizePercentage(auntie?.salaryPercentage)
  const salaryAdjustment = normalizeSignedNumber(
    auntie?.salaryAdjustment ?? -normalizeNumber(auntie?.salaryDeduction)
  )
  const commissionPercentage = normalizePercentage(
    salesMember?.commissionPercentage
  )
  const commissionAdjustment = normalizeSignedNumber(
    salesMember?.commissionAdjustment
  )
  const auntieSalary = roundMoney(
    Math.max(0, paymentAmount * (salaryPercentage / 100) + salaryAdjustment)
  )
  const salesCommission = roundMoney(
    Math.max(
      0,
      paymentAmount * (commissionPercentage / 100) + commissionAdjustment
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
        otherCost,
        paymentAmount,
        receivedAmount,
        salesCommission,
      },
    },
    formulaTemplateIds: template ? { orderProfit: template.id } : {},
    orderProfit,
    orderProfitCny: exchangeRateToCny
      ? roundMoney(orderProfit * exchangeRateToCny)
      : order.orderProfitCny,
    salesCommission,
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
  evaluateFormulaTokens,
  formatFormulaTokens,
  formulaFieldLabels,
  formulaTargetLabels,
  validateFormulaTokens,
  validateFormulaTemplateSet,
}
