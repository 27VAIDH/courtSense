# PRD: SquashIQ — Your Squash Brain

## Introduction

SquashIQ is a Progressive Web App (PWA) that turns casual squash sessions into data-driven performance stories. It lets recreational players log matches in under 60 seconds, automatically generates insights from accumulated data, tracks performance trends over time, and provides actionable recommendations — all running locally on-device with zero backend, zero accounts, and zero cost.

**Problem:** Recreational squash players who play regularly with friends have no lightweight way to track match results, spot performance patterns, or know what to work on next. Existing apps are too complex (built for coaches/pros), too generic (not squash-specific), or require paid subscriptions.

**Target User:** "The Competitive Casual" — plays squash 2-4x/week with regular friends, cares about improving but doesn't have a coach, loves friendly competition and banter.

**Tech Stack (fixed):** React 18+ / TypeScript, Tailwind CSS, Zustand, Dexie.js (IndexedDB), Vite, vite-plugin-pwa. **Flexible:** Charting library (Recharts recommended), animation library (Framer Motion recommended), image generation (html2canvas recommended).

## Goals

- Enable match logging in under 60 seconds with one-thumb operation
- Auto-generate performance insights requiring zero manual analysis
- Work fully offline with all data stored locally on-device (IndexedDB)
- Install as PWA from a shared URL — no app store, no signup
- Provide one clear, actionable recommendation after every match
- Visualize improvement over time to keep players motivated
- Support friendly, non-toxic competition among friend groups
- Assign dynamic play-style archetypes that evolve with the player
- Dark mode first, mobile-first (iPhone Safari primary target)

## User Stories

Stories are organized in build-dependency order across 4 phases. Phase 1 (P0) should be completed first. Each story is scoped for one focused implementation session.

---

### PHASE 0: Foundation

---

### US-001: Project Scaffolding
**Description:** As a developer, I need the project initialized with the correct tech stack so that all subsequent features can be built on a solid foundation.

**Acceptance Criteria:**
- [ ] Vite project created with React + TypeScript template in the project root (not inside `ralph/`)
- [ ] Tailwind CSS v4 installed and configured (with PostCSS and Autoprefixer)
- [ ] Zustand installed for state management
- [ ] Dexie.js installed for IndexedDB
- [ ] Framer Motion installed for animations
- [ ] A charting library installed (Recharts or similar)
- [ ] html2canvas installed for shareable image generation
- [ ] React Router DOM installed for client-side routing
- [ ] `tsconfig.json` configured with strict mode and path aliases (`@/` → `src/`)
- [ ] Project builds and runs with `npm run dev` without errors
- [ ] Typecheck passes with `npx tsc --noEmit`

---

### US-002: PWA Configuration
**Description:** As a user, I want to install SquashIQ on my iPhone home screen so it launches fullscreen like a native app and works offline.

**Acceptance Criteria:**
- [ ] `vite-plugin-pwa` installed and configured in `vite.config.ts`
- [ ] Web app manifest includes: `name: "SquashIQ"`, `short_name: "SquashIQ"`, `display: "standalone"`, `orientation: "portrait"`, `theme_color: "#0A0A0A"`, `background_color: "#0A0A0A"`
- [ ] App icons provided at 192x192 and 512x512 (can be placeholder/generated SVG icons)
- [ ] Apple-specific meta tags in `index.html`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, viewport with `viewport-fit=cover`
- [ ] Service worker registered and caches app shell for offline use
- [ ] App launches in standalone mode when added to iOS home screen
- [ ] Typecheck passes

---

### US-003: Database Schema & Data Layer
**Description:** As a developer, I need the local database schema set up so match data can be stored and queried on-device.

**Acceptance Criteria:**
- [ ] Dexie.js database initialized with name `squashiq-db`
- [ ] `players` table: `++id, name, emoji, isCurrentUser, createdAt`
- [ ] `venues` table: `++id, name, isHome, createdAt`
- [ ] `matches` table: `++id, date, opponentId, venueId, format, result, games, energyLevel, vibe, tags, note, photoBase64, recommendationText, createdAt`
- [ ] `games` table: `++id, matchId, gameNumber, myScore, opponentScore, isTight`
- [ ] `rally_analyses` table: `++id, matchId, winMethod, loseMethod, rallyLength, courtCoverage, bestShots, createdAt`
- [ ] TypeScript interfaces/types exported for all table schemas (e.g., `Player`, `Venue`, `Match`, `Game`, `RallyAnalysis`)
- [ ] Custom React hooks created for common DB operations: `usePlayers()`, `useVenues()`, `useMatches()`, `useGames()`, `useRallyAnalyses()`
- [ ] A default "current user" player record is auto-created on first app load
- [ ] JSON export function that dumps all tables as a single JSON object
- [ ] JSON import function that restores from an exported JSON file
- [ ] Typecheck passes

---

### US-004: App Shell & Navigation
**Description:** As a user, I want a bottom tab bar to navigate between app sections so I can quickly access any feature.

