import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Zap, Star, Shield, X, Check } from 'lucide-react';

interface CustomerSubscription {
  subscription_tier: 'free' | 'plus' | 'premium';
  status: string;
  billing_cycle?: string;
  price_paid?: number;
  current_period_end?: string;
}

export function CustomerPremium({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'premium'>('plus');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSubscription(data);
      } else {
        setSubscription({
          subscription_tier: 'free',
          status: 'inactive'
        });
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    plus: {
      name: 'Customer Plus',
      monthlyPrice: 4.99,
      annualPrice: 49.99,
      features: [
        'Ad-free browsing experience',
        'Priority notifications from favorite trucks',
        'Exclusive deals badge',
        '2x rewards points multiplier',
        'Save unlimited favorites',
        'Advanced search filters'
      ]
    },
    premium: {
      name: 'Customer Premium',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        'Everything in Plus',
        'Early access to new trucks',
        'VIP customer support',
        '3x rewards points multiplier',
        'Exclusive premium contests',
        'Custom notification preferences',
        'Premium profile badge',
        'Monthly surprise deals'
      ]
    }
  };

  const getPrice = (plan: 'plus' | 'premium') => {
    const price = billingCycle === 'monthly'
      ? plans[plan].monthlyPrice
      : plans[plan].annualPrice;
    return price;
  };

  const getSavings = (plan: 'plus' | 'premium') => {
    const monthly = plans[plan].monthlyPrice * 12;
    const annual = plans[plan].annualPrice;
    return ((monthly - annual) / monthly * 100).toFixed(0);
  };

  const handleSubscribe = async () => {
    alert('Stripe integration coming soon! This will redirect to Stripe checkout for payment processing.');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('user_id', user!.id);

      if (!error) {
        alert('Your subscription will be cancelled at the end of the billing period.');
        loadSubscription();
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Experience</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {subscription?.subscription_tier !== 'free' && subscription?.status === 'active' ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="text-yellow-600" size={32} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Current Plan: {plans[subscription.subscription_tier as 'plus' | 'premium'].name}
                  </h3>
                  <p className="text-gray-600">
                    {subscription.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} billing
                    {subscription.current_period_end && (
                      <span> - Renews {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <Zap className="text-orange-600" size={32} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Unlock Premium Features</h3>
                  <p className="text-gray-600">Join thousands of food truck enthusiasts with premium access</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['plus', 'premium'] as const).map((plan) => (
              <div
                key={plan}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plans[plan].name}</h3>
                  {plan === 'premium' && (
                    <Crown className="text-yellow-600" size={24} />
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(plan).toFixed(2)}
                    </span>
                    <span className="text-gray-600">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Save {getSavings(plan)}% with annual billing
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plans[plan].features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {subscription?.subscription_tier === plan && subscription?.status === 'active' ? (
                  <div className="bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center font-medium">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      handleSubscribe();
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      selectedPlan === plan
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subscription?.subscription_tier === 'free' ? 'Subscribe' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Money-Back Guarantee
            </h4>
            <p className="text-sm text-gray-600">
              Try any premium plan risk-free for 30 days. If you're not completely satisfied,
              we'll refund your money, no questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
