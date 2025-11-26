import { useTranslation } from 'react-i18next';
import { Trash2, Shield } from 'lucide-react';

function MemberCard({ member, onClick, onDelete, isAdmin }) {
  const { t } = useTranslation();
  
  const levelColors = {
    BEGINNER: 'bg-green-500/20 text-green-400 border-green-500/30',
    INTERMEDIATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ADVANCED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const levelLabels = {
    BEGINNER: t('members.level.beginner'),
    INTERMEDIATE: t('members.level.intermediate'),
    ADVANCED: t('members.level.advanced'),
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(member);
  };

  return (
    <div 
      className="card cursor-pointer hover:scale-[1.02] transform"
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
          member.role === 'ADMIN' 
            ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
            : 'bg-gradient-to-br from-slate-600 to-slate-700'
        }`}>
          {member.role === 'ADMIN' ? <Shield size={28} /> : member.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{member.name}</h3>
            {member.role === 'ADMIN' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {t('login.roleAdmin')}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${levelColors[member.tennisLevel]}`}>
            {levelLabels[member.tennisLevel]}
          </span>
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title={t('common.delete')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      {member.goals && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">{member.goals}</p>
      )}
    </div>
  );
}

export default MemberCard;

