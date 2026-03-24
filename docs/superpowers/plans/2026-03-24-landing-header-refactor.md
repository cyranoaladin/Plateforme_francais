# Landing Header Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the homepage header into a premium floating navigation that aligns visually with the landing hero.

**Architecture:** Keep the current `StickyNav` behavior and public IA, but upgrade its shell, typography, spacing, and CTA styling. Reuse existing design tokens and the loaded display font instead of introducing a separate header-specific palette.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS 4, global tokens in `globals.css`.

---

### Task 1: Refine the landing header component

**Files:**
- Modify: `src/components/landing/StickyNav.tsx`

- [ ] **Step 1: Update the structure for a centered floating shell**

Move from a plain full-width bar to a framed container with better spacing and a premium silhouette.

- [ ] **Step 2: Strengthen the brand presentation**

Use the existing display font variable for the `Nexus Réussite` wordmark and tighten the logo/text alignment.

- [ ] **Step 3: Rework nav link and CTA styling**

Make links lighter and more refined, and make the CTA more intentional and premium without changing the copy.

### Task 2: Verify behavior and visual integrity

**Files:**
- Test: `src/components/landing/StickyNav.tsx`

- [ ] **Step 1: Run build verification**

Run: `npm run build`
Expected: build succeeds with the updated header.

- [ ] **Step 2: Run a browser check on desktop and mobile**

Use Playwright to inspect the live homepage and confirm the header remains legible, premium, and correctly aligned with the hero.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-03-24-landing-header-design.md docs/superpowers/plans/2026-03-24-landing-header-refactor.md src/components/landing/StickyNav.tsx
git commit -m "fix(design): refine landing header presentation"
```
