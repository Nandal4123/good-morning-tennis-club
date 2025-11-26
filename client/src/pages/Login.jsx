import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, User, UserPlus, LogIn } from "lucide-react";
import { userApi } from "../lib/api";

function Login({ onLogin }) {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER",
    tennisLevel: "BEGINNER",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
      // 사용자가 없으면 회원가입 탭으로
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

  const handleSelectUser = (user) => {
    i18n.changeLanguage(user.languagePref || "en");
    onLogin(user);
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

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ko" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 court-pattern opacity-30" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-tennis-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tennis-500/10 rounded-full blur-3xl" />

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300"
      >
        {i18n.language === "en" ? "🇰🇷 한국어" : "🇺🇸 English"}
      </button>

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
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("profile.level")}
                  </label>
                  <select
                    value={newUser.tennisLevel}
                    onChange={(e) =>
                      setNewUser({ ...newUser, tennisLevel: e.target.value })
                    }
                    className="input"
                  >
                    <option value="BEGINNER">
                      {t("members.level.beginner")}
                    </option>
                    <option value="INTERMEDIATE">
                      {t("members.level.intermediate")}
                    </option>
                    <option value="ADVANCED">
                      {t("members.level.advanced")}
                    </option>
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
                {t("login.selectUser")}
              </h2>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">{t("login.noUsers")}</p>
                  <button
                    onClick={() => setActiveTab("register")}
                    className="btn-primary"
                  >
                    {t("login.registerFirst")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:border-tennis-500/50 hover:bg-tennis-500/10 transition-all duration-300 text-left group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all duration-300 ${
                          user.role === "ADMIN"
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 group-hover:from-orange-400 group-hover:to-orange-500"
                            : "bg-gradient-to-br from-slate-600 to-slate-700 group-hover:from-tennis-600 group-hover:to-tennis-700"
                        }`}
                      >
                        {user.role === "ADMIN" ? (
                          <Shield size={24} />
                        ) : (
                          user.name?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {user.name}
                          </p>
                          {user.role === "ADMIN" && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {t("login.roleAdmin")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.tennisLevel === "BEGINNER"
                            ? "bg-green-500/20 text-green-400"
                            : user.tennisLevel === "INTERMEDIATE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {t(`members.level.${user.tennisLevel?.toLowerCase()}`)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {t("app.subtitle")}
        </p>
      </div>
    </div>
  );
}

export default Login;
