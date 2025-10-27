import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Eye, TrendingUp, Users, MapPin, Star } from 'lucide-react';

interface TruckAnalytics {
  truck_id: string;
  truck_name: string;
  total_views: number;
  profile_views: number;
  menu_views: number;
  location_checks: number;
  reviews_count: number;
  average_rating: number;
}

interface OverallStats {
  totalEvents: number;
  totalUsers: number;
  totalTrucks: number;
  totalReviews: number;
  topEventType: string;
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [truckAnalytics, setTruckAnalytics] = useState<TruckAnalytics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalEvents: 0,
    totalUsers: 0,
    totalTrucks: 0,
    totalReviews: 0,
    topEventType: 'N/A',
  });
  const [eventTypeBreakdown, setEventTypeBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    if (timeRange === 'all') return null;
    const days = parseInt(timeRange);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTruckAnalytics(),
        loadOverallStats(),
        loadEventTypeBreakdown(),
      ]);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTruckAnalytics = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('analytics_events')
      .select('event_type, food_truck_id');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: events } = await query;

    if (!events) return;

    const { data: trucks } = await supabase
      .from('food_trucks')
      .select('id, truck_name, average_rating, total_reviews');

    if (!trucks) return;

    const truckStats: Record<string, any> = {};

    trucks.forEach(truck => {
      truckStats[truck.id] = {
        truck_id: truck.id,
        truck_name: truck.truck_name,
        total_views: 0,
        profile_views: 0,
        menu_views: 0,
        location_checks: 0,
        reviews_count: truck.total_reviews || 0,
        average_rating: truck.average_rating || 0,
      };
    });

    events.forEach(event => {
      if (event.food_truck_id && truckStats[event.food_truck_id]) {
        const stats = truckStats[event.food_truck_id];
        stats.total_views++;

        switch (event.event_type) {
          case 'profile_view':
            stats.profile_views++;
            break;
          case 'menu_view':
            stats.menu_views++;
            break;
          case 'location_check':
            stats.location_checks++;
            break;
          case 'truck_view':
            stats.total_views++;
            break;
        }
      }
    });

    const analyticsArray = Object.values(truckStats).sort(
      (a: any, b: any) => b.total_views - a.total_views
    );

    setTruckAnalytics(analyticsArray as TruckAnalytics[]);
  };

  const loadOverallStats = async () => {
    const dateFilter = getDateFilter();

    let eventsQuery = supabase.from('analytics_events').select('event_type', { count: 'exact' });
    if (dateFilter) {
      eventsQuery = eventsQuery.gte('created_at', dateFilter);
    }
    const { count: eventCount, data: events } = await eventsQuery;

    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: truckCount } = await supabase
      .from('food_trucks')
      .select('*', { count: 'exact', head: true });

    let reviewQuery = supabase.from('reviews').select('*', { count: 'exact', head: true });
    if (dateFilter) {
      reviewQuery = reviewQuery.gte('created_at', dateFilter);
    }
    const { count: reviewCount } = await reviewQuery;

    const eventCounts: Record<string, number> = {};
    events?.forEach(event => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });

    const topEvent = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0];

    setOverallStats({
      totalEvents: eventCount || 0,
      totalUsers: userCount || 0,
      totalTrucks: truckCount || 0,
      totalReviews: reviewCount || 0,
      topEventType: topEvent ? topEvent[0].replace('_', ' ').toUpperCase() : 'N/A',
    });
  };

  const loadEventTypeBreakdown = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('analytics_events')
      .select('event_type');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: events } = await query;

    if (!events) return;

    const breakdown: Record<string, number> = {};
    events.forEach(event => {
      breakdown[event.event_type] = (breakdown[event.event_type] || 0) + 1;
    });

    setEventTypeBreakdown(breakdown);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'truck_view':
      case 'profile_view':
        return <Eye className="w-4 h-4" />;
      case 'menu_view':
        return <BarChart3 className="w-4 h-4" />;
      case 'location_check':
        return <MapPin className="w-4 h-4" />;
      case 'review_added':
        return <Star className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{overallStats.totalEvents}</span>
          </div>
          <p className="text-blue-100 text-sm">Total Events</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{overallStats.totalUsers}</span>
          </div>
          <p className="text-green-100 text-sm">Total Users</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{overallStats.totalTrucks}</span>
          </div>
          <p className="text-purple-100 text-sm">Food Trucks</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{overallStats.totalReviews}</span>
          </div>
          <p className="text-orange-100 text-sm">Total Reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Event Type Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(eventTypeBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getEventIcon(type)}
                  <span className="text-sm font-medium capitalize">
                    {type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(count / overallStats.totalEvents) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Metric</h3>
          <div className="flex flex-col items-center justify-center h-full py-8">
            <TrendingUp className="w-16 h-16 text-green-600 mb-4" />
            <p className="text-3xl font-bold text-gray-900 mb-2">{overallStats.topEventType}</p>
            <p className="text-sm text-gray-500">Most Common Event Type</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Food Truck Performance</h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading analytics...</div>
        ) : truckAnalytics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No analytics data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menu Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location Checks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {truckAnalytics.map((truck) => (
                  <tr key={truck.truck_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{truck.truck_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-blue-600">{truck.total_views}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{truck.profile_views}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{truck.menu_views}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{truck.location_checks}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{truck.reviews_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="font-medium">{truck.average_rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
