# PRD: SquashIQ Mobile iOS App with User Authentication & Cloud Sync

## Introduction

Convert SquashIQ from a local-first PWA to a native iOS mobile app using Expo (React Native) with user authentication and cloud data synchronization. The app will support social login (Google + Apple Sign In), sync match data across devices via Supabase, and be distributed through TestFlight for internal and external beta testing. This enables users to access their squash match history from any device while maintaining the fast, offline-first experience.

## Current App Analysis (Expert Review)

**Strengths:**
- ✅ Excellent local-first architecture with Dexie.js (IndexedDB)
- ✅ Comprehensive feature set with 41 completed user stories
- ✅ Well-structured component hierarchy and clear separation of concerns
- ✅ Strong data model: players, venues, matches, games, rally_analyses
- ✅ Rich analytics and insights engine already built
- ✅ Dark mode optimized for mobile
- ✅ PWA with offline support via service worker

**Technical Debt & Areas for Improvement:**
- ⚠️ **No authentication** - data is device-locked, not portable
- ⚠️ **No cloud sync** - losing device = losing all match history
- ⚠️ **Web-only** - cannot access native iOS features (push notifications, widgets, HealthKit)
- ⚠️ **Base64 photos** in IndexedDB - inefficient storage, sync challenges
- ⚠️ **No conflict resolution** - multiple device sync will need careful design
- ⚠️ **Complex insights** may need optimization for mobile performance
- ⚠️ **Single user only** - leaderboards are simulated, no real multiplayer

**Recommended Architecture Evolution:**
```
Current: Browser → IndexedDB (local-only)
Target:  Mobile App → SQLite (local) ⟷ Supabase PostgreSQL (cloud)
                     └→ Supabase Storage (photos)
```

## Goals

- **G1:** Convert SquashIQ to native iOS app using Expo with full feature parity for core features
- **G2:** Implement secure authentication with Apple Sign In and Google Sign In via Supabase Auth
- **G3:** Enable cross-device data sync with offline-first architecture and conflict resolution
- **G4:** Store match photos in Supabase Storage instead of base64 in database
- **G5:** Distribute app via TestFlight (internal initially, external beta later)
- **G6:** Maintain <2s match logging speed and offline functionality
- **G7:** Lay foundation for future social features and advanced analytics

## User Stories

### Phase 1: Infrastructure & Authentication (MVP Foundation)

### US-M001: Expo project setup with React Native
**Description:** As a developer, I need the mobile app initialized with Expo and core dependencies so I can build native iOS features.

**Acceptance Criteria:**
- [ ] Initialize new Expo project with TypeScript template: `npx create-expo-app@latest squashiq-mobile --template`
- [ ] Install navigation: `expo install react-navigation @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs`
- [ ] Install UI libraries: `expo install react-native-reanimated react-native-gesture-handler react-native-svg`
- [ ] Install local storage: `expo install expo-sqlite` (replacement for Dexie.js on mobile)
- [ ] Install async storage: `expo install @react-native-async-storage/async-storage` (for Zustand persistence)
- [ ] Configure app.json with bundle identifier: `com.squashiq.app`, iOS version: 15.0+, orientation: portrait
- [ ] Set up EAS Build: `npm install -g eas-cli && eas init`
- [ ] Configure eas.json for iOS builds (development, preview, production profiles)
- [ ] Successful iOS simulator build: `eas build --platform ios --profile development --local`
- [ ] Typecheck passes

### US-M002: Supabase project setup and configuration
**Description:** As a developer, I need Supabase backend configured for authentication and data storage.

**Acceptance Criteria:**
- [ ] Create new Supabase project at https://supabase.com
- [ ] Enable authentication providers: Apple (configure with Apple Developer), Google (configure OAuth)
- [ ] Create database schema matching Dexie structure (see schema below)
- [ ] Enable Row Level Security (RLS) on all tables: users can only read/write their own data
- [ ] Create Supabase Storage bucket named `match-photos` with RLS policies
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts` with initialized client using env variables
- [ ] Configure `.env.local` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Test connection with simple query in development
- [ ] Typecheck passes

**Database Schema:**
```sql
-- Users table (auto-created by Supabase Auth)
-- auth.users has: id (UUID), email, created_at

