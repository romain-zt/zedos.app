---
name: design
description: Product/UI design doctrine — mobile-first responsive layout, accessibility, design tokens, component states, and UX flows for the Next.js app. Use when designing screens, components, or flows, or reviewing UI work. Manager-tier.
disable-model-invocation: true
---

# Design

Use when shaping screens, components, or flows. Mirrors the project UI rules.

## Mobile-first, always

- Start at 320–375px, then scale up. Use responsive Tailwind utilities (`text-base sm:text-lg md:text-xl`).
- Test breakpoints: **320 · 375 · 768 · 1024 · 1440**.
- Touch targets ≥ **44×44px** on mobile.

## Every component covers its states

Design and name all of: **empty · loading · error · success · edge cases** (long text, missing media, slow network). These map directly to the Spec/User Story UX States.

## Accessibility (non-negotiable)

- Semantic HTML first; ARIA only to fill gaps.
- Labels on inputs; alt text on meaningful images; visible focus states.
- Color contrast ≥ WCAG AA; never rely on color alone.
- Keyboard operable; logical tab order.

## Consistency

- Use design tokens (spacing, color, type scale) — no magic numbers.
- Reuse existing components before inventing new ones.
- i18n: never hardcode UI strings; expect text expansion (German/French run long); support RTL if a locale needs it.
- Media renders from S3 URLs with sensible sizes/formats and lazy loading.

## Output

```txt
Design note — <screen/component>

Breakpoints: mobile-first; checked 320/375/768/1024/1440
States: empty / loading / error / success / edge
A11y: semantics · labels · contrast · keyboard
Tokens: <spacing/color/type used>
i18n: strings externalized · expansion/RTL considered
```

## Anti-patterns

- Desktop-first then "make it responsive."
- Missing loading/error/empty states.
- Hardcoded strings, magic spacing, color-only signaling.
- Touch targets under 44px; inaccessible custom controls.
