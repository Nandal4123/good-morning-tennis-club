import { useTranslation } from 'react-i18next';
import { Trophy, Pencil, Trash2 } from 'lucide-react';

function MatchCard({ match, isAdmin, onEdit, onDelete }) {
  const { t } = useTranslation();
  
  const date = new Date(match.date);
  const teamA = match.participants?.filter(p => p.team === 'A') || [];
  const teamB = match.participants?.filter(p => p.team === 'B') || [];
  // 1게임 1경기: 팀의 첫 번째 선수 점수를 팀 점수로 사용
  const scoreA = teamA[0]?.score || 0;
  const scoreB = teamB[0]?.score || 0;

  return (
    <div className="card group relative">
      {/* Action Buttons - Only visible for admins */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all duration-300"
            title={t('common.edit')}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-300"
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            🎾 {t('matches.type.doubles')}
          </span>
          <span className="text-sm text-slate-400">
            {date.toLocaleDateString('ko-KR')}
          </span>
          {match.creator && (
            <span className="text-xs text-slate-500">
              · 등록: {match.creator.name}
            </span>
          )}
        </div>
        {/* 관리자 버튼 공간 확보 */}
        {isAdmin && <div className="w-24" />}
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