-- Players table (extends auth.users)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🏸',
  is_current_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_home BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  opponent_id UUID REFERENCES players(id),
  venue_id UUID REFERENCES venues(id),
  format TEXT CHECK (format IN ('bo3', 'bo5')),
  result TEXT, -- 'W 3-1' or 'L 1-3'
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  vibe TEXT,
  tags TEXT[], -- array of strings
  note TEXT,
  photo_url TEXT, -- Supabase Storage URL instead of base64
  recommendation_text JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ, -- for conflict resolution
  device_id TEXT -- track which device created/modified
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  my_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  is_tight BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rally analyses table
CREATE TABLE rally_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  win_method TEXT,
  lose_method TEXT,
  rally_length TEXT,
  court_coverage TEXT,
  best_shots TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync metadata table (for conflict resolution)
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('insert', 'update', 'delete')),
  device_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_date ON matches(date DESC);
CREATE INDEX idx_games_match_id ON games(match_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_venues_user_id ON venues(user_id);

-- RLS Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rally_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own players"
  ON players FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own venues"
  ON venues FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own matches"
  ON matches FOR ALL USING (auth.uid() = user_id);

-- Games RLS via match
CREATE POLICY "Users can access games for their matches"
  ON games FOR ALL USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = games.match_id AND matches.user_id = auth.uid())
  );

-- Rally analyses RLS via match
CREATE POLICY "Users can access rally analyses for their matches"
  ON rally_analyses FOR ALL USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = rally_analyses.match_id AND matches.user_id = auth.uid())
  );
```

### US-M003: Authentication UI with Apple & Google Sign In
**Description:** As a user, I want to sign in with Apple or Google so I can access my data across devices.

**Acceptance Criteria:**
- [ ] Create `src/screens/AuthScreen.tsx` with SquashIQ branding
- [ ] Install social auth: `expo install expo-apple-authentication expo-auth-session expo-crypto`
- [ ] Apple Sign In button using `expo-apple-authentication` (native iOS component)
- [ ] Google Sign In button using Supabase Auth with OAuth flow
- [ ] "Why sign in?" explanation text: "Your match history syncs across all your devices. Sign in once, track everywhere."
- [ ] Privacy policy link (required for App Store): "We only store your squash data. No ads, no tracking."
- [ ] Loading states during authentication
- [ ] Error handling with user-friendly messages (e.g., "Sign in failed. Please try again.")
- [ ] On successful auth: navigate to app, fetch user data from Supabase
- [ ] Auth state persisted via AsyncStorage and Zustand
- [ ] Typecheck passes
- [ ] Test on iOS simulator with test Apple ID

**Apple Sign In Setup Notes:**
- Requires Apple Developer account ($99/year)
- Configure App ID with Sign In with Apple capability
- Add redirect URL in Supabase: `https://<project-id>.supabase.co/auth/v1/callback`

### US-M004: Local SQLite database with Expo SQLite
**Description:** As a developer, I need local database storage for offline-first functionality on mobile.

**Acceptance Criteria:**
- [ ] Create `src/db/sqlite.ts` with Expo SQLite initialization
- [ ] Define schema matching Supabase (players, venues, matches, games, rally_analyses)
- [ ] Create tables on first app launch with migration logic
- [ ] Add `local_id` (auto-increment) and `server_id` (UUID from Supabase) to each table for sync tracking
- [ ] Add `is_synced` boolean flag and `last_modified` timestamp to each table
- [ ] Implement CRUD functions: `insertMatch()`, `updateMatch()`, `deleteMatch()`, `getMatches()`, etc.
- [ ] React hooks for querying: `useMatches()`, `usePlayers()`, `useVenues()` (similar to current Dexie hooks)
- [ ] All queries reactive using React state updates
- [ ] Typecheck passes
- [ ] Write unit tests for CRUD operations

**Migration Path:**
```typescript
// Example table creation
const createMatchesTable = `
  CREATE TABLE IF NOT EXISTS matches (
    local_id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    opponent_id TEXT,
    venue_id TEXT,
    format TEXT,
    result TEXT,
    energy_level TEXT,
    vibe TEXT,
    tags TEXT, -- JSON string array
    note TEXT,
    photo_url TEXT,
    recommendation_text TEXT, -- JSON string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_synced INTEGER DEFAULT 0,
    last_modified INTEGER DEFAULT (strftime('%s', 'now')),
    device_id TEXT
  );
`;
```

### US-M005: Data sync engine with conflict resolution
**Description:** As a user, I want my local data automatically synced to the cloud so I never lose my match history.

**Acceptance Criteria:**
- [ ] Create `src/lib/sync.ts` with sync orchestrator
- [ ] **Push sync:** On app foreground or after local write, upload unsynced records (is_synced=0) to Supabase
- [ ] **Pull sync:** On app launch and periodically (every 5 min when active), fetch updates from Supabase since last sync
- [ ] **Conflict resolution strategy - Last Write Wins with device_id tiebreaker:**
  - Compare `updated_at` timestamps
  - If local timestamp > server timestamp → push local changes
  - If server timestamp > local timestamp → pull and overwrite local
  - If timestamps equal (rare) → compare `device_id` lexicographically, keep higher value
