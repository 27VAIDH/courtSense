# PRD: SquashIQ PWA v2.0 - Production-Ready with Authentication & Cloud Sync

## Introduction

Transform SquashIQ from a local-only PWA into a production-ready web application with user authentication, cloud data synchronization, and social features. Users will be able to create accounts using social login (Google + Apple Sign In), access their match history across all devices, connect with friends for real leaderboards, and enjoy a polished mobile-first experience. The app remains a Progressive Web App (installable via "Add to Home Screen" on iOS/Android) with offline-first architecture, but now backed by Supabase for cloud storage and real-time features.

**Key Transformation:**
```
Before: Browser → IndexedDB (device-locked data)
After:  Browser → IndexedDB (local cache) ⟷ Supabase (cloud source of truth)
        └─ Automatic migration for existing users
        └─ Social features with friend connections, groups, and leaderboards
```

## Executive Summary (Expert Product Analysis)

### Current State Assessment
**Strengths:**
- ✅ Comprehensive feature set: 41 user stories completed
- ✅ Excellent local-first architecture with Dexie.js
- ✅ Rich analytics: 12+ insight cards, recommendations, archetypes
- ✅ Gamification: badges, streaks, Season Wrapped
- ✅ PWA-ready: service worker, offline support, dark theme

**Critical Gaps:**
- 🔴 **No user accounts** - data is device-locked, not portable
- 🔴 **No cloud backup** - losing device = losing all match history
- 🔴 **Simulated social features** - leaderboards use fake data, no real opponents
- 🟡 **Base64 photos** - inefficient storage (50KB match photo = 67KB base64)
- 🟡 **Mobile UX friction** - some touch targets <44px, no haptic feedback
- 🟡 **No onboarding** - new users see empty states, unclear what to do first
- 🟡 **No search/filtering** - can't find "matches against Parth in January"
- 🟡 **No notifications** - users forget to log matches

### Target State (V2.0)
- ✅ **Multi-device sync** - log on phone, view on tablet, never lose data
- ✅ **Real social features** - connect with actual friends, compete on leaderboards
- ✅ **Production-ready** - proper auth, cloud storage, error handling, monitoring
- ✅ **Best-in-class mobile UX** - smooth animations, haptics, accessibility
- ✅ **User retention features** - onboarding, notifications, advanced search

### Market Positioning
**Competitors:** Squash Tracker, My Squash, Rankedin (all have cloud sync + social, but weak analytics)
**SquashIQ Differentiator:** Best-in-class analytics + insights (recommendations, archetypes, 12+ charts) combined with seamless social features.

## Goals

### Primary Goals (P0 - Must Have for V2.0)
- **G1:** Enable user authentication with Google + Apple Sign In via Supabase Auth
- **G2:** Implement automatic data migration: detect existing IndexedDB data, prompt account creation, auto-upload to cloud
- **G3:** Build bidirectional sync: offline-first writes to IndexedDB, background sync to Supabase (last write wins)
- **G4:** Migrate photos from base64 to Supabase Storage with offline caching
- **G5:** Comprehensive mobile UX overhaul: performance, touch interactions, iOS polish, accessibility
- **G6:** Add missing features: interactive onboarding, advanced search/filtering, Web Push notifications
- **G7:** Architect for future monetization with user tiers, feature flags, and analytics tracking

### Secondary Goals (P1 - Social Features, Phased Rollout)
- **G8:** Phase 1 - Friend connections: search users by email/username, send friend requests, accept/decline
- **G9:** Phase 2 - Real leaderboards: aggregate stats across all users, multiple categories, privacy controls
- **G10:** Phase 3 - Private groups/leagues: create "Thursday Night Club" with 10 members, group-specific leaderboards

### Success Metrics
- **M1:** 80%+ of existing users (localStorage detected) complete migration to accounts within 30 days
- **M2:** <2% data loss during migration (verified via pre/post record counts)
- **M3:** 95%+ sync success rate (tracked via Sentry error monitoring)
- **M4:** Lighthouse PWA score 95+ on mobile (currently ~85)
- **M5:** 50%+ of users add ≥1 friend within 14 days of account creation
- **M6:** 30%+ reduction in "forgot to log match" via push notifications

## User Stories

### Phase 0: Foundation & Infrastructure (Weeks 1-2)

### US-P001: Supabase project setup and database schema
**Description:** As a developer, I need Supabase backend configured with production-grade schema, RLS policies, and monitoring.

**Acceptance Criteria:**
- [ ] Create Supabase project at https://supabase.com (free tier, Production mode)
- [ ] Enable authentication providers: Google OAuth (configure client ID/secret), Apple Sign In (configure service ID)
- [ ] Create database schema with migrations (see detailed schema below)
- [ ] Enable Row Level Security (RLS) on all tables: `auth.uid() = user_id` policy
- [ ] Create database indexes for performance: `matches(user_id, date)`, `players(user_id)`, `friendships(user_id)`
- [ ] Set up Supabase Storage bucket: `match-photos` with RLS policy allowing users to upload/delete own photos
- [ ] Configure CORS: allow `localhost:5173` (dev) and production domain
- [ ] Enable Supabase Realtime for `friendships` and `leaderboard_cache` tables (for live updates)
- [ ] Install Supabase client: `npm install @supabase/supabase-js @supabase/auth-helpers-react`
- [ ] Create `src/lib/supabase.ts` with initialized client using env variables
- [ ] Configure `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Set up database backups: enable Point-in-Time Recovery (PITR) in Supabase dashboard
- [ ] Typecheck passes

**Detailed Database Schema:**
```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
-- auth.users table auto-created by Supabase Auth
-- Fields: id (UUID), email, created_at, updated_at, last_sign_in_at

-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE, -- for search, e.g., @hemang_squash
  display_name TEXT NOT NULL,
  avatar_url TEXT, -- optional profile photo
  bio TEXT, -- optional bio, max 280 chars
  privacy_setting TEXT DEFAULT 'friends' CHECK (privacy_setting IN ('public', 'friends', 'private')),
  user_tier TEXT DEFAULT 'free' CHECK (user_tier IN ('free', 'pro', 'enterprise')), -- for future monetization
  feature_flags JSONB DEFAULT '{}', -- e.g., {"beta_features": true}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CORE SQUASH DATA (migrated from IndexedDB)
-- ============================================

-- Players table (opponents + current user's player record)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🏸',
  is_current_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_ms BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT, -- for sync conflict resolution
  UNIQUE(user_id, name) -- prevent duplicate opponent names per user
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_home BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_ms BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, name)
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  opponent_id UUID REFERENCES players(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  format TEXT CHECK (format IN ('bo3', 'bo5')),
  result TEXT, -- 'W 3-1' or 'L 1-3'
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  vibe TEXT,
  tags TEXT[], -- PostgreSQL array
  note TEXT,
  photo_url TEXT, -- Supabase Storage public URL
  recommendation_text JSONB, -- {emoji, headline, context}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_ms BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  deleted_at TIMESTAMPTZ -- soft delete for sync
);

-- Games table (scores for each game in a match)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  my_score INTEGER NOT NULL CHECK (my_score >= 0),
  opponent_score INTEGER NOT NULL CHECK (opponent_score >= 0),
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

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Friendships table (bidirectional friend connections)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id) -- can't friend yourself
);

-- Groups/Leagues table (private squash clubs)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy TEXT DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group memberships
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Leaderboard cache (denormalized for performance)
-- Recomputed daily via scheduled job
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'overall', 'iron_man', 'clutch_king', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  metric_value NUMERIC NOT NULL, -- e.g., win rate 0.75, match count 42
  metric_label TEXT, -- e.g., "75%", "42 matches"
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, user_id)
);

-- ============================================
-- NOTIFICATIONS & ENGAGEMENT
-- ============================================

-- Push notification subscriptions (Web Push API)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL, -- encryption key
  auth TEXT NOT NULL, -- auth secret
  user_agent TEXT, -- for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue (for sending reminders, friend requests, etc.)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'match_reminder', 'friend_request', 'group_invite'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- e.g., {"friend_id": "uuid", "friendship_id": "uuid"}
  read BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & MONITORING
-- ============================================