**Acceptance Criteria:**
- [ ] Bottom tab bar with 5 tabs: Dashboard, Log (center, prominent), Timeline, Rivals, Profile
- [ ] Log tab is visually distinct (accent color `#00E676`, larger icon) as the primary action
- [ ] React Router configured with routes: `/` (Dashboard), `/log` (New Match), `/timeline` (Timeline), `/rivals` (Rivals), `/profile` (Profile)
- [ ] Active tab highlighted with primary color (`#00E676`)
- [ ] Tab bar is fixed to bottom, respects iOS safe area insets (`env(safe-area-inset-bottom)`)
- [ ] Each route renders a placeholder page with the section name
- [ ] Tab bar hidden during match logging flow (full-screen experience)
- [ ] Typecheck passes
- [ ] Verify in browser that navigation works and tab bar renders correctly

---

### US-005: Dark Theme & Design Tokens
**Description:** As a user, I want a dark-mode UI optimized for post-match viewing (harsh court lighting, tired eyes) so the app is comfortable to use.

**Acceptance Criteria:**
- [ ] Tailwind CSS configured with custom color tokens: `primary: #00E676`, `secondary: #448AFF`, `accent: #FF6D00`, `bg: #0A0A0A`, `surface: #1A1A1A`, `surface-elevated: #242424`, `text-primary: #FFFFFF`, `text-secondary: #B0B0B0`, `win: #00E676`, `loss: #FF5252`, `tight: #FFD600`
- [ ] Global styles set: dark background (`#0A0A0A`), white text, system font stack (SF Pro on iOS, system-ui fallback)
- [ ] Card component created: `surface` background, 16px border-radius, consistent padding
- [ ] Button component created: primary (green), secondary (surface), with 12px border-radius
- [ ] Chip/pill component created: 20px border-radius, used for tags and selectors
- [ ] All tap targets are minimum 48px (for sweaty post-match fingers)
- [ ] `prefers-reduced-motion` media query respected globally
- [ ] Typecheck passes
- [ ] Verify in browser that dark theme renders correctly

---

### PHASE 1: P0 Core Features (F1, F2, F6, F7)

---

### US-006: Opponent Management
**Description:** As a player, I want to add and manage my regular opponents so I can quickly select them when logging matches.

**Acceptance Criteria:**
- [ ] "Add Opponent" flow: name input + emoji picker (grid of sport/people emojis, or text input for any emoji)
- [ ] Opponents stored in `players` table via Dexie.js
- [ ] Opponent list viewable from Profile tab under "Manage Players" section
- [ ] Long-press (or tap edit icon) on opponent to edit name/emoji
- [ ] Swipe-to-delete (or delete button) with confirmation dialog
- [ ] Opponents sorted by most recently played (once matches exist), then by creation date
- [ ] Typecheck passes
- [ ] Verify in browser that adding, editing, and deleting opponents works

---

### US-007: Venue Management
**Description:** As a player, I want to save my regular playing venues so I can quickly select them when logging matches.

**Acceptance Criteria:**
- [ ] "Add Venue" flow: venue name input + "Home court" toggle
- [ ] Venues stored in `venues` table via Dexie.js
- [ ] Venue list viewable from Profile tab under "Manage Venues" section
- [ ] Edit and delete functionality (same pattern as opponent management)
- [ ] Venues sorted by most recently used, then by creation date
- [ ] Typecheck passes
- [ ] Verify in browser that adding, editing, and deleting venues works

---

### US-008: Match Logging — Step 1 (Setup)
**Description:** As a player, I want to quickly select my opponent, venue, date, and match format so I can start entering scores within 10 seconds.

**Acceptance Criteria:**
- [ ] Full-screen match logging flow (tab bar hidden)
- [ ] Step indicator showing "1 of 3" at the top
- [ ] **Opponent Picker:** Horizontal scrollable row of avatar chips (emoji + name). Tap to select (visual highlight). "+" chip at end to add new opponent inline
- [ ] **Date/Time:** Auto-filled with current date/time, displayed as tappable pill (e.g., "Today, 7:30 PM"). Tap opens native date-time picker
- [ ] **Venue Picker:** Horizontal scrollable chips below opponent. Most recent venue pre-selected. "+" chip to add new venue inline
- [ ] **Format Selector:** Toggle between "Best of 3" and "Best of 5". Default: "Best of 3"
- [ ] "Next" button (primary green) at bottom to proceed to Step 2. Disabled until opponent is selected
- [ ] "Cancel" button (or X) in top corner to exit logging flow with confirmation if any data entered
- [ ] Typecheck passes
- [ ] Verify in browser that the setup screen works correctly

---

### US-009: Match Logging — Step 2 (Score Entry)
**Description:** As a player, I want to enter game scores quickly with large tap targets so I can log my match while toweling off with sweaty fingers.

**Acceptance Criteria:**
- [ ] Step indicator showing "2 of 3"
- [ ] **Game Score Cards:** Vertical stack of 3 (or 5) game cards based on format selection. Each card shows: game number label, two large score displays (You vs Opponent name) with +/- buttons
- [ ] +/- buttons are minimum 48px tap targets
- [ ] **Quick Score Presets:** Below each game card, tappable pill buttons for common scores: "11-0", "11-5", "11-8", "11-9", "Custom". Tapping a preset auto-fills that game's scores (first number = your score, second = opponent's)
- [ ] **Tight Game Indicator:** When both scores in a game are >= 8, a flame emoji/icon automatically appears on that game card
- [ ] `isTight` boolean auto-calculated and stored for each game
- [ ] **Match Result Banner:** Auto-calculated at the top showing "WIN 3-1" (green) or "LOSS 1-3" (red, subtle). Updates in real-time as scores change
- [ ] Users can swipe left on a game card (or tap an X) to mark it as "not played" (e.g., if match ended 3-0, games 4-5 not needed)
- [ ] "Back" button to return to Step 1. "Next" button to proceed to Step 3
- [ ] Scores validated: winning score must be >= 11 and at least 2 ahead (or if both >= 10, exactly 2 ahead)
- [ ] Typecheck passes
- [ ] Verify in browser that score entry with presets and +/- buttons works

