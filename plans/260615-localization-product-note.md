# Localization — Product Note (deferred)

Date: 2026-06-15
Status: Deferred (post-launch, traction-gated)

## Question
Should we localize the app beyond English to target markets with many Chinese learners (e.g. Vietnam)?

## Key insight: two distinct layers
1. **UI chrome** — buttons/labels/settings ("Study", "Day Streak", "Enroll"). Classic i18n.
2. **Learning content** — word meanings, example-sentence translations, scene descriptions, course glosses, story text. Currently AI-generated in **English** (`word_en`, `sceneDescription`, etc.).

For a Vietnamese learner, **content (#2) is the product; chrome (#1) is decoration.** Users come precisely to avoid English as the bridge language. 中文→Tiếng Việt is also pedagogically stronger (Sino-Vietnamese cognates). UI-only localization = half a product that looks done but doesn't move the needle.

## Recommendation
**Do NOT build before English launch.**
- Strings hardcoded across ~30 screens → i18n retrofit is large, zero payoff pre-validation.
- Content localization = change AI prompts to output target language, add target-language field, re-seed courses with VI glosses, handle TTS → real scope.
- Market unproven. Launch English, instrument install geography first.

**When (v1.x, post-traction):** do BOTH layers together, one market at a time. Half-localized is worse than English-only (signals abandonment).

## Do now (cheap)
- Don't pre-emptively wrap everything in `t()` half-heartedly — adds noise without payoff.
- Treat "Chinese→Vietnamese, fully localized" as a deliberate market-entry vertical with its own plan when revisited.

## Scope checklist for when we revisit (Vietnam)
- [ ] i18n lib + locale switch in settings (device default + manual override)
- [ ] Extract UI strings → translation files
- [ ] AI prompt: target-language output param (definitions, examples, scene desc)
- [ ] DB: target-language gloss field on vocabulary/course items
- [ ] Re-seed public courses with VI glosses
- [ ] TTS unaffected (Chinese audio stays); check VI text rendering/fonts
- [ ] Store listing localization (ASO in vi-VN)

## Unresolved questions
- Which signal threshold (install %, retention from VN) triggers the build?
- Per-user target language vs per-device locale — store on profile?
