import { stats } from "@/data/site"
import { Section, SectionHeading } from "@/components/common/section"
import { Card } from "@/components/ui/card"

function StatsSection() {
  return (
    <Section className="bg-slate-950 py-20 text-white sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeading
          kicker="Our record"
          title="我们的战绩"
          description="用服务数量、长期管理和客户反馈，持续验证每一次上门的稳定性。"
          kickerClassName="text-blue-200"
          descriptionClassName="text-slate-300"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="hover-lift animate-scale-in rounded-xl border-white/10 bg-white/[0.08] p-8 text-white shadow-none hover:shadow-lg hover:shadow-blue-950/25"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="text-4xl font-semibold tracking-[-0.04em]">
                {stat.value}
              </div>
              <div className="mt-3 text-sm text-slate-300">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { StatsSection }
