import { useTranslation } from 'react-i18next';
import { Trophy, Pencil, Trash2 } from 'lucide-react';

function MatchCard({ match, isAdmin, onEdit, onDelete }) {
  const { t } = useTranslation();
  
  const date = new Date(match.date);
  const teamA = match.participants?.filter(p => p.team === 'A') || [];
  const teamB = match.participants?.filter(p => p.team === 'B') || [];
  const scoreA = teamA.reduce((sum, p) => sum + p.score, 0);
  const scoreB = teamB.reduce((sum, p) => sum + p.score, 0);

  return (
    <div className="card group relative">
      {/* Action Buttons - Only visible for admins */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-2 rounded-lg bg-slate-700/80 text-slate-400 hover:text-tennis-400 hover:bg-slate-700 transition-all duration-300"
            title={t('common.edit')}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 rounded-lg bg-slate-700/80 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all duration-300"
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          🎾 {t('matches.type.doubles')}
        </span>
        <span className={`text-sm text-slate-400 transition-all duration-300 ${isAdmin ? 'mr-16 group-hover:mr-0' : ''}`}>
          {date.toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-2">{t('matches.team.a')}</p>
          <div className="space-y-1">
            {teamA.map((p) => (
              <p key={p.id} className="text-sm text-white font-medium">
                {p.user?.name}
              </p>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 px-6">
          <span className={`text-3xl font-bold font-display ${
            scoreA > scoreB ? 'text-tennis-400' : 'text-slate-400'
          }`}>
            {scoreA}
          </span>
          <span className="text-slate-600">:</span>
          <span className={`text-3xl font-bold font-display ${
            scoreB > scoreA ? 'text-tennis-400' : 'text-slate-400'
          }`}>
            {scoreB}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1 text-right">
          <p className="text-xs text-slate-500 mb-2">{t('matches.team.b')}</p>
          <div className="space-y-1">
            {teamB.map((p) => (
              <p key={p.id} className="text-sm text-white font-medium">
                {p.user?.name}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Winner indicator */}
      {scoreA !== scoreB && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2 text-tennis-400">
          <Trophy size={16} />
          <span className="text-sm font-medium">
            {scoreA > scoreB ? teamA.map(p => p.user?.name).join(' & ') : teamB.map(p => p.user?.name).join(' & ')}
          </span>
        </div>
      )}
    </div>
  );
}

export default MatchCard;
