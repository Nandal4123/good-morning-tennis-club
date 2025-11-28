import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  User,
  UserPlus,
  LogIn,
  Lock,
  X,
  HelpCircle,
  Search,
} from "lucide-react";
import { userApi } from "../lib/api";

// 관리자 암호 (실제 운영시 환경변수로 관리 권장)
const ADMIN_PASSWORD = "admin0405";

// NTRP 등급 목록
const NTRP_LEVELS = [
  "NTRP_2_0",
  "NTRP_2_5",
  "NTRP_3_0",
  "NTRP_3_5",
  "NTRP_4_0",
  "NTRP_4_5",
  "NTRP_5_0",
];

function Login({ onLogin }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showNtrpGuide, setShowNtrpGuide] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER",
    tennisLevel: "NTRP_3_0",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
      if (data.length === 0) {
        setActiveTab("register");
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setActiveTab("register");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);

    try {
      // 이름으로 회원 찾기
      const foundUser = users.find(
        (user) => user.name.toLowerCase() === loginName.toLowerCase().trim()
      );

      if (!foundUser) {
        setLoginError("등록되지 않은 이름입니다. 회원가입을 먼저 해주세요.");
        setLoggingIn(false);
        return;
      }

      // 관리자인 경우 비밀번호 확인
      if (foundUser.role === "ADMIN") {
        setSelectedAdminUser(foundUser);
        setShowAdminModal(true);
        setAdminPassword("");
        setPasswordError(false);
      } else {
        onLogin(foundUser);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      onLogin(selectedAdminUser);
      setShowAdminModal(false);
      setSelectedAdminUser(null);
      setAdminPassword("");
      setLoginName("");
    } else {
      setPasswordError(true);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const user = await userApi.create(newUser);
      onLogin(user);
    } catch (error) {
      console.error("Failed to create user:", error);
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 court-pattern opacity-30" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-tennis-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tennis-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-tennis-400 to-tennis-600 flex items-center justify-center shadow-xl shadow-tennis-500/25 tennis-ball">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display">
            {t("app.title")}
          </h1>
          <p className="text-slate-400 mt-2">{t("login.subtitle")}</p>
        </div>

        <div className="card glass">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-tennis-500 text-white shadow-lg shadow-tennis-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn size={18} />
              {t("login.loginTab")}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "register"
                  ? "bg-tennis-500 text-white shadow-lg shadow-tennis-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus size={18} />
              {t("login.registerTab")}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto border-2 border-tennis-500/30 border-t-tennis-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400">{t("common.loading")}</p>
            </div>
          ) : activeTab === "register" ? (
            <>
              <h2 className="text-xl font-bold text-white mb-6">
                {t("login.newUser")}
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("login.name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="input"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("login.email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="input"
                    placeholder="example@email.com"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("login.memberType")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: "USER" })}
                      className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                        newUser.role === "USER"
                          ? "bg-tennis-500/20 border-tennis-500/50 text-tennis-400"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <User size={24} />
                      <span className="text-sm font-medium">
                        {t("login.roleUser")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: "ADMIN" })}
                      className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                        newUser.role === "ADMIN"
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <Shield size={24} />
                      <span className="text-sm font-medium">
                        {t("login.roleAdmin")}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400">
                      {t("profile.level")} (NTRP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNtrpGuide(true)}
                      className="flex items-center gap-1 text-xs text-tennis-400 hover:text-tennis-300 transition-colors"
                    >
                      <HelpCircle size={14} />
                      {t("members.ntrpGuide")}
                    </button>
                  </div>
                  <select
                    value={newUser.tennisLevel}
                    onChange={(e) =>
                      setNewUser({ ...newUser, tennisLevel: e.target.value })
                    }
                    className="input"
                  >
                    {NTRP_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        NTRP {t(`members.level.${level.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full mt-6"
                >
                  {creating ? t("common.loading") : t("login.create")}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-6">
                이름으로 로그인
              </h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("login.name")}
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />
                    <input
                      type="text"
                      required
                      value={loginName}
                      onChange={(e) => {
                        setLoginName(e.target.value);
                        setLoginError("");
                      }}
                      className="input pl-12"
                      placeholder="이름을 입력하세요"
                      autoFocus
                    />
                  </div>
                  {loginError && (
                    <p className="text-red-400 text-sm mt-2">{loginError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loggingIn || !loginName.trim()}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                  {loggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      {t("login.loginTab")}
                    </>
                  )}
                </button>

                <p className="text-center text-slate-500 text-sm mt-4">
                  회원이 아니신가요?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="text-tennis-400 hover:text-tennis-300 font-medium"
                  >
                    회원가입
                  </button>
                </p>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {t("app.subtitle")}
        </p>
      </div>

      {/* NTRP Guide Modal */}
      {showNtrpGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎾 {t("members.ntrpGuide")}
              </h2>
              <button
                onClick={() => setShowNtrpGuide(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {NTRP_LEVELS.map((level) => {
                const displayLevel = level
                  .replace("NTRP_", "")
                  .replace("_", ".");
                return (
                  <div
                    key={level}
                    className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-tennis-500/20 text-tennis-400 border border-tennis-500/30">
                        {displayLevel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {t(`members.ntrpDescription.${level.toLowerCase()}`)}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowNtrpGuide(false)}
              className="btn-primary w-full mt-6"
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="text-orange-400" size={24} />
                {t("login.adminPassword")}
              </h2>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setSelectedAdminUser(null);
                  setAdminPassword("");
                  setPasswordError(false);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Shield size={32} className="text-white" />
              </div>
              <p className="text-white font-medium">
                {selectedAdminUser?.name}
              </p>
              <p className="text-sm text-slate-400">{t("login.roleAdmin")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("login.password")}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                  className={`input ${passwordError ? "border-red-500" : ""}`}
                  placeholder="••••••••"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-sm mt-2">
                    {t("login.wrongPassword")}
                  </p>
                )}
              </div>

              <button onClick={handleAdminLogin} className="btn-primary w-full">
                {t("login.loginTab")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
