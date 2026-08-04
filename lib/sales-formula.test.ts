import assert from "node:assert/strict"
import test from "node:test"

import type { CmsFormulaTemplate, CmsPaymentOrder } from "@/types/cms"

// @ts-expect-error Node's TypeScript test runner requires an explicit extension.
const formula = await import("./sales-formula.ts")
const { calculateOrderFinancials, evaluateFormulaTokens } = formula

test("evaluates fields, parentheses and percentages", () => {
  const result = evaluateFormulaTokens(
    [
      { type: "paren", value: "(" },
      { type: "field", value: "receivedAmount" },
      { type: "operator", value: "-" },
      { type: "number", value: 20 },
      { type: "paren", value: ")" },
      { type: "operator", value: "*" },
      { type: "percent", value: 10 },
    ],
    (field) => (field === "receivedAmount" ? 200 : 0)
  )
  assert.equal(result, 18)
})

test("计算阿姨薪资、学员提成和公司利润", () => {
  const now = new Date().toISOString()
  const templates: CmsFormulaTemplate[] = [
    {
      createdAt: now,
      enabled: true,
      id: "profit",
      name: "利润",
      target: "orderProfit",
      tokens: [
        { type: "field", value: "receivedAmount" },
        { type: "operator", value: "-" },
        { type: "field", value: "auntieSalary" },
        { type: "operator", value: "-" },
        { type: "field", value: "otherCost" },
        { type: "operator", value: "-" },
        { type: "field", value: "salesCommission" },
      ],
      updatedAt: now,
      version: 1,
    },
  ]
  const order = calculateOrderFinancials(
    {
      amount: "$200",
      amountValue: 200,
      assignedAuntieId: "auntie-1",
      contact: "1234567",
      createdAt: now,
      customerName: "客户",
      note: "",
      orderId: "ORD1",
      otherCost: 20,
      receivedAmount: 200,
      salesMemberId: "sales-1",
      salesOwner: "销售 A",
      serviceAddress: "地址",
      serviceArea: "城市",
      serviceDate: "2026-08-03",
      serviceType: "日常清洁",
      status: "paid",
      updatedAt: now,
    } as CmsPaymentOrder,
    {
      formulaTemplates: templates,
      salesMembers: [
        {
          commissionAdjustment: 5,
          commissionPercentage: 4,
          createdAt: now,
          id: "sales-1",
          name: "销售 A",
          status: "active",
          studentTag: "学员 A",
          updatedAt: now,
        },
      ],
      teamMembers: [
        {
          area: "",
          avatar: "",
          completedCount: 0,
          id: "auntie-1",
          name: "王阿姨",
          rating: 0,
          role: "保洁师",
          salaryAdjustment: 20,
          salaryPercentage: 60,
          status: "available",
        },
      ],
    }
  )
  assert.equal(order.auntieSalary, 140)
  assert.equal(order.salesCommission, 13)
  assert.equal(order.orderProfit, 27)
  assert.equal(
    order.calculationSnapshot?.formulaVersions.orderProfit?.version,
    1
  )
})

test("按服务时长和时薪计算阿姨薪资并保留固定调整", () => {
  const now = new Date().toISOString()
  const order = calculateOrderFinancials(
    {
      amount: "$438",
      amountValue: 438,
      assignedAuntieId: "auntie-hourly",
      contact: "1234567",
      createdAt: now,
      customerName: "客户",
      note: "",
      orderId: "ORD-HOURLY",
      receivedAmount: 438,
      serviceAddress: "地址",
      serviceArea: "纽约 · 美国",
      serviceDate: "2026-08-04",
      serviceDurationHours: 4,
      serviceType: "深度清洁",
      status: "paid",
      updatedAt: now,
    } as CmsPaymentOrder,
    {
      formulaTemplates: [],
      salesMembers: [],
      teamMembers: [
        {
          area: "",
          avatar: "",
          completedCount: 0,
          id: "auntie-hourly",
          name: "李阿姨",
          rating: 0,
          role: "保洁师",
          salaryAdjustment: 10,
          salaryHourlyRate: 30,
          salaryMode: "hourly",
          status: "available",
        },
      ],
    }
  )

  assert.equal(order.auntieSalary, 130)
  assert.equal(order.calculationSnapshot?.inputs.serviceDurationHours, 4)
})

test("缺少服务时长的历史订单保留已记录的阿姨薪资", () => {
  const now = new Date().toISOString()
  const order = calculateOrderFinancials(
    {
      amount: "$200",
      amountValue: 200,
      assignedAuntieId: "auntie-hourly",
      auntieSalary: 95,
      contact: "1234567",
      createdAt: now,
      customerName: "客户",
      note: "",
      orderId: "ORD-LEGACY-HOURLY",
      serviceAddress: "地址",
      serviceArea: "纽约 · 美国",
      serviceDate: "2026-08-01",
      serviceType: "日常清洁",
      status: "paid",
      updatedAt: now,
    } as CmsPaymentOrder,
    {
      formulaTemplates: [],
      salesMembers: [],
      teamMembers: [
        {
          area: "",
          avatar: "",
          completedCount: 0,
          id: "auntie-hourly",
          name: "李阿姨",
          rating: 0,
          role: "保洁师",
          salaryHourlyRate: 30,
          salaryMode: "hourly",
          status: "available",
        },
      ],
    }
  )

  assert.equal(order.auntieSalary, 95)
})
