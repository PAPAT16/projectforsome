import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CustomerDashboard } from '../components/CustomerDashboard';
import { OwnerDashboard } from '../components/OwnerDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { UserProfile } from '../components/UserProfile';
import { AuthModal } from '../components/AuthModal';
import { SeedButton } from '../components/SeedButton';
import { AnnouncementTicker } from '../components/AnnouncementTicker';
import { LogOut, User, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const { user, profile, loading } = useAuth();
  
  // Debug logs
  console.log('Dashboard rendered with:', { user, profile, loading });
  
  React.useEffect(() => {
    console.log('Auth state changed:', { user, profile, loading });
  }, [user, profile, loading]);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Food Truck Live...</p>
        </div>
      </div>
    );
  }

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // The AuthProvider will handle the state updates
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderDashboard = () => {
    if (profile?.role === 'admin') {
      return <AdminDashboard />;
    }
    if (profile?.role === 'food_truck_owner') {
      return <OwnerDashboard />;
    }
    return <CustomerDashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementTicker />

      <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold flex items-center gap-2">
                <img src="/1 (7).png" alt="Food Truck Live Logo" className="h-12 w-12 object-contain" />
                <span>Food Truck Live</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign In / Sign Up
                </button>
              )}

              {user && (
                <>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Welcome back!</p>
                    <p className="font-semibold">{profile?.full_name || user.email}</p>
                  </div>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors overflow-hidden"
                  >
                    {profile?.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="p-2">
                        <User size={24} />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-white border-opacity-20 pt-4">
              {!user && (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign In / Sign Up
                </button>
              )}

              {user && (
                <div className="space-y-2">
                  <div className="text-center py-2 flex flex-col items-center gap-2">
                    {profile?.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                        <User size={32} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm opacity-90">Welcome back!</p>
                      <p className="font-semibold">{profile?.full_name || user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main>
        {renderDashboard()}
      </main>

      {showProfile && user && <UserProfile onClose={() => setShowProfile(false)} />}
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}

      <SeedButton />
    </div>
  );
}