-- Sync audit log (for debugging sync issues)
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('pull', 'push', 'conflict', 'error')),
  details JSONB, -- error messages, timestamps, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log (for analytics and debugging)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'match_created', 'friend_added', 'feature_unlocked'
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_matches_user_date ON matches(user_id, date DESC);
CREATE INDEX idx_matches_opponent ON matches(opponent_id) WHERE opponent_id IS NOT NULL;
CREATE INDEX idx_games_match ON games(match_id);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_venues_user ON venues(user_id);
CREATE INDEX idx_friendships_user ON friendships(user_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_friend ON friendships(friend_id) WHERE status = 'accepted';
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_leaderboard_category ON leaderboard_cache(category, rank);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX idx_activity_log_user_created ON activity_log(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rally_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles: read own + friends (if privacy allows)
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read friends' profiles if privacy allows"
  ON user_profiles FOR SELECT USING (
    privacy_setting = 'public' OR
    (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = user_profiles.id)
         OR (friend_id = auth.uid() AND user_id = user_profiles.id)
         AND status = 'accepted'
    ))
  );

-- Core squash data: users can only access their own
CREATE POLICY "Users can manage own players"
  ON players FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own venues"
  ON venues FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own matches"
  ON matches FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access games for their matches"
  ON games FOR ALL USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = games.match_id AND matches.user_id = auth.uid())
  );

CREATE POLICY "Users can access rally analyses for their matches"
  ON rally_analyses FOR ALL USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = rally_analyses.match_id AND matches.user_id = auth.uid())
  );

-- Friendships: users can see their own friendships + incoming requests
CREATE POLICY "Users can manage own friendships"
  ON friendships FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Groups: members can read, owner/admin can manage
CREATE POLICY "Users can read groups they belong to"
  ON groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can update their groups"
  ON groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group members can read membership list"
  ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
  );

-- Leaderboards: read-only, publicly accessible (respect profile privacy)
CREATE POLICY "Anyone can read leaderboard cache"
  ON leaderboard_cache FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = leaderboard_cache.user_id
      AND (user_profiles.privacy_setting = 'public' OR user_profiles.id = auth.uid())
    )
  );

-- Notifications: users can only access their own
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Push subscriptions: users can only manage their own
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR AUTOMATED TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified_ms = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### US-P002: Authentication UI with Google & Apple Sign In
**Description:** As a user, I want to sign in with my Google or Apple account so I can access my match data across all my devices.

