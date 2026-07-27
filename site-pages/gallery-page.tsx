import { ImageGallery } from "@/components/image-gallery"
import { PageHero } from "@/components/common/page-hero"
import { Section } from "@/components/common/section"
import { useCmsContent } from "@/hooks/use-cms-content"
import { useI18n } from "@/lib/i18n"

function GalleryPage() {
  const { content } = useCmsContent(["galleryItems"])
  const { language } = useI18n()
  const copy =
    language === "zh"
      ? {
          kicker: "Service gallery",
          title: "服务画廊",
          description:
            "这里用于展示服务现场、清洁前后对比或视频封面等图片内容。",
        }
      : {
          kicker: "Service gallery",
          title: "Service gallery",
          description:
            "This gallery is for service scenes, before-and-after photos, and video covers.",
        }

  return (
    <>
      <PageHero
        kicker={copy.kicker}
        title={copy.title}
        description={copy.description}
      />
      <Section className="py-8 sm:py-16" id="gallery">
        <ImageGallery items={content.galleryItems} />
      </Section>
    </>
  )
}

export { GalleryPage }
