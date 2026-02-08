# SquashIQ Testing Checklist

**Dev Server:** http://localhost:5173

## ✅ Phase 1: First Launch & Onboarding (5 min)

### Onboarding Flow
- [ ] Open http://localhost:5173 in browser
- [ ] Verify 3-screen onboarding appears
- [ ] Screen 1: "Log matches in 60 seconds" with ⚡ icon
- [ ] Screen 2: "Discover what makes you win" with 📊 icon
- [ ] Screen 3: "Track your improvement" with 📈 icon
- [ ] Test swipe/drag between screens
- [ ] Click "Get Started" button
- [ ] Verify onboarding doesn't show again on refresh

### Empty States
- [ ] Dashboard shows "Welcome to SquashIQ!" with CTA
- [ ] Timeline tab shows empty state with timeline illustration
- [ ] Rivals tab shows empty state with rivalry illustration
- [ ] Profile tab loads correctly
- [ ] Bottom tab bar visible with 5 tabs (Dashboard, Log, Timeline, Rivals, Profile)
- [ ] Log tab (center) has accent color

---

## ✅ Phase 2: Core Match Logging Flow (10 min)

### Add Opponent & Venue
- [ ] Go to Profile tab
- [ ] Click "Add Opponent"
- [ ] Enter name (e.g., "Alex")
- [ ] Add emoji (e.g., "🎾")
- [ ] Save opponent
- [ ] Click "Add Venue"
- [ ] Enter name (e.g., "Downtown Squash Club")
- [ ] Toggle "Home Court" on
- [ ] Save venue

### Log First Match - Step 1 (Setup)
- [ ] Click "Log Match" (center tab bar button)
- [ ] Tab bar hides
- [ ] Step indicator shows "1 of 3"
- [ ] Select opponent (Alex)
- [ ] Date/time auto-filled with current time
- [ ] Select venue (Downtown Squash Club)
- [ ] Format selector: Best of 3 / Best of 5
- [ ] "Next" button enabled after opponent selected
- [ ] Click "Next"

### Log First Match - Step 2 (Scores)
- [ ] Step indicator shows "2 of 3"
- [ ] 3 game cards shown (for Best of 3)
- [ ] Test +/- buttons for score entry
- [ ] Test quick presets: "11-0", "11-5", "11-8", "11-9"
- [ ] Enter scores: Game 1: 11-5, Game 2: 9-11, Game 3: 11-8
- [ ] Verify tight game indicator (🔥) appears when both scores >= 8
- [ ] Match result banner shows "WIN 2-1" in green
- [ ] Click "Next"

### Log First Match - Step 3 (Tags & Save)
- [ ] Step indicator shows "3 of 3"
- [ ] Energy Level: select "High"
- [ ] Match Vibe: select "Intense"
- [ ] Quick Tags: select "Good day", "Close"
- [ ] Add note: "Great comeback win"
- [ ] "Save Match" button large and green
- [ ] Click "Save Match"

### Post-Match Screen
- [ ] Win confetti animation plays
- [ ] Device vibrates (if supported)
- [ ] Result shows "WIN 2-1 vs Alex"
- [ ] Streak info appears (if applicable)
- [ ] Recommendation card displays with emoji, headline, context
- [ ] "Add Rally Details" option visible
- [ ] Click "Done"

---

## ✅ Phase 3: Dashboard & Insights (15 min)

### Dashboard Content
- [ ] Returns to Dashboard
- [ ] Tab bar visible again
- [ ] Header shows overall record "1W - 0L"
- [ ] Recent form shows: W (green)
- [ ] Pinned recommendation card at top (from last match)
- [ ] Match history list shows first match
- [ ] Match card displays: opponent emoji/name, "Today", "W 2-1", scores "11-5, 9-11, 11-8"
- [ ] Tight game has 🔥 emoji next to score

### Insight Cards - Progressive Unlocking
- [ ] Most insight cards show "locked" state
- [ ] Lock icon, dimmed overlay
- [ ] Progress text: "Log X more matches to unlock"
- [ ] Progress bar showing how close to unlock

