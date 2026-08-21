type ModalMotionOptions = {
  initial: { opacity: number; x: string; y: string }
  animate: { opacity: number; x: string; y: string }
  exit: { opacity: number; x: string; y: string }
  transition:
    | { duration: number; ease: "easeOut" }
    | {
        damping: number
        mass: number
        stiffness: number
        type: "spring"
      }
}

export function getModalMotion(
  prefersReducedMotion: boolean | null
): ModalMotionOptions {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0, x: "-50%", y: "-50%" },
      animate: { opacity: 1, x: "-50%", y: "-50%" },
      exit: { opacity: 0, x: "-50%", y: "-50%" },
      transition: { duration: 0.12, ease: "easeOut" },
    }
  }

  return {
    // Keep the content at its final scale so text and form controls are not
    // rasterized as a scaled composite layer during or after the transition.
    initial: { opacity: 0, x: "-50%", y: "-44%" },
    animate: { opacity: 1, x: "-50%", y: "-50%" },
    exit: { opacity: 0, x: "-50%", y: "-46%" },
    transition: { damping: 28, mass: 0.8, stiffness: 340, type: "spring" },
  }
}

export function getModalOverlayTransition(
  prefersReducedMotion: boolean | null
) {
  return prefersReducedMotion
    ? ({ duration: 0.12, ease: "easeOut" } as const)
    : ({ duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const)
}