---

### US-010: Match Logging — Step 3 (Quick Tags & Save)
**Description:** As a player, I want to optionally tag my match with energy level, vibe, and notes so I can track factors that affect my performance — but I can skip all of it and save immediately.

**Acceptance Criteria:**
- [ ] Step indicator showing "3 of 3"
- [ ] **"Save Match" button** is prominent and always visible at the bottom — this step is clearly optional
- [ ] **Energy Level:** 3 tappable icons in a row (battery-low / battery-half / battery-full or similar). Labels: "Low", "Medium", "High". Tap one to select, tap again to deselect. Optional
- [ ] **Match Vibe:** Horizontal scrollable emoji chips: "Intense", "Casual", "Frustrating", "Focused", "Fun", "Grind". Single-select. Optional
- [ ] **Quick Tags:** Pill-style multi-select tags: "Good day", "Off day", "New strategy", "Comeback", "Dominated", "Lucky win", "Close". Tap to toggle. Optional
- [ ] **Match Note:** Single-line text input, placeholder: "Quick note... (optional)", max 140 characters
- [ ] On save: all match data (from Steps 1-3) written to `matches` and `games` tables in Dexie.js
- [ ] Match `result` field auto-calculated: "W" or "L" with games won/lost (e.g., "W 3-1")
- [ ] After save, navigate to post-save experience (US-011)
- [ ] Typecheck passes
- [ ] Verify in browser that tags are selectable and match saves correctly

---

### US-011: Post-Match Save Experience
**Description:** As a player, I want satisfying feedback after logging a match so the experience feels rewarding and I'm motivated to log consistently.

**Acceptance Criteria:**
- [ ] **Win animation:** Confetti burst effect (using canvas or CSS) with haptic feedback (`navigator.vibrate()` if available)
- [ ] **Loss animation:** Subtle blue pulse effect (empathetic, never mocking)
- [ ] **Streak Toast:** If applicable, show a toast: "W3 against {opponent}!" or "First win against {opponent}!" or "L2 — time to turn it around!"
- [ ] Streak calculated from match history against that specific opponent
- [ ] **Recommendation Card:** Shows the "One Thing Next Match" card (US-030). If recommendation engine not yet built, show a placeholder motivational message
- [ ] **Rally Analysis Prompt:** Optional link/button: "Want to add rally details? (30 sec)" that navigates to rally analysis flow. Skip button clearly visible
- [ ] "Done" button returns to Dashboard
- [ ] Typecheck passes
- [ ] Verify in browser that post-save screen renders with appropriate win/loss animation

---

### US-012: Match History List
**Description:** As a player, I want to see a chronological list of all my logged matches so I can review past results and access match details.

**Acceptance Criteria:**
- [ ] Match history accessible from Dashboard (scrollable below insight cards) and from Timeline tab
- [ ] Each match card shows: opponent emoji + name, date, result ("W 3-1" or "L 2-3" with win/loss color), venue name, individual game scores
- [ ] Tight games in the list show flame indicator
- [ ] Cards sorted newest first
- [ ] Tap a match card to view full match details (all scores, tags, energy, vibe, note, recommendation)
- [ ] Match detail view has "Edit" button to modify scores or tags
- [ ] Match detail view has "Delete" button with confirmation dialog
- [ ] Empty state when no matches: encouraging message with CTA to log first match
- [ ] Typecheck passes
- [ ] Verify in browser that match history displays correctly with test data

---

### US-013: Dashboard Layout & Header
**Description:** As a player, I want to see my overall stats and current form at a glance when I open the app so I immediately know where I stand.

**Acceptance Criteria:**
- [ ] Dashboard is the default screen (root route `/`)
- [ ] **Header section:** Player name (from current user record), overall record (e.g., "47W - 32L"), current form indicator showing last 5 results as colored dots or letters (e.g., "W W L W W" with green/red coloring)
- [ ] Below header: scrollable vertical stack of insight cards
- [ ] Pull-to-refresh triggers insight recalculation (or auto-refresh is sufficient since data is local)
- [ ] Skeleton loading states shown while insights calculate
- [ ] Empty state when no matches: "Log your first match to start seeing insights" with CTA button to `/log`
- [ ] Typecheck passes
- [ ] Verify in browser that dashboard layout renders correctly

---

### US-014: Insight — Win Rate by Opponent
**Description:** As a player, I want to see my win rate against each opponent so I know who I dominate and who I need to improve against.

