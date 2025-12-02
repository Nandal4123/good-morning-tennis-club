import { useTranslation } from "react-i18next";
import { Trash2, Shield, Swords, Crown } from "lucide-react";

// OWNER 이메일 (절대 권한자)
const OWNER_EMAIL = "nandal4123@gmail.com";

function MemberCard({
  member,
  currentUser,
  onClick,
  onDelete,
  onHeadToHead,
  isAdmin,
}) {
  const { t } = useTranslation();

  // NTRP 등급을 표시용 문자열로 변환
  const formatNtrpLevel = (level) => {
    if (!level) return "-";
    return level.replace("NTRP_", "").replace("_", ".");
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(member);
  };

  const handleHeadToHead = (e) => {
    e.stopPropagation();
    onHeadToHead?.(member);
  };

  const isCurrentUser = currentUser?.id === member.id;
  const isOwnerMember = member.email === OWNER_EMAIL;

  return (
    <div
      className="card cursor-pointer hover:scale-[1.02] transform"
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
            isOwnerMember
              ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
              : member.role === "ADMIN"
              ? "bg-gradient-to-br from-orange-500 to-orange-600"
              : isCurrentUser
              ? "bg-gradient-to-br from-tennis-500 to-tennis-600"
              : "bg-gradient-to-br from-slate-600 to-slate-700"
          }`}
        >
          {isOwnerMember ? (
            <Crown size={28} />
          ) : member.role === "ADMIN" ? (
            <Shield size={28} />
          ) : (
            member.name?.charAt(0) || "?"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{member.name}</h3>
            {isCurrentUser && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-tennis-500/20 text-tennis-400 border border-tennis-500/30">
                나
              </span>
            )}
            {isOwnerMember ? (
              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                <Crown size={10} />
                소유자
              </span>
            ) : member.role === "ADMIN" && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {t("login.roleAdmin")}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium border bg-tennis-500/20 text-tennis-400 border-tennis-500/30">
            {formatNtrpLevel(member.tennisLevel)}
          </span>
          {!isCurrentUser && (
            <button
              onClick={handleHeadToHead}
              className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
              title="상대전적 보기"
            >
              <Swords size={18} />
            </button>
          )}
          {isAdmin && !isOwnerMember && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title={t("common.delete")}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      {member.goals && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">
          {member.goals}
        </p>
      )}
    </div>
  );
}

export default MemberCard;
