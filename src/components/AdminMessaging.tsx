import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Users, User, Globe, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  subject: string;
  message: string;
  recipient_type: 'all' | 'customers' | 'food_truck_owners' | 'individual';
  recipient_id: string | null;
  created_at: string;
  is_read: boolean;
  recipient?: {
    full_name: string | null;
    email: string;
  };
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

function AdminMessaging() {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [recipientType, setRecipientType] = useState<'all' | 'customers' | 'food_truck_owners' | 'individual'>('all');
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    if (activeTab === 'history') {
      loadMessageHistory();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadMessageHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          recipient:profiles!messages_recipient_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const messageData: any = {
        sender_id: user.id,
        recipient_type: recipientType,
        subject,
        message,
      };

      if (recipientType === 'individual') {
        if (!recipientId) {
          throw new Error('Please select a recipient');
        }
        messageData.recipient_id = recipientId;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setSuccess('Message sent successfully!');
      setSubject('');
      setMessage('');
      setRecipientId('');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientTypeIcon = (type: string) => {
    switch (type) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'food_truck_owners': return <Users className="w-4 h-4" />;
      case 'individual': return <User className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'all': return 'All Users';
      case 'customers': return 'All Customers';
      case 'food_truck_owners': return 'All Food Truck Owners';
      case 'individual': return 'Individual User';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'send'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Send Message
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Message History
        </button>
      </div>

      {activeTab === 'send' && (
        <form onSubmit={handleSendMessage} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center">
              <CheckCheck className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To
            </label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="all">All Users</option>
              <option value="customers">All Customers</option>
              <option value="food_truck_owners">All Food Truck Owners</option>
              <option value="individual">Individual User</option>
            </select>
          </div>

          {recipientType === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter message subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter your message"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5 mr-2" />
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No messages sent yet</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getRecipientTypeIcon(msg.recipient_type)}
                    <span className="font-medium text-gray-900">{msg.subject}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  To: <span className="font-medium">{getRecipientTypeLabel(msg.recipient_type)}</span>
                  {msg.recipient && (
                    <span> - {msg.recipient.full_name || msg.recipient.email}</span>
                  )}
                </div>

                <p className="text-gray-700 text-sm line-clamp-2">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminMessaging;
