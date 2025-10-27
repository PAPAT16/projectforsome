import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Plus, Edit2, Trash2, Users, Calendar } from 'lucide-react';

interface Contest {
  id: string;
  title: string;
  description: string;
  contest_type: 'most_visits' | 'cuisine_explorer' | 'review_champion' | 'custom';
  start_date: string;
  end_date: string;
  prize_description: string | null;
  status: 'upcoming' | 'active' | 'completed';
  rules: any;
  is_active: boolean;
  created_at: string;
}

export default function AdminContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setContests(data);

        // Load participant counts
        for (const contest of data) {
          const { count } = await supabase
            .from('contest_participants')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

          setParticipantCounts(prev => ({ ...prev, [contest.id]: count || 0 }));
        }
      }
    } catch (err) {
      console.error('Error loading contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return;

    try {
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadContests();
    } catch (err) {
      console.error('Error deleting contest:', err);
      alert('Failed to delete contest');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contests')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadContests();
    } catch (err) {
      console.error('Error updating contest:', err);
      alert('Failed to update contest');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Contest Management</h2>
        <button
          onClick={() => {
            setEditingContest(null);
            setShowForm(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Contest
        </button>
      </div>

      {showForm && (
        <ContestForm
          contest={editingContest}
          onClose={() => {
            setShowForm(false);
            setEditingContest(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingContest(null);
            loadContests();
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading contests...</div>
      ) : (
        <div className="space-y-4">
          {contests.map((contest) => (
            <div key={contest.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-xl font-bold text-gray-900">{contest.title}</h3>
                    {getStatusBadge(contest.status)}
                    {!contest.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-3">{contest.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {participantCounts[contest.id] || 0} participants
                    </span>
                    {contest.prize_description && (
                      <span>🏆 {contest.prize_description}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <span className="text-sm text-gray-600 capitalize">{contest.contest_type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(contest.id, contest.is_active)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      contest.is_active
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {contest.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingContest(contest);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteContest(contest.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {contests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contests created yet. Create your first contest to engage users!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContestForm({
  contest,
  onClose,
  onSave,
}: {
  contest: Contest | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Contest>>(
    contest || {
      title: '',
      description: '',
      contest_type: 'most_visits',
      start_date: '',
      end_date: '',
      prize_description: '',
      status: 'upcoming',
      is_active: true,
      rules: {},
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (contest) {
        const { error } = await supabase
          .from('contests')
          .update(formData)
          .eq('id', contest.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contests')
          .insert(formData);

        if (error) throw error;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving contest:', err);
      alert(err.message || 'Failed to save contest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-bold mb-4">{contest ? 'Edit Contest' : 'Create New Contest'}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contest Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contest Type</label>
            <select
              value={formData.contest_type}
              onChange={(e) => setFormData({ ...formData, contest_type: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="most_visits">Most Visits</option>
              <option value="cuisine_explorer">Cuisine Explorer</option>
              <option value="review_champion">Review Champion</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prize Description</label>
          <input
            type="text"
            value={formData.prize_description || ''}
            onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="e.g., $100 gift card, Free meal pass"
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
            {saving ? 'Saving...' : contest ? 'Update Contest' : 'Create Contest'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