### Log More Matches (to unlock insights)
**Log at least 10 matches with variety:**
- [ ] Different opponents (add 2-3 more)
- [ ] Different venues (add 1-2 more)
- [ ] Mix of wins and losses
- [ ] Different energy levels and vibes
- [ ] Some tight games (both scores >= 8)
- [ ] Some deciding games (Game 3 or Game 5)

### Check Insight Unlocks
After logging 10+ matches, verify these insights unlock:
- [ ] **Win Rate by Opponent** (min 3 matches) - horizontal bar chart
- [ ] **Energy Impact** (min 5 matches) - energy level vs win rate
- [ ] **Day of Week Performance** (min 10 matches) - best days chart
- [ ] **Venue Effect** (min 5 matches, 2+ venues) - venue comparison
- [ ] **Deciding Game Performance** (min 8 deciding games) - clutch rating
- [ ] **Comeback Index** (min 10 matches) - gauge meter
- [ ] **Current Form** (min 10 matches) - sparkline chart
- [ ] **Fast Starter Rating** (min 8 matches) - Game 1 conversion

### Insight Animations
- [ ] First time an insight unlocks, slide-up animation plays
- [ ] Glow border effect on newly unlocked card
- [ ] Animation only plays once per insight

---

## ✅ Phase 4: Match Management (10 min)

### Match Detail View
- [ ] Click any match card from history
- [ ] Match detail page opens
- [ ] Shows: opponent, date, venue, format, result
- [ ] All game scores displayed
- [ ] Tags shown: energy, vibe, quick tags
- [ ] Match note displayed
- [ ] Recommendation text visible
- [ ] Back button returns to Dashboard

### Edit Match
- [ ] Click "Edit" on match detail
- [ ] Score editing with +/- buttons works
- [ ] Tag/vibe/energy/note editing works
- [ ] Click "Save"
- [ ] Changes persist
- [ ] Navigate back and verify changes

### Delete Match
- [ ] Click "Delete" on match detail
- [ ] Confirmation dialog appears
- [ ] Click "Confirm"
- [ ] Match removed from database
- [ ] Navigates back to Dashboard
- [ ] Match no longer in history

---

## ✅ Phase 5: Rally Analysis (10 min)

### Rally Pattern Analyzer
- [ ] Log a new match
- [ ] On post-match screen, click "Add Rally Details"
- [ ] Full-screen overlay with 5 cards
- [ ] Progress dots at bottom (1-5)

### Card Flow
- [ ] **Card 1:** "How did you win most points?" - select one
- [ ] **Card 2:** "How did you lose most points?" - select one
- [ ] **Card 3:** "Average rally length felt like..." - select one
- [ ] **Card 4:** "Your court coverage today?" - select one
- [ ] **Card 5:** "Which shot felt best today?" - select up to 2
- [ ] Test swipe/drag navigation between cards
- [ ] "Skip" button works on each card
- [ ] Click "Done" on final card

### Rally Insights (after 5+ rally analyses)
- [ ] Dashboard shows new rally insight cards:
  - [ ] **Play Style Classification** - archetype based on rally data
  - [ ] **Win Method Distribution** - donut chart
  - [ ] **Loss Method Distribution** - donut chart with improvement suggestion
  - [ ] **Best Shot Trends** - bubble chart

---

## ✅ Phase 6: Timeline Features (10 min)

### Win/Loss River Chart
- [ ] Navigate to Timeline tab
- [ ] Time range selector at top (Last 30 days, 3 months, 6 months, All time)
- [ ] Win/Loss River chart displays
- [ ] Green area above 0 (winning streaks)
- [ ] Red area below 0 (losing periods)
- [ ] Hover/tap data points shows tooltip
- [ ] Test time range filter

### Rolling Win Rate Chart
- [ ] After 10+ matches, this chart unlocks
- [ ] Line chart showing win rate over time
- [ ] 50% baseline marked
- [ ] Green shading above 50%, red below

