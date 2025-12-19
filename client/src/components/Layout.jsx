import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  Trophy, 
  User, 
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { clubApi } from '../lib/api';
import { getClubIdentifier } from '../lib/clubContext';

// 클럽 식별자를 사람이 읽을 수 있는 이름으로 변환
function humanizeClubIdentifier(subdomain) {
  if (!subdomain || subdomain === 'default') return null;
  return subdomain
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Layout({ children, currentUser, onLogout }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clubInfo, setClubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL에서 클럽 파라미터 읽기 (로딩 중 임시 표시용)
  const getClubNameFromURL = () => {
    const urlParams = new URLSearchParams(location.search);
    const clubParam = urlParams.get('club');
    if (clubParam) {
      return humanizeClubIdentifier(clubParam);
    }
    // URL 파라미터가 없으면 getClubIdentifier() 사용
    const clubIdentifier = getClubIdentifier();
    if (clubIdentifier && clubIdentifier !== 'default') {
      return humanizeClubIdentifier(clubIdentifier);
    }
    return null;
  };

  // URL 파라미터 변경 감지하여 클럽 정보 재로드
  // Owner 대시보드는 모든 클럽을 관리하므로 클럽 정보를 로드하지 않음
  useEffect(() => {
    if (location.pathname === '/owner') {
      setClubInfo({ name: 'Owner Dashboard', subdomain: null });
      setLoading(false);
      return;
    }
    
    // 로딩 시작
    setLoading(true);
    loadClubInfo();
  }, [location.search, location.pathname]);

  const loadClubInfo = async () => {
    try {
      const info = await clubApi.getInfo();
      setClubInfo(info);
    } catch (error) {
      console.error("Failed to load club info:", error);
      // 에러 발생 시 URL에서 읽은 값 사용
      const urlClubName = getClubNameFromURL();
      setClubInfo({ 
        name: urlClubName || t('app.title'), 
        subdomain: 'default' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 표시할 클럽 이름 결정
  const displayClubName = () => {
    if (clubInfo?.name) {
      return clubInfo.name;
    }
    // 로딩 중이거나 clubInfo가 없을 때 URL에서 읽은 값 사용
    const urlClubName = getClubNameFromURL();
    if (urlClubName) {
      return urlClubName;
    }
    // 모두 없으면 기본값
    return t('app.title');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/attendance', icon: ClipboardCheck, label: t('nav.attendance') },
    { to: '/members', icon: Users, label: t('nav.members') },
    { to: '/matches', icon: Trophy, label: t('nav.matches') },
    { to: '/profile', icon: User, label: t('nav.profile') },
    ...(currentUser?.isOwner
      ? [{ to: '/owner', icon: Shield, label: 'Owner' }]
      : []),
  ];

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      // 멀티테넌트(localhost)에서 ?club=... 쿼리스트링이 탭 이동 시 사라지면
      // 기본 클럽으로 인식되어 자동 로그아웃되는 문제가 생김 → 현재 search를 그대로 유지
      to={{ pathname: to, search: location.search }}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          isActive
            ? 'bg-tennis-500/20 text-tennis-400 border border-tennis-500/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-slate-700/50 p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tennis-400 to-tennis-600 flex items-center justify-center">
            <span className="text-xl">🎾</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white">
              {loading ? (
                <span className="inline-block w-32 h-5 bg-slate-700 rounded animate-pulse" />
              ) : (
                displayClubName()
              )}
            </h1>
            <p className="text-xs text-slate-500">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <span className="text-lg">{currentUser?.name?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tennis-400 to-tennis-600 flex items-center justify-center">
              <span className="text-sm">🎾</span>
            </div>
            <h1 className="font-display font-bold text-white">
              {loading ? (
                <span className="inline-block w-24 h-5 bg-slate-700 rounded animate-pulse" />
              ) : (
                displayClubName()
              )}
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-4 animate-slide-up">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut size={20} />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto court-pattern">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;

