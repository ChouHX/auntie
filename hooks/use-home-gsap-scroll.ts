import { useLayoutEffect, type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

function useHomeGsapScroll(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current

    if (!root || typeof window === "undefined") {
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let media: gsap.MatchMedia | null = null

    const context = gsap.context(() => {
      animateHero(root)
      animateScrollReveals(root)
      media = animateStory(root)
    }, root)

    return () => {
      media?.revert()
      context.revert()
    }
  }, [rootRef])
}

function animateHero(root: HTMLElement) {
  const hero = root.querySelector<HTMLElement>("[data-gsap-hero]")

  if (!hero) {
    return
  }

  const media = hero.querySelector<HTMLElement>("[data-gsap-hero-media]")

  if (media) {
    gsap.to(media, {
      ease: "none",
      scale: 1.07,
      scrollTrigger: {
        end: "bottom top",
        scrub: 0.9,
        start: "top top",
        trigger: hero,
      },
      yPercent: 10,
    })
  }
}

function animateScrollReveals(root: HTMLElement) {
  const elements = gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]", root)

  elements.forEach((element) => {
    gsap.fromTo(
      element,
      {
        autoAlpha: 0,
        scale: Number(element.dataset.gsapScale ?? 1),
        y: Number(element.dataset.gsapY ?? 32),
      },
      {
        autoAlpha: 1,
        duration: 0.82,
        ease: "power3.out",
        scale: 1,
        scrollTrigger: {
          start: element.dataset.gsapStart ?? "top 82%",
          toggleActions: "play none none reverse",
          trigger: element,
        },
        y: 0,
      }
    )
  })
}

function animateStory(root: HTMLElement) {
  const media = gsap.matchMedia()
  const story = root.querySelector<HTMLElement>("[data-gsap-story]")

  if (!story) {
    return media
  }

  media.add("(min-width: 768px)", () => {
    const pin = story.querySelector<HTMLElement>("[data-gsap-story-pin]")
    const cards = gsap.utils.toArray<HTMLElement>(
      "[data-gsap-story-card]",
      story
    )
    const steps = gsap.utils.toArray<HTMLElement>(
      "[data-gsap-story-step]",
      story
    )

    if (!pin || cards.length === 0) {
      return
    }

    gsap.set(cards, {
      autoAlpha: 0,
      rotateX: 8,
      scale: 0.94,
      transformOrigin: "50% 70%",
      y: 72,
    })
    gsap.set(cards[0], {
      autoAlpha: 1,
      rotateX: 0,
      scale: 1,
      y: 0,
    })
    gsap.set(steps, {
      autoAlpha: 0.42,
      y: 0,
    })
    gsap.set(steps[0], {
      autoAlpha: 1,
    })

    const timeline = gsap.timeline({
      defaults: {
        duration: 0.58,
        ease: "power2.inOut",
      },
      scrollTrigger: {
        anticipatePin: 1,
        end: () => `+=${window.innerHeight * (cards.length + 0.55)}`,
        invalidateOnRefresh: true,
        pin,
        pinReparent: true,
        scrub: 0.85,
        start: "top top",
        trigger: story,
      },
    })

    cards.forEach((card, index) => {
      if (index === 0) {
        timeline.to(card, { duration: 0.3 }, 0)
        return
      }

      timeline
        .to(
          cards[index - 1],
          {
            autoAlpha: 0,
            rotateX: -4,
            scale: 0.965,
            y: -52,
          },
          index
        )
        .to(
          card,
          {
            autoAlpha: 1,
            rotateX: 0,
            scale: 1,
            y: 0,
          },
          index
        )
        .to(
          steps[index - 1],
          {
            autoAlpha: 0.42,
          },
          index
        )
        .to(
          steps[index],
          {
            autoAlpha: 1,
          },
          index
        )
    })

    timeline.to({}, { duration: 0.7 })
  })

  media.add("(max-width: 767px)", () => {
    const cards = gsap.utils.toArray<HTMLElement>(
      "[data-gsap-story-card]",
      story
    )

    gsap.fromTo(
      cards,
      {
        autoAlpha: 0,
        scale: 0.98,
        y: 36,
      },
      {
        autoAlpha: 1,
        duration: 0.72,
        ease: "power3.out",
        scale: 1,
        stagger: 0.1,
        scrollTrigger: {
          start: "top 72%",
          trigger: story,
        },
        y: 0,
      }
    )
  })

  return media
}

export { useHomeGsapScroll }
