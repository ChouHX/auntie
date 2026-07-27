import { ChevronRight } from "lucide-react"
import { Link } from "@/lib/router-compat"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CmsBlogPost } from "@/types/cms"

type BlogProps = {
  posts: CmsBlogPost[]
}

function Blog({ posts }: BlogProps) {
  const blogPosts = posts
    .filter((post) => post.status === "published")
    .toSorted((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-14 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
            Latest articles
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">
            清洁服务笔记
          </h2>
        </div>
        <Select defaultValue="recommended">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">推荐阅读</SelectItem>
            <SelectItem value="latest">最新发布</SelectItem>
            <SelectItem value="popular">最多查看</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {blogPosts.map((post) => (
          <Card
            className="grid h-full gap-0 overflow-hidden rounded-xl bg-card/84 py-0 shadow-lg shadow-blue-100/45 sm:grid-cols-[220px_minmax(0,1fr)] dark:bg-slate-900/80 dark:shadow-blue-950/25"
            key={post.title}
            id={post.slug}
          >
            <CardHeader className="p-0">
              <Link
                aria-label={post.title}
                className="block focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none"
                to={`/blog/${post.slug}`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-blue-50/70 sm:h-full sm:min-h-44 dark:border-white/10 dark:bg-slate-950">
                  <img
                    alt={post.title}
                    className="h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={post.image}
                    style={{ objectPosition: post.imagePosition ?? "50% 50%" }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/82 via-slate-950/34 to-transparent px-4 pt-12 pb-4 text-white">
                    <h3 className="line-clamp-2 text-base leading-snug font-semibold tracking-[-0.025em] sm:text-lg">
                      {post.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </CardHeader>
            <CardContent className="flex min-w-0 flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-50 text-blue-700 shadow-none hover:bg-blue-50 dark:bg-blue-500/15 dark:text-blue-200">
                  {post.category}
                </Badge>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground dark:text-slate-300">
                {post.description}
              </p>

              <Link
                className="mt-auto inline-flex items-center gap-1.5 self-end pt-4 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-blue-200 dark:hover:text-blue-100"
                to={`/blog/${post.slug}`}
              >
                阅读更多 <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default Blog
