import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAddCompany from "./pages/AdminAddCompany";
import AdminExperienceVerification from "./pages/AdminExperienceVerification";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import EligibilityChecker from "./pages/EligibilityChecker";
import Experiences from "./pages/Experiences";
import PostExperience from "./pages/PostExperience";
import PrepTalk from "./pages/PrepTalk";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-companies" element={<AdminAddCompany />} />
            <Route path="/admin-experiences" element={<AdminExperienceVerification />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/companies" element={<ProtectedRoute element={<Companies />} />} />
            <Route path="/eligibility" element={<ProtectedRoute element={<EligibilityChecker />} />} />
            <Route path="/experiences" element={<ProtectedRoute element={<Experiences />} />} />
            <Route path="/post-experience" element={<ProtectedRoute element={<PostExperience />} />} />
            <Route path="/preptalk" element={<ProtectedRoute element={<PrepTalk />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
