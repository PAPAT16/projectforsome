import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, CheckCircle, FileText, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangelogEntry {
  id: string;
  change_type: string;
  title: string;
  description: string;
  changed_by: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requires_notification: boolean;
  notification_sent: boolean;
  created_at: string;
}

interface AdminChangelogProps {
  onClose: () => void;
}

export function AdminChangelog({ onClose }: AdminChangelogProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'api_key' | 'config' | 'security' | 'critical'>('all');

  useEffect(() => {
    loadChangelog();
  }, [filter]);

  const loadChangelog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('system_changelog')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'critical') {
        query = query.eq('severity', 'critical');
      } else if (filter !== 'all') {
        query = query.eq('change_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error loading changelog:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'high':
        return <AlertCircle size={20} className="text-orange-600" />;
      case 'medium':
        return <Info size={20} className="text-blue-600" />;
      case 'low':
        return <CheckCircle size={20} className="text-green-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api_key':
        return 'bg-purple-100 text-purple-800';
      case 'config':
        return 'bg-blue-100 text-blue-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'feature':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-white" />
            <h2 className="text-2xl font-bold text-white">System Changelog</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Changes
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Critical Only
            </button>
            <button
              onClick={() => setFilter('api_key')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'api_key'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              API Changes
            </button>
            <button
              onClick={() => setFilter('security')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'security'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setFilter('config')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'config'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Configuration
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No changelog entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`border-l-4 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
                    entry.severity === 'critical'
                      ? 'border-red-500'
                      : entry.severity === 'high'
                      ? 'border-orange-500'
                      : entry.severity === 'medium'
                      ? 'border-blue-500'
                      : 'border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getSeverityIcon(entry.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                              entry.change_type
                            )}`}
                          >
                            {entry.change_type.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                              entry.severity
                            )}`}
                          >
                            {entry.severity}
                          </span>
                          {entry.requires_notification && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                entry.notification_sent
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {entry.notification_sent ? 'Email Sent' : 'Pending Email'}
                            </span>
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle size={16} className="text-orange-600" />
            <p>
              Critical changes to API keys (Stripe, Google Maps) or super admin email automatically
              trigger notifications to <strong>Mrc.morris@energefinancial.com</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
