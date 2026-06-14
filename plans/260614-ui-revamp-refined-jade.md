# UI Revamp — "Modern Sinologist" (COMPLETE)

> Superseded "Refined Jade" dark concept. Adopted the user's Stitch
> "Modern Sinologist" design system (light + Midnight Ink dark). All ~20
> mobile screens migrated to the theme; verified no slate/purple hex remain.
> Fonts: Noto Serif / Plus Jakarta Sans / Work Sans. Light+dark toggle in Profile.

---

# UI Revamp — "Refined Jade" (original notes)

Goal: remove the generic dark-slate + purple "AI fingerprint", introduce a centralized
theme, depth (double-bezel cards), press physics, and editorial typography.
Stack: React Native / Expo. Principles adapted from taste-skill (web → RN).

## Direction
- Background: true off-black `#0C0D0F` (neutral, not slate-blue)
- Accent: jade/celadon `#4DA67E` (replaces purple `#9333ea`/`#a855f7`)
- One gray family, layered surfaces, hairline borders
- Double-bezel cards (outer shell + inner core), tinted shadows
- Typography: Outfit for Latin; Chinese characters as hero (larger, system CJK)
- Motion: press-scale, staggered fade-up
- Emoji seated in tinted icon chips

## Phases
- [~] **1. Foundation** — theme tokens + primitives (Screen, Card, Tag). No visual regressions.
- [~] **2. Flagship preview** — Home + Word of Day restyled (review gate)
- [ ] **3. Rollout** (batches, each a commit):
  - auth (login/signup)
  - capture + analysis-result
  - vocabulary + lists + list-detail
  - practice menu/flashcards/quiz/games
  - progress + cards (daily goal, bar chart)
  - history + stories + story-detail/create
  - courses + course-detail + import
  - profile/settings
- [ ] **4. Polish** — custom font (Outfit via expo-google-fonts), staggered entry (Reanimated), press physics

## Notes
- Theme is the single source of truth; screens import tokens, no inline hex.
- Keep changes reversible; do not break functionality. Typecheck per batch.