**Acceptance Criteria:**
- [ ] Insight card with title "Win Rate by Opponent"
- [ ] Horizontal bar chart: one bar per opponent, colored by win rate (green gradient > 50%, red gradient < 50%)
- [ ] Opponent emoji/name on the left, record (e.g., "7-3") and percentage on the right
- [ ] Bars sorted by total matches played (most played at top)
- [ ] Minimum 3 matches against an opponent to show their bar
- [ ] Tap on an opponent bar navigates to full head-to-head rivalry page (placeholder link until US-042)
- [ ] Card hidden if fewer than 3 total matches logged; shows locked preview with "Log X more matches to unlock"
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-015: Insight — Energy Impact
**Description:** As a player, I want to see how my energy level affects my win rate so I can prioritize warming up and hydration.

**Acceptance Criteria:**
- [ ] Insight card with title "Energy Impact"
- [ ] Three horizontal bars: Low / Medium / High energy levels
- [ ] Each bar shows win rate percentage, colored by intensity (brighter green = higher win rate)
- [ ] Example text: "High energy: 78% wins | Low energy: 45% wins"
- [ ] Minimum 5 total matches logged AND at least 3 matches with energy tagged to show this card
- [ ] Locked preview with progress bar when insufficient data
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-016: Insight — Day of Week & Venue Performance
**Description:** As a player, I want to see which days and venues I perform best at so I can spot environmental patterns.

**Acceptance Criteria:**
- [ ] **Day of Week card:** Title "Best Days". 7-column mini bar chart (Mon-Sun). Each bar shows win rate. Active days (with matches) in color, inactive days grayed out. Highlight best day with accent
- [ ] Minimum 10 total matches to show Day of Week card
- [ ] **Venue Effect card:** Title "Venue Effect". Side-by-side venue cards showing venue name + win rate circle (percentage inside). Colored green (>50%) or red (<50%)
- [ ] Minimum 5 matches AND at least 2 different venues to show Venue card
- [ ] Locked preview with progress bars when insufficient data
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-017: Insight — Clutch & Comeback Stats
**Description:** As a player, I want to see how I perform in deciding games and comebacks so I know my mental toughness.

**Acceptance Criteria:**
- [ ] **Deciding Game card:** Title "Deciding Game Performance". Large percentage showing win rate in final/deciding games (Game 3 in Bo3, Game 5 in Bo5). Ring/donut chart visualization of deciding game W/L split. Trend arrow (up/down/flat based on last 5 vs overall)
- [ ] Minimum 8 matches where a deciding game occurred
- [ ] **Comeback Index card:** Title "Comeback Index". Gauge/meter visualization from 0-100. Measures: after losing Game 1, percentage of matches ultimately won. 50 = average baseline. Above 50 = good comeback ability
- [ ] Minimum 10 matches to show Comeback Index
- [ ] Locked preview with progress bars when insufficient data
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-018: Insight — Form & Fast Start
**Description:** As a player, I want to see my current form trend and how well I start matches so I can track momentum.

**Acceptance Criteria:**
- [ ] **Current Form card:** Title "Current Form". Sparkline chart of last 10 match results (1 = win, 0 = loss plotted as line). Horizontal average line for overall win rate. Text: "Last 10: 7W-3L (70%) vs overall: 58%". Label: "On an upswing!" / "Steady" / "In a dip" based on comparison
- [ ] Minimum 10 matches to show
- [ ] **Fast Starter card:** Title "Fast Starter Rating". Two connected circles: Game 1 win % (left) → Match conversion % when Game 1 won (right). Arrow connecting them. Example: "Win Game 1: 72% → Convert to match win: 60%"
- [ ] Minimum 8 matches to show
- [ ] Locked preview with progress bars when insufficient data
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-019: Progressive Insight Unlocking
**Description:** As a player, I want insights to gradually appear as I log more matches so the app feels like it's growing with me and I'm motivated to keep logging.

**Acceptance Criteria:**
- [ ] Each insight card has a `minimumMatches` threshold (defined in US-014 through US-018)
- [ ] Cards below threshold show a "locked" state: blurred/dimmed preview of the card, lock icon, progress bar ("Log X more matches to unlock"), encouraging text
- [ ] When a new insight unlocks (first time threshold is met after saving a match), the card animates in with a subtle glow/slide effect
- [ ] Cards sorted: unlocked cards first (most recently updated on top), locked cards at bottom sorted by how close they are to unlocking
- [ ] All insights auto-recalculate after every new match is saved (no manual refresh needed)
- [ ] Typecheck passes
- [ ] Verify in browser that locked and unlocked states render correctly

---

### US-020: Recommendation Engine (Rule-Based)
**Description:** As a player, I want one specific, actionable recommendation after every match so I can improve without feeling overwhelmed by a list of things to work on.

**Acceptance Criteria:**
- [ ] Rule-based recommendation engine that evaluates conditions in priority order and returns the FIRST matching recommendation (only ONE per match)
- [ ] Rules implemented (in priority order):
  1. **Slow starter:** Lost Game 1 in 3+ of last 5 matches → "Start faster — you've lost Game 1 in X of your last Y matches but won the match in Z of those."
  2. **Low energy + loss:** Last match tagged "Low energy" AND lost → "Energy first today — hydrate, warm up properly."
  3. **Tight game struggles:** Won <40% of tight games (8-8+) in last 10 games → "Simplify in tight moments. Go with your most confident shot."
  4. **Win streak:** Won 3+ consecutive matches → "Ride the wave — but stay focused on process, not outcome. You're on a X-match win streak."
  5. **Loss streak:** Lost 3+ consecutive matches → "Reset and refocus. Every match is a fresh start. What felt good last time you won?"
  6. **Opponent-specific:** If playing same opponent 3+ times and losing >60% → "Mix it up against {opponent}. They've figured out your pattern."
  7. **Fallback:** Generic motivational message based on current form (positive if >50% recent, encouraging if <50%)
