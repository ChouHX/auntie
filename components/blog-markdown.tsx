import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type BlogMarkdownProps = {
  className?: string
  imageClassName?: string
  value: string
}

function BlogMarkdown({ className, imageClassName, value }: BlogMarkdownProps) {
  const blocks = parseMarkdownBlocks(value)

  if (!blocks.length) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        暂无内容
      </div>
    )
  }

  return (
    <div
      className={cn(
        "space-y-4 text-base leading-8 text-slate-700 dark:text-slate-200",
        className
      )}
    >
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        if (block.type === "heading") {
          const Heading = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4"
          return (
            <Heading
              className={cn(
                "pt-2 font-semibold tracking-[-0.025em] text-slate-950 dark:text-white",
                block.level === 1 && "text-3xl",
                block.level === 2 && "text-2xl",
                block.level >= 3 && "text-xl"
              )}
              key={key}
            >
              {renderInlineMarkdown(block.text)}
            </Heading>
          )
        }

        if (block.type === "image") {
          return (
            <figure className="my-6 overflow-hidden rounded-xl bg-muted/35" key={key}>
              <img
                alt={block.alt}
                className={cn("max-h-[560px] w-full object-contain", imageClassName)}
                decoding="async"
                loading="lazy"
                src={block.src}
              />
            </figure>
          )
        }

        if (block.type === "list") {
          return (
            <ul className="space-y-2 pl-0" key={key}>
              {block.items.map((item, itemIndex) => (
                <li className="flex gap-3" key={`${key}-${itemIndex}`}>
                  <span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === "quote") {
          return (
            <blockquote
              className="border-l-2 border-primary/45 pl-4 text-slate-600 dark:text-slate-300"
              key={key}
            >
              {renderInlineMarkdown(block.text)}
            </blockquote>
          )
        }

        return <p key={key}>{renderInlineMarkdown(block.text)}</p>
      })}
    </div>
  )
}

type MarkdownBlock =
  | { level: number; text: string; type: "heading" }
  | { alt: string; src: string; type: "image" }
  | { items: string[]; type: "list" }
  | { text: string; type: "paragraph" }
  | { text: string; type: "quote" }

function parseMarkdownBlocks(value: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = value.split("\n")
  let paragraph: string[] = []
  let listItems: string[] = []

  function flushParagraph() {
    if (!paragraph.length) {
      return
    }
    blocks.push({ text: paragraph.join(" "), type: "paragraph" })
    paragraph = []
  }

  function flushList() {
    if (!listItems.length) {
      return
    }
    blocks.push({ items: listItems, type: "list" })
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        alt: imageMatch[1] || "",
        src: imageMatch[2].trim(),
        type: "image",
      })
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        level: headingMatch[1].length,
        text: headingMatch[2],
        type: "heading",
      })
      continue
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph()
      listItems.push(trimmed.replace(/^-\s+/, ""))
      continue
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph()
      flushList()
      blocks.push({ text: trimmed.replace(/^>\s+/, ""), type: "quote" })
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  return blocks
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)

  return parts.map((part, index) => {
    const key = `${part}-${index}`
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong className="font-semibold text-slate-950 dark:text-white" key={key}>
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (linkMatch) {
      return (
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={linkMatch[2]}
          key={key}
          rel="noreferrer"
          target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
        >
          {linkMatch[1]}
        </a>
      )
    }

    return <span key={key}>{part}</span>
  })
}

export { BlogMarkdown }
