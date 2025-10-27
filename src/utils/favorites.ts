import { supabase } from '../lib/supabase';

export async function toggleFavorite(userId: string, foodTruckId: string): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('food_truck_id', foodTruckId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('customer_favorites')
        .insert({
          user_id: userId,
          food_truck_id: foodTruckId,
          notify_when_online: true,
          notify_when_nearby: true,
        });

      if (error) throw error;
      return true;
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    throw err;
  }
}

export async function getFavorites(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('customer_favorites')
      .select('food_truck_id')
      .eq('user_id', userId);

    if (error) throw error;

    return new Set(data?.map(f => f.food_truck_id) || []);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return new Set();
  }
}

export async function checkIsFavorite(userId: string, foodTruckId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('food_truck_id', foodTruckId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (err) {
    console.error('Error checking favorite:', err);
    return false;
  }
}