- [ ] Recommendation text stored in the `matches` table with each match record
- [ ] Engine function is pure (takes match history as input, returns recommendation string) for testability
- [ ] Typecheck passes

---

### US-021: Post-Match Recommendation Display
**Description:** As a player, I want to see my recommendation immediately after saving a match and also before my next match so the advice is top of mind.

**Acceptance Criteria:**
- [ ] **Post-match card** (shown in US-011 post-save screen): Dark card with large relevant emoji, bold headline (the recommendation), context text (the supporting data). Green accent left border
- [ ] Card is tappable to expand/collapse the context text
- [ ] Recommendation saved to match record and visible in match detail view (US-012)
- [ ] **Dashboard reminder:** If the most recent match has a recommendation, show it as a pinned card at the top of the Dashboard (above insight cards) with label "Focus for next match"
- [ ] Typecheck passes
- [ ] Verify in browser that recommendation displays correctly post-match and on dashboard

---

### US-022: Progress Timeline — Win/Loss River & Rolling Win Rate
**Description:** As a player, I want to see my results visualized over time so I can see my improvement trajectory and identify hot/cold streaks.

**Acceptance Criteria:**
- [ ] Timeline tab (`/timeline`) as the primary view
- [ ] **Win/Loss River:** Area chart where the line rises for wins and dips for losses. Green gradient for peaks (win streaks), red for valleys (loss streaks). X-axis = match dates, Y-axis = cumulative momentum score
- [ ] Tap any point on the chart to see a tooltip with match details (opponent, result, date)
- [ ] **Rolling Win Rate:** Line chart showing win rate over a rolling window of last 10 matches, plotted over time. 50% baseline highlighted with a horizontal dashed line. Area above 50% shaded green, below shaded red
- [ ] Minimum 10 matches to show Rolling Win Rate (show locked preview otherwise)
- [ ] Time range selector: "Last 30 days", "Last 3 months", "Last 6 months", "All time" — as horizontal pill tabs at top
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-023: Progress Timeline — Activity Heatmap & Streaks
**Description:** As a player, I want to see my playing frequency and consistency visualized so I stay motivated to play regularly.

**Acceptance Criteria:**
- [ ] **Activity Heatmap:** GitHub-style calendar grid. Each cell = one day. Color intensity based on number of matches played that day (0 = empty/gray, 1 = light green, 2+ = darker green). Shows last 3 months by default, horizontally scrollable
- [ ] Day labels on left (Mon, Wed, Fri), month labels on top
- [ ] Tap a day cell to see matches played that day
- [ ] **Regularity Streak:** Below heatmap, display: "X week streak — keep it going!" (consecutive weeks with at least 1 match). If streak broken: "Your X-week streak ended. Start a new one today!"
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-024: Progress Timeline — Milestones
**Description:** As a player, I want auto-detected milestones pinned on my timeline so I can celebrate achievements and see my journey.

**Acceptance Criteria:**
- [ ] Milestone detection engine that scans match history and identifies:
  - First win against an opponent
  - Win streaks of 3+
  - Match count milestones (10, 25, 50, 100 matches)
  - Win rate crossing 50%, 60%, 70% (sustained over 5+ matches)
  - Head-to-head record flipping (e.g., going from losing to winning record against an opponent)
- [ ] Milestones displayed as markers/badges on the Win/Loss River chart at the appropriate date
- [ ] Scrollable milestone list below charts showing all achievements chronologically
- [ ] Each milestone card shows: icon, title (e.g., "First Win vs Hemang"), date, context
- [ ] Milestones auto-detected after every new match save
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### PHASE 2: P1 Features (F3, F4, F5, F8)

---

### US-025: Rally Pattern Analyzer — Card UI
**Description:** As a player improving my game, I want to quickly recall how a match felt through swipeable cards so I can track rally patterns without tedious data entry.

**Acceptance Criteria:**
- [ ] Accessible from: (a) post-match save screen as optional prompt, (b) match detail view as "Add Rally Analysis" button
- [ ] 5 swipeable cards (horizontal swipe or tap to advance), each with a question and tappable options:
  - Card 1: "How did you win most points?" — 5 options (single-select)
  - Card 2: "How did you lose most points?" — 5 options (single-select)
  - Card 3: "Average rally length felt like..." — 3 options (single-select)
  - Card 4: "Your court coverage today?" — 4 options (single-select)
  - Card 5: "Which shot felt best today?" — 7 options (multi-select, max 2)
- [ ] Progress dots at bottom showing current card position
- [ ] "Skip" button on each card to advance without answering
- [ ] "Done" button on last card saves to `rally_analyses` table
- [ ] Total time to complete: under 30 seconds
- [ ] Typecheck passes
- [ ] Verify in browser that swipe/tap navigation and selection works

---

