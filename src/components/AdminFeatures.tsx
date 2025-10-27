import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, HelpCircle } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: 'free' | 'basic' | 'premium';
  created_at: string;
}

export function AdminFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    tier: 'free' as 'free' | 'basic' | 'premium',
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('tier', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
      alert('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('features')
        .update({ enabled: !currentEnabled, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadFeatures();
    } catch (err) {
      console.error('Error toggling feature:', err);
      alert('Failed to toggle feature');
    }
  };

  const handleUpdateTier = async (id: string, newTier: 'free' | 'basic' | 'premium') => {
    try {
      const { error } = await supabase
        .from('features')
        .update({ tier: newTier, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadFeatures();
    } catch (err) {
      console.error('Error updating tier:', err);
      alert('Failed to update tier');
    }
  };

  const handleAddFeature = async () => {
    if (!formData.name.trim()) {
      alert('Feature name is required');
      return;
    }

    try {
      const { error } = await supabase.from('features').insert([formData]);

      if (error) throw error;
      setShowAddForm(false);
      setFormData({ name: '', description: '', enabled: true, tier: 'free' });
      loadFeatures();
    } catch (err) {
      console.error('Error adding feature:', err);
      alert('Failed to add feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const { error } = await supabase.from('features').delete().eq('id', id);

      if (error) throw error;
      loadFeatures();
    } catch (err) {
      console.error('Error deleting feature:', err);
      alert('Failed to delete feature');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'basic':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'premium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Management</h2>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            Control which features are available and assign them to subscription tiers
            <HelpCircle size={16} className="text-gray-400 cursor-help" title="Features can be toggled on/off and assigned to Free, Basic, or Premium tiers" />
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={20} />
          Add Feature
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Feature</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Premium Analytics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe what this feature does..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">
                  Enable this feature immediately
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddFeature}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Add Feature
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', description: '', enabled: true, tier: 'free' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {['free', 'basic', 'premium'].map((tier) => {
          const tierFeatures = features.filter((f) => f.tier === tier);
          if (tierFeatures.length === 0) return null;

          return (
            <div key={tier} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-3 border-b border-gray-200 ${getTierColor(tier)}`}>
                <h3 className="text-lg font-bold capitalize">{tier} Tier</h3>
                <p className="text-xs opacity-75">
                  {tier === 'free' && 'Available to all users'}
                  {tier === 'basic' && 'Requires Basic subscription'}
                  {tier === 'premium' && 'Requires Premium subscription'}
                </p>
              </div>
              <div className="divide-y">
                {tierFeatures.map((feature) => (
                  <div key={feature.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                          <button
                            onClick={() => handleToggleEnabled(feature.id, feature.enabled)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              feature.enabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {feature.enabled ? (
                              <>
                                <ToggleRight size={16} />
                                Enabled
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={16} />
                                Disabled
                              </>
                            )}
                          </button>
                        </div>
                        {feature.description && (
                          <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Tier:</label>
                          <select
                            value={feature.tier}
                            onChange={(e) =>
                              handleUpdateTier(feature.id, e.target.value as any)
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFeature(feature.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete feature"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {features.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No features yet. Click "Add Feature" to create one.</p>
        </div>
      )}
    </div>
  );
}