- [ ] Handle deleted records: soft delete with `deleted_at` timestamp, sync deletions
- [ ] Batch uploads: send max 50 records per request to avoid timeout
- [ ] Retry logic: exponential backoff for failed sync (1s, 2s, 4s, 8s, give up after 5 attempts)
- [ ] Sync status indicator in UI: green checkmark when synced, yellow spinner when syncing, red X when sync failed
- [ ] Background sync using `expo-task-manager` and `expo-background-fetch` (iOS background refresh)
- [ ] Manual sync trigger: pull-to-refresh gesture on Dashboard
- [ ] Sync conflicts logged to sync_log table for debugging
- [ ] Typecheck passes
- [ ] Test with 2 simulators logged in as same user, create conflict, verify resolution

**Sync Flow:**
```typescript
// Pseudocode
async function syncData() {
  if (!isOnline()) return;

  // 1. Pull from server
  const lastSync = await getLastSyncTimestamp();
  const serverUpdates = await supabase
    .from('matches')
    .select('*')
    .gt('updated_at', lastSync);

  for (const serverRecord of serverUpdates) {
    const localRecord = await getLocalRecordByServerId(serverRecord.id);

    if (!localRecord) {
      // New record from server, insert locally
      await insertLocalRecord(serverRecord);
    } else {
      // Conflict resolution
      if (serverRecord.updated_at > localRecord.updated_at) {
        await updateLocalRecord(serverRecord);
      }
      // else: local is newer, will be pushed in next step
    }
  }

  // 2. Push to server
  const unsyncedRecords = await getUnsyncedLocalRecords();
  for (const localRecord of unsyncedRecords) {
    const { data, error } = await supabase
      .from('matches')
      .upsert(localRecord, { onConflict: 'id' });

    if (!error) {
      await markAsSynced(localRecord.local_id);
    }
  }

  await setLastSyncTimestamp(Date.now());
}
```

### US-M006: Photo upload to Supabase Storage
**Description:** As a user, I want my match photos stored in the cloud so they don't bloat my device storage.

**Acceptance Criteria:**
- [ ] Install image picker: `expo install expo-image-picker`
- [ ] When user selects photo during match logging, compress image to max 1920px width, 85% quality
- [ ] Generate unique filename: `{user_id}/{match_id}_{timestamp}.jpg`
- [ ] Upload to Supabase Storage bucket `match-photos` using `supabase.storage.from('match-photos').upload()`
- [ ] Get public URL and store in `matches.photo_url` column (not base64)
- [ ] Display photos using `<Image source={{ uri: photo_url }} />` in React Native
- [ ] Offline handling: queue photo uploads, retry when online
- [ ] Delete photo from storage when match is deleted
- [ ] Storage bucket policy: users can only upload/delete their own photos (RLS based on filename prefix = user_id)
- [ ] Typecheck passes
- [ ] Test: upload photo, verify in Supabase Storage, delete match, verify photo deleted

### US-M007: Core UI migration - Bottom tabs and navigation
**Description:** As a user, I want familiar bottom tab navigation on mobile matching the PWA experience.

**Acceptance Criteria:**
- [ ] Migrate BottomTabBar component to React Native using `@react-navigation/bottom-tabs`
- [ ] 5 tabs: Dashboard, Log Match (center, larger), Timeline, Rivals, Profile
- [ ] Active tab highlighted with primary color #00E676
- [ ] Tab bar icons using React Native vector icons or SVG
- [ ] Safe area handling for iPhone notch/home indicator using `react-native-safe-area-context`
- [ ] Hide tab bar on match logging flow (nested stack navigator)
- [ ] Smooth tab transitions with spring animation
- [ ] Typecheck passes
- [ ] Verify on iPhone 15 Pro simulator with notch

### US-M008: Core feature - Match logging (Steps 1-3)
**Description:** As a user, I want to log matches on mobile as fast as on the PWA (target <60 seconds).

