import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react"
import { useLocation } from "@/lib/router-compat"

type PageTransitionProps = {
  children: ReactNode
}

const revealSelector = [
  "section",
  ".animate-fade-up",
  ".animate-fade-up-delay-1",
  "[data-scroll-reveal]",
].join(",")

function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (location.hash) {
      let cancelled = false
      let attempts = 0
      let timerId = 0
      const targetId = decodeHashId(location.hash)

      function scrollToHashTarget() {
        if (cancelled) {
          return
        }

        const target = targetId ? document.getElementById(targetId) : null

        if (target) {
          target.scrollIntoView({ block: "start" })
          return
        }

        attempts += 1

        if (attempts < 20) {
          timerId = window.setTimeout(scrollToHashTarget, 50)
        }
      }

      timerId = window.setTimeout(scrollToHashTarget, 0)

      return () => {
        cancelled = true
        window.clearTimeout(timerId)
      }
    }

    window.scrollTo({ left: 0, top: 0 })
  }, [location.hash, location.pathname])

  useLayoutEffect(() => {
    const root = mainRef.current

    if (!root) {
      return
    }

    const revealRoot = root
    let frameId = 0
    let observer: IntersectionObserver | null = null
    const observedElements = new Set<HTMLElement>()

    function shouldReveal(element: HTMLElement) {
      return (
        revealRoot.contains(element) &&
        !element.closest(
          "[data-scroll-reveal='false'], [data-no-scroll-reveal]"
        )
      )
    }

    function reveal(element: HTMLElement) {
      element.classList.add("is-scroll-revealed")
      observer?.unobserve(element)
    }

    function prepareRevealTargets() {
      const elements = Array.from(
        revealRoot.querySelectorAll<HTMLElement>(revealSelector)
      ).filter(shouldReveal)

      elements.forEach((element, index) => {
        if (observedElements.has(element)) {
          return
        }

        element.classList.add("scroll-reveal-item")
        element.style.setProperty(
          "--scroll-reveal-delay",
          `${Math.min((index % 6) * 45, 180)}ms`
        )
        observedElements.add(element)

        if (observer) {
          observer.observe(element)
          return
        }

        reveal(element)
      })
    }

    function schedulePrepareRevealTargets() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(prepareRevealTargets)
    }

    if (!("IntersectionObserver" in window)) {
      prepareRevealTargets()
      return () => window.cancelAnimationFrame(frameId)
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement)
          }
        })
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      }
    )

    const mutationObserver = new MutationObserver(schedulePrepareRevealTargets)

    prepareRevealTargets()
    mutationObserver.observe(revealRoot, {
      childList: true,
      subtree: true,
    })
    const mutationObserverTimer = window.setTimeout(() => {
      mutationObserver.disconnect()
    }, 1600)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(mutationObserverTimer)
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [location.pathname])

  return (
    <main ref={mainRef} key={location.pathname} className="animate-page-enter">
      {children}
    </main>
  )
}

function decodeHashId(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""))
  } catch {
    return hash.replace(/^#/, "")
  }
}

export { PageTransition }
