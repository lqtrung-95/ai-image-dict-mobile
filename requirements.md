# AI Image Dictionary — Mobile App Requirements

Cross-platform mobile app (iOS & Android).

---

## 1. Authentication
- Sign up with email/password
- Login with email/password
- Social login (Google, etc.)
- Forgot password / reset password
- Stay logged in across app restarts

---

## 2. Photo Capture & Analysis (Core Feature)
- Open native camera to take a photo
- Pick an image from device photo library
- Send image to AI for analysis
- Display results:
  - Scene description
  - Detected objects with Chinese (汉字), Pinyin, English, HSK level, example sentence
  - Colors and actions found in the scene
- Show remaining daily analysis quota
- Unauthenticated users get 2 free trial analyses

---

## 3. Vocabulary Library
- View all saved words (searchable, filterable)
- Tap a word to see full detail: Chinese, Pinyin, English, example sentence, HSK level
- Play pronunciation (TTS) from word detail
- Save words from an analysis result
- Delete words
- Mark words as learned

---

## 4. Text-to-Speech
- Tap any Chinese word to hear pronunciation
- Uses device TTS as fallback when network is unavailable

---

## 5. Vocabulary Lists
- Create named, colored personal lists
- Add words to lists
- View and browse words within a list
- Track progress per list (learned / total)
- Delete lists

---

## 6. Analysis History
- Browse past photo analyses (thumbnail grid)
- Tap to view full analysis detail (image + all detected words)
- Delete a past analysis

---

## 7. Photo Stories
- Create a story by grouping past analyses
- Give it a title and optional description
- Cover photo auto-selected from first photo
- Browse and view all personal stories
- Delete a story

---

## 8. Spaced Repetition Practice
- Flashcard session showing due words
- Flip card to reveal Pinyin + English
- Rate each card: Again / Hard / Good / Easy
- App calculates next review date using SM-2 algorithm
- Shows next review interval preview per rating before user chooses

---

## 9. Quiz Modes
- Multiple choice: pick the correct English meaning for a Chinese word
- Listening: hear audio, identify the correct word
- Type Pinyin: type the Pinyin for a displayed Chinese word

---

## 10. Games
- Matching game: pair Chinese characters with English meanings
- Quiz game: rapid-fire multiple choice rounds

---

## 11. Community Courses
- Browse community-created vocabulary courses
- Filter by HSK level, sort by newest / popular / top rated
- Search by name
- Subscribe to a course
- Track personal progress through a subscribed course
- Rate a course (1–5 stars)
- Create your own course (title, description, difficulty, cover image, word list)

---

## 12. Vocabulary Import
- Import from a URL (AI extracts Chinese words from web article)
- Import from pasted Chinese text
- Preview extracted words, select which to save

---

## 13. Export
- Export vocabulary as Anki deck file (`.apkg`), shareable from device

---

## 14. Progress & Stats
- Current streak and longest streak
- Total words vs. mastered words
- Words due today with shortcut to start review
- Word state breakdown: new / learning / reviewing / mastered
- HSK level distribution
- Activity heatmap (12-week)
- Review forecast for next 7 days
- Words added per day chart

---

## 15. Daily Goals
- Set a daily review word count goal
- Progress widget showing today's completion

---

## 16. Word of the Day
- Featured word shown on the home/dashboard screen each day

---

## 17. Settings & Profile
- Update display name and avatar
- Notification preferences (push reminders to review)
- Export all personal data
- Delete account

---

## 18. Offline Support
- Offline fallback screen when no connection
- Previously loaded vocabulary browsable without internet
- Native camera access (no browser permission prompts)
