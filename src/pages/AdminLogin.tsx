import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { authenticateAdmin } from "@/lib/adminService";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in (from localStorage)
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      navigate("/admin-dashboard");
    }
  }, [navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setLocalError("");
    
    if (value && !value.includes("@")) {
      setEmailError("Please enter a valid email");
    } else if (value && !value.includes(".")) {
      setEmailError("Email must contain a domain");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setLocalError("");
    
    if (value && value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (emailError || passwordError) {
      setLocalError("Please fix the errors above");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authenticateAdmin(email, password);

      if (result.success && result.admin) {
        // Store admin session
        const adminToken = btoa(
          JSON.stringify({
            id: result.admin.id,
            email: result.admin.email,
            role: result.admin.role,
            timestamp: Date.now(),
          })
        );
        localStorage.setItem("admin_token", adminToken);
        localStorage.setItem("admin_id", result.admin.id);
        localStorage.setItem("admin_email", result.admin.email);

        // Redirect to admin dashboard
        navigate("/admin-dashboard");
      } else {
        setLocalError(result.error || "Authentication failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src={logo} alt="Placement Pilot" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Login</h1>
          </div>
          <p className="text-muted-foreground text-sm">Secure administration portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                emailError
                  ? "border-destructive focus:ring-destructive/50 bg-destructive/5"
                  : "border-border focus:ring-primary/50 bg-card"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="admin@nitkkr.ac.in"
            />
            {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  passwordError
                    ? "border-destructive focus:ring-destructive/50 bg-destructive/5"
                    : "border-border focus:ring-primary/50 bg-card"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-destructive">{passwordError}</p>}
          </div>

          {localError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{localError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Not an admin?{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
