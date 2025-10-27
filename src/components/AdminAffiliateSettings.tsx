import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2, Edit2, Eye, EyeOff, Settings } from 'lucide-react';

interface AffiliateSettings {
  id: string;
  commission_rate_default: number;
  payment_terms: string;
  approval_required: boolean;
  minimum_payout: number;
  payout_schedule: 'weekly' | 'monthly' | 'quarterly';
  terms_and_conditions: string;
  welcome_message: string;
  updated_at: string;
}

interface AffiliateMaterial {
  id: string;
  title: string;
  description: string | null;
  material_type: 'banner' | 'email_template' | 'social_post' | 'guide' | 'link' | 'video';
  content: string;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminAffiliateSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'materials'>('general');
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [materials, setMaterials] = useState<AffiliateMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AffiliateMaterial | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'general') {
        await loadSettings();
      } else {
        await loadMaterials();
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('affiliate_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }
    setSettings(data);
  };

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from('affiliate_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading materials:', error);
      return;
    }
    setMaterials(data || []);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('affiliate_settings')
        .update({
          commission_rate_default: settings.commission_rate_default,
          payment_terms: settings.payment_terms,
          approval_required: settings.approval_required,
          minimum_payout: settings.minimum_payout,
          payout_schedule: settings.payout_schedule,
          terms_and_conditions: settings.terms_and_conditions,
          welcome_message: settings.welcome_message,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMaterial = async (material: Partial<AffiliateMaterial>) => {
    setSaving(true);
    setError(null);

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('affiliate_materials')
          .update(material)
          .eq('id', editingMaterial.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('affiliate_materials')
          .insert(material);

        if (error) throw error;
      }

      setSuccess('Material saved successfully!');
      setShowMaterialForm(false);
      setEditingMaterial(null);
      await loadMaterials();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving material:', err);
      setError(err.message || 'Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Material deleted successfully!');
      await loadMaterials();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting material:', err);
      setError(err.message || 'Failed to delete material');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('affiliate_materials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadMaterials();
    } catch (err: any) {
      console.error('Error toggling material status:', err);
      setError(err.message || 'Failed to update material status');
    }
  };

  const MaterialTypeIcon = ({ type }: { type: string }) => {
    const icons: Record<string, string> = {
      banner: '🖼️',
      email_template: '📧',
      social_post: '📱',
      guide: '📚',
      link: '🔗',
      video: '🎥',
    };
    return <span className="text-2xl">{icons[type] || '📄'}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Affiliate Program Settings</h2>
      </div>

      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'general'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="inline w-5 h-5 mr-2" />
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'materials'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Marketing Materials
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTab === 'general' && settings && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.commission_rate_default}
                    onChange={(e) => setSettings({ ...settings, commission_rate_default: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Payout Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.minimum_payout}
                    onChange={(e) => setSettings({ ...settings, minimum_payout: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Schedule
                  </label>
                  <select
                    value={settings.payout_schedule}
                    onChange={(e) => setSettings({ ...settings, payout_schedule: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={settings.approval_required}
                      onChange={(e) => setSettings({ ...settings, approval_required: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>Require Approval for New Affiliates</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <textarea
                  value={settings.payment_terms}
                  onChange={(e) => setSettings({ ...settings, payment_terms: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={settings.welcome_message}
                  onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms and Conditions
                </label>
                <textarea
                  value={settings.terms_and_conditions}
                  onChange={(e) => setSettings({ ...settings, terms_and_conditions: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Manage marketing materials for your affiliates</p>
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setShowMaterialForm(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Material
                </button>
              </div>

              {showMaterialForm && (
                <MaterialForm
                  material={editingMaterial}
                  onSave={handleSaveMaterial}
                  onCancel={() => {
                    setShowMaterialForm(false);
                    setEditingMaterial(null);
                  }}
                  saving={saving}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <div key={material.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <MaterialTypeIcon type={material.material_type} />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(material.id, material.is_active)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {material.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingMaterial(material);
                            setShowMaterialForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{material.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{material.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 capitalize">{material.material_type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded-full ${material.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {material.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {materials.length === 0 && !showMaterialForm && (
                <div className="text-center py-12 text-gray-500">
                  No materials yet. Add your first marketing material to help affiliates promote your service.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MaterialForm({
  material,
  onSave,
  onCancel,
  saving,
}: {
  material: AffiliateMaterial | null;
  onSave: (material: Partial<AffiliateMaterial>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AffiliateMaterial>>(
    material || {
      title: '',
      description: '',
      material_type: 'banner',
      content: '',
      thumbnail_url: '',
      is_active: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-gray-50 space-y-4">
      <h3 className="text-lg font-semibold mb-4">{material ? 'Edit Material' : 'Add New Material'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={formData.material_type}
            onChange={(e) => setFormData({ ...formData, material_type: e.target.value as any })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="banner">Banner</option>
            <option value="email_template">Email Template</option>
            <option value="social_post">Social Post</option>
            <option value="guide">Guide</option>
            <option value="link">Link</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Content (HTML, Text, or URL)</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL (optional)</label>
        <input
          type="url"
          value={formData.thumbnail_url || ''}
          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Material'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
