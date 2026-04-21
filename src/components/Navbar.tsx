import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { LogOut, MessageCircle, Menu, X, Home, Building2, Target, BookOpen } from "lucide-react";

const navLinks = [
  { label: "Feed", path: "/home", icon: Home },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Eligibility", path: "/eligibility", icon: Target },
  { label: "Experiences", path: "/experiences", icon: BookOpen },
  { label: "PrepTalk", path: "/preptalk", icon: MessageCircle },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isLanding = location.pathname === "/";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Placement Pilot" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg font-bold text-foreground hidden sm:inline">
              Placement <span className="text-primary">Pilot</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated && navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
                >
                  {user?.name || user?.email}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu - Slides from Left */}
      {isAuthenticated && (
        <>
          {/* Backdrop */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Slide Menu */}
          <div
            className={`fixed left-0 top-16 bottom-0 z-40 w-64 bg-gradient-to-b from-card to-background border-r border-border md:hidden transition-all duration-300 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* User Profile Section */}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-6 border-b border-border hover:bg-primary/5 transition-colors duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-bold text-primary">
                      {(user?.name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">View Dashboard</p>
                  </div>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        location.pathname === link.path
                          ? "bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-primary border border-blue-400/30 shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="border-t border-border p-4">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
