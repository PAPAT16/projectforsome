import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Award, DollarSign, Users, Copy, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: 'pending' | 'active' | 'suspended';
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  created_at: string;
}

interface Referral {
  id: string;
  food_truck_id: string;
  status: string;
  commission_amount: number;
  created_at: string;
  food_truck?: {
    truck_name: string;
  };
}

export default function AffiliatePortal() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (affiliateData) {
        setAffiliate(affiliateData);
        await loadReferrals(affiliateData.id);
      } else {
        setShowSignup(true);
      }
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async (affiliateId: string) => {
    const { data } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        food_truck:food_trucks(truck_name)
      `)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (data) {
      setReferrals(data);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);

      const { data: codeData } = await supabase
        .rpc('generate_affiliate_code');

      if (!codeData) {
        throw new Error('Failed to generate affiliate code');
      }

      const { error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user!.id,
          affiliate_code: codeData,
          status: 'pending',
          commission_rate: 10.00,
        });

      if (error) throw error;

      await loadAffiliateData();
      setShowSignup(false);
    } catch (err: any) {
      console.error('Error signing up for affiliate program:', err);
      alert(err.message || 'Failed to sign up for affiliate program');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}?ref=${affiliate?.affiliate_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (showSignup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Affiliate Program</h1>
            <p className="text-gray-600">
              Earn commission by referring food trucks to Food Truck Live
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">How It Works</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Sign up for the affiliate program</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Get your unique referral link</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Share your link with food truck owners</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Earn 10% commission when they sign up</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Benefits</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>Earn 10% commission on each referral</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Track all your referrals in one place</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Monthly payouts for approved referrals</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {loading ? 'Signing Up...' : 'Join Affiliate Program'}
          </button>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
            {getStatusBadge(affiliate.status)}
          </div>

          {affiliate.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Your affiliate application is pending review. You'll be notified once approved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{affiliate.total_referrals}</span>
              </div>
              <p className="text-green-100 text-sm">Total Referrals</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">${Number(affiliate.total_earnings).toFixed(2)}</span>
              </div>
              <p className="text-blue-100 text-sm">Total Earnings</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">${Number(affiliate.pending_earnings).toFixed(2)}</span>
              </div>
              <p className="text-yellow-100 text-sm">Pending Earnings</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">${Number(affiliate.paid_earnings).toFixed(2)}</span>
              </div>
              <p className="text-purple-100 text-sm">Paid Out</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referral Link</h2>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Referral Code</p>
                  <code className="text-lg font-bold text-green-600">{affiliate.affiliate_code}</code>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Commission Rate</p>
                  <p className="text-lg font-bold text-gray-900">{affiliate.commission_rate}%</p>
                </div>
              </div>
            </div>
            <button
              onClick={copyReferralLink}
              className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Your Referrals</h2>
          </div>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No referrals yet. Start sharing your link!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Food Truck</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {referral.food_truck?.truck_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(referral.commission_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(referral.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
