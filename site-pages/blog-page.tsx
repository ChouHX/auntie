import { BlogMarkdown } from "@/components/blog-markdown"
import Blog from "@/components/blog"
import { Section } from "@/components/common/section"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useCmsContent } from "@/hooks/use-cms-content"
import type { CmsBlogPost } from "@/types/cms"
import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "@/lib/router-compat"

function BlogPage() {
  const { content } = useCmsContent(["blogPosts"])

  return <Blog posts={content.blogPosts} />
}

function BlogDetailPage() {
  const { slug } = useParams()
  const { content, isLoading } = useCmsContent(["blogPosts"])
  const posts = content.blogPosts
    .filter((post) => post.status === "published")
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
  const post = posts.find((item) => item.slug === slug || item.id === slug)

  if (!post) {
    return (
      <Section className="pt-28 sm:pt-32">
        <Card className="mx-auto max-w-2xl rounded-xl bg-card/84 p-6 text-center shadow-xl shadow-blue-100/45 dark:bg-slate-900/80 dark:shadow-blue-950/25">
          <div className="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-200">
            Blog
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">
            {isLoading ? "正在加载文章..." : "文章不存在"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {isLoading
              ? "请稍候，正在读取博客内容。"
              : "这篇文章可能已下架，或链接地址不正确。"}
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-200"
            to="/blog"
          >
            <ArrowLeft className="size-4" />
            返回博客列表
          </Link>
        </Card>
      </Section>
    )
  }

  const relatedPosts = posts.filter((item) => item.id !== post.id).slice(0, 3)

  return (
    <article>
      <Section className="pt-28 pb-10 sm:pt-32 sm:pb-12">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-200"
          to="/blog"
        >
          <ArrowLeft className="size-4" />
          返回博客列表
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700 shadow-none hover:bg-blue-50 dark:bg-blue-500/15 dark:text-blue-200">
                {post.category}
              </Badge>
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl leading-tight font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
              {post.description}
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100/80 bg-blue-50/70 shadow-xl shadow-blue-100/45 dark:border-white/10 dark:bg-slate-950 dark:shadow-blue-950/25">
              <img
                alt={post.title}
                className="aspect-[16/9] w-full object-cover"
                decoding="async"
                fetchPriority="high"
                src={post.image}
                style={{ objectPosition: post.imagePosition ?? "50% 50%" }}
              />
            </div>

            <MarkdownArticle post={post} />
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-blue-100/80 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.035]">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                继续阅读
              </h2>
              <div className="mt-4 divide-y divide-blue-100/80 dark:divide-white/10">
                {relatedPosts.length ? (
                  relatedPosts.map((item) => (
                    <Link
                      className="group flex gap-3 py-3 first:pt-0 last:pb-0"
                      key={item.id}
                      to={`/blog/${item.slug}`}
                    >
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-blue-50 dark:bg-slate-900">
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={item.image}
                          style={{
                            objectPosition: item.imagePosition ?? "50% 50%",
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-blue-700 dark:text-blue-200">
                          {item.category}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm leading-6 font-semibold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-200">
                          {item.title}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-muted-foreground">
                    暂无更多文章。
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </article>
  )
}

function MarkdownArticle({ post }: { post: CmsBlogPost }) {
  const content = post.content.trim() || post.description

  return (
    <div className="mt-10 max-w-3xl">
      <BlogMarkdown value={content} />
    </div>
  )
}

export { BlogDetailPage, BlogPage }
