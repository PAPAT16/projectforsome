import { Star, MapPin, ChevronRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type FoodTruck = Database['public']['Tables']['food_trucks']['Row'] & {
  food_truck_locations: Database['public']['Tables']['food_truck_locations']['Row'] | null;
};

interface FeaturedTrucksProps {
  trucks: FoodTruck[];
  onSelectTruck: (truck: FoodTruck) => void;
}

export function FeaturedTrucks({ trucks, onSelectTruck }: FeaturedTrucksProps) {
  const featuredTrucks = trucks
    .filter(t => t.is_active)
    .sort((a, b) => {
      if (b.average_rating !== a.average_rating) {
        return b.average_rating - a.average_rating;
      }
      return b.total_reviews - a.total_reviews;
    })
    .slice(0, 3);

  if (featuredTrucks.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 py-8 px-4 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Food Trucks</h2>
            <p className="text-sm text-gray-600 mt-1">Highly rated trucks in your area</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <Star className="fill-yellow-500" size={20} />
            <span className="text-sm font-medium">Top Rated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTrucks.map((truck, index) => (
            <div
              key={truck.id}
              onClick={() => onSelectTruck(truck)}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
                {truck.logo_url && (
                  <img
                    src={truck.logo_url}
                    alt={truck.truck_name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <span>#{index + 1}</span>
                  <Star className="fill-gray-900" size={14} />
                </div>
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ONLINE
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{truck.truck_name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < Math.floor(truck.average_rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {truck.average_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">({truck.total_reviews} reviews)</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {truck.cuisine_types.slice(0, 3).map((cuisine) => (
                    <span
                      key={cuisine}
                      className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>

                {truck.food_truck_locations && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="line-clamp-2">
                      {truck.food_truck_locations.address || truck.food_truck_locations.zip_code}
                    </span>
                  </div>
                )}

                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                  View Details
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
