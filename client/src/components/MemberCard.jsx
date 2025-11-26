import { useTranslation } from 'react-i18next';

function MemberCard({ member, onClick }) {
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

  return (
    <div 
      className="card cursor-pointer hover:scale-[1.02] transform"
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-2xl font-bold text-white">
          {member.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{member.name}</h3>
          <p className="text-sm text-slate-400 truncate">{member.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${levelColors[member.tennisLevel]}`}>
          {levelLabels[member.tennisLevel]}
        </span>
      </div>
      {member.goals && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">{member.goals}</p>
      )}
    </div>
  );
}

export default MemberCard;