### Activity Heatmap
- [ ] GitHub-style calendar grid
- [ ] Last 3 months shown
- [ ] Cell colors: dark gray (0 matches), light green (1), bright green (2+)
- [ ] Day labels (Mon, Wed, Fri)
- [ ] Month labels on top
- [ ] Tap a cell shows matches played that day

### Regularity Streak
- [ ] Shows "X week streak - keep it going!"
- [ ] Or "Your X-week streak ended. Start a new one today!"

### Milestones
- [ ] Milestone dots on Win/Loss River chart
- [ ] Scrollable milestone list below heatmap
- [ ] Types: first win vs opponent, win streaks, match milestones, win rate thresholds

---

## ✅ Phase 7: Pressure & Gamification (15 min)

### 8-8+ Index (Clutch Rating)
- [ ] After 5+ tight games, insight card appears
- [ ] Large animated number (0-100)
- [ ] Rating label: Cold/Neutral/Hot/Ice Veins
- [ ] Trend arrow: up/down/flat
- [ ] Clutch by Opponent breakdown table
- [ ] Clutch by Game Number breakdown

### Badges System
- [ ] Go to Profile tab
- [ ] Badge grid displays 5 badges:
  - [ ] Ice Veins (win 5+ tight games in a row)
  - [ ] Clutch King (8-8+ Index > 80 for 10+ tight games)
  - [ ] Comeback Artist (win after 0-2 down with tight game)
  - [ ] Heartbreaker (win 3+ tight games in Bo5)
  - [ ] Pressure Cooker (play 5+ tight games in one week)
- [ ] Earned badges: full color with rarity label and date
- [ ] Unearned badges: grayed out with criteria text
- [ ] Toast notification when badge earned (after match)

### Player Archetype
- [ ] After 10 matches + 5 rally analyses:
- [ ] Archetype card on Profile
- [ ] Shows: name, description, strength, growth area
- [ ] Radar chart with 6 traits (aggression, fitness, consistency, clutch, adaptability, deception)
- [ ] Secondary archetype shown if within 10%
- [ ] Evolution timeline showing archetype changes

---

## ✅ Phase 8: Rivals & Leaderboards (10 min)

### Rivals List
- [ ] Navigate to Rivals tab
- [ ] All opponents listed by matches played
- [ ] Each row: emoji, name, H2H record, last result
- [ ] Tap opponent opens rivalry page

### Rivalry Detail Page
- [ ] Header: both player emojis/names, all-time record
- [ ] Last 5 H2H results as colored dots
- [ ] Score History: line chart showing H2H over time
- [ ] Key Stats: current streak, best streak, tight games record, avg games per match, common score
- [ ] Best Win card (most dominant)
- [ ] Worst Loss card (biggest deficit)
- [ ] Fun Facts section (1-2 auto-generated facts)

### Leaderboards
- [ ] On Rivals tab, find leaderboard section
- [ ] 8 categories: Overall Record, Iron Man, Clutch King, Comeback Kid, Hot Streak, Consistency Crown, Most Improved, Rivalry Dominator
- [ ] Tap category pill to switch
- [ ] Ranked list with: position, emoji/name, metric value
- [ ] Current user stats included

---

## ✅ Phase 9: Special Features (10 min)

### Match of the Month
- [ ] After 4+ matches in a month, card appears on Dashboard
- [ ] Auto-generated title (e.g., "The Alex Thriller")
- [ ] Dramatic emoji
- [ ] Match details
- [ ] Dismissible

### On This Day
- [ ] If a match occurred exactly 1/3/6/12 months ago today
- [ ] Card on Dashboard: "X months ago today, you won/lost..."
- [ ] Dismissible

### Season Wrapped
- [ ] After 20+ matches, button appears on Profile
- [ ] Click "Season Wrapped"
- [ ] 6 swipeable full-screen cards:
  - [ ] **Card 1:** Your Quarter in Numbers
  - [ ] **Card 2:** Win Rate Journey (sparkline)
  - [ ] **Card 3:** Biggest Rival (most-played opponent)
  - [ ] **Card 4:** Best Month (highest win rate month)
  - [ ] **Card 5:** Clutch Moments (tight games stats)
  - [ ] **Card 6:** Headline Stat (standout achievement)
