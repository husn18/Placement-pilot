import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users, BarChart3, Shield, Building2, CheckCircle2 } from "lucide-react";
import { getAdminProfile, getAdminStats } from "@/lib/adminService";
import type { AdminUser } from "@/lib/adminService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    users: 0,
    companies: 0,
    experiences: 0,
  });

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminToken = localStorage.getItem("admin_token");
        const adminId = localStorage.getItem("admin_id");

        if (!adminToken || !adminId) {
          navigate("/admin-login");
          return;
        }

        // Fetch admin profile
        const adminProfile = await getAdminProfile(adminId);
        if (adminProfile) {
          setAdmin(adminProfile);
        } else {
          setError("Failed to load admin profile");
        }

        // Fetch stats
        const adminStats = await getAdminStats();
        setStats(adminStats);
      } catch (err) {
        console.error("Error checking admin auth:", err);
        setError("Authentication check failed");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_email");
    navigate("/admin-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || "Failed to load admin dashboard"}
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{admin.full_name}</p>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {admin.full_name}
          </h2>
          <p className="text-muted-foreground">
            Manage your Placement Pilot platform from here
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.users}</p>
            <p className="text-xs text-muted-foreground mt-2">Registered users on platform</p>
          </div>

          <div className="glass-card p-6 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition" onClick={() => navigate("/admin-companies")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Companies</h3>
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.companies}</p>
            <p className="text-xs text-muted-foreground mt-2">Click to manage companies</p>
          </div>

          <div className="glass-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Experiences</h3>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.experiences}</p>
            <p className="text-xs text-muted-foreground mt-2">Interview experiences posted</p>
          </div>
        </div>

        {/* Admin Settings Section */}
        <div className="glass-card p-6 rounded-lg border border-border mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Admin Profile</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Email</p>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Full Name</p>
              <p className="text-sm text-muted-foreground">{admin.full_name || "Not set"}</p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Role</p>
              <p className="text-sm text-muted-foreground capitalize">{admin.role}</p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Status</p>
              <p className="text-sm text-green-600 font-medium">
                {admin.is_active ? "✓ Active" : "✗ Inactive"}
              </p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {new Date(admin.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-1">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {new Date(admin.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Management Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Management Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Company Management Card */}
            <div
              onClick={() => navigate("/admin-companies")}
              className="glass-card p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition transform hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Company Management</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, and manage company details, eligibility criteria, and requirements.
              </p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                Manage Companies
                <span className="text-lg">→</span>
              </div>
            </div>

            {/* Experience Verification Card */}
            <div
              onClick={() => navigate("/admin-experiences")}
              className="glass-card p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition transform hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Experience Verification</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Review and verify user-posted interview experiences before publishing.
              </p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                Verify Experiences
                <span className="text-lg">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Coming Soon */}
        <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="font-semibold text-foreground mb-3">🚀 Upcoming Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Analytics & Reports</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Admin Activity Logs</li>
                <li>✓ System Settings</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
