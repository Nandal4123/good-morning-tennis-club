import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Save, BarChart3 } from 'lucide-react';
import { userApi } from '../lib/api';
import StatCard from '../components/StatCard';
import { CalendarCheck, Trophy, TrendingUp, Award } from 'lucide-react';

function Profile({ currentUser, onUpdate }) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    tennisLevel: currentUser?.tennisLevel || 'BEGINNER',
    goals: currentUser?.goals || '',
    languagePref: currentUser?.languagePref || 'en'
  });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [currentUser]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await userApi.getStats(currentUser.id);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await userApi.update(currentUser.id, profile);
      
      // Update i18n language
      i18n.changeLanguage(profile.languagePref);
      
      // Update parent state
      onUpdate(updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setProfile({ ...profile, languagePref: lang });
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
          <User className="text-tennis-400" />
          {t('profile.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">{t('profile.edit')}</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t('profile.name')}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t('profile.email')}
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t('profile.level')}
                  </label>
                  <select
                    value={profile.tennisLevel}
                    onChange={(e) => setProfile({ ...profile, tennisLevel: e.target.value })}
                    className="input"
                  >
                    <option value="BEGINNER">{t('members.level.beginner')}</option>
                    <option value="INTERMEDIATE">{t('members.level.intermediate')}</option>
                    <option value="ADVANCED">{t('members.level.advanced')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t('profile.language')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('en')}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 ${
                        profile.languagePref === 'en'
                          ? 'bg-tennis-500/20 border-tennis-500/50 text-tennis-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('ko')}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 ${
                        profile.languagePref === 'ko'
                          ? 'bg-tennis-500/20 border-tennis-500/50 text-tennis-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      🇰🇷 한국어
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('profile.goals')}
                </label>
                <textarea
                  value={profile.goals}
                  onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                  className="input resize-none"
                  rows={4}
                  placeholder="Improve my serve, better footwork..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={20} />
                {saving ? t('common.loading') : t('profile.save')}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-tennis-400" />
            {t('profile.stats')}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto border-2 border-tennis-500/30 border-t-tennis-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-tennis-500/10 border border-tennis-500/30">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="text-tennis-400" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-white font-display">{stats?.totalAttendance || 0}</p>
                    <p className="text-sm text-slate-400">총 출석</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <Trophy className="text-blue-400" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-white font-display">{stats?.totalMatches || 0}</p>
                    <p className="text-sm text-slate-400">총 경기 수</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <Award className="text-purple-400" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-white font-display">{stats?.wins || 0}</p>
                    <p className="text-sm text-slate-400">승리</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-orange-400" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-white font-display">{stats?.attendanceRate || 0}%</p>
                    <p className="text-sm text-slate-400">출석률</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

