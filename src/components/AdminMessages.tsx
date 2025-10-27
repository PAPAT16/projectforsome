import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AdminMessage = {
  id: string;
  message: string;
  message_type: 'info' | 'warning' | 'alert' | 'success';
  target_audience: 'all' | 'owners' | 'customers';
  created_at: string;
};

export function AdminMessages() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);

  useEffect(() => {
    fetchMessages();
  }, [profile]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('is_active', true)
      .or(`target_audience.eq.all,target_audience.eq.${profile?.role === 'food_truck_owner' ? 'owners' : 'customers'}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data as AdminMessage[]);
    }
  };

  const handleDismiss = (messageId: string) => {
    setDismissedMessages([...dismissedMessages, messageId]);
  };

  const visibleMessages = messages.filter(msg => !dismissedMessages.includes(msg.id));

  if (visibleMessages.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="flex-shrink-0" size={20} />;
      case 'warning':
        return <AlertTriangle className="flex-shrink-0" size={20} />;
      case 'success':
        return <CheckCircle className="flex-shrink-0" size={20} />;
      default:
        return <Info className="flex-shrink-0" size={20} />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-2">
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`border rounded-lg p-4 flex items-start gap-3 ${getColors(msg.message_type)}`}
        >
          {getIcon(msg.message_type)}
          <div className="flex-1">
            <p className="text-sm font-medium">{msg.message}</p>
          </div>
          <button
            onClick={() => handleDismiss(msg.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
