import { ArrowRight } from "lucide-react"
import { Link } from "@/lib/router-compat"

import { Section, SectionHeading } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"

function BlogPreviewSection() {
  const { content } = useCmsContent(["blogPosts"])
  const { dict } = useI18n()
  const posts = content.blogPosts
    .filter((post) => post.status === "published")
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 4)

  if (!posts.length) {
    return null
  }

  return (
    <Section className="py-12 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          kicker={dict.blogPreview.kicker}
          title={dict.blogPreview.title}
          description={dict.blogPreview.description}
          className="max-w-3xl"
        />
        <Button asChild className="w-fit px-5" variant="outline">
          <Link to="/blog">
            {dict.blogPreview.viewAll}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {posts.map((post) => (
          <Card
            className="overflow-hidden rounded-xl bg-card/84 shadow-md shadow-blue-100/35 dark:bg-white/[0.055] dark:shadow-none"
            key={post.id}
          >
            <Link
              className="group grid grid-cols-[112px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[136px_minmax(0,1fr)]"
              to={`/blog/${post.slug}`}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-blue-50 dark:bg-slate-900">
                <img
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                  src={post.image}
                  style={{ objectPosition: post.imagePosition ?? "50% 50%" }}
                />
              </div>
              <div className="flex min-w-0 flex-col py-0.5">
                <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-200">
                  {post.category}
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm leading-5 font-semibold text-slate-950 transition-colors group-hover:text-blue-700 sm:text-base sm:leading-6 dark:text-white dark:group-hover:text-blue-200">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {post.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-blue-700 dark:text-blue-200">
                  {dict.blogPreview.readMore}
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export { BlogPreviewSection }
