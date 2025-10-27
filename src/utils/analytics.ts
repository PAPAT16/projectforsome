import { supabase } from '../lib/supabase';

export async function trackAnalyticsEvent(
  eventType: string,
  data: {
    userId?: string;
    foodTruckId?: string;
    eventData?: any;
  }
) {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: data.userId || null,
      food_truck_id: data.foodTruckId || null,
      event_type: eventType,
      event_data: data.eventData || null,
    });

    if (error) {
      console.error('Error tracking analytics event:', error);
    }
  } catch (err) {
    console.error('Exception tracking analytics:', err);
  }
}

export async function trackTruckView(userId: string | undefined, foodTruckId: string) {
  await trackAnalyticsEvent('truck_profile_view', {
    userId,
    foodTruckId,
  });
}

export async function trackMapClick(userId: string | undefined, foodTruckId: string) {
  await trackAnalyticsEvent('map_marker_click', {
    userId,
    foodTruckId,
  });
}

export async function trackPhoneClick(userId: string | undefined, foodTruckId: string) {
  await trackAnalyticsEvent('phone_click', {
    userId,
    foodTruckId,
  });
}

export async function trackDirectionClick(userId: string | undefined, foodTruckId: string) {
  await trackAnalyticsEvent('direction_click', {
    userId,
    foodTruckId,
  });
}
