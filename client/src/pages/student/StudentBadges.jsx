import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetMyBadges } from '../../api';
import { Trophy, Star, Zap, BookOpen, Crown, Flame } from 'lucide-react';

const LEVELS = [
  { level: 1, label: 'Novice', min: 0, icon: Trophy },
  { level: 2, label: 'Rising Star', min: 100, icon: Zap },
  { level: 3, label: 'Elite Scholar', min: 300, icon: Star },
  { level: 4, label: 'Grand Master', min: 700, icon: Crown },
];

const XP_RULES = { badge: 50, dailyLogin: 10 };

const getLevelData = (xp) => {
  let current = LEVELS[0];
  let next = null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }

  const progress = next
    ? ((xp - current.min) / (next.min - current.min)) * 100
    : 100;

  return { current, next, progress };
};

const ProgressRing = ({ progress }) => {
  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <svg width="120" height="120" className="-rotate-90 transition-all duration-700 ease-out">
      <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
      <circle
        cx="60"
        cy="60"
        r={r}
        stroke="#6366f1"
        strokeWidth="8"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

const StudentBadges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak] = useState(3);

  useEffect(() => {
    apiGetMyBadges()
      .then((res) => setBadges(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const xp = badges.length * XP_RULES.badge + streak * XP_RULES.dailyLogin;
  const { current, next, progress } = getLevelData(xp);
  const Icon = current.icon;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-200/20 blur-3xl rounded-full"></div>

        <div className="max-w-7xl mx-auto px-6 py-6 animate-[fade-in_0.6s_ease-out]">
          <PageHeader title="Gamified Dashboard" subtitle="Earn XP, maintain streaks, unlock achievements" />

          <div className="grid md:grid-cols-3 gap-6 mb-8">

            {/* Level Card */}
            <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative">
                <ProgressRing progress={progress} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon size={26} className="text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Level {current.level}</p>
                <h2 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                  {current.label}
                </h2>
                <p className="text-xs text-gray-400">{xp} XP</p>
                {next && (
                  <p className="text-xs text-gray-400 mt-1">
                    {next.min - xp} XP to {next.label}
                  </p>
                )}
              </div>
            </div>

            {/* Streak */}
            <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div>
                <p className="text-sm text-gray-500">Daily Streak</p>
                <h2 className="text-xl font-bold">{streak} days</h2>
                <p className="text-xs text-gray-400">+{XP_RULES.dailyLogin} XP/day</p>
              </div>
              <Flame className="text-orange-500 animate-pulse" />
            </div>

            {/* Achievements */}
            <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-sm text-gray-500">Achievements</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>🏆 First Badge</li>
                <li>🔥 3-Day Streak</li>
                <li>⭐ 5 Badges Earned</li>
              </ul>
            </div>
          </div>

          {badges.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-10 text-center shadow-sm">
              <Trophy className="mx-auto text-gray-300" size={40} />
              <h3 className="mt-4 font-semibold">No progress yet</h3>
              <p className="text-sm text-gray-500">Start learning to earn XP</p>
              <a href="/student/browse" className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-500 transition">
                <BookOpen size={16} /> Browse
              </a>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((b) => (
                <div
                  key={b._id}
                  className="group border border-gray-200 rounded-2xl p-5 bg-white/80 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-between mb-2">
                    <Star size={16} className="text-gray-600 group-hover:rotate-6 transition-transform" />
                    <span className="text-xs text-gray-400">
                      {new Date(b.earnedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    {b.badgeId?.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {b.badgeId?.description}
                  </p>
                  <p className="text-xs mt-2 text-indigo-500 font-semibold group-hover:translate-x-1 transition">
                    +{XP_RULES.badge} XP
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentBadges;