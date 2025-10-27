import { useState, useEffect, useMemo } from 'react';
import { Search, Ban, CheckCircle, Users, Truck, MessageSquare, Award, BarChart3, Trophy, Settings, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import AdminMessaging from './AdminMessaging';
import AdminAffiliates from './AdminAffiliates';
import AdminAnalytics from './AdminAnalytics';
import AdminContests from './AdminContests';
import { AdminFeatures } from './AdminFeatures';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { AdBanner } from './AdBanner';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FoodTruck = Database['public']['Tables']['food_trucks']['Row'];

export function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [foodTrucks, setFoodTrucks] = useState<FoodTruck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'food_truck_owner'>('all');
  const [selectedView, setSelectedView] = useState<'users' | 'trucks' | 'messaging' | 'affiliates' | 'analytics' | 'contests' | 'features' | 'announcements'>('users');

  useEffect(() => {
    fetchProfiles();
    fetchFoodTrucks();

    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
      .subscribe();

    const trucksChannel = supabase
      .channel('trucks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_trucks' }, fetchFoodTrucks)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(trucksChannel);
    };
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
  };

  const fetchFoodTrucks = async () => {
    const { data, error } = await supabase
      .from('food_trucks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFoodTrucks(data);
    }
  };

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);

    if (!error) {
      fetchProfiles();
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesRole = filterRole === 'all' || profile.role === filterRole;

      const matchesSearch =
        profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.user_id_number.toString().includes(searchQuery);

      return matchesRole && matchesSearch;
    });
  }, [profiles, searchQuery, filterRole]);

  const filteredTrucks = useMemo(() => {
    return foodTrucks.filter((truck) => {
      return (
        truck.truck_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.cuisine_types.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        truck.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [foodTrucks, searchQuery]);

  const stats = {
    totalUsers: profiles.length,
    totalCustomers: profiles.filter(p => p.role === 'customer').length,
    totalOwners: profiles.filter(p => p.role === 'food_truck_owner').length,
    blockedUsers: profiles.filter(p => p.is_blocked).length,
    totalTrucks: foodTrucks.length,
    activeTrucks: foodTrucks.filter(t => t.is_active).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdBanner
            adSlot="9685563800"
            adFormat="horizontal"
            adUnitId="admin-top-banner"
          />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users size={20} />
                <p className="text-sm font-medium">Total Users</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Users size={20} />
                <p className="text-sm font-medium">Customers</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.totalCustomers}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Truck size={20} />
                <p className="text-sm font-medium">Food Trucks</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.totalTrucks}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <Ban size={20} />
                <p className="text-sm font-medium">Blocked Users</p>
              </div>
              <p className="text-2xl font-bold text-red-900">{stats.blockedUsers}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedView('users')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'users'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Users
            </button>
            <button
              onClick={() => setSelectedView('trucks')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'trucks'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Truck className="inline mr-2" size={18} />
              Food Trucks
            </button>
            <button
              onClick={() => setSelectedView('messaging')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'messaging'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="inline mr-2" size={18} />
              Messaging
            </button>
            <button
              onClick={() => setSelectedView('affiliates')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'affiliates'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Award className="inline mr-2" size={18} />
              Affiliates
            </button>
            <button
              onClick={() => setSelectedView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'analytics'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="inline mr-2" size={18} />
              Analytics
            </button>
            <button
              onClick={() => setSelectedView('contests')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'contests'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Trophy className="inline mr-2" size={18} />
              Contests
            </button>
            <button
              onClick={() => setSelectedView('features')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'features'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="inline mr-2" size={18} />
              Features
            </button>
            <button
              onClick={() => setSelectedView('announcements')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedView === 'announcements'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Megaphone className="inline mr-2" size={18} />
              Announcements
            </button>
          </div>

          {(selectedView === 'users' || selectedView === 'trucks') && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={selectedView === 'users' ? "Search by name, email, or user ID..." : "Search by truck name, cuisine..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {selectedView === 'users' && (
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customers</option>
                  <option value="food_truck_owner">Food Truck Owners</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <AdBanner
            adSlot="4222835201"
            adFormat="horizontal"
            adUnitId="admin-content-banner"
          />
        </div>

        {selectedView === 'messaging' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <AdminMessaging />
          </div>
        ) : selectedView === 'affiliates' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <AdminAffiliates />
          </div>
        ) : selectedView === 'analytics' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <AdminAnalytics />
          </div>
        ) : selectedView === 'contests' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <AdminContests />
          </div>
        ) : selectedView === 'features' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <AdminFeatures />
          </div>
        ) : selectedView === 'announcements' ? (
          <AdminAnnouncementManager />
        ) : selectedView === 'users' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className={profile.is_blocked ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{profile.user_id_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profile.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {profile.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        profile.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : profile.role === 'food_truck_owner'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.is_blocked ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <Ban size={16} />
                          Blocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle size={16} />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {profile.role !== 'admin' && (
                        <button
                          onClick={() => handleBlockUser(profile.id, profile.is_blocked)}
                          className={`px-3 py-1 rounded-lg font-medium ${
                            profile.is_blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {profile.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truck Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuisine Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrucks.map((truck) => (
                  <tr key={truck.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {truck.logo_url && (
                          <img
                            src={truck.logo_url}
                            alt={truck.truck_name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{truck.truck_name}</p>
                          <p className="text-xs text-gray-500">{truck.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {truck.cuisine_types.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        truck.subscription_tier === 'enterprise'
                          ? 'bg-purple-100 text-purple-800'
                          : truck.subscription_tier === 'premium'
                          ? 'bg-blue-100 text-blue-800'
                          : truck.subscription_tier === 'basic'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {truck.subscription_tier === 'none' ? 'Free' : truck.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {truck.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Online
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {Number(truck.average_rating).toFixed(1)} ({truck.total_reviews})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(truck.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTrucks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No food trucks found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
