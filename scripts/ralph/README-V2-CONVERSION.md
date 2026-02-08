# SquashIQ PWA v2.0 - Ralph Conversion Summary

## ✅ Conversion Complete

The PRD has been successfully converted from the comprehensive markdown document to Ralph's JSON format.

**Location:** `prd.json`
**Branch:** `ralph/squashiq-pwa-v2`
**Total Stories:** 18 user stories

## 📋 What Was Included (MVP Scope)

Based on your requirements (no Apple Sign In, no push notifications, no analytics in MVP), the following 18 stories were included:

### Phase 0: Foundation & Infrastructure (Stories 1-6)
1. **US-P001:** Supabase project setup with database schema
2. **US-P002:** Google Sign In authentication UI
3. **US-P003:** User profile creation on first sign-in
4. **US-P004:** Automatic data migration from IndexedDB
5. **US-P005:** Bidirectional sync engine (last-write-wins)
6. **US-P006:** Photo upload to Supabase Storage

### Phase 1: UX Improvements (Stories 7-12)
7. **US-P007:** Performance optimization (code splitting, bundle size)
8. **US-P008:** Touch interactions (swipe gestures, haptic feedback)
9. **US-P009:** iOS-specific polish (safe areas, PWA install)
10. **US-P010:** Accessibility improvements (WCAG AA compliance)
11. **US-P011:** Interactive onboarding with sample data
12. **US-P012:** Advanced search and filtering

### Phase 2: Social Features (Stories 13-16)
13. **US-P013:** Friend connections (search, send requests)
14. **US-P014:** Friend profiles (view stats)
15. **US-P015:** Global leaderboards (7 categories)
16. **US-P016:** Private groups for squash clubs

### Phase 3: Production Readiness (Stories 17-18)
17. **US-P017:** User tiers and feature flags (monetization architecture)
18. **US-P018:** Error monitoring with Sentry

## ❌ What Was Excluded (Post-MVP)

The following features from the original PRD were **excluded** based on your answers to the open questions:

### Not Included in MVP:
- **Apple Sign In** (US-P002 modified) - No Apple Developer account
- **Web Push Notifications** (US-P012 original) - Removed entirely from MVP
- **PostHog Analytics** (US-P021 original) - No third-party analytics in MVP
- **Leaderboard notifications** (US-P016 original) - Depends on push notifications
- **Group challenges/tournaments** (US-P018 original) - Marked as post-MVP

### Deferred to v3.0:
- Photo migration from base64 (US-P005 handles new photos only)
- Multiple profiles per account
- Tournament/bracket management
- Video analysis
- Wearables integration (Apple Watch, HealthKit)

## 🎯 Story Sizing & Dependencies

Each story has been **sized for single-iteration completion** by Ralph:

- **Small stories** (1-2 hours): US-P003, US-P010, US-P011, US-P017
- **Medium stories** (2-4 hours): US-P002, US-P007, US-P008, US-P009, US-P012, US-P013, US-P014, US-P018
- **Large stories** (4-6 hours): US-P001, US-P004, US-P005, US-P006, US-P015, US-P016

**Dependency order preserved:**
1. Foundation first (Supabase, Auth, Profile)
2. Migration & Sync (depends on Auth)
3. Photos (depends on Sync)
4. UX improvements (parallel, no dependencies)
5. Social features (depends on Auth + Profiles)
6. Production infrastructure (can be done anytime)

## 🚀 How to Start

### Option 1: Run Ralph Autonomously
```bash
cd scripts/ralph
./ralph.sh
```

Ralph will automatically:
1. Check out `ralph/squashiq-pwa-v2` branch
2. Implement US-P001 (Supabase setup)
3. Run quality checks
4. Commit if passing
5. Continue to next story

### Option 2: Manual Implementation
Review `prd.json` and implement stories sequentially:
1. Start with US-P001 (Supabase setup is manual - requires dashboard configuration)
2. US-P002-P006 can be done by Ralph
3. Social features (US-P013-P016) require real users to test

## 📝 Key Configuration Steps (Manual)

### Before Running Ralph:

**1. Supabase Project Setup (US-P001):**
- Create project at https://supabase.com
- Run SQL schema from `src/db/supabase-schema.sql` in SQL Editor
- Configure OAuth: Google Cloud Console → Create OAuth 2.0 Client
- Copy URL and Anon Key to `.env.local`

**2. Environment Variables:**
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=your-sentry-dsn  # US-P018
```

**3. Google OAuth Setup:**
- Go to Google Cloud Console → APIs & Services → Credentials
- Create OAuth 2.0 Client ID (Web application)
- Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
- Copy Client ID/Secret to Supabase Auth settings

## 📊 Success Metrics (from PRD)

Track these after v2.0 launch:

**Migration:**
- 80%+ users with local data complete migration in 30 days
- <2% data loss during migration

**Sync:**
- 95%+ sync success rate
- <3 second sync latency (p95)

**Engagement:**
- 50%+ users add ≥1 friend within 14 days
- 20%+ users join ≥1 group

**Performance:**
- Lighthouse PWA score 95+
- LCP <2.5s, FID <100ms, CLS <0.1

## 🔄 Iteration Plan

Ralph will implement stories **sequentially** in priority order. After each story:

1. ✅ Code written
2. ✅ Typecheck passes
3. ✅ Git commit with message: `feat: US-PXXX - [Story Title]`
4. ✅ Progress logged to `progress.txt`
5. ➡️ Move to next story

**Estimated timeline:** 18 stories × 3 hours average = ~54 hours (~7 work days)

## 🛠️ Testing Strategy

### Automated (via Ralph):
- Typecheck on every story
- Build succeeds (`npm run build`)

### Manual (post-implementation):
- **Auth:** Sign in with Google, verify session persists
- **Migration:** Create 10 local matches, sign in, verify uploaded
- **Sync:** 2 browser tabs, create match in one, verify in other
- **Photos:** Upload photo, verify in Supabase Storage
- **Friends:** Send request, accept from other account
- **Leaderboards:** Create 5 users, verify rankings

### Browser Testing:
Each UI story includes "Verify in browser" acceptance criteria.

## 📚 Additional Resources

**PRD Source:** `.claude/skills/prd/tasks/prd-squashiq-pwa-v2-production.md`
**Previous v1 Run:** `archive/2026-02-08-154305-squashiq-v1/` (all 41 stories completed ✅)

**Supabase Docs:** https://supabase.com/docs
**Sentry React Docs:** https://docs.sentry.io/platforms/javascript/guides/react/

---

**Ready to start?** Run `./ralph.sh` or implement US-P001 manually!
