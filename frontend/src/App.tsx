import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/medicine" element={<MedicinePage />} />
        <Route path="/medicine/:id" element={<MedicineDetailsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;