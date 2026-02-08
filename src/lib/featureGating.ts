import { supabase } from './supabase';

/**
 * Feature definitions with tier requirements
 */
export const FEATURES = {
  // Free tier features (available to all)
  basic_analytics: { requiredTier: 'free' as const },
  match_logging: { requiredTier: 'free' as const },
  local_opponents: { requiredTier: 'free' as const },

  // Pro tier features
  advanced_charts: { requiredTier: 'pro' as const },
  unlimited_friends: { requiredTier: 'pro' as const },
  unlimited_groups: { requiredTier: 'pro' as const },
  export_data: { requiredTier: 'pro' as const },
  custom_themes: { requiredTier: 'pro' as const },
  priority_support: { requiredTier: 'pro' as const },

  // Enterprise tier features
  white_label: { requiredTier: 'enterprise' as const },
  api_access: { requiredTier: 'enterprise' as const },
  team_accounts: { requiredTier: 'enterprise' as const },
  sso: { requiredTier: 'enterprise' as const },
} as const;

export type FeatureName = keyof typeof FEATURES;
export type UserTier = 'free' | 'pro' | 'enterprise';

const tierHierarchy: Record<UserTier, number> = {
  free: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Check if a user has access to a specific feature
 * @param userId - The user's ID
 * @param featureName - The feature to check
 * @returns Promise<boolean> - Whether the user has access
 */
export async function hasFeature(
  userId: string,
  featureName: FeatureName
): Promise<boolean> {
  try {
    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_tier, feature_flags')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile for feature check:', error);
      return false;
    }

    const feature = FEATURES[featureName];
    if (!feature) {
      console.warn(`Unknown feature: ${featureName}`);
      return false;
    }

    // Check if feature is explicitly enabled in feature_flags
    const featureFlags = (profile.feature_flags || {}) as Record<string, boolean>;
    if (featureName in featureFlags) {
      return featureFlags[featureName] === true;
    }

    // Otherwise, check tier hierarchy
    const userTierLevel = tierHierarchy[profile.user_tier as UserTier] || 0;
    const requiredTierLevel = tierHierarchy[feature.requiredTier];

    return userTierLevel >= requiredTierLevel;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get user's current tier
 * @param userId - The user's ID
 * @returns Promise<UserTier> - The user's tier
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_tier')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching user tier:', error);
      return 'free';
    }

    return profile.user_tier as UserTier;
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Check if user has reached tier limits
 */
export async function checkTierLimits(userId: string): Promise<{
  friends: { limit: number; current: number; canAdd: boolean };
  groups: { limit: number; current: number; canAdd: boolean };
}> {
  try {
    const tier = await getUserTier(userId);

    // Define tier limits
    const limits = {
      free: { friends: 5, groups: 2 },
      pro: { friends: Infinity, groups: Infinity },
      enterprise: { friends: Infinity, groups: Infinity },
    };

    const tierLimits = limits[tier];

    // Get current counts
    const [friendsResult, groupsResult] = await Promise.all([
      supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const friendsCount = friendsResult.count || 0;
    const groupsCount = groupsResult.count || 0;

    return {
      friends: {
        limit: tierLimits.friends,
        current: friendsCount,
        canAdd: friendsCount < tierLimits.friends,
      },
      groups: {
        limit: tierLimits.groups,
        current: groupsCount,
        canAdd: groupsCount < tierLimits.groups,
      },
    };
  } catch (error) {
    console.error('Error checking tier limits:', error);
    return {
      friends: { limit: 5, current: 0, canAdd: true },
      groups: { limit: 2, current: 0, canAdd: true },
    };
  }
}
