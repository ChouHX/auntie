# Animation implementation plans

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Rebuild the FAQ as one responsive help workspace](001-faq-layout-and-accordion-motion.md) | HIGH | DONE |

## Recommended execution order

1. Execute plan 001. Its accordion state, motion, Hero composition, service
   anchor, and sticky layout changes are interdependent and should be reviewed
   as one user workflow.

## Dependencies

- Plan 001 has no package dependency and must not add one.
- Preserve the default shared accordion animation for non-FAQ call sites.
- The plan is stamped against commit `8260d66` in a dirty worktree; the
  executor must preserve unrelated uncommitted changes.
