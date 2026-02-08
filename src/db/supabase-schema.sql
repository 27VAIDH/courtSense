-- SquashIQ PWA v2.0 - Supabase Database Schema
-- This schema supports cloud sync, user authentication, and social features
-- Run this SQL in Supabase SQL Editor after creating your project

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================

-- Drop existing tables if they exist (for development/reset)
-- WARNING: This will delete all data! Comment out in production.
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS rally_analyses CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  privacy_setting TEXT NOT NULL DEFAULT 'friends' CHECK (privacy_setting IN ('private', 'friends', 'public')),
  user_tier TEXT NOT NULL DEFAULT 'free' CHECK (user_tier IN ('free', 'pro', 'enterprise')),
  feature_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only read/write their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Performance Index
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_privacy ON user_profiles(privacy_setting);

-- ============================================================================
-- PLAYERS TABLE (opponents + current user)
-- ============================================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_current_user BOOLEAN DEFAULT FALSE,
  last_modified_ms BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only access their own players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own players"
  ON players FOR ALL
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_players_user_id ON players(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_last_modified ON players(last_modified_ms DESC);

-- ============================================================================
-- VENUES TABLE
-- ============================================================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  last_modified_ms BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only access their own venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own venues"
  ON venues FOR ALL
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_venues_user_id ON venues(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_venues_last_modified ON venues(last_modified_ms DESC);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES players(id),
  venue_id UUID REFERENCES venues(id),
  date DATE NOT NULL,
  format TEXT NOT NULL,
  user_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  note TEXT,
  photo_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_modified_ms BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only access their own matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own matches"
  ON matches FOR ALL
  USING (auth.uid() = user_id);

-- Performance Indexes (critical for sync and dashboard queries)
CREATE INDEX idx_matches_user_id_date ON matches(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_matches_opponent_id ON matches(opponent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_matches_last_modified ON matches(last_modified_ms DESC);
CREATE INDEX idx_matches_tags ON matches USING GIN(tags);

-- ============================================================================
-- GAMES TABLE (individual games within a match)
-- ============================================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  user_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  last_modified_ms BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, game_number)
);

-- RLS Policy: Users can only access their own games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own games"
  ON games FOR ALL
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_games_match_id ON games(match_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_games_last_modified ON games(last_modified_ms DESC);

-- ============================================================================
-- RALLY ANALYSES TABLE (rally tracking data)
-- ============================================================================
CREATE TABLE rally_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rally_data JSONB NOT NULL,
  last_modified_ms BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only access their own rally analyses
ALTER TABLE rally_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rally analyses"
  ON rally_analyses FOR ALL
  USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_rally_analyses_match_id ON rally_analyses(match_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rally_analyses_last_modified ON rally_analyses(last_modified_ms DESC);

-- ============================================================================
-- FRIENDSHIPS TABLE (friend connections and requests)
-- ============================================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

-- RLS Policy: Users can see friendships they're part of
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Performance Indexes
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================================
-- GROUPS TABLE (squash clubs and private groups)
-- ============================================================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Public groups viewable by all, private by members only
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (privacy = 'public' OR auth.uid() = owner_id);

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Performance Index
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_privacy ON groups(privacy);

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- RLS Policy: Members can view group membership
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members for their groups"
  ON group_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Performance Index
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- ============================================================================
-- LEADERBOARD CACHE TABLE (precomputed rankings)
-- ============================================================================
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_label TEXT NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, user_id)
);

-- RLS Policy: Leaderboards viewable based on user privacy settings
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leaderboards for public/friend profiles"
  ON leaderboard_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = leaderboard_cache.user_id
      AND (
        up.privacy_setting = 'public'
        OR (
          up.privacy_setting = 'friends'
          AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id = auth.uid() AND f.friend_id = up.id AND f.status = 'accepted')
               OR (f.friend_id = auth.uid() AND f.user_id = up.id AND f.status = 'accepted')
          )
        )
        OR up.id = auth.uid()
      )
    )
  );

-- Performance Index
CREATE INDEX idx_leaderboard_category_rank ON leaderboard_cache(category, rank);
CREATE INDEX idx_leaderboard_user_id ON leaderboard_cache(user_id);

-- ============================================================================
-- ACTIVITY LOG TABLE (for feature usage tracking)
-- ============================================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only view their own activity
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Performance Index
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_event_type ON activity_log(event_type);

-- ============================================================================
-- STORAGE BUCKET FOR MATCH PHOTOS
-- ============================================================================
-- Create storage bucket for match photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-photos', 'match-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload/delete only their own photos
CREATE POLICY "Users can upload their own match photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'match-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view match photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'match-photos');

CREATE POLICY "Users can delete their own match photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'match-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Schema created successfully!
--
-- Next steps:
-- 1. Configure Google OAuth in Supabase dashboard (Authentication → Providers → Google)
-- 2. Add environment variables to your .env.local file:
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
-- 3. Test authentication by signing in with Google
--
-- See README-SUPABASE.md for detailed setup instructions.
