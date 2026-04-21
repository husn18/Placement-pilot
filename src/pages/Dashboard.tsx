import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { User, FileText, Target, Settings, ArrowRight, History, Trash2, AlertCircle } from "lucide-react";
import { getUserExperiences, Experience, deleteExperiencePost } from "@/lib/experienceService";
import { getUserEligibilityHistory, EligibilityCheckResult } from "@/lib/historyService";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const [userExperiences, setUserExperiences] = useState<Experience[]>([]);
  const [eligibilityHistory, setEligibilityHistory] = useState<EligibilityCheckResult[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        setLoadingExperiences(true);
        setLoadingHistory(true);
        
        const experiences = await getUserExperiences(user.id);
        setUserExperiences(experiences);
        setLoadingExperiences(false);

        const history = await getUserEligibilityHistory(user.id);
        setEligibilityHistory(history);
        setLoadingHistory(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleDeleteExperience = async (experienceId: string, companyName: string) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteExperiencePost(experienceId);

      // Remove from local state
      setUserExperiences(prev => prev.filter(exp => exp.id !== experienceId));
      setDeleteConfirm(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete experience";
      setDeleteError(errorMsg);
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "CGPA",
              value: user.cgpa ? user.cgpa.toString() : "N/A",
              icon: Target,
            },
            { label: "Branch", value: user.branch || "N/A", icon: User },
            {
              label: "Experiences",
              value: userExperiences.length.toString(),
              icon: FileText,
            },
            {
              label: "Grad Year",
              value: user.graduation_year ? user.graduation_year.toString() : "N/A",
              icon: Settings,
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="font-display text-lg font-semibold text-foreground">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Experiences */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                My Experiences
              </h2>
              <Link
                to="/post-experience"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Post New <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loadingExperiences ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : userExperiences.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No interview experiences posted yet</p>
                <Link
                  to="/post-experience"
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Share your first experience
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {deleteError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {deleteError}
                  </div>
                )}
                {userExperiences.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 hover:bg-secondary/70 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {exp.company}
                      </div>
                      <div className="text-xs text-muted-foreground">{exp.role}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {exp.verified && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-600">
                          ✓
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          exp.difficulty === "Hard"
                            ? "bg-destructive/10 text-destructive"
                            : exp.difficulty === "Medium"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {exp.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </span>
                      {!exp.verified && (
                        <span className="text-xs text-yellow-600 italic">pending</span>
                      )}
                      {deleteConfirm === exp.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteExperience(exp.id, exp.company)}
                            disabled={isDeleting}
                            className="text-xs font-medium px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isDeleting}
                            className="text-xs font-medium px-2 py-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(exp.id)}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors p-1 rounded hover:bg-destructive/10"
                          title="Delete this experience"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Info Card */}
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">
              Profile
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </div>
                <p className="text-foreground break-all">{user.email}</p>
              </div>
              {user.branch && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Branch
                  </div>
                  <p className="text-foreground">{user.branch}</p>
                </div>
              )}
              {user.graduation_year && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Graduation Year
                  </div>
                  <p className="text-foreground">{user.graduation_year}</p>
                </div>
              )}
              {user.cgpa && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    CGPA
                  </div>
                  <p className="text-foreground">{user.cgpa}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Your Eligibility Checks History
          </h2>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : eligibilityHistory.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No eligibility checks yet</p>
              <Link
                to="/eligibility"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                Run your first eligibility check
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {eligibilityHistory.slice(0, 5).map((check) => (
                <div
                  key={check.id}
                  className="glass-card p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {check.branch} Branch • CGPA {check.cgpa}
                        </span>
                        {check.skills && check.skills.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                            {check.skills.length} skills
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(check.created_at).toLocaleDateString()} at{" "}
                        {new Date(check.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Link
                      to={`/eligibility?checkId=${check.id}`}
                      className="text-primary hover:underline text-xs font-medium flex items-center gap-1"
                    >
                      View Results <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
              {eligibilityHistory.length > 5 && (
                <Link
                  to="/eligibility"
                  className="text-xs text-primary hover:underline mt-2"
                >
                  View all checks →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link
            to="/eligibility"
            className="glass-card p-5 hover:border-primary/30 transition-colors group"
          >
            <Target className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-display font-semibold text-foreground text-sm">
              Check Eligibility
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Find companies matching your profile
            </p>
          </Link>
          <Link
            to="/companies"
            className="glass-card p-5 hover:border-primary/30 transition-colors group"
          >
            <FileText className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-display font-semibold text-foreground text-sm">
              Browse Companies
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Explore interview patterns
            </p>
          </Link>
          <Link
            to="/post-experience"
            className="glass-card p-5 hover:border-primary/30 transition-colors group"
          >
            <User className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-display font-semibold text-foreground text-sm">
              Share Experience
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Help others prepare better
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
