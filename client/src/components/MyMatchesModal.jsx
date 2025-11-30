import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trophy, Calendar } from 'lucide-react';
import { matchApi } from '../lib/api';

function MyMatchesModal({ userId, onClose }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyMatches();
  }, [userId]);

  const loadMyMatches = async () => {
    try {
      setLoading(true);
      const allMatches = await matchApi.getAll();
      
      // 내가 참여한 경기만 필터링
      const myMatches = allMatches.filter(match => 
        match.participants?.some(p => p.userId === userId)
      );
      
      setMatches(myMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMyTeam = (match) => {
    const myParticipant = match.participants?.find(p => p.userId === userId);
    return myParticipant?.team;
  };

  const getMatchResult = (match) => {
    const myTeam = getMyTeam(match);
    if (!myTeam) return null;

    const myTeamScore = Math.max(
      ...match.participants.filter(p => p.team === myTeam).map(p => p.score || 0)
    );
    const opponentScore = Math.max(
      ...match.participants.filter(p => p.team !== myTeam).map(p => p.score || 0)
    );

    if (myTeamScore > opponentScore) return 'WIN';
    if (myTeamScore < opponentScore) return 'LOSS';
    return 'DRAW';
  };

  const getTeamMembers = (match, team) => {
    return match.participants
      ?.filter(p => p.team === team)
      .map(p => p.user?.name)
      .join(', ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-blue-400" size={24} />
            내 경기 기록
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        {/* 경기 목록 */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              참여한 경기가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map(match => {
                const result = getMatchResult(match);
                const myTeam = getMyTeam(match);
                const opponentTeam = myTeam === 'A' ? 'B' : 'A';
                
                const myTeamScore = Math.max(
                  ...match.participants.filter(p => p.team === myTeam).map(p => p.score || 0)
                );
                const opponentScore = Math.max(
                  ...match.participants.filter(p => p.team !== myTeam).map(p => p.score || 0)
                );

                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-xl border ${
                      result === 'WIN'
                        ? 'bg-green-500/10 border-green-500/30'
                        : result === 'LOSS'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}
                  >
                    {/* 날짜와 결과 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar size={14} />
                        {formatDate(match.date)}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          result === 'WIN'
                            ? 'bg-green-500/20 text-green-400'
                            : result === 'LOSS'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-600/20 text-slate-400'
                        }`}
                      >
                        {result === 'WIN' ? '승리' : result === 'LOSS' ? '패배' : '무승부'}
                      </span>
                    </div>

                    {/* 스코어 */}
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-xs text-slate-400 mb-1">내 팀</p>
                        <p className="text-sm text-white">{getTeamMembers(match, myTeam)}</p>
                      </div>
                      <div className="px-4">
                        <span className={`text-2xl font-bold ${result === 'WIN' ? 'text-green-400' : 'text-white'}`}>
                          {myTeamScore}
                        </span>
                        <span className="text-slate-500 mx-2">:</span>
                        <span className={`text-2xl font-bold ${result === 'LOSS' ? 'text-red-400' : 'text-white'}`}>
                          {opponentScore}
                        </span>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-slate-400 mb-1">상대 팀</p>
                        <p className="text-sm text-white">{getTeamMembers(match, opponentTeam)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-lg font-bold text-white">{matches.length}</p>
              <p className="text-xs text-slate-400">총 경기</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-400">
                {matches.filter(m => getMatchResult(m) === 'WIN').length}
              </p>
              <p className="text-xs text-slate-400">승리</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">
                {matches.filter(m => getMatchResult(m) === 'LOSS').length}
              </p>
              <p className="text-xs text-slate-400">패배</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyMatchesModal;

