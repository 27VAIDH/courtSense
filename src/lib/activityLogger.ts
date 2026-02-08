import { supabase } from './supabase';

/**
 * Event types for activity logging
 */
export type ActivityEventType =
  // Feature usage events
  | 'feature_used'
  | 'feature_blocked' // User tried to use gated feature
  | 'upgrade_modal_shown'
  | 'pricing_page_viewed'
  // Match events
  | 'match_logged'
  | 'match_updated'
  | 'match_deleted'
  // Social events
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'friend_unfriended'
  | 'group_created'
  | 'group_joined'
  | 'group_left'
  // Profile events
  | 'profile_updated'
  | 'privacy_changed';

interface ActivityLogData {
  eventType: ActivityEventType;
  eventData?: Record<string, unknown>;
  userId?: string;
}

/**
 * Log activity to the activity_log table
 * @param data - Activity log data
 */
export async function logActivity({
  eventType,
  eventData = {},
  userId,
}: ActivityLogData): Promise<void> {
  try {
    // Get current user if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Cannot log activity: no user found');
        return;
      }
      finalUserId = user.id;
    }

    // Insert activity log
    const { error } = await supabase.from('activity_log').insert({
      user_id: finalUserId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Log feature usage
 * @param featureName - Name of the feature
 * @param metadata - Optional metadata about the usage
 */
export async function logFeatureUsage(
  featureName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logActivity({
    eventType: 'feature_used',
    eventData: {
      feature: featureName,
      ...metadata,
    },
  });
}

/**
 * Log when a user is blocked from using a gated feature
 * @param featureName - Name of the gated feature
 * @param currentTier - User's current tier
 * @param requiredTier - Required tier for the feature
 */
export async function logFeatureBlocked(
  featureName: string,
  currentTier: string,
  requiredTier: string
): Promise<void> {
  await logActivity({
    eventType: 'feature_blocked',
    eventData: {
      feature: featureName,
      currentTier,
      requiredTier,
    },
  });
}

/**
 * Log when upgrade modal is shown
 * @param featureName - Feature that triggered the modal
 */
export async function logUpgradeModalShown(featureName?: string): Promise<void> {
  await logActivity({
    eventType: 'upgrade_modal_shown',
    eventData: {
      feature: featureName,
    },
  });
}

/**
 * Log when pricing page is viewed
 * @param source - Where the user came from (e.g., 'upgrade_modal', 'settings', 'direct')
 */
export async function logPricingPageViewed(source?: string): Promise<void> {
  await logActivity({
    eventType: 'pricing_page_viewed',
    eventData: {
      source,
    },
  });
}

/**
 * Get activity logs for a user
 * @param userId - User ID
 * @param limit - Number of logs to fetch
 * @param eventType - Optional filter by event type
 */
export async function getUserActivityLogs(
  userId: string,
  limit = 50,
  eventType?: ActivityEventType
): Promise<
  Array<{
    id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
  }>
> {
  try {
    let query = supabase
      .from('activity_log')
      .select('id, event_type, event_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}
