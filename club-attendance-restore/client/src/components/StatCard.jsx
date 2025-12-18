function StatCard({ icon: Icon, label, value, trend, color = 'tennis' }) {
  const colorClasses = {
    tennis: 'from-tennis-500 to-tennis-600 text-tennis-400',
    blue: 'from-blue-500 to-blue-600 text-blue-400',
    purple: 'from-purple-500 to-purple-600 text-purple-400',
    orange: 'from-orange-500 to-orange-600 text-orange-400',
  };

  return (
    <div className="card group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-tennis-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-white font-display">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default StatCard;

