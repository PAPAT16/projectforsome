import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, MapPin, Star, Clock, X, DollarSign, BarChart3 } from 'lucide-react';

interface SponsoredPlacement {
  id: string;
  placement_type: 'featured' | 'boosted' | 'map_premium';
  duration_hours: number;
  price_paid: number;
  status: string;
  impressions: number;
  clicks: number;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

interface SponsoredPlacementsProps {
  foodTruckId: string;
  onClose: () => void;
}

export function SponsoredPlacements({ foodTruckId, onClose }: SponsoredPlacementsProps) {
  const [activePlacements, setActivePlacements] = useState<SponsoredPlacement[]>([]);
  const [selectedType, setSelectedType] = useState<'featured' | 'boosted' | 'map_premium'>('boosted');
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivePlacements();
  }, [foodTruckId]);

  const loadActivePlacements = async () => {
    const { data } = await supabase
      .from('sponsored_placements')
      .select('*')
      .eq('food_truck_id', foodTruckId)
      .in('status', ['active', 'scheduled'])
      .order('created_at', { ascending: false });

    if (data) {
      setActivePlacements(data);
    }
  };

  const placementTypes = {
    boosted: {
      name: 'Boosted Listing',
      icon: TrendingUp,
      description: 'Your truck appears at the top of search results for maximum visibility',
      pricePerHour: 4.17,
      features: [
        'Top 3 position in search results',
        'Priority in filtered searches',
        'Highlighted border on listing',
        'Real-time analytics'
      ]
    },
    featured: {
      name: 'Featured Placement',
      icon: Star,
      description: 'Get featured in the premium Featured Trucks section on the homepage',
      pricePerHour: 6.25,
      features: [
        'Premium Featured Trucks section',
        'Large banner display',
        'Higher click-through rates',
        'Detailed performance metrics'
      ]
    },
    map_premium: {
      name: 'Premium Map Pin',
      icon: MapPin,
      description: 'Stand out on the map with a custom premium pin and priority display',
      pricePerHour: 3.33,
      features: [
        'Custom gold map pin',
        'Always visible at current zoom',
        'Pin animation on hover',
        'Location analytics'
      ]
    }
  };

  const calculatePrice = () => {
    const hourlyRate = placementTypes[selectedType].pricePerHour;
    return (hourlyRate * duration).toFixed(2);
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const price = parseFloat(calculatePrice());
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + duration * 60 * 60 * 1000);

      const { error } = await supabase
        .from('sponsored_placements')
        .insert({
          food_truck_id: foodTruckId,
          placement_type: selectedType,
          duration_hours: duration,
          price_paid: price,
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString()
        });

      if (error) throw error;

      alert('Sponsored placement activated successfully! Note: In production, this will integrate with Stripe for payment processing.');
      loadActivePlacements();
    } catch (err: any) {
      console.error('Error purchasing placement:', err);
      alert(err.message || 'Failed to activate sponsored placement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sponsored Placements</h2>
            <p className="text-sm text-gray-600">Boost your truck's visibility and attract more customers</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {activePlacements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Campaigns</h3>
              <div className="space-y-3">
                {activePlacements.map((placement) => {
                  const PlacementIcon = placementTypes[placement.placement_type].icon;
                  const ctr = placement.impressions > 0
                    ? ((placement.clicks / placement.impressions) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <div key={placement.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <PlacementIcon className="text-orange-600" size={24} />
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {placementTypes[placement.placement_type].name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(placement.starts_at).toLocaleDateString()} -{' '}
                              {new Date(placement.ends_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                          {placement.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">Impressions</p>
                          <p className="text-2xl font-bold text-gray-900">{placement.impressions}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">Clicks</p>
                          <p className="text-2xl font-bold text-gray-900">{placement.clicks}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">CTR</p>
                          <p className="text-2xl font-bold text-gray-900">{ctr}%</p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">Spent</p>
                          <p className="text-2xl font-bold text-gray-900">${placement.price_paid.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Why Use Sponsored Placements?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <TrendingUp className="text-orange-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Increase Visibility</p>
                  <p className="text-sm text-gray-600">Stand out from competition</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BarChart3 className="text-orange-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Track Performance</p>
                  <p className="text-sm text-gray-600">Real-time analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="text-orange-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Flexible Pricing</p>
                  <p className="text-sm text-gray-600">Pay only for what you need</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Placement Type</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(Object.keys(placementTypes) as Array<keyof typeof placementTypes>).map((type) => {
              const placement = placementTypes[type];
              const PlacementIcon = placement.icon;

              return (
                <div
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedType === type
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <PlacementIcon className="text-orange-600" size={24} />
                    <h4 className="font-semibold text-gray-900">{placement.name}</h4>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{placement.description}</p>

                  <p className="text-2xl font-bold text-orange-600 mb-3">
                    ${placement.pricePerHour.toFixed(2)}/hour
                  </p>

                  <ul className="space-y-2">
                    {placement.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Campaign Duration</h4>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[24, 72, 168, 336].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setDuration(hours)}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    duration === hours
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-lg">{hours / 24} {hours === 24 ? 'Day' : 'Days'}</div>
                  <div className="text-xs opacity-75">
                    ${(placementTypes[selectedType].pricePerHour * hours).toFixed(0)}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-gray-400" size={20} />
              <input
                type="range"
                min="1"
                max="720"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 min-w-[80px]">
                {duration} hours
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Campaign Duration:</span>
                <span className="font-semibold text-gray-900">{duration} hours ({(duration / 24).toFixed(1)} days)</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-semibold text-gray-900">${placementTypes[selectedType].pricePerHour.toFixed(2)}/hour</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
                  <span className="text-2xl font-bold text-orange-600">${calculatePrice()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Purchase for $${calculatePrice()}`}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Note: Payment processing via Stripe will be integrated in production.
            This demo creates the placement record immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
