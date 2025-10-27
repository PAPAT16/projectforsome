import { useState, useEffect } from 'react';
import { Camera, User, Bell, BellOff, Save, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HelpBubble } from './HelpBubble';

export function UserProfile({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationOptIn, setNotificationOptIn] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setBio(data.bio || '');
        setProfileImageUrl(data.profile_image_url || '');
        setHeaderImageUrl(data.header_image_url || '');
        setPushNotifications(data.push_notifications_enabled || false);
        setEmailNotifications(data.email_notifications_enabled !== false);
        setNotificationOptIn(data.notification_opt_in !== false);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio,
          profile_image_url: profileImageUrl,
          header_image_url: headerImageUrl,
          push_notifications_enabled: pushNotifications,
          email_notifications_enabled: emailNotifications,
          notification_opt_in: notificationOptIn,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Profile updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'header'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (type === 'profile') {
        setProfileImageUrl(dataUrl);
      } else {
        setHeaderImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="relative h-48 bg-gradient-to-r from-orange-400 to-blue-500 overflow-hidden">
            {headerImageUrl ? (
              <img
                src={headerImageUrl}
                alt="Header"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={48} className="text-white opacity-50" />
              </div>
            )}
            <label className="absolute bottom-4 right-4 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Upload size={16} />
              Upload Header
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'header')}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition-colors">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profile?.full_name || 'Food Truck Enthusiast'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Bio
                <HelpBubble content="Share a bit about yourself! This helps food truck owners understand their customers better." />
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself and your favorite foods..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {bio.length}/500 characters
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-orange-600" />
                Notification Preferences
                <HelpBubble content="Control how and when you receive updates about food trucks near you" />
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationOptIn}
                    onChange={(e) => setNotificationOptIn(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Enable Notifications
                    </div>
                    <div className="text-sm text-gray-600">
                      Receive updates about your favorite trucks and special offers
                    </div>
                  </div>
                </label>

                {notificationOptIn && (
                  <>
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ml-8">
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Push Notifications
                        </div>
                        <div className="text-sm text-gray-600">
                          Get instant alerts when your favorite trucks are nearby or online
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ml-8">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Email Notifications
                        </div>
                        <div className="text-sm text-gray-600">
                          Receive weekly digests and special promotions via email
                        </div>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