### US-026: Rally Insights Generation
**Description:** As a player, I want to see insights derived from my rally analysis data so I understand my play style trends.

**Acceptance Criteria:**
- [ ] **Play Style Classification:** Each match with rally data gets a play-style label: "Aggressive Attacker", "Patient Constructor", "Retriever", "Serve & Volley", "All-Court Player" — derived from win method + rally length + court coverage answers
- [ ] **Win Method Distribution:** Donut chart on Dashboard showing distribution of win methods over all analyzed matches (e.g., 40% Winners, 30% Errors, 20% Outlasted, 10% Serves)
- [ ] **Loss Method Distribution:** Similar donut chart for loss methods, with the biggest slice highlighted and paired with an improvement suggestion
- [ ] **Best Shot Trends:** Bubble chart showing which shots are most frequently tagged as "best" — bigger bubble = more frequent
- [ ] Minimum 5 rally analyses to show insights (locked preview otherwise)
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-027: Pressure Performance — 8-8+ Index
**Description:** As a competitive player, I want to know my clutch rating in tight games so I can build confidence or identify mental toughness as a weakness.

**Acceptance Criteria:**
- [ ] **Auto-detection:** Any game where BOTH players scored 8+ is classified as a "tight game" (already tracked via `isTight` in games table from US-009)
- [ ] **8-8+ Index (Clutch Rating):** Calculated as `(tight games won / total tight games) * 100`. Displayed as large animated number (0-100) with trend arrow
- [ ] Rating label: 0-39 "Cold", 40-59 "Neutral", 60-79 "Hot", 80-100 "Ice Veins" — with corresponding color
- [ ] **Clutch by Opponent:** Breakdown table showing 8-8+ Index per opponent
- [ ] **Clutch by Game Number:** Shows tight game win rate by game position (Game 1, Game 2, Game 3, etc.)
- [ ] Displayed as a dedicated section on Dashboard (below insight cards) or as an insight card
- [ ] Minimum 5 tight games to show (locked preview otherwise)
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-028: Pressure Badges
**Description:** As a player, I want to earn badges for pressure-related achievements so tight games feel rewarding.

**Acceptance Criteria:**
- [ ] Badge system with these badges:
  - "Ice Veins" (Rare): Win 5+ tight games in a row
  - "Clutch King" (Epic): 8-8+ Index above 80 for 10+ tight games
  - "Comeback Artist" (Legendary): Win a match after being down 0-2 with at least one tight game
  - "Heartbreaker" (Rare): Win 3+ tight games in a single Best of 5 match
  - "Pressure Cooker" (Common): Play 5+ tight games in a single week
- [ ] Badge detection runs after every match save
- [ ] Badges displayed on Profile tab in a grid. Earned badges in color, unearned grayed out with criteria text
- [ ] Toast notification when a new badge is earned
- [ ] Typecheck passes
- [ ] Verify in browser that earned and unearned badges display correctly

---

### US-029: Player Archetype Engine
**Description:** As a player, I want to know my play-style archetype and see how it evolves so I have a fun identity tied to my game.

