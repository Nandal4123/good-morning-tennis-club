import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Members from "./pages/Members";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import InstallPrompt from "./components/InstallPrompt";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("clubUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("clubUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("clubUser");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tennis-500 tennis-ball" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <InstallPrompt />
    </>
  );
}

export default App;
