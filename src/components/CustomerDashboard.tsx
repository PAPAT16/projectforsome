import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin, Star, X, Heart, Bell, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { FeaturedTrucks } from './FeaturedTrucks';
import { WelcomeMessage } from './WelcomeMessage';
import { AdminMessages } from './AdminMessages';
import { HelpBubble } from './HelpBubble';
import { AdBanner } from './AdBanner';
import { useAuth } from '../contexts/AuthContext';
import { toggleFavorite, getFavorites } from '../utils/favorites';
import { trackTruckView, trackMapClick } from '../utils/analytics';
import type { Database } from '../lib/database.types';

type FoodTruck = Database['public']['Tables']['food_trucks']['Row'] & {
  food_truck_locations: Database['public']['Tables']['food_truck_locations']['Row'] | null;
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY && !import.meta.env.PROD) {
  console.error('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const [foodTrucks, setFoodTrucks] = useState<FoodTruck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState<string[]>([]);
  const [zipFilter, setZipFilter] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mapError, setMapError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleMapError = (e: ErrorEvent) => {
      if (e.message && e.message.includes('Google Maps')) {
        setMapError('Google Maps failed to load. Please check GOOGLE_MAPS_SETUP.md for configuration instructions.');
      }
    };
    window.addEventListener('error', handleMapError);
    return () => window.removeEventListener('error', handleMapError);
  }, []);

  useEffect(() => {
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    if (!import.meta.env.PROD) {
      console.log('Using NYC demo location:', defaultLocation);
    }
    setUserLocation(defaultLocation);

    fetchFoodTrucks();

    if (user) {
      loadFavorites();
      loadNotifications();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const favSet = await getFavorites(user.id);
    setFavorites(favSet);
  };

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
    }
  };

  const handleToggleFavorite = async (truckId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      alert('Please sign in to favorite food trucks');
      return;
    }

    try {
      const isFavorite = await toggleFavorite(user.id, truckId);
      const newFavorites = new Set(favorites);
      if (isFavorite) {
        newFavorites.add(truckId);
      } else {
        newFavorites.delete(truckId);
      }
      setFavorites(newFavorites);
    } catch (err) {
      if (!import.meta.env.PROD) {
        console.error('Failed to toggle favorite:', err);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    loadNotifications();
  };

  const fetchFoodTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .select(`
          *,
          food_truck_locations!inner(*)
        `)
        .eq('food_truck_locations.is_current', true);

      if (error) {
        if (!import.meta.env.PROD) {
          console.error('Error fetching food trucks:', error);
        }
        return;
      }

      if (data) {
        const formatted = data.map(truck => ({
          ...truck,
          food_truck_locations: Array.isArray(truck.food_truck_locations)
            ? truck.food_truck_locations[0]
            : truck.food_truck_locations
        }));
        setFoodTrucks(formatted as FoodTruck[]);
      }
    } catch (err) {
      if (!import.meta.env.PROD) {
        console.error('Exception fetching food trucks:', err);
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredTrucks = useMemo(() => {
    const filtered = foodTrucks.filter(truck => {
      const location = truck.food_truck_locations;
      if (!location) {
        return false;
      }

      if (showOnlineOnly && !truck.is_active) return false;
      if (showFavoritesOnly && !favorites.has(truck.id)) return false;

      if (dietaryFilter.length > 0) {
        const hasDietaryMatch = dietaryFilter.some(diet =>
          truck.dietary_options?.includes(diet)
        );
        if (!hasDietaryMatch) return false;
      }

      const matchesSearch =
        truck.truck_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.cuisine_types.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (location.address && location.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (location.zip_code && location.zip_code.includes(searchQuery));

      if (searchQuery && !matchesSearch) return false;

      if (cuisineFilter.length > 0) {
        const hasMatchingCuisine = cuisineFilter.some(cuisine =>
          truck.cuisine_types.includes(cuisine)
        );
        if (!hasMatchingCuisine) return false;
      }

      if (zipFilter && location.zip_code !== zipFilter) return false;

      if (userLocation) {
        const truckLat = Number(location.latitude);
        const truckLng = Number(location.longitude);

        if (isNaN(truckLat) || isNaN(truckLng)) {
          return false;
        }

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          truckLat,
          truckLng
        );

        if (distance > radiusMiles) return false;
      }

      return true;
    });

    return filtered;
  }, [foodTrucks, searchQuery, cuisineFilter, zipFilter, userLocation, radiusMiles, showOnlineOnly, showFavoritesOnly, dietaryFilter, favorites]);

  const activeTrucks = filteredTrucks.filter(t => t.is_active);
  const allCuisines = Array.from(new Set(foodTrucks.flatMap(t => t.cuisine_types)));
  const allDietaryOptions = Array.from(new Set(foodTrucks.flatMap(t => t.dietary_options || [])));

  const handleTruckClick = (truck: FoodTruck) => {
    setSelectedTruck(truck);
    if (user) {
      trackTruckView(user.id, truck.id);
    }
  };

  const handleMarkerClick = (truck: FoodTruck) => {
    setSelectedTruck(truck);
    if (user) {
      trackMapClick(user.id, truck.id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {foodTrucks.length === 0 && <WelcomeMessage />}

      <div className="max-w-7xl mx-auto px-4 py-3 w-full">
        <AdBanner
          adSlot="3503175127"
          adFormat="horizontal"
          adUnitId="customer-top-banner"
          className="mb-2"
        />
      </div>

      <FeaturedTrucks trucks={foodTrucks} onSelectTruck={setSelectedTruck} />

      <div className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-800">Find Food Trucks</h1>
              <HelpBubble content="Search for food trucks by name, cuisine, or location. Use filters to narrow your results!" position="right" size={20} />
            </div>
            {user && notifications.length > 0 && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell size={24} className="text-gray-700" />
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500" size={20} />
              <input
                type="text"
                placeholder="Search by name, cuisine, zip code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium transition-colors"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type
                  </label>
                  <select
                    multiple
                    value={cuisineFilter}
                    onChange={(e) => setCuisineFilter(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allCuisines.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Options
                  </label>
                  <select
                    multiple
                    value={dietaryFilter}
                    onChange={(e) => setDietaryFilter(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allDietaryOptions.length > 0 ? allDietaryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    )) : <option disabled>No dietary options available</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={zipFilter}
                    onChange={(e) => setZipFilter(e.target.value)}
                    placeholder="Enter zip code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius: {radiusMiles} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Show online trucks only</span>
                </label>
                {user && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                      Favorites only
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <AdminMessages />
      </div>

      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: '800px' }}>
        <div className="w-full lg:w-2/5 overflow-y-auto bg-gray-50 p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTrucks.length} Active Trucks
            </h2>
            <p className="text-sm text-gray-600">
              {filteredTrucks.length - activeTrucks.length} offline trucks in area
            </p>
          </div>

          <div className="space-y-3">
            {filteredTrucks.map((truck) => (
              <div
                key={truck.id}
                onClick={() => handleTruckClick(truck)}
                className={`bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] relative ${
                  selectedTruck?.id === truck.id ? 'ring-2 ring-orange-500 shadow-lg' : ''
                }`}
              >
                {user && (
                  <button
                    onClick={(e) => handleToggleFavorite(truck.id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                  >
                    <Heart
                      size={20}
                      className={favorites.has(truck.id) ? 'text-red-500' : 'text-gray-400'}
                      fill={favorites.has(truck.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                )}
                <div className="flex items-start gap-3">
                  {truck.logo_url && (
                    <img
                      src={truck.logo_url}
                      alt={truck.truck_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {truck.truck_name}
                      </h3>
                      {truck.is_active ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Online
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          Offline
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={16} />
                      <span className="text-sm text-gray-600">
                        {truck.average_rating.toFixed(1)} ({truck.total_reviews} reviews)
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {truck.cuisine_types.join(', ')}
                    </p>

                    {truck.food_truck_locations && (
                      <div className="flex items-start gap-1 mt-2 text-sm text-gray-500">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {truck.food_truck_locations.address ||
                           `${truck.food_truck_locations.zip_code}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredTrucks.length === 0 && foodTrucks.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium mb-2">No trucks found in your area</p>
                <p className="text-sm text-gray-500 mb-3">
                  {foodTrucks.length} trucks available, but none within {radiusMiles} miles
                </p>
                <button
                  onClick={() => setRadiusMiles(50)}
                  className="text-sm text-orange-600 hover:text-green-700 font-medium underline"
                >
                  Expand to 50 miles
                </button>
              </div>
            )}

            {filteredTrucks.length === 0 && foodTrucks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No food trucks available yet
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative min-h-[600px]">
          {!GOOGLE_MAPS_API_KEY ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-6 max-w-md">
                <p className="text-gray-800 font-semibold mb-2">Map Unavailable</p>
                <p className="text-sm text-gray-600 mb-3">Google Maps API key not configured</p>
                <p className="text-xs text-gray-500">See GOOGLE_MAPS_SETUP.md for instructions</p>
              </div>
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center p-6 max-w-md">
                <p className="text-red-800 font-semibold mb-2">Map Configuration Error</p>
                <p className="text-sm text-red-600 mb-3">{mapError}</p>
                <p className="text-xs text-red-500">Common causes:</p>
                <ul className="text-xs text-red-500 text-left mt-2 space-y-1">
                  <li>• Maps JavaScript API not enabled</li>
                  <li>• Billing not enabled in Google Cloud</li>
                  <li>• API key restrictions too strict</li>
                  <li>• Invalid referrer configuration</li>
                </ul>
              </div>
            </div>
          ) : userLocation ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <div className="absolute inset-0">
                <Map
                  defaultCenter={userLocation}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  {activeTrucks.map((truck) => {
                    const location = truck.food_truck_locations;
                    if (!location) return null;

                    return (
                      <Marker
                        key={truck.id}
                        position={{
                          lat: Number(location.latitude),
                          lng: Number(location.longitude),
                        }}
                        onClick={() => handleMarkerClick(truck)}
                      />
                    );
                  })}
                </Map>
              </div>
            </APIProvider>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTruck && (
        <TruckDetailModal truck={selectedTruck} onClose={() => setSelectedTruck(null)} />
      )}

      {showNotifications && notifications.length > 0 && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-96 overflow-y-auto z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <div className="divide-y">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => markNotificationAsRead(notif.id)}
              >
                <p className="font-medium text-gray-900 mb-1">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdBanner
          adSlot="8169819071"
          adFormat="horizontal"
          adUnitId="customer-bottom-banner"
        />
      </div>
    </div>
  );
}

function TruckDetailModal({ truck, onClose }: { truck: FoodTruck; onClose: () => void }) {
  const [menuItems, setMenuItems] = useState<Database['public']['Tables']['food_truck_menu_items']['Row'][]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [images, setImages] = useState<Database['public']['Tables']['food_truck_images']['Row'][]>([]);

  useEffect(() => {
    fetchTruckDetails();
  }, [truck.id]);

  const fetchTruckDetails = async () => {
    const [menuRes, reviewsRes, imagesRes] = await Promise.all([
      supabase.from('food_truck_menu_items').select('*').eq('food_truck_id', truck.id).eq('is_available', true),
      supabase.from('reviews').select('*, profiles(full_name)').eq('food_truck_id', truck.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('food_truck_images').select('*').eq('food_truck_id', truck.id).order('display_order'),
    ]);

    if (!menuRes.error) setMenuItems(menuRes.data);
    if (!reviewsRes.error) setReviews(reviewsRes.data);
    if (!imagesRes.error) setImages(imagesRes.data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{truck.truck_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {images.length > 0 && (
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
          )}

          {truck.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-600">{truck.description}</p>
            </div>
          )}

          {truck.phone && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              <p className="text-gray-600">Phone: {truck.phone}</p>
              {truck.email && <p className="text-gray-600">Email: {truck.email}</p>}
            </div>
          )}

          {menuItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Menu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.item_name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.price && (
                        <span className="text-lg font-semibold text-orange-600">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      )}
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
