import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Users, CheckCircle, XCircle, Clock, TrendingUp, Settings } from 'lucide-react';
import AdminAffiliateSettings from './AdminAffiliateSettings';

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
  user?: {
    full_name: string | null;
    email: string;
  };
}

interface Referral {
  id: string;
  affiliate_id: string;
  food_truck_id: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  commission_amount: number;
  created_at: string;
  food_truck?: {
    truck_name: string;
  };
  affiliate?: {
    affiliate_code: string;
    user?: {
      full_name: string | null;
      email: string;
    };
  };
}

export default function AdminAffiliates() {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'referrals' | 'settings'>('affiliates');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalReferrals: 0,
    totalPaid: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAffiliates(),
        loadReferrals(),
        loadStats(),
      ]);
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliates = async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        user:profiles!affiliates_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading affiliates:', error);
      return;
    }
    setAffiliates(data || []);
  };

  const loadReferrals = async () => {
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        food_truck:food_trucks(truck_name),
        affiliate:affiliates(
          affiliate_code,
          user:profiles!affiliates_user_id_fkey(full_name, email)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading referrals:', error);
      return;
    }
    setReferrals(data || []);
  };

  const loadStats = async () => {
    const { data: affiliatesData } = await supabase
      .from('affiliates')
      .select('status, total_earnings, pending_earnings, paid_earnings, total_referrals');

    if (affiliatesData) {
      setStats({
        totalAffiliates: affiliatesData.length,
        activeAffiliates: affiliatesData.filter(a => a.status === 'active').length,
        totalReferrals: affiliatesData.reduce((sum, a) => sum + (a.total_referrals || 0), 0),
        totalPaid: affiliatesData.reduce((sum, a) => sum + (Number(a.paid_earnings) || 0), 0),
        pendingPayments: affiliatesData.reduce((sum, a) => sum + (Number(a.pending_earnings) || 0), 0),
      });
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', affiliateId);

      if (error) throw error;
      await loadAffiliates();
    } catch (err) {
      console.error('Error updating affiliate:', err);
      alert('Failed to update affiliate status');
    }
  };

  const updateReferralStatus = async (referralId: string, status: 'approved' | 'paid' | 'rejected') => {
    try {
      const updateData: any = { status };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('affiliate_referrals')
        .update(updateData)
        .eq('id', referralId);

      if (error) throw error;
      await loadReferrals();
      await loadAffiliates();
      await loadStats();
    } catch (err) {
      console.error('Error updating referral:', err);
      alert('Failed to update referral status');
    }
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Affiliates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAffiliates}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeAffiliates}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">${stats.pendingPayments.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalPaid.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('affiliates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'affiliates'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Affiliates
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'referrals'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Referrals
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="inline w-5 h-5 mr-2" />
          Settings
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTab === 'affiliates' && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {affiliate.user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">{affiliate.user?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{affiliate.affiliate_code}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(affiliate.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {affiliate.commission_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {affiliate.total_referrals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${Number(affiliate.pending_earnings).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${Number(affiliate.paid_earnings).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {affiliate.status === 'pending' && (
                            <button
                              onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                              className="text-green-600 hover:text-green-800"
                            >
                              Approve
                            </button>
                          )}
                          {affiliate.status === 'active' && (
                            <button
                              onClick={() => updateAffiliateStatus(affiliate.id, 'suspended')}
                              className="text-red-600 hover:text-red-800"
                            >
                              Suspend
                            </button>
                          )}
                          {affiliate.status === 'suspended' && (
                            <button
                              onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                              className="text-green-600 hover:text-green-800"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Food Truck</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {referral.affiliate?.user?.full_name || 'Unknown'}
                          </div>
                          <code className="text-xs text-gray-500">{referral.affiliate?.affiliate_code}</code>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.food_truck?.truck_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${Number(referral.commission_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {referral.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateReferralStatus(referral.id, 'approved')}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateReferralStatus(referral.id, 'rejected')}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {referral.status === 'approved' && (
                            <button
                              onClick={() => updateReferralStatus(referral.id, 'paid')}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <AdminAffiliateSettings />
          )}
        </>
      )}
    </div>
  );
}