- [ ] Each card has "Share" button
- [ ] Click Share: generates 1080x1920 image
- [ ] Native share API or download fallback
- [ ] SquashIQ watermark on image

---

## ✅ Phase 10: Settings & Data Management (10 min)

### Profile Settings
- [ ] On Profile tab, find Settings section
- [ ] **Player Name Edit:** click to edit, save/cancel buttons
- [ ] **Tight Game Threshold:** number input (default 8)
- [ ] Changes save and persist

### Data Export
- [ ] Click "Export Data" button
- [ ] JSON file downloads or share sheet opens
- [ ] Filename: `squashiq-backup-{date}.json`
- [ ] Open file, verify structure:
  - [ ] version, exportDate
  - [ ] players, venues, matches, games, rally_analyses arrays

### Data Import
- [ ] Click "Import Data" button
- [ ] File picker opens
- [ ] Select exported JSON file
- [ ] Confirmation dialog: "This will merge with your existing data. Continue?"
- [ ] Click "Confirm"
- [ ] Data imported successfully
- [ ] Duplicates skipped (by id)
- [ ] All imported data visible in app

### Backup Reminder
- [ ] Log 10+ matches since last export
- [ ] Green banner appears on Dashboard
- [ ] Text: "Back up your data — you have logged X matches since your last export"
- [ ] Dismissible

### App Version
- [ ] Scroll to bottom of Settings
- [ ] App version displayed (e.g., "1.0.0")

---

## ✅ Phase 11: Mobile & PWA Testing (if available)

### iOS PWA Installation
- [ ] Open http://localhost:5173 on iPhone Safari
- [ ] Tap Share button
- [ ] Tap "Add to Home Screen"
- [ ] SquashIQ icon appears on home screen
- [ ] Tap icon to launch
- [ ] Opens fullscreen (no Safari UI)
- [ ] Status bar style: black-translucent
- [ ] Bottom tab bar respects safe area insets

### Offline Functionality
- [ ] With app installed, enable Airplane Mode
- [ ] Launch SquashIQ from home screen
- [ ] App loads (cached by service worker)
- [ ] Can navigate between cached pages
- [ ] Cannot log new matches (requires online for first load)

### Mobile UX
- [ ] All buttons min 48px touch targets
- [ ] Swipe gestures work smoothly
- [ ] Scrolling smooth on all pages
- [ ] No horizontal scrollbars
- [ ] Text readable without zoom
- [ ] Forms accessible with virtual keyboard

---

## ✅ Phase 12: Edge Cases & Error Handling

### Validation
- [ ] Try logging match without opponent → "Next" button disabled
- [ ] Try saving match with invalid scores (e.g., 11-10) → validation error
- [ ] Try editing player with empty name → error
- [ ] Try importing invalid JSON → error message

### Data Integrity
- [ ] Delete opponent with matches → (test current behavior)
- [ ] Delete venue with matches → (test current behavior)
- [ ] Edit match then delete → no orphaned game records

### Performance
- [ ] After 50+ matches:
  - [ ] Dashboard loads quickly
  - [ ] Insights render without lag
  - [ ] Match history scrolls smoothly
  - [ ] Charts render quickly

---

## 🐛 Bug Tracking

Use this section to note any issues found:

### Critical Bugs
- [ ]

### Minor Issues
- [ ]

### UI/UX Improvements
- [ ]

### Performance Notes
- [ ]

---

## ✅ Final Checklist

- [ ] All 41 user stories tested
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Data export/import works
- [ ] All animations smooth
- [ ] Mobile responsive
- [ ] Ready for production deployment

---

**Testing Completed:** ___________
**Tested By:** ___________
**Overall Status:** ⬜ Pass / ⬜ Fail / ⬜ Needs Work