**Acceptance Criteria:**
- [ ] Migrate StepSetup, StepScoreEntry, StepTagsSave to React Native
- [ ] Replace web inputs with React Native components: `TextInput`, `Pressable`, `ScrollView`
- [ ] Opponent picker: horizontal `FlatList` with selectable chips
- [ ] Date picker: use `expo-date-picker` for native iOS date picker
- [ ] Score entry: large touchable +/- buttons (min 44pt touch target for iOS)
- [ ] Quick score presets (11-0, 11-5, 11-8, 11-9) as tappable pills
- [ ] Save flow: write to local SQLite first (instant), queue for sync
- [ ] Success feedback: haptic vibration on iOS using `expo-haptics`
- [ ] Navigate to post-match screen with confetti animation (use `react-native-confetti-cannon`)
- [ ] All match data saved to SQLite and marked `is_synced=0`
- [ ] Sync triggered in background after save
- [ ] Typecheck passes
- [ ] Test: log match offline, verify saved locally, go online, verify synced to Supabase

### US-M009: Core feature - Dashboard with match history
**Description:** As a user, I want to see my match history and basic stats on the Dashboard.

**Acceptance Criteria:**
- [ ] Migrate Dashboard component to React Native
- [ ] Header with user name (from Supabase auth), overall W-L record, last 5 form (colored dots)
- [ ] Match history as `FlatList` with pull-to-refresh for manual sync
- [ ] Each match card: opponent emoji/name, date (relative: "Today", "Yesterday"), result (W 3-1), venue
- [ ] Tap match card navigates to detail view
- [ ] Empty state: "Log your first match!" with CTA to /log
- [ ] Skeleton loaders while fetching from SQLite
- [ ] Optimized rendering: virtualized list, memoized components
- [ ] Typecheck passes
- [ ] Performance: <100ms to render 100 matches

### US-M010: Core feature - Match detail with edit/delete
**Description:** As a user, I want to view, edit, and delete match details.

**Acceptance Criteria:**
- [ ] Migrate MatchDetail screen to React Native
- [ ] Display: opponent, date, venue, result, all game scores, tags, notes, recommendation
- [ ] Photo display: async image loading with loading indicator
- [ ] Edit button: opens match logging flow with pre-filled data, saves update locally + syncs
- [ ] Delete button: confirmation alert using `Alert.alert()`, soft delete (set deleted_at), sync deletion
- [ ] Back button in header (React Navigation default)
- [ ] Typecheck passes

### US-M011: Core insights - Win Rate by Opponent, Energy Impact, Current Form
**Description:** As a user, I want to see my top 3 insights on mobile Dashboard.

**Acceptance Criteria:**
- [ ] Migrate 3 core insight cards: WinRateByOpponent, EnergyImpact, CurrentForm
- [ ] Use Victory Native (React Native charts) instead of Recharts: `npm install victory-native`
- [ ] Horizontal bar chart for Win Rate by Opponent
- [ ] Simple bars for Energy Impact (Low/Med/High)
- [ ] Sparkline for Current Form (last 10 matches)
- [ ] Locked state UI for insufficient data (show progress bar)
- [ ] Cards scroll horizontally in Dashboard (horizontal `FlatList` or `ScrollView`)
- [ ] Typecheck passes
- [ ] Verify charts render correctly on iOS simulator

### Phase 2: TestFlight Distribution & Polish

### US-M012: TestFlight internal testing setup
**Description:** As a developer, I want to distribute the app via TestFlight to internal testers.

**Acceptance Criteria:**
- [ ] Apple Developer account configured with team ID
- [ ] App Store Connect app created: "SquashIQ"
- [ ] Bundle identifier matches eas.json: `com.squashiq.app`
- [ ] Build app for TestFlight: `eas build --platform ios --profile production`
- [ ] Submit to App Store Connect: `eas submit --platform ios`
- [ ] Internal testing group created in TestFlight (max 100 testers)
- [ ] Invite testers via email (they must have Apple ID)
- [ ] App successfully installs from TestFlight on physical iPhone
- [ ] Crash reporting enabled via Sentry: `npm install @sentry/react-native`
- [ ] Over-the-air updates enabled: `expo install expo-updates`

### US-M013: App Store compliance - Privacy policy and app info
**Description:** As a developer, I need to comply with App Store requirements for privacy and metadata.

**Acceptance Criteria:**
- [ ] Create privacy policy page (can be simple Markdown hosted on GitHub Pages or Notion)
- [ ] Privacy policy covers: data collected (matches, photos), data storage (Supabase), third-party services (Google/Apple auth)
- [ ] Add privacy policy URL to app.json: `ios.config.usesAppleSignIn`
- [ ] App icons: 1024x1024px App Store icon, adaptive icons for iOS
- [ ] Generate app icons using https://www.appicon.co/ or Figma
- [ ] App description for TestFlight: "SquashIQ is your personal squash match tracker. Log matches in 60 seconds, discover insights, track improvement."
- [ ] Screenshots for TestFlight (optional for internal, required for external): 3-5 screenshots showing Dashboard, Match Logging, Insights
- [ ] Configure app permissions in app.json: camera (for match photos), background fetch (for sync)
- [ ] App build number incremented for each TestFlight build

