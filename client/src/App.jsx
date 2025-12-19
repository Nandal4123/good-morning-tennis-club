import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Members from "./pages/Members";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import OwnerDashboard from "./pages/OwnerDashboard";
import InstallPrompt from "./components/InstallPrompt";
import LoadingScreen from "./components/LoadingScreen";
import { clubApi } from "./lib/api";

function AppContent() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentClubInfo, setCurrentClubInfo] = useState(null);
  const [clubInfoLoading, setClubInfoLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("clubUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("clubUser");
      }
    }
    setLoading(false);
  }, []);

  // 현재 클럽 정보 로드 및 쿼리 파라미터 유지
  // Owner 대시보드는 모든 클럽을 관리하므로 클럽 정보를 로드하지 않음
  useEffect(() => {
    if (location.pathname === "/owner") {
      setClubInfoLoading(false);
      setCurrentClubInfo(null);
      return;
    }

    const loadClubInfo = async () => {
      try {
        setClubInfoLoading(true);

        // URL 파라미터 확인
        const urlParams = new URLSearchParams(location.search);
        const clubParam = urlParams.get("club");
        console.log("[App] 클럽 정보 로드 시작:", {
          pathname: location.pathname,
          search: location.search,
          clubParam,
        });

        const info = await clubApi.getInfo();
        setCurrentClubInfo(info);
        console.log("[App] ✅ 클럽 정보 로드 완료:", {
          name: info.name,
          subdomain: info.subdomain,
          id: info.id,
          expectedClub: clubParam,
          match: clubParam === info.subdomain,
        });

        // 클럽 불일치 경고
        if (clubParam && clubParam !== info.subdomain) {
          console.warn("[App] ⚠️ 클럽 불일치 감지:", {
            expected: clubParam,
            actual: info.subdomain,
          });
        }

        // 멀티테넌트 모드이고 URL에 클럽 파라미터가 없으면 추가
        // 이렇게 하면 URL과 화면이 항상 일치함
        if (info.subdomain && info.subdomain !== 'default') {
          const currentUrlParams = new URLSearchParams(window.location.search);
          if (!currentUrlParams.has('club')) {
            const newSearch = `?club=${encodeURIComponent(info.subdomain)}`;
            console.log("[App] 🔧 URL에 클럽 파라미터 추가:", newSearch);
            // replace를 사용하여 히스토리에 추가하지 않음 (뒤로가기 방지)
            window.history.replaceState(
              {},
              '',
              `${location.pathname}${newSearch}`
            );
          }
        }
      } catch (error) {
        console.error("[App] ❌ 클럽 정보 로드 실패:", error);
        // 기본값 설정하지 않음 (에러 상태 유지)
      } finally {
        setClubInfoLoading(false);
      }
    };
    loadClubInfo();
  }, [location.search, location.pathname]);

  // URL 파라미터 변경 시 클럽 확인 및 사용자 검증
  useEffect(() => {
    // Owner 대시보드에서는 클럽 검증하지 않음
    if (location.pathname === "/owner") {
      return;
    }

    // 클럽 정보가 로드되지 않았으면 검증하지 않음
    if (clubInfoLoading || !currentClubInfo) {
      return;
    }

    if (currentUser) {
      // Owner는 멀티클럽 운영을 위해 클럽 불일치로 로그아웃시키지 않음
      if (currentUser.isOwner) {
        return;
      }

      const userClubId = currentUser.clubId;
      const currentClubId = currentClubInfo.id;

      // 사용자의 클럽과 현재 클럽이 다르면 로그아웃
      if (userClubId && currentClubId && userClubId !== currentClubId) {
        console.log("[App] ⚠️ 클럽 불일치 감지, 로그아웃 처리");
        console.log(`  사용자 클럽 ID: ${userClubId}`);
        console.log(`  현재 클럽 ID: ${currentClubId}`);
        console.log(`  현재 클럽 이름: ${currentClubInfo.name}`);
        setCurrentUser(null);
        localStorage.removeItem("clubUser");
      } else if (userClubId && currentClubId && userClubId === currentClubId) {
        console.log("[App] ✅ 클럽 일치 확인:", currentClubInfo.name);
      } else {
        console.log("[App] ⚠️ 클럽 정보 불완전:", {
          userClubId: !!userClubId,
          currentClubId: !!currentClubId,
        });
      }
    }
  }, [currentClubInfo, currentUser, clubInfoLoading]);

  const handleLogin = async (user) => {
    // 로그인 시 현재 클럽 정보도 함께 저장
    try {
      const clubInfo = await clubApi.getInfo();
      const userWithClub = {
        ...user,
        currentClubId: clubInfo.id, // 현재 클럽 ID 저장
      };
      setCurrentUser(userWithClub);
      localStorage.setItem("clubUser", JSON.stringify(userWithClub));
      console.log("[App] 로그인 완료:", {
        userName: user.name,
        userClubId: user.clubId,
        currentClubId: clubInfo.id,
        clubName: clubInfo.name,
      });
    } catch (error) {
      console.error("Failed to load club info during login:", error);
      // 클럽 정보 로드 실패해도 로그인은 진행
      setCurrentUser(user);
      localStorage.setItem("clubUser", JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("clubUser");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard currentUser={currentUser} />} />
          <Route
            path="/attendance"
            element={<Attendance currentUser={currentUser} />}
          />
          <Route
            path="/members"
            element={<Members currentUser={currentUser} />}
          />
          <Route
            path="/matches"
            element={<Matches currentUser={currentUser} />}
          />
          <Route
            path="/profile"
            element={
              <Profile currentUser={currentUser} onUpdate={handleLogin} />
            }
          />
          <Route
            path="/owner"
            element={
              currentUser?.isOwner ? (
                <OwnerDashboard currentUser={currentUser} />
              ) : (
                <Navigate
                  to={{ pathname: "/", search: location.search }}
                  replace
                />
              )
            }
          />
          {/* 쿼리스트링(예: ?club=ace-club) 유지를 위해 search도 함께 전달 */}
          <Route
            path="*"
            element={
              <Navigate
                to={{ pathname: "/", search: location.search }}
                replace
              />
            }
          />
        </Routes>
      </Layout>
      <InstallPrompt />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
