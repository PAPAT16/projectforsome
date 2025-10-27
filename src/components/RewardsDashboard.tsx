import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Award, TrendingUp, Star, Flame, Target, Medal } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  requirement_value: number;
  requirement_type: string;
  points_value: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  progress: number;
  badge: Badge;
}

interface UserPoints {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  last_activity_date: string;
}

interface Contest {
  id: string;
  title: string;
  description: string;
  contest_type: string;
  start_date: string;
  end_date: string;
  prize_description: string;
  status: string;
}

interface ContestParticipant {
  score: number;
  rank: number;
  user: {
    full_name: string | null;
    email: string;
  };
}

export default function RewardsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'contests'>('overview');
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRewardsData();
    }
  }, [user, activeTab]);

  const loadRewardsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserPoints(),
        loadBadges(),
        activeTab === 'contests' && loadContests(),
        activeTab === 'overview' && loadLeaderboard(),
      ]);
    } catch (err) {
      console.error('Error loading rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPoints = async () => {
    const { data } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setUserPoints(data);
  };

  const loadBadges = async () => {
    const { data: earned } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', user!.id);

    const earnedBadgeIds = earned?.map(b => b.badge_id) || [];

    const { data: available } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', `(${earnedBadgeIds.join(',') || 'null'})`);

    setEarnedBadges(earned || []);
    setAvailableBadges(available || []);
  };

  const loadContests = async () => {
    const { data } = await supabase
      .from('contests')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    setContests(data || []);
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('user_points')
      .select(`
        total_points,
        level,
        user_id,
        profiles!user_points_user_id_fkey(full_name, email)
      `)
      .order('total_points', { ascending: false })
      .limit(10);

    setLeaderboard(data || []);
  };

  const joinContest = async (contestId: string) => {
    try {
      const { error } = await supabase
        .from('contest_participants')
        .insert({
          contest_id: contestId,
          user_id: user!.id,
          score: 0,
        });

      if (error) throw error;
      await loadContests();
      alert('Successfully joined the contest!');
    } catch (err: any) {
      console.error('Error joining contest:', err);
      if (err.message.includes('duplicate')) {
        alert('You have already joined this contest!');
      } else {
        alert('Failed to join contest');
      }
    }
  };

  const getLevelProgress = () => {
    if (!userPoints) return 0;
    const pointsInCurrentLevel = userPoints.total_points % 100;
    return (pointsInCurrentLevel / 100) * 100;
  };

  const getPointsToNextLevel = () => {
    if (!userPoints) return 100;
    return 100 - (userPoints.total_points % 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !userPoints) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading rewards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Rewards & Achievements</h2>
      </div>

      {userPoints && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{userPoints.level}</span>
            </div>
            <p className="text-yellow-100 text-sm">Level</p>
            <div className="mt-2">
              <div className="bg-yellow-400 bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>
              <p className="text-xs text-yellow-100 mt-1">{getPointsToNextLevel()} pts to next level</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{userPoints.total_points}</span>
            </div>
            <p className="text-blue-100 text-sm">Total Points</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{userPoints.current_streak}</span>
            </div>
            <p className="text-orange-100 text-sm">Current Streak</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{earnedBadges.length}</span>
            </div>
            <p className="text-purple-100 text-sm">Badges Earned</p>
          </div>
        </div>
      )}

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'badges'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Badges
        </button>
        <button
          onClick={() => setActiveTab('contests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'contests'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contests
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-bold ${index < 3 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {entry.profiles?.full_name || entry.profiles?.email || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">Level {entry.level}</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">{entry.total_points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Recent Badges
            </h3>
            <div className="space-y-3">
              {earnedBadges.slice(0, 5).map((userBadge) => (
                <div key={userBadge.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-3xl">{userBadge.badge.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userBadge.badge.name}</p>
                    <p className="text-sm text-gray-500">{userBadge.badge.description}</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">+{userBadge.badge.points_value} pts</span>
                </div>
              ))}
              {earnedBadges.length === 0 && (
                <p className="text-gray-500 text-center py-4">No badges earned yet. Start exploring food trucks!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Earned Badges ({earnedBadges.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {earnedBadges.map((userBadge) => (
                <div key={userBadge.id} className="bg-white rounded-lg border p-4 text-center hover:shadow-lg transition-shadow">
                  <span className="text-5xl mb-2 block">{userBadge.badge.icon}</span>
                  <p className="font-medium text-sm text-gray-900 mb-1">{userBadge.badge.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{userBadge.badge.description}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    +{userBadge.badge.points_value} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Available Badges ({availableBadges.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableBadges.map((badge) => (
                <div key={badge.id} className="bg-gray-50 rounded-lg border border-dashed p-4 text-center opacity-60">
                  <span className="text-5xl mb-2 block grayscale">{badge.icon}</span>
                  <p className="font-medium text-sm text-gray-700 mb-1">{badge.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                  <span className="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                    +{badge.points_value} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contests' && (
        <div className="space-y-6">
          {contests.map((contest) => (
            <div key={contest.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{contest.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contest.status)}`}>
                      {contest.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{contest.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>📅 {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}</span>
                    {contest.prize_description && (
                      <span>🏆 {contest.prize_description}</span>
                    )}
                  </div>
                </div>
                {contest.status === 'active' && (
                  <button
                    onClick={() => joinContest(contest.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors ml-4"
                  >
                    Join Contest
                  </button>
                )}
              </div>
            </div>
          ))}

          {contests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Medal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active contests at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
