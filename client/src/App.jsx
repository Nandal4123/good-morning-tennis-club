import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { clubApi, metricsApi } from "./lib/api";
import { getOrCreateVisitorId, getClubIdentifier } from "./lib/clubContext";

const humanizeClubIdentifier = (identifier) => {
  if (!identifier || identifier === "default") return "Good Morning Club";
  return identifier
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getPageLabel = ({ pathname, hasUser, isOwner, t }) => {
  // 로그인 전
  if (!hasUser) return "로그인";

  // Owner 전용
  if (isOwner && pathname === "/owner") return "Owner";

  switch (pathname) {
    case "/":
      return t("nav.dashboard");
    case "/attendance":
      return t("nav.attendance");
    case "/members":
      return t("nav.members");
    case "/matches":
      return t("nav.matches");
    case "/profile":
      return t("nav.profile");
    default:
      return "";
  }
};

function AppContent() {
  const location = useLocation();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentClubInfo, setCurrentClubInfo] = useState(null);
  const [clubInfoLoading, setClubInfoLoading] = useState(true);

  // URL에 club 파라미터가 있으면 Owner도 해당 클럽 화면을 볼 수 있게 허용
  let clubParam = null;
  try {
    clubParam = new URLSearchParams(location.search).get("club");
  } catch {
    clubParam = null;
  }

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

  // 오늘 접속자 수(고유 방문자) 집계: 클럽별/하루별로 1회만 기록되도록 서버에서 중복 방지
  useEffect(() => {
    // Owner는 운영 화면을 많이 드나들 수 있어 접속자 통계에서 제외
    if (currentUser?.isOwner) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    metricsApi
      .trackVisit({ visitorId, userId: currentUser?.id || null })
      .catch(() => {
        // 통계는 앱 기능에 치명적이지 않으므로 실패해도 무시
      });
    // 클럽 전환 시에도 다시 기록(다른 클럽이면 다른 집계)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, currentUser?.id, currentUser?.isOwner]);

  // 현재 클럽 정보 로드
  useEffect(() => {
    const loadClubInfo = async () => {
      try {
        setClubInfoLoading(true);
        // 탭 제목 플래시 방지: 우선 URL 기반 힌트로 세팅
        const hint = humanizeClubIdentifier(getClubIdentifier());
        if (typeof document !== "undefined" && hint) {
          const page = getPageLabel({
            pathname: location.pathname,
            hasUser: !!currentUser,
            isOwner: !!currentUser?.isOwner,
            t,
          });
          document.title = page ? `${hint} · ${page}` : hint;
        }
        const info = await clubApi.getInfo();
        setCurrentClubInfo(info);
        if (typeof document !== "undefined" && info?.name) {
          const page = getPageLabel({
            pathname: location.pathname,
            hasUser: !!currentUser,
            isOwner: !!currentUser?.isOwner,
            t,
          });
          document.title = page ? `${info.name} · ${page}` : info.name;
        }
        console.log("[App] 클럽 정보 로드 완료:", info.name);
      } catch (error) {
        console.error("Failed to load club info:", error);
        // 기본값 설정하지 않음 (에러 상태 유지)
      } finally {
        setClubInfoLoading(false);
      }
    };
    loadClubInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // 라우트 이동 시에도 탭 제목이 항상 "현재 클럽명"으로 유지되도록 보정
  useEffect(() => {
    const name =
      currentClubInfo?.name || humanizeClubIdentifier(getClubIdentifier());
    const page = getPageLabel({
      pathname: location.pathname,
      hasUser: !!currentUser,
      isOwner: !!currentUser?.isOwner,
      t,
    });
    if (typeof document !== "undefined" && name) {
      document.title = page ? `${name} · ${page}` : name;
    }
  }, [
    location.pathname,
    currentClubInfo?.name,
    currentUser?.isOwner,
    currentUser?.id,
    t,
  ]);

  // URL 파라미터 변경 시 클럽 확인 및 사용자 검증
  useEffect(() => {
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
          <Route
            path="/"
            element={
              // Owner는 기본 진입 시 /owner로 보내되,
              // OwnerDashboard의 "이동/새 탭"은 ?club=... 를 붙여 /에서 클럽 화면을 볼 수 있어야 함
              currentUser?.isOwner && !clubParam ? (
                <Navigate
                  to={{ pathname: "/owner", search: location.search }}
                  replace
                />
              ) : (
                <Dashboard currentUser={currentUser} />
              )
            }
          />
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
