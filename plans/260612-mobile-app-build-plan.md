# AI Image Dictionary — Build Plan

Stack: Expo (React Native + TypeScript) mobile app. Backend: **reuse existing ai-image-dict backend** — Supabase (auth + Postgres + storage) and the deployed Next.js API routes (Groq vision analysis, SRS, courses, import, export).

## Phases

- [x] **Phase 1 — Foundation & Auth** (done; Google OAuth deferred to dev build — Expo Go redirect quirk)
  - Expo scaffold (SDK 54 for Expo Go compat), expo-router, public-first tabs
  - Supabase JS client with AsyncStorage session persistence
  - Login / signup screens (modal), email auth verified working
- [x] **Phase 2 — Photo Analysis (core)** (code complete, pending device test)
  - Camera + photo library via expo-image-picker → /api/analyze (auth) or /api/analyze-trial (guest, 2 free tracked in AsyncStorage)
  - Analysis result screen: scene description (zh/pinyin/en), word cards by category, TTS via expo-speech, save-to-vocabulary, quota display
- [x] **Phase 3 — Vocabulary Library + TTS** (code complete, pending device test)
  - Vocabulary list: search (zh/pinyin/en, debounced), infinite scroll, pull-to-refresh
  - Expandable word cards: TTS, mark learned/unlearned, delete with confirm
  - Shared TTS service plays in iOS silent mode (expo-audio playback category)
- [x] **Phase 4 — Practice (SRS) + Quizzes + Games** (code complete, pending device test)
  - [x] Practice tab restructured into menu → Flashcards / Quiz / Games (pushed routes with headers)
  - [x] Flashcards: due-words session, flip-to-reveal, Again/Hard/Good/Easy → /api/word-attempts (server SM-2), progress bar, summary
  - [x] Quiz modes: multiple choice, listening (TTS), type-pinyin (tone-insensitive match); answers recorded as SRS attempts
  - [x] Games: matching (5 pairs, tap-to-pair) + rapid fire (30s timed multiple choice)
- [x] **Phase 5 — Lists, History, Stories** (code complete, pending device test)
  - Home tab rebuilt as dashboard with quick-link tiles (guest sees public-only)
  - Lists: browse with word/learned counts, create (name + color), view words (reuses card), delete (long-press)
  - History: photo cards, tap to expand detected words (TTS), delete (long-press)
  - Stories: browse with cover/photo count, create by selecting history photos, delete (long-press)
- [x] **Phase 6 — Progress/Stats, Daily Goals, Word of Day** (code complete, pending device test)
  - Progress screen (Home → Progress): due-today CTA, stat tiles (streak/words/mastered/sessions), mastery bar, word-state breakdown, HSK distribution, 7-day review forecast + words-added charts, pull-to-refresh
  - Daily goal card: set/edit review target (iOS prompt), progress bar from /api/daily-goals
  - Word of the Day card on Home (from user's vocabulary, TTS on tap)
  - NOTE: user dislikes current Story feature (photo grouping) — rework later, possibly AI-generated narrative from selected photos' words
- [x] **Phase 7 — Courses, Import, Export (Anki)** (code complete, pending device test)
  - Courses: browse with search/sort/HSK filter chips + pagination; detail with word list (TTS), subscribe/unsubscribe, 5-star rating; course creation stays web-only for now
  - Import: URL or pasted text → AI extraction → selectable preview (pre-selected, tap to toggle, long-press to hear) → save to vocabulary + optional list
  - Anki export: Profile button downloads TSV from /api/export/anki and opens share sheet (expo-file-system + expo-sharing)
- [x] **Phase 8 — Settings** (code complete, pending device test)
  - Profile tab = settings: edit display name (tap name, iOS prompt), Anki export, full data export (JSON via share sheet), logout, delete account (double confirmation → /api/user/delete)
- [ ] **Deferred to dev build (requires EAS build, not Expo Go):**
  - Push notifications (review reminders)
  - Google login redirect via stable aiimagedict:// scheme + Apple Sign-In (App Store requirement)
  - Offline caching beyond current in-memory state
- [ ] **Backlog / polish:**
  - Story feature rework (AI-generated narrative from photo words)
  - Login flow smoothing, Android prompts for name/goal/list dialogs (iOS-only Alert.prompt today)

## Structure

```
new-ai-image-dict/
├── requirements.md
└── mobile/         # Expo React Native app (talks to existing Supabase + Next.js API)
```