### US-M014: Onboarding flow for first-time users
**Description:** As a new user, I want a quick tutorial on first launch so I understand the app.

**Acceptance Criteria:**
- [ ] Migrate onboarding swipeable cards to React Native
- [ ] 3 screens: (1) Log matches fast, (2) Discover insights, (3) Track improvement
- [ ] Use `react-native-onboarding-swiper` or custom implementation
- [ ] "Get Started" button on final screen navigates to AuthScreen
- [ ] Onboarding shown only once: flag in AsyncStorage `onboarding-complete`
- [ ] Skip button on each screen
- [ ] Smooth page transitions
- [ ] Typecheck passes

### US-M015: Settings - Data export/import for migration
**Description:** As a PWA user, I want to export my data and import it into the mobile app.

**Acceptance Criteria:**
- [ ] PWA: "Export Data" button creates JSON file with all Dexie.js data
- [ ] Mobile: "Import Data" button in Settings allows selecting .json file
- [ ] Use `expo-document-picker` for file selection
- [ ] Parse JSON, validate schema, insert into SQLite with `is_synced=0`
- [ ] After import, trigger full sync to push data to Supabase
- [ ] Confirmation dialog: "Imported X matches, Y players, Z venues"
- [ ] Handle duplicate detection: skip if server_id already exists
- [ ] Typecheck passes
- [ ] Test: export from PWA, import to mobile, verify all data appears

### US-M016: Push notifications for sync completion (future)
**Description:** As a user, I want notifications when my data finishes syncing or if there's a sync error.

**Acceptance Criteria:**
- [ ] Install push notifications: `expo install expo-notifications`
- [ ] Request notification permissions on iOS
- [ ] Local notification when large sync completes: "✅ All matches synced!"
- [ ] Local notification on sync error: "⚠️ Sync failed. Check your connection."
- [ ] User can disable notifications in Settings
- [ ] Typecheck passes

### US-M017: External TestFlight beta testing (optional)
**Description:** As a developer, I want to expand testing to external beta testers (up to 10,000).

**Acceptance Criteria:**
- [ ] App Store review submission for external testing (requires beta review)
- [ ] Public TestFlight link generated: `https://testflight.apple.com/join/<invite-code>`
- [ ] Beta App Description written (max 4000 characters)
- [ ] Beta testing feedback form URL configured
- [ ] External testers can install without email invitation
- [ ] Monitor crash reports and feedback in App Store Connect

### Phase 3: Advanced Features (Future Roadmap)

### US-M018: Advanced data visualization and analytics
**Description:** As a user, I want better charts and deeper analytics on mobile.

**Acceptance Criteria:**
- [ ] Migrate all 12+ insight cards to mobile using Victory Native
- [ ] Interactive charts: pinch-to-zoom on line charts, tap segments for details
- [ ] Custom streak visualizations: flame icons for win streaks
- [ ] Performance optimizations: lazy load heavy charts, use React.memo
- [ ] Export charts as images for sharing
- [ ] Typecheck passes

### US-M019: Social features - Friend connections and shared leaderboards
**Description:** As a user, I want to connect with friends and compare stats on real leaderboards.

**Acceptance Criteria:**
- [ ] Add `friendships` table in Supabase: user_id, friend_id, status (pending/accepted)
- [ ] Friend request flow: search by email/username, send invite, accept/decline
- [ ] Privacy settings: make profile public/private
- [ ] Shared leaderboards: query Supabase for friends' aggregated stats (win rate, matches this month, etc.)
- [ ] Leaderboard categories: Overall, Iron Man, Clutch King, Hot Streak (from US-037)
- [ ] Real-time updates using Supabase Realtime subscriptions
- [ ] Push notifications for friend requests
- [ ] Typecheck passes

### US-M020: Social features - Match challenges
**Description:** As a user, I want to challenge friends to "beat my score" or "play more this week."

**Acceptance Criteria:**
- [ ] Create `challenges` table: challenger_id, opponent_id, challenge_type, target_value, status, deadline
- [ ] Challenge types: "Beat my win streak", "Play 5 matches this week", "Win 3 in a row"
- [ ] Challenge notification: push notification to opponent, in-app badge
- [ ] Challenge progress tracking: auto-update from match logs
- [ ] Challenge completion: confetti animation, badge earned
- [ ] Leaderboard section: "Active Challenges"
- [ ] Typecheck passes

### US-M021: Wearables integration - Apple Watch companion app
**Description:** As an Apple Watch user, I want to log match results from my wrist post-match.

