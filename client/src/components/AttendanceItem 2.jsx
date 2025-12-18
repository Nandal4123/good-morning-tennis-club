import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

function AttendanceItem({ attendance, showUser = true }) {
  const { t } = useTranslation();
  
  const isAttended = attendance.status === 'ATTENDED';
  const date = new Date(attendance.date);
  
  const formatDate = (d) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return t('common.today');
    } else if (d.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday');
    }
    return d.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isAttended ? 'bg-tennis-500/20' : 'bg-red-500/20'
        }`}>
          {isAttended ? (
            <Check size={16} className="text-tennis-400" />
          ) : (
            <X size={16} className="text-red-400" />
          )}
        </div>
        <div>
          {showUser && (
            <p className="font-medium text-white">{attendance.user?.name}</p>
          )}
          <p className="text-sm text-slate-400">{formatDate(date)}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        isAttended 
          ? 'bg-tennis-500/20 text-tennis-400' 
          : 'bg-red-500/20 text-red-400'
      }`}>
        {isAttended ? t('attendance.status.attended') : t('attendance.status.absent')}
      </span>
    </div>
  );
}

export default AttendanceItem;

