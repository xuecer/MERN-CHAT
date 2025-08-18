import Navbar from "./components/Navbar";
// @ts-ignore - 忽略类型检查
import PerformancePanel from "./components/PerformancePanel";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
// @ts-ignore - 忽略类型检查
import { usePerformanceStore } from "./store/usePerformanceStore";
// @ts-ignore - 忽略类型检查
import { setupAxiosInterceptors } from "./lib/axiosInterceptor";

import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  // @ts-ignore - 忽略类型检查
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  // @ts-ignore - 忽略类型检查
  const { theme } = useThemeStore();
  // @ts-ignore - 忽略类型检查
  const { startMonitoring } = usePerformanceStore();

  //checkAuth 是一个**"自动"发生的过程，它与应用的生命周期**绑定。
  useEffect(() => {
    checkAuth();

    // 初始化性能监控
    startMonitoring();

    // 设置API拦截器
    setupAxiosInterceptors();
  }, [checkAuth, startMonitoring]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      {/* 性能监控面板 */}
      <PerformancePanel />

      <Toaster />
    </div>
  );
};
export default App;
