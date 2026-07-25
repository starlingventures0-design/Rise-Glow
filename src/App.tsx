import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import MessagesListPage from "./pages/MessagesListPage";
import ChatPage from "./pages/ChatPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RaniaRecipesPage from "./pages/RaniaRecipesPage";
import BottomNav from "./components/BottomNav";

const PAGES_WITH_NAV = ["/home", "/community", "/messages", "/leaderboard", "/profile"];

function Layout() {
  const location = useLocation();
  const showNav = PAGES_WITH_NAV.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/messages" element={<MessagesListPage />} />
        <Route path="/chat/:girlId" element={<ChatPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/recipes" element={<RaniaRecipesPage />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
  }
