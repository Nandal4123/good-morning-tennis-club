import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, X, Search } from 'lucide-react';
import { userApi } from '../lib/api';
import MemberCard from '../components/MemberCard';

function Members() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    tennisLevel: 'BEGINNER',
    goals: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userApi.create(newMember);
      setShowModal(false);
      setNewMember({ name: '', email: '', tennisLevel: 'BEGINNER', goals: '' });
      await loadMembers();
    } catch (error) {
      console.error('Failed to create member:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tennis-500 tennis-ball" />
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <Users className="text-tennis-400" />
            {t('members.title')}
          </h1>
          <p className="text-slate-400 mt-1">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {t('members.addMember')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member, i) => (
          <div key={member.id} className="stagger-item">
            <MemberCard member={member} />
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">{t('members.noMembers')}</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{t('members.addMember')}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="input"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('profile.level')}
                </label>
                <select
                  value={newMember.tennisLevel}
                  onChange={(e) => setNewMember({ ...newMember, tennisLevel: e.target.value })}
                  className="input"
                >
                  <option value="BEGINNER">{t('members.level.beginner')}</option>
                  <option value="INTERMEDIATE">{t('members.level.intermediate')}</option>
                  <option value="ADVANCED">{t('members.level.advanced')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('profile.goals')}
                </label>
                <textarea
                  value={newMember.goals}
                  onChange={(e) => setNewMember({ ...newMember, goals: e.target.value })}
                  className="input resize-none"
                  rows={3}
                  placeholder="Improve my serve..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;

