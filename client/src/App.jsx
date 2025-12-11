// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ExamPortal from "./pages/ExamPortal";
import AdminDashboard from "./pages/AdminDashboard";
import ParticleBackground from "./components/ParticleBackground"; // 1. Import it

function App() {
  return (
    <BrowserRouter>
      {/* 2. Add it here so it sits behind everything */}
      <ParticleBackground />
      
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/exam" element={<ExamPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;