import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, X, Search, Trash2, HelpCircle } from 'lucide-react';
import { userApi } from '../lib/api';
import MemberCard from '../components/MemberCard';

// NTRP 등급 목록
const NTRP_LEVELS = [
  "NTRP_2_0",
  "NTRP_2_5",
  "NTRP_3_0",
  "NTRP_3_5",
  "NTRP_4_0",
  "NTRP_4_5",
  "NTRP_5_0",
];

function Members({ currentUser }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNtrpGuide, setShowNtrpGuide] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    tennisLevel: 'NTRP_3_0',
    goals: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 관리자 여부 확인
  const isAdmin = currentUser?.role === 'ADMIN';

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
      setNewMember({ name: '', email: '', tennisLevel: 'NTRP_3_0', goals: '' });
      await loadMembers();
    } catch (error) {
      console.error('Failed to create member:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleDeleteMember = async () => {
    try {
      setDeleting(true);
      await userApi.delete(selectedMember.id);
      setShowDeleteModal(false);
      setSelectedMember(null);
      await loadMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert(error.message);
    } finally {
      setDeleting(false);
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
          <p className="text-slate-400 mt-1">{members.length} {t('members.memberCount')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {t('members.addMember')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          placeholder={t('members.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member, i) => (
          <div key={member.id} className="stagger-item">
            <MemberCard 
              member={member} 
              isAdmin={isAdmin}
              onDelete={handleDeleteClick}
            />
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
                  placeholder="홍길동"
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
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-400">
                    {t('profile.level')} (NTRP)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNtrpGuide(true)}
                    className="flex items-center gap-1 text-xs text-tennis-400 hover:text-tennis-300 transition-colors"
                  >
                    <HelpCircle size={14} />
                    {t('members.ntrpGuide')}
                  </button>
                </div>
                <select
                  value={newMember.tennisLevel}
                  onChange={(e) => setNewMember({ ...newMember, tennisLevel: e.target.value })}
                  className="input"
                >
                  {NTRP_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      NTRP {t(`members.level.${level.toLowerCase()}`)}
                    </option>
                  ))}
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
                  placeholder="서브 실력 향상..."
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

      {/* Delete Member Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="text-red-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t('members.deleteMember')}</h2>
              <p className="text-slate-400 mb-6">
                {t('members.deleteConfirm')}
              </p>
              
              {/* Member Preview */}
              <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg font-bold text-white">
                    {selectedMember.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedMember.name}</p>
                    <p className="text-sm text-slate-400">{selectedMember.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedMember(null); }}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  {deleting ? t('common.loading') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NTRP Guide Modal */}
      {showNtrpGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎾 {t("members.ntrpGuide")}
              </h2>
              <button
                onClick={() => setShowNtrpGuide(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {NTRP_LEVELS.map((level) => {
                const displayLevel = level.replace("NTRP_", "").replace("_", ".");
                return (
                  <div
                    key={level}
                    className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-tennis-500/20 text-tennis-400 border border-tennis-500/30">
                        {displayLevel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {t(`members.ntrpDescription.${level.toLowerCase()}`)}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowNtrpGuide(false)}
              className="btn-primary w-full mt-6"
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;

