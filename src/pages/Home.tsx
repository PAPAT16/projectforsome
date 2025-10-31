import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';

export function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Food Truck Live
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover amazing food trucks near you or manage your own food truck business with our powerful platform.
        </p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={() => {
              setAuthMode('signin');
              setShowAuthModal(true);
            }}
            className="bg-white hover:bg-gray-100 text-orange-500 font-bold py-3 px-8 rounded-full text-lg border-2 border-orange-500 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Find Food Trucks',
              description: 'Discover the best food trucks in your area with real-time locations and menus.',
              icon: '🚚',
            },
            {
              title: 'Easy Management',
              description: 'Manage your food truck business with our powerful tools and analytics.',
              icon: '📊',
            },
            {
              title: 'Fast Ordering',
              description: 'Skip the line and order ahead from your favorite food trucks.',
              icon: '⚡',
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}

export default Home;
