import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import FamilyPage from "./pages/FamilyPage";
import StatisticsPage from "./pages/StatisticsPage";
import MedicinePage from "./pages/MedicinePage";
import MedicineDetailsPage from "./pages/MedicineDetailsPage";
import CoursesPage from "./pages/CoursesPage";

function hasActiveSession() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function GuestRoutes() {
  return hasActiveSession() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AccountRoutes() {
  return hasActiveSession() ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoutes />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<AccountRoutes />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/medicine" element={<MedicinePage />} />
          <Route path="/medicine/:id" element={<MedicineDetailsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