**Acceptance Criteria:**
- [ ] Create Apple Watch app target in Xcode (requires ejecting from Expo or using bare workflow)
- [ ] Watch app UI: quick score entry (11-9, 11-5 presets), opponent picker (recent 5)
- [ ] Sync match data from Watch to iPhone via WatchConnectivity framework
- [ ] iPhone app receives match, saves to SQLite, syncs to Supabase
- [ ] Watch complication: show last match result, current win streak
- [ ] Typecheck passes

### US-M022: Wearables integration - HealthKit workout import
**Description:** As a user, I want to import squash workouts from Apple Health to auto-suggest match dates.

**Acceptance Criteria:**
- [ ] Install HealthKit: `expo install expo-sensors` or native HealthKit module
- [ ] Request HealthKit permissions: read "Squash" workout type
- [ ] Query workouts from last 30 days: `HKWorkoutTypeIdentifier.squash`
- [ ] On match logging setup screen, show "Recent Workouts" section with dates
- [ ] Tap workout date to auto-fill match date/time
- [ ] Optional: import workout duration, calories burned, heart rate data as match metadata
- [ ] Typecheck passes

### US-M023: Wearables integration - Garmin/Fitbit API
**Description:** As a Garmin or Fitbit user, I want similar workout import functionality.

**Acceptance Criteria:**
- [ ] Integrate Garmin Health API (requires developer account)
- [ ] OAuth flow for Garmin Connect
- [ ] Fetch squash activities from Garmin API
- [ ] Display in "Recent Workouts" alongside HealthKit data
- [ ] Same auto-fill behavior as US-M022
- [ ] Typecheck passes

## Functional Requirements

### Authentication (FR-AUTH)
- **FR-AUTH-1:** App must support Apple Sign In (native iOS button, biometric authentication)
- **FR-AUTH-2:** App must support Google Sign In (OAuth flow via Supabase)
- **FR-AUTH-3:** User session persisted securely in AsyncStorage, expires after 30 days
- **FR-AUTH-4:** Logout clears local SQLite database and session (with confirmation dialog)
- **FR-AUTH-5:** First sign-in creates user profile in Supabase with default player record

### Data Sync (FR-SYNC)
- **FR-SYNC-1:** Local-first architecture: all writes go to SQLite first, sync in background
- **FR-SYNC-2:** Push sync triggers: (a) app foreground, (b) after local write, (c) every 5 min when active
- **FR-SYNC-3:** Pull sync triggers: (a) app launch, (b) pull-to-refresh, (c) after push sync completes
- **FR-SYNC-4:** Conflict resolution: Last Write Wins based on `updated_at` timestamp
- **FR-SYNC-5:** Offline mode: all features work offline, sync queue persists across app restarts
- **FR-SYNC-6:** Sync status visible: green ✅ when synced, yellow 🔄 when syncing, red ❌ when failed
- **FR-SYNC-7:** Failed syncs retry with exponential backoff (1s, 2s, 4s, 8s, max 5 attempts)

### Photo Storage (FR-PHOTO)
- **FR-PHOTO-1:** Photos compressed to max 1920px width, 85% JPEG quality before upload
- **FR-PHOTO-2:** Photos stored in Supabase Storage, not base64 in database
- **FR-PHOTO-3:** Photo URLs are public (signed URLs not required for MVP)
- **FR-PHOTO-4:** Offline photo uploads queued, uploaded when online
- **FR-PHOTO-5:** Photos deleted from storage when match is deleted (cascade delete)

### Performance (FR-PERF)
- **FR-PERF-1:** Match logging flow must complete in <60 seconds (same as PWA)
- **FR-PERF-2:** Dashboard must render in <2 seconds on iPhone 12 or newer
- **FR-PERF-3:** App bundle size <50 MB (uncompressed)
- **FR-PERF-4:** Match history list virtualized, supports 1000+ matches without lag
- **FR-PERF-5:** Charts lazy-loaded, only render when scrolled into view

### Security (FR-SEC)
- **FR-SEC-1:** All API calls to Supabase use RLS (Row Level Security) policies
- **FR-SEC-2:** User can only access their own data (enforced server-side)
- **FR-SEC-3:** Photos in storage accessible only by owner (RLS policy on bucket)
- **FR-SEC-4:** No sensitive data stored in AsyncStorage (only session token)
- **FR-SEC-5:** HTTPS only for all network requests

### TestFlight Distribution (FR-DIST)
- **FR-DIST-1:** Internal testing: up to 100 testers, no App Store review required
- **FR-DIST-2:** External testing: up to 10,000 testers, requires beta app review
- **FR-DIST-3:** Over-the-air updates via Expo Updates for instant bug fixes
- **FR-DIST-4:** Crash reporting via Sentry for debugging production issues

