import { useState, useEffect } from 'react';
import { MapPin, Menu, Image, Star, CreditCard, Settings, MessageSquare, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { AdminMessages } from './AdminMessages';
import { AdBanner } from './AdBanner';
import type { Database } from '../lib/database.types';

type FoodTruck = Database['public']['Tables']['food_trucks']['Row'];
type MenuItem = Database['public']['Tables']['food_truck_menu_items']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'] & {
  profiles: { full_name: string } | null;
};

type FoodTruckWithLocation = FoodTruck & {
  food_truck_locations: { latitude: number; longitude: number; address: string } | null;
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key is missing. Map features will be unavailable.');
}

export function OwnerDashboard({ showTruckView, onCloseTruckView }: { showTruckView?: boolean; onCloseTruckView?: () => void }) {
  const { profile } = useAuth();
  const [foodTruck, setFoodTruck] = useState<FoodTruck | null>(null);
  const [nearbyTrucks, setNearbyTrucks] = useState<FoodTruckWithLocation[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'location' | 'menu' | 'reviews' | 'subscription'>('profile');
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const handleMapError = () => {
      setMapError('Google Maps configuration error. See GOOGLE_MAPS_SETUP.md');
    };
    window.addEventListener('error', handleMapError);
    return () => window.removeEventListener('error', handleMapError);
  }, []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchFoodTruck();
    }
  }, [profile]);

  useEffect(() => {
    if (foodTruck && myLocation) {
      fetchNearbyTrucks();
    }
  }, [foodTruck, myLocation]);

  const fetchFoodTruck = async () => {
    const { data, error } = await supabase
      .from('food_trucks')
      .select('*')
      .eq('owner_id', profile?.id)
      .maybeSingle();

    if (!error && data) {
      setFoodTruck(data);

      const { data: locationData } = await supabase
        .from('food_truck_locations')
        .select('latitude, longitude')
        .eq('food_truck_id', data.id)
        .eq('is_current', true)
        .maybeSingle();

      if (locationData) {
        setMyLocation({
          lat: Number(locationData.latitude),
          lng: Number(locationData.longitude)
        });
      }
    }
    setLoading(false);
  };

  const fetchNearbyTrucks = async () => {
    if (!myLocation) return;

    const { data } = await supabase
      .from('food_trucks')
      .select(`
        *,
        food_truck_locations!inner(*)
      `)
      .eq('food_truck_locations.is_current', true)
      .eq('is_active', true)
      .neq('id', foodTruck?.id);

    if (data) {
      const trucksWithDistance = data
        .map(truck => ({
          ...truck,
          food_truck_locations: Array.isArray(truck.food_truck_locations)
            ? truck.food_truck_locations[0]
            : truck.food_truck_locations,
          distance: calculateDistance(
            myLocation.lat,
            myLocation.lng,
            Number(truck.food_truck_locations[0]?.latitude || 0),
            Number(truck.food_truck_locations[0]?.longitude || 0)
          )
        }))
        .filter(truck => truck.distance <= 3)
        .sort((a, b) => a.distance - b.distance);

      setNearbyTrucks(trucksWithDistance as FoodTruckWithLocation[]);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const hasActiveSubscription = foodTruck?.subscription_status === 'active';
  const canUseFeature = (feature: string) => {
    if (!hasActiveSubscription) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!foodTruck) {
    return <CreateFoodTruckForm onCreated={fetchFoodTruck} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showTruckView && foodTruck && (
        <TruckViewModal foodTruck={foodTruck} onClose={onCloseTruckView!} />
      )}

      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdBanner
            adSlot="5543655739"
            adFormat="horizontal"
            adUnitId="owner-top-banner"
            className="mb-2"
          />
        </div>
      </div>

      {GOOGLE_MAPS_API_KEY && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="mb-3">
              <AdminMessages />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Active Food Trucks {myLocation && <span className="text-sm text-gray-600">({nearbyTrucks.length} within 3 miles)</span>}
            </h3>
            {mapError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium mb-1">Map Configuration Required</p>
                <p className="text-sm text-yellow-700 mb-2">{mapError}</p>
                <p className="text-xs text-yellow-600">Enable Maps JavaScript API and billing in Google Cloud Console</p>
              </div>
            ) : myLocation ? (
              <>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <div className="relative h-80 rounded-lg overflow-hidden shadow">
                <Map
                  defaultCenter={myLocation}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  <Marker position={myLocation} />
                  {nearbyTrucks.map((truck) => {
                    const loc = truck.food_truck_locations;
                    if (!loc) return null;
                    return (
                      <Marker
                        key={truck.id}
                        position={{
                          lat: Number(loc.latitude),
                          lng: Number(loc.longitude)
                        }}
                      />
                    );
                  })}
                </Map>
              </div>
            </APIProvider>
            {nearbyTrucks.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {nearbyTrucks.slice(0, 3).map((truck) => (
                  <div key={truck.id} className="text-sm bg-gray-50 p-2 rounded">
                    <p className="font-medium text-gray-900 truncate">{truck.truck_name}</p>
                    <p className="text-gray-600 text-xs">{((truck as any).distance).toFixed(1)} miles away</p>
                  </div>
                ))}
              </div>
            )}
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-800 font-medium mb-2">📍 Set Your Location to View Nearby Trucks</p>
                <p className="text-blue-600 text-sm">Go to the Location tab to set your truck's current location.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">{foodTruck.truck_name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  foodTruck.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {foodTruck.is_active ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Food Truck Owner Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Toggle Status:</span>
                <button
                  onClick={async () => {
                    if (!hasActiveSubscription) {
                      alert('Please subscribe to use location features');
                      return;
                    }
                    const { error } = await supabase
                      .from('food_trucks')
                      .update({ is_active: !foodTruck.is_active })
                      .eq('id', foodTruck.id);
                    if (!error) fetchFoodTruck();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    foodTruck.is_active ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      foodTruck.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Subscription</p>
                <p className="font-semibold capitalize">
                  {foodTruck.subscription_tier === 'none' ? 'Free' : foodTruck.subscription_tier}
                </p>
              </div>
              {hasActiveSubscription ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { key: 'profile', label: 'Profile', icon: Settings },
              { key: 'location', label: 'Location', icon: MapPin },
              { key: 'menu', label: 'Menu', icon: Menu },
              { key: 'reviews', label: 'Reviews', icon: MessageSquare },
              { key: 'subscription', label: 'Subscription', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <AdBanner
            adSlot="3311727149"
            adFormat="horizontal"
            adUnitId="owner-content-top"
          />
        </div>

        {activeTab === 'profile' && (
          <ProfileTab foodTruck={foodTruck} onUpdate={fetchFoodTruck} />
        )}
        {activeTab === 'location' && (
          <LocationTab
            foodTruck={foodTruck}
            onUpdate={fetchFoodTruck}
            canUseFeature={canUseFeature('location_toggle')}
          />
        )}
        {activeTab === 'menu' && (
          <MenuTab
            foodTruckId={foodTruck.id}
            canUseFeature={canUseFeature('menu_management')}
            subscriptionTier={foodTruck.subscription_tier}
          />
        )}
        {activeTab === 'reviews' && (
          <ReviewsTab foodTruckId={foodTruck.id} canUseFeature={canUseFeature('review_responses')} />
        )}
        {activeTab === 'subscription' && (
          <SubscriptionTab foodTruck={foodTruck} onUpdate={fetchFoodTruck} />
        )}

        <div className="mt-6">
          <AdBanner
            adSlot="1820033140"
            adFormat="horizontal"
            adUnitId="owner-content-bottom"
          />
        </div>
      </div>
    </div>
  );
}

function CreateFoodTruckForm({ onCreated }: { onCreated: () => void }) {
  const { profile } = useAuth();
  const [truckName, setTruckName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('food_trucks').insert({
      owner_id: profile!.id,
      truck_name: truckName,
      description,
      cuisine_types: cuisineTypes.split(',').map(c => c.trim()),
      phone,
      email,
    });

    if (!error) {
      onCreated();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold mb-6">Create Your Food Truck Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Truck Name
            </label>
            <input
              type="text"
              value={truckName}
              onChange={(e) => setTruckName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine Types (comma separated)
            </label>
            <input
              type="text"
              value={cuisineTypes}
              onChange={(e) => setCuisineTypes(e.target.value)}
              placeholder="e.g. Mexican, Tacos, Street Food"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating...' : 'Create Food Truck'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileTab({ foodTruck, onUpdate }: { foodTruck: FoodTruck; onUpdate: () => void }) {
  const { profile } = useAuth();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(false);
  const [personalData, setPersonalData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    profile_image_url: (profile as any)?.profile_image_url || '',
  });
  const [truckData, setTruckData] = useState({
    truck_name: foodTruck.truck_name,
    description: foodTruck.description || '',
    cuisine_types: foodTruck.cuisine_types.join(', '),
    phone: foodTruck.phone || '',
    email: foodTruck.email || '',
    logo_url: foodTruck.logo_url || '',
    truck_profile_image_url: (foodTruck as any).truck_profile_image_url || '',
  });

  const handleSavePersonal = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: personalData.full_name,
        profile_image_url: personalData.profile_image_url,
      })
      .eq('id', profile!.id);

    if (!error) {
      setEditingPersonal(false);
      window.location.reload();
    }
  };

  const handleSaveTruck = async () => {
    const { error } = await supabase
      .from('food_trucks')
      .update({
        truck_name: truckData.truck_name,
        description: truckData.description,
        cuisine_types: truckData.cuisine_types.split(',').map(c => c.trim()),
        phone: truckData.phone,
        email: truckData.email,
        logo_url: truckData.logo_url,
        truck_profile_image_url: truckData.truck_profile_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', foodTruck.id);

    if (!error) {
      setEditingTruck(false);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Personal Profile</h2>
          {!editingPersonal ? (
            <button
              onClick={() => setEditingPersonal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Personal Info
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingPersonal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePersonal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            {editingPersonal ? (
              <input
                type="text"
                value={personalData.full_name}
                onChange={(e) => setPersonalData({ ...personalData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{personalData.full_name || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{personalData.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
            {editingPersonal ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={personalData.profile_image_url}
                  onChange={(e) => setPersonalData({ ...personalData, profile_image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/profile.jpg"
                />
                {personalData.profile_image_url && (
                  <img
                    src={personalData.profile_image_url}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {personalData.profile_image_url ? (
                  <img
                    src={personalData.profile_image_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                <p className="text-sm text-gray-600">{personalData.profile_image_url || 'Not provided'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Food Truck Profile</h2>
          {!editingTruck ? (
            <button
              onClick={() => setEditingTruck(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Truck Info
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTruck(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTruck}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Name</label>
            {editingTruck ? (
              <input
                type="text"
                value={truckData.truck_name}
                onChange={(e) => setTruckData({ ...truckData, truck_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{truckData.truck_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {editingTruck ? (
              <textarea
                value={truckData.description}
                onChange={(e) => setTruckData({ ...truckData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{truckData.description || 'No description'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Types</label>
            {editingTruck ? (
              <input
                type="text"
                value={truckData.cuisine_types}
                onChange={(e) => setTruckData({ ...truckData, cuisine_types: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{truckData.cuisine_types}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editingTruck ? (
                <input
                  type="tel"
                  value={truckData.phone}
                  onChange={(e) => setTruckData({ ...truckData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{truckData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editingTruck ? (
                <input
                  type="email"
                  value={truckData.email}
                  onChange={(e) => setTruckData({ ...truckData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{truckData.email || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            {editingTruck ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={truckData.logo_url}
                  onChange={(e) => setTruckData({ ...truckData, logo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                />
                {truckData.logo_url && (
                  <img
                    src={truckData.logo_url}
                    alt="Logo preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {truckData.logo_url ? (
                  <img
                    src={truckData.logo_url}
                    alt="Logo"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    No Logo
                  </div>
                )}
                <p className="text-sm text-gray-600">{truckData.logo_url || 'Not provided'}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Cover Image URL</label>
            {editingTruck ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={truckData.truck_profile_image_url}
                  onChange={(e) => setTruckData({ ...truckData, truck_profile_image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/truck-cover.jpg"
                />
                {truckData.truck_profile_image_url && (
                  <img
                    src={truckData.truck_profile_image_url}
                    alt="Cover preview"
                    className="w-full h-32 rounded-lg object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {truckData.truck_profile_image_url ? (
                  <img
                    src={truckData.truck_profile_image_url}
                    alt="Truck cover"
                    className="w-full h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                    No Cover Image
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationTab({
  foodTruck,
  onUpdate,
  canUseFeature,
}: {
  foodTruck: FoodTruck;
  onUpdate: () => void;
  canUseFeature: boolean;
}) {
  const [location, setLocation] = useState<Database['public']['Tables']['food_truck_locations']['Row'] | null>(null);
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, [foodTruck.id]);

  const fetchLocation = async () => {
    const { data } = await supabase
      .from('food_truck_locations')
      .select('*')
      .eq('food_truck_id', foodTruck.id)
      .eq('is_current', true)
      .maybeSingle();

    if (data) {
      setLocation(data);
      setAddress(data.address || '');
      setZipCode(data.zip_code || '');
    }
  };

  const handleToggleActive = async () => {
    if (!canUseFeature) {
      alert('Please subscribe to use location features');
      return;
    }

    const { error } = await supabase
      .from('food_trucks')
      .update({ is_active: !foodTruck.is_active, updated_at: new Date().toISOString() })
      .eq('id', foodTruck.id);

    if (!error) {
      onUpdate();
    }
  };

  const handleUpdateLocation = async () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (location) {
            const { error } = await supabase
              .from('food_truck_locations')
              .update({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address,
                zip_code: zipCode,
                updated_at: new Date().toISOString(),
              })
              .eq('id', location.id);

            if (!error) {
              await fetchLocation();
            }
          } else {
            const { error } = await supabase.from('food_truck_locations').insert({
              food_truck_id: foodTruck.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address,
              zip_code: zipCode,
            });

            if (!error) {
              await fetchLocation();
            }
          }
          setLoading(false);
        },
        () => {
          alert('Unable to get your location');
          setLoading(false);
        }
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Location Management</h2>

      {!canUseFeature && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">
            Subscribe to a plan to enable location features
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-lg">Location Sharing</h3>
            <p className="text-sm text-gray-600">
              {foodTruck.is_active ? 'Your truck is visible on the map' : 'Your truck is hidden from the map'}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={!canUseFeature}
            className={`px-6 py-3 rounded-lg font-medium ${
              foodTruck.is_active
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {foodTruck.is_active ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Current Location</h3>
          {location ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Coordinates:</span> {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
              </p>
              <p>
                <span className="font-medium">Address:</span> {location.address || 'Not set'}
              </p>
              <p>
                <span className="font-medium">Zip Code:</span> {location.zip_code || 'Not set'}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No location set</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10001"
            />
          </div>

          <button
            onClick={handleUpdateLocation}
            disabled={loading || !canUseFeature}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Updating...' : 'Update Location (Use Current GPS)'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuTab({ foodTruckId, canUseFeature, subscriptionTier }: { foodTruckId: string; canUseFeature: boolean; subscriptionTier: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, [foodTruckId]);

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from('food_truck_menu_items')
      .select('*')
      .eq('food_truck_id', foodTruckId)
      .order('category');

    if (data) {
      setMenuItems(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('food_truck_menu_items').delete().eq('id', id);
    if (!error) {
      fetchMenuItems();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Menu Items</h2>
        {canUseFeature && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Item
          </button>
        )}
      </div>

      {!canUseFeature && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">Subscribe to manage your menu</p>
        </div>
      )}

      {showAddForm && (
        <AddMenuItemForm
          foodTruckId={foodTruckId}
          onClose={() => setShowAddForm(false)}
          onAdded={fetchMenuItems}
          canUploadImage={subscriptionTier === 'basic' || subscriptionTier === 'premium' || subscriptionTier === 'enterprise'}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {menuItems.map((item) => (
          <div key={item.id} className="border rounded-lg overflow-hidden">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.item_name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{item.item_name}</h3>
                {item.price && (
                  <span className="text-green-600 font-bold">${Number(item.price).toFixed(2)}</span>
                )}
              </div>
              {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
              {item.category && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {item.category}
                </span>
              )}
              {canUseFeature && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="mt-2 text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <p className="text-center text-gray-500 py-8">No menu items yet</p>
      )}
    </div>
  );
}

function AddMenuItemForm({
  foodTruckId,
  onClose,
  onAdded,
  canUploadImage,
}: {
  foodTruckId: string;
  onClose: () => void;
  onAdded: () => void;
  canUploadImage: boolean;
}) {
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('food_truck_menu_items').insert({
      food_truck_id: foodTruckId,
      item_name: formData.item_name,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : null,
      category: formData.category,
      image_url: formData.image_url || null,
    });

    if (!error) {
      onAdded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Add Menu Item</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {canUploadImage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
                <span className="ml-2 text-xs text-green-600">(Basic/Premium feature)</span>
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/food-image.jpg"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewsTab({ foodTruckId, canUseFeature }: { foodTruckId: string; canUseFeature: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [foodTruckId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('food_truck_id', foodTruckId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as Review[]);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!canUseFeature) {
      alert('Subscribe to premium to respond to reviews');
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .update({
        owner_response: response,
        owner_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (!error) {
      setRespondingTo(null);
      setResponse('');
      fetchReviews();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      {!canUseFeature && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">
            Subscribe to premium to respond to reviews
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  by {review.profiles?.full_name || 'Anonymous'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            {review.comment && <p className="text-gray-700 mb-2">{review.comment}</p>}

            {review.owner_response ? (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-900 mb-1">Your Response:</p>
                <p className="text-sm text-blue-800">{review.owner_response}</p>
              </div>
            ) : (
              <>
                {respondingTo === review.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Write your response..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponse('');
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRespond(review.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Submit Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    disabled={!canUseFeature}
                    className="mt-2 text-blue-600 text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Respond
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-center text-gray-500 py-8">No reviews yet</p>
        )}
      </div>
    </div>
  );
}

function SubscriptionTab({ foodTruck, onUpdate }: { foodTruck: FoodTruck; onUpdate: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Subscription Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            tier: 'basic',
            name: 'FTL Basic Membership',
            price: '$9.95',
            priceId: 'price_1SKKzW5k4NG6yuUaUHdedYtr',
            features: ['Build your truck profile', 'Upload your logo', 'Add up to 10 menu items', 'Show live location on map', 'Connect with nearby customers'],
          },
          {
            tier: 'premium',
            name: 'FTL Premium Membership',
            price: '$29.95',
            priceId: 'price_1SKL0z5k4NG6yuUa2HJ93qkF',
            features: ['All Basic features', 'Online ordering', 'Social media links', 'Unlimited menu items with photos', 'Detailed performance stats', 'Enhanced map visibility'],
          },
        ].map((plan) => (
          <div
            key={plan.tier}
            className={`border-2 rounded-lg p-6 ${
              foodTruck.subscription_tier === plan.tier ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">
              {plan.price}
              <span className="text-base font-normal text-gray-600">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  {feature}
                </li>
              ))}
            </ul>
            {foodTruck.subscription_tier === plan.tier ? (
              <div className="text-center text-green-600 font-medium">Current Plan</div>
            ) : (
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                Select Plan
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TruckViewModal({ foodTruck, onClose }: { foodTruck: FoodTruck; onClose: () => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [images, setImages] = useState<Database['public']['Tables']['food_truck_images']['Row'][]>([]);

  useEffect(() => {
    fetchTruckDetails();
  }, [foodTruck.id]);

  const fetchTruckDetails = async () => {
    const [menuRes, reviewsRes, imagesRes] = await Promise.all([
      supabase.from('food_truck_menu_items').select('*').eq('food_truck_id', foodTruck.id).eq('is_available', true),
      supabase.from('reviews').select('*, profiles(full_name)').eq('food_truck_id', foodTruck.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('food_truck_images').select('*').eq('food_truck_id', foodTruck.id).order('display_order'),
    ]);

    if (!menuRes.error) setMenuItems(menuRes.data);
    if (!reviewsRes.error) setReviews(reviewsRes.data);
    if (!imagesRes.error) setImages(imagesRes.data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">{foodTruck.truck_name}</h2>
            <p className="text-sm text-gray-600">Customer View</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {(foodTruck as any).truck_profile_image_url && (
            <img
              src={(foodTruck as any).truck_profile_image_url}
              alt={foodTruck.truck_name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {images.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={img.caption || ''}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {foodTruck.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-600">{foodTruck.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-2">Cuisine</h3>
            <p className="text-gray-600">{foodTruck.cuisine_types.join(', ')}</p>
          </div>

          {(foodTruck.phone || foodTruck.email) && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              {foodTruck.phone && <p className="text-gray-600">Phone: {foodTruck.phone}</p>}
              {foodTruck.email && <p className="text-gray-600">Email: {foodTruck.email}</p>}
            </div>
          )}

          {menuItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Menu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.item_name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.price && (
                          <span className="text-lg font-semibold text-green-600">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Reviews</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        by {review.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    {review.owner_response && (
                      <div className="mt-2 ml-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-700">Owner Response:</p>
                        <p className="text-sm text-gray-600 mt-1">{review.owner_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