**Acceptance Criteria:**
- [ ] Create `src/pages/AuthPage.tsx` - full-screen auth landing page
- [ ] Install auth dependencies: `npm install @supabase/auth-ui-react @supabase/auth-ui-shared`
- [ ] Use Supabase Auth UI component for quick implementation: `<Auth supabaseClient={supabase} providers={['google', 'apple']} />`
- [ ] Custom branding: SquashIQ logo, primary green theme (#00E676), dark background (#0A0A0A)
- [ ] Hero section: "Your squash journey, synced across all devices" with animated court illustration
- [ ] Value props below auth buttons: "📊 Deep insights", "🔄 Never lose data", "👥 Compete with friends"
- [ ] Apple Sign In requires: Apple Developer account, configure at developer.apple.com/account, add redirect URL to Supabase
- [ ] Google Sign In requires: OAuth client ID from Google Cloud Console, configure redirect URL
- [ ] Auth callback handling: redirect to `/auth/callback` route which processes token, then redirects to Dashboard
- [ ] Auth state management: create Zustand store `useAuthStore` with `user`, `session`, `loading` state
- [ ] Protected routes: wrap app with `<AuthGuard>` that redirects to `/auth` if not logged in
- [ ] Logout button in Profile tab: calls `supabase.auth.signOut()`, clears IndexedDB, resets Zustand stores
- [ ] Session persistence: Supabase auto-persists to localStorage, expires after 7 days (configurable)
- [ ] Error handling: display user-friendly messages for auth failures ("Sign in failed. Please try again.")
- [ ] Typecheck passes
- [ ] Verify in browser: sign in with Google, confirm redirected to Dashboard, check Network tab for auth token

**Apple Sign In Configuration Notes:**
```
1. Go to developer.apple.com → Certificates, IDs & Profiles → Identifiers
2. Create new Service ID (e.g., com.squashiq.web)
3. Enable "Sign in with Apple", configure domains and redirect URLs
4. In Supabase dashboard → Authentication → Providers → Apple:
   - Services ID: com.squashiq.web
   - Secret Key: download .p8 key from Apple Developer, paste here
```

### US-P003: Automatic data migration from IndexedDB to Supabase
**Description:** As an existing user, I want my local match history automatically uploaded to the cloud when I create an account so I don't lose any data.

**Acceptance Criteria:**
- [ ] On auth page load, check if IndexedDB has existing data: `const hasLocalData = (await db.matches.count()) > 0`
- [ ] If hasLocalData && !session: show migration prompt above auth buttons: "⚠️ You have X matches stored locally. Sign in to back them up to the cloud!"
- [ ] After successful first sign-in, detect if migration needed: check if `user_profiles.migrated_from_local` flag is false
- [ ] Show migration modal: "🔄 Uploading your match history... (X/Y complete)" with progress bar
- [ ] Migration process:
  1. Upload players: iterate `db.players.toArray()`, insert to Supabase, map local IDs to server UUIDs
  2. Upload venues: same process, maintain ID mapping
  3. Upload matches: remap opponent_id and venue_id to server UUIDs, batch insert (50 per request)
  4. Upload games: link to server match_id via mapping
  5. Upload rally analyses: link to server match_id
  6. Handle photos separately (US-P005)
- [ ] After successful migration: set `user_profiles.migrated_from_local = true` in Supabase
- [ ] Keep local data in IndexedDB after migration (becomes cache, synced going forward)
- [ ] Error handling: if migration fails partway, show "Migration paused. X/Y uploaded. Retry?" button
- [ ] Track migration success: log to `activity_log` table with event_type 'migration_completed', event_data `{records_migrated: {players: 5, matches: 42}}`
- [ ] Pre-migration data validation: check for corrupt records (e.g., matches with no games), skip or fix during migration
- [ ] Typecheck passes
- [ ] Test: create 10 matches locally, sign in, verify all 10 appear in Supabase, verify IDs remapped correctly

**Migration Code Example:**
```typescript
async function migrateLocalDataToSupabase(userId: string) {
  const idMapping = { players: new Map(), venues: new Map(), matches: new Map() };

  // 1. Migrate players
  const localPlayers = await db.players.toArray();
  for (const player of localPlayers) {
    const { data } = await supabase.from('players').insert({
      user_id: userId,
      name: player.name,
      emoji: player.emoji,
      is_current_user: player.isCurrentUser,
      created_at: player.createdAt,
    }).select().single();
    if (data) idMapping.players.set(player.id, data.id);
  }

  // 2. Migrate matches with remapped IDs
  const localMatches = await db.matches.toArray();
  for (const match of localMatches) {
    const { data } = await supabase.from('matches').insert({
      user_id: userId,
      date: match.date,
      opponent_id: idMapping.players.get(match.opponentId),
      venue_id: idMapping.venues.get(match.venueId),
      // ... rest of fields
    }).select().single();
    if (data) idMapping.matches.set(match.id, data.id);
  }

  // 3. Migrate games
  const localGames = await db.games.toArray();
  const gamesToInsert = localGames.map(g => ({
    match_id: idMapping.matches.get(g.matchId),
    game_number: g.gameNumber,
    my_score: g.myScore,
    opponent_score: g.opponentScore,
    is_tight: g.isTight,
  }));
  await supabase.from('games').insert(gamesToInsert);

  // Mark migration complete
  await supabase.from('user_profiles').update({ migrated_from_local: true }).eq('id', userId);
}
```

### US-P004: Bidirectional sync engine with last-write-wins conflict resolution
**Description:** As a user, I want my data automatically synced between my devices so logging a match on my phone instantly appears on my laptop.

**Acceptance Criteria:**
- [ ] Create `src/lib/sync.ts` with sync orchestrator
- [ ] Sync triggers:
  - **On app load:** pull latest data from Supabase
  - **After local write:** push new/updated record to Supabase
  - **On window focus:** pull updates (user switched back to tab)
  - **Periodic:** pull every 2 minutes when tab is active (setInterval)
- [ ] **Push sync (local → cloud):**
  - Track dirty records in Zustand store: `useSyncStore` with `dirtyMatches: Set<UUID>`
  - After creating/updating match in IndexedDB, add to dirtyMatches set
  - Push function: iterate dirtyMatches, upsert to Supabase with `onConflict: 'id'`
  - On success: remove from dirtyMatches, update `last_modified_ms` locally
  - On failure: keep in dirtyMatches, retry with exponential backoff (1s, 2s, 4s, max 8s)
- [ ] **Pull sync (cloud → local):**
  - Fetch records modified since last sync: `supabase.from('matches').select('*').gt('last_modified_ms', lastSyncTimestamp)`
  - For each server record: compare `last_modified_ms` with local record
  - If server timestamp > local: overwrite local with server data (last write wins)
  - If local timestamp > server: skip (will be pushed in next push sync)
  - Update `lastSyncTimestamp` in localStorage after successful pull
- [ ] **Conflict resolution (Last Write Wins):**
  - Simple strategy: newest `last_modified_ms` always wins, no merge logic
  - Edge case: if timestamps equal (unlikely), server wins by default
  - Log conflicts to console for debugging: `console.warn('[Sync] Conflict detected for match', matchId, 'server wins')`
- [ ] **Soft deletes:** when user deletes match locally, set `deleted_at` timestamp, sync to server, server marks deleted, pull sync removes from local IndexedDB
- [ ] **Offline queue:** if offline, queue dirty records in IndexedDB `sync_queue` table, flush when online
- [ ] **Sync status UI:** add sync indicator to Dashboard header:
  - Green ✅ "Synced" when dirtyMatches.size === 0
  - Yellow 🔄 "Syncing..." when dirtyMatches.size > 0
  - Red ❌ "Sync failed" if last sync attempt failed (with "Retry" button)
- [ ] **Manual sync:** add pull-to-refresh gesture on Dashboard (react-use-gesture library) that triggers full pull sync
- [ ] **Sync debugging:** log all sync operations to `sync_log` table in Supabase (action: 'pull'/'push'/'conflict'/'error', details JSONB)
- [ ] Typecheck passes
- [ ] Test: open 2 browser tabs as same user, create match in Tab A, verify appears in Tab B within 2 sec, edit in Tab B, verify update in Tab A

**Sync Flow Diagram:**
```
User creates match
  ↓
Write to IndexedDB (instant, UI updates)
  ↓
Add to dirtyMatches set
  ↓
Trigger push sync (debounced 500ms)
  ↓
POST to Supabase /matches (upsert)
  ↓
Success: remove from dirtyMatches, show ✅
Failure: keep in dirtyMatches, retry with backoff, show ❌
```

### US-P005: Photo migration to Supabase Storage with offline caching
**Description:** As a user, I want my match photos stored in the cloud but still viewable offline so I can show friends my best wins even without internet.

**Acceptance Criteria:**
- [ ] **Upload flow (new photos):**
  - When user selects photo during match logging, compress to max 1920px width using `browser-image-compression` library
  - Generate filename: `{userId}/{matchId}_{timestamp}.jpg`
  - Upload to Supabase Storage: `supabase.storage.from('match-photos').upload(filename, blob)`
  - Store public URL in `matches.photo_url` column (not base64)
  - If offline: queue photo upload in IndexedDB `photo_upload_queue` table, upload when online
- [ ] **Migration flow (existing base64 photos):**
  - During data migration (US-P003), detect matches with `photoBase64` field
  - Convert base64 to Blob: `const blob = await fetch(photoBase64).then(r => r.blob())`
  - Upload to Supabase Storage, update `matches.photo_url`
  - Delete `photoBase64` from IndexedDB after successful migration
- [ ] **Offline caching:**
  - After uploading/fetching photo URL, download blob and store in IndexedDB `photo_cache` table: `{url, blob, cachedAt}`
  - When displaying photo: check if cached locally first, else fetch from URL
  - Cache size limit: max 50 photos (approx 50MB), LRU eviction policy
  - Use `<img src={cachedBlobUrl || photoUrl} />` pattern
- [ ] **Delete flow:**
  - When user deletes match, also delete photo from Supabase Storage: `supabase.storage.from('match-photos').remove([filename])`
  - Remove from local cache
- [ ] **Storage bucket policy (RLS):**
  - Users can only upload/delete photos in their own folder: `(storage.foldername(name))[1] = auth.uid()::text`
  - Photos are publicly readable (no signed URLs needed for MVP)
- [ ] Error handling: if photo upload fails, show "Photo upload failed" toast, match still saves without photo
- [ ] Typecheck passes
- [ ] Test: upload photo, verify in Supabase Storage dashboard, go offline, verify photo still displays, delete match, verify photo deleted from storage

### US-P006: Comprehensive mobile UX overhaul - Performance optimizations
**Description:** As a mobile user, I want the app to load fast and run smoothly so I can log matches without waiting.

**Acceptance Criteria:**
- [ ] **Code splitting:** use React `lazy()` and `Suspense` for route-based code splitting:
  ```tsx
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const LogMatch = lazy(() => import('./pages/LogMatch'));
  ```
- [ ] **Bundle size optimization:**
  - Run `npm run build` and analyze with `vite-plugin-bundle-visualizer`
  - Tree-shake unused Recharts components (import specific charts, not entire library)
  - Replace heavy libraries: consider `date-fns` → `date-fns/esm` for smaller bundle
  - Target: main bundle <200KB gzipped (currently ~300KB)
- [ ] **Image optimization:**
  - Use WebP format for app icons and illustrations (fallback to PNG for old browsers)
  - Lazy load images with `loading="lazy"` attribute
  - Use Supabase image transformations for resizing photos on-the-fly: `?width=400&quality=80`
- [ ] **Database query optimization:**
  - Add pagination to match history: load 20 matches initially, infinite scroll for more
  - Use Dexie indexes for fast queries: `db.matches.where('date').below(cutoff).reverse().limit(20)`
  - Memoize expensive calculations (e.g., insight card data) with `useMemo()`
- [ ] **Service Worker caching strategy:**
  - Update `vite-plugin-pwa` config to precache critical assets (fonts, icons, core JS/CSS)
  - Runtime caching for Supabase API responses (stale-while-revalidate strategy)
  - Network-first for match data, cache-first for photos
- [ ] **Critical rendering path:**
  - Inline critical CSS for above-the-fold content
  - Preload fonts: `<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>`
  - Defer non-critical JS: move analytics scripts to bottom of `<body>`
- [ ] **Metrics tracking:**
  - Add Web Vitals monitoring: `npm install web-vitals`, report LCP, FID, CLS to console (later: send to analytics)
  - Target metrics: LCP <2.5s, FID <100ms, CLS <0.1
- [ ] Typecheck passes
- [ ] Run Lighthouse audit on mobile: score 95+ for Performance, 100 for PWA

### US-P007: Mobile UX overhaul - Touch interactions and haptic feedback
**Description:** As a mobile user, I want smooth swipe gestures and haptic feedback so the app feels native and responsive.

**Acceptance Criteria:**
- [ ] **Touch target sizes:**
  - Audit all interactive elements: buttons, chips, cards
  - Ensure minimum 44x44px touch target (iOS guideline) or 48x48px (Material Design)
  - Add padding to small elements: e.g., icon buttons should have `p-3` (12px padding)
- [ ] **Swipe gestures:**
  - Install gesture library: `npm install @use-gesture/react`
  - Match logging steps: swipe left/right to navigate between Step 1/2/3 (alternative to Next/Back buttons)
  - Match cards: swipe left to reveal "Delete" button (iOS-style)
  - Dashboard: pull-to-refresh gesture triggers sync (already in US-P004)
- [ ] **Haptic feedback (Vibration API):**
  - On button press: `navigator.vibrate(10)` for light impact
  - On match save success: `navigator.vibrate([50, 50, 50])` for success pattern
  - On delete confirmation: `navigator.vibrate(20)` for warning impact
  - Respect user preference: check `prefers-reduced-motion` media query, disable haptics if true
- [ ] **Smooth animations:**
  - Use Framer Motion for all transitions: page transitions, modal open/close, card reveals
  - Spring animations for natural feel: `transition={{ type: 'spring', damping: 20 }}`
  - Reduce motion: respect `prefers-reduced-motion`, use instant transitions if enabled
- [ ] **Scroll performance:**
  - Use `will-change: transform` for animated elements
  - Virtual scrolling for long lists: use `react-window` for match history if >100 matches
  - Passive event listeners: `{passive: true}` for scroll/touch handlers
- [ ] **Focus states for keyboard users:**
  - Add visible focus rings: `focus-visible:ring-2 focus-visible:ring-primary`
  - Tab order logical: follows visual order
- [ ] Typecheck passes
- [ ] Test on physical iPhone: verify swipe gestures feel responsive, haptics trigger correctly

### US-P008: Mobile UX overhaul - iOS-specific polish
**Description:** As an iPhone user, I want the app to respect iOS design patterns and integrate with system features.

**Acceptance Criteria:**
- [ ] **Safe area insets:**
  - Use CSS `env(safe-area-inset-*)` for notch/Dynamic Island support
  - Bottom tab bar padding: `padding-bottom: calc(16px + env(safe-area-inset-bottom))`
  - Top header padding: `padding-top: calc(16px + env(safe-area-inset-top))`
  - Test on iPhone 14 Pro (Dynamic Island) and iPhone SE (no notch)
- [ ] **Status bar theming:**
  - Update `index.html` meta tags:
    ```html
    <meta name="theme-color" content="#0A0A0A">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    ```
  - Status bar blends with app background (dark mode)
- [ ] **PWA install prompt:**
  - Detect if app is already installed: `window.matchMedia('(display-mode: standalone)').matches`
  - If not installed, show custom "Install App" banner (iOS doesn't support `beforeinstallprompt` event)
  - Banner text: "📱 Add SquashIQ to your home screen for the best experience"
  - "How to Install" guide: "Tap Share → Add to Home Screen"
  - Dismiss banner permanently on close: store flag in localStorage
- [ ] **Splash screen:**
  - Update `manifest.json` with custom splash screen icon (1024x1024 PNG)
  - Background color matches app: `#0A0A0A`
- [ ] **App icons:**
  - Generate all required sizes: 180x180 (home screen), 167x167 (iPad), 152x152, 120x120
  - Use https://www.appicon.co/ or similar generator
  - Icons should be opaque (no transparency) per Apple guidelines
- [ ] **Scrolling behavior:**
  - Disable overscroll bounce on body: `overscroll-behavior-y: none` for iOS
  - Enable scroll momentum: `-webkit-overflow-scrolling: touch`
- [ ] **Form inputs:**
  - Use correct input types: `type="email"`, `type="tel"`, `type="date"` for native keyboards
  - Add `autocomplete` attributes for autofill: `autocomplete="name"`, `autocomplete="email"`
  - Disable autocorrect for usernames: `autocorrect="off" autocapitalize="none"`
- [ ] Typecheck passes
- [ ] Test on iOS Safari: verify safe areas correct, install prompt works, splash screen displays

### US-P009: Mobile UX overhaul - Accessibility improvements
**Description:** As a user with accessibility needs, I want the app to be fully usable with VoiceOver, keyboard navigation, and high contrast mode.

**Acceptance Criteria:**
- [ ] **Semantic HTML:**
  - Replace `<div>` with proper elements: `<button>`, `<nav>`, `<main>`, `<article>`, `<header>`
  - Use `<h1>` - `<h6>` for headings in logical order
  - Use `<label>` for all form inputs, associated with `htmlFor`
- [ ] **ARIA attributes:**
  - Add `aria-label` to icon-only buttons: e.g., `<button aria-label="Delete match">`
  - Use `aria-live="polite"` for sync status indicator (screen reader announces updates)
  - Add `role="status"` to loading states, `role="alert"` for errors
  - Use `aria-expanded` for collapsible sections (e.g., insight cards)
- [ ] **Keyboard navigation:**
  - All interactive elements focusable via Tab key
  - Modal dialogs trap focus: can't Tab outside modal
  - Escape key closes modals
  - Arrow keys navigate chip selectors (opponent picker, venue picker)
  - Enter key submits forms, Space key toggles checkboxes
- [ ] **Focus management:**
  - After modal close, return focus to trigger button
  - After page navigation, focus moves to main content (skip nav link)
  - Visible focus indicators: `focus-visible:ring-2 ring-primary`
- [ ] **Color contrast:**
  - Run WCAG AA contrast checker: all text meets 4.5:1 ratio
  - Primary green (#00E676) on dark background (#0A0A0A) = 11:1 ✅
  - Secondary text (#B0B0B0) on dark = 7:1 ✅
- [ ] **Screen reader testing:**
  - Test with VoiceOver on iOS: all buttons/links have descriptive labels
  - Charts have text alternatives: `<p class="sr-only">Win rate against Parth: 70% (7 wins, 3 losses)</p>`
- [ ] **Dynamic Type support (iOS):**
  - Use relative units: `rem` instead of `px` for font sizes
  - Test with iOS Settings → Display & Brightness → Text Size at largest setting
  - Content should reflow without horizontal scrolling
- [ ] Typecheck passes
- [ ] Run axe DevTools accessibility audit: 0 violations, <5 warnings

### Phase 1: Core Features & Missing Functionality (Weeks 3-4)

### US-P010: Interactive onboarding for new users
**Description:** As a new user, I want a guided tutorial on first launch so I understand how to use SquashIQ and see its value immediately.

**Acceptance Criteria:**
- [ ] **Onboarding flow (3 steps):**
  - Step 1: "Log matches in 60 seconds" with animated match logging demo (auto-playing Lottie animation or video)
  - Step 2: "Discover insights" showing sample insight cards (win rate chart, current form sparkline)
  - Step 3: "Track improvement" with timeline visualization and Season Wrapped preview
- [ ] **Sample data generation:**
  - "Start with sample data" button generates 20 realistic matches with varied opponents, dates, scores
  - Sample opponents: Parth, Hemang, Sarah, Mike (with emojis)
  - Sample venues: Downtown Squash Club, Home Court
  - Sample data is clearly marked (e.g., banner "👀 This is sample data. Log your first real match to replace it!")
- [ ] **Swipeable cards:**
  - Use Framer Motion `AnimatePresence` for smooth left/right swipe transitions
  - Progress dots at bottom (1/3, 2/3, 3/3)
  - "Skip" button in top-right, "Get Started" button on final step
- [ ] **Completion:**
  - "Get Started" navigates to Dashboard (with sample data) OR /log (to log first real match)
  - Store `onboarding_completed` flag in localStorage, never show again
  - Add "Replay Tutorial" option in Settings for users who want to see it again
- [ ] **First match nudge:**
  - After onboarding, show persistent banner on Dashboard: "🚀 Log your first match to unlock real insights!"
  - Banner dismisses after first match logged
- [ ] Typecheck passes
- [ ] Verify in browser: fresh localStorage, trigger onboarding, swipe through steps, verify sample data generated

### US-P011: Advanced search and filtering for matches
**Description:** As a user with 100+ matches, I want to search and filter my match history so I can find specific matches quickly.

**Acceptance Criteria:**
- [ ] **Search bar on Dashboard:**
  - Sticky search bar at top of match history section (below header)
  - Placeholder: "Search matches... (opponent, venue, date, note)"
  - Debounced input: trigger search 300ms after user stops typing
- [ ] **Search functionality:**
  - Search by opponent name (fuzzy match: "par" matches "Parth")
  - Search by venue name
  - Search by match note text
  - Search by date: support natural language "last week", "january 2025", "2024-12-25"
  - Use Dexie compound queries: `db.matches.filter(m => m.opponentName.includes(query) || ...)`
- [ ] **Filter UI:**
  - Filter dropdown next to search bar: "All | Wins | Losses | Tight Games | This Month"
  - Filters are additive: can combine search + filter (e.g., "opponent:Parth + Wins only")
- [ ] **Advanced filters (collapsible section):**
  - Date range picker: "From" and "To" date inputs
  - Opponent multi-select: checkboxes for all opponents
  - Venue multi-select
  - Energy level: Low | Medium | High checkboxes
  - Tags multi-select: all unique tags across matches
  - Format: Bo3 | Bo5 checkboxes
- [ ] **URL state management:**
  - Filters persist in URL query params: `?search=parth&result=win&month=2025-01`
  - Shareable URLs: copy link, send to friend (if public profile), they see same filtered view
- [ ] **Results UI:**
  - Match count: "Showing 12 of 150 matches"
  - Empty state: "No matches found. Try adjusting your filters."
  - Clear filters button
- [ ] **Performance:**
  - If >500 matches, add loading indicator for search (IndexedDB queries can be slow)
  - Consider full-text search library: `minisearch` or `fuse.js` for fuzzy search
- [ ] Typecheck passes
- [ ] Test: create 50 matches with varied data, search for "Parth", verify only Parth matches shown, apply "Wins" filter, verify result

### US-P012: Web Push notifications for match reminders
**Description:** As a user, I want reminders to log matches so I don't forget after playing.

**Acceptance Criteria:**
- [ ] **Permission request:**
  - After user logs 3rd match, show modal: "📬 Get reminders to log matches. Stay consistent!"
  - Two buttons: "Enable Notifications" (requests permission) and "Not Now" (dismiss)
  - Don't ask again if user clicks "Not Now" (store flag in localStorage)
- [ ] **Push subscription:**
  - On permission grant: subscribe to push notifications using Service Worker Push API
  - Generate subscription: `serviceWorker.pushManager.subscribe({userVisibleOnly: true, applicationServerKey})`
  - Save subscription to Supabase `push_subscriptions` table (endpoint, p256dh, auth keys)
- [ ] **Notification types:**
  - **Match reminder:** "Haven't logged a match in 7 days. Keep your streak going! 💪"
  - **Friend request:** "Parth sent you a friend request" (from US-P013)
  - **Leaderboard update:** "You moved up to #3 in Overall Leaderboard!" (from US-P015)
- [ ] **Notification scheduling (server-side):**
  - Supabase Edge Function or cron job runs daily at 8pm
  - Query users who haven't logged matches in 7+ days
  - Insert notifications to `notifications` table
  - Send push to each user's subscriptions via Web Push protocol (use `web-push` npm library)
- [ ] **Notification click handling:**
  - Clicking notification opens app at relevant page: match reminder → /log, friend request → /profile
  - Use `notificationclick` event in Service Worker
- [ ] **Notification settings:**
  - Add to Settings page: toggle for each notification type (match reminders, friend requests, leaderboard updates)
  - Unsubscribe: delete subscription from Supabase
- [ ] **VAPID keys:**
  - Generate VAPID keys for Web Push: `npx web-push generate-vapid-keys`
  - Store public key in `.env.local`, private key in Supabase Edge Function secrets
- [ ] Typecheck passes
- [ ] Test: grant permission, wait for reminder (or manually trigger via Supabase Edge Function), verify notification appears, click notification, verify redirected to /log

**Web Push Implementation Notes:**
```typescript
// Service Worker (sw.js)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url }, // e.g., '/log'
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Client-side subscription
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY),
  });

  await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
    auth: arrayBufferToBase64(subscription.getKey('auth')),
  });
}
```

### Phase 2: Social Features - Friend Connections (Week 5)

### US-P013: Friend connections - Search and send friend requests
**Description:** As a user, I want to find my squash buddies by username and send friend requests so we can compare stats.

**Acceptance Criteria:**
- [ ] **User profile setup:**
  - On first sign-in, prompt user to choose username: "Choose a unique username (e.g., @parth_squash)"
  - Username validation: alphanumeric + underscores, 3-20 chars, unique in database
  - Store in `user_profiles.username` column
  - Optional: display name (can be different from username), bio, avatar photo
- [ ] **Friend search UI (Profile tab):**
  - "Find Friends" section with search bar
  - Search by username or email: `supabase.from('user_profiles').select().or('username.ilike.%query%,email.ilike.%query%')`
  - Results show: avatar, display name, username, bio (truncated), "Add Friend" button
  - If already friends: show "Friends ✓" badge
  - If friend request pending: show "Request Sent" (disabled button)
- [ ] **Send friend request:**
  - Click "Add Friend" → insert to `friendships` table: `{user_id: me, friend_id: them, status: 'pending'}`
  - Send push notification to friend: "Parth sent you a friend request"
  - Optimistic UI update: button changes to "Request Sent" immediately
- [ ] **Friend requests inbox:**
  - "Friend Requests" section on Profile tab
  - Show pending incoming requests: avatar, name, username, "Accept" and "Decline" buttons
  - Badge on Profile tab icon: red dot if unread requests
- [ ] **Accept friend request:**
  - Update `friendships` table: set `status = 'accepted'`, set `accepted_at = NOW()`
  - Create reverse friendship record: `{user_id: them, friend_id: me, status: 'accepted'}` (for bidirectional queries)
  - Send notification to requester: "Hemang accepted your friend request!"
- [ ] **Decline friend request:**
  - Update `friendships` table: set `status = 'declined'`
  - Optionally delete record (declined requests not visible in UI)
- [ ] **Friends list:**
  - "My Friends" section on Profile tab
  - Show all accepted friends: avatar, name, username, "View Profile" button
  - Sort by: recently added, alphabetical, most matches logged (if stats visible)
- [ ] **Privacy controls:**
  - In Settings: "Who can send me friend requests?" → Everyone | Friends of Friends | Nobody
  - "Who can see my profile?" → Public | Friends Only | Private (from user_profiles.privacy_setting)
- [ ] Typecheck passes
- [ ] Test: create 2 accounts, search for Account B from Account A, send request, accept from Account B, verify both see each other in friends list

### US-P014: Friend profiles - View friends' stats and match history
**Description:** As a user, I want to view my friends' squash stats so I can celebrate their wins and friendly compete.

**Acceptance Criteria:**
- [ ] **Friend profile page (`/profile/:userId`):**
  - Header: avatar, display name, username, bio
  - Privacy-respecting stats (based on `user_profiles.privacy_setting`):
    - **Public profile:** show all stats (overall record, current form, top insights)
    - **Friends only:** show stats only to accepted friends
    - **Private:** show only name/username, no stats
- [ ] **Stats to display:**
  - Overall record: "42W - 18L (70%)"
  - Current form: last 5 matches as colored dots
  - Top 3 insight cards: Win Rate by Opponent, Energy Impact, Current Form (if data available)
  - Match history: last 10 matches (opponent, date, result) - privacy filtered
- [ ] **Head-to-head section:**
  - If friend is also in your opponents list (you've played them): show H2H record
  - "You vs Parth: 7-3 (70%)" with mini chart
  - Link to full rivalry page: `/rivals/:opponentId`
- [ ] **Interaction buttons:**
  - "Challenge" button (future: sends challenge notification, US-P018)
  - "Message" button (future: in-app messaging, post-MVP)
  - "Unfriend" button (confirmation dialog, deletes friendship records)
- [ ] **Empty states:**
  - If friend has no matches: "Parth hasn't logged any matches yet. Invite them to get started!"
- [ ] Typecheck passes
- [ ] Test: view friend profile, verify stats visible, unfriend, verify removed from friends list

### Phase 3: Social Features - Real Leaderboards (Week 6)

### US-P015: Global leaderboards across all users
**Description:** As a competitive user, I want to see how I rank against all SquashIQ users worldwide in multiple categories.

**Acceptance Criteria:**
- [ ] **Leaderboard categories (from US-037):**
  - Overall Record (win rate, min 10 matches)
  - Iron Man (matches logged this calendar month)
  - Clutch King (8-8+ Index, min 10 tight games)
  - Comeback Kid (comeback win rate: won after losing Game 1)
  - Hot Streak (current consecutive win count)
  - Consistency Crown (lowest win rate std deviation over last 20 matches)
  - Most Improved (win rate change: last 30 days vs prior 30 days)
- [ ] **Leaderboard computation (daily cron job):**
  - Supabase Edge Function runs at midnight UTC
  - Aggregates stats for all users: `SELECT user_id, COUNT(*) as matches, SUM(CASE WHEN result LIKE 'W%' THEN 1 ELSE 0 END) / COUNT(*) as win_rate FROM matches GROUP BY user_id HAVING COUNT(*) >= 10`
  - Ranks users per category, stores in `leaderboard_cache` table
  - Respects privacy: only include users with `privacy_setting IN ('public', 'friends')` OR current user's friends
- [ ] **Leaderboard UI (Rivals tab):**
  - Horizontal scrollable category pills: Overall | Iron Man | Clutch King | ...
  - Tap pill to switch category
  - Ranked list: rank number, avatar, display name, metric value (e.g., "75%", "42 matches")
  - Highlight current user's row with accent color border
  - "You are ranked #12 of 345 users"
- [ ] **Friends-only leaderboard toggle:**
  - Toggle at top: "All Users" | "Friends Only"
  - Friends Only: filter leaderboard to show only accepted friends
- [ ] **Privacy opt-out:**
  - In Settings: "Show me on public leaderboards" toggle (updates `user_profiles.privacy_setting`)
  - If opted out: user still sees leaderboards but doesn't appear on them
- [ ] **Real-time updates:**
  - Use Supabase Realtime to listen to `leaderboard_cache` table changes
  - When new rankings computed, UI updates automatically (if user on Rivals tab)
- [ ] **Anti-toxicity design:**
  - Encouraging copy: "Hemang is on fire this month! 🔥" for top rankers
  - No "worst" rankings or negative framing
  - Focus on improvement: "You moved up 3 spots this week!"
- [ ] Typecheck passes
- [ ] Test: create 5 users with varied match data, run leaderboard computation, verify rankings correct, toggle Friends Only, verify filtered

**Leaderboard Computation Example:**
```sql
-- Overall Record leaderboard
INSERT INTO leaderboard_cache (category, user_id, rank, metric_value, metric_label)
SELECT
  'overall' as category,
  user_id,
  ROW_NUMBER() OVER (ORDER BY win_rate DESC) as rank,
  win_rate,
  CONCAT(ROUND(win_rate * 100), '%') as metric_label
FROM (
  SELECT
    user_id,
    COUNT(*) as total_matches,
    SUM(CASE WHEN result LIKE 'W%' THEN 1.0 ELSE 0.0 END) / COUNT(*) as win_rate
  FROM matches
  WHERE deleted_at IS NULL
  GROUP BY user_id
  HAVING COUNT(*) >= 10
) subquery
JOIN user_profiles ON user_profiles.id = subquery.user_id
WHERE user_profiles.privacy_setting IN ('public', 'friends');
```

### US-P016: Leaderboard notifications and celebrations
**Description:** As a competitive user, I want to be notified when I rank up or achieve a leaderboard milestone.

**Acceptance Criteria:**
- [ ] **Rank change detection:**
  - After daily leaderboard recomputation, compare previous rank with new rank per category
  - If improved: insert notification: "🎉 You moved up to #5 in Iron Man leaderboard!"
  - If milestone reached: #1, #10, #100 → special notification: "👑 You're #1 in Clutch King! Amazing!"
- [ ] **Achievement badges:**
  - Award badges for leaderboard milestones: "Top 10 Overall", "Iron Man Champion", "Consistency King"
  - Display on user profile page as achievement badges
  - Link to existing badge system (US-033) or create leaderboard-specific badges
- [ ] **Social sharing:**
  - "Share" button on leaderboard: generates shareable image (html2canvas) with user's rank
  - Image text: "I'm ranked #5 in SquashIQ Clutch King Leaderboard! 🏆"
  - Native share: `navigator.share()` or download PNG
- [ ] Typecheck passes
- [ ] Test: trigger leaderboard recomputation twice with rank change, verify notification sent

### Phase 4: Social Features - Private Groups/Leagues (Week 7)

### US-P017: Create and manage private groups
**Description:** As a squash club organizer, I want to create a private group for our Thursday night players so we can track group-specific stats.

**Acceptance Criteria:**
- [ ] **Create group UI (Rivals tab):**
  - "Create Group" button opens modal
  - Form fields: group name (required), description (optional), privacy (Public | Private)
  - Public groups: searchable, anyone can request to join
  - Private groups: invite-only, not visible in search
  - On create: insert to `groups` table, owner_id = current user, auto-add owner to `group_members` with role = 'owner'
- [ ] **Invite members:**
  - "Invite Friends" section in group detail page
  - Multi-select from friends list
  - Send notification: "Parth invited you to join 'Thursday Night Squash Club'"
  - Invitees can accept/decline
- [ ] **Group detail page (`/groups/:groupId`):**
  - Header: group name, description, member count, "Edit Group" button (owner only)
  - Members list: avatars + names, role badges (Owner, Admin, Member)
  - Leave group button (confirmation dialog)
  - Delete group button (owner only, requires typing group name to confirm)
- [ ] **Group leaderboards:**
  - Same categories as global leaderboards (Overall, Iron Man, etc.)
  - Filtered to group members only
  - "Group Rankings" section on group detail page
- [ ] **Group activity feed:**
  - Show recent matches logged by group members: "Hemang logged a win vs Parth (3-1)"
  - Use Supabase Realtime to update feed live
  - Limit to last 20 activities
- [ ] **Privacy:**
  - Private groups: only members can view group page
  - Public groups: anyone can view, but only members can see match details
- [ ] Typecheck passes
- [ ] Test: create group, invite friend, accept invite, verify both see group leaderboard, log match, verify activity feed updates

### US-P018: Group challenges and tournaments (Optional - Post-MVP)
**Description:** As a group member, I want to participate in group challenges like "most matches this week" to keep things fun and competitive.

**Acceptance Criteria:**
- [ ] **Challenge types:**
  - Most Matches This Week
  - Highest Win Rate This Month
  - Longest Win Streak
  - Custom challenge: owner defines metric and timeframe
- [ ] **Create challenge:**
  - Group owner/admin creates challenge: name, type, start date, end date
  - Challenge visible on group detail page
- [ ] **Challenge leaderboard:**
  - Live-updating leaderboard showing challenge standings
  - Winner announced at end date (notification + badge)
- [ ] **Tournament brackets (complex, v3.0):**
  - Single-elimination or round-robin tournament
  - Bracket generation: auto-pair members
  - Match reporting: members report results, progress through bracket
  - Champion crowned, displayed on group page
- [ ] Typecheck passes

### Phase 5: Architecture for Future Monetization (Week 8)

### US-P019: User tiers and feature flags system
**Description:** As a developer, I need infrastructure for future monetization without building payment flows yet.

**Acceptance Criteria:**
- [ ] **User tiers (already in schema):**
  - Free tier (default): all current features
  - Pro tier (future $5/month): advanced analytics, unlimited groups, priority support
  - Enterprise tier (future $20/month): white-label, API access, custom insights
- [ ] **Feature flags (already in schema):**
  - Store in `user_profiles.feature_flags` JSONB column
  - Example: `{"beta_features": true, "advanced_charts": false, "api_access": false}`
  - Helper function: `hasFeature(userId, 'advanced_charts')` checks flag + user tier
- [ ] **Feature gating UI:**
  - Create `<ProBadge>` component: small "PRO" badge next to feature names
  - Gated features show lock icon + "Upgrade to Pro" tooltip
  - Clicking gated feature shows modal: "This feature requires Pro. Learn more →"
  - "Learn more" links to pricing page (static page, no Stripe integration yet)
- [ ] **Analytics tracking:**
  - Track feature usage in `activity_log` table: `{event_type: 'feature_used', event_data: {feature: 'advanced_charts'}}`
  - Query most-used features to inform Pro tier offerings
- [ ] **Pricing page (static):**
  - Simple comparison table: Free vs Pro vs Enterprise
  - Free: "Everything you need to start", unlimited matches, basic insights, 5 friends
  - Pro: "For serious players", advanced analytics, unlimited friends/groups, priority support, custom recommendations
  - Enterprise: "For clubs and coaches", white-label branding, API access, team accounts
  - "Coming Soon" badge on pricing page (no payment flow yet)
- [ ] Typecheck passes
- [ ] Verify in browser: Pro feature shows lock icon, click opens modal

### US-P020: Error monitoring and analytics with Sentry
**Description:** As a developer, I need to monitor errors in production so I can quickly fix bugs and improve reliability.

**Acceptance Criteria:**
- [ ] **Sentry setup:**
  - Create Sentry account at sentry.io (free tier: 5k errors/month)
  - Install Sentry SDK: `npm install @sentry/react @sentry/vite-plugin`
  - Initialize in `main.tsx`:
    ```tsx
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0, // always capture replay on error
      environment: import.meta.env.MODE, // 'development' or 'production'
    });
    ```
  - Add Vite plugin for source maps: `sentryVitePlugin({ org, project, authToken })`
- [ ] **Error boundaries:**
  - Wrap app in Sentry ErrorBoundary: `<Sentry.ErrorBoundary fallback={<ErrorPage />}>`
  - Custom error page: "Oops! Something went wrong. We've been notified. Please refresh."
- [ ] **Context enrichment:**
  - Set user context: `Sentry.setUser({ id: user.id, email: user.email, username: user.username })`
  - Add breadcrumbs for user actions: `Sentry.addBreadcrumb({ category: 'match', message: 'Created match', level: 'info' })`
- [ ] **Performance monitoring:**
  - Track page load times: automatic with BrowserTracing
  - Track Supabase query durations: wrap queries with `Sentry.startTransaction()`
- [ ] **Alerts:**
  - Configure Sentry alerts: email on new error, Slack notification for high-volume errors
  - Set up release tracking: tag errors with git commit SHA
- [ ] Typecheck passes
- [ ] Test: trigger error (throw in component), verify appears in Sentry dashboard with replay

### US-P021: Usage analytics with PostHog (optional privacy-friendly alternative to Google Analytics)
**Description:** As a product manager, I want to understand how users engage with features so I can prioritize improvements.

**Acceptance Criteria:**
- [ ] **PostHog setup:**
  - Create PostHog account at posthog.com (free tier: 1M events/month, self-hosted option available)
  - Install: `npm install posthog-js`
  - Initialize in `main.tsx`:
    ```tsx
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: false, // manually track events for privacy
      capture_pageview: true,
      disable_session_recording: false,
      session_recording: { maskAllInputs: true }, // privacy: mask all input fields
    });
    ```
- [ ] **Event tracking:**
  - Track key events:
    - User sign up: `posthog.capture('user_signed_up', {method: 'google'})`
    - Match created: `posthog.capture('match_created', {format: 'bo3', has_photo: true})`
    - Friend request sent: `posthog.capture('friend_request_sent')`
    - Insight card viewed: `posthog.capture('insight_viewed', {card_type: 'win_rate_by_opponent'})`
    - Feature gated: `posthog.capture('feature_gated', {feature: 'advanced_charts'})`
- [ ] **Funnels:**
  - Define funnels in PostHog dashboard:
    - Signup funnel: sign_in_page_viewed → user_signed_up → first_match_created
    - Social funnel: friend_search → friend_request_sent → friend_request_accepted
- [ ] **Privacy compliance:**
  - Add PostHog notice to privacy policy: "We use PostHog for anonymous usage analytics"
  - Respect Do Not Track: `if (navigator.doNotTrack === '1') posthog.opt_out_capturing()`
  - User can opt out in Settings: "Share usage data to help improve SquashIQ"
- [ ] Typecheck passes
- [ ] Test: trigger event, verify appears in PostHog dashboard

## Functional Requirements

### Authentication (FR-AUTH)
- **FR-AUTH-1:** Support Google Sign In via Supabase Auth (OAuth 2.0 flow)
- **FR-AUTH-2:** Support Apple Sign In (requires Apple Developer account, configured via Supabase)
- **FR-AUTH-3:** Session persists in localStorage, expires after 7 days (configurable in Supabase)
- **FR-AUTH-4:** Protected routes: redirect to `/auth` if not authenticated
- **FR-AUTH-5:** Logout: clear Supabase session, clear IndexedDB (optional), reset all Zustand stores

### Data Migration (FR-MIGRATE)
- **FR-MIGRATE-1:** Detect existing IndexedDB data on auth page load
- **FR-MIGRATE-2:** Prompt user to create account if local data exists
- **FR-MIGRATE-3:** Automatically upload all local data to Supabase after first sign-in
- **FR-MIGRATE-4:** Maintain ID mappings: local integer IDs → server UUIDs
- **FR-MIGRATE-5:** Migrate photos from base64 to Supabase Storage
- **FR-MIGRATE-6:** Mark migration complete with `user_profiles.migrated_from_local = true`
- **FR-MIGRATE-7:** <2% data loss during migration (track success rate in activity_log)

### Sync (FR-SYNC)
- **FR-SYNC-1:** Offline-first: all writes go to IndexedDB first, sync in background
- **FR-SYNC-2:** Push sync triggers: after local write, on app foreground, periodic (2 min)
- **FR-SYNC-3:** Pull sync triggers: on app load, on window focus, manual (pull-to-refresh)
- **FR-SYNC-4:** Conflict resolution: Last Write Wins based on `last_modified_ms` timestamp
- **FR-SYNC-5:** Soft deletes: set `deleted_at`, sync deletion, remove from local IndexedDB on next pull
- **FR-SYNC-6:** Sync status indicator: ✅ synced, 🔄 syncing, ❌ failed (with retry button)
- **FR-SYNC-7:** Exponential backoff for failed syncs: 1s, 2s, 4s, 8s (max 5 retries)
- **FR-SYNC-8:** 95%+ sync success rate in production (monitored via Sentry)

### Photo Storage (FR-PHOTO)
- **FR-PHOTO-1:** New photos uploaded to Supabase Storage bucket `match-photos`
- **FR-PHOTO-2:** Compress photos to max 1920px width, 85% JPEG quality
- **FR-PHOTO-3:** Store public URL in `matches.photo_url` (not base64)
- **FR-PHOTO-4:** Offline caching: store photo blobs in IndexedDB `photo_cache` table, LRU eviction (max 50 photos)
- **FR-PHOTO-5:** Photos deleted from storage when match deleted (cascade delete)

### Performance (FR-PERF)
- **FR-PERF-1:** Lighthouse PWA score 95+ on mobile
- **FR-PERF-2:** Main bundle <200KB gzipped
- **FR-PERF-3:** Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- **FR-PERF-4:** Match history pagination: load 20 initially, infinite scroll
- **FR-PERF-5:** Virtual scrolling for lists >100 items

### Accessibility (FR-A11Y)
- **FR-A11Y-1:** WCAG AA compliant: 4.5:1 color contrast, semantic HTML, ARIA labels
- **FR-A11Y-2:** Keyboard navigable: all features accessible via keyboard
- **FR-A11Y-3:** Screen reader tested: VoiceOver on iOS, NVDA on Windows
- **FR-A11Y-4:** Focus indicators: visible on all interactive elements
- **FR-A11Y-5:** Dynamic Type support on iOS: content reflows at largest text size

### Social Features (FR-SOCIAL)
- **FR-SOCIAL-1:** Friend connections: search users, send/accept/decline friend requests
- **FR-SOCIAL-2:** Friend profiles: view friends' stats (respecting privacy settings)
- **FR-SOCIAL-3:** Leaderboards: 7+ categories, updated daily, privacy-respecting
- **FR-SOCIAL-4:** Private groups: create, invite members, group-specific leaderboards
- **FR-SOCIAL-5:** Activity feeds: real-time updates using Supabase Realtime

### Privacy & Security (FR-SEC)
- **FR-SEC-1:** Row Level Security (RLS) on all Supabase tables
- **FR-SEC-2:** Users can only read/write their own data (enforced server-side)
- **FR-SEC-3:** Privacy settings: Public | Friends Only | Private profiles
- **FR-SEC-4:** Photo storage RLS: users can only upload/delete own photos
- **FR-SEC-5:** HTTPS only, no sensitive data in localStorage (only session token)

## Non-Goals (Out of Scope for V2.0)

- ❌ Native mobile apps (iOS/Android) - remain PWA only
- ❌ Payment integration (Stripe) - architecture only, no actual payment flows
- ❌ In-app messaging between users - use external apps for now
- ❌ Video analysis or shot tracking - future v3.0
- ❌ Coach accounts with multiple player management - future
- ❌ Multi-sport support (tennis, badminton) - squash only for now
- ❌ Offline push notifications - requires native app
- ❌ Tournament bracket management - simple challenges only for v2.0
- ❌ API access for third-party integrations - Enterprise tier future feature
- ❌ White-label branding - Enterprise tier future feature

## Design Considerations

### Mobile-First Design
- **Touch Targets:** Minimum 44x44px for all interactive elements (iOS guideline)
- **Gestures:** Swipe for navigation, pull-to-refresh for sync, swipe-to-delete for match cards
- **Haptics:** Vibration API for button presses, success/error feedback
- **Safe Areas:** CSS `env(safe-area-inset-*)` for iPhone notch/Dynamic Island

### Dark Mode
- Maintain existing dark theme (#0A0A0A background, #00E676 primary, #1A1A1A surfaces)
- Support system theme: `prefers-color-scheme` media query
- Future: light mode toggle in Settings

### Animations
- Framer Motion for all transitions: page navigation, modals, card reveals
- Spring physics for natural feel: `transition={{ type: 'spring', damping: 20 }}`
- Respect `prefers-reduced-motion`: disable animations if user preference set

### Progressive Enhancement
- Core features work without JavaScript (form submissions, navigation)
- Offline-first: all features work offline, sync when online
- Installable: PWA with Add to Home Screen on iOS/Android

## Technical Considerations

### Supabase Architecture
```
Supabase (Backend as a Service):
  ├─ PostgreSQL (data storage, 500MB free tier)
  ├─ Auth (Google + Apple OAuth, session management)
  ├─ Storage (match photos, 1GB free tier)
  ├─ Realtime (live updates for friendships, leaderboards)
  ├─ Edge Functions (cron jobs for leaderboards, push notifications)
  └─ Row Level Security (data isolation per user)

IndexedDB (Local Cache):
  ├─ Dexie.js for reactive queries
  ├─ Stores: players, venues, matches, games, rally_analyses, photo_cache
  ├─ Offline queue: sync_queue table for pending uploads
  └─ LRU eviction for photo cache (max 50 photos / 50MB)
```

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4
- **State:** Zustand (global state), Dexie.js (local database)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Charts:** Recharts (currently), consider lighter alternatives for mobile performance
- **Auth:** @supabase/auth-ui-react (pre-built components)
- **Monitoring:** Sentry (errors), PostHog (analytics - optional)
- **Push:** Web Push API + Supabase Edge Functions

### Database Design Principles
- **Normalization:** 3NF for core tables (players, venues, matches)
- **Denormalization:** Leaderboard cache for performance (recomputed daily)
- **Soft Deletes:** `deleted_at` timestamp for sync consistency
- **Timestamps:** `created_at`, `updated_at`, `last_modified_ms` for conflict resolution
- **Indexes:** Compound indexes on frequent queries (user_id, date)

### Scaling Considerations
- **Free Tier Limits:** 50k MAU, 500MB DB, 1GB Storage, 2GB Bandwidth
- **Upgrade Triggers:** >10k users, >100MB DB size, >500MB storage
- **Optimization Strategies:**
  - Pagination for match history (20 per page)
  - Photo compression (1920px, 85% quality)
  - Leaderboard caching (compute once daily)
  - Connection pooling (Supabase Supavisor)
- **Monitoring:** Track usage via Supabase dashboard, set up alerts at 80% of limits

### Security Best Practices
- **RLS Policies:** All tables have policies, test with `supabase test db`
- **Input Validation:** Client-side + server-side (Postgres constraints)
- **CORS:** Whitelist production domain only
- **Rate Limiting:** Supabase built-in rate limiting (60 requests/min per IP)
- **OWASP Top 10:** XSS (React escapes by default), CSRF (Supabase session tokens), SQL Injection (parameterized queries)

## Success Metrics

### Migration Success (Week 2)
- **M1:** 80%+ of users with local data complete migration within 7 days
- **M2:** <2% data loss during migration (tracked via pre/post counts in activity_log)
- **M3:** <5% migration errors (track failed migrations in Sentry)

### Sync Reliability (Week 4)
- **M4:** 95%+ sync success rate in production
- **M5:** Average sync latency <3 seconds (p95)
- **M6:** <1% of users report data loss (feedback survey)

### User Engagement (Week 8)
- **M7:** 50%+ of users add ≥1 friend within 14 days
- **M8:** 30%+ of users enable push notifications
- **M9:** 20%+ of users join ≥1 group
- **M10:** Daily active users (DAU) increase 40% post-launch (vs pre-social features)

### Performance (Week 8)
- **M11:** Lighthouse PWA score 95+ (currently ~85)
- **M12:** Core Web Vitals pass: LCP <2.5s, FID <100ms, CLS <0.1
- **M13:** Main bundle <200KB gzipped (currently ~300KB)

### Retention (Month 2-3)
- **M14:** 30-day retention rate >40% (users who return after 30 days)
- **M15:** Weekly match logging rate >60% (% of users who log ≥1 match per week)
- **M16:** Notification click-through rate >15% (of sent match reminders)

## Open Questions

1. **Supabase Free Tier:** Expected user count for launch? If >1k users, should we budget for Pro tier ($25/month) from day 1? -> Assume <1k users at launch. Do NOT budget Pro from day 1.

2. **Apple Developer Account:** Do you have an Apple Developer account ($99/year)? Required for Apple Sign In configuration. -> Answer: No, not at launch.

3. **Web Push Server:** Need VAPID keys and server to send push notifications. Use Supabase Edge Functions (recommended) or external service like OneSignal? -> No push notifications in MVP.

4. **Leaderboard Computation:** Daily cron job at midnight UTC acceptable? Or more frequent (hourly)? -> Daily cron job at midnight UTC is sufficient.

5. **Data Retention:** Should we ever delete old data? E.g., soft-deleted matches older than 1 year permanently deleted? Or keep forever? -> Keep data forever (logical deletes only).

6. **Usernames:** Should usernames be editable after creation? Or immutable (like Twitter)? -> Editable, but rate-limited.

7. **Group Limits:** Max group size? Max groups per user? Free tier limits to prevent spam? -> Yes, enforce conservative free-tier limits.

8. **Conflict Resolution:** Last Write Wins is simple but can lose data. Acceptable for MVP? Or invest in smart merge (more complex)?-> Last Write Wins is acceptable for MVP.

9. **Analytics Privacy:** Use PostHog for analytics, or simpler solution like self-hosted Plausible? Or no analytics at all? -> No third-party analytics in MVP.

10. **Monetization Timeline:** When to build payment integration? After v2.0 launch? After reaching 1k users?-> After v2.0 AND ≥1k active users.

## Phased Rollout Plan (8-Week Timeline)

### Week 1: Foundation
- US-P001: Supabase setup ✅ (2 days)
- US-P002: Authentication UI ✅ (2 days)
- US-P003: Data migration ✅ (3 days)

### Week 2: Sync & Photos
- US-P004: Bidirectional sync ✅ (3 days)
- US-P005: Photo migration ✅ (2 days)
- Testing: migration + sync reliability (2 days)

### Week 3-4: UX Overhaul
- US-P006: Performance optimizations ✅ (2 days)
- US-P007: Touch interactions ✅ (2 days)
- US-P008: iOS polish ✅ (2 days)
- US-P009: Accessibility ✅ (2 days)
- US-P010: Onboarding ✅ (1 day)
- US-P011: Search & filtering ✅ (2 days)
- US-P012: Push notifications ✅ (2 days)

### Week 5: Social - Friends
- US-P013: Friend connections ✅ (3 days)
- US-P014: Friend profiles ✅ (2 days)

### Week 6: Social - Leaderboards
- US-P015: Global leaderboards ✅ (3 days)
- US-P016: Leaderboard notifications ✅ (1 day)

### Week 7: Social - Groups
- US-P017: Private groups ✅ (4 days)

### Week 8: Production Readiness
- US-P019: User tiers & feature flags ✅ (1 day)
- US-P020: Sentry error monitoring ✅ (1 day)
- US-P021: PostHog analytics (optional) ✅ (1 day)
- Final testing, bug fixes, performance tuning (4 days)

### Week 9: Soft Launch
- Deploy to production domain
- Invite existing beta users (if any)
- Monitor errors, sync reliability, performance
- Collect feedback, iterate

### Week 10+: Feature Iteration
- US-P018: Group challenges (optional)
- Advanced analytics improvements
- Wearables integration (Apple Health, HealthKit)
- Tournament brackets
- Coaching features

## Migration Guide for Existing Users

### For PWA Users (Local Data Only)
1. **Open SquashIQ** - You'll see a banner: "⚠️ You have 42 matches stored locally. Sign in to back them up!"
2. **Sign in with Google or Apple** - One tap, no passwords
3. **Wait for migration** - Progress bar shows upload: "Uploading... 20/42 matches complete"
4. **Done!** - All your data is now synced to the cloud. You can access it from any device.

### What Gets Migrated?
- ✅ All matches (with scores, notes, tags)
- ✅ All opponents and venues
- ✅ Rally analyses
- ✅ Photos (converted from base64 to cloud storage)
- ✅ Insights and recommendations (recalculated on server)

### What Changes?
- 🔄 **IDs change:** Local integer IDs become UUIDs (invisible to you)
- 🔄 **Photos load from cloud:** May take 1-2 seconds to display first time (then cached)
- 🔄 **Sync indicator:** Green ✅ when synced, yellow 🔄 when uploading

### Troubleshooting
- **Migration stuck?** Refresh the page and retry (progress is saved)
- **Missing matches?** Check Supabase dashboard, contact support with user ID
- **Photos missing?** Re-upload from match detail page

---

**Document Version:** 2.0
**Created:** 2026-02-08
**Author:** Claude (Expert Product Manager)
**Status:** Ready for Implementation
**Estimated Effort:** 8 weeks (1 developer) or 4 weeks (2 developers)