## Non-Goals (Out of Scope for MVP)

- ❌ Android version (Expo supports it, but iOS-only for MVP)
- ❌ iPad optimization (iPhone only, iPad runs in scaled mode)
- ❌ App Store public release (TestFlight only)
- ❌ Video analysis or shot tracking (future)
- ❌ Tournament bracket management (future)
- ❌ Coaching marketplace or paid features (future)
- ❌ Web app deprecation (PWA and mobile coexist)
- ❌ Multi-language support (English only for MVP)
- ❌ Accessibility features beyond basic iOS standards (future enhancement)

## Design Considerations

### Mobile-First UI Adaptations
- **Touch Targets:** Minimum 44pt (iOS guideline) for all tappable elements
- **Gestures:** Swipe for navigation (e.g., swipeable match logging steps), pull-to-refresh for sync
- **Typography:** System fonts (SF Pro on iOS) for native feel, scale up for readability
- **Safe Areas:** Respect iPhone notch, Dynamic Island, home indicator using `SafeAreaView`
- **Haptics:** Use `expo-haptics` for tactile feedback (light impact on tap, notification on success/error)

### Dark Mode
- Maintain existing dark theme (#0A0A0A background, #00E676 primary)
- Respect iOS system appearance setting
- Use `useColorScheme()` hook from React Native to detect system theme

### Animations
- Spring animations for tab transitions (React Navigation default)
- Confetti animation on match save (react-native-confetti-cannon)
- Skeleton loaders for async data (react-native-skeleton-placeholder)
- Smooth scroll animations using Animated API or Reanimated

### Accessibility
- VoiceOver support: label all interactive elements with `accessibilityLabel`
- Dynamic Type: respect user's font size settings
- High contrast mode support (test with iOS Accessibility Inspector)

## Technical Considerations

### Expo vs Bare React Native
- **Choice:** Expo managed workflow for MVP (easier TestFlight integration, OTA updates)
- **Tradeoff:** If need native modules not supported by Expo, can eject to bare workflow later
- **Expo modules used:** expo-sqlite, expo-image-picker, expo-haptics, expo-apple-authentication

### SQLite vs Realm vs WatermelonDB
- **Choice:** Expo SQLite (built-in, lightweight, sufficient for <10k records)
- **Alternative:** WatermelonDB if scaling to 100k+ records (optimized for React Native, lazy loading)

### Supabase vs Firebase
- **Choice:** Supabase (per user request, open-source, PostgreSQL)
- **Pros:** Generous free tier (50k monthly active users), full SQL control, RLS policies
- **Cons:** Less mature than Firebase, fewer third-party integrations

### State Management
- **Global State:** Zustand (existing choice, lightweight, persisted via AsyncStorage)
- **Server State:** React Query or SWR for caching Supabase queries (optional optimization)

### Chart Library
- **Choice:** Victory Native for React Native (declarative, actively maintained)
- **Alternative:** react-native-svg-charts (more lightweight but less features)

### Migration Strategy
- **Component Reuse:** ~60% of logic reusable (hooks, utils, recommendation engine)
- **UI Rewrite:** ~90% of UI components need React Native equivalents
- **Data Migration:** Export from PWA → Import to mobile (one-time, manual)

### Backend Infrastructure
```
Supabase (managed):
  ├─ PostgreSQL database (data storage)
  ├─ Auth (Apple + Google OAuth)
  ├─ Storage (match photos, 1GB free tier)
  ├─ Realtime (future: live leaderboards)
  └─ Edge Functions (future: AI recommendations)

Expo (build + distribute):
  ├─ EAS Build (cloud builds for TestFlight)
  ├─ EAS Submit (automated App Store uploads)
  └─ EAS Update (over-the-air updates)
```

## Success Metrics

### User Engagement
- **M1:** 80%+ of PWA users migrate to mobile within 3 months
- **M2:** 90%+ match logging success rate (no errors during save)
- **M3:** <5% sync failure rate in production
- **M4:** Average time to log match <60 seconds (same as PWA)

### Technical Performance
- **M5:** App crash rate <0.5% (measured via Sentry)
- **M6:** 95th percentile sync latency <3 seconds
- **M7:** Cold app start time <2 seconds on iPhone 12+

### TestFlight Adoption
- **M8:** 20+ internal testers install and test within first week
- **M9:** 100+ external beta testers if public TestFlight link shared
- **M10:** 4.0+ average rating from TestFlight feedback

## Open Questions

1. **Apple Developer Account:** Do you already have an Apple Developer account ($99/year required)? If not, this is a prerequisite for TestFlight.

2. **Supabase Tier:** Free tier limits (50k MAU, 500MB storage, 2GB bandwidth). Expected to exceed? If yes, Pro tier is $25/month.

3. **Existing PWA Users:** How many active PWA users exist? Will need migration communication plan.

4. **Data Migration:** Should we build a one-click "Migrate from PWA" flow, or manual export/import is acceptable?

5. **Social Features Priority:** Which is higher priority for Phase 3: friend leaderboards or wearables integration?

6. **App Naming:** Is "SquashIQ" final name? Check App Store for conflicts: https://apps.apple.com/search?term=squashiq

7. **Monetization:** Any plans for paid features (Pro tier, coaching marketplace)? Impacts architecture (need payment integration).

8. **Multi-Device Conflict:** If user logs match on Device A while offline, then logs different match on Device B while offline, both come online — how to handle? Current design: both matches persist (no conflict, different IDs).

## Phased Rollout Plan

### Sprint 1 (Weeks 1-2): Foundation
- US-M001: Expo setup
- US-M002: Supabase setup
- US-M003: Authentication UI
- US-M004: SQLite database

### Sprint 2 (Weeks 3-4): Core Sync & Features
- US-M005: Data sync engine
- US-M006: Photo upload
- US-M007: Bottom tabs
- US-M008: Match logging

### Sprint 3 (Weeks 5-6): Dashboard & Insights
- US-M009: Dashboard
- US-M010: Match detail
- US-M011: Core insights

### Sprint 4 (Week 7): TestFlight & Polish
- US-M012: TestFlight setup
- US-M013: App Store compliance
- US-M014: Onboarding
- US-M015: Data import
- US-M016: Push notifications

### Sprint 5 (Week 8): Beta Testing
- Bug fixes from internal testing
- Performance optimizations
- External TestFlight (optional)

### Sprint 6+ (Future): Advanced Features
- US-M018: Advanced analytics
- US-M019-M020: Social features
- US-M021-M023: Wearables integration

## Future Roadmap (Post-MVP)

### Q1 2026: Enhanced Analytics
- AI-powered recommendations using OpenAI API or local ML models
- Predictive win probability based on historical H2H data
- Shot heatmaps (requires manual court position tagging or computer vision)

### Q2 2026: Social & Multiplayer
- Real-time friend leaderboards with Supabase Realtime
- Weekly challenges and tournaments
- Public player profiles with shareable QR codes

### Q3 2026: Wearables & Health
- Apple Watch companion app for quick logging
- HealthKit integration for workout correlation
- Heart rate zones during matches (if tracked via wearable)

### Q4 2026: Advanced Features
- Video recording and AI shot analysis (computer vision)
- Court booking integration (OpenCourt, PlayYourCourt APIs)
- Coaching marketplace (connect with local pros)

### 2027: Platform Expansion
- Android version (same Expo codebase, 1-2 weeks adaptation)
- iPad optimization with split-view for match analysis
- Apple Vision Pro spatial computing app (3D shot visualizations)

---

## Appendix: Current App Feature Inventory (41 User Stories Completed)

✅ **Foundation (US-001 to US-007):** Vite + React, PWA, Dexie.js, Bottom tabs, Dark theme, Opponent/Venue management
✅ **Match Logging (US-008 to US-011):** 3-step flow, Score entry, Tags, Post-match animations
✅ **Match Management (US-012 to US-014):** History list, Detail view, Dashboard layout
✅ **Insights (US-015 to US-023):** 8 insight cards + progressive unlocking
✅ **Recommendations (US-024 to US-025):** Rule-based engine + display
✅ **Timeline (US-026 to US-029):** Win/Loss River, Rolling Win Rate, Heatmap, Milestones
✅ **Rally Analysis (US-030 to US-032):** Swipeable cards, Play style, 8-8+ Index
✅ **Gamification (US-033 to US-035):** Badges, Archetypes, Radar chart
✅ **Social Prep (US-036 to US-037):** Rivalry pages, Leaderboards (single-device)
✅ **Nostalgia (US-038):** Match of the Month, On This Day
✅ **Wrapped (US-039):** Season summary cards with sharing
✅ **Settings (US-040 to US-041):** Export/import, Onboarding

**Total Scope:** ~17 new user stories for mobile MVP, ~10 additional for advanced features.

---

**Document Version:** 1.0
**Created:** 2026-02-08
**Author:** Claude (Expert Product Review + Roadmap)
**Status:** Ready for Development