**Acceptance Criteria:**
- [ ] 6 archetypes defined with traits, colors, and radar profiles:
  - The Assassin (#FF1744): aggressive, short rallies, decisive
  - The Wall (#2979FF): opponent errors, long rallies, fitness
  - The Strategist (#7C4DFF): varied shots, adaptive, tactical
  - The Closer (#00E676): high clutch, wins deciders, pressure performer
  - The Streaker (#FF6D00): momentum-dependent, hot-and-cold
  - The Chameleon (#00BFA5): different style per opponent, adaptive
- [ ] Determination algorithm: weighted scoring across 6 trait dimensions (aggression, fitness, consistency, clutch, adaptability, deception) using rally analysis data + match stats
- [ ] Primary archetype assigned (highest score). Secondary shown if within 10% of primary
- [ ] Recalculated after every match that includes rally analysis data
- [ ] Minimum 10 matches AND 5 rally analyses to assign archetype
- [ ] Typecheck passes

---

### US-030: Archetype Display & Sharing
**Description:** As a player, I want to see my archetype displayed beautifully with a radar chart and be able to share it with friends.

**Acceptance Criteria:**
- [ ] **Archetype Card** on Profile tab: Full-width card with archetype name, color theme, description, strength, growth area
- [ ] **Radar Chart:** 6-axis radar chart showing trait scores (aggression, fitness, consistency, clutch, adaptability, deception). Filled area in archetype color
- [ ] **Evolution Timeline:** Horizontal timeline showing archetype changes over time (e.g., "Jan: Wall → Mar: Strategist → May: Chameleon")
- [ ] **Shareable Card:** "Share" button generates a 1080x1920 image (via html2canvas) containing: archetype name, radar chart, key stats, SquashIQ watermark. Triggers native share sheet
- [ ] Locked state shown if minimum data not met (10 matches + 5 rally analyses)
- [ ] Typecheck passes
- [ ] Verify in browser that archetype card and radar chart render correctly

---

### US-031: Rivalry Pages
**Description:** As a player, I want a dedicated head-to-head page for each opponent so I can deep-dive into our rivalry history.

**Acceptance Criteria:**
- [ ] Accessible from: Rivals tab (`/rivals`), tapping an opponent in Win Rate by Opponent insight, match history
- [ ] **Header:** Both player emojis/names, all-time record (e.g., "You 7 - 3 Parth"), current form (last 5 H2H results)
- [ ] **Score History:** Timeline chart of H2H results over time
- [ ] **Key Stats:** Win streak (current and best), tight games record, average games per match, most common score
- [ ] **Best Win:** Highlight card for most dominant victory
- [ ] **Worst Loss:** Highlight card for worst defeat
- [ ] **Fun Facts:** Auto-generated (e.g., "You've never lost to Parth on a Tuesday", "Your longest match went 5 games")
- [ ] Rivals tab shows list of all opponents sorted by total matches played
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-032: Friendly Leaderboards
**Description:** As part of a friend group, I want leaderboards across multiple categories so everyone has their moment to shine.

**Acceptance Criteria:**
- [ ] Leaderboard section on Rivals tab (below rivalry list, or as a sub-tab)
- [ ] **V1 approach:** Single-device mode — all player data is on one device. Leaderboard computed from local match data treating each opponent as a "member" with stats derived from matches against the current user
- [ ] 8 leaderboard categories implemented:
  1. Overall Record (win rate, min 5 matches)
  2. Iron Man (most matches played this month)
  3. Clutch King (highest 8-8+ Index, min 5 tight games)
  4. Comeback Kid (most wins after losing Game 1)
  5. Hot Streak (longest current win streak)
  6. Consistency Crown (lowest win rate variance, last 20 matches)
  7. Most Improved (biggest win rate increase, last 30 days vs prior 30)
  8. Rivalry Dominator (best H2H record vs most-played opponent)
- [ ] Category selector: horizontal scrollable pills, one category visible at a time
- [ ] Each category shows ranked list with position number, player emoji + name, metric value
- [ ] Anti-toxicity: encouraging copy (e.g., "Parth is on fire this month!"), no "worst player" categories
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### PHASE 3: P2 Features (F9) & Polish

---

### US-033: Match of the Month & On This Day
**Description:** As a player, I want nostalgic highlights that surface memorable matches so I feel emotionally connected to my squash history.

**Acceptance Criteria:**
- [ ] **Match of the Month:** Auto-selects the most dramatic match each month based on: closest total score, biggest upset (opponent with best record), longest match (most games), most dramatic comeback. Displayed as a story-style card on Dashboard with auto-generated title (e.g., "The Hemang Thriller")
- [ ] Only shown if 4+ matches in a month
- [ ] **On This Day:** If a significant match occurred exactly 1 month, 3 months, 6 months, or 1 year ago, show a card on Dashboard: "X months ago today, you beat {opponent} {score} at {venue}"
- [ ] Both features are passive discovery — shown on Dashboard when applicable, not intrusive
- [ ] Typecheck passes
- [ ] Verify in browser with test data

---

### US-034: Season Wrapped
**Description:** As a player, I want a Spotify Wrapped-style summary of my squash quarter/year so I can celebrate my journey and share it with friends.

**Acceptance Criteria:**
- [ ] Accessible from Profile tab as "Season Wrapped" button (shown after 20+ matches)
- [ ] Generates a sequence of full-screen story cards (swipeable):
  1. "Your Quarter in Numbers" — matches, games, tight games, estimated hours
  2. "Win Rate Journey" — animated line chart of win rate over time
  3. "Biggest Rival" — most-played opponent + H2H record
  4. "Best Month" — highest win rate month
  5. "Clutch Moments" — tight game stats, best clutch moment
  6. "Headline Stat" — one standout stat defining the period
- [ ] Each card is a 1080x1920 shareable image (via html2canvas) with SquashIQ watermark
- [ ] "Share" button on each card triggers native share sheet
- [ ] Typecheck passes
- [ ] Verify in browser that wrapped cards render and generate images correctly

---

### US-035: Data Export & Settings
**Description:** As a player, I want to export my data and manage app settings so I'm in control and never lose my match history.

**Acceptance Criteria:**
- [ ] **Settings section** on Profile tab:
  - Player name edit
  - Tight game threshold setting (default: 8, adjustable for non-standard game formats)
  - "Export Data" button: exports all tables as JSON file, triggers native share/download
  - "Import Data" button: file picker for JSON import with confirmation dialog ("This will merge with existing data")
  - App version display
- [ ] Auto-backup reminder: after every 10 new matches since last export, show a non-intrusive banner: "Back up your data — you've logged X matches since your last export"
- [ ] Typecheck passes
- [ ] Verify in browser that export produces valid JSON and import restores data correctly

---

### US-036: Empty States & Onboarding Polish
**Description:** As a new user, I want clear guidance and encouraging empty states everywhere so I'm never confused about what to do next.

**Acceptance Criteria:**
- [ ] Every screen has a designed empty state (not blank):
  - Dashboard (no matches): "Welcome to SquashIQ! Log your first match to start seeing insights." + large CTA button
  - Timeline (no matches): "Your squash journey starts here." + illustration/icon + CTA
  - Rivals (no opponents): "Add your first opponent to start tracking rivalries." + CTA
  - Match History (no matches): "No matches yet. Let's fix that!" + CTA
  - Each locked insight card: blurred preview + "Log X more matches to unlock" + progress bar
- [ ] First-time app open: brief 3-screen onboarding (swipeable):
  1. "Log matches in 60 seconds" — illustration
  2. "Discover what makes you win" — illustration
  3. "Track your improvement over time" — illustration + "Get Started" button → navigates to first match log
- [ ] Onboarding only shown once (flag stored in localStorage)
- [ ] Typecheck passes
- [ ] Verify in browser that all empty states render correctly

---

## Functional Requirements

- FR-1: All data stored locally in IndexedDB via Dexie.js — zero network requests for core functionality
- FR-2: App works fully offline once loaded — service worker caches all assets
- FR-3: Match logging flow completes in 3 steps (Setup → Scores → Tags) in under 60 seconds
- FR-4: All tap targets are minimum 48px for sweaty post-match finger operation
- FR-5: Insights auto-recalculate after every match save without manual refresh
- FR-6: Progressive insight unlocking based on per-card minimum match thresholds
- FR-7: Only ONE recommendation generated per match, evaluated via priority-ordered rules
- FR-8: Tight games auto-detected when both scores >= 8 (configurable threshold)
- FR-9: Player archetype determined by weighted scoring across 6 trait dimensions
- FR-10: Milestones auto-detected from match history patterns
- FR-11: All shareable images generated as 1080x1920 PNG via html2canvas
- FR-12: JSON data export includes all tables; import merges with existing data
- FR-13: Dark mode is the default theme with colors matching the design spec
- FR-14: Navigation via 5-tab bottom bar with iOS safe area inset support
- FR-15: PWA manifest and service worker enable "Add to Home Screen" on iOS Safari
- FR-16: Score validation enforces squash rules (win by 2 when both >= 10, winning score >= 11)

## Non-Goals (Out of Scope)

- **No backend/server:** Everything runs client-side in the browser. No API, no database server, no auth
- **No user accounts or authentication:** No signup, no login, no passwords
- **No cloud sync:** Data lives on one device only (V1). Multi-device sync is future roadmap
- **No real-time match tracking:** Scores are entered post-match from memory, not live during play
- **No desktop layout:** Mobile-only design. No responsive desktop breakpoints
- **No light mode toggle (V1):** Dark mode only. Light mode is a future enhancement
- **No push notifications (V1):** Web Push API on iOS requires additional complexity. Future roadmap
- **No ML/AI recommendations:** Rule-based engine only. Claude API integration is future roadmap
- **No tournament/league mode:** Casual match logging only
- **No video or advanced media:** Text, scores, and optional single photo only
- **No Apple Watch or wearable integration**
- **No internationalization (i18n):** English only

## Design Considerations

- **Dark mode first:** Background `#0A0A0A`, surface `#1A1A1A`, elevated surface `#242424`
- **Mobile-only:** Designed for iPhone Safari. Portrait orientation locked. No desktop breakpoints
- **One-thumb operation:** All primary actions reachable with right thumb on iPhone
- **System font stack:** SF Pro on iOS, system-ui fallback. No custom web fonts to load
- **Corner radii:** Cards 16px, buttons 12px, chips/pills 20px
- **Haptic feedback:** Use `navigator.vibrate()` on key actions (match save, badge earned)
- **Animations:** Subtle and purposeful. Respect `prefers-reduced-motion`. Confetti on wins, gentle transitions on navigation
- **Empty states:** Every screen has an encouraging empty state with CTA — never a blank screen
- **Skeleton loading:** Use skeleton placeholders while data loads/computes

## Technical Considerations

- **Dexie.js live queries:** Use `useLiveQuery` for reactive data — components auto-update when IndexedDB changes
- **Bundle size:** Keep chart library imports tree-shaken. Lazy-load Phase 2+ features via React.lazy/Suspense
- **IndexedDB storage limits:** Safari may evict IndexedDB data under storage pressure. Auto-backup reminders mitigate this risk
- **iOS PWA quirks:** Test `standalone` mode, safe area insets, status bar styling, splash screens. `apple-mobile-web-app-capable` meta tag required
- **html2canvas limitations:** Some CSS features don't render perfectly. Test shareable card output
- **Path aliases:** Use `@/` → `src/` in tsconfig for clean imports
- **State management split:** Zustand for UI/app state (current tab, form state, preferences). Dexie for persistent data. Don't duplicate data between them

## Success Metrics

- Match logging takes < 60 seconds from "New Match" tap to "Save" tap
- User logs 90%+ of matches played (self-reported satisfaction)
- Dashboard insights viewed at least 1x per week outside of match logging
- 80%+ retention at 30 days (continued match logging activity)
- Friends join within 2 weeks of first user sharing the URL
- All insight cards eventually unlock as the user logs more matches

## Open Questions

1. Should the charting library be Recharts or a lighter alternative (e.g., lightweight-charts, uPlot, or custom SVG)?
2. For the activity heatmap, should we build a custom component or use a library like `react-activity-calendar`?
3. Should the onboarding flow include a "quick setup" step where the user enters their name and adds 1-2 opponents?
4. For the V1 leaderboard, is single-device mode sufficient, or should JSON import/export for group leaderboards be a P0?
5. Should we support photo attachments in V1, or defer to keep scope smaller?
6. What is the target deployment URL / hosting platform (Vercel, Netlify, GitHub Pages)?